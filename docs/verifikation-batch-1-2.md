# Verifikation af Batch 1 & 2 (kør i Claude Code)

> Bemærk: den automatiske browser-scanner (`app-review`) og en pålidelig kode-verifikation kan
> ikke køres fra cloud-sessionen (blokeret browser-egress + cloud-fil-broen serverede forældede
> kopier). Kør derfor dette i Claude Code, hvor filerne er ægte og kan kompileres.

## 1. Byg — fanger type/lint-fejl
```
npm run build
```
Skal være grøn. Ret bl.a. eventuelle **ubrugte imports** (tjek fx `dashboard/follow-up/page.tsx`
for en ubrugt `Clock`-import fra lucide-react → `@typescript-eslint/no-unused-vars`).

## 2. Batch 1 — rolle-guard (manuel test)
- Log ind som **elev** → gå til `/dashboard` og `/manager/feed` → skal begge redirecte til `/login`.
- Log ind som **skole-admin** → `/dashboard` skal virke; som **butikschef** → `/manager/feed` skal virke.
- Bekræft at `src/app/{manager,student,dashboard}/layout.tsx` er **server-komponenter** (ingen
  `'use client'`, `async function`, laver `getUser()` + rolle-tjek + `redirect`), og at den gamle
  UI ligger i `*Shell.tsx` (`'use client'`).

## 3. Batch 2 — funktionalitet (paste-in prompt til Claude Code)
> Verificér i de faktiske filer, om følgende Batch 2-rettelser er anvendt korrekt, og ret dem der
> mangler. Rapportér ANVENDT/IKKE ANVENDT pr. punkt med fil+linje:
>
> 1. `src/app/student/feed/page.tsx` → `handleSwipe`: har den en `swiping`-lås (`if (swiping) return`
>    + `setSwiping`), `try/finally`, og tjekker `error` på `insert`? Og bruger match-opslaget
>    `profile_id = user.id` + `swiper_role = 'store_manager'` (IKKE `profile_id = store.manager_id`)?
> 2. `src/app/manager/feed/page.tsx`, `src/app/student/matches/page.tsx`,
>    `src/app/manager/matches/page.tsx`: sætter alle tidlige `if (!user) return` også `loading=false`
>    (helst via `try/finally`), og er der en fejltilstand/retry i stedet for evig spinner?
> 3. `src/app/dashboard/page.tsx` og `src/app/dashboard/students/page.tsx`: er de serielle
>    `for … await count`-løkker erstattet af aggregeret query eller `Promise.all`? Tjekkes `error`?
> 4. `src/app/dashboard/follow-up/page.tsx`: har "Send besked" en `onClick`, og persisteres
>    "Markér kontaktet" til Supabase (ikke kun lokal state)?
> 5. Sæt `last_active_at` ved feed-load (så dashboardets "aktive denne uge" virker).
>
> Ret alt der står som IKKE ANVENDT, og kør `npm run build` bagefter.

## 4. Kør app-review-scanneren (den rigtige QA-runde)
Start appen lokalt i én terminal:
```
npm run dev
```
Kør i en anden terminal:
```
node %USERPROFILE%\.claude\skills\app-review\scripts\review.mjs ^
  --url http://localhost:3000 ^
  --routes /,/login,/signup ^
  --out ./review-out/round1 --round 1
```
Åbn `./review-out/round1/report.html`. (De beskyttede ruter kræver login-session; uden den
rammer scanneren login-siden — det er forventet. Sig til, hvis du vil have login-trin i skillet.)

## 5. (Valgfrit, 100% pålideligt review herfra)
Kør `git diff` for batch 1+2 og indsæt teksten i chatten — så reviewer jeg den faktiske kode med
sikkerhed, uden at være afhængig af cloud-fil-broen.
