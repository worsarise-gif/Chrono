import React from 'react';
import { Search, ExternalLink, Globe } from 'lucide-react';
import { motion } from 'motion/react';

export interface SearchResultItem {
  title: string;
  link: string;
  snippet: string;
}

export interface SearchResultsData {
  query: string;
  results: SearchResultItem[];
}

export const SearchResults: React.FC<{ data: SearchResultsData }> = ({ data }) => {
  if (!data || !data.results || data.results.length === 0) {
    return null;
  }

  return (
    <div className="my-6 flex flex-col gap-4 not-prose w-full">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground/80 px-1">
        <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
          <Search size={14} />
        </div>
        <span>
          Sources for <span className="text-foreground font-semibold">"{data.query}"</span>
        </span>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {data.results.map((res, idx) => {
          let hostname = res.link;
          try { hostname = new URL(res.link).hostname.replace('www.', ''); } catch (e) {}
          
          return (
            <motion.a 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              key={idx} 
              href={res.link} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex flex-col p-4 rounded-2xl border border-border/60 bg-surface/40 hover:bg-surface hover:border-border/80 hover:shadow-sm transition-all no-underline group h-full"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-5 h-5 rounded-full bg-foreground/5 flex items-center justify-center text-foreground/60 group-hover:text-blue-500 transition-colors shrink-0">
                  <Globe size={10} />
                </div>
                <div className="text-[11px] font-medium text-foreground/60 group-hover:text-foreground/80 truncate transition-colors">
                  {hostname}
                </div>
              </div>
              
              <div className="font-semibold text-foreground/90 group-hover:text-blue-500 line-clamp-2 text-sm mb-2 transition-colors leading-snug">
                {res.title}
              </div>
              
              <div className="text-xs text-foreground/60 line-clamp-3 leading-relaxed mt-auto">
                {res.snippet}
              </div>
            </motion.a>
          );
        })}
      </div>
    </div>
  );
};
