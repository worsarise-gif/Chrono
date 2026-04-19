"use client";
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useDebug, DebugLog } from '../contexts/DebugContext';
import { X, Terminal, ChevronDown, ChevronUp, Trash2, Maximize2, Minimize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function FloatingDebugger() {
  const { user, isAdmin } = useAuth();
  const { logs, clearLogs } = useDebug();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  if (!isAdmin && user?.email !== 'johnkerveelayese@gmail.com') {
    return null;
  }

  const getTypeColor = (type: DebugLog['type']) => {
    switch (type) {
      case 'error': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'warning': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'success': return 'text-green-500 bg-green-500/10 border-green-500/20';
      default: return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    }
  };

  return (
    <motion.div
      drag
      dragMomentum={false}
      className={`fixed z-[9999] transition-all duration-300 ${isOpen ? (isExpanded ? 'inset-4' : 'bottom-4 right-4 w-[500px] h-[400px]') : 'bottom-4 right-4 w-auto h-auto'}`}
    >
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-gray-900 text-green-400 p-3 rounded-full shadow-2xl border border-gray-700 hover:bg-gray-800 flex items-center gap-2"
        >
          <Terminal size={20} />
          <span className="font-mono text-xs font-bold">DEBUG ({logs.length})</span>
        </button>
      ) : (
        <div className="flex flex-col w-full h-full bg-gray-950 border border-gray-800 rounded-xl shadow-2xl overflow-hidden font-mono text-xs">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800">
            <div className="flex items-center gap-2 text-gray-300">
              <Terminal size={16} />
              <span className="font-bold">System Debugger</span>
              <span className="px-2 py-0.5 bg-gray-800 rounded text-gray-400">{logs.length} events</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={clearLogs} className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded" title="Clear Logs">
                <Trash2 size={14} />
              </button>
              <button onClick={() => setIsExpanded(!isExpanded)} className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded" title={isExpanded ? "Minimize" : "Maximize"}>
                {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              </button>
              <button onClick={() => setIsOpen(false)} className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded" title="Close">
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Log List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
            {logs.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-600">
                No debug events recorded yet.
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className={`border rounded p-2 ${getTypeColor(log.type)}`}>
                  <div 
                    className="flex items-start justify-between cursor-pointer"
                    onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="opacity-50">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                        <span className="font-bold uppercase">[{log.component}]</span>
                        <span className="text-gray-200">{log.message}</span>
                      </div>
                    </div>
                    {log.details && (
                      <button className="p-1 opacity-50 hover:opacity-100">
                        {expandedLogId === log.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    )}
                  </div>
                  
                  <AnimatePresence>
                    {expandedLogId === log.id && log.details && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-2 pt-2 border-t border-current/20 overflow-hidden"
                      >
                        <pre className="text-[10px] sm:text-xs overflow-x-auto p-2 bg-black/20 rounded whitespace-pre-wrap break-words">
                          {typeof log.details === 'string' ? log.details : JSON.stringify(log.details, null, 2)}
                        </pre>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
