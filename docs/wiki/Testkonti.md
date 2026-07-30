# Testkonti

**Adgangskode for ALLE test-konti: `Test1234!`**
Login: https://job-match-ecru.vercel.app/login

## Elever

| Email | Navn | Status |
|---|---|---|
| emil@test.jobmatch.dk | test | Onboardet |
| sofia@test.jobmatch.dk | Sofia Nielsen | Onboardet |
| oliver@test.jobmatch.dk | Oliver Petersen | Onboardet |
| ida@test.jobmatch.dk | Ida Christensen | Onboardet |
| freja@test.jobmatch.dk | Freja Larsen | Onboardet |
| anna@test.jobmatch.dk | Anna Larsen | Onboardet |
| mikkel@test.jobmatch.dk | Mikkel Hansen | Onboardet |
| ny.elev@test.jobmatch.dk | Jesper slåsser | Onboardet |
| line@test.jobmatch.dk | Line Pedersen | **Ikke onboardet** — rammer onboarding-flowet ved login |

## Matching-scenariet (rig testdata, seedet juli 2026)

| Email | Navn | Indbygget historie |
|---|---|---|
| noah@test.jobmatch.dk | Noah Kristensen | Matchet med NORMAL Nørrebrogade |
| alma@test.jobmatch.dk | Alma Nielsen | Matchet med Elgiganten Fields (aftale bekræftet) + aktiv chat |
| william@test.jobmatch.dk | William Sørensen | Matchet med DSV Air & Sea |
| ella@test.jobmatch.dk | Ella Møller | Matchet med BESTSELLER |
| lucas@test.jobmatch.dk | Lucas Andersen | "I fare"-elev: 6 likes, 0 matches, inaktiv, afvist af Bilka |
| karla@test.jobmatch.dk | Karla Thomsen | Afventer manager-swipes (ligger i butiksfeeds) |

## Butikschefer

| Email | Navn | Butik |
|---|---|---|
| sara@elgiganten.dk | Sara Lind | Elgiganten Fields (match + chat med Alma, butiksvideo uploadet) |
| jonas@normal.dk | Jonas Berg | NORMAL Nørrebrogade |
| thomas@dsv.dk | Thomas Friis | DSV Air & Sea Kastrup |
| camilla@bestseller.dk | Camilla Juhl | BESTSELLER Showroom København |
| mette@bilka.dk | Mette Holm | Bilka One Fields |
| lars@magasin.dk | Lars Eriksen | Magasin du Nord |
| anne@matas.dk | Anne Sørensen | Matas Strøget |
| peter@ikea.dk | Peter Olsen | IKEA Gentofte |

## Skoleadmin

| Email | Navn | Adgang |
|---|---|---|
| admin@cphbusiness.dk | Maria Hansen | Dashboard: Overblik, Elever, Butikker, Opfølgning, Excel-import |

## Private konti (egen adgangskode valgt ved signup)

dodt@live.dk · jesper@krosch.dk · lucasfrandsen94@gmail.com — alle elever, ikke onboardet.

## Noter

- Excel-importen kan oprette nye butikschef-konti med en midlertidig adgangskode, som admin vælger i wizarden.
- Nye SQL-oprettede auth-brugere: ALLE token-felter skal være tomme strenge `''` (ikke NULL), ellers fejler login.
