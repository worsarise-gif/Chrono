import React from 'react';

interface ResponseIconIndicatorProps {
  status: string;
  isStreaming?: boolean;
}

const ResponseIconIndicator: React.FC<ResponseIconIndicatorProps> = ({ status, isStreaming }) => {
  return (
    <div className="container-wrapper">
      <style>{`
        .container-wrapper {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 4px;
        }

        .icon-wrapper {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .styled-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
        }

        .styled-wrapper .loader {
          --color-one: #ffbf48;
          --color-two: #be4a1d;
          --color-three: #ffbf4780;
          --color-four: #bf4a1d80;
          --color-five: #ffbf4740;
          --time-animation: 2s;
          position: relative;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          
          /* Isolate hue rotation to the GPU */
          will-change: filter;
          animation: colorize calc(var(--time-animation) * 3) ease-in-out infinite;
          box-shadow:
            0 0 6px 0 var(--color-three),
            0 4.8px 12px 0 var(--color-four);
        }

        .styled-wrapper .loader::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border-top: solid 0.5px var(--color-one);
          border-bottom: solid 0.5px var(--color-two);
          background: linear-gradient(180deg, var(--color-five), var(--color-four));
          box-shadow:
            inset 0 2.4px 2.4px 0 var(--color-three),
            inset 0 -2.4px 2.4px 0 var(--color-four);
        }

        .styled-wrapper .loader svg {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }

        /* Hardcoded pixel coordinates for foolproof hardware-accelerated rotation */
        .styled-wrapper .loader svg .poly-1 {
          transform-origin: 12px 12px;
          animation: rotation var(--time-animation) linear infinite reverse;
        }
        .styled-wrapper .loader svg .poly-2 {
          transform-origin: 12px 14.4px;
          animation: rotation var(--time-animation) linear infinite;
          animation-delay: calc(var(--time-animation) / -3);
        }
        .styled-wrapper .loader svg .poly-3 {
          transform-origin: 9.6px 9.6px;
          animation: rotation var(--time-animation) linear infinite reverse;
        }
        .styled-wrapper .loader svg .poly-4 {
          transform-origin: 9.6px 9.6px;
          animation: rotation var(--time-animation) linear infinite reverse;
          animation-delay: calc(var(--time-animation) / -2);
        }
        .styled-wrapper .loader svg .poly-5 {
          transform-origin: 14.4px 9.6px;
          animation: rotation var(--time-animation) linear infinite;
        }
        .styled-wrapper .loader svg .poly-6 {
          transform-origin: 14.4px 9.6px;
          animation: rotation var(--time-animation) linear infinite;
          animation-delay: calc(var(--time-animation) / -1.5);
        }

        @keyframes rotation {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes colorize {
          0% { filter: hue-rotate(0deg); }
          20% { filter: hue-rotate(-30deg); }
          40% { filter: hue-rotate(-60deg); }
          60% { filter: hue-rotate(-90deg); }
          80% { filter: hue-rotate(-45deg); }
          100% { filter: hue-rotate(0deg); }
        }

        .status-text {
          font-size: 13px;
          font-weight: 500;
          color: var(--muted-foreground, #737373);
          display: flex;
          align-items: center;
          gap: 4px;
          transition: color 0.3s ease;
        }
        
        .status-text.streaming {
          color: var(--foreground, #171717);
        }

        .dots-container {
          display: inline-flex;
          align-items: center;
          gap: 2px;
          margin-left: 2px;
        }

        .dot {
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background-color: currentColor;
          will-change: transform, opacity;
          animation: pulse 1.4s infinite ease-in-out both;
        }

        @keyframes pulse {
          0%, 80%, 100% { transform: scale(0) translateZ(0); opacity: 0.5; }
          40% { transform: scale(1) translateZ(0); opacity: 1; }
        }
      `}</style>

      <div className="icon-wrapper">
        <div className="styled-wrapper">
          <div className="loader">
            <svg width={24} height={24} viewBox="0 0 24 24">
              <defs>
                <linearGradient id="goo-grad" x1="0" y1="0" x2="0" y2="24" gradientUnits="userSpaceOnUse">
                  <stop offset="30%" stopColor="var(--color-one)" />
                  <stop offset="70%" stopColor="var(--color-two)" />
                </linearGradient>
                
                <filter id="goo-filter" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="blur" />
                  <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="goo" />
                </filter>
              </defs>
              
              <g filter="url(#goo-filter)">
                <polygon points="6,6 18,6 12,18" fill="url(#goo-grad)" className="poly-1" />
                <polygon points="12,6 18,18 6,18" fill="url(#goo-grad)" className="poly-2" />
                <polygon points="8.4,8.4 15.6,8.4 12,15.6" fill="url(#goo-grad)" className="poly-3" />
                <polygon points="8.4,8.4 15.6,8.4 12,15.6" fill="url(#goo-grad)" className="poly-4" />
                <polygon points="8.4,8.4 15.6,8.4 12,15.6" fill="url(#goo-grad)" className="poly-5" />
                <polygon points="8.4,8.4 15.6,8.4 12,15.6" fill="url(#goo-grad)" className="poly-6" />
              </g>
            </svg>
          </div>
        </div>
      </div>
      
      <div className={`status-text ${isStreaming ? 'streaming' : ''}`}>
        {status}
        {isStreaming && <StreamingDots />}
      </div>
    </div>
  );
};

const StreamingDots = () => {
  return (
    <span className="dots-container">
      <span className="dot" style={{ animationDelay: '0s' }} />
      <span className="dot" style={{ animationDelay: '0.2s' }} />
      <span className="dot" style={{ animationDelay: '0.4s' }} />
    </span>
  );
};

export default ResponseIconIndicator;