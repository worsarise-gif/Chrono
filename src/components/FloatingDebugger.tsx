"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useDebug } from '../contexts/DebugContext';
import { useAuth } from '../contexts/AuthContext';

// Simple fallback for clsx/tailwind-merge since utils.ts doesn't exist
const cn = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(' ');

export function FloatingDebugger() {
  const { user } = useAuth();
  const { logs, clearLogs } = useDebug();

  const [isExpanded, setIsExpanded] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });

  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs arrive and expanded
  useEffect(() => {
    if (isExpanded && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isExpanded]);

  // Only render for the specific user
  if (user?.email !== 'johnkerveelayese@gmail.com') {
    return null;
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only drag from the header
    if ((e.target as HTMLElement).closest('.debugger-header')) {
      setIsDragging(true);
      dragStartPos.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y
      };
      e.currentTarget.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStartPos.current.x,
        y: e.clientY - dragStartPos.current.y
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      setIsDragging(false);
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const getLogColor = (type: string) => {
    switch (type) {
      case 'error': return 'text-red-500';
      case 'warning': return 'text-yellow-500';
      case 'success': return 'text-green-500';
      case 'info':
      default: return 'text-blue-400';
    }
  };

  return (
    <div
      className={cn(
        "fixed z-[9999] bg-surface-elevated/90 border border-border rounded-lg shadow-2xl backdrop-blur-md flex flex-col overflow-hidden transition-all duration-200",
        isExpanded ? "w-96 h-[500px]" : "w-64 h-12",
        isDragging && "opacity-80"
      )}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        touchAction: 'none'
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div className="debugger-header flex items-center justify-between p-3 bg-surface-elevated cursor-move border-b border-border/50 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
          <span className="text-xs font-bold font-mono tracking-wider text-foreground">SYSTEM DEBUGGER</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-foreground-muted font-mono">{logs.length} logs</span>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-surface rounded text-foreground-muted hover:text-foreground transition-colors"
            title={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
            )}
          </button>
        </div>
      </div>

      {isExpanded && (
        <>
          <div className="flex-1 overflow-y-auto p-3 font-mono text-xs flex flex-col gap-2 custom-scrollbar">
            {logs.length === 0 ? (
              <div className="text-foreground-muted italic text-center mt-4">No logs captured yet.</div>
            ) : (
              [...logs].reverse().map((log) => (
                <div key={log.id} className="border-b border-border/30 pb-2 last:border-0 hover:bg-surface/50 p-1 rounded transition-colors">
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className={cn("font-bold uppercase", getLogColor(log.type))}>
                      [{log.type}]
                    </span>
                    <span className="text-foreground-muted">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 })}
                    </span>
                  </div>
                  <div className="text-foreground font-semibold mb-1 break-words">
                    {log.component} &gt; {log.message}
                  </div>
                  {log.details && (
                    <pre className="text-[10px] bg-surface/50 p-2 rounded overflow-x-auto text-foreground-muted whitespace-pre-wrap break-words">
                      {typeof log.details === 'object'
                        ? JSON.stringify(log.details, null, 2)
                        : String(log.details)}
                    </pre>
                  )}
                </div>
              ))
            )}
            <div ref={logsEndRef} />
          </div>
          <div className="p-2 border-t border-border/50 bg-surface flex justify-end shrink-0">
            <button
              onClick={clearLogs}
              className="text-xs bg-surface-elevated hover:bg-destructive hover:text-destructive-foreground border border-border px-3 py-1 rounded transition-colors"
            >
              Clear Logs
            </button>
          </div>
        </>
      )}
    </div>
  );
}
