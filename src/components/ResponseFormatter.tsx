import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown, { defaultUrlTransform } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Check, Copy, Search, ExternalLink, ChevronDown, Maximize2, Download, X } from 'lucide-react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'motion/react';

interface ResponseFormatterProps {
  content: string;
  isStreaming?: boolean;
}

let globalMounted = false;

const CodeBlock = ({ language, value }: { language: string, value: string }) => {
  const [copied, setCopied] = useState(false);
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(globalMounted);

  useEffect(() => {
    globalMounted = true;
    setMounted(true);
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentTheme = resolvedTheme || theme || 'dark';
  const syntaxStyle = currentTheme === 'dark' ? vscDarkPlus : oneLight;

  if (!mounted) {
    return (
      <div className="relative group my-6 rounded-xl overflow-hidden border border-border/30 bg-surface/50 font-sans animate-pulse h-32" />
    );
  }

  // Sleek light mode background: very subtle off-white/gray
  // Sleek dark mode background: existing surface/50
  const containerBg = 'bg-transparent';
  const headerBg = currentTheme === 'dark' ? 'bg-surface/20' : 'bg-surface/10';
  const borderColor = currentTheme === 'dark' ? 'border-border/30' : 'border-gray-200';

  return (
    <div className={`relative group my-6 rounded-2xl overflow-hidden border ${borderColor} ${containerBg} font-sans transition-all duration-300 shadow-sm`}>
      <div className={`flex items-center justify-between px-4 py-2.5 ${headerBg} border-b ${borderColor}/50 backdrop-blur-sm rounded-t-2xl`}>
        <span className="text-[11px] font-mono text-foreground uppercase tracking-wider font-semibold">{language || 'text'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-[11px] text-foreground/40 hover:text-foreground transition-colors font-medium"
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
          codeTagProps={{
            style: {
              background: 'transparent',
            }
          }}
          PreTag="div"
        >
          {value}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

const ThinkingProcess = ({ content, isStreaming }: { content: string, isStreaming?: boolean }) => {
  const [isOpen, setIsOpen] = useState(isStreaming || false);

  useEffect(() => {
    if (isStreaming) {
      setIsOpen(true);
    }
  }, [isStreaming]);

  return (
    <div className="my-4 border border-border/50 rounded-2xl overflow-hidden bg-transparent transition-all duration-300">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-hover transition-colors text-xs font-medium text-foreground/40 group"
      >
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center">
            <div className={`absolute inset-0 rounded-full blur-sm transition-opacity duration-500 ${isOpen ? 'bg-blue-500/20 opacity-100' : 'bg-transparent opacity-0'}`} />
            <div className={`w-1.5 h-1.5 rounded-full transition-all duration-500 relative z-10 ${isOpen ? 'bg-blue-500 scale-125' : 'bg-foreground/20'}`} />
          </div>
          <span className={`tracking-wide uppercase text-[10px] transition-colors duration-300 text-foreground/40`}>
            Thinking Process
          </span>
        </div>
        <ChevronDown 
          size={14} 
          className={`transition-transform duration-500 ease-in-out ${isOpen ? 'rotate-180 text-foreground/40' : 'text-foreground/40'}`} 
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
            <div className="px-5 pb-5 pt-1 text-[13px] text-foreground leading-relaxed border-t border-border/30 bg-transparent">
              <div className="prose prose-sm dark:prose-invert max-w-none italic prose-p:text-foreground prose-li:text-foreground">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                  urlTransform={(url) => {
                    if (url.startsWith('data:image/')) return url;
                    return defaultUrlTransform(url);
                  }}
                >
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

const loadedImages = new Set<string>();

const ImageRenderer = ({ src, alt, onImageClick, ...props }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(!loadedImages.has(src));

  const handleImageClick = () => {
    if (onImageClick) {
      onImageClick(src);
    } else {
      setIsOpen(true);
    }
  };

  const handleLoad = () => {
    setIsLoading(false);
    loadedImages.add(src);
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      const img = new Image();
      if (!src.startsWith('data:')) {
        img.crossOrigin = "anonymous";
      }
      img.src = src;
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Could not get canvas context");
      
      // Fill with white background in case of transparency
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      
      const pngUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = pngUrl;
      link.download = (alt || 'generated-image').replace(/\.[^/.]+$/, "") + '.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Failed to convert image to PNG:", error);
      // Fallback to direct download if conversion fails
      const link = document.createElement('a');
      link.href = src;
      // If we fallback to src and it's webp, we shouldn't name it .png as it will be corrupted
      const isWebp = src.startsWith('data:image/webp') || src.includes('.webp');
      const ext = isWebp ? '.webp' : '.png';
      link.download = (alt || 'generated-image').replace(/\.[^/.]+$/, "") + ext;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <>
      <div 
        className="relative flex w-fit max-w-full rounded-2xl overflow-hidden cursor-pointer group border-2 border-transparent transition-colors"
        onClick={handleImageClick}
      >
        {isLoading && (
          <div className="absolute inset-0 bg-muted animate-pulse rounded-2xl" />
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src={src} 
          alt={alt || 'Generated Image'} 
          className={`max-w-full h-auto block rounded-2xl transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`} 
          loading="lazy" 
          onLoad={handleLoad}
          {...props} 
        />
        <div className="absolute inset-0 rounded-2xl bg-transparent transition-colors flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 bg-transparent dark:bg-black/50 text-foreground p-2 rounded-full backdrop-blur-sm transition-opacity">
            <Maximize2 size={20} />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 md:p-8"
            onClick={() => setIsOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative max-w-5xl w-full max-h-full flex flex-col items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative w-fit h-fit group">
                <div className="absolute top-5 right-5 flex gap-3 z-10">
                  <button 
                    onClick={handleDownload}
                    className="p-2 bg-black/20 hover:bg-black/40 backdrop-blur-sm border border-white/10 rounded-full text-white/70 hover:text-white transition-all duration-200 drop-shadow-md"
                    title="Download Image"
                  >
                    <Download size={20} />
                  </button>
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="p-2 bg-black/20 hover:bg-black/40 backdrop-blur-sm border border-white/10 rounded-full text-white/70 hover:text-white transition-all duration-200 drop-shadow-md"
                    title="Close"
                  >
                    <X size={20} />
                  </button>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={src} 
                  alt={alt || 'Generated Image'} 
                  className="max-w-full max-h-[85vh] block rounded-2xl shadow-2xl border border-white/10" 
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

interface ResponseFormatterProps {
  content: string;
  isStreaming?: boolean;
  onImageClick?: (src: string) => void;
}

export const ResponseFormatter: React.FC<ResponseFormatterProps> = React.memo(({ content, isStreaming = false, onImageClick }) => {
  const displayedContent = content;
  const onImageClickRef = React.useRef(onImageClick);

  React.useEffect(() => {
    onImageClickRef.current = onImageClick;
  }, [onImageClick]);

  const markdownComponents = React.useMemo(() => ({
    h1({ node, children, ...props }: any) {
      return <h1 className="text-xl font-bold text-foreground mt-2 mb-4" {...props}>{children}</h1>;
    },
    h2({ node, children, ...props }: any) {
      return <h2 className="text-lg font-bold text-foreground mt-2 mb-3" {...props}>{children}</h2>;
    },
    h3({ node, children, ...props }: any) {
      return (
        <h3 className="text-base font-bold mt-2 mb-3 text-foreground" {...props}>
          {children}
        </h3>
      );
    },
    p({ node, children, ...props }: any) {
      return <p className="text-foreground font-light leading-relaxed mb-3 last:mb-0 mt-0" {...props}>{children}</p>;
    },
    strong({ node, children, ...props }: any) {
      return <strong className="font-medium text-foreground" {...props}>{children}</strong>;
    },
    li({ node, children, ...props }: any) {
      return <li className="text-foreground font-light" {...props}>{children}</li>;
    },
    img({ node, src, alt, ...props }: any) {
      return <ImageRenderer src={src} alt={alt} onImageClick={(s: string) => onImageClickRef.current?.(s)} {...props} />;
    },
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
        <blockquote className="border-l-4 border-blue-500 bg-surface/40 px-5 py-4 rounded-r-2xl my-5 text-foreground not-italic shadow-sm flex flex-col justify-center" {...props}>
          {children}
        </blockquote>
      );
    },
    hr({ node, ...props }: any) {
      return <hr className="border-t border-gray-500/70 my-6" {...props} />;
    },
    table({ node, children, ...props }: any) {
      return (
        <div className="w-full overflow-x-auto my-8 rounded-xl border border-border/40 shadow-sm bg-surface/10">
          <table className="w-full text-sm text-left border-collapse !m-0" {...props}>
            {children}
          </table>
        </div>
      );
    },
    thead({ node, children, ...props }: any) {
      return <thead className="bg-surface/40" {...props}>{children}</thead>;
    },
    tbody({ node, children, ...props }: any) {
      return <tbody className="divide-y divide-border/30" {...props}>{children}</tbody>;
    },
    tr({ node, children, ...props }: any) {
      return <tr className="hover:bg-surface/20 transition-colors duration-150" {...props}>{children}</tr>;
    },
    th({ node, children, ...props }: any) {
      return <th className="!px-5 !py-3.5 font-medium text-foreground/80 border-b border-border/60 whitespace-nowrap tracking-wide text-xs uppercase" {...props}>{children}</th>;
    },
    td({ node, children, ...props }: any) {
      return <td className="!px-5 !py-4 text-foreground/90 align-top leading-relaxed" {...props}>{children}</td>;
    },
    pre({ node, children, ...props }: any) {
      return <div className="not-prose m-0 p-0 bg-transparent">{children}</div>;
    },
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-([\w-]+)/.exec(className || '');
      const language = match ? match[1] : '';
      const isInline = !match && !String(children).includes('\n');

      if (language === 'search-results') {
        return null;
      }

      if (isInline) {
        return (
          <code className="bg-surface/30 text-foreground px-1.5 py-0.5 rounded-lg text-sm font-mono before:content-none after:content-none border border-border/50" {...props}>
            {children}
          </code>
        );
      }

      return <CodeBlock language={language} value={String(children).replace(/\n$/, '')} />;
    }
  }), []);

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
    <div className={`w-full prose dark:prose-invert prose-p:leading-relaxed prose-headings:font-normal prose-headings:tracking-tight prose-li:marker:text-foreground max-w-none font-extralight break-words text-foreground prose-p:text-foreground prose-li:text-foreground prose-headings:text-foreground prose-strong:font-normal prose-strong:text-foreground prose-code:text-foreground text-[14px] md:text-[15px] ${isStreaming ? 'streaming-content' : ''}`}>
      {parts.map((part, index) => {
        if (part.startsWith('<think>')) {
          const thinkingContent = part.replace('<think>', '').replace('</think>', '').trim();
          if (!thinkingContent) return null;
          return <ThinkingProcess key={index} content={thinkingContent} isStreaming={isStreaming} />;
        }

        const normalizedContent = normalizeContent(part);
        if (!normalizedContent) return null;

        return (
          <ReactMarkdown 
            key={index}
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeKatex]}
            components={markdownComponents}
            urlTransform={(url) => {
              if (url.startsWith('data:image/')) return url;
              return defaultUrlTransform(url);
            }}
          >
            {normalizedContent}
          </ReactMarkdown>
        );
      })}
    </div>
  );
});
