"use client";
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export interface DebugLog {
  id: string;
  timestamp: number;
  type: 'info' | 'error' | 'warning' | 'success';
  component: string;
  message: string;
  details?: any;
}

interface DebugContextType {
  logs: DebugLog[];
  addLog: (type: DebugLog['type'], component: string, message: string, details?: any) => void;
  clearLogs: () => void;
}

const DebugContext = createContext<DebugContextType>({
  logs: [],
  addLog: () => {},
  clearLogs: () => {},
});

export const useDebug = () => useContext(DebugContext);

export const DebugProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [logs, setLogs] = useState<DebugLog[]>([]);
  const { user } = useAuth();

  const addLog = useCallback((type: DebugLog['type'], component: string, message: string, details?: any) => {
    setLogs(prev => {
      const newLog: DebugLog = {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: Date.now(),
        type,
        component,
        message,
        details
      };
      
      // Save global logs for admins
      if (type === 'error' || type === 'warning' || type === 'info') {
        // Run async without blocking
        setTimeout(async () => {
          try {
            // Clean up potentially undefined details that firestore doesn't like
            const cleanDetails = details ? JSON.parse(JSON.stringify(details, Object.getOwnPropertyNames(details))) : null;
            await addDoc(collection(db, 'logs'), {
              severity: (type as any) === 'success' ? 'info' : type,
              source: component,
              message,
              payload: cleanDetails || {},
              timestamp: serverTimestamp()
            });
          } catch (e) {
            // ignore
          }
        }, 0);
      }
      
      // Keep last 100 logs
      return [newLog, ...prev].slice(0, 100);
    });
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || user?.email !== 'johnkerveelayese@gmail.com') return;

    // Instrument console methods
    const originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error,
      info: console.info,
    };

    const interceptConsole = (type: 'log' | 'warn' | 'error' | 'info') => {
      console[type] = (...args: any[]) => {
        // Still call the original method to keep DevTools working
        originalConsole[type](...args);

        // Convert args to a string/object for the log details
        const msg = args.map(a => {
          if (typeof a === 'object') {
            try {
              return JSON.stringify(a);
            } catch (e) {
              return String(a);
            }
          }
          return String(a);
        }).join(' ');

        let mappedType: DebugLog['type'] = 'info';
        if (type === 'error') mappedType = 'error';
        if (type === 'warn') mappedType = 'warning';

        // Use addLog, but prefix component with 'Console'
        addLog(mappedType, 'Console', msg, args.length > 1 ? args : undefined);
      };
    };

    interceptConsole('log');
    interceptConsole('warn');
    interceptConsole('error');
    interceptConsole('info');

    // Instrument fetch API
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const url = typeof args[0] === 'string' ? args[0] : (args[0] instanceof Request ? args[0].url : String(args[0]));
      const method = (args[1] && args[1].method) || (args[0] instanceof Request ? args[0].method : 'GET');

      addLog('info', 'Network', `Fetch ${method} request started to ${url}`, args[1]);

      try {
        const response = await originalFetch(...args);

        if (!response.ok) {
           addLog('error', 'Network', `Fetch ${method} to ${url} failed with status ${response.status}`, {
             status: response.status,
             statusText: response.statusText,
           });
        } else {
           addLog('success', 'Network', `Fetch ${method} to ${url} succeeded`, {
             status: response.status,
           });
        }
        return response;
      } catch (error) {
        addLog('error', 'Network', `Fetch ${method} to ${url} encountered an exception`, error);
        throw error;
      }
    };

    // Instrument unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      addLog('error', 'Window', 'Unhandled Promise Rejection', event.reason);
    };
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Instrument global errors
    const handleError = (event: ErrorEvent) => {
      addLog('error', 'Window', `Global Error: ${event.message}`, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
      });
    };
    window.addEventListener('error', handleError);

    return () => {
      // Restore originals
      console.log = originalConsole.log;
      console.warn = originalConsole.warn;
      console.error = originalConsole.error;
      console.info = originalConsole.info;
      window.fetch = originalFetch;
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, [addLog, user?.email]);

  return (
    <DebugContext.Provider value={{ logs, addLog, clearLogs }}>
      {children}
    </DebugContext.Provider>
  );
};
