# Arkitektur og drift

## Stack

- **Frontend:** Next.js 16.2.9 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS 4, Framer Motion, Lucide, Radix Dialog (via `src/components/Modal.tsx`)
- **Backend:** Supabase (projekt `nkurrrzqwgjwwtnjnluk`) — Auth, Postgres med RLS, Storage, Realtime
- **Hosting:** Vercel — auto-deploy fra `main` → https://job-match-ecru.vercel.app

## Vigtige mapper

- `src/app/student|manager|dashboard` — de tre brugerflader (hver med egen Shell + server-guard i layout)
- `src/components/` — `ChatView`, `NotificationBell`, `Modal`, `Logo`, `student/SwipeCard`, `student/MatchCelebration`, `manager/StudentCard`
- `src/lib/` — Supabase-klienter, `types/database.ts` (alle DB-typer + label-maps), `storage.ts` (`resolveMediaUrl` → signerede URL'er), `url.ts` (`safeExternalHref`), danske postnumre + skoler

## Database (nøgletabeller)

`profiles` (alle brugere, rolle + org + multi-select-uddannelser) · `organizations` (skoler) · `stores` (+ `video_url`, `job_description_url`, `manager_id`) · `store_chains` (+ fælles `job_description_url`) · `swipes` · `matches` (+ `agreement_confirmed_at/by`) · `messages` (chat, realtime) · `notifications` (trigger-oprettet, realtime) · `follow_ups`

**Konventioner:** manager-swipes gemmes med `profile_id = elevens id` og `swiper_role='store_manager'`. Matches oprettes af DB-trigger, når begge har swipet højre.

## Storage

- `student-media` (public): avatarer, butikslogoer/-videoer, kæde-jobopslag — stier `<mappe>/<userId>/<fil>` (RLS tjekker `auth.uid()`)
- `video-pitches` (privat, 100 MB, video-mime) og `student-docs` (privat, 10 MB, pdf/word): DB gemmer kun stien; `resolveMediaUrl()` laver signerede URL'er

## Gotchas

- **Next.js 16** har breaking changes — læs `node_modules/next/dist/docs/` før ukendte API'er
- `100dvh`, aldrig `100vh` (iOS Safari)
- `window.location.href` efter login/signup — `router.push()` kan hænge på mobil
- Nye tabeller kræver eksplicitte RLS-policies, ellers tomme svar
- SQL-oprettede auth-brugere: token-felter = `''`, ikke NULL; identities-række kræves
- PostgREST returnerer maks. 1000 rækker — dashboardet paginerer med `fetchAll`
- Supabase Auth Site URL + redirect (`/auth/callback`) skal sættes i Supabase-dashboardet for bekræftelsesmails

## Kendte begrænsninger

- Push-notifikationer er in-app + `new Notification()` — rigtig web-push (VAPID) er på roadmappet
- Ældre offentlige CV-/videofiler (2 CV'er + 1 video testdata) er ikke migreret til de private buckets
- Realtime kræver WebSockets — virker i produktion, men kan ikke testes fra CI-/sandbox-miljøer uden WS-support

## Historik (større milepæle)

1. Aurora-redesign + Match Spark-logo
2. Sikkerhedsbatch: server-guards, RLS-hærdning, private buckets
3. Funktionalitets-, tilgængeligheds- og designkonsistens-batches (inkl. zoom-fix og Radix-fokus)
4. Admin-dashboard + seedet matching-scenarie
5. Kæder + Excel-import med automatisk chef-oprettelse
6. Chat, notifikationer og butiksvideoer
7. E2E-verifikation med rigtig auth (Playwright mod produktion)
8. "Varm"/logo-duo-redesign af hele appen + swipe-UX-forbedringer
