interface AIVTreeProps {
  size?: number;
  className?: string;
}

/**
 * American Impact Ventures Tree Logo
 * Tree with buildings and globe base - represents community development
 *
 * Usage: Only in non-transactional contexts per Chinese Wall policy
 * - Big footer (marketing pages with sitemap)
 * - ChatTC contact form
 * - About page
 * NOT in: deals, marketplace, emails
 */
export default function AIVTree({ size = 48, className = '' }: AIVTreeProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Globe Base */}
      <g id="GlobeBase">
        <ellipse cx="256" cy="440" rx="180" ry="50" fill="#7AA288" />
        <path d="M 76,440 Q 256,520 436,440" stroke="#FFFFFF" strokeWidth="4" fill="none" />
        <path d="M 130,430 Q 256,490 382,430" stroke="#FFFFFF" strokeWidth="3" fill="none" opacity="0.7" />
        <line x1="256" y1="390" x2="256" y2="490" stroke="#FFFFFF" strokeWidth="3" opacity="0.5" />
      </g>

      {/* Buildings */}
      <g id="Buildings">
        {/* Left small building */}
        <rect fill="#D68A5C" x="100" y="340" width="50" height="70" />
        <rect fill="#FFFFFF" x="115" y="355" width="12" height="18" />
        <rect fill="#FFFFFF" x="115" y="385" width="12" height="18" />

        {/* Left tall building */}
        <rect fill="#D68A5C" x="160" y="290" width="70" height="120" />
        <rect fill="#FFFFFF" x="180" y="305" width="14" height="20" />
        <rect fill="#FFFFFF" x="180" y="340" width="14" height="20" />
        <rect fill="#FFFFFF" x="180" y="375" width="14" height="20" />

        {/* Right tall building */}
        <rect fill="#D68A5C" x="282" y="270" width="70" height="140" />
        <rect fill="#FFFFFF" x="302" y="285" width="14" height="20" />
        <rect fill="#FFFFFF" x="302" y="320" width="14" height="20" />
        <rect fill="#FFFFFF" x="302" y="355" width="14" height="20" />
        <rect fill="#FFFFFF" x="302" y="390" width="14" height="20" />

        {/* Right small building */}
        <rect fill="#D68A5C" x="362" y="330" width="50" height="80" />
        <rect fill="#FFFFFF" x="377" y="345" width="12" height="18" />
        <rect fill="#FFFFFF" x="377" y="375" width="12" height="18" />
      </g>

      {/* Tree Trunk */}
      <g id="Trunk">
        <path fill="#7AA288" d="M 220,410
                   Q 256,415 292,410
                   Q 280,320 270,260
                   L 300,200 L 288,188 L 260,235
                   L 260,140 L 256,80 L 252,140
                   L 252,235 L 224,188 L 212,200
                   L 242,260
                   Q 232,320 220,410 Z" />
        {/* Left branch */}
        <path fill="#7AA288" d="M 240,280 Q 180,250 140,220 L 148,205 Q 190,240 245,270 Z" />
        {/* Right branch */}
        <path fill="#7AA288" d="M 272,280 Q 332,250 372,220 L 364,205 Q 322,240 267,270 Z" />
      </g>

      {/* Leaves */}
      <g id="Leaves">
        {/* Top leaf */}
        <ellipse fill="#9CB687" cx="256" cy="50" rx="18" ry="35" />

        {/* Right side leaves */}
        <ellipse fill="#9CB687" cx="300" cy="65" rx="18" ry="35" transform="rotate(25 300 65)" />
        <ellipse fill="#9CB687" cx="340" cy="100" rx="18" ry="35" transform="rotate(45 340 100)" />
        <ellipse fill="#9CB687" cx="370" cy="145" rx="18" ry="35" transform="rotate(65 370 145)" />
        <ellipse fill="#9CB687" cx="385" cy="200" rx="18" ry="35" transform="rotate(85 385 200)" />
        <ellipse fill="#9CB687" cx="375" cy="255" rx="18" ry="30" transform="rotate(105 375 255)" />

        {/* Left side leaves */}
        <ellipse fill="#9CB687" cx="212" cy="65" rx="18" ry="35" transform="rotate(-25 212 65)" />
        <ellipse fill="#9CB687" cx="172" cy="100" rx="18" ry="35" transform="rotate(-45 172 100)" />
        <ellipse fill="#9CB687" cx="142" cy="145" rx="18" ry="35" transform="rotate(-65 142 145)" />
        <ellipse fill="#9CB687" cx="127" cy="200" rx="18" ry="35" transform="rotate(-85 127 200)" />
        <ellipse fill="#9CB687" cx="137" cy="255" rx="18" ry="30" transform="rotate(-105 137 255)" />

        {/* Inner leaves */}
        <ellipse fill="#9CB687" cx="200" cy="160" rx="15" ry="28" transform="rotate(-35 200 160)" />
        <ellipse fill="#9CB687" cx="312" cy="160" rx="15" ry="28" transform="rotate(35 312 160)" />
      </g>
    </svg>
  );
}

// Export raw SVG string for potential future use
export const AIV_TREE_SVG = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <g id="GlobeBase">
    <ellipse cx="256" cy="440" rx="180" ry="50" fill="#7AA288" />
    <path d="M 76,440 Q 256,520 436,440" stroke="#FFFFFF" stroke-width="4" fill="none" />
    <path d="M 130,430 Q 256,490 382,430" stroke="#FFFFFF" stroke-width="3" fill="none" opacity="0.7" />
    <line x1="256" y1="390" x2="256" y2="490" stroke="#FFFFFF" stroke-width="3" opacity="0.5" />
  </g>
  <g id="Buildings">
    <rect fill="#D68A5C" x="100" y="340" width="50" height="70" />
    <rect fill="#FFFFFF" x="115" y="355" width="12" height="18" />
    <rect fill="#FFFFFF" x="115" y="385" width="12" height="18" />
    <rect fill="#D68A5C" x="160" y="290" width="70" height="120" />
    <rect fill="#FFFFFF" x="180" y="305" width="14" height="20" />
    <rect fill="#FFFFFF" x="180" y="340" width="14" height="20" />
    <rect fill="#FFFFFF" x="180" y="375" width="14" height="20" />
    <rect fill="#D68A5C" x="282" y="270" width="70" height="140" />
    <rect fill="#FFFFFF" x="302" y="285" width="14" height="20" />
    <rect fill="#FFFFFF" x="302" y="320" width="14" height="20" />
    <rect fill="#FFFFFF" x="302" y="355" width="14" height="20" />
    <rect fill="#FFFFFF" x="302" y="390" width="14" height="20" />
    <rect fill="#D68A5C" x="362" y="330" width="50" height="80" />
    <rect fill="#FFFFFF" x="377" y="345" width="12" height="18" />
    <rect fill="#FFFFFF" x="377" y="375" width="12" height="18" />
  </g>
  <g id="Trunk">
    <path fill="#7AA288" d="M 220,410 Q 256,415 292,410 Q 280,320 270,260 L 300,200 L 288,188 L 260,235 L 260,140 L 256,80 L 252,140 L 252,235 L 224,188 L 212,200 L 242,260 Q 232,320 220,410 Z" />
    <path fill="#7AA288" d="M 240,280 Q 180,250 140,220 L 148,205 Q 190,240 245,270 Z" />
    <path fill="#7AA288" d="M 272,280 Q 332,250 372,220 L 364,205 Q 322,240 267,270 Z" />
  </g>
  <g id="Leaves">
    <ellipse fill="#9CB687" cx="256" cy="50" rx="18" ry="35" />
    <ellipse fill="#9CB687" cx="300" cy="65" rx="18" ry="35" transform="rotate(25 300 65)" />
    <ellipse fill="#9CB687" cx="340" cy="100" rx="18" ry="35" transform="rotate(45 340 100)" />
    <ellipse fill="#9CB687" cx="370" cy="145" rx="18" ry="35" transform="rotate(65 370 145)" />
    <ellipse fill="#9CB687" cx="385" cy="200" rx="18" ry="35" transform="rotate(85 385 200)" />
    <ellipse fill="#9CB687" cx="375" cy="255" rx="18" ry="30" transform="rotate(105 375 255)" />
    <ellipse fill="#9CB687" cx="212" cy="65" rx="18" ry="35" transform="rotate(-25 212 65)" />
    <ellipse fill="#9CB687" cx="172" cy="100" rx="18" ry="35" transform="rotate(-45 172 100)" />
    <ellipse fill="#9CB687" cx="142" cy="145" rx="18" ry="35" transform="rotate(-65 142 145)" />
    <ellipse fill="#9CB687" cx="127" cy="200" rx="18" ry="35" transform="rotate(-85 127 200)" />
    <ellipse fill="#9CB687" cx="137" cy="255" rx="18" ry="30" transform="rotate(-105 137 255)" />
    <ellipse fill="#9CB687" cx="200" cy="160" rx="15" ry="28" transform="rotate(-35 200 160)" />
    <ellipse fill="#9CB687" cx="312" cy="160" rx="15" ry="28" transform="rotate(35 312 160)" />
  </g>
</svg>`;
