# Batch 1 — Sikkerhed & GDPR (server-side rolle-guard, RLS, privat storage)

Mål: ingen kan nå et rolle-område ved bare at skrive URL'en, og mindreåriges data er ikke
offentligt tilgængelige. Efter batchen: `npm run build` grøn + manuel test (log ind som elev,
prøv at åbne `/dashboard` → skal redirecte til `/login`).

> **Kontekst der er verificeret i koden:** Alle tre områdelayouts (`dashboard`, `manager`,
> `student`) er `'use client'` og tegner en tab-bar/sidebar. `proxy.ts` (Next.js 16-middleware)
> tjekker kun *om* man er logget ind — ikke rollen. Rolle-routing sker i dag kun i
> `login/page.tsx` (klient), som frit kan omgås. Rollenavne: `student`, `store_manager`,
> `school_admin`, `super_admin`. Server-klienten er `createClient()` fra `@/lib/supabase/server`
> (async).

---

## Trin 1 — Del hvert layout i server-guard + klient-shell

Fordi et `layout.tsx` er routing-grænsen og skal kunne være en **server-komponent** for at
lave et sikkert rolle-tjek, men de nuværende layouts er klient-komponenter, deler vi hver af
dem i to. Ingen UI ændres — den flyttes bare til en shell.

**Gør dette pr. område (manager, student, dashboard):**

1. **Omdøb** den eksisterende `layout.tsx` til en shell-fil i samme mappe, og skift KUN
   funktionsnavnet (behold `'use client'` og alt andet uændret):
   - `src/app/manager/layout.tsx` → `src/app/manager/ManagerShell.tsx`
     — skift `export default function ManagerLayout(` → `export default function ManagerShell(`
   - `src/app/student/layout.tsx` → `src/app/student/StudentShell.tsx`
     — skift `export default function StudentLayout(` → `export default function StudentShell(`
   - `src/app/dashboard/layout.tsx` → `src/app/dashboard/DashboardShell.tsx`
     — skift `export default function DashboardLayout(` → `export default function DashboardShell(`

2. **Opret et nyt `layout.tsx`** i hver mappe (server-komponent) med guarden:

`src/app/manager/layout.tsx`
```tsx
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ManagerShell from './ManagerShell';

export default async function ManagerLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['store_manager', 'super_admin'].includes(profile.role)) {
    redirect('/login');
  }

  return <ManagerShell>{children}</ManagerShell>;
}
```

`src/app/student/layout.tsx`
```tsx
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import StudentShell from './StudentShell';

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['student', 'super_admin'].includes(profile.role)) {
    redirect('/login');
  }

  return <StudentShell>{children}</StudentShell>;
}
```

`src/app/dashboard/layout.tsx`
```tsx
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import DashboardShell from './DashboardShell';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['school_admin', 'super_admin'].includes(profile.role)) {
    redirect('/login');
  }

  return <DashboardShell>{children}</DashboardShell>;
}
```

**Prompt til Claude Code (hvis du vil have den til at gøre det):**
> Del `src/app/{manager,student,dashboard}/layout.tsx` i en server-guard + en klient-shell.
> Flyt det nuværende klient-indhold til `ManagerShell.tsx` / `StudentShell.tsx` /
> `DashboardShell.tsx` (kun funktionsnavnet ændres, behold `'use client'` og resten uændret),
> og opret nye server-`layout.tsx` med rolle-guarden som vist i `docs/batch-1-sikkerhed.md`.
> Kør `npm run build` bagefter.

**Verifikation:** Log ind som elev → prøv `/dashboard` og `/manager/feed` → begge skal
redirecte til `/login`. Log ind som skole-admin → `/dashboard` skal virke.

---

## Trin 2 — Bekræft RLS i Supabase (databasen)

Guarden ovenfor beskytter *siderne*, men data hentes direkte fra Supabase i klienten — så den
egentlige lås skal være **Row Level Security**. Bekræft i Supabase (SQL editor), at RLS er
slået til på alle tabeller, og at policyerne svarer til rollerne. Kør for hver tabel:

```sql
-- Er RLS slået til?  (rowsecurity skal være true)
select relname, relrowsecurity
from pg_class
where relname in ('profiles','stores','swipes','matches','organizations','store_chains');

-- Se eksisterende policies
select tablename, policyname, cmd, roles, qual
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
```

Tjek som minimum, at:
- **`profiles`**: en bruger kan læse/redigere sin egen række; en elevs følsomme felter er kun
  synlige for elever selv, for en matchet butiks manager, og for `school_admin`/`super_admin`
  i egen organisation. En elev må IKKE kunne `select` andre elevers rækker.
- **`swipes` / `matches`**: kun ejeren (eleven, eller den matchede butiks manager) kan læse egne
  rækker. `school_admin` kan læse aggregeret/for egen organisation.
- **`stores`**: offentligt læsbare felter er ok; skrivning kun for butikkens `manager_id`.
- **Rollen `anon`** har ingen adgang ud over det, en offentlig landingsside kræver.

Mangler der policies, så tilføj dem (eksempel — tilpas til dit skema):
```sql
alter table public.profiles enable row level security;

create policy "egen profil læses"
  on public.profiles for select
  using (auth.uid() = id);

create policy "egen profil opdateres"
  on public.profiles for update
  using (auth.uid() = id);
```

---

## Trin 3 — Privat storage + forældresamtykke (GDPR)

**Privat storage for CV/video** (i `src/app/student/onboarding/page.tsx`):
- Skift buckets for CV og videopitch til **private** (ikke public) i Supabase Storage.
- Erstat `getPublicUrl(path)` med, at du kun gemmer **stien** i DB (`cv_url`/`video_pitch_url`
  bliver stier, ikke fulde URL'er).
- Når en matchet manager skal se filen, generér en tidsbegrænset URL server-side:
  ```ts
  const { data } = await supabase.storage.from('student-media').createSignedUrl(path, 3600);
  ```
- Tilføj storage-RLS så kun ejeren og matchede parter kan generere signeret URL.

**Forældresamtykke for mindreårige:**
- Beregn alder ud fra `date_of_birth` i onboarding.
- Er eleven under 18: kræv et ekstra trin med værges navn + e-mail, og at værgen bekræfter
  (fx via magisk link) før `onboarding_completed`/`is_active` sættes.
- Gem samtykke-tidsstempel og -version (dokumentation af retsgrundlag), ikke bare en boolean.

**Prompt til Claude Code:**
> I onboarding: gør CV/video-buckets private, gem kun sti i DB, og servér via `createSignedUrl`.
> Tilføj et alders-tjek fra `date_of_birth`; under 18 kræves et forældresamtykke-trin (værges
> navn+e-mail + bekræftelse) før profilen aktiveres, og samtykke gemmes med tidsstempel/version.

---

## Færdig-tjek for Batch 1
- [ ] `npm run build` grøn
- [ ] Elev kan ikke åbne `/dashboard` eller `/manager/*` (redirect til login)
- [ ] Skole-admin kan åbne `/dashboard`; butikschef kan åbne `/manager/*`
- [ ] RLS slået til + policies bekræftet på alle tabeller
- [ ] CV/video ligger i privat bucket; kun signerede URL'er udleveres
- [ ] Forældresamtykke-flow for under-18
