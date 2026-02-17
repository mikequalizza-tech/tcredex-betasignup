import Link from "next/link";

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon';
  className?: string;
  linkDisabled?: boolean;
}

const sizes = {
  sm: { width: 140, height: 42, iconSize: 32 },
  md: { width: 180, height: 54, iconSize: 40 },
  lg: { width: 220, height: 66, iconSize: 48 },
  xl: { width: 300, height: 90, iconSize: 64 },
};

// Inline SVG Icon - tCredex "t" mark
function LogoIcon({ size = 40 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="tCredexGradIcon" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#6538D4" />
          <stop offset="100%" stopColor="#3C91F5" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="120" height="120" rx="25" fill="url(#tCredexGradIcon)" />
      <g fill="#FFFFFF">
        <rect x="35" y="25" width="65" height="20" />
        <rect x="65" y="45" width="20" height="50" />
        <path d="M 25 85 L 45 65 L 55 75 L 35 95 Z" />
      </g>
    </svg>
  );
}

// Inline SVG Full Logo - tCredex.com with prominent name
function LogoFull({ width: _width = 180, height = 54 }: { width?: number; height?: number }) {
  return (
    <div className="flex items-center gap-3">
      <svg
        width={height}
        height={height}
        viewBox="0 0 120 120"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="tCredexGradCompact" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6538D4" />
            <stop offset="100%" stopColor="#3C91F5" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="120" height="120" rx="25" fill="url(#tCredexGradCompact)" />
        <g fill="#FFFFFF">
          <rect x="35" y="25" width="65" height="20" />
          <rect x="65" y="45" width="20" height="50" />
          <path d="M 25 85 L 45 65 L 55 75 L 35 95 Z" />
        </g>
      </svg>
      <div className="flex flex-col">
        <span className="text-2xl font-bold text-white leading-none">tCredex</span>
        <span className="text-sm text-indigo-300 leading-none">.com</span>
      </div>
    </div>
  );
}

export default function Logo({
  size = 'md',
  variant = 'full',
  className = '',
  linkDisabled = false,
}: LogoProps) {
  const { width, height, iconSize } = sizes[size];

  const content = variant === 'icon'
    ? <LogoIcon size={iconSize} />
    : <LogoFull width={width} height={height} />;

  if (linkDisabled) {
    return (
      <span className={`inline-flex shrink-0 items-center ${className}`}>
        {content}
      </span>
    );
  }

  return (
    <Link href="/" className={`inline-flex shrink-0 items-center ${className}`} aria-label="tCredex">
      {content}
    </Link>
  );
}

// Export individual components for use elsewhere
export { LogoIcon, LogoFull };
