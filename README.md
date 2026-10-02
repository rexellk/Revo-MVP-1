# REVO: MVP1 mobile frontend

MVP1 is a marketplace of verified Revivors (independent mechanics). Drivers browse Revivors, check each one's trust profile, message them in the app, and pay them directly off the app. When both sides confirm a job, it counts on the Revivor's profile and unlocks one verified review.

The app is built with React Native, Expo SDK 57, Expo Router and TypeScript. All data is mocked and kept in memory, so there is no backend yet.

## Run it

```bash
npm install
npx expo start          # press i for iOS simulator, a for Android, or scan the QR in Expo Go
npx expo start --web    # quick look in a browser
```

The sign-in screen accepts any 10-digit phone number and any 6-digit code.

## Demo path

**Driver:** Find a Revivor → Sammy L. → open a certificate → Message Sammy → Confirm job → Leave a review. Ryan F. shows how a new Revivor with no reviews looks.

**Revivor:** I'm a mechanic → profile (step 1) → ID, certificates and work photos (step 2) → submitted (step 3) → Dashboard → *Simulate REVO approval* → Messages → Jordan P. → We did a job.

"Prototype controls" and the auto-replies in chat are demo-only. They are marked `DEMO ONLY` in `src/store.ts`.

## Trust rules (enforced in `src/store.ts`; move them to Supabase RLS later)

- A Revivor's level comes only from REVO-team verification records: 1 = ID, 2 = + certification, 3 = + background check.
- Level 0 Revivors never appear in search and can't be messaged.
- A review needs a job confirmed by both sides, and each job gets only one review.
- A job marked by one side must be confirmed by the other.
- Phone numbers stay hidden until both people choose to share.
- Revivors can't edit their own badges.

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
  components/          ui kit, trust components, lists, action sheet
  data/                types + mock data
  store.ts             zustand store and trust rules
  analytics.ts         track() events used to measure the hypothesis (swap in PostHog)
  theme.ts             brand tokens
assets/brand/          logo mark, wordmark, mechanic illustration (cut from the REVO deck)
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

1. Supabase: tables `profiles`, `revivor_profiles`, `verifications`, `listings`, `conversations`, `messages`, `jobs`, `reviews`, and RLS that mirrors the rules above.
2. Admin page where the REVO team approves verifications. This replaces *Simulate REVO approval*.
3. Replace `track()` with PostHog.
4. Real photo and video upload to Supabase Storage.
