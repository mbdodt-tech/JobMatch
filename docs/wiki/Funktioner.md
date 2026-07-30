# Funktioner

## Elev (mobil)

- **Onboarding (4 trin):** personlig info (postnr. → by auto-udfyldes) → uddannelse (multi-select ungdomsuddannelse + retninger, søgbar skoleliste) → adfærdstest (primær/sekundær stil) → video-pitch + CV + GDPR-samtykke
- **Udforsk (feed):** swipe-kortstak med butikker; flick eller 80 px træk; X/hjerte-overlay under træk; toast-bekræftelse; fortryd-knap ruller seneste swipe (og evt. match) tilbage; "Se video"-knap på kort med butiksvideo; jobopslag-PDF på kortet (butikkens eget eller kædens fælles)
- **Matches:** grid med matches, "Interesseret i" (afventer butikken) og "Fravalgt" (sammenklappelig); alle kort kan åbnes i detalje-sheet med jobopslag, video, beskrivelse, kontakt
- **Chat:** pr. match; dag-separatorer, læskvitteringer, ulæst-badges; realtime via Supabase Realtime
- **Notifikationer ("Aktivitet"):** in-app center med realtime-opdatering, ulæst-markering, dyb-links, "Markér alle som læst"; browser-notifikation når fanen er i baggrunden
- **Profil:** statistik (swipes/matches/profilstyrke), adfærdsstile, adresse, joberfaring, GDPR-status
- **Match-fejring:** konfetti-overlay når begge har swipet højre

## Butikschef (mobil)

- **Interesserede elever (feed):** kun elever, der har liket butikken; samme swipe-mekanik som elevfeedet; elevkort med adfærdsstil-badges, video-pitch og CV i detalje-sheet
- **Matches:** grid med ulæst-tællere; "Skriv til eleven" åbner chatten
- **Min butik:** butiksprofil (navn, beskrivelse, adresse med postnr.-autofill, logo), jobopslag-PDF, butiksvideo "En dag hos os" (maks. 100 MB, mp4/webm/mov), uddannelsesretninger, antal praktikpladser
- **Chat + notifikationer:** som eleven

## Skoleadmin (desktop-dashboard)

- **Overblik:** KPI'er (elever, aktive, matches, bekræftede aftaler, match-rate), "Kræver opfølgning" (inaktive/matchløse elever), "Butikker der ikke svarer", tragt (onboardet → aktiv → liket → match → aftale), matches pr. uge, elever vs. pladser pr. retning, populære butikker, datakvalitet
- **Praktikaftaler:** "Bekræft aftale" pr. match med fortryd — driver aftale-KPI'en
- **Elever:** filtrerbar liste med status-badges og detalje-sheet
- **Butikker:** kæder + enkeltbutikker med statistik; kæde-jobopslag (gælder alle kædens butikker, indtil butikken uploader sit eget)
- **Excel-import (3 trin):** vælg/opret kæde → upload ark (skabelon kan downloades; kolonner inkl. `Butikschef` + `Butikschef email`) → validering med fejlvisning → import opretter butikker OG manglende chef-konti med midlertidig adgangskode
- **Opfølgning:** prioriteret liste over elever i risiko med "Markér kontaktet"

## Sikkerhed & data

- Server-side role-guards på alle layouts; RLS på alle tabeller
- CV'er og video-pitches ligger i private buckets med signerede URL'er; butiks-assets i public bucket
- SECURITY DEFINER-RPC'er med interne rollecheck (bl.a. `get_admin_org_stats`, `admin_create_store_manager`)
- Notifikationer og matches oprettes af DB-triggere

## Roadmap (aftalt "på sigt")

1. Prøvedag-booking + butiksinvitationer ("aktivt marked")
2. Profil-styrke-måler
3. Søgedokumentation-eksport (PDF) til a-kasse/vejleder
4. Hjælp til jobopslag for butikker
5. "Godkendt lærested"-badge
6. Rigtige web-push-notifikationer (VAPID/edge function)
7. Prøvedage/invitationer ind i dashboard-tragten
