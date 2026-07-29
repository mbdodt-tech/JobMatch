# CLAUDE.md

> Operating manual for Claude Code in this repo.
> This file loads on EVERY message — keep it lean. Instructions and pointers, not documentation.

## Project
- **Name:** JobMatch
- **What it is:** Tinder-style internship matching app for Danish vocational students (erhvervselever). Students and store managers swipe to find internship matches. School admins get a KPI dashboard.
- **Users:** Erhvervselever (students), butikschefer (store managers), skoleadministratorer (school admins)
- **Status:** MVP / prototype — not yet in production with real users

## Tech stack
- **Framework:** Next.js 16.2.9 (App Router, Turbopack) — React 19, TypeScript
- **Styling:** Tailwind CSS 4 + Framer Motion for animations
- **Icons:** Lucide React
- **Backend:** Supabase — Auth, Postgres (RLS enabled), Storage
- **Hosting:** Vercel — auto-deploys from `main` branch to `job-match-ecru.vercel.app`
- **Supabase project ID:** `nkurrrzqwgjwwtnjnluk`

## Commands
- Install: `npm install`
- Dev: `npm run dev` (Turbopack)
- Build: `npx next build`
- Lint: `npx eslint`
- Deploy: push to `main` — Vercel auto-deploys

## Conventions

### Language
- **UI text:** Always in **Danish** (labels, placeholders, error messages, empty states)
- **Code:** English (variable names, function names, types, interfaces)
- **Comments:** English — but default to NO comments. Only when the WHY is non-obvious.
- **Commits:** English, imperative style ("Fix loading bug", "Add store section")

### Code style
- Follow existing patterns in the codebase — consistency over preference
- Tailwind utility classes for styling, no separate CSS files (except `globals.css`)
- `'use client'` directive on all interactive pages (App Router default is server components)
- Prefer `window.location.href` over `router.push()` for post-auth navigation (prevents loading spinner stuck on mobile)
- Use `100dvh` instead of `100vh` for proper mobile viewport handling

### Design principles
- **Dark theme only** — background `#0A0A0F`, text `#F8FAFC`, muted `#64748B`
- **Mobile-first** — max-w-md for phone screens, responsive breakpoints for dashboard
- **Glassmorphism cards** — `bg-white/5 backdrop-blur-xl border border-white/10`
- **Gradient accents** — purple-to-blue for student UI, emerald-to-teal for auth pages, green for matches
- **Framer Motion** for page transitions, card animations, and micro-interactions
- **All text must stay inside its container** — use `min-w-0`, `truncate`, `break-words`, `flex-wrap` as needed
- Input fields: `rounded-2xl`, `py-4`, `text-base` for comfortable mobile tapping

### Communication
- **Respond in Danish** to the user unless they switch to English
- Don't ask unnecessary questions — make a decision and explain it
- When something is deployed, mention that Vercel auto-deploys from main
- Always merge feature branch to main and push when changes are ready

## Architecture map

### App routes (`src/app/`)
- `/login` and `/signup` — auth pages (emerald/teal theme)
- `/student/feed` — swipe card stack (Tinder-style)
- `/student/matches` — matches + liked stores (awaiting match)
- `/student/chat/[matchId]` + `/manager/chat/[matchId]` — in-app chat per match (messages table, realtime)
- `/student/profile` — editable profile page
- `/student/settings` — notifications, account settings
- `/student/onboarding` — 4-step onboarding (personal info → education → behavioral test → video/GDPR)
- `/manager/feed` — swipe through student cards
- `/manager/matches` — store manager's matches
- `/manager/store` — store profile editing (address, logo, job description PDF)
- `/manager/settings` — manager settings
- `/dashboard/` — school admin KPI overview
- `/dashboard/students` — student list with filters
- `/dashboard/stores` — store overview with stats
- `/dashboard/follow-up` — at-risk student tracking

### Shared code (`src/lib/`)
- `supabase/client.ts` — browser Supabase client
- `supabase/server.ts` — server-side Supabase client
- `supabase/middleware.ts` — auth session refresh middleware
- `types/database.ts` — all DB types, enums, label maps, color maps
- `data/danish-postal-codes.ts` — 612 postal codes → city name lookup
- `data/danish-schools.ts` — 85 Danish schools (erhvervsskoler + gymnasier)

### Components (`src/components/`)
- `student/SwipeCard.tsx` — draggable swipe card for store feed
- `student/MatchCelebration.tsx` — match animation overlay
- `manager/StudentCard.tsx` — student card for manager feed

## Database schema (key tables)
- `profiles` — all users (students, managers, admins). Has `role`, `organization_id`, `education_line`, `primary_style`, `secondary_style`, `onboarding_completed`
- `organizations` — schools/erhvervscentre that students belong to
- `stores` — businesses offering internships. Linked to a `manager_id` (profile)
- `swipes` — records every swipe (left/right) by both students and managers
- `matches` — created when both parties swipe right on each other
- `store_chains` — optional grouping of stores by brand

## Known gotchas

### Next.js version
**This is Next.js 16** which has breaking changes from training data. Always read `node_modules/next/dist/docs/` before using unfamiliar APIs. @AGENTS.md

### Supabase RLS
All tables have Row Level Security enabled. New tables require explicit policies or queries return empty. The `profiles` table has a `students_need_org` check constraint — students MUST have an `organization_id`.

### Auth user creation via SQL
When creating test users directly in SQL, ALL token fields (`confirmation_token`, `recovery_token`, etc.) must be empty strings `''`, not NULL. NULL causes auth failures.

### Storage
- `student-media` bucket is **public**, no size/mime restrictions
- Upload paths use `foldername/userId/filename` pattern (RLS checks `auth.uid()`)
- Used for both student uploads (videos, CVs) and store manager uploads (job descriptions, logos)
- `video-pitches` bucket exists but is private — not actively used

### Mobile viewport
Use `100dvh` not `100vh` — iOS Safari's dynamic toolbar causes `100vh` to overflow.

### Post-auth navigation
Use `window.location.href` instead of `router.push()` after login/signup. Client-side navigation can hang on mobile, leaving the loading spinner stuck forever.

### Postal code auto-fill
Both student onboarding and store manager pages use `DANISH_POSTAL_CODES` lookup. When a valid 4-digit code is entered, the city field auto-fills and becomes read-only.

## Test accounts
Password for all: `Test1234!`

**Students (onboarded):** emil@test.jobmatch.dk, sofia@test.jobmatch.dk, oliver@test.jobmatch.dk, ida@test.jobmatch.dk, freja@test.jobmatch.dk
**Students (not onboarded):** ny.elev@test.jobmatch.dk, anna@test.jobmatch.dk, mikkel@test.jobmatch.dk, line@test.jobmatch.dk
**Store managers:** lars@magasin.dk, anne@matas.dk, peter@ikea.dk
**School admin:** admin@cphbusiness.dk

**Matching-scenario (seeded July 2026, multi-select arrays populated):**
- Students: noah@, alma@, william@, ella@, lucas@, karla@ (all @test.jobmatch.dk, onboarded)
- Managers/stores: mette@bilka.dk (Bilka One Fields), jonas@normal.dk (NORMAL Nørrebrogade), sara@elgiganten.dk (Elgiganten Fields), thomas@dsv.dk (DSV Air & Sea Kastrup), camilla@bestseller.dk (BESTSELLER Showroom København)
- Built-in story: Noah×NORMAL, William×DSV, Ella×BESTSELLER are matched; Alma + Karla await manager swipes (visible in manager feeds); Lucas is at-risk (6 right-swipes, 0 matches, inactive 10 days, rejected by Bilka)

## Do / Don't
- ✅ Always merge to `main` and push when changes are done (Vercel deploys automatically)
- ✅ Check `types/database.ts` before writing new queries — types must match the DB schema
- ✅ Use `min-w-0`, `truncate`, `flex-wrap` to prevent text overflow on mobile
- ✅ Test that input fields and buttons are large enough for touch targets (min `py-4`)
- ✅ Keep this file updated when decisions are made
- ❌ Never hardcode Supabase credentials — use environment variables
- ❌ Never disable RLS to "make it work" — write a proper policy
- ❌ Never use `router.push()` for post-auth redirects — use `window.location.href`
- ❌ Never use `100vh` — use `100dvh` for mobile
- ❌ Don't paste large files into chat — give the path, Claude reads it
