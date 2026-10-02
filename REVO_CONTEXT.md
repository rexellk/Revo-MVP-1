# REVO: Project Context (for Claude Code)

Read this before working on the repo. It explains what REVO is, what MVP1 is (and is not), and the decisions already made so they don't get re-litigated.

## What REVO is

A two-sided gig marketplace connecting everyday drivers with independent, verified mechanics ("Revivors") who do basic maintenance at the driver's location (oil change, brake pads, battery, bulbs, tire swap).

- **Drivers (buyers):** ages 20 to 40, recent grads who rely on their car daily and can't afford shop rates (~$179/hr). Persona: Alex, 24, Ann Arbor, 2017 Honda Civic.
- **Revivors (supply):** independent contractors, not employees. Main recruiting channel: Washtenaw Community College automotive program.
- **Difference from Wrench / YourMechanic:** they use W-2 employees, so the company brand is the source of trust. REVO uses gig mechanics, so trust must be manufactured by the platform (verification, confirmed-job reviews, credentials).
- **Legal framing:** REVO is a marketplace, not a service provider or insurer. Mechanics are independent contractors. Keep all copy consistent with this.
- **Team:** Maciej Gabrys (CEO), Hailey Gabron (CMO), Rexell Kurniawan (CPO/CTO, sole developer). Class: ENTR 441, UMich, Fall 2026.

## MVP1: one problem only

**Problem:** Alex won't let an unknown independent mechanic work on his car because he has no way to verify who they are.

**Hypothesis:** If Alex sees a verified mechanic profile, he will contact and book an independent mechanic instead of going to a shop.

**Why only trust:** an MVP tests one assumption. Trust is the riskiest one (price and convenience are already validated by competitors), it was the loudest pain in customer discovery ("scammed", "mechanics lie", 78% don't always trust mechanics), and testing multiple things at once makes results unreadable. Upfront/locked pricing is a separate problem, deferred to MVP2.

### MVP1 model: marketplace, like Facebook Marketplace

1. Driver browses verified Revivors (only Level 1+ appear in search).
2. Opens the trust profile (the core screen).
3. Messages the Revivor in-app and agrees on job, time and price in chat.
4. Pays the Revivor directly off-app (cash, Venmo, Zelle) after the work is done. Never in advance.
5. Either side taps "We did a job", the other confirms. A confirmed job counts on the Revivor's profile and unlocks one verified review.

### Money in MVP1

- The app does not handle payments. REVO takes no cut in MVP1. This is intentional: MVP1 tests trust, not revenue.
- Known downsides: $0 revenue, off-platform leakage, no payment protection.
- Retention lever: only in-app confirmed jobs build reviews and job count.
- Later revenue plan: MVP2 adds Stripe Connect in-app payments with a 10 to 15% take rate (plus pay-after-proof protection and refunds). Revivor subscription (~$30/mo) for visibility. Insurance commissions later.

### Trust rules (must hold in UI, store, and later Supabase RLS)

- Verification level comes only from REVO-team verification records. Revivors can never edit their own badges.
  - Level 1 = ID verified (selfie match)
  - Level 2 = + certification verified (ASE, WCC program, etc.)
  - Level 3 = + background check cleared
- Level 0 Revivors are hidden from search and cannot be messaged.
- A review requires a job confirmed by both sides. One review per job.
- A job marked by one side must be confirmed by the other side (not the same person).
- Phone numbers stay hidden until both people opt in to share.
- Block and report available on every profile and chat.
- Cold start: new Revivors have 0 reviews, so the profile leans on badges, viewable certificates, work photos, and an optional 30-second intro video.

### Explicitly OUT of MVP1

In-app payments, tipping, wallet, payouts/earnings, dispatch/auto-matching (drivers choose the mechanic themselves; auto-matching would break the hypothesis), live tracking, insurance, Snap & Diagnose, RevoBot (Gemini AI), subscriptions, VIN scan, "Premium Member". Do not add these without being asked. A friend's 51-screen mockup exists; treat it as the v2/v3 vision, not MVP1 scope.

Do not make unbacked claims in copy (e.g. "50% average savings", insurance coverage, warranties). Past website copy overstated features; keep copy honest to pilot reality.

## Current code state

- **Stack:** React Native + Expo SDK 57, Expo Router (routes in `src/app/`), TypeScript, Zustand. Fonts: Krona One (display), Archivo (body).
- **Data:** all mocked, in-memory (`src/data/mock.ts`, `src/store.ts`). No backend yet.
- **Demo-only code** (marked DEMO ONLY in `src/store.ts`): auto-replies in new chats, auto-confirm of marked jobs, and the "Simulate REVO approval" button on the Revivor dashboard. Remove when the backend exists.
- **Analytics:** `src/analytics.ts` `track()` logs to console only. Events: profile_viewed, profile_section_seen, credential_opened, message_started, job_confirmed, review_submitted, etc. These measure the hypothesis. Swap in PostHog before real user testing.
- **Deployed (web):** https://bawblexd-revo.expo.app via `npx expo export -p web && npx eas-cli@latest deploy --prod`.
- **Run locally:** `npx expo start`, press `i` for iOS simulator. Any 10-digit phone + any 6-digit code signs in.

### Key files

- `src/app/revivors/[id].tsx`: trust profile (core MVP1 screen; `?preview=1` for Revivor's own view)
- `src/app/chat/[id].tsx`: chat, "We did a job", report, block, share number
- `src/app/driver/*`: driver tabs (browse, messages, jobs, profile)
- `src/app/revivor/*`: Revivor tabs (dashboard, messages, jobs, profile)
- `src/app/onboarding/*`: Revivor signup steps 1 to 3 (profile, evidence, submitted)
- `src/store.ts`: state + trust rules (levelOf, isSearchable, needsAction, submitReview guards)
- `src/theme.ts`: brand tokens

## Brand (must match the REVO pitch deck)

Screens use a white background. Navy, brick and cream stay as the brand accents.

| Token | Hex | Use |
|---|---|---|
| navyDeep to navyRoyal | `#101B3B` to `#243472` | gradients (welcome, profile hero) |
| ink | `#0E0F39` | text, logo "R", dark cards, "Confirmed job" headers |
| bg | `#FFFFFF` | screen background, top bar, tab bar, footers, sheets, modals |
| surface | `#F7F6EF` | grouped rows in action sheets, incoming chat bubbles |
| cream | `#FFFCD7` | accent only: logo tile, text and buttons on navy |
| creamDeep | `#F3EDC0` | small accent fills: tags, chips, safety banner, switch pill |
| brick | `#861A13` | primary buttons, active tab, accents |

Cards are white with a 1px `line` border and the soft `shadow.card`. Logo mark, wordmark and mechanic illustration live in `assets/brand/` (cut from the deck). The mark is only placed on cream (use `MarkTile` on white screens), never directly on white or navy. Use "Revivor" as the single spelling everywhere (not Reviver or Helper).

## Next steps (in order)

1. PostHog in `src/analytics.ts` so persona tests capture data.
2. Supabase: tables profiles, revivor_profiles, verifications, listings, conversations, messages, jobs, reviews, with RLS mirroring the trust rules above. Phone OTP auth.
3. Admin page for the REVO team to approve verifications (replaces "Simulate REVO approval").
4. Real photo/video upload to Supabase Storage.
5. Then MVP2: Stripe Connect in-app payments + take rate.

## Working style

- Rexell prefers concise, direct answers and step-by-step instructions. No em dashes in any output.
- Run `npx tsc --noEmit` and `npx expo lint` before calling work done. Use `npx expo install` for packages.
