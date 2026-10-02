// Thin analytics wrapper. MVP1 logs to the console; swap the body for PostHog
// (posthog.capture(event, props)) once the backend is in place.
// These events are how the MVP1 hypothesis gets measured:
//   profile_viewed -> profile_section_seen -> message_started -> job_confirmed
export type TrackEvent =
  | 'profile_viewed'
  | 'profile_section_seen'
  | 'credential_opened'
  | 'intro_video_opened'
  | 'work_photo_opened'
  | 'message_started'
  | 'message_sent'
  | 'job_marked'
  | 'job_confirmed'
  | 'review_submitted'
  | 'phone_shared'
  | 'user_reported'
  | 'user_blocked'
  | 'revivor_onboarding_submitted'
  | 'listing_created';

export const eventLog: { event: TrackEvent; props?: Record<string, unknown>; at: string }[] = [];

export function track(event: TrackEvent, props?: Record<string, unknown>) {
  const entry = { event, props, at: new Date().toISOString() };
  eventLog.push(entry);
  if (__DEV__) console.log('[track]', event, props ?? {});
}
