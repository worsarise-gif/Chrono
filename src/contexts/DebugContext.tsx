"use client";
import React, { createContext, useContext, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';

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
