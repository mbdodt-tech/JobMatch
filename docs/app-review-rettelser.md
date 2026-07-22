# Jobmatch — rettelsespakke til Claude Code

Prioriteret plan til at rette de verificerede fund. Kør **batchvis**: efter hver batch
`npm run build` (fanger fejl med det samme) og derefter `app-review`-loopet mod
`http://localhost:3000`. Ret → byg → kør → videre.

Hver batch har (a) en **prompt du kan indsætte i Claude Code**, og (b) **konkret kode**
for de filer, der er læst i deres helhed. For store/ikke-fuldt-læste filer (onboarding,
dashboard, login, signup) er der en præcis instruktion frem for en blind diff.

> Rækkefølgen er valgt så de mest værdifulde/risikable ting (sikkerhed, GDPR) kommer
> først, og de rene refaktoreringer (palette) sidst.

---

## Batch 1 — Sikkerhed & GDPR  *(Claude Code + Supabase — vigtigst)*

**Prompt til Claude Code:**
> Tilføj server-side rolle-beskyttelse til Jobmatch. I `src/app/dashboard/layout.tsx`,
> `src/app/manager/layout.tsx` og `src/app/student/layout.tsx`: hent den aktuelle bruger
> med `@/lib/supabase/server`, slå `profiles.role` op, og `redirect()` til `/login` (eller
> brugerens egen rolle-forside) hvis rollen ikke matcher området. Behold `proxy.ts` som den
> er (den er korrekt Next.js 16). Verificér derefter at Supabase RLS-policies håndhæver
> samme adgang på DB-niveau for tabellerne `profiles`, `stores`, `swipes`, `matches`.

Mønster til et layout (server component):

```tsx
// fx src/app/dashboard/layout.tsx (øverst, før render)
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single();

  // dashboard = kun skole/super-admin
  if (!profile || !['school_admin', 'super_admin'].includes(profile.role)) {
    redirect('/login');
  }
  // ...eksisterende layout-JSX
}
```

(Tilsvarende: `manager/*` kræver `store_manager`, `student/*` kræver `student`.)

**RLS-tjekliste (kør i Supabase SQL editor — bekræft at der findes policies som disse):**
- `profiles`: en bruger kan kun `select` sin egen række + rækker den er matchet med; kun
  `school_admin`/`super_admin` kan se elever i egen organisation.
- `swipes` / `matches`: kun ejeren (elev eller den matchede butiks manager) kan læse.
- Ingen tabel må være læsbar for rollen `anon` ud over det strengt nødvendige.

**GDPR — privat storage for mindreårige:**
> I `src/app/student/onboarding/page.tsx`: skift CV/video-upload fra `getPublicUrl()` til en
> **privat bucket**; gem kun fil-stien i DB, og generér `createSignedUrl(path, 3600)` når en
> matchet manager skal se dem. Tilføj et alders-tjek fra `date_of_birth`: er eleven under 18,
> kræv et forældresamtykke-trin (navn + e-mail på værge) før profilen kan aktiveres. Gem
> samtykke-tidsstempel og -version.

---

## Batch 2 — Funktionalitet & robusthed

### 2a. Elev-feed: samtidigheds-lås, fejlhåndtering & match-fix  *(konkret)*
Fil: `src/app/student/feed/page.tsx` — filen er læst i sin helhed.

**Tilføj en `swiping`-state** (som manager-feedet allerede har):
```tsx
const [swiping, setSwiping] = useState(false);
```

**Erstat hele `handleSwipe` (linje ~75-123) med:**
```tsx
const handleSwipe = async (direction: 'left' | 'right') => {
  if (swiping) return;
  const store = stores[currentIndex];
  if (!store) return;
  setSwiping(true);
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace('/login'); return; }

    const { data: swipeData, error: swipeError } = await supabase
      .from('swipes')
      .insert({ profile_id: user.id, store_id: store.id, swiper_role: 'student', direction })
      .select()
      .single();
    if (swipeError) { console.error(swipeError); return; }

    if (direction === 'right' && swipeData) {
      // FIX: manager-swipet gemmes med profile_id = elevens id + rolle store_manager
      const { data: storeSwipe } = await supabase
        .from('swipes')
        .select('*')
        .eq('store_id', store.id)
        .eq('profile_id', user.id)
        .eq('swiper_role', 'store_manager')
        .eq('direction', 'right')
        .maybeSingle();

      if (storeSwipe) {
        await supabase.from('matches').insert({
          student_id: user.id, store_id: store.id,
          student_swipe_id: swipeData.id, store_swipe_id: storeSwipe.id, status: 'active',
        });
        setMatchedStore(store);
        setShowMatch(true);
      }
    }
    setCurrentIndex((prev) => prev + 1);
  } finally {
    setSwiping(false);
  }
};
```
Sæt `disabled={swiping}` på de to action-knapper (linje ~210 og ~221).

> Bemærk: i praksis swiper eleven altid først, så denne gren fyrer sjældent — den reelle
> realtids-match-oplevelse løses bedst med **notifikationer** (funktionsforslag 2). Men rettelsen
> gør koden korrekt og fjerner dobbelt-swipe/uhåndterede fejl.

### 2b. Uendelig spinner ved manglende bruger  *(konkret for manager-feed)*
Fil: `src/app/manager/feed/page.tsx`, `loadData` (linje ~34-98). `if (!user) return;` på
linje 39 rammer før `setLoading(false)`. Ret til:
```tsx
if (!user) { setLoading(false); return; }
```
Samme mønster: `src/app/student/matches/page.tsx` (~40) og `src/app/manager/matches/page.tsx` (~61).

**Prompt:** *"Find alle steder i student/manager/dashboard-siderne hvor `if (!user) return`
står før `setLoading(false)`, og pak fetch i `try/finally { setLoading(false) }`; vis en
fejltilstand med retry når en Supabase-query returnerer `error`."*

### 2c. `last_active_at`, N+1-queries, follow-up-knapper  *(prompt)*
> 1) Sæt `profiles.last_active_at = now()` ved feed-load eller i `updateSession`.
> 2) I `dashboard/page.tsx`, `dashboard/students/page.tsx`, `dashboard/follow-up/page.tsx`:
>    erstat `for`-løkkerne med per-elev `count`-queries med én aggregeret DB-forespørgsel
>    (view/RPC med `group by`) eller `Promise.all`. Tjek `error` på alle queries.
> 3) I `dashboard/follow-up/page.tsx` (~223): giv "Send besked" en handling, og gem
>    "Markér kontaktet" i databasen (ny kolonne/tabel) i stedet for kun lokal state.

### 2d. Fil-validering ved upload  *(prompt)*
> I onboarding-upload: validér `file.type` (kun forventede video/dokument-typer) og
> `file.size` (fx maks 100 MB video / 10 MB CV) før upload, med tydelig fejlbesked.

---

## Batch 3 — Tilgængelighed

### 3a. `prefers-reduced-motion`  *(konkret — nul risiko)*
Fil: `src/app/globals.css` — tilføj nederst:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```
Og gate de tunge framer-motion-løkker med `useReducedMotion()` fra `framer-motion`
(landing-orbs, konfetti i `MatchCelebration`).

### 3b. Kontrast  *(konkret)*
Fil: `src/app/globals.css` linje 14 — hæv dæmpet tekst til ≥4.5:1:
```css
--text-muted: #94A3B8;   /* var #64748B — for lav kontrast til brødtekst */
```
(Behold evt. #64748B som `--text-faint` til rent dekorative elementer.)

### 3c. aria-labels på ikon-knapper  *(konkret + prompt)*
Konkret, `src/app/student/feed/page.tsx`:
```tsx
<motion.button ... onClick={() => handleSwipe('left')}  aria-label="Afvis">
<motion.button ... onClick={() => handleSwipe('right')} aria-label="Synes godt om">
```
Samme i `manager/feed/page.tsx` (linje ~292/302).
**Prompt:** *"Gennemgå alle rene ikon-knapper (uden synlig tekst) i login, signup,
onboarding, manager/matches, dashboard/students og tilføj et beskrivende `aria-label`
(vis/skjul kode, luk, fjern video/CV, sortér)."*

### 3d. Labels + modaler  *(prompt)*
> 1) Kobl alle formularfelter til deres labels med matchende `id`/`htmlFor` (login, signup,
>    onboarding, dashboard-søgning — sidstnævnte får et `aria-label`).
> 2) Gør overlays til rigtige dialoger: `role="dialog" aria-modal="true"`, flyt fokus ind ved
>    åbning, focus-trap, luk på Escape, fokus tilbage ved luk. Overvej `@radix-ui/react-dialog`.

---

## Batch 4 — Designkonsistens

**Prompt:**
> Jobmatch kører reelt to paletter: grønne/emerald design-tokens (globals.css, login, signup)
> vs. lilla/blå UI (landing, feed, onboarding, dashboard). Vælg ÉT tema. Definér semantiske
> tokens (`--accent-primary` osv.) og erstat hardcodede farver (`#7C3AED`, `purple-600`,
> `#F8FAFC`, `#64748B`…) med tokens. Ret også baggrunden: token `--bg-primary:#0A0F0D` vs.
> hardcodet `bg-[#0A0A0F]` er to forskellige sorte — vælg én og brug `bg-[var(--bg-primary)]`.
> Lav én genbrugelig `<Button>`-komponent og brug den overalt (fjern ubrugt `.btn-gradient`).
> Forøg tryk-mål til min. 44×44px, og gør manager-feedets faste `h-[500px]` viewport-relativ.

Konkret start (`src/app/page.tsx` linje 64): `bg-[#0A0A0F]` → `bg-[var(--bg-primary)]`.

---

## Batch 5 — Lav-prioritet

### 5a. Middleware kopierer cookies ved redirect  *(konkret)*
Fil: `src/lib/supabase/middleware.ts` (linje ~38-42):
```tsx
if (!user && !isPublicRoute) {
  const url = request.nextUrl.clone();
  url.pathname = '/login';
  const redirectResponse = NextResponse.redirect(url);
  supabaseResponse.cookies.getAll().forEach(({ name, value }) =>
    redirectResponse.cookies.set(name, value));
  return redirectResponse;
}
```

### 5b. Resten  *(prompt)*
> - Validér at `href` fra DB (`store.website`, `cv_url`, `job_description_url`) starter med
>   `https://` før rendering (undgå `javascript:`-URL'er).
> - `dashboard/page.tsx` match-rate: definér nævneren entydigt (kun elev-højre-swipes).
> - Landing `page.tsx` "Erhvervscenter"-kort: tilføj mikrotekst ("konto oprettes af din skole").
> - Tilføj en **undo**-knap på swipe (sletter seneste swipe, går ét kort tilbage).

---

## Efter hver batch

```bash
npm run build          # skal være grøn
# kør review-loopet mod din lokale app:
cd %USERPROFILE%\.claude\skills\app-review\scripts
node review.mjs --url http://localhost:3000 ^
  --routes /,/login,/signup --out ./review-out/roundN --round N
```

Rækkefølge-anbefaling: **Batch 1 → 2 → 3 → 5 → 4**. (Palette-refaktoreringen til sidst,
så den ikke støjer i diffs mens de funktionelle rettelser laves.)
