import { supabase } from './supabase';

// Tables (see supabase/migrations):
//   profiles                  private account data: legal name, phone
//   revivor_profiles          what drivers see once the Revivor is verified
//   verification_submissions  one row per review attempt. Docs go to the private "verification-docs" bucket.
// The REVO team reviews pending rows in the review_queue view and sets id_status / ase_status.
// RLS stops Revivors from changing either status.

const CONTENT_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  heic: 'image/heic',
  heif: 'image/heif',
  webp: 'image/webp',
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  pdf: 'application/pdf',
};
const EXT_FOR: Record<string, string> = Object.fromEntries(Object.entries(CONTENT_TYPES).map(([ext, type]) => [type, ext]));

export type RemoteCheckStatus = 'in_review' | 'verified' | 'rejected';

export interface RevivorProfileInput {
  legalName: string;
  displayName: string;
  phone: string | null;
  bio: string;
  area: string;
  radiusMiles: number;
  yearsExperience: number;
  services: string[];
  photoUri?: string;
}

export interface SubmissionInput {
  idPhotoUri: string;
  selfieUri: string;
  aseCertificates: { name: string; uri: string }[];
  workPhotoUris: string[];
  introVideoUri?: string | null;
}

export interface SubmissionStatus {
  id: string;
  idStatus: RemoteCheckStatus;
  aseStatus: RemoteCheckStatus;
  reviewerNote: string | null;
  reviewedAt: string | null;
}

/** Every call needs a phone-verified session (src/lib/auth.ts). */
async function requireUserId(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  if (!data.session) throw new Error('Your session ended. Sign in again with your phone number.');
  return data.session.user.id;
}

/** Uploads one local file (file://, blob: or data: uri) and returns its storage path. */
async function upload(bucket: string, folder: string, name: string, uri: string): Promise<string> {
  const res = await fetch(uri);
  const body = await res.arrayBuffer();
  const fromUri = uri.split('?')[0].split('.').pop()?.toLowerCase() ?? '';
  const contentType = CONTENT_TYPES[fromUri] ?? res.headers.get('content-type') ?? 'image/jpeg';
  const path = `${folder}/${name}.${EXT_FOR[contentType] ?? 'jpg'}`;
  const { error } = await supabase.storage.from(bucket).upload(path, body, { contentType, upsert: false });
  if (error) throw new Error(`Upload failed (${name}): ${error.message}`);
  return path;
}

/** Readable folder per attempt, e.g. "2026-10-07_1530". Seconds keep quick resubmits apart. */
const stamp = () => new Date().toISOString().slice(0, 19).replace('T', '_').replace(/:/g, '');

/** Saves the account (private) and the public Revivor profile. Safe to call again after edits. */
export async function saveRevivorProfile(input: RevivorProfileInput): Promise<void> {
  const userId = await requireUserId();
  const photoPath = input.photoUri ? await upload('profile-photos', userId, `photo-${stamp()}`, input.photoUri) : null;

  const { error: accountError } = await supabase
    .from('profiles')
    .upsert({ id: userId, role: 'revivor', legal_name: input.legalName, phone: input.phone });
  if (accountError) throw new Error(`Could not save your account: ${accountError.message}`);

  const { error: profileError } = await supabase.from('revivor_profiles').upsert({
    user_id: userId,
    display_name: input.displayName,
    bio: input.bio,
    area: input.area,
    radius_miles: input.radiusMiles,
    years_experience: input.yearsExperience,
    services: input.services,
    ...(photoPath ? { photo_path: photoPath } : {}),
  });
  if (profileError) throw new Error(`Could not save your profile: ${profileError.message}`);

  if (input.services.length) {
    const { error: listingError } = await supabase
      .from('revivor_listings')
      .upsert(
        input.services.map((service) => ({ user_id: userId, service })),
        { onConflict: 'user_id,service', ignoreDuplicates: true },
      );
    if (listingError) throw new Error(`Could not save your services: ${listingError.message}`);
  }
}

export interface RemoteListing {
  service: string;
  priceMin: number;
  priceMax: number;
  note: string | null;
}

/** Adds a service or updates its price range (one row per service). */
export async function saveListing(l: RemoteListing): Promise<void> {
  const userId = await requireUserId();
  const { error } = await supabase
    .from('revivor_listings')
    .upsert({ user_id: userId, service: l.service, price_min: l.priceMin, price_max: l.priceMax, note: l.note }, { onConflict: 'user_id,service' });
  if (error) throw new Error(`Could not save this service: ${error.message}`);
}

export async function deleteListing(service: string): Promise<void> {
  const userId = await requireUserId();
  const { error } = await supabase.from('revivor_listings').delete().eq('user_id', userId).eq('service', service);
  if (error) throw new Error(`Could not remove this service: ${error.message}`);
}

export async function submitVerification(input: SubmissionInput): Promise<string> {
  const userId = await requireUserId();
  const folder = `${userId}/${stamp()}`;
  const docs = 'verification-docs';

  const [idPhotoPath, selfiePath, certPaths, workPhotoPaths, introVideoPath] = await Promise.all([
    upload(docs, folder, 'id', input.idPhotoUri),
    upload(docs, folder, 'selfie', input.selfieUri),
    Promise.all(input.aseCertificates.map((c, i) => upload(docs, folder, `ase-${i + 1}`, c.uri))),
    Promise.all(input.workPhotoUris.map((uri, i) => upload(docs, folder, `work-${i + 1}`, uri))),
    input.introVideoUri ? upload(docs, folder, 'intro', input.introVideoUri) : Promise.resolve(null),
  ]);

  const { data, error } = await supabase
    .from('verification_submissions')
    .insert({
      id_photo_path: idPhotoPath,
      selfie_path: selfiePath,
      ase_certificates: input.aseCertificates.map((c, i) => ({ name: c.name, path: certPaths[i] })),
      work_photo_paths: workPhotoPaths,
      intro_video_path: introVideoPath,
    })
    .select('id')
    .single();
  if (error) throw new Error(`Could not save your submission: ${error.message}`);
  return data.id as string;
}

/** Latest review result for this device's Revivor, or null if nothing was submitted. */
export async function fetchLatestSubmission(): Promise<SubmissionStatus | null> {
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) return null;
  const { data, error } = await supabase
    .from('verification_submissions')
    .select('id, id_status, ase_status, reviewer_note, reviewed_at')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return {
    id: data.id,
    idStatus: data.id_status,
    aseStatus: data.ase_status,
    reviewerNote: data.reviewer_note,
    reviewedAt: data.reviewed_at,
  };
}

export interface MyRevivor {
  profile: {
    displayName: string;
    photoUrl: string | null;
    bio: string;
    area: string;
    radiusMiles: number;
    yearsExperience: number;
    services: string[];
    createdAt: string;
  };
  listings: RemoteListing[];
  submission: (SubmissionStatus & { aseNames: string[]; workPhotoCount: number; hasIntroVideo: boolean }) | null;
}

/** The signed-in user's Revivor profile and latest submission, or null if they never onboarded. */
export async function fetchMyRevivor(): Promise<MyRevivor | null> {
  const userId = await requireUserId();
  const { data: p, error } = await supabase
    .from('revivor_profiles')
    .select('display_name, photo_path, bio, area, radius_miles, years_experience, services, created_at')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!p) return null;

  let photoUrl: string | null = null;
  if (p.photo_path) {
    const { data: signed } = await supabase.storage.from('profile-photos').createSignedUrl(p.photo_path, 60 * 60 * 24);
    photoUrl = signed?.signedUrl ?? null;
  }

  const { data: ls, error: listingsError } = await supabase
    .from('revivor_listings')
    .select('service, price_min, price_max, note')
    .eq('user_id', userId)
    .order('created_at');
  if (listingsError) throw new Error(listingsError.message);

  const { data: s, error: subError } = await supabase
    .from('verification_submissions')
    .select('id, id_status, ase_status, reviewer_note, reviewed_at, ase_certificates, work_photo_paths, intro_video_path')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (subError) throw new Error(subError.message);

  return {
    profile: {
      displayName: p.display_name,
      photoUrl,
      bio: p.bio,
      area: p.area,
      radiusMiles: p.radius_miles,
      yearsExperience: p.years_experience,
      services: p.services,
      createdAt: p.created_at,
    },
    listings: (ls ?? []).map((l) => ({ service: l.service, priceMin: l.price_min, priceMax: l.price_max, note: l.note })),
    submission: s
      ? {
          id: s.id,
          idStatus: s.id_status,
          aseStatus: s.ase_status,
          reviewerNote: s.reviewer_note,
          reviewedAt: s.reviewed_at,
          aseNames: (s.ase_certificates as { name: string }[]).map((c) => c.name),
          workPhotoCount: s.work_photo_paths.length,
          hasIntroVideo: !!s.intro_video_path,
        }
      : null,
  };
}
