"use client";

import React, { useEffect, useState } from 'react';
import { Moon, Sun, Calendar, Shield, ChevronLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from 'next-themes';
import Link from 'next/link';

export default function SettingsPage() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!user) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background text-foreground p-4">
        <div className="animate-pulse text-foreground/50">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background text-foreground p-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="inline-flex items-center gap-2 text-foreground/60 hover:text-foreground mb-6 transition-colors">
          <ChevronLeft size={20} />
          <span>Back</span>
        </Link>
        <div className="bg-surface border border-border/40 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-8">
            <h2 className="text-xl font-medium text-foreground mb-6 text-center">Settings</h2>

            <div className="w-full space-y-2">
              {/* Theme Toggle */}
              <div className="flex items-center justify-between py-3 px-2">
                <div className="flex items-center gap-3 text-foreground/70">
                  {mounted && (theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />)}
                  <span className="text-sm font-medium">Appearance</span>
                </div>
                <button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="text-xs font-medium text-foreground/80 hover:text-foreground transition-colors bg-background border border-border/50 hover:bg-surface-hover px-3 py-1.5 rounded-lg"
                >
                  {mounted && (theme === 'dark' ? 'Dark Mode' : 'Light Mode')}
                </button>
              </div>

              {/* Joined */}
              <div className="flex items-center justify-between py-3 px-2">
                <div className="flex items-center gap-3 text-foreground/70">
                  <Calendar size={18} />
                  <span className="text-sm font-medium">Joined</span>
                </div>
                <span className="text-sm text-foreground/60">
                  {user.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Recently'}
                </span>
              </div>

              {/* Role */}
              <div className="flex items-center justify-between py-3 px-2">
                <div className="flex items-center gap-3 text-foreground/70">
                  <Shield size={18} />
                  <span className="text-sm font-medium">Role</span>
                </div>
                <span className="text-sm text-foreground/60 capitalize">
                  {user.profile?.role || 'User'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
