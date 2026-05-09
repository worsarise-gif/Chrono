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
    toast('An unexpected application error occurred.');
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-[100dvh] bg-[#000000] text-foreground font-sans">
          <div className="max-w-md w-full mx-4 p-8 bg-[#111111] border border-border rounded-2xl shadow-2xl flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-gray-500/10 rounded-full flex items-center justify-center mb-6">
              <AlertTriangle className="text-foreground-subtle" size={32} />
            </div>
            <h2 className="text-2xl font-medium text-foreground mb-3 tracking-tight">Something went wrong</h2>
            <p className="text-[15px] text-foreground-muted mb-8 leading-relaxed">
              An unexpected error occurred while loading this page. Our team has been notified.
            </p>
            <button
              className="flex items-center gap-2 px-6 py-3 bg-surface-elevated hover:bg-gray-100 text-foreground font-medium rounded-xl transition-colors w-full justify-center"
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
