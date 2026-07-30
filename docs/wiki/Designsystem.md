# Designsystem — "Varm" (logo-duo)

Lyst, dansk og troværdigt udtryk med logoets egne farver. Erstattede det mørke "Aurora"-tema (juli 2026), som lå for tæt på den generiske "AI-app"-æstetik (violet-blå gradients på nær-sort, glassmorphism, glow).

## Farver

| Rolle | Værdi | Brug |
|---|---|---|
| Baggrund | `#FAF7F1` (cream) | Alle sider |
| Blæk (tekst) | `#211F1A` | Primær tekst |
| Sekundær tekst | `#6E6759` | Undertekster |
| Dæmpet tekst | `#8B8471` | Metadata, inaktive faner |
| Kort-border | `#EAE4D8` | Alle kort og inputs |
| **Teal (primær)** | solid `#0E8578` (hover `#0B6B60`) · tekst på lys `#0B6B60` · tint `#E1F2EF`/`#C4E4DE` · prik `#0F9B8E` | CTA'er, aktiv fane, MATCH, succes |
| **Violet (sekundær)** | tekst `#4E50C4` · tint `#EEEEFC`/`#DBDBF8` · solid `#5D5FE0` (sparsomt) | Afventer/info-tilstande, uddannelses-chips |
| **Koral (accent)** | `#EE5B3A` (hover `#DC4E2E`) | KUN hjerter/likes |
| Fejl | tekst `#B3412A` · tint `#FCEAE3`/`#F3C9BA` | Fejlbeskeder, destruktive handlinger |
| Ulæst-badge | `bg-rose-500` | Notifikations-/chat-tællere |

Teal og violet er hentet direkte fra Match Spark-logoets to kort — logoet kræver derfor ingen omfarvning.

## Grundmønstre

- **Kort:** `bg-white border border-[#EAE4D8] varm-card-shadow` + `rounded-2xl`/`rounded-3xl`
- **Indre boks i kort:** `bg-[#FAF7F1] border-[#EAE4D8]`
- **Inputs:** `bg-[#FAF7F1] border-[#EAE4D8] rounded-2xl py-4 text-base`, fokus-ring `#0E8578`
- **Sheets/modaler:** `bg-white rounded-t-3xl border-t border-[#EAE4D8]`, handle `#EAE4D8` (Radix Dialog via `Modal`-komponenten)
- **Dock:** hvid pille med `varm-dock-shadow`, aktiv fane = teal solid pille
- **Foto-løse kort-covers:** `linear-gradient(135deg,#14A899,#0E7C86,#5D5FA8)` — logoets egen glidning; ikon/logo forankres i toppen af kortet
- **Fotos:** beholder `card-scrim` + hvid tekst ovenpå; video-lightboxes er sorte

## Forbudt

- Gradients (eneste undtagelse: cover-fallbacken ovenfor), glow-effekter, glassmorphism, gradient-tekst
- Emoji i overskrifter (ok i brødtekst og notifikationstekster)
- Hvid tekst på andet end teal/koral-solids, fotos med scrim og cover-gradienten

## Swipe-interaktion

- Tærskel 80 px ELLER flick-hastighed > 500 px/s
- X/hjerte-overlay toner frem fra ~25 px træk, næsten fuldt synligt ved tærsklen
- Toast-bekræftelse efter hvert swipe: "Du likede X" (koral hjerte) / "Du fravalgte X" (X-ikon) / "Swipe fortrudt"
- Match afbryder toasten og viser match-fejringen (hvidt kort, konfetti i teal/violet/koral)
- Knapperne (fortryd/X/hjerte) findes altid som alternativ til swipe

## Tilgængelighed

- Zoom er tilladt (viewport låser ikke skalering)
- `prefers-reduced-motion` respekteres globalt
- Ikon-knapper har `aria-label`; overlays bruger Radix Dialog-semantik med fokusfælde
- Tap-targets min. ~44 px; tekst holdes inde i containere med `min-w-0`/`truncate`/`break-words`
