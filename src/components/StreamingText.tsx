'use client';

import React, { useMemo, useRef } from 'react';

interface StreamingTextProps {
  content: string;
  isStreaming: boolean;
}

// Track how many words were rendered last time to only animate NEW words
const StreamingText = React.memo(({ content, isStreaming }: StreamingTextProps) => {
  const prevWordCountRef = useRef(0);

  const words = useMemo(() => content.split(/(\s+)/), [content]);

  const renderedWords = useMemo(() => {
    const result = words.map((word, index) => {
      const isNew = isStreaming && index >= prevWordCountRef.current;
      return (
        <span
          key={index}
          className={isNew ? 'word-appear' : undefined}
          style={isNew ? { animationDelay: `${Math.min((index - prevWordCountRef.current) * 8, 80)}ms` } : undefined}
        >
          {word}
        </span>
      );
    });
    // After render, update the ref to current word count
    // (use a timeout so it runs after paint)
    setTimeout(() => {
      prevWordCountRef.current = words.length;
    }, 0);
    return result;
  }, [words, isStreaming]);

  return <>{renderedWords}</>;
});

StreamingText.displayName = 'StreamingText';
export default StreamingText;
