# REVO MVP1: Handoff

**Last updated:** 2026-10-07
**Branch:** `feat/supabase-revivor-verification` (committed, not pushed, not merged to `main`)
**Read first:** `REVO_CONTEXT.md` for product rules, scope and brand. This file covers where things stand, the decisions still open, and what to do next.

## 1. Where we are

The **Revivor (supply) side is real**: a mechanic signs in, builds a profile, uploads ID, selfie and ASE certificates, and the REVO team approves or rejects them in Supabase. The **driver side is still a demo** on built-in sample data. That is enough to run moderated persona tests of the trust hypothesis today.

| Area | State |
|---|---|
| Sign-in | Real accounts in **demo mode**: any 10-digit number, code `123456`, no text sent. Same number = same account on any device. SMS mode is built but needs Twilio. |
| Revivor onboarding | Real. Profile, profile photo and services save to Supabase. |
| Verification upload | Real. ID, selfie, ASE certificates (image or PDF), work photos, optional intro video go to private storage. |
| REVO team review | In the Supabase dashboard (`review_queue` to look, `verification_submissions` to decide). No admin page yet. |
| Revivor Dashboard | Real. Shows in review / verified / rejected; services and prices save to Supabase. |
| Returning Revivor | Real. Signing in again (any device) lands on the Dashboard, not onboarding. |
| Driver Browse, trust profile, chat, jobs, reviews | **Mock** (sample mechanics in app memory). An approved real Revivor does not appear to drivers yet. |
| Revivor Messages / Jobs tabs | Mock. |
| Analytics | `track()` logs to the console only. |
| Checks | `npx tsc --noEmit` and `npx expo lint` pass. Access rules tested live (see section 5). |

## 2. What was improved

**Backend (Supabase project `revo-mvp1`, REVO org)**
- Tables: `profiles` (private: legal name, phone), `revivor_profiles` (public profile), `revivor_listings` (services + prices), `verification_submissions` (docs + review status), and the `review_queue` view for the team.
- Private storage: `verification-docs` (ID, selfie, certificates, work photos, intro video) and `profile-photos`.
- Security rules (RLS): a Revivor can only touch their own data, can never set their own status or `phone_confirmed`, can't download verification docs, and is hidden from everyone else until verified. Nobody else can see phone numbers or ID documents.
- All database SQL is versioned in `supabase/migrations/` (4 files, all applied).

**Revivor app**
- Onboarding saves to Supabase with loading states and clear error messages.
- "Submit for review" uploads everything and only moves on when the upload succeeds.
- Dashboard reads the team's decision on open and via **Check status**; "Simulate REVO approval" is gone. Rejections show the reviewer's note and reopen "Finish verification".
- Services: add, price and delete all save to Supabase.

**Sign-in**
- One screen for sign-up and sign-in (like Lyft: the phone number is the account).
- Demo mode now; SMS mode ready (`EXPO_PUBLIC_AUTH_MODE=sms` + Twilio).
- Stays signed in between launches; **Resend code** (30s cooldown) and **Change number**; logout clears local data.

**Fixes and UX**
- iOS freeze when adding an ASE certificate (picker opened while the sheet was still closing). Fixed for every action sheet.
- Native iOS photo sheet: Take Photo / Photo Library / Choose File. PDFs accepted for ID and ASE.
- Work photos now need 1 (was 3).

**Docs and design**
- `README.md`, `REVO_CONTEXT.md`, this handoff, `.env.example` (`.env` is gitignored).
- Google Stitch project "REVO MVP1" (id `3870147321008411589`): 3 driver home directions, screenshots in `design/stitch-driver-home/`.

## 3. Decisions needed

Ordered by how much they change what gets built next. Recommendation in bold.

| # | Decision | Options | Recommendation |
|---|---|---|---|
| D1 | **How do we test the trust hypothesis first?** | A. Moderated persona tests with the current mock driver side (needs only PostHog, ~0.5 day). B. Live pilot with real drivers and real WCC Revivors (needs Browse from Supabase + contact requests, ~1-2 days). | **A first**, B only if A looks promising. |
| D2 | If B: what happens to the sample mechanics on Browse? | Remove (only real verified Revivors) or keep, labeled "Sample". | **Keep labeled** until there are ~5 real verified Revivors. |
| D3 | If B: how do drivers contact Revivors? | Full real-time chat; lightweight contact request (one message, then both opt in to share numbers and continue by text/WhatsApp); external WhatsApp link only. | **Contact request.** Keeps "phone hidden until both opt in" and measures contact. WhatsApp-only exposes numbers and hides the data. |
| D4 | Real login before real users | SMS via Twilio (~$3/month for a pilot, plus carrier registration that can take weeks); email codes (free, no paperwork); stay on demo. | Demo for persona tests. **Email codes** if a pilot starts soon; SMS if phone verification matters more than speed. |
| D5 | Trust profile and Revivor UX tweaks | (a) make the **ID row tappable** with its verification record; (b) trim duplicate verification checklists (keep Dashboard's); (c) fix the dead "How REVO verifies Revivors" link; (d) hide "Phone number confirmed" from verification lists. | **Do (a) and (c)** before persona tests: ID is the core claim and currently has the weakest proof on screen. (b) and (d) are polish. |
| D6 | Driver home redesign | Stitch directions A (Trust Hero), B (Credential-first list), C (Faces first), or keep current. | **B's credential row under A's navy explainer.** Fix the unbacked copy in B and C if used. |
| D7 | Before an App Store build | Delete account in Profile (Apple requires it); duplicate-ID flag in `review_queue`; change phone number. | **Delete account is required**; the others can wait. |
| D8 | Git | Push the branch and open a PR; merge to `main` after a simulator run. | **Push now** (backup), merge after testing. |

## 4. Next steps

**Rexell, in the app and dashboard (no decision needed)**
1. Full simulator run: mechanic signs in, onboards, submits; approve in Supabase; **Check status** shows Verified; log out and back in lands on the Dashboard; services and prices survive re-login.
2. Delete test data (list in section 5).
3. Authentication > Sign In / Providers: turn **off** "Allow anonymous sign-ins" (no longer used).
4. Optional: drop the 4 unused columns on `verification_submissions` (SQL is in a comment in `20261007010000_split_profiles.sql`).

**Then, depending on D1**
- **If A (persona tests):** PostHog in `src/analytics.ts` -> D5 (a) and (c) -> write the test script and run sessions.
- **If B (live pilot):** Browse + trust profile from Supabase (plus a driver `profiles` row) -> contact requests (D3) -> PostHog -> real login (D4).

**Out of MVP1 unless decided otherwise:** full real-time chat, jobs and reviews backend, report/block backend, admin page (the dashboard works), My vehicles, Settings.

## 5. Reference

### Supabase
- Project `revo-mvp1`, ref `jypblnwkavmssopypszs`, us-east-2, org REVO. URL `https://jypblnwkavmssopypszs.supabase.co`.
- Keys: only the publishable key goes in the app (`.env`). Never a secret / service_role key.
- Auth settings: Email provider on with **Confirm email off** (needed by demo login; no emails are sent); Phone provider off until Twilio; anonymous sign-ins still on (turn off).
- Claude's Supabase connector is authorized for the REVO org only (one org per connection). Destructive SQL (DROP, DELETE) from Claude gets auto-declined because the confirm prompt can't be shown; run those in the dashboard SQL Editor.

### Migrations (`supabase/migrations/`, all applied 2026-10-07)
1. `20261007000000_verification_submissions.sql`: submissions table, status enum, `verification-docs` bucket, RLS, `reviewed_at` trigger.
2. `20261007010000_split_profiles.sql`: `profiles`, `revivor_profiles`, `profile-photos` bucket, `review_queue` view, PDF support, `private.is_verified_revivor()`. Old name/bio columns on submissions kept but unused.
3. `20261007020000_sync_phone_confirmed.sql`: `phone_confirmed` follows Supabase Auth's verified phone (stays false in demo mode).
4. `20261007030000_revivor_listings.sql`: services + price ranges, one row per service.

Security advisor: no errors. Expected warnings: "Anonymous Access Policies" (goes away once anonymous sign-ins are off) and "Leaked Password Protection" (demo passwords only).

### Access tests (live, 2026-10-07): all passed
- Revivor: saves and re-saves account and profile; uploads photo, PDF and docs; submits; manages own services.
- Revivor cannot: set `phone_confirmed`, submit as verified, self-approve, download own ID, upload into another user's folder, save a bad price range or unknown service.
- Another user, while the Revivor is unverified: cannot see their profile, photo, services, phone, submission, or `review_queue`. No-login reads are denied.
- After approval: profile, photo and services become visible to signed-in users; phone and ID stay private.

### How the REVO team reviews a Revivor
1. Table Editor > `review_queue`: who is waiting (legal name, phone, file paths). Copy `submission_id`.
2. Storage > `verification-docs` > their user id > dated folder: check ID, selfie, ASE, work photos. Profile photo is in `profile-photos`.
3. Table Editor > `verification_submissions` > that row: set `id_status` and `ase_status` from the dropdown (`verified` / `rejected`), add `reviewer_note` if rejecting, save.
4. The Revivor sees it on Dashboard open or **Check status**.

### How sign-in works
- `src/lib/auth.ts`. Demo mode maps each number to an email/password account (`<digits>@phone.revo-mvp1.app`). DEMO ONLY: anyone who knows a number can sign in as it.
- `src/lib/session.ts` `enterRevivorSide()`: no profile -> onboarding; profile -> `hydrateMe` rebuilds the Revivor from Supabase -> Dashboard.
- SMS mode setup: Twilio account + number (trial texts only verified numbers) -> Supabase Phone provider = Twilio -> set `EXPO_PUBLIC_AUTH_MODE=sms`. Texting the public needs a paid account and A2P 10DLC registration (or a verified toll-free number), which can take weeks. Demo accounts don't carry over.

### Test data to delete (dashboard)
- Authentication > Users: `08f2dc04-985e-4409-8887-0c6fed6014c8` ((555) 000-0001), `857974bf-69d7-4070-935a-ad3c69e1f0fc` ((555) 000-0002), and anonymous users `64c7336f-6a1b-48ac-b1ad-5c5f096af192`, `26866aaf-7daa-4b2f-b1e4-566572f52e5d`, `1f99cb21-861f-411b-9a17-5fe23ce10124`, `eebaf155-4e28-48ca-8252-371d5f7c278d` (if it was your early test). Their table rows are removed with them.
- Storage: the matching folders in `verification-docs` and `profile-photos`.
- Keep `5c30b3cd-7bab-477a-9844-79b74d73f7fe` if it is your own verified test Revivor.

### Gotchas
- Table Editor shows file paths, not images; open files in Storage. Folders are named by user id because the security rules use it.
- `review_queue` is read-only; set statuses in `verification_submissions`.
- Anonymous users don't show in Authentication > Users while the search is set to "Email address"; switch to user ID.
- The iOS Simulator has no camera: use Photo Library or Choose File.
- `ENOENT ... development-code-signing-settings-2.json` on `expo start` is an Expo CLI cache race: stop the server, `rm -rf ~/.expo/codesigning`, restart, press `i` once.
- Demo-only code in `src/store.ts` (marked `DEMO ONLY`): chat auto-replies, auto-confirmed jobs, the first driver message after verification.

## 6. Prompt for the next Claude session

```
You're continuing work on REVO MVP1, an Expo SDK 57 / Expo Router app in this repo
(branch feat/supabase-revivor-verification). Read REVO_CONTEXT.md, then HANDOFF.md,
before doing anything. Follow AGENTS.md (check versioned Expo docs before touching Expo
APIs; use npx expo install; run npx tsc --noEmit and npx expo lint before calling work
done). No em dashes in any output. MVP1 tests trust only: don't overengineer.

First task:
1. Confirm you can reach the Supabase project revo-mvp1 (ref jypblnwkavmssopypszs) with
   the Supabase MCP tools.
2. Check whether the test data in HANDOFF.md section 5 is gone; if not, tell me what to
   delete in the dashboard (DELETE/DROP from your tools gets auto-declined).
3. Ask me which decisions in HANDOFF.md section 3 are made, starting with D1, then propose
   the smallest plan for the chosen path.
4. Update HANDOFF.md with the new status.

Then wait for me before building.
```
