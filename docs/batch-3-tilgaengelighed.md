# Batch 3 — Tilgængelighed (a11y)

Mål: appen kan bruges med tastatur og skærmlæser, respekterer reduceret bevægelse, og har
tilstrækkelig kontrast. Efter batchen: `npm run build` grøn + `npx tsc --noEmit` grøn + kør
`app-review`-loopet (axe-fund med alvor høj skal være væk).

---

## ⭐ Live-bekræftet i produktion (axe-core på Vercel, indlogget som elev)

Disse to er ikke teori — de er målt på den deployede app og bør prioriteres i denne batch:

1. **Viewport deaktiverer zoom — KRITISK (WCAG 1.4.4).** Målt `<meta name="viewport">` =
   `width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover`.
   `maximum-scale=1` + `user-scalable=no` forhindrer knibe-zoom → svagtseende kan ikke forstørre.
   App-dækkende (rammer alle sider).
   **Rettelse (`src/app/layout.tsx`)** — i Next.js 16 sættes dette via `viewport`-exporten.
   Fjern `maximumScale` og `userScalable`:
   ```ts
   import type { Viewport } from 'next';
   export const viewport: Viewport = {
     width: 'device-width',
     initialScale: 1,
     viewportFit: 'cover',
     // FJERNET: maximumScale: 1, userScalable: false
   };
   ```
   (Er det i stedet en rå `<meta>`-tag, så fjern `maximum-scale=1, user-scalable=no` fra `content`.)

2. **For lav kontrast — SERIOUS (WCAG 1.4.3), flere steder.** axe pegede bl.a. på de dæmpede
   nav-labels (`#64748B` = `--text-muted`) på mørk baggrund. Se punkt 3b nedenfor — det er samme
   token.

(Rolle-guarden fra batch 1 blev samtidig bekræftet live: en elev afvises fra `/dashboard` og
`/manager/feed`. Ikke en a11y-opgave, men noteret som bevist.)

---

> Øvrige fund er verificeret i koden: mange ikon-knapper mangler `aria-label`; `<label>` mangler
> `htmlFor` og inputs mangler `id`; ingen `prefers-reduced-motion`-fald-tilbage trods mange
> `repeat: Infinity`-animationer + konfetti; overlays (MatchCelebration, video-sheets) mangler
> dialog-semantik og fokus-håndtering.

## 3a. `prefers-reduced-motion`  *(konkret — nul risiko)*

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

Gate desuden de tunge JS-animationer, så de ikke kører for disse brugere. Framer-motion har
`useReducedMotion()`:
```tsx
import { useReducedMotion } from 'framer-motion';
const reduce = useReducedMotion();
// brug fx: transition={reduce ? { duration: 0 } : { duration: 5, repeat: Infinity }}
// og drop konfetti/orbs når reduce === true
```
Steder: landing (`page.tsx` orbs), `MatchCelebration.tsx` (konfetti), `login`/`signup` orbs,
`student/feed` baggrund.

**Tag samtidig `Math.random()`-i-render-buggen (bekræftet af ESLint `react-hooks/purity`):** i
`MatchCelebration.tsx` genberegnes konfetti-positionerne ved hver re-render. Flyt tilfældigheden
til en `useMemo`/`useState`-initializer eller `useRef`, så den beregnes én gang.

## 3b. Kontrast  *(konkret — live-bekræftet, se ⭐)*

Fil: `src/app/globals.css` linje 14 — hæv dæmpet tekst til ca. 4.5:1 på den mørke baggrund:
```css
--text-muted: #94A3B8;   /* var #64748B — fejler WCAG AA (axe: serious) */
```
Vil du beholde en mørkere nuance til rent dekorative elementer, så tilføj en separat token:
```css
--text-faint: #64748B;   /* kun til ikke-informativ dekoration */
```
og erstat de steder, hvor `#64748B` bruges til *informativ* tekst (nav-labels, hjælpetekst,
placeholders) med `var(--text-muted)`.

## 3c. `aria-label` på ikon-knapper  *(konkret + prompt)*

**Konkret — `src/app/student/feed/page.tsx`** (swipe-knapperne):
```tsx
<motion.button ... onClick={() => handleSwipe('left')}  aria-label="Afvis">
<motion.button ... onClick={() => handleSwipe('right')} aria-label="Synes godt om">
```
(Bemærk: på de elev-sider jeg scannede live var der ingen ikon-knapper uden navn — men tjek
onboarding/manager/dashboard, hvor kode-reviewet fandt flere.)

**Prompt til Claude Code (resten):**
> Gennemgå alle rene ikon-knapper (kun et lucide-ikon, ingen synlig tekst) i
> `student/onboarding`, `manager/feed`, `manager/matches`, `login`, `signup` og
> `dashboard/students` og tilføj et beskrivende `aria-label` (fx "Vis adgangskode", "Ryd søgning",
> "Fjern video", "Luk", "Sortér efter …"). Ikonet selv kan få `aria-hidden="true"`.

## 3d. Kobl formularfelter til labels  *(konkret + prompt)*

**Konkret — `src/app/login/page.tsx`:**
```tsx
<label htmlFor="login-email" className="...">Email</label>
<input id="login-email" type="email" ... />

<label htmlFor="login-password" className="...">Adgangskode</label>
<input id="login-password" type={showPassword ? 'text' : 'password'} ... />
```

**Prompt til Claude Code (resten):**
> I `signup`, `student/onboarding`, `student/settings`, `manager/settings`, `manager/store` og
> `dashboard/settings`: giv hvert `<input>/<select>/<textarea>` et `id` og knyt dets `<label>` med
> matchende `htmlFor` (eller pak feltet i `<label>`). Søgefeltet i `dashboard/students` skal have
> `aria-label="Søg efter elev"`.

## 3e. Dialog-semantik & fokus i overlays  *(prompt + anbefaling)*

Overlays: `MatchCelebration.tsx`, match-overlayet i `manager/feed/page.tsx`, samt video-/detalje-
sheets i `manager/matches/page.tsx`. De mangler `role="dialog"`, fokus-styring og Escape-lukning.

**Anbefaling:** `@radix-ui/react-dialog` (`npm i @radix-ui/react-dialog`) giver fokus-fælde,
Escape, `aria-modal` og fokus-retur gratis, og kan stadig animeres med framer-motion.

**Beholder du de nuværende overlays**, tilføj mindst:
```tsx
role="dialog" aria-modal="true" aria-labelledby="match-title"
onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
```
plus fokus ind ved åbning og fokus tilbage ved luk. Giv match-fejringen `aria-live="assertive"`.

## 3f. Sprog & overskrifter  *(prompt)*

> 1) `src/app/layout.tsx` (root) skal have `<html lang="da">`. (Bekræftet OK live på forsiden,
>    men verificér at det gælder alle sider.)
> 2) Præcis ét `<h1>` pr. skærm; modal-titler bør være `<h2>` koblet via `aria-labelledby`
>    (MatchCelebration bruger `<h1>` oven på feedets `<h1>`).

---

## Færdig-tjek for Batch 3
- [ ] `npm run build` grøn + `npx tsc --noEmit` grøn
- [ ] Viewport tillader zoom (ingen `maximum-scale`/`user-scalable=no`)
- [ ] `--text-muted` ≥ 4.5:1 (axe: ingen `color-contrast` serious tilbage)
- [ ] Alle ikon-knapper har `aria-label`; alle felter har koblet label
- [ ] `prefers-reduced-motion` slår animationer fra; `MatchCelebration` genberegner ikke konfetti pr. render
- [ ] Modaler: Escape lukker, fokus fanges og føres tilbage
- [ ] `app-review`/axe: ingen fund med alvor høj/kritisk tilbage
