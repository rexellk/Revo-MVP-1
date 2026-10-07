# REVO: MVP1 mobile frontend

MVP1 is a marketplace of verified Revivors (independent mechanics). Drivers browse Revivors, check each one's trust profile, message them in the app, and pay them directly off the app. When both sides confirm a job, it counts on the Revivor's profile and unlocks one verified review.

The app is built with React Native, Expo SDK 57, Expo Router and TypeScript. Revivor verification runs on Supabase (project `revo-mvp1`): Revivors upload their ID, selfie and ASE certificates, and the REVO team reviews them. Everything else is still mocked and kept in memory.

New here? Read `REVO_CONTEXT.md` (product rules and decisions), then `HANDOFF.md` (current status and open work).

## Run it

Copy `.env.example` to `.env` and fill in the publishable key:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://jypblnwkavmssopypszs.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...   # Supabase dashboard > Settings > API Keys
```

```bash
npm install
npx expo start -c       # press i for iOS simulator, a for Android, or scan the QR in Expo Go
npx expo start --web    # quick look in a browser
```

Sign-in runs in demo mode for now (`EXPO_PUBLIC_AUTH_MODE=demo` in `.env`): enter any 10-digit number and the code `123456`. No text is sent, and the same number always opens the same account. Switching to real text codes (`EXPO_PUBLIC_AUTH_MODE=sms`) needs Twilio set up in Supabase (see `HANDOFF.md`). The iOS Simulator has no camera, so use Photo Library or Choose File when uploading there.

## Demo path

**Driver:** Find a Revivor → Sammy L. → open a certificate → Message Sammy → Confirm job → Leave a review. Ryan F. shows how a new Revivor with no reviews looks.

**Revivor:** I'm a mechanic → profile (step 1, saved to Supabase) → ID + selfie, at least one ASE certificate, at least 1 work photo (step 2) → Submit for review (uploads to Supabase) → submitted (step 3) → Dashboard (shows "In review") → REVO team approves in Supabase → *Check status* → Messages → Jordan P. → We did a job.

The auto-replies in chat, auto-confirmed jobs, and the first driver message after verification are demo-only. They are marked `DEMO ONLY` in `src/store.ts`.

## Reviewing a Revivor (REVO team)

1. Supabase dashboard → Table Editor → `review_queue`: one row per pending submission with legal name, phone, and every file path.
2. Open the files under Storage → `verification-docs` → `<user_id>` → `<date_time>`. Profile photos are in `profile-photos`.
3. In `verification_submissions`, find the row by `submission_id` and set `id_status` and `ase_status` to `verified` or `rejected`. Add a `reviewer_note` if rejecting. `reviewed_at` fills in automatically.
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
  lib/                 supabase client + verification calls (profile save, uploads, review status)
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

See `HANDOFF.md` for the full list. In short:

1. Full Revivor run in the simulator against the live backend.
2. Replace `track()` with PostHog.
3. Admin page where the REVO team approves verifications (replaces the dashboard steps above).
4. Move the driver side (browse, chat, jobs, reviews) onto Supabase, then real phone OTP.
