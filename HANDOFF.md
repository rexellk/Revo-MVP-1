# REVO MVP1: Session Handoff

**Last updated:** 2026-10-07
**Read first:** `REVO_CONTEXT.md` (product rules, scope, brand). This file covers what changed recently, what is blocked, and what to do next.

## Status at a glance

| Area | State |
|---|---|
| Revivor verification backend | Live on Supabase. Submit uploads docs, REVO team reviews in dashboard, app reads the result. |
| Profile split migration | Applied 2026-10-07. 24/24 access tests passed. |
| Claude's Supabase access | Connector authorized to the REVO org. Destructive SQL (DROP, DELETE) is auto-declined in sessions that can't show Supabase's confirm prompt; run those in the dashboard. |
| Test data | **Not deleted yet** (see below). |
| Phone login | Demo mode (2026-10-07): any number, code 123456, one Supabase account per number. Real SMS mode is built but needs Twilio. |
| Driver side (browse, chat, jobs, reviews) | Still mocked in memory. |
| Typecheck / lint | Both pass (`npx tsc --noEmit`, `npx expo lint`). |
| Git | Committed on branch `feat/supabase-revivor-verification` (not merged to main, not pushed). `.env` is gitignored; copy `.env.example`. |

## Supabase

- **Project:** `revo-mvp1`, ref `jypblnwkavmssopypszs`, region us-east-2, org **REVO** (moved out of SongScription by Rexell).
- **URL:** `https://jypblnwkavmssopypszs.supabase.co`
- **Keys:** publishable key is in `.env` (safe to ship in the app; RLS protects data). Never put a secret / service_role key in the app.
- **Auth:** anonymous sign-ins are ON. Each device gets an anonymous user; real phone OTP comes later.

### Migrations (`supabase/migrations/`, apply in filename order)

1. `20261007000000_verification_submissions.sql`: **applied.** `verification_submissions` table, `check_status` enum, private `verification-docs` bucket, RLS, `reviewed_at` trigger.
2. `20261007010000_split_profiles.sql`: **applied** 2026-10-07. Adds:
   - `profiles` (private: role, legal name, phone, `phone_confirmed`). Column grants stop users writing `phone_confirmed`.
   - `revivor_profiles` (what drivers see). Readable by the owner, or by anyone once `private.is_verified_revivor()` is true.
   - `profile-photos` bucket; photos readable only when the profile is readable.
   - Keeps the old `full_name`, `area`, `years_experience`, `bio` columns on `verification_submissions` but unused (`full_name` made optional). Dropping them was auto-declined; the drop SQL is in a comment in the file.
   - Security advisor after applying: no errors. Warnings are expected: "Anonymous Access Policies" (every MVP1 user is anonymous by design; RLS still limits each to their own rows) and "Leaked Password Protection" (no passwords in the app).
   - `review_queue` view (security_invoker, no access for app roles) joining submission + profile + account for the REVO team.
   - Adds `application/pdf` to the `verification-docs` bucket.

### Access tests (live project, after migration 2, 2026-10-07): 24/24 passed

Revivor A: saves account and re-saves it (upsert insert + update paths); cannot set `phone_confirmed` (403); uploads profile photo; saves public profile; uploads a PDF certificate; submits without name fields; cannot submit as `verified` (403); cannot self-approve via update; reads own status and own profile; cannot download own ID; cannot upload into another user's folder.
User B, while A is unverified: cannot read A's public profile, account/phone, submission, or profile photo; cannot read `review_queue` (403). No-login reads are denied (401).
After the team sets A to verified: A sees `verified`; B can read A's public profile and photo; B still cannot read A's phone or download A's ID. `review_queue` shows legal name, display name, phone, profile photo and doc paths in one row.

### Listings tests (2026-10-07): all passed

Add a service, set its price (upsert), add another, delete own; bad range (90-50) and unknown service rejected; another user can't read an unverified Revivor's listings, can't add listings as them (403), and can't delete theirs (0 rows). Verified Revivors' listings are readable by any signed-in user (by design, for the driver side).

### Test data to delete (in the dashboard)

Authentication > Users: also delete demo test accounts `08f2dc04-985e-4409-8887-0c6fed6014c8` ((555) 000-0001) and `857974bf-69d7-4070-935a-ad3c69e1f0fc` ((555) 000-0002). And these 3 anonymous users (their table rows cascade):
`64c7336f-6a1b-48ac-b1ad-5c5f096af192`, `26866aaf-7daa-4b2f-b1e4-566572f52e5d`, `1f99cb21-861f-411b-9a17-5fe23ce10124`.
Storage: delete the `64c7336f-...` and `26866aaf-...` folders in `verification-docs`, and the `26866aaf-...` folder in `profile-photos`. Then confirm `verification_submissions`, `profiles`, `revivor_profiles` have no TEST rows.

## What changed this session

**Backend + app wiring**
- `src/lib/supabase.ts`: client with AsyncStorage session.
- `src/lib/verification.ts`: `saveRevivorProfile` (step 1), `submitVerification` (step 2 uploads + row), `fetchLatestSubmission` (dashboard). Folders are `<user_id>/<YYYY-MM-DD_HHMMSS>/`.
- `src/store.ts`: `simulateApproval` removed and replaced by `applyReview(review)`. Rejected checks reset to `not_started` and `meSubmitted` goes false so "Finish verification" reappears. Store now keeps `phone` from sign-in.
- `src/app/onboarding/index.tsx`: Continue saves the profile to Supabase (loading + error alert).
- `src/app/onboarding/evidence.tsx`: Submit uploads everything first and only navigates on success.
- `src/app/revivor/index.tsx`: reads review status on focus; "Simulate REVO approval" replaced by "Check status".
- Packages added: `@supabase/supabase-js`, `@react-native-async-storage/async-storage`, `expo-document-picker`. `app.json` has the `expo-image-picker` plugin with camera/photo permission strings.

**Bug fixes and UX**
- ASE "Add certificate" froze the app on iOS: the image picker opened while the ActionSheet modal was still closing. Fixed in `src/components/sheet.tsx` (action runs on `onDismiss` on iOS). Applies to every ActionSheet.
- Photo slots use the native iOS sheet (Take Photo / Photo Library / Choose File). Android and web use the brand sheet with the same options.
- ID and ASE accept PDFs (shown with a PDF icon). Work photos now require 1 (was 3).

**Design exploration**
- Google Stitch project "REVO MVP1" (id `3870147321008411589`): 3 driver home directions (Trust Hero, Credential-first list, Faces first). Screenshots in `design/stitch-driver-home/`.
- Recommendation given: B's credential row on cards under A's navy explainer. Not built.
- Copy to fix if any direction is used: C's "No middleman pricing" and B's "No platform markups" are unbacked claims.

## Open suggestions (discussed, not built, waiting on Rexell)

1. Make the **ID row tappable** on the trust profile (`src/app/revivors/[id].tsx`), opening the Credential modal with the verification record only (no document image). Today only ASE rows open it, so ID, the core MVP1 claim, has the weakest proof on screen.
2. **Trim duplicate verification checklists** on the Revivor side: keep the Dashboard card; reduce Profile to badge + link; drop the list on Submitted.
3. **Fix the dead link** "How REVO verifies Revivors" in `src/app/driver/profile.tsx` (it routes to Browse).
4. Hide "Phone number confirmed" from verification lists, or label it as account info, so testers don't read it as a third check.
5. Admin review page (see Next steps).

## Known gaps and gotchas

- The Revivor's profile lives in Zustand memory. Reloading the app loses it locally, and onboarding starts over (creating a second submission for the same anonymous user if they resubmit).
- `review_queue` joins several tables, so Supabase can't edit through it. Reviewers set statuses in `verification_submissions` by `submission_id`.
- Table Editor shows file paths, not images. Files are in Storage under the user's id folder. This is expected.
- Anonymous sign-ins are rate limited to 30/hour per IP. Fine for a pilot; add CAPTCHA before a public launch.
- `ENOENT ... development-code-signing-settings-2.json` from `expo start` is an Expo CLI cache race, not app code. Fix: stop the server, `rm -rf ~/.expo/codesigning`, restart, press `i` once.

## Phone login

**Now (demo mode, `EXPO_PUBLIC_AUTH_MODE=demo`):** no SMS; code is always 123456. `src/lib/auth.ts` signs each number into an email/password account (`<digits>@phone.revo-mvp1.app`, password derived from the number). Requires Supabase "Confirm email" OFF so no emails are sent. DEMO ONLY: anyone can sign in as any number. `phone_confirmed` stays false for these accounts.

**Later (real SMS, `EXPO_PUBLIC_AUTH_MODE=sms`):** Twilio trial texts only verified numbers; texting the public needs a paid account plus A2P 10DLC registration (or a verified toll-free number), which can take weeks, so start ~2 weeks before the pilot. Demo accounts don't carry over to SMS accounts.

1. Twilio: create an account, buy a US phone number (~$1/mo), and from the console copy Account SID, Auth Token, and either the phone number or a Messaging Service SID. A trial account can only text numbers you verify in Twilio.
2. Supabase > Authentication > Sign In / Providers > Phone: enable, provider Twilio, paste the values, save.
3. Optional for testing without texts: in the same Phone settings, add test numbers with fixed codes (e.g. `17345550100=123456`).
4. Test: sign in as a mechanic with a new number -> onboarding; finish and submit; log out; sign in again with the same number -> lands on Dashboard with the right status, no onboarding.
5. Then turn OFF "Allow anonymous sign-ins" (no longer used by the app).

How routing works: `src/lib/session.ts` `enterRevivorSide()` reads `revivor_profiles` + latest submission. No profile -> onboarding. Profile -> `hydrateMe` rebuilds the Revivor in the store, then Dashboard. Logging out calls `supabase.auth.signOut()` and clears the local Revivor. Services and prices are on Supabase (`revivor_listings`, migration `20261007030000`), so they survive re-login.

## Next steps (in order)

1. ~~**Restore Supabase access for Claude.**~~ Done (REVO org). claude.ai > Settings > Connectors > Supabase > Disconnect > Connect > pick the **REVO** org > Authorize, then start a new Claude Code session. The claude.ai Supabase connector is authorized for **one organization per connection** (Supabase docs: "choose the organization that contains the project"), so picking REVO drops SongScription. If both are needed at once, add a second Supabase MCP server in Claude Code that uses a Supabase personal access token (account-wide), ideally scoped with `?project_ref=jypblnwkavmssopypszs`. Alternative with no connector: paste migration 2 into the dashboard SQL Editor and run it.
2. ~~Apply migration 2, advisor, access tests.~~ Done. Still to do: delete the test data (dashboard).
3. Do a full Revivor run in the simulator: step 1 saves, submit uploads, approve in dashboard, Check status flips to verified.
4. Decide on the open suggestions above.
5. PostHog in `src/analytics.ts`.
6. Admin review page.
7. Driver side on Supabase, then real phone OTP linked to the anonymous user.
8. ~~Commit.~~ Done on `feat/supabase-revivor-verification`; merge to main when ready.

## Prompt for the next Claude session

```
You're continuing work on REVO MVP1, an Expo SDK 57 / Expo Router app in this repo.
Read REVO_CONTEXT.md, then HANDOFF.md, before doing anything. Follow AGENTS.md
(check versioned Expo docs before touching Expo APIs; use npx expo install; run
npx tsc --noEmit and npx expo lint before calling work done). No em dashes in any output.

First task:
1. Confirm you can reach the Supabase project revo-mvp1 (ref jypblnwkavmssopypszs)
   in the REVO org with the Supabase MCP tools. Both migrations are already applied.
2. Check that the test data listed in HANDOFF.md is gone. If any remains, tell me what
   to delete in the dashboard (DELETE/DROP from your tools gets auto-declined).
3. Walk me through the open suggestions in HANDOFF.md and ask which to build first.
4. Update HANDOFF.md with the new status.

Then wait for me before starting the next item.
```
