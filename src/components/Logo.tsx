interface LogoProps {
  className?: string;
  variant?: 'mark' | 'icon';
}

export default function Logo({ className = 'w-8 h-8', variant = 'mark' }: LogoProps) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      role="img"
      aria-label="Jobmatch"
    >
      <defs>
        <linearGradient id="jm-card-l" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#A78BFA" />
          <stop offset="1" stopColor="#6366F1" />
        </linearGradient>
        <linearGradient id="jm-card-r" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#34D399" />
          <stop offset="1" stopColor="#14B8A6" />
        </linearGradient>
        <linearGradient id="jm-deep" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1E1B4B" />
          <stop offset="0.55" stopColor="#0B0B14" />
          <stop offset="1" stopColor="#052E2B" />
        </linearGradient>
      </defs>
      {variant === 'icon' && (
        <rect width="120" height="120" rx="28" fill="url(#jm-deep)" />
      )}
      <g transform={variant === 'icon' ? 'translate(60 64)' : 'translate(60 62) scale(1.18)'}>
        <rect x="-44" y="-30" width="40" height="56" rx="10" fill="url(#jm-card-l)" transform="rotate(-14)" />
        <rect x="4" y="-30" width="40" height="56" rx="10" fill="url(#jm-card-r)" transform="rotate(14)" />
        <path d="M0,-26 L5,-7 L24,-2 L5,3 L0,22 L-5,3 L-24,-2 L-5,-7 Z" fill="#FFFFFF" />
      </g>
    </svg>
  );
}
