# AceTheDAT Portal

Local-first Vite + React portal scaffold for AceTheDAT. This repo is intentionally separate from the public marketing site so Thomas can run, review, and later deploy the portal on its own Netlify app or subdomain.

## Project Structure

```text
src/
  app/
    App.jsx
    providers/PortalProvider.jsx
  components/
    charts/
    common/
    layout/
  config/
    appConfig.js
    navigation.js
  data/
    demoUsers.js
    payments.js
    sessions.js
    students.js
    weeklyPlans.js
  features/
    schedules/utils.js
  layouts/
    AuthLayout.jsx
    PortalLayout.jsx
  lib/
    adapters/localStorageAdapter.js
    api/createPortalApi.js
    repositories/
  pages/
    auth/
    coach/
    shared/
    student/
  routes/
    AppRoutes.jsx
    guards.jsx
  styles/
    index.css
  utils/
    date.js
    formatters.js
    selectors.js
```

## Stack

- React 18
- Vite
- React Router
- Recharts
- Plain CSS with shared tokens/components
- Local storage for demo session + weekly plan persistence

## Install

```bash
npm install
```

## Run Locally

```bash
npm run dev
```

Default app URL:

```text
http://localhost:5173
```

## Build

```bash
npm run build
```

## Demo Mode

- The app starts in `demo` mode by default via `VITE_PORTAL_DATA_SOURCE=demo`.
- Seeded students, payments, sessions, and weekly plans live under [`src/data/students.js`](/Users/seangroebe/Development/acethedat-portal-v2/src/data/students.js), [`src/data/payments.js`](/Users/seangroebe/Development/acethedat-portal-v2/src/data/payments.js), [`src/data/sessions.js`](/Users/seangroebe/Development/acethedat-portal-v2/src/data/sessions.js), and [`src/data/weeklyPlans.js`](/Users/seangroebe/Development/acethedat-portal-v2/src/data/weeklyPlans.js).
- Demo login supports a coach workspace plus seeded student profiles.
- Weekly plan edits and completion state persist in browser local storage.
- Session switching is available from the portal header, so Thomas can flip between coach and student views without restarting the app.

## What’s Real vs Placeholder

Real now:

- Routed coach and student portal experiences
- Role guards
- Extracted seeded data modules
- Local repository abstraction
- Local storage persistence for session, weekly plans, and student self-assessments
- Coach dashboard, students, student detail, sessions, billing, schedules
- Student dashboard, self-assessment, weekly plan, payments, sessions
- Netlify-friendly SPA routing

Placeholder for later:

- Real authentication
- Supabase reads/writes
- Multi-user permissions
- Live invoice generation
- Real notifications / messaging

## Repository Pattern

Current data flow:

1. [`src/lib/api/createPortalApi.js`](/Users/seangroebe/Development/acethedat-portal-v2/src/lib/api/createPortalApi.js) chooses the active repository.
2. [`src/lib/repositories/demoPortalRepository.js`](/Users/seangroebe/Development/acethedat-portal-v2/src/lib/repositories/demoPortalRepository.js) serves seed data and persists plan/session/self-assessment changes locally.
3. [`src/app/providers/PortalProvider.jsx`](/Users/seangroebe/Development/acethedat-portal-v2/src/app/providers/PortalProvider.jsx) exposes shared portal state to the routed app.

This keeps UI code independent from where data comes from.

## Supabase Migration Readiness

Local repositories can later be swapped at these exact seams:

- Replace demo repository selection in [`src/lib/api/createPortalApi.js`](/Users/seangroebe/Development/acethedat-portal-v2/src/lib/api/createPortalApi.js).
- Implement live methods in [`src/lib/repositories/supabasePortalRepository.js`](/Users/seangroebe/Development/acethedat-portal-v2/src/lib/repositories/supabasePortalRepository.js).
- Keep [`src/app/providers/PortalProvider.jsx`](/Users/seangroebe/Development/acethedat-portal-v2/src/app/providers/PortalProvider.jsx) and the pages unchanged if the Supabase repository matches the same contract.
- Move seed-derived selectors into SQL-backed fetches gradually while preserving the selector outputs expected by pages in [`src/utils/selectors.js`](/Users/seangroebe/Development/acethedat-portal-v2/src/utils/selectors.js).

Likely Supabase tables later:

- `auth.users`
- `profiles`
- `students`
- `sessions`
- `weekly_plans`
- `payments`
- `invoices`
- `score_snapshots`
- `error_logs`

## Suggested Supabase Rollout

1. Add Supabase auth and map coach/student profiles.
2. Replace weekly plan persistence first, since that area already writes local state.
3. Move students, sessions, and payments into read-only Supabase tables.
4. Replace demo login with real auth guards.
5. Add invoice/payment mutations last once business workflow is settled.

## Netlify Deployment

Recommended deployment shape:

- `www.acethedat.com` for marketing
- `portal.acethedat.com` or `app.acethedat.com` for this repo

This repo already includes [`netlify.toml`](/Users/seangroebe/Development/acethedat-portal-v2/netlify.toml) with an SPA redirect.

Typical deploy steps:

1. Push this repo to GitHub.
2. Create a new Netlify site from the repo.
3. Set build command to `npm run build`.
4. Set publish directory to `dist`.
5. Add environment variables from [`.env.example`](/Users/seangroebe/Development/acethedat-portal-v2/.env.example).

## Notes

- Styling is intentionally lightweight and not tied to Tailwind or a large design system.
- The portal preserves the original seeded business context but removes the single-file prototype bottleneck.
- The current build is verified locally with `npm run build`.
