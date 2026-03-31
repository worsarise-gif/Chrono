import React from 'react';

interface LoaderProps {
  text?: string;
}

const Loader: React.FC<LoaderProps> = ({ text = "Thinking..." }) => {
  return (
    <div className="flex items-center gap-2 py-2 px-1">
      <div aria-label={text} role="status" className="flex items-center">
        <svg className="h-5 w-5 animate-spin stroke-muted" viewBox="0 0 256 256" fill="none">
          <line x1={128} y1={32} x2={128} y2={64} strokeLinecap="round" strokeLinejoin="round" strokeWidth={24} />
          <line x1="195.9" y1="60.1" x2="173.3" y2="82.7" strokeLinecap="round" strokeLinejoin="round" strokeWidth={24} />
          <line x1={224} y1={128} x2={192} y2={128} strokeLinecap="round" strokeLinejoin="round" strokeWidth={24} />
          <line x1="195.9" y1="195.9" x2="173.3" y2="173.3" strokeLinecap="round" strokeLinejoin="round" strokeWidth={24} />
          <line x1={128} y1={224} x2={128} y2={192} strokeLinecap="round" strokeLinejoin="round" strokeWidth={24} />
          <line x1="60.1" y1="195.9" x2="82.7" y2="173.3" strokeLinecap="round" strokeLinejoin="round" strokeWidth={24} />
          <line x1={32} y1={128} x2={64} y2={128} strokeLinecap="round" strokeLinejoin="round" strokeWidth={24} />
          <line x1="60.1" y1="60.1" x2="82.7" y2="82.7" strokeLinecap="round" strokeLinejoin="round" strokeWidth={24} />
        </svg>
        <span className="ml-2 text-[13px] font-medium text-muted">
          {text}
        </span>
      </div>
    </div>
  );
}

export default Loader;
