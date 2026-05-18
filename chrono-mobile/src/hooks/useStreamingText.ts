import { useState, useEffect } from 'react';

export function useStreamingText(fullText: string, isStreaming: boolean) {
  const [displayText, setDisplayText] = useState(isStreaming ? '' : fullText);

  useEffect(() => {
    if (!isStreaming) {
      setDisplayText(fullText);
      return;
    }

    setDisplayText(''); // Reset when streaming starts
    let index = 0;

    const intervalId = setInterval(() => {
      setDisplayText((prev) => {
        if (index < fullText.length) {
          const nextChar = fullText.charAt(index);
          index++;
          return prev + nextChar;
        } else {
          clearInterval(intervalId);
          return prev;
        }
      });
    }, 20);

    return () => clearInterval(intervalId);
  }, [fullText, isStreaming]);

  return displayText;
}