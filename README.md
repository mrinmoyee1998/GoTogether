# GoTogether

**Find your people. Do more together.**

GoTogether is an activity-first social discovery app for young adults in Mumbai. People post plans (badminton, treks, pottery, board games, cafe hopping…), others **request to join**, and the **organiser approves** who comes. It is not a dating app and not an event-listing site. It's about finding people to *do things with*.

## Features

- **Auth:** email/password sign-up, login, logout and **forgot password** (reset by email) via Supabase Auth, with persistent sessions and protected routes (middleware).
- **Onboarding and profile:** name, optional photo (Supabase Storage), required 18+ confirmation, city, neighbourhood, bio and interests.
- **Discover:** upcoming activities with search, category chips, neighbourhood, date presets (today / this weekend / next 7 days) and a date picker, plus empty states.
- **Activity details:** cover, date/time (IST), venue, Google Maps link, cost, spots meter, organiser card and confirmed participants. The join button shows the right state: join / pending / accepted / declined / full / cancelled / started / organiser.
- **Create and edit activity:** validated form (no past dates), optional maps link, cost and cover image. The organiser can also cancel the activity.
- **Join workflow:**
  - Participants can request to join (with an optional note), cancel a pending request, or leave after being accepted.
  - The organiser can accept, decline, or remove a participant.
  - Capacity is enforced **in the database** with row locks, so the last spot can't be given to two people.
- **Dashboard:** my profile; requests to review; activities I created; activities I've joined; my requests (pending / declined / cancelled).
- **Safety:** 18+ gate, organiser approval, public venue details, no contact details shown, a working "Report activity" feature (stored in a `reports` table), plus community guidelines and privacy pages.
- **Responsive:** mobile-first, with a bottom tab bar on phones and full navigation on desktop.

Not in this MVP (on purpose): payments, ticketing, chat, live location, AI recommendations, native apps.

## Tech stack

- Next.js 15 (App Router, Server Components, Server Actions) + TypeScript
- Tailwind CSS v4 with shadcn/ui-style components (Radix primitives + CVA), Lucide icons, Sonner toasts
- Supabase: Postgres, Auth, Storage and Row Level Security
- Zod for validation; self-hosted fonts via `@fontsource` (no build-time font downloads)

## Project structure

```
src/
  app/
    page.tsx                     Landing page
    (auth)/login, (auth)/signup  Auth pages
    auth/callback/route.ts       Email-link handler (confirm email)
    onboarding/                  Post-signup profile setup
    discover/                    Discovery + filters
    activities/new/              Create activity
    activities/[id]/             Details, join panel, organiser request management
    activities/[id]/edit/        Edit (organiser only)
    dashboard/                   Dashboard tabs
    profile/                     Edit profile
    guidelines/, privacy/        Community guidelines & safety, privacy policy
  components/
    ui/                          Button, Input, Card, Badge, Dialog, Tabs, …
    activity/                    Card, cover, join panel, request rows, report dialog, form
    layout/                      Header, mobile bottom nav, footer
  lib/
    supabase/                    Browser / server / middleware clients
    actions/                     Server actions (auth, profile, activities, requests, reports)
    data/                        Server-side queries
    validation.ts, dates.ts, constants.ts, auth.ts
  middleware.ts                  Session refresh + route protection
  types/database.ts              Generated Supabase types
supabase/
  migrations/20261125000000_init.sql   Schema, RLS, functions, storage buckets
  seed.sql                             Mumbai demo activities (dates relative to today)
  remove_demo_data.sql                 Removes the sample data before a real launch
  tests/security_test.sql              RLS/permission tests (rolls back)
  tests/race_test.sh                   Concurrent "last spot" acceptance test
e2e/two-user-flow.mjs                  Full two-user browser test (Playwright)
```

## How security works

- **RLS is on for every table.**
  - Users can update only their own profile.
  - Activities can be inserted only with `organiser_id = auth.uid()`, and only by onboarded (18+) users.
  - Only the organiser can update or delete their activity.
- **Column grants:**
  - Clients cannot write `confirmed_count` or change `organiser_id`.
  - Logged-out visitors can read only `id`, `full_name` and `avatar_url` from profiles.
- **`join_requests` has no client write access at all.** All changes go through `SECURITY DEFINER` functions that check permissions:
  - `request_to_join`: not your own activity, not full, not cancelled or past, no duplicate active request, profile completed.
  - `respond_to_join_request`: organiser only. It locks the activity row (`FOR UPDATE`) and rechecks capacity, so concurrent accepts are serialised.
  - `cancel_join_request`: only your own request.
- **Unique `(activity_id, user_id)`** stops duplicate requests. A trigger keeps `confirmed_count` in sync, and `CHECK (confirmed_count <= max_participants)` is a final guarantee.
- **Visibility:**
  - Pending requests and notes are visible only to the requester and the organiser.
  - Confirmed participants are visible only to signed-in users.
  - Emails and phone numbers are never shown.
- **Images:** uploads go to `avatars/<uid>/…` or `activity-covers/<uid>/…` (storage policies). The server rejects image URLs outside the user's own folder.
- **No service-role key** is used anywhere in the app.

---

## Setup

### 1. Install

```bash
npm install
```

### 2. Create a Supabase project

1. Go to <https://supabase.com/dashboard> → **New project**.
2. In **Project Settings → API**, copy the **Project URL** and the **anon / publishable key**.

### 3. Environment variables

```bash
cp .env.example .env.local
```

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL, e.g. `https://abcd.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon / publishable key |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` locally, your Vercel URL in production |

### 4. Run the database migration

**Option A — Supabase CLI (recommended):**

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

**Option B — Dashboard:** open **SQL Editor**, paste the full contents of `supabase/migrations/20261125000000_init.sql`, then run it. This creates the tables, RLS policies, functions and the `avatars` / `activity-covers` storage buckets.

### 5. Seed demo activities

In **SQL Editor**, paste and run `supabase/seed.sql`. This creates:

- 4 clearly labelled **sample host accounts**. They cannot log in, and their bios say they are sample accounts.
- 10 upcoming Mumbai activities (badminton in Bandra, cycling in Powai, pottery in Andheri, board games in Lower Parel, a Marine Drive walk, a Kanheri Caves trek, cafe hopping, Juhu football, and more).

Dates are relative to *today* in IST, with the weekend plans landing on the coming Saturday and Sunday. **Re-run the seed any time to move the dates forward.** Before a real launch, run `supabase/remove_demo_data.sql`.

### 6. Configure Auth

In **Authentication → URL Configuration**:

- **Site URL:** `http://localhost:3000` (change it to your Vercel URL after deploying).
- **Redirect URLs:** add `http://localhost:3000/auth/callback` and `https://<your-app>.vercel.app/auth/callback`.

**Email confirmation:** Supabase enables "Confirm email" by default.

- **Keep it on (recommended for real users):** after sign-up, users see "check your inbox", click the link, land on `/auth/callback`, then go to onboarding. Supabase's built-in email sender is rate-limited, so for a public launch set up custom SMTP (**Authentication → Emails → SMTP**).
- **For a quick demo/buildathon:** turn off **Authentication → Providers → Email → Confirm email**. Users then go straight to onboarding after sign-up.

### Password reset ("Forgot password?")

The login page links to `/forgot-password`. The user enters their email, and Supabase sends a reset email. The link goes through `/auth/callback` to `/reset-password`, where the user sets a new password and is logged in.

For this to work on your hosted project:

1. **Allow the redirect.** In **Authentication → URL Configuration → Redirect URLs**, add `https://<your-app>.vercel.app/**`. You can also add `http://localhost:3000/**` for local dev.
2. **Use the cross-device email template (recommended).** In **Authentication → Emails → Reset Password**, replace the message body with the contents of `supabase/templates/recovery.html`. Its link includes a one-time token, so it works even if the user opens the email on a different device from the one they requested it on. With Supabase's default template, the link only works in the browser that requested it; anywhere else the user is sent back to request a new link.
3. **Email limits.** Supabase's built-in email service only sends a few emails per hour. Set up custom SMTP before a real launch (**Authentication → Emails → SMTP Settings**).

Locally, `supabase start` already uses this template (see `supabase/config.toml`).

### 7. Run locally

```bash
npm run dev
```

Then open <http://localhost:3000>.

### Alternative: fully local Supabase (Docker)

```bash
npx supabase start
```

`supabase start` applies the migration and `seed.sql` automatically. Email confirmation is off locally. It prints the API URL and anon key; put them in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key from `npx supabase status`>
```

```bash
npm run dev
```

To reset the local database (and re-seed):

```bash
npx supabase db reset
```

---

## Checks and tests

```bash
npm run typecheck
```

```bash
npm run lint
```

```bash
npm run build
```

Database security + race-condition tests (local Supabase, or set `DB_URL`):

```bash
npm run db:test
```

Full two-user browser flow. The app must be running, and email confirmation must be off. The test creates real test accounts, so **use a local or dev database**:

```bash
npm i -D playwright && npx playwright install chromium
```

```bash
BASE_URL=http://localhost:3000 npm run e2e
```

## Deploy to Vercel

1. Push this repo to GitHub.
2. In Vercel, **Add New → Project**, import the repo, and keep the default framework settings (Next.js).
3. Add the environment variables `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `NEXT_PUBLIC_SITE_URL=https://<your-app>.vercel.app`.
4. Deploy.
5. In Supabase **Authentication → URL Configuration**, set **Site URL** to the Vercel URL and add `https://<your-app>.vercel.app/auth/callback` to the redirect URLs.

## Demo: the two-user join workflow

Use two browsers, or one normal window and one private window.

1. **User A:** go to `/signup` and create an account (e.g. Aditi), then complete onboarding: tick the 18+ box, choose a neighbourhood, and pick interests.
2. **User A:** go to **Create Activity**. Enter "Sunday Badminton", category Sports, a future date, a venue, Bandra, and group size 4. Click **Publish**. You land on the activity page, which says "You're organising this".
3. **User B:** in the other browser, sign up and complete onboarding (e.g. Bilal).
4. **User B:** go to **Discover**, search "badminton" or tap **Sports**, and open the activity.
5. **User B:** click **Request to join**, add a note, and click **Send**. The page shows **Request pending**.
6. **User A:** open **Dashboard → To review**. Bilal's request and note appear. Click **Accept**.
7. **User B:** refresh the activity page. It shows **You're going! 🎉** and **Dashboard → I've joined** shows **Accepted**.
8. Both users now see Bilal under **Who's going**, and the counter reads **1 of 4 spots filled**.

**Optional extras to demo:**

- A third user requests to join and A declines them; they see **Request declined**.
- Set the group size to 1 to see **Activity full**.
- Cancel a pending request from **Dashboard → My requests**.
- Report an activity.

## Known limitations

- **Notifications:** status changes appear when users load or refresh a page; there are no emails or push notifications for requests.
- **Report moderation:** reports are stored in the `reports` table. There is no admin UI yet, so review them in the Supabase table editor.
- **Account deletion:** this is manual (by request), as stated on the privacy page.
- **Location scope:** the city is fixed to Mumbai, and neighbourhoods come from a fixed list in `src/lib/constants.ts`.
- **Time zone:** all times are in IST.
- **Verification:** age is self-declared (18+ checkbox). There is no ID verification, and the UI never claims users are verified.
