# Fitness — Your Personal Coach

A calm, mobile-first personal fitness companion: a structured 7-day home
workout program, guided/interactive workout mode, step and weight tracking,
workout history, and a weekly progress review — built as a real,
data-persistent app rather than a visual mockup.

This is **not** a bodybuilding/gym app. It's built around a single
beginner, no-equipment, low-impact home program that is meant to be
followed consistently and progressed gradually and safely.

## Product

- **Home** — today's workout, today's steps/weight, a 7-day activity strip.
- **Workout** — the full weekly plan, browsable by day, with a section-by-section
  breakdown of every exercise.
- **Workout Mode** — a dedicated, distraction-free interactive session: one
  exercise at a time, a large animated demonstration, a rep counter or a
  countdown timer, rest screens between exercises, pause/skip/previous, and
  a completion summary (duration, completion %, a 1–5 difficulty rating,
  optional notes) that's saved to history.
- **Exercises** — a searchable library of every exercise in the program,
  each with an original animated stick-figure demonstration, step-by-step
  instructions, a beginner modification, and common mistakes to avoid.
- **Progress** — weekly activity/consistency stats, a weight trend chart,
  a workout history log, and a rule-based "weekly coach review" generated
  entirely from your own tracked data (no fabricated stats).
- **Profile** — editable profile (height, starting weight, experience,
  equipment, goals, step target), light/dark/system theme, and a data
  reset control.

Every exercise card and workout screen includes a visible reminder that
this is a fitness tracker, not a medical device, plus an in-workout
"Feeling unwell?" safety prompt that lists warning symptoms (chest pain,
fainting, severe dizziness/shortness of breath/pain) and a one-tap way to
stop the workout.

## Technology

- **Next.js 16** (App Router, Turbopack) + **React 19** + **TypeScript**
- **Tailwind CSS v4** for styling, with a custom light/dark design-token
  system (`app/globals.css`) — no component library, so the UI stays
  small and consistent
- **Zustand** (`lib/store`) with the `persist` middleware for client-side
  state + persistence
- **next-themes** for light/dark/system theme switching
- Hand-written, dependency-free **SVG + CSS exercise animations**
  (`components/ExerciseFigure.tsx`) — original artwork, no licensing
  concerns, no image/video downloads, respects `prefers-reduced-motion`
- A hand-written **service worker** (`public/sw.js`) + web app manifest for
  installable, offline-friendly PWA behavior
- No backend/database service is provisioned for this build — see
  **Data & persistence** below for why, and how to add one later

## Getting started

```bash
npm install
npm run dev       # http://localhost:3000
```

```bash
npm run build      # production build (Turbopack)
npm run start       # serve the production build
npx eslint .        # lint (flat config, includes React Compiler rules)
```

Requires Node.js 20.9+ (Next.js 16 minimum) and no environment variables —
see **Environment variables** below.

## Environment variables

Core app features need none. Apple Health sync (see below) needs three,
set in Vercel Project Settings → Environment Variables:

| Variable | Value |
| --- | --- |
| `SUPABASE_URL` | `https://bpsmpimotanqglapqqut.supabase.co` |
| `SUPABASE_ANON_KEY` | The project's publishable key (Supabase dashboard → Settings → API) |
| `HEALTH_SYNC_TOKEN` | A private random secret you generate — required by both `/api/health-sync` and the Profile screen |

For local development, put the same three in `.env.local` (already
gitignored).

## Data & persistence

All user data — profile, weight entries, step entries, workout history,
difficulty ratings/notes, and the in-progress workout session — is stored
in `localStorage` through a single Zustand store
(`lib/store/useAppStore.ts`) using the `persist` middleware. Data survives
refreshes and navigation, and nothing is lost mid-workout if the tab is
closed (the active session is persisted too).

This was a deliberate choice for manually-entered data: the app has
exactly one user (you), and `localStorage` is simpler than provisioning
auth for data that never needs to be written from anywhere but your own
browser. The persistence layer is written as a swappable adapter, though:
`zustand/middleware`'s `persist` takes any object with `getItem` /
`setItem` / `removeItem`. To move it to a real backend later, replace the
`storage: createJSONStorage(() => localStorage)` line in
`lib/store/useAppStore.ts` with a small adapter that calls your API — no
component or page needs to change.

Synced Apple Health data is different: it needs to be written from your
phone (see below), which a browser's `localStorage` can't receive. That
half of the data lives in a small Postgres table on Supabase instead, and
the two are merged at render time (`lib/mergeHealth.ts`) — a synced entry
for a given day always takes precedence over a manual one for that day.

Data model (`lib/types.ts`) is intentionally decoupled from the UI:
`Exercise`, `Workout`, `WorkoutSection`, `WorkoutExercise`, `UserProfile`,
`WeightEntry`, `StepEntry`, `WorkoutHistoryEntry`. The exercise library
(`lib/data/exercises.ts`) and the weekly program (`lib/data/program.ts`)
are plain data — adding a new exercise or an entirely new weekly program
is a data change, not a UI change.

## Apple Health integration

**A web app cannot read from or write to Apple Health directly.** HealthKit
is a native iOS framework with no web API or browser bridge — that's a
platform limitation, not something any web app (PWA or not) can work
around. So this app integrates through the **Health Auto Export** iOS app
instead: it reads Health data and pushes it to a webhook on a schedule.

### How it works

```
Apple Health → Health Auto Export (iOS) → POST /api/health-sync → Supabase → /api/health-data → app UI
```

- **`app/api/health-sync`** (`POST`) — the webhook Health Auto Export calls.
  Requires `Authorization: Bearer <HEALTH_SYNC_TOKEN>`. Parses the export's
  JSON (`lib/healthAutoExport.ts`) and upserts normalized rows.
- **Supabase** — one table, `health_metrics` (`metric`, `date`, `value`,
  `source`), with Row Level Security enabled and **no permissive
  policies** — direct table access via the REST API is blocked entirely.
  The only way in is two `security definer` RPC functions
  (`health_metrics_upsert` / `health_metrics_read`), reachable only after
  the bearer-token check in the route handler passes.
- **`app/api/health-data`** (`GET`) — what the app's own frontend calls to
  read synced rows back, gated by the same token (entered once in
  Profile → Apple Health Sync, stored in `localStorage`).
- **`lib/mergeHealth.ts`** — merges synced rows into the Steps, Weight,
  Home, and Progress screens; a synced day's entry always wins over a
  manually-entered one for that same date. Synced entries show a "Synced"
  badge and can't be deleted from the app (they'd just reappear on the
  next export).

Metrics synced today: **steps, walking/running distance, weight, resting
heart rate, walking heart rate, and Apple Exercise Time** (populates the
Progress screen's "Fitness" section and weekly exercise-minutes stat).
VO₂ max isn't wired up yet — see Limitations.

### Setting it up

1. **Deploy first.** The three environment variables above must be set on
   the Vercel project (Supabase URL/key are in this README; generate your
   own `HEALTH_SYNC_TOKEN`, e.g. `openssl rand -hex 24`).
2. In the app, go to **Profile → Apple Health Sync**, paste the same
   token into "Sync token", and tap **Save Token**, then **Test
   Connection** to confirm it's accepted.
3. Copy the **Webhook URL** shown there (`https://<your-domain>/api/health-sync`).
4. In **Health Auto Export** on your iPhone: create a new **Automation** →
   **REST API** export. Set the URL to the webhook URL from step 3, add
   header `Authorization: Bearer <your token>`, select the metrics
   (Steps, Walking + Running Distance, Weight, Resting Heart Rate, Walking
   Heart Rate Average, Apple Exercise Time), set the aggregation to
   **Daily**, and set a schedule (e.g. once a day).
5. Run the automation once manually from the app to backfill today, then
   let it run on schedule.

The parser in `lib/healthAutoExport.ts` is intentionally tolerant of shape
drift (unrecognized metric names/points are skipped, not fatal) since its
exact JSON shape wasn't verified against a live export while building
this — if a metric doesn't show up after a real sync, check the Vercel
function logs for `/api/health-sync` and adjust the `METRIC_NAME_MAP`
there.

## Progressive training

The initial two weeks run at baseline volume. From week 3 on,
`lib/progression.ts` looks at your last two weeks of real
`WorkoutHistoryEntry` data (completion % and self-reported difficulty) and:

- increases rounds/reps slightly if completion has been high (≥80%) and
  difficulty has been comfortable (≤3/5),
- holds steady if difficulty has been consistently high (4–5/5),
- and never increases (and eases back to baseline) if completion has
  dropped below 60%.

This is intentionally simple and rule-based, not a black box — the
`lib/coach.ts` weekly review is generated the same way, from your actual
logged workouts, steps, and weight, never invented.

## Safety

This app is a fitness tracker, not a medical device: it does not diagnose
anything, and the initial program deliberately avoids running, jumping,
burpees, high-impact HIIT, and max-effort cardio. During any workout, a
"Feeling unwell?" link opens a list of stop-and-seek-medical-attention
symptoms (chest pain, fainting, severe dizziness, severe shortness of
breath, severe pain) with a one-tap way to end the session.

## Architecture overview

```
app/                       Next.js App Router routes (pages are all client
                            components -- this is a personal, local-storage-
                            driven app, so there's no server-rendering
                            benefit to chase there)
  page.tsx                 Home dashboard
  workout/                 Weekly plan browser + interactive session + rest timer
  exercises/                Library + per-exercise detail
  progress/                Weekly progress, weight, steps, history
  profile/                 Editable profile, theme, Apple Health sync, data reset
  api/health-sync/         POST -- Health Auto Export webhook receiver (server)
  api/health-data/         GET -- synced data for the frontend (server)

components/                 Presentational + interactive UI (nav, cards, charts,
                            progress rings, the exercise animation system, timers)

lib/
  types.ts                  Core data model
  data/exercises.ts         Exercise library (single source of truth)
  data/program.ts           7-day weekly program (references exercises by id)
  store/useAppStore.ts      Zustand store + persistence
  progression.ts             Adherence-driven volume progression
  coach.ts                   Weekly review generator (real data only)
  supabaseServer.ts, healthSyncAuth.ts, healthAutoExport.ts   Health-sync backend
  useHealthMetrics.ts, mergeHealth.ts   Health-sync frontend fetch + merge
  derived.ts, utils.ts, workoutSteps.ts   Small pure helpers

public/
  manifest.webmanifest, icons/, sw.js     PWA + offline shell
```

## Deployment (Vercel)

The app is a standard Next.js project — Vercel auto-detects the framework,
so `vercel.json` isn't needed. To deploy:

1. Import the GitHub repository into a new Vercel project (Framework
   Preset: Next.js).
2. Set the production branch to whichever branch has this app (Vercel
   deploys `main` by default).
3. Add the three environment variables from **Environment variables**
   above if you want Apple Health sync working (core app features work
   without them).
4. Deploy — no build configuration overrides are needed.

## Limitations / what's next

- **VO₂ max** isn't synced yet — Health Auto Export exposes it, but it
  wasn't part of the first metric set; add `vo2_max` to the `metric` check
  constraint in the Supabase migration and to `METRIC_NAME_MAP` in
  `lib/healthAutoExport.ts` to add it.
- The Health Auto Export JSON shape in `lib/healthAutoExport.ts` was
  written from general knowledge of the app's "REST API automation"
  format, not verified against a live export — see the note at the end of
  **Apple Health integration** if a metric doesn't appear after a real sync.
- Manually-entered data (workout history, difficulty ratings, notes,
  profile) is still per-device (`localStorage`) and doesn't sync across
  your phone/tablet/laptop. Only step/weight/heart-rate/exercise-minutes
  data synced via Apple Health is shared, since that's the data that now
  lives in Supabase rather than the browser.
- The Apple Health sync token is a single shared secret (not per-user
  auth) — reasonable for a single-user personal app, but rotate it via
  Profile + the Vercel env var if it's ever exposed.
- The exercise "animations" are original CSS/SVG stick-figure loops, not
  photographic or video demonstrations, by design (fast-loading,
  copyright-free, theme-aware, and legible at a glance).
