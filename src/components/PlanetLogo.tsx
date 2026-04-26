import React from 'react';

import Image from 'next/image';

export const PlanetLogo = ({ className = "", showText = true, size = 32 }: { className?: string, showText?: boolean, size?: number }) => (
  <div className={`font-bold tracking-tight text-black dark:text-white flex items-center justify-center select-none gap-3 ${className}`} style={{ fontSize: size ? Math.max(16, size * 0.75) : 24 }}>
    <Image
      src="/icon"
      alt="Chrono Logo"
      width={size}
      height={size}
      className="shrink-0"
    />
    {showText && <span>Chrono</span>}
  </div>
);
