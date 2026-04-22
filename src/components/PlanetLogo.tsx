import React from 'react';

export const PlanetLogo = ({ className = "" }: { className?: string }) => (
  <div className={`font-bold text-xl tracking-tight text-black dark:text-white flex items-center justify-center select-none ${className}`}>

    <div className="flex -rotate-45 items-center mr-1.5 shrink-0">
      <svg width="22" height="22" viewBox="0 0 100 100" className="fill-current">
        <path d="M 2 45 L 32.7 45 A 18 18 0 0 1 67.3 45 L 85.6 45 A 36 36 0 0 0 25.3 25.3 C 17.3 33.3, 10 44, 2 45 Z" />
        <path d="M 98 55 L 67.3 55 A 18 18 0 0 1 32.7 55 L 14.4 55 A 36 36 0 0 0 74.7 74.7 C 82.7 66.7, 90 56, 98 55 Z" />
      </svg>
    </div>

    Chrono
  </div>
);
