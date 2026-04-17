"use client";
import React, { createContext, useContext, useState, useCallback } from 'react';
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
              severity: type === 'success' ? 'info' : type,
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

  return (
    <DebugContext.Provider value={{ logs, addLog, clearLogs }}>
      {children}
    </DebugContext.Provider>
  );
};
