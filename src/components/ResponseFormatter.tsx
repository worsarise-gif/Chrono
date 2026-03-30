import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, prism } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Check, Copy, Search, ExternalLink, ChevronDown } from 'lucide-react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'motion/react';

interface ResponseFormatterProps {
  content: string;
  isStreaming?: boolean;
}

const useSmoothTyping = (text: string, isStreaming: boolean) => {
  const [displayedText, setDisplayedText] = useState(isStreaming ? '' : text);
  const textRef = useRef(text);
  const displayedTextRef = useRef(isStreaming ? '' : text);

  useEffect(() => {
    textRef.current = text;
    if (!isStreaming) {
      setDisplayedText(text);
      displayedTextRef.current = text;
    }
  }, [text, isStreaming]);

  useEffect(() => {
    if (!isStreaming) return;

    const interval = setInterval(() => {
      const target = textRef.current;
      const current = displayedTextRef.current;
      
      if (current !== target) {
        if (target.length < current.length || !target.startsWith(current)) {
          // If target was reset or changed completely
          displayedTextRef.current = target;
          setDisplayedText(target);
        } else {
          const diff = target.length - current.length;
          // Even slower, more natural typing speed - adding 1-2 chars at a time
          const charsToAdd = Math.max(1, Math.floor(diff / 30)); 
          const nextText = target.slice(0, current.length + charsToAdd);
          displayedTextRef.current = nextText;
          setDisplayedText(nextText);
        }
      }
    }, 60); // Slightly slower interval for more natural feel

    return () => clearInterval(interval);
  }, [isStreaming]);

  return displayedText;
};

const CodeBlock = ({ language, value }: { language: string, value: string }) => {
  const [copied, setCopied] = useState(false);
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentTheme = resolvedTheme || theme || 'dark';
  const syntaxStyle = currentTheme === 'dark' ? vscDarkPlus : prism;

  if (!mounted) {
    return (
      <div className="relative group my-6 rounded-xl overflow-hidden border border-border/30 bg-surface/50 font-sans animate-pulse h-32" />
    );
  }

  return (
    <div className="relative group my-6 rounded-xl overflow-hidden border border-border/30 bg-surface/50 font-sans transition-all duration-300 shadow-sm">
      <div className="flex items-center justify-between px-4 py-2.5 bg-surface/80 border-b border-border/20 backdrop-blur-sm">
        <span className="text-[11px] font-mono text-muted uppercase tracking-wider font-semibold">{language || 'text'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-[11px] text-muted hover:text-foreground transition-colors font-medium"
        >
          {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <div className="text-[13px] leading-relaxed overflow-x-auto p-1">
        <SyntaxHighlighter
          language={language || 'text'}
          style={syntaxStyle}
          customStyle={{
            margin: 0,
            padding: '1.25rem',
            background: 'transparent',
            fontSize: '13.5px',
            lineHeight: '1.6',
          }}
          PreTag="div"
        >
          {value}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

const ThinkingProcess = ({ content }: { content: string }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="my-4 border border-border/50 rounded-xl overflow-hidden bg-surface/20 transition-all duration-300">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-hover transition-colors text-xs font-medium text-muted group"
      >
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center">
            <div className={`absolute inset-0 rounded-full blur-sm transition-opacity duration-500 ${isOpen ? 'bg-blue-500/20 opacity-100' : 'bg-transparent opacity-0'}`} />
            <div className={`w-1.5 h-1.5 rounded-full transition-all duration-500 relative z-10 ${isOpen ? 'bg-blue-500 scale-125' : 'bg-muted/40'}`} />
          </div>
          <span className={`tracking-wide uppercase text-[10px] transition-colors duration-300 ${isOpen ? 'text-foreground' : 'text-muted'}`}>
            Thinking Process
          </span>
        </div>
        <ChevronDown 
          size={14} 
          className={`transition-transform duration-500 ease-in-out ${isOpen ? 'rotate-180 text-foreground' : 'text-muted/60 group-hover:text-muted'}`} 
        />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          >
            <div className="px-5 pb-5 pt-1 text-[13px] text-muted/80 leading-relaxed border-t border-border/30 bg-surface/10">
              <div className="prose prose-sm prose-invert max-w-none italic">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {content}
                </ReactMarkdown>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const ResponseFormatter: React.FC<ResponseFormatterProps> = ({ content, isStreaming = false }) => {
  const displayedContent = useSmoothTyping(content, isStreaming);

  // Robust Normalization Layer
  const normalizeContent = (text: string) => {
    if (!text) return text;
    
    let normalized = text;
    
    // 1. Fix unclosed code blocks (ensure even number of backticks)
    const codeBlockMatches = normalized.match(/```/g);
    if (codeBlockMatches && codeBlockMatches.length % 2 !== 0) {
      normalized += '\n```';
    }

    // 2. Fix malformed bold formatting (e.g., ** text ** -> **text**)
    normalized = normalized.replace(/\*\* (.*?) \*\*/g, '**$1**');

    // 3. Ensure proper spacing around headings to prevent rendering issues
    normalized = normalized.replace(/([^\n])\n(#+ )/g, '$1\n\n$2');

    return normalized;
  };

  const parts = displayedContent.split(/(<think>[\s\S]*?<\/think>|<think>[\s\S]*?$)/g);

  return (
    <div className={`prose prose-invert dark:prose-invert prose-p:leading-relaxed prose-headings:font-medium prose-headings:tracking-tight prose-li:marker:text-muted max-w-none font-normal break-words text-foreground prose-headings:text-foreground prose-strong:text-foreground prose-code:text-foreground ${isStreaming ? 'streaming-content' : ''}`}>
      {parts.map((part, index) => {
        if (part.startsWith('<think>')) {
          const thinkingContent = part.replace('<think>', '').replace('</think>', '').trim();
          if (!thinkingContent) return null;
          return <ThinkingProcess key={index} content={thinkingContent} />;
        }

        const normalizedContent = normalizeContent(part);
        if (!normalizedContent) return null;

        return (
          <ReactMarkdown 
            key={index}
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
                  className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-medium bg-blue-500/20 text-blue-500 rounded-full ml-1 hover:bg-blue-500/40 transition-colors no-underline align-super border border-blue-500/30"
                  title={href}
                  {...props}
                >
                  {text === 'link' ? '🔗' : text.replace(/[\[\]]/g, '')}
                </a>
              );
            }
            return (
              <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-400 underline decoration-blue-500/30 underline-offset-2 transition-colors font-medium" {...props}>
                {children}
              </a>
            );
          },
          blockquote({ node, children, ...props }: any) {
            return (
              <blockquote className="border-l-4 border-blue-500 bg-surface/40 px-5 py-3 rounded-r-xl my-5 text-muted not-italic shadow-sm" {...props}>
                {children}
              </blockquote>
            );
          },
          table({ node, children, ...props }: any) {
            return (
              <div className="overflow-x-auto my-6 rounded-xl border border-border bg-surface/50">
                <table className="w-full text-sm text-left m-0" {...props}>
                  {children}
                </table>
              </div>
            );
          },
          th({ node, children, ...props }: any) {
            return <th className="bg-surface-hover px-4 py-3 font-medium text-foreground border-b border-border whitespace-nowrap" {...props}>{children}</th>;
          },
          td({ node, children, ...props }: any) {
            return <td className="px-4 py-3 border-b border-border/50 text-muted" {...props}>{children}</td>;
          },
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-([\w-]+)/.exec(className || '');
            const language = match ? match[1] : '';
            const isInline = !match && !String(children).includes('\n');

            if (language === 'search-results') {
              try {
                const data = JSON.parse(String(children));
                return (
                  <div className="my-6 flex flex-col gap-3 not-prose">
                    <div className="flex items-center gap-2 text-sm font-normal text-muted mb-2 px-1">
                      <Search size={16} className="text-blue-500" />
                      <span>Search results for <span className="text-foreground">"{data.query}"</span></span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {data.results.map((res: any, idx: number) => {
                        let hostname = res.link;
                        try { hostname = new URL(res.link).hostname; } catch (e) {}
                        return (
                          <a key={idx} href={res.link} target="_blank" rel="noopener noreferrer" className="flex flex-col gap-2 p-4 rounded-xl border border-border bg-surface/50 hover:bg-surface-hover hover:border-border/80 transition-all no-underline group shadow-sm">
                            <div className="font-medium text-blue-500 group-hover:text-blue-400 line-clamp-1 flex items-center justify-between text-sm">
                              {res.title}
                              <ExternalLink size={14} className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2" />
                            </div>
                            <div className="text-[11px] text-muted truncate flex items-center gap-1.5">
                              <div className="w-3.5 h-3.5 rounded-full bg-surface-hover flex items-center justify-center text-[8px]">🌐</div>
                              {hostname}
                            </div>
                            <div className="text-xs text-muted line-clamp-3 leading-relaxed mt-1">{res.snippet}</div>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                );
              } catch (e) {
                return null;
              }
            }

            if (isInline) {
              return (
                <code className="bg-surface text-foreground px-1.5 py-0.5 rounded-md text-sm font-mono before:content-none after:content-none border border-border" {...props}>
                  {children}
                </code>
              );
            }

            return <CodeBlock language={language} value={String(children).replace(/\n$/, '')} />;
          }
        }}
      >
        {normalizedContent}
      </ReactMarkdown>
    );
  })}
</div>
);
};
