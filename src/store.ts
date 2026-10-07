import { create } from 'zustand';
import { track } from './analytics';
import { DRIVER, REVIEWS, REVIVORS, SEED_CONVERSATIONS, SEED_JOBS, SERVICES } from './data/mock';
import type { MyRevivor, SubmissionStatus } from './lib/verification';
import type {
  Conversation,
  Job,
  Listing,
  Message,
  Review,
  Revivor,
  Role,
  ServiceId,
  Verification,
} from './data/types';

// ---------- Trust rules (mirror these in Supabase RLS later) ----------

/** Every Revivor needs both: a government ID matched to a selfie, and at least one ASE certification. */
export const REQUIRED_CHECKS = ['id', 'ase'] as const;

const hasVerified = (r: Pick<Revivor, 'verifications'>, t: Verification['type']) =>
  r.verifications.some((v) => v.type === t && v.status === 'verified');

/** Required checks the REVO team has not verified yet. */
export const missingChecks = (r: Pick<Revivor, 'verifications'>) => REQUIRED_CHECKS.filter((t) => !hasVerified(r, t));

/** Verified comes only from REVO-team verification records, never from anything a Revivor types. */
export const isVerified = (r: Pick<Revivor, 'verifications'>) => missingChecks(r).length === 0;

/** Unverified Revivors never appear in search and cannot be messaged. */
export const isSearchable = (r: Revivor) => isVerified(r);

export function ratingOf(reviews: Review[], revivorId: string) {
  const mine = reviews.filter((r) => r.revivorId === revivorId);
  if (!mine.length) return { avg: 0, count: 0 };
  return { avg: mine.reduce((s, r) => s + r.rating, 0) / mine.length, count: mine.length };
}

export const ME_ID = 'me';

/** Jobs where this role has something to do: confirm the other side's mark, or (driver) leave a review. */
export function needsAction(j: Job, role: Role) {
  const mine = role === 'driver' ? j.revivorId !== ME_ID : j.revivorId === ME_ID;
  if (!mine) return false;
  if (j.status === 'awaiting_confirmation') return j.proposedBy !== role;
  return role === 'driver' && !j.reviewed;
}

/** Display order for verification checks. */
export const CHECK_ORDER = ['id', 'ase', 'phone'] as const;
export const sortChecks = (vs: Verification[]) => [...vs].sort((a, b) => CHECK_ORDER.indexOf(a.type) - CHECK_ORDER.indexOf(b.type));

export const convsFor = (cs: Conversation[], role: Role) =>
  cs.filter((c) => (role === 'driver' ? c.revivorId !== ME_ID : c.revivorId === ME_ID));

let seq = 100;
const uid = (p: string) => `${p}-${++seq}`;
const now = () => new Date().toISOString();
const today = () => new Date().toISOString().slice(0, 10);

export interface RevivorDraft {
  name: string;
  bio: string;
  yearsExperience: number;
  area: string;
  radiusMiles: number;
  services: ServiceId[];
  photoUri?: string;
}

export interface EvidenceDraft {
  idUploaded: boolean;
  aseCertificates: { name: string; fileName: string }[];
  workPhotos: string[]; // local uris
  introVideo: boolean;
}

interface State {
  signedIn: boolean;
  role: Role;
  phone: string | null; // E.164, typed at sign-in. Not confirmed until real SMS login exists.

  revivors: Revivor[];
  reviews: Review[];
  jobs: Job[];
  conversations: Conversation[];
  selectedService: ServiceId | null;
  meOnboarded: boolean;
  meSubmitted: boolean;
  autoReplied: Record<string, boolean>;

  signIn: (role: Role, phone?: string) => void;
  signOut: () => void;
  setRole: (role: Role) => void;
  setSelectedService: (s: ServiceId | null) => void;

  startConversation: (revivorId: string) => string;
  sendMessage: (conversationId: string, from: Role, text: string) => void;
  markRead: (conversationId: string) => void;
  sharePhone: (conversationId: string, by: Role) => void;
  blockConversation: (conversationId: string) => void;
  report: (conversationId: string, reason: string) => void;

  markJob: (conversationId: string, by: Role, service: ServiceId, date: string) => void;
  confirmJob: (jobId: string, by: Role) => void;
  submitReview: (jobId: string, rating: number, tags: string[], text: string) => void;

  createRevivorProfile: (d: RevivorDraft) => void;
  submitEvidence: (e: EvidenceDraft) => void;
  applyReview: (review: SubmissionStatus) => void;
  hydrateMe: (remote: MyRevivor) => void;
  addListing: (l: Omit<Listing, 'id'>) => void;
  removeListing: (id: string) => void;
}

const later = (ms: number, fn: () => void) => setTimeout(fn, ms);

export const useStore = create<State>((set, get) => ({
  signedIn: false,
  role: 'driver',
  phone: null,
  revivors: REVIVORS,
  reviews: REVIEWS,
  jobs: SEED_JOBS,
  conversations: SEED_CONVERSATIONS,
  selectedService: 'oil',
  meOnboarded: false,
  meSubmitted: false,
  autoReplied: {},

  signIn: (role, phone) => set({ signedIn: true, role, phone: phone ?? null }),
  // Also forget my Revivor profile, so the next person who signs in on this device doesn't inherit it.
  signOut: () =>
    set((s) => ({
      signedIn: false,
      phone: null,
      meOnboarded: false,
      meSubmitted: false,
      revivors: s.revivors.filter((r) => r.id !== ME_ID),
      conversations: s.conversations.filter((c) => c.revivorId !== ME_ID),
    })),
  setRole: (role) => set({ role }),
  setSelectedService: (selectedService) => set({ selectedService }),

  startConversation: (revivorId) => {
    const r = get().revivors.find((x) => x.id === revivorId);
    if (!r || !isSearchable(r)) throw new Error('Cannot message an unverified Revivor');
    const existing = get().conversations.find((c) => c.revivorId === revivorId && c.driverName === DRIVER.name);
    if (existing) return existing.id;
    const c: Conversation = {
      id: uid('c'),
      revivorId,
      driverName: DRIVER.name,
      driverVehicle: DRIVER.vehicle,
      messages: [],
      unread: 0,
      phoneShared: { driver: false, revivor: false },
      blocked: false,
    };
    set((s) => ({ conversations: [c, ...s.conversations] }));
    track('message_started', { revivorId });
    return c.id;
  },

  sendMessage: (conversationId, from, text) => {
    const msg: Message = { id: uid('m'), kind: 'text', from, text, at: now() };
    set((s) => ({
      conversations: s.conversations.map((c) => (c.id === conversationId ? { ...c, messages: [...c.messages, msg] } : c)),
    }));
    track('message_sent', { conversationId, from });

    // DEMO ONLY: simulate the other side replying once in a brand-new chat.
    const conv = get().conversations.find((c) => c.id === conversationId);
    if (!conv || get().autoReplied[conversationId]) return;
    const otherHasSpoken = conv.messages.some((m) => m.kind === 'text' && m.from !== from);
    if (otherHasSpoken) return;
    set((s) => ({ autoReplied: { ...s.autoReplied, [conversationId]: true } }));
    later(1600, () => {
      const r = get().revivors.find((x) => x.id === conv.revivorId);
      const reply: Message =
        from === 'driver'
          ? { id: uid('m'), kind: 'text', from: 'revivor', text: `Hey ${DRIVER.firstName}! Happy to help. What's going on with the car, and when works for you?`, at: now() }
          : { id: uid('m'), kind: 'text', from: 'driver', text: `Thanks ${r?.name.split(' ')[0] ?? ''}! Saturday morning works for me.`, at: now() };
      set((s) => ({
        conversations: s.conversations.map((c) => (c.id === conversationId ? { ...c, messages: [...c.messages, reply] } : c)),
      }));
    });
  },

  markRead: (conversationId) =>
    set((s) => ({ conversations: s.conversations.map((c) => (c.id === conversationId ? { ...c, unread: 0 } : c)) })),

  sharePhone: (conversationId, by) => {
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c.id === conversationId ? { ...c, phoneShared: { ...c.phoneShared, [by]: true } } : c,
      ),
    }));
    track('phone_shared', { conversationId, by });
  },

  blockConversation: (conversationId) => {
    set((s) => ({ conversations: s.conversations.map((c) => (c.id === conversationId ? { ...c, blocked: true } : c)) }));
    track('user_blocked', { conversationId });
  },

  report: (conversationId, reason) => track('user_reported', { conversationId, reason }),

  markJob: (conversationId, by, service, date) => {
    const conv = get().conversations.find((c) => c.id === conversationId);
    if (!conv) return;
    const job: Job = {
      id: uid('job'),
      conversationId,
      revivorId: conv.revivorId,
      driverName: conv.driverName,
      service,
      vehicle: conv.driverVehicle,
      date,
      status: 'awaiting_confirmation',
      proposedBy: by,
      reviewed: false,
    };
    const r = get().revivors.find((x) => x.id === conv.revivorId);
    const who = by === 'driver' ? conv.driverName.split(' ')[0] : r?.name.split(' ')[0];
    const sys: Message = {
      id: uid('m'),
      kind: 'system',
      text: `${who} marked a job: ${SERVICES[service].short} on ${job.vehicle}, ${fmtDate(date)}.`,
      at: now(),
      jobId: job.id,
    };
    set((s) => ({
      jobs: [job, ...s.jobs],
      conversations: s.conversations.map((c) => (c.id === conversationId ? { ...c, messages: [...c.messages, sys] } : c)),
    }));
    track('job_marked', { jobId: job.id, by, service });

    // DEMO ONLY: the other side confirms after a moment.
    later(2200, () => get().confirmJob(job.id, by === 'driver' ? 'revivor' : 'driver'));
  },

  confirmJob: (jobId, by) => {
    const job = get().jobs.find((j) => j.id === jobId);
    if (!job || job.status === 'confirmed' || job.proposedBy === by) return;
    const sys: Message = {
      id: uid('m'),
      kind: 'system',
      text: `Job confirmed by both of you: ${SERVICES[job.service].short}, ${fmtDate(job.date)}.`,
      at: now(),
      jobId,
    };
    set((s) => ({
      jobs: s.jobs.map((j) => (j.id === jobId ? { ...j, status: 'confirmed' } : j)),
      revivors: s.revivors.map((r) => (r.id === job.revivorId ? { ...r, confirmedJobs: r.confirmedJobs + 1 } : r)),
      conversations: s.conversations.map((c) =>
        c.id === job.conversationId ? { ...c, messages: [...c.messages, sys] } : c,
      ),
    }));
    track('job_confirmed', { jobId, by });
  },

  submitReview: (jobId, rating, tags, text) => {
    const job = get().jobs.find((j) => j.id === jobId);
    // A review requires a job both sides confirmed, and only one review per job.
    if (!job || job.status !== 'confirmed' || job.reviewed) return;
    const review: Review = {
      id: uid('r'),
      jobId,
      revivorId: job.revivorId,
      authorName: `${DRIVER.firstName} T.`,
      rating,
      tags,
      text,
      service: job.service,
      vehicle: job.vehicle,
      date: today(),
    };
    set((s) => ({
      reviews: [review, ...s.reviews],
      jobs: s.jobs.map((j) => (j.id === jobId ? { ...j, reviewed: true } : j)),
    }));
    track('review_submitted', { jobId, rating });
  },

  createRevivorProfile: (d) => {
    const me: Revivor = {
      id: ME_ID,
      name: d.name,
      initials: d.name
        .split(' ')
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase(),
      avatarTone: '#861A13',
      photoUri: d.photoUri,
      bio: d.bio,
      yearsExperience: d.yearsExperience,
      area: d.area,
      radiusMiles: d.radiusMiles,
      distanceMiles: 0,
      memberSince: today(),
      verifications: [
        { type: 'phone', status: 'verified', label: 'Phone number confirmed', verifiedAt: today(), verifiedBy: 'REVO team' },
        { type: 'id', status: 'not_started', label: 'Government ID not uploaded' },
        { type: 'ase', status: 'not_started', label: 'No ASE certificate uploaded' },
      ],
      listings: [],
      workPhotos: [],
      hasIntroVideo: false,
      confirmedJobs: 0,
      avgReplyMins: 0,
      availability: 'flexible',
    };
    set((s) => ({ revivors: [...s.revivors.filter((r) => r.id !== ME_ID), me], meOnboarded: true }));
    // Pre-fill listings for the services they picked so they only need to set prices.
    d.services.forEach((service) => get().addListing({ service, priceMin: 0, priceMax: 0 }));
  },

  submitEvidence: (e) => {
    set((s) => ({
      meSubmitted: true,
      revivors: s.revivors.map((r) =>
        r.id !== ME_ID
          ? r
          : {
              ...r,
              hasIntroVideo: e.introVideo,
              workPhotos: e.workPhotos.map((uri, i) => ({ id: `wp${i}`, caption: `Work photo ${i + 1}`, service: 'oil', uri })),
              verifications: [
                ...r.verifications.filter((v) => v.type === 'phone'),
                e.idUploaded
                  ? { type: 'id', status: 'in_review', label: 'Government ID in review' }
                  : { type: 'id', status: 'not_started', label: 'Government ID not uploaded' },
                ...(e.aseCertificates.length
                  ? e.aseCertificates.map(
                      (c): Verification => ({ type: 'ase', status: 'in_review', label: `${c.name} in review`, documentName: c.fileName }),
                    )
                  : [{ type: 'ase', status: 'not_started', label: 'No ASE certificate uploaded' } as Verification]),
              ],
            },
      ),
    }));
    track('revivor_onboarding_submitted', { aseCerts: e.aseCertificates.length, photos: e.workPhotos.length });
  },

  // Applies the REVO team's decision from Supabase (verification_submissions) to my local profile.
  applyReview: ({ idStatus, aseStatus, reviewedAt }) => {
    const d = reviewedAt?.slice(0, 10) ?? today();
    const resolve = (vs: Verification[], type: 'id' | 'ase', st: SubmissionStatus['idStatus']): Verification[] => {
      if (st === 'rejected') {
        const label = type === 'id' ? 'Government ID not accepted. Upload it again.' : 'ASE certificate not accepted. Upload it again.';
        return [{ type, status: 'not_started', label }];
      }
      if (st !== 'verified') return vs;
      return vs.map((v) =>
        v.status === 'verified'
          ? v
          : { ...v, status: 'verified', verifiedAt: d, verifiedBy: 'REVO team', label: v.label.replace(/ in review$/, '').replace('Government ID', 'Government ID matched to selfie') },
      );
    };
    set((s) => ({
      meSubmitted: idStatus !== 'rejected' && aseStatus !== 'rejected',
      revivors: s.revivors.map((r) =>
        r.id !== ME_ID
          ? r
          : {
              ...r,
              verifications: [
                ...r.verifications.filter((v) => v.type === 'phone'),
                ...resolve(r.verifications.filter((v) => v.type === 'id'), 'id', idStatus),
                ...resolve(r.verifications.filter((v) => v.type === 'ase'), 'ase', aseStatus),
              ],
            },
      ),
    }));
    const me = get().revivors.find((r) => r.id === ME_ID);
    if (!me || !isVerified(me)) return;
    // DEMO ONLY: a first driver message so the newly verified Revivor has something in Messages.
    if (!get().conversations.some((c) => c.revivorId === ME_ID)) {
      const c: Conversation = {
        id: 'c-me-1',
        revivorId: ME_ID,
        driverName: 'Jordan P.',
        driverVehicle: '2016 Mazda3',
        unread: 1,
        phoneShared: { driver: false, revivor: false },
        blocked: false,
        messages: [
          { id: uid('m'), kind: 'text', from: 'driver', text: 'Hi! Saw your profile. My brakes are squeaking on a 2016 Mazda3. Could you take a look this weekend?', at: now() },
        ],
      };
      set((s) => ({ conversations: [c, ...s.conversations] }));
    }
  },

  // Rebuilds my Revivor from Supabase after sign-in, then applies the REVO team's decision.
  hydrateMe: ({ profile, listings, submission }) => {
    const existing = get().revivors.find((r) => r.id === ME_ID);
    const verifications: Verification[] = [
      { type: 'phone', status: 'verified', label: 'Phone number confirmed', verifiedAt: profile.createdAt.slice(0, 10), verifiedBy: 'REVO team' },
      submission
        ? { type: 'id', status: 'in_review', label: 'Government ID in review' }
        : { type: 'id', status: 'not_started', label: 'Government ID not uploaded' },
      ...(submission?.aseNames.length
        ? submission.aseNames.map((name): Verification => ({ type: 'ase', status: 'in_review', label: `${name} in review` }))
        : [{ type: 'ase', status: 'not_started', label: 'No ASE certificate uploaded' } as Verification]),
    ];
    const me: Revivor = {
      id: ME_ID,
      name: profile.displayName,
      initials: profile.displayName
        .split(' ')
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase(),
      avatarTone: '#861A13',
      photoUri: profile.photoUrl ?? undefined,
      bio: profile.bio,
      yearsExperience: profile.yearsExperience,
      area: profile.area,
      radiusMiles: profile.radiusMiles,
      distanceMiles: 0,
      memberSince: profile.createdAt.slice(0, 10),
      verifications,
      listings: listings
        .filter((l): l is typeof l & { service: ServiceId } => l.service in SERVICES)
        .map((l) => ({ id: uid('l'), service: l.service, priceMin: l.priceMin, priceMax: l.priceMax, note: l.note ?? undefined })),
      workPhotos: Array.from({ length: submission?.workPhotoCount ?? 0 }, (_, i) => ({ id: `wp${i}`, caption: `Work photo ${i + 1}`, service: 'oil' as const })),
      hasIntroVideo: submission?.hasIntroVideo ?? false,
      confirmedJobs: existing?.confirmedJobs ?? 0,
      avgReplyMins: 0,
      availability: 'flexible',
    };
    set((s) => ({ revivors: [...s.revivors.filter((r) => r.id !== ME_ID), me], meOnboarded: true, meSubmitted: !!submission }));
    if (submission) get().applyReview(submission);
  },

  addListing: (l) =>
    set((s) => ({
      revivors: s.revivors.map((r) => {
        if (r.id !== ME_ID) return r;
        const exists = r.listings.some((x) => x.service === l.service);
        return {
          ...r,
          listings: exists
            ? r.listings.map((x) => (x.service === l.service ? { ...x, ...l } : x))
            : [...r.listings, { ...l, id: uid('l') }],
        };
      }),
    })),

  removeListing: (id) =>
    set((s) => ({
      revivors: s.revivors.map((r) => (r.id === ME_ID ? { ...r, listings: r.listings.filter((l) => l.id !== id) } : r)),
    })),
}));

/** Short, stable booking-style reference for display, e.g. BK-4821. */
export function jobRef(id: string) {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return `BK-${(h % 9000) + 1000}`;
}

export function fmtDate(iso: string) {
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function fmtLongDate(iso: string) {
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function priceText(l: Pick<Listing, 'priceMin' | 'priceMax'>) {
  if (!l.priceMin && !l.priceMax) return 'Price not set';
  if (l.priceMin === l.priceMax) return `$${l.priceMin}`;
  return `$${l.priceMin}–$${l.priceMax}`;
}
