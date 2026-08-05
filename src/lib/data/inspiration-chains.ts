export interface ChainJob {
  role: string;
  city: string;
  education: string;
  start: string;
}

export interface InspirationChain {
  id: string;
  name: string;
  primary: string;
  dark: string;
  tagline: string;
  heroImage?: string;
  tileImage?: string;
  tileHeight: number;
  jobs: ChainJob[];
}

const CDN = 'https://d8j0ntlcm91z4.cloudfront.net/user_3GIflR5QnXinCLg0I5zF5pYmvKr/';

// Demo data until store_chains is wired up. YouSee and Elgiganten use
// verified brand colors (yousee.dk design system / elgiganten.dk theme-color).
export const INSPIRATION_CHAINS: InspirationChain[] = [
  {
    id: 'yousee',
    name: 'YouSee',
    primary: '#1fab2e',
    dark: '#002219',
    tagline: '»Internet, tv og mobil – samlet ét sted.«',
    heroImage: `${CDN}hf_20260805_111011_728259c2-8e31-4507-8ccf-edd1a47ad5f8_min.webp`,
    tileImage: `${CDN}hf_20260805_110944_6ba214e0-d19a-45d1-a433-fdc3085b0e6e_min.webp`,
    tileHeight: 230,
    jobs: [
      { role: 'Salgselev – YouSee Butik', city: 'København', education: 'Detailhandel (EUD/EUX)', start: '1. sep. 2026' },
      { role: 'Kundeservicelev', city: 'Aarhus', education: 'Kontor, off. adm./handel', start: '1. okt. 2026' },
      { role: 'Kontorelev – Nuuday', city: 'København SV', education: 'Kontor (EUX)', start: '15. aug. 2026' },
      { role: 'Salgselev – YouSee Butik', city: 'Odense', education: 'Detailhandel (EUD)', start: 'Løbende optag' },
    ],
  },
  {
    id: 'fotex',
    name: 'føtex',
    primary: '#14286e',
    dark: '#14286e',
    tagline: '»Danmarks største elevvirksomhed – 400+ elever om året.«',
    tileImage: `${CDN}hf_20260805_110327_75c5a788-0019-457f-91b8-8e55eb30b470_min.webp`,
    tileHeight: 250,
    jobs: [
      { role: 'Detailelev – Ferskvarer', city: 'København NV', education: 'Detailhandel (EUD/EUX)', start: '15. aug. 2026' },
      { role: 'Detailelev – Tekstil', city: 'Aalborg', education: 'Detailhandel (EUD)', start: '1. sep. 2026' },
      { role: 'Bagerelev', city: 'Vejle', education: 'Bager (EUD)', start: 'Løbende optag' },
    ],
  },
  {
    id: 'elgiganten',
    name: 'Elgiganten',
    primary: '#041752',
    dark: '#041752',
    tagline: '»Lave priser gør noget ved humøret!«',
    heroImage: `${CDN}hf_20260805_110327_5912c3b6-1115-40ac-8fa8-01727af432a9_min.webp`,
    tileImage: `${CDN}hf_20260805_110327_b209ab5a-a412-4884-a172-d44d9360fa82_min.webp`,
    tileHeight: 180,
    jobs: [
      { role: 'Salgsassistentelev – Elektronik', city: 'Aarhus C', education: 'Detailhandel (EUD/EUX)', start: '1. sep. 2026' },
      { role: 'Salgsassistentelev – Hvidevarer', city: 'Odense', education: 'Detailhandel (EUD)', start: '1. sep. 2026' },
      { role: 'Lagerelev – Distribution', city: 'Brøndby', education: 'Lager & terminal (EUD)', start: 'Løbende optag' },
    ],
  },
  {
    id: 'netto',
    name: 'Netto',
    primary: '#1a1a1a',
    dark: '#f6d800',
    tagline: '»Vilje til at ville – evne til at kunne.«',
    tileHeight: 150,
    jobs: [
      { role: 'Detailelev', city: 'Randers', education: 'Detailhandel (EUD)', start: '1. sep. 2026' },
      { role: 'Detailelev', city: 'Esbjerg', education: 'Detailhandel (EUD)', start: '1. okt. 2026' },
    ],
  },
  {
    id: 'jysk',
    name: 'JYSK',
    primary: '#16408e',
    dark: '#16408e',
    tagline: '»Bring dedication – meet possibilities.«',
    tileImage: `${CDN}hf_20260805_110327_fbc1be5b-6be6-40c3-bfb4-eae5a270d796_min.webp`,
    tileHeight: 200,
    jobs: [
      { role: 'Salgselev', city: 'Horsens', education: 'Detailhandel (EUD)', start: '1. sep. 2026' },
      { role: 'Salgselev', city: 'Roskilde', education: 'Detailhandel (EUD)', start: '1. sep. 2026' },
    ],
  },
  {
    id: 'kemp-lauritzen',
    name: 'Kemp & Lauritzen',
    primary: '#1e1f20',
    dark: '#1e1f20',
    tagline: '»Sammen gør vi grøn omstilling til virkelighed.«',
    tileImage: `${CDN}hf_20260805_111011_728259c2-8e31-4507-8ccf-edd1a47ad5f8_min.webp`,
    tileHeight: 170,
    jobs: [
      { role: 'Elektrikerlærling', city: 'Albertslund', education: 'Elektriker (EUD)', start: 'Løbende optag' },
      { role: 'VVS-lærling', city: 'Aarhus', education: 'VVS-energi (EUD)', start: 'Løbende optag' },
    ],
  },
  {
    id: 'bilka',
    name: 'Bilka',
    primary: '#0f4faf',
    dark: '#0f4faf',
    tagline: '»Alt til hele familien – ét sted.«',
    tileImage: `${CDN}hf_20260805_110327_c9acfcce-e381-4ead-b58c-2645d0198b2f_min.webp`,
    tileHeight: 220,
    jobs: [
      { role: 'Detailelev – Elektronik', city: 'Hundige', education: 'Detailhandel (EUD)', start: '1. sep. 2026' },
      { role: 'Slagterelev', city: 'Tilst', education: 'Gourmetslagter (EUD)', start: 'Løbende optag' },
    ],
  },
  {
    id: 'rema',
    name: 'REMA 1000',
    primary: '#003DA5',
    dark: '#003DA5',
    tagline: '»Meget mere discount.«',
    tileHeight: 190,
    jobs: [
      { role: 'Salgsassistentelev', city: 'Vanløse', education: 'Detailhandel (EUD)', start: '1. okt. 2026' },
      { role: 'Salgsassistentelev', city: 'Esbjerg', education: 'Detailhandel (EUD)', start: 'Løbende optag' },
    ],
  },
  {
    id: 'lidl',
    name: 'Lidl',
    primary: '#0050aa',
    dark: '#0050aa',
    tagline: '»Vi vil styrke karrierevejen for vores talenter.«',
    tileHeight: 150,
    jobs: [
      { role: 'Butikselev', city: 'Kolding', education: 'Detailhandel (EUD)', start: '1. sep. 2026' },
    ],
  },
  {
    id: 'matas',
    name: 'Matas',
    primary: '#0d2d5e',
    dark: '#0d2d5e',
    tagline: '»Gør det godt for dig selv.«',
    tileHeight: 165,
    jobs: [
      { role: 'Butikselev / materialist', city: 'Lyngby', education: 'Detailhandel (EUD)', start: '1. sep. 2026' },
    ],
  },
];

export function getChain(id: string): InspirationChain | undefined {
  return INSPIRATION_CHAINS.find((c) => c.id === id);
}
