# REVO: MVP1 mobile frontend

MVP1 is a marketplace of verified Revivors (independent mechanics). Drivers browse Revivors, check each one's trust profile, message them in the app, and pay them directly off the app. When both sides confirm a job, it counts on the Revivor's profile and unlocks one verified review.

The app is built with React Native, Expo SDK 57, Expo Router and TypeScript, with Supabase as the backend for the Revivor side.

New here? Read `REVO_CONTEXT.md` (product rules and decisions), then `HANDOFF.md` (status, open decisions, next steps).

## What's real and what's demo

| Part | Status |
|---|---|
| Sign-in (phone number + code) | Real accounts; demo code `123456` until SMS is set up |
| Revivor onboarding, profile, services and prices | Real (Supabase) |
| ID, selfie, ASE and work photo upload | Real (private Supabase storage) |
| REVO team approval | Real, in the Supabase dashboard (see below) |
| Revivor Dashboard status | Real |
| Driver Browse, trust profile, chat, jobs, reviews | Demo (sample mechanics in app memory) |
| Analytics | Console only (PostHog planned) |

## Run it

Copy `.env.example` to `.env` and fill in the publishable key:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://jypblnwkavmssopypszs.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...   # Supabase dashboard > Settings > API Keys
EXPO_PUBLIC_AUTH_MODE=demo                                # demo = code 123456, sms = real texts (needs Twilio)
```

```bash
npm install
npx expo start -c       # press i for iOS simulator, a for Android, or scan the QR in Expo Go
npx expo start --web    # quick look in a browser
```

Sign in with any 10-digit number and the code `123456`. No text is sent, and the same number always opens the same account, on any device. New and returning users use the same screen. The iOS Simulator has no camera, so use Photo Library or Choose File when uploading there.

## Demo path

**Driver:** Find a Revivor → Sammy L. → open a certificate → Message Sammy → Confirm job → Leave a review. Ryan F. shows how a new Revivor with no reviews looks.

**Revivor:** I'm a mechanic → any number + `123456` → profile (step 1) → ID + selfie, at least one ASE certificate, at least 1 work photo (step 2) → Submit for review → Dashboard shows "In review" → REVO team approves in Supabase → *Check status* shows Verified → log out and back in with the same number lands on the Dashboard.

The auto-replies in chat, auto-confirmed jobs, and the first driver message after verification are demo-only. They are marked `DEMO ONLY` in `src/store.ts`.

## Reviewing a Revivor (REVO team)

1. Supabase dashboard → Table Editor → `review_queue`: one row per pending submission with legal name, phone, and every file path.
2. Open the files under Storage → `verification-docs` → `<user_id>` → `<date_time>`. Profile photos are in `profile-photos`.
3. In `verification_submissions`, find the row by `submission_id` and pick `verified` or `rejected` from the `id_status` and `ase_status` dropdowns. Add a `reviewer_note` if rejecting. `reviewed_at` fills in automatically. (`review_queue` itself is read-only.)
4. The Revivor sees the result next time they open the Dashboard or tap *Check status*.

## Trust rules (enforced in `src/store.ts`; verification rules also enforced by Supabase RLS)

- Every Revivor needs two checks, both verified by the REVO team: government ID (selfie match) and at least one ASE certification. There are no levels.
- Verification comes only from REVO-team verification records. Revivors can't edit their own badge.
- Revivors missing either check never appear in search and can't be messaged.
- A review needs a job confirmed by both sides, and each job gets only one review.
- A job marked by one side must be confirmed by the other.
- Phone numbers stay hidden until both people choose to share.

## Structure

```
src/
  app/                 routes (Expo Router)
    index.tsx          welcome
    sign-in.tsx        phone OTP
    driver/            tabs: browse, messages, jobs, profile
    revivor/           tabs: dashboard, messages, jobs, profile
    revivors/[id].tsx  trust profile (core MVP1 screen; ?preview=1 for the Revivor's own view)
    chat/[id].tsx      chat, "We did a job", report, block, share number
    review/[jobId].tsx verified review
    credential.tsx     certificate viewer
    onboarding/        Revivor steps 1 to 3
    listing/new.tsx    add or edit a service and price range
  components/          ui kit, trust components, lists, action sheet, media pickers
  data/                types + mock data
  lib/                 supabase client, auth (demo / SMS login), session routing, verification + listings calls
  store.ts             zustand store and trust rules
  analytics.ts         track() events used to measure the hypothesis (swap in PostHog)
  theme.ts             brand tokens
assets/brand/          logo mark, wordmark, mechanic illustration (cut from the REVO deck)
supabase/migrations/   database SQL, applied in filename order
design/                Stitch design explorations (driver home)
```

## Brand

These colors were sampled directly from the REVO pitch deck. Screens use a white background; navy, brick and cream stay as the brand accents. Cards are white with a 1px `line` border and a soft shadow.

| Token | Hex | Use |
|---|---|---|
| navyDeep → navyRoyal | `#101B3B` → `#243472` | gradients (welcome, profile header) |
| ink | `#0E0F39` | text, the "R" mark, dark cards, "Confirmed job" headers |
| bg | `#FFFFFF` | screen background, top bar, tab bar, footers, sheets, modals |
| cream | `#FFFCD7` | brand accent: logo tile (the mark always sits on cream), text and buttons on navy |
| creamDeep | `#F3EDC0` | small accent fills: tags, chips, safety banner |
| brick | `#861A13` | primary buttons, active tab, accents |

Headlines use Krona One, the closest Google Font to the deck's wide display face. Body text uses Archivo. If you have the original Canva brand kit, replace the font and swap the PNGs in `assets/brand/`.

## Next steps

The next build depends on open decisions, listed with recommendations in `HANDOFF.md` section 3. The main one: test the trust hypothesis first with **moderated persona tests** on the current demo driver side (add PostHog), or go straight to a **live pilot** (connect driver Browse to Supabase and add contact requests).
