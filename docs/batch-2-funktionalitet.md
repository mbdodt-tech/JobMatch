# Batch 2 — Funktionalitet & robusthed

Mål: ingen dobbelt-swipes eller uhåndterede fejl, ingen uendelige spinnere, hurtigere
dashboard, og knapper der rent faktisk virker. Efter batchen: `npm run build` grøn + kør
`app-review`-loopet.

> Verificeret i koden: elev-feedets `handleSwipe` mangler den `swiping`-lås, som manager-feedet
> allerede har, og ignorerer `error` på `insert`. Flere sider har `if (!user) return;` FØR
> `setLoading(false)`. Dashboardet laver 2 `count`-queries pr. elev i en `for`-løkke.
> `last_active_at` sættes aldrig. "Send besked" i follow-up har ingen handler.

---

## 2a. Elev-feed: samtidigheds-lås, fejlhåndtering & match-fix  *(konkret)*

Fil: `src/app/student/feed/page.tsx` (læst i sin helhed).

**1) Tilføj `swiping`-state** ved siden af de øvrige `useState` (ca. linje 18):
```tsx
const [swiping, setSwiping] = useState(false);
```

**2) Erstat hele `handleSwipe` (ca. linje 75-123) med:**
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
    if (swipeError) { console.error('Kunne ikke gemme swipe:', swipeError); return; }

    if (direction === 'right' && swipeData) {
      // FIX: manager-swipet gemmes med profile_id = elevens id + rolle 'store_manager'
      const { data: storeSwipe } = await supabase
        .from('swipes')
        .select('*')
        .eq('store_id', store.id)
        .eq('profile_id', user.id)
        .eq('swiper_role', 'store_manager')
        .eq('direction', 'right')
        .maybeSingle();

      if (storeSwipe) {
        const { error: matchError } = await supabase.from('matches').insert({
          student_id: user.id,
          store_id: store.id,
          student_swipe_id: swipeData.id,
          store_swipe_id: storeSwipe.id,
          status: 'active',
        });
        if (matchError) { console.error('Kunne ikke oprette match:', matchError); }
        else { setMatchedStore(store); setShowMatch(true); }
      }
    }
    setCurrentIndex((prev) => prev + 1);
  } finally {
    setSwiping(false);
  }
};
```

**3) Sæt `disabled={swiping}`** på de to action-knapper (ca. linje 210 og 221) og gerne
`aria-label` samtidig (det hører til batch 3, men kan tages her):
```tsx
<motion.button ... onClick={() => handleSwipe('left')}  disabled={swiping} aria-label="Afvis">
<motion.button ... onClick={() => handleSwipe('right')} disabled={swiping} aria-label="Synes godt om">
```

> Bemærk: i praksis swiper eleven altid først (manageren ser kun elever, der allerede har
> swipet), så match-grenen fyrer sjældent fra elev-siden — realtids-oplevelsen løses bedst med
> notifikationer (funktionsforslag 2). Rettelsen gør koden korrekt og robust.

---

## 2b. Uendelig spinner ved manglende bruger/fejl

Mønsteret `if (!user) return;` står før `setLoading(false)` flere steder.

**Konkret — `src/app/manager/feed/page.tsx`, `loadData` (ca. linje 39):**
```tsx
// FØR:
if (!user) return;
// EFTER:
if (!user) { setLoading(false); return; }
```

**Samme mønster i:** `src/app/student/matches/page.tsx` (~40),
`src/app/manager/matches/page.tsx` (~61).

**Prompt til Claude Code:**
> Find alle steder i `student/`, `manager/` og `dashboard/`-siderne hvor `if (!user) return`
> (eller en tidlig `return`) står før `setLoading(false)`. Pak data-hentningen i
> `try { … } finally { setLoading(false) }`, og tjek `error` fra hver Supabase-query. Ved
> manglende bruger: `router.replace('/login')`. Ved query-fejl: vis en fejltilstand med en
> "Prøv igen"-knap i stedet for en evig spinner.

---

## 2c. `last_active_at` opdateres aldrig

Uden dette bliver dashboardets "aktive denne uge" altid 0, og næsten alle elever markeres
som "kræver opmærksomhed".

**Anbefaling:** opdatér ved feed-load (billigt, sker ofte). Fx i
`src/app/student/feed/page.tsx` i `fetchStores`, lige efter brugeren er hentet:
```tsx
await supabase.from('profiles').update({ last_active_at: new Date().toISOString() }).eq('id', user.id);
```
(Alternativt centralt i `proxy.ts`/`updateSession`, men hold det til indloggede rute-hits, så
det ikke kører på offentlige sider.)

---

## 2d. N+1-queries i dashboard

I dag: for hver elev laves 2 separate `count`-kald i en `for`-løkke (fx
`src/app/dashboard/layout.tsx` linje ~70-89, samt `dashboard/page.tsx` og
`dashboard/students/page.tsx`). Ved mange elever = hundredvis af serielle rundture.

**Bedst:** flyt aggregeringen til databasen med en Postgres-**view** eller **RPC**
(`group by`), og hent den i ét kald. Datamodellen har allerede KPI-typerne
(`KpiSwipeStats`, `AtRiskStudent`, `DashboardOverview`) — de peger på præcis den slags
aggregering.

**Hurtig mellemløsning uden DB-ændring** (parallelt i stedet for serielt):
```tsx
const results = await Promise.all(
  students.map(async (s) => {
    const [{ count: swipeCount }, { count: matchCount }] = await Promise.all([
      supabase.from('swipes').select('*', { count: 'exact', head: true })
        .eq('profile_id', s.id).eq('direction', 'right'),
      supabase.from('matches').select('*', { count: 'exact', head: true })
        .eq('student_id', s.id),
    ]);
    return { id: s.id, atRisk: (swipeCount ?? 0) >= 5 && (matchCount ?? 0) === 0 };
  })
);
const atRisk = results.filter((r) => r.atRisk).length;
```

**Prompt til Claude Code:**
> Erstat de per-elev `for`-løkker med `count`-queries i `dashboard/layout.tsx`,
> `dashboard/page.tsx` og `dashboard/students/page.tsx` med enten en aggregeret Supabase
> view/RPC (foretrukket) eller `Promise.all`-batching. Tjek `error` på alle queries.

---

## 2e. Follow-up: død knap + ikke-gemt "kontaktet"

Fil: `src/app/dashboard/follow-up/page.tsx` (~223-226).

- "Send besked" har ingen `onClick` → giv den en handling (fx `mailto:` til elevens e-mail,
  eller åbn intern besked-komposer når chat-funktionen findes — se funktionsforslag 1).
- "Markér kontaktet" opdaterer kun lokal state → gem i databasen, så det overlever reload.

**DB:** tilføj enten en kolonne på `matches` (fx `follow_up_contacted_at timestamptz`) eller en
lille tabel `follow_ups(student_id, contacted_by, contacted_at, note)`. Skriv til den ved klik,
og læs status ind når siden loader.

**Prompt til Claude Code:**
> I `dashboard/follow-up/page.tsx`: gør "Send besked" funktionel (mailto eller intern besked),
> og persistér "Markér kontaktet" i Supabase (ny kolonne/tabel) i stedet for kun lokal state;
> indlæs status ved page-load og vis den.

---

## 2f. Fil-validering før upload

Fil: onboarding (`src/app/student/onboarding/page.tsx`, upload-handlerne).

**Prompt til Claude Code:**
> Før CV/video-upload: validér `file.type` (kun tilladte typer, fx `video/mp4`, `application/pdf`)
> og `file.size` (fx maks 100 MB video, 10 MB CV). Afvis med en tydelig fejlbesked i UI'et.
> Gælder både fil-vælger og drag-and-drop.

---

## Færdig-tjek for Batch 2
- [ ] `npm run build` grøn
- [ ] Hurtige tryk/drag i elev-feed giver ikke dobbelt-swipe; netværksfejl crasher ikke
- [ ] Ingen side hænger i uendelig spinner uden bruger/ved fejl (der vises fejl + retry)
- [ ] `last_active_at` opdateres; dashboardets "aktive denne uge" giver mening
- [ ] Dashboard loader hurtigt selv med mange elever (ingen serielle N+1-løkker)
- [ ] "Send besked" virker; "Markér kontaktet" overlever reload
- [ ] Upload afviser for store/forkerte filer
- [ ] Kør `app-review`-loopet mod de vigtigste ruter og ret høj/blocker
