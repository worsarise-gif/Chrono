import React from 'react';

export const PlanetLogo = ({ className = "", showText = true, size = 32 }: { className?: string, showText?: boolean, size?: number }) => (
  <div className={`font-bold tracking-tight text-black dark:text-white flex items-center justify-center select-none gap-3 ${className}`} style={{ fontSize: size ? size / 2 : 24 }}>
<svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className="shrink-0 bg-white dark:bg-black text-[#1a1a1a] dark:text-white"
      style={{ transform: 'rotate(-45deg)', borderRadius: '50%' }}
    >
      <path
        d="M 2 45 L 32.7 45 A 18 18 0 0 1 67.3 45 L 85.6 45 A 36 36 0 0 0 25.3 25.3 C 17.3 33.3, 10 44, 2 45 Z"
        fill="currentColor"
      />
      <path
        d="M 98 55 L 67.3 55 A 18 18 0 0 1 32.7 55 L 14.4 55 A 36 36 0 0 0 74.7 74.7 C 82.7 66.7, 90 56, 98 55 Z"
        fill="currentColor"
      />
    </svg>
    {showText && <span>Chrono</span>}
  </div>
);
