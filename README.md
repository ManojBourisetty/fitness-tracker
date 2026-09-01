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

**None are required.** The app has no backend calls and no API keys; all
data lives in the browser (see below). If you later add a real backend,
document its connection string / keys here and in your Vercel project's
Environment Variables settings.

## Data & persistence

All user data — profile, weight entries, step entries, workout history,
difficulty ratings/notes, and the in-progress workout session — is stored
in `localStorage` through a single Zustand store
(`lib/store/useAppStore.ts`) using the `persist` middleware. Data survives
refreshes and navigation, and nothing is lost mid-workout if the tab is
closed (the active session is persisted too).

This was a deliberate choice over provisioning a database for this build:
the app has exactly one user (you), nothing here needs to be shared across
devices yet, and Vercel's serverless functions have no durable filesystem
of their own — a database would mean provisioning and wiring up a real
service (e.g. Postgres/Supabase) with credentials this environment doesn't
have. The persistence layer is written as a swappable adapter, though:
`zustand/middleware`'s `persist` takes any object with `getItem` /
`setItem` / `removeItem`. To move to a real backend later, replace the
`storage: createJSONStorage(() => localStorage)` line in
`lib/store/useAppStore.ts` with a small adapter that calls your API — no
component or page needs to change.

Data model (`lib/types.ts`) is intentionally decoupled from the UI:
`Exercise`, `Workout`, `WorkoutSection`, `WorkoutExercise`, `UserProfile`,
`WeightEntry`, `StepEntry`, `WorkoutHistoryEntry`. The exercise library
(`lib/data/exercises.ts`) and the weekly program (`lib/data/program.ts`)
are plain data — adding a new exercise or an entirely new weekly program
is a data change, not a UI change.

## Apple Health integration

**A web app cannot read from or write to Apple Health.** HealthKit is a
native iOS framework with no web API or browser bridge — this is an iOS
platform limitation, not something any web app (installed as a PWA or
not) can work around, and this app does not claim otherwise anywhere in
the UI (every step/weight entry is explicitly labeled "Manual entry").

The data model already anticipates it, though:

- `StepEntry` and `WeightEntry` both carry a `source: "manual" | "apple-health"`
  field, so once real data arrives from a synced source it renders
  identically to manual entries, just tagged differently.
- The Profile screen has a "Data Sources" section that currently shows
  "Manual entry" for steps/weight/heart-rate and explains the limitation.
- The Progress screen's "Fitness" section (resting HR, walking HR, VO₂ max)
  is already laid out and will populate the moment that data exists —
  it currently shows an explanatory empty state instead of fake numbers.

**Planned integration path:** a small native companion (a thin iOS app or
a Shortcuts automation using HealthKit) that periodically POSTs
steps/weight/heart-rate/VO₂max to a backend API, which then upserts
`StepEntry`/`WeightEntry` rows with `source: "apple-health"`. That
requires (a) the swappable persistence backend described above, and (b) a
minimal API route or serverless function to receive the sync payload —
neither exists yet in this build, by design, since it needs an actual
native shell to call it.

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
app/                       Next.js App Router routes (all client components —
                            this app is inherently personal/local-storage-driven,
                            so there's no server-rendering benefit to chase)
  page.tsx                 Home dashboard
  workout/                 Weekly plan browser + interactive session + rest timer
  exercises/                Library + per-exercise detail
  progress/                Weekly progress, weight, steps, history
  profile/                 Editable profile, theme, data reset

components/                 Presentational + interactive UI (nav, cards, charts,
                            progress rings, the exercise animation system, timers)

lib/
  types.ts                  Core data model
  data/exercises.ts         Exercise library (single source of truth)
  data/program.ts           7-day weekly program (references exercises by id)
  store/useAppStore.ts      Zustand store + persistence
  progression.ts             Adherence-driven volume progression
  coach.ts                   Weekly review generator (real data only)
  derived.ts, utils.ts, workoutSteps.ts   Small pure helpers

public/
  manifest.webmanifest, icons/, sw.js     PWA + offline shell
```

## Deployment (Vercel)

The app is a standard Next.js project — Vercel auto-detects the framework,
so `vercel.json` isn't needed. To deploy:

1. Import the GitHub repository into a new Vercel project (Framework
   Preset: Next.js, no environment variables required).
2. Set the production branch to whichever branch has this app (Vercel
   deploys `main` by default).
3. Deploy — no build configuration overrides are needed.

## Limitations / what's next

- **Apple Health / native sync** is not implemented (see above) — it needs
  a native companion and a small API, both out of scope for a web-only build.
- **Resting/walking heart rate and VO₂ max** have no manual-entry UI yet
  (they're not the kind of number people type in by hand) — they'll light
  up once a synced data source exists.
- Data is per-device (`localStorage`); it does not sync across your phone,
  tablet, and laptop yet. That requires the backend swap described in
  **Data & persistence**.
- The exercise "animations" are original CSS/SVG stick-figure loops, not
  photographic or video demonstrations, by design (fast-loading,
  copyright-free, theme-aware, and legible at a glance).
