import React from 'react';

import Image from 'next/image';

export const PlanetLogo = ({ className = "" }: { className?: string }) => (
  <div className={`font-bold text-xl tracking-tight text-black dark:text-white flex items-center justify-center select-none gap-2 ${className}`}>
    <Image
      src="/icon"
      alt="Chrono Logo"
      width={32}
      height={32}
      className="shrink-0"
    />
    Chrono
  </div>
);
