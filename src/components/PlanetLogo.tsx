import React from 'react';

export const PlanetLogo = ({ className = "" }: { className?: string }) => (
  <svg
    width="120"
    height="120"
    viewBox="0 0 800 800"
    xmlns="http://www.w3.org/2000/svg"
    className={`select-none ${className}`}
    aria-labelledby="title"
    role="img"
  >
    <title id="title">Chris Logo</title>
    
    {/* White circular background */}
    <circle 
      cx="400" 
      cy="400" 
      r="400" 
      fill="#ffffff"
    />
    
    {/* Subtle border */}
    <circle 
      cx="400" 
      cy="400" 
      r="385" 
      fill="none" 
      stroke="#e5e5e5" 
      strokeWidth="20"
    />
    
    {/* Black "Chris" text - perfectly centered */}
    <text 
      x="400" 
      y="425" 
      textAnchor="middle" 
      dominantBaseline="middle" 
      fontFamily="Arial Black, Helvetica, sans-serif" 
      fontSize="195" 
      fontWeight="900" 
      fill="#1a1a1a" 
      letterSpacing="-6px"
      paintOrder="stroke fill"
      stroke="#ffffff"
      strokeWidth="12"
    >
      Chris
    </text>
  </svg>
);
