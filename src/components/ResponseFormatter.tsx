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
    <div className="prose prose-invert prose-p:leading-relaxed prose-headings:font-semibold prose-headings:tracking-tight prose-li:marker:text-gray-500 max-w-none font-medium break-words">
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={{
          a({ node, children, href, ...props }: any) {
            const text = String(children);
            // Check if it's a citation like [link] or [1]
            if (text === 'link' || text.match(/^\[?\d+\]?$/)) {
              return (
                <a 
                  href={href} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold bg-blue-500/20 text-blue-400 rounded-full ml-1 hover:bg-blue-500/40 transition-colors no-underline align-super border border-blue-500/30"
                  title={href}
                  {...props}
                >
                  {text === 'link' ? '🔗' : text.replace(/[\[\]]/g, '')}
                </a>
              );
            }
            return (
              <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline decoration-blue-400/30 underline-offset-2 transition-colors font-semibold" {...props}>
                {children}
              </a>
            );
          },
          blockquote({ node, children, ...props }: any) {
            return (
              <blockquote className="border-l-4 border-blue-500 bg-[#2a2a2a]/40 px-5 py-3 rounded-r-xl my-5 text-gray-300 not-italic shadow-sm" {...props}>
                {children}
              </blockquote>
            );
          },
          table({ node, children, ...props }: any) {
            return (
              <div className="overflow-x-auto my-6 rounded-xl border border-gray-800 bg-[#1e1e1e]/50">
                <table className="w-full text-sm text-left m-0" {...props}>
                  {children}
                </table>
              </div>
            );
          },
          th({ node, children, ...props }: any) {
            return <th className="bg-[#2d2d2d] px-4 py-3 font-semibold text-gray-200 border-b border-gray-800 whitespace-nowrap" {...props}>{children}</th>;
          },
          td({ node, children, ...props }: any) {
            return <td className="px-4 py-3 border-b border-gray-800/50 text-gray-300" {...props}>{children}</td>;
          },
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            const isInline = !match && !String(children).includes('\n');

            if (isInline) {
              return (
                <code className="bg-[#2a2a2a] text-gray-200 px-1.5 py-0.5 rounded-md text-sm font-mono before:content-none after:content-none border border-gray-800" {...props}>
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
