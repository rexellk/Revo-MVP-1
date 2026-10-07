import type { Conversation, Job, Review, Revivor, ServiceId } from './types';

export const SERVICES: Record<ServiceId, { name: string; short: string; icon: string }> = {
  oil: { name: 'Oil Change & Filter', short: 'Oil change', icon: 'oil' },
  brakes: { name: 'Brake Pad Replacement', short: 'Brake pads', icon: 'car-brake-alert' },
  battery: { name: 'Battery Replacement', short: 'Battery', icon: 'car-battery' },
  bulbs: { name: 'Bulb Replacement', short: 'Bulbs', icon: 'lightbulb-on-outline' },
  tires: { name: 'Tire Swap', short: 'Tire swap', icon: 'tire' },
};

export const SERVICE_ORDER: ServiceId[] = ['oil', 'brakes', 'battery', 'bulbs', 'tires'];

export const DRIVER = {
  name: 'Alex Thompson',
  firstName: 'Alex',
  initials: 'AT',
  vehicle: '2017 Honda Civic',
  city: 'Ann Arbor, MI',
};

export const REVIVORS: Revivor[] = [
  {
    id: 'sammy',
    name: 'Sammy L.',
    initials: 'SL',
    avatarTone: '#861A13',
    bio: 'Nine years at an independent shop in Ypsilanti before going on my own. I explain what I see before I touch anything, and I will show you the old parts when I am done.',
    yearsExperience: 9,
    area: 'Ann Arbor & Ypsilanti',
    radiusMiles: 12,
    distanceMiles: 2.4,
    memberSince: '2026-05-14',
    verifications: [
      { type: 'id', status: 'verified', label: 'Government ID matched to selfie', verifiedAt: '2026-05-16', verifiedBy: 'REVO team' },
      { type: 'ase', status: 'verified', label: 'ASE Certified: Brakes (A5)', verifiedAt: '2026-05-18', verifiedBy: 'REVO team', documentName: 'ASE_A5_certificate.pdf' },
      { type: 'ase', status: 'verified', label: 'ASE Certified: Engine Performance (A8)', verifiedAt: '2026-05-18', verifiedBy: 'REVO team', documentName: 'ASE_A8_certificate.pdf' },
      { type: 'phone', status: 'verified', label: 'Phone number confirmed', verifiedAt: '2026-05-14', verifiedBy: 'REVO team' },
    ],
    listings: [
      { id: 'l1', service: 'oil', priceMin: 65, priceMax: 90, note: 'Synthetic or conventional. Parts included.' },
      { id: 'l2', service: 'brakes', priceMin: 140, priceMax: 190, note: 'Per axle, pads included.' },
      { id: 'l3', service: 'battery', priceMin: 40, priceMax: 60, note: 'Labor only, bring or buy battery.' },
    ],
    workPhotos: [
      { id: 'w1', caption: 'Front pads, 2015 Civic', service: 'brakes' },
      { id: 'w2', caption: 'Oil + filter, 2019 RAV4', service: 'oil' },
      { id: 'w3', caption: 'Rotor check before pads', service: 'brakes' },
      { id: 'w4', caption: 'Battery swap, 2016 Escape', service: 'battery' },
    ],
    hasIntroVideo: true,
    confirmedJobs: 18,
    avgReplyMins: 12,
    availability: 'this_week',
  },
  {
    id: 'marcus',
    name: 'Marcus D.',
    initials: 'MD',
    avatarTone: '#243472',
    bio: 'Former dealership tech, 14 years on Toyota and Honda. I do weekend jobs around Ann Arbor. Clean work, no upsells.',
    yearsExperience: 14,
    area: 'Ann Arbor',
    radiusMiles: 8,
    distanceMiles: 3.1,
    memberSince: '2026-06-02',
    verifications: [
      { type: 'id', status: 'verified', label: 'Government ID matched to selfie', verifiedAt: '2026-06-03', verifiedBy: 'REVO team' },
      { type: 'ase', status: 'verified', label: 'ASE Master Technician', verifiedAt: '2026-06-05', verifiedBy: 'REVO team', documentName: 'ASE_master.pdf' },
      { type: 'phone', status: 'verified', label: 'Phone number confirmed', verifiedAt: '2026-06-02', verifiedBy: 'REVO team' },
    ],
    listings: [
      { id: 'l1', service: 'oil', priceMin: 70, priceMax: 95, note: 'Parts included.' },
      { id: 'l2', service: 'battery', priceMin: 45, priceMax: 55 },
      { id: 'l3', service: 'bulbs', priceMin: 20, priceMax: 45 },
    ],
    workPhotos: [
      { id: 'w1', caption: 'Battery + terminals, 2017 Civic', service: 'battery' },
      { id: 'w2', caption: 'Headlight bulb, 2018 Camry', service: 'bulbs' },
      { id: 'w3', caption: 'Oil change, 2020 CR-V', service: 'oil' },
    ],
    hasIntroVideo: false,
    confirmedJobs: 11,
    avgReplyMins: 35,
    availability: 'flexible',
  },
  {
    id: 'jeremy',
    name: 'Jeremy K.',
    initials: 'JK',
    avatarTone: '#0E0F39',
    bio: 'Washtenaw Community College automotive program grad, ASE certified in maintenance and light repair. I work at a local shop and take small jobs on my days off.',
    yearsExperience: 3,
    area: 'Ypsilanti',
    radiusMiles: 10,
    distanceMiles: 5.8,
    memberSince: '2026-07-20',
    verifications: [
      { type: 'id', status: 'verified', label: 'Government ID matched to selfie', verifiedAt: '2026-07-21', verifiedBy: 'REVO team' },
      { type: 'ase', status: 'verified', label: 'ASE Certified: Maintenance & Light Repair (G1)', verifiedAt: '2026-07-24', verifiedBy: 'REVO team', documentName: 'ASE_G1_certificate.pdf' },
      { type: 'phone', status: 'verified', label: 'Phone number confirmed', verifiedAt: '2026-07-20', verifiedBy: 'REVO team' },
    ],
    listings: [
      { id: 'l1', service: 'oil', priceMin: 55, priceMax: 75, note: 'Parts included.' },
      { id: 'l2', service: 'bulbs', priceMin: 15, priceMax: 35 },
      { id: 'l3', service: 'tires', priceMin: 40, priceMax: 60, note: 'Seasonal swap, on your rims.' },
    ],
    workPhotos: [
      { id: 'w1', caption: 'Tire swap, 2014 Focus', service: 'tires' },
      { id: 'w2', caption: 'Oil change, 2016 Corolla', service: 'oil' },
    ],
    hasIntroVideo: true,
    confirmedJobs: 4,
    avgReplyMins: 20,
    availability: 'this_week',
  },
  {
    id: 'ryan',
    name: 'Ryan F.',
    initials: 'RF',
    avatarTone: '#6A140E',
    bio: 'Just joined REVO. Six years doing maintenance for a delivery fleet in Detroit. Happy to walk you through the job before I start.',
    yearsExperience: 6,
    area: 'Ann Arbor',
    radiusMiles: 15,
    distanceMiles: 4.2,
    memberSince: '2026-09-15',
    verifications: [
      { type: 'id', status: 'verified', label: 'Government ID matched to selfie', verifiedAt: '2026-09-16', verifiedBy: 'REVO team' },
      { type: 'ase', status: 'verified', label: 'ASE Certified: Brakes (A5)', verifiedAt: '2026-09-18', verifiedBy: 'REVO team', documentName: 'ASE_A5_certificate.pdf' },
      { type: 'phone', status: 'verified', label: 'Phone number confirmed', verifiedAt: '2026-09-15', verifiedBy: 'REVO team' },
    ],
    listings: [
      { id: 'l1', service: 'oil', priceMin: 50, priceMax: 70, note: 'Parts included.' },
      { id: 'l2', service: 'brakes', priceMin: 120, priceMax: 170, note: 'Per axle.' },
    ],
    workPhotos: [
      { id: 'w1', caption: 'Fleet van brake job', service: 'brakes' },
      { id: 'w2', caption: 'Oil service, Transit 250', service: 'oil' },
      { id: 'w3', caption: 'Pads + rotors, F-150', service: 'brakes' },
    ],
    hasIntroVideo: true,
    confirmedJobs: 0,
    avgReplyMins: 15,
    availability: 'flexible',
  },
  {
    // Not verified (no ASE certificate yet): must never appear in driver search.
    id: 'tom',
    name: 'Tom B.',
    initials: 'TB',
    avatarTone: '#5C5F7E',
    bio: 'Pending verification.',
    yearsExperience: 2,
    area: 'Ann Arbor',
    radiusMiles: 10,
    distanceMiles: 1.2,
    memberSince: '2026-09-21',
    verifications: [
      { type: 'id', status: 'in_review', label: 'Government ID in review' },
      { type: 'ase', status: 'not_started', label: 'No ASE certificate uploaded' },
      { type: 'phone', status: 'verified', label: 'Phone number confirmed', verifiedAt: '2026-09-21', verifiedBy: 'REVO team' },
    ],
    listings: [{ id: 'l1', service: 'oil', priceMin: 30, priceMax: 40 }],
    workPhotos: [],
    hasIntroVideo: false,
    confirmedJobs: 0,
    avgReplyMins: 0,
    availability: 'flexible',
  },
];

export const REVIEWS: Review[] = [
  { id: 'r1', jobId: 'past1', revivorId: 'sammy', authorName: 'Priya S.', rating: 5, tags: ['Explained the work', 'On time'], text: 'Showed me my old pads next to the new ones before he left. First time I actually understood what I paid for.', service: 'brakes', vehicle: '2015 Honda Civic', date: '2026-09-02' },
  { id: 'r2', jobId: 'past2', revivorId: 'sammy', authorName: 'Daniel K.', rating: 5, tags: ['Price matched chat', 'Clean work'], text: 'Price was exactly what we agreed on in chat. Done in my apartment lot in 40 minutes.', service: 'oil', vehicle: '2019 Toyota RAV4', date: '2026-08-21' },
  { id: 'r3', jobId: 'past3', revivorId: 'sammy', authorName: 'Megan R.', rating: 4, tags: ['Explained the work'], text: 'Ran about 20 minutes late but texted me in the app. Great work otherwise.', service: 'battery', vehicle: '2016 Ford Escape', date: '2026-08-09' },
  { id: 'r4', jobId: 'past4', revivorId: 'marcus', authorName: 'Chris L.', rating: 5, tags: ['No upsell', 'Clean work'], text: 'Told me my brakes were fine and I did not need anything extra. Rare.', service: 'oil', vehicle: '2020 Honda CR-V', date: '2026-09-06' },
  { id: 'r5', jobId: 'past5', revivorId: 'marcus', authorName: 'Aisha N.', rating: 5, tags: ['On time'], text: 'Swapped my headlight in ten minutes and cleaned the lens too.', service: 'bulbs', vehicle: '2018 Toyota Camry', date: '2026-08-30' },
  { id: 'r6', jobId: 'past6', revivorId: 'jeremy', authorName: 'Sam T.', rating: 5, tags: ['Explained the work', 'Friendly'], text: 'Young but very careful. Double checked every lug nut.', service: 'tires', vehicle: '2014 Ford Focus', date: '2026-09-10' },
  { id: 'r7', jobId: 'past7', revivorId: 'jeremy', authorName: 'Olivia W.', rating: 4, tags: ['Price matched chat'], text: 'Good oil change, took a bit longer than expected.', service: 'oil', vehicle: '2016 Toyota Corolla', date: '2026-08-28' },
];

export const SEED_JOBS: Job[] = [
  { id: 'job-sammy-1', conversationId: 'c-sammy', revivorId: 'sammy', driverName: DRIVER.name, service: 'oil', vehicle: DRIVER.vehicle, date: '2026-09-20', status: 'awaiting_confirmation', proposedBy: 'revivor', reviewed: false },
  { id: 'job-marcus-1', conversationId: 'c-marcus', revivorId: 'marcus', driverName: DRIVER.name, service: 'bulbs', vehicle: DRIVER.vehicle, date: '2026-09-12', status: 'confirmed', proposedBy: 'driver', reviewed: false },
];

export const SEED_CONVERSATIONS: Conversation[] = [
  {
    id: 'c-sammy',
    revivorId: 'sammy',
    driverName: DRIVER.name,
    driverVehicle: DRIVER.vehicle,
    unread: 1,
    phoneShared: { driver: false, revivor: false },
    blocked: false,
    messages: [
      { id: 'm1', kind: 'text', from: 'driver', text: 'Hi Sammy, do you do oil changes on a 2017 Civic? I can do Saturday morning.', at: '2026-09-18T14:02:00' },
      { id: 'm2', kind: 'text', from: 'revivor', text: 'Yes! 0W-20 synthetic, $75 with parts. Saturday 9am works. Where are you parked?', at: '2026-09-18T14:15:00' },
      { id: 'm3', kind: 'text', from: 'driver', text: 'Apartment lot on Packard. Deal, see you then.', at: '2026-09-18T14:20:00' },
      { id: 'm4', kind: 'text', from: 'revivor', text: 'All done. Your filter was pretty dirty, good timing. Mind confirming the job in the app?', at: '2026-09-20T10:05:00' },
      { id: 'm5', kind: 'system', text: 'Sammy marked a job: Oil change on your 2017 Honda Civic, Sep 20.', at: '2026-09-20T10:05:30', jobId: 'job-sammy-1' },
    ],
  },
  {
    id: 'c-marcus',
    revivorId: 'marcus',
    driverName: DRIVER.name,
    driverVehicle: DRIVER.vehicle,
    unread: 0,
    phoneShared: { driver: false, revivor: false },
    blocked: false,
    messages: [
      { id: 'm1', kind: 'text', from: 'driver', text: 'My passenger headlight is out. Can you swap it this week?', at: '2026-09-10T18:40:00' },
      { id: 'm2', kind: 'text', from: 'revivor', text: 'Sure, $30 including the bulb. Friday after 5?', at: '2026-09-10T19:05:00' },
      { id: 'm3', kind: 'text', from: 'driver', text: 'Perfect, thank you!', at: '2026-09-10T19:07:00' },
      { id: 'm4', kind: 'system', text: 'Job confirmed by both of you: Bulb replacement, Sep 12.', at: '2026-09-12T17:45:00', jobId: 'job-marcus-1' },
    ],
  },
];
