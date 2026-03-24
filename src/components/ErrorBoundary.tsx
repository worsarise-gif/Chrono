"use client";
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    toast.error('An unexpected application error occurred.');
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-screen bg-[#000000] text-white font-sans">
          <div className="max-w-md w-full mx-4 p-8 bg-[#111111] border border-gray-800 rounded-2xl shadow-2xl flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
              <AlertTriangle className="text-red-500" size={32} />
            </div>
            <h2 className="text-2xl font-semibold text-white mb-3 tracking-tight">Something went wrong</h2>
            <p className="text-[15px] text-gray-400 mb-8 leading-relaxed">
              {this.state.error?.message || 'An unexpected error occurred while loading this page.'}
            </p>
            <button
              className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-gray-100 text-black font-medium rounded-xl transition-colors w-full justify-center"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
            >
              <RefreshCcw size={18} />
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
