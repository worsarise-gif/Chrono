import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ResponseFormatterProps {
  content: string;
}

export const ResponseFormatter: React.FC<ResponseFormatterProps> = ({ content }) => {
  return (
    <div className="prose prose-invert prose-p:leading-relaxed prose-headings:font-semibold prose-headings:tracking-tight prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline prose-code:text-pink-400 prose-code:bg-gray-800/50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-pre:bg-[#1a1a1a] prose-pre:border prose-pre:border-gray-800 prose-li:marker:text-gray-500 max-w-none font-medium break-words">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    </div>
  );
};
