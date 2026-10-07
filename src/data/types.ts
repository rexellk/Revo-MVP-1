export type Role = 'driver' | 'revivor';

export type ServiceId = 'oil' | 'brakes' | 'battery' | 'bulbs' | 'tires';

export type CheckType = 'id' | 'ase' | 'phone';
export type CheckStatus = 'verified' | 'in_review' | 'not_started';

/** A single verification record. Only the REVO team can create or change these. */
export interface Verification {
  type: CheckType;
  status: CheckStatus;
  label: string; // e.g. "ASE Certified: Brakes (A5)"
  verifiedAt?: string; // ISO date
  verifiedBy?: string; // REVO team member
  documentName?: string;
}

export interface Listing {
  id: string;
  service: ServiceId;
  priceMin: number;
  priceMax: number;
  note?: string;
}

export interface Review {
  id: string;
  jobId: string;
  revivorId: string;
  authorName: string;
  rating: number;
  tags: string[];
  text: string;
  service: ServiceId;
  vehicle: string;
  date: string;
}

export interface WorkPhoto {
  id: string;
  caption: string;
  service: ServiceId;
  uri?: string;
}

export interface Revivor {
  id: string;
  name: string;
  initials: string;
  avatarTone: string;
  photoUri?: string;
  bio: string;
  yearsExperience: number;
  area: string;
  radiusMiles: number;
  distanceMiles: number;
  memberSince: string;
  verifications: Verification[];
  listings: Listing[];
  workPhotos: WorkPhoto[];
  hasIntroVideo: boolean;
  confirmedJobs: number;
  avgReplyMins: number;
  availability: 'this_week' | 'flexible';
}

export type JobStatus = 'awaiting_confirmation' | 'confirmed';

export interface Job {
  id: string;
  conversationId: string;
  revivorId: string;
  driverName: string;
  service: ServiceId;
  vehicle: string;
  date: string;
  status: JobStatus;
  proposedBy: Role;
  reviewed: boolean;
}

export type Message =
  | { id: string; kind: 'text'; from: Role; text: string; at: string }
  | { id: string; kind: 'system'; text: string; at: string; jobId?: string };

export interface Conversation {
  id: string;
  revivorId: string;
  driverName: string;
  driverVehicle: string;
  messages: Message[];
  unread: number;
  phoneShared: { driver: boolean; revivor: boolean };
  blocked: boolean;
}
