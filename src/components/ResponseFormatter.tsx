import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Check, Copy } from 'lucide-react';

interface ResponseFormatterProps {
  content: string;
}

const CodeBlock = ({ language, value }: { language: string, value: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-5 rounded-xl overflow-hidden border border-gray-800 bg-[#1e1e1e] font-sans">
      <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d2d] border-b border-gray-800">
        <span className="text-xs font-mono text-gray-400 lowercase">{language || 'text'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
        >
          {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <div className="text-[13px] leading-relaxed overflow-x-auto">
        <SyntaxHighlighter
          language={language || 'text'}
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            padding: '1rem',
            background: 'transparent',
          }}
          PreTag="div"
        >
          {value}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

export const ResponseFormatter: React.FC<ResponseFormatterProps> = ({ content }) => {
  return (
    <div className="prose prose-invert prose-p:leading-relaxed prose-headings:font-semibold prose-headings:tracking-tight prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline prose-li:marker:text-gray-500 max-w-none font-medium break-words">
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            const isInline = !match && !String(children).includes('\n');

            if (isInline) {
              return (
                <code className="bg-[#2a2a2a] text-gray-200 px-1.5 py-0.5 rounded-md text-sm font-mono before:content-none after:content-none" {...props}>
                  {children}
                </code>
              );
            }

            return <CodeBlock language={language} value={String(children).replace(/\n$/, '')} />;
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
