const SIZES = { sm: 'text-[15px]', lg: 'text-[26px]' } as const;

// Placeholder wordmarks until real logo files are uploaded per chain.
export default function ChainWordmark({
  chainId,
  name,
  size = 'sm',
}: {
  chainId: string;
  name: string;
  size?: keyof typeof SIZES;
}) {
  const base = SIZES[size];

  switch (chainId) {
    case 'elgiganten':
      return (
        <span className={`${base} font-black tracking-tight text-white`}>
          ELGIGANTEN
          <span
            className="ml-0.5 bg-clip-text text-transparent"
            style={{ backgroundImage: 'linear-gradient(160deg,#65b12f,#057043)' }}
          >
            ⟩
          </span>
        </span>
      );
    case 'fotex':
      return <span className={`${base} font-extrabold italic lowercase text-white`}>føtex</span>;
    case 'jysk':
      return <span className={`${base} font-black tracking-[0.2em] text-white`}>JYSK</span>;
    case 'kemp-lauritzen':
      return (
        <span className="inline-flex items-center gap-2 text-white">
          <span
            className={`inline-flex items-center justify-center rounded-lg bg-white font-black text-[#1e1f20] ${
              size === 'lg' ? 'w-8 h-8 text-lg' : 'w-6 h-6 text-sm'
            }`}
          >
            K
          </span>
          <span className={`${size === 'lg' ? 'text-[17px]' : 'text-[12px]'} font-extrabold leading-[1.05]`}>
            Kemp
            <br />
            Lauritzen
          </span>
        </span>
      );
    case 'rema':
      return (
        <span className={`${base} font-black text-white`}>
          REMA <span className="rounded bg-white px-1 text-[#E4032E]">1000</span>
        </span>
      );
    case 'lidl':
      return (
        <span className={`${base} font-black text-white`}>
          L<span className="text-[#fff000]">i</span>dl
        </span>
      );
    case 'matas':
      return <span className={`${base} font-extrabold lowercase text-white`}>matas</span>;
    case 'netto':
      return <span className={`${base} font-black text-white`}>NETTO</span>;
    case 'bilka':
      return <span className={`${base} font-black text-white`}>Bilka</span>;
    case 'yousee':
      return <span className={`${base} font-extrabold text-white`}>YouSee</span>;
    default:
      return <span className={`${base} font-extrabold text-white`}>{name}</span>;
  }
}
