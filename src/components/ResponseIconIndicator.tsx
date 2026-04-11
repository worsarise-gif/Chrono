import React from 'react';
import styled from 'styled-components';

interface ResponseIconIndicatorProps {
  status: string;
  isStreaming?: boolean;
}

const ResponseIconIndicator: React.FC<ResponseIconIndicatorProps> = ({ status, isStreaming }) => {
  return (
    <Container>
      <IconWrapper>
        <StyledWrapper>
          <div className="loader">
            <svg width={100} height={100} viewBox="0 0 100 100">
              <defs>
                <mask id="clipping">
                  <polygon points="0,0 100,0 100,100 0,100" fill="black" />
                  <polygon points="25,25 75,25 50,75" fill="white" />
                  <polygon points="50,25 75,75 25,75" fill="white" />
                  <polygon points="35,35 65,35 50,65" fill="white" />
                  <polygon points="35,35 65,35 50,65" fill="white" />
                  <polygon points="35,35 65,35 50,65" fill="white" />
                  <polygon points="35,35 65,35 50,65" fill="white" />
                </mask>
              </defs>
            </svg>
            <div className="box" />
          </div>
        </StyledWrapper>
      </IconWrapper>
      <StatusText isStreaming={isStreaming}>
        {status}
        {isStreaming && <StreamingDots />}
      </StatusText>
    </Container>
  );
};

const StreamingDots = () => {
  return (
    <DotsContainer>
      <Dot delay="0s" />
      <Dot delay="0.2s" />
      <Dot delay="0.4s" />
    </DotsContainer>
  );
};

const Container = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 4px;
`;

const IconWrapper = styled.div`
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const StatusText = styled.div<{ isStreaming?: boolean }>`
  font-size: 13px;
  font-weight: 500;
  color: var(--muted-foreground, #737373);
  display: flex;
  align-items: center;
  gap: 4px;
  transition: color 0.3s ease;
  
  ${props => props.isStreaming && `
    color: var(--foreground, #171717);
  `}
`;

const DotsContainer = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 2px;
  margin-left: 2px;
`;

const Dot = styled.span<{ delay: string }>`
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background-color: currentColor;
  animation: pulse 1.4s infinite ease-in-out both;
  animation-delay: ${props => props.delay};

  @keyframes pulse {
    0%, 80%, 100% { transform: scale(0); opacity: 0.5; }
    40% { transform: scale(1); opacity: 1; }
  }
`;

const StyledWrapper = styled.div`
  transform: scale(0.24);
  transform-origin: center;
  display: flex;
  align-items: center;
  justify-content: center;

  .loader {
    --color-one: #ffbf48;
    --color-two: #be4a1d;
    --color-three: #ffbf4780;
    --color-four: #bf4a1d80;
    --color-five: #ffbf4740;
    --time-animation: 2s;
    --size: 1;
    position: relative;
    border-radius: 50%;
    transform: scale(var(--size));
    box-shadow:
      0 0 25px 0 var(--color-three),
      0 20px 50px 0 var(--color-four);
    animation: colorize calc(var(--time-animation) * 3) ease-in-out infinite;
  }

  .loader::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100px;
    height: 100px;
    border-radius: 50%;
    border-top: solid 1px var(--color-one);
    border-bottom: solid 1px var(--color-two);
    background: linear-gradient(180deg, var(--color-five), var(--color-four));
    box-shadow:
      inset 0 10px 10px 0 var(--color-three),
      inset 0 -10px 10px 0 var(--color-four);
  }

  .loader .box {
    width: 100px;
    height: 100px;
    background: linear-gradient(
      180deg,
      var(--color-one) 30%,
      var(--color-two) 70%
    );
    mask: url(#clipping);
    -webkit-mask: url(#clipping);
  }

  .loader svg {
    position: absolute;
  }

  .loader svg #clipping {
    filter: contrast(15);
    animation: roundness calc(var(--time-animation) / 2) linear infinite;
  }

  .loader svg #clipping polygon {
    filter: blur(7px);
  }

  .loader svg #clipping polygon:nth-child(1) {
    transform-origin: 75% 25%;
    transform: rotate(90deg);
  }

  .loader svg #clipping polygon:nth-child(2) {
    transform-origin: 50% 50%;
    animation: rotation var(--time-animation) linear infinite reverse;
  }

  .loader svg #clipping polygon:nth-child(3) {
    transform-origin: 50% 60%;
    animation: rotation var(--time-animation) linear infinite;
    animation-delay: calc(var(--time-animation) / -3);
  }

  .loader svg #clipping polygon:nth-child(4) {
    transform-origin: 40% 40%;
    animation: rotation var(--time-animation) linear infinite reverse;
  }

  .loader svg #clipping polygon:nth-child(5) {
    transform-origin: 40% 40%;
    animation: rotation var(--time-animation) linear infinite reverse;
    animation-delay: calc(var(--time-animation) / -2);
  }

  .loader svg #clipping polygon:nth-child(6) {
    transform-origin: 60% 40%;
    animation: rotation var(--time-animation) linear infinite;
  }

  .loader svg #clipping polygon:nth-child(7) {
    transform-origin: 60% 40%;
    animation: rotation var(--time-animation) linear infinite;
    animation-delay: calc(var(--time-animation) / -1.5);
  }

  @keyframes rotation {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  @keyframes roundness {
    0% {
      filter: contrast(15);
    }
    20% {
      filter: contrast(3);
    }
    40% {
      filter: contrast(3);
    }
    60% {
      filter: contrast(15);
    }
    100% {
      filter: contrast(15);
    }
  }

  @keyframes colorize {
    0% {
      filter: hue-rotate(0deg);
    }
    20% {
      filter: hue-rotate(-30deg);
    }
    40% {
      filter: hue-rotate(-60deg);
    }
    60% {
      filter: hue-rotate(-90deg);
    }
    80% {
      filter: hue-rotate(-45deg);
    }
    100% {
      filter: hue-rotate(0deg);
    }
  }
`;

export default ResponseIconIndicator;
