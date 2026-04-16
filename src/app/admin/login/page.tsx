"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { motion } from 'motion/react';
import { Shield, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { PlanetLogo } from '../../../components/PlanetLogo';

export default function AdminLoginPage() {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user && isAdmin) {
      router.push('/admin');
    }
  }, [user, isAdmin, loading, router]);

  const handleLogin = async () => {
    try {
      // Just push to main app where normal login happens
      router.push('/');
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-foreground/40">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-foreground/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-foreground/5 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-surface border border-border rounded-3xl p-8 md:p-10 shadow-2xl relative z-10"
      >
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 bg-foreground/5 rounded-2xl flex items-center justify-center mb-6">
            <Shield className="w-8 h-8 text-foreground" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Admin Access</h1>
          <p className="text-foreground/60">Secure portal for Q1 administrators</p>
        </div>

        {user && !isAdmin ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-500">Access Denied</p>
              <p className="text-xs text-red-500/80 mt-1">
                Your account ({user.email}) does not have administrative privileges. Please contact the system owner.
              </p>
            </div>
          </motion.div>
        ) : null}

        <div className="space-y-4">
          <button
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-foreground text-background rounded-2xl font-semibold hover:opacity-90 transition-all shadow-lg group"
          >
            Sign in
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          <p className="text-center text-xs text-foreground/40 mt-6">
            By signing in, you agree to the administrative terms of service and security policies.
          </p>
        </div>

        <div className="mt-10 pt-8 border-t border-border/50 flex items-center justify-center gap-2">
          <PlanetLogo className="w-5 h-5 text-foreground/20" />
          <span className="text-[10px] uppercase tracking-[0.2em] text-foreground/20 font-bold">Q1 Control Panel</span>
        </div>
      </motion.div>
    </div>
  );
}
