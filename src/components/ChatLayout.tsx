"use client";

import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import ChatArea from './ChatArea';
import ImagineGallery from './ImagineGallery';
import StarryBackground from './StarryBackground';
import AuthPage from './AuthPage';
import { useAuth } from '../contexts/AuthContext';
import { usePathname } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { LogOut, ShieldAlert } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';

export default function ChatLayout({ children }: { children?: React.ReactNode }) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { user, isBanned, loading, isAdmin } = useAuth();
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('We are currently undergoing scheduled maintenance. Please check back later.');
  const pathname = usePathname();

  const handleSwitchAccount = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const isImaginePage = pathname === '/imagine';

  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);

  useEffect(() => {
    const docRef = doc(db, 'system_settings', 'main');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setMaintenanceMode(data.maintenanceMode || false);
        setMaintenanceMessage(data.maintenanceMessage || 'We are currently undergoing scheduled maintenance. Please check back later.');
      }
    });

    return () => unsubscribe();
  }, []);

  const handleResendVerification = async () => {
    if (!user?.email) return;
    setIsResending(true);
    setResendSuccess(null);
    setResendError(null);
    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send verification email');
      }
      setResendSuccess('Verification code sent! Please check your inbox.');
    } catch (err: any) {
      setResendError(err.message || 'An error occurred while sending the email.');
    } finally {
      setIsResending(false);
    }
  };

  if (!user) {
    return <AuthPage />;
  }

  if (!user.emailVerified && user.providerData?.[0]?.providerId === 'password') {
    return (
      <div className="flex h-[100dvh] w-full relative items-center justify-center bg-background text-foreground">
        <StarryBackground />
        <div className="relative z-10 bg-surface border border-border p-8 rounded-2xl max-w-md w-full text-center shadow-2xl">
          <div className="w-16 h-16 bg-info/10 text-info rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
              <polyline points="22,6 12,13 2,6"></polyline>
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">Verify Your Email</h2>
          <p className="text-foreground-muted text-sm mb-6">
            Please verify your email address ({user.email}) to continue using Chrono.
          </p>

          {resendSuccess && (
            <div className="p-3 mb-4 text-sm text-success bg-success/20 border border-green-500/20 rounded-xl">
              {resendSuccess}
            </div>
          )}
          {resendError && (
            <div className="p-3 mb-4 text-sm text-destructive bg-red-900/20 border border-red-500/20 rounded-xl">
              {resendError}
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={() => window.location.href = `/verify-email?email=${encodeURIComponent(user.email || '')}`}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-foreground text-background rounded-xl font-medium hover:opacity-90 transition-all shadow-lg"
            >
              Enter Verification Code
            </button>
            <button
              onClick={handleResendVerification}
              disabled={isResending}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-surface text-foreground border border-border rounded-xl font-medium hover:bg-white/5 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isResending ? 'Sending...' : 'Resend Verification Code'}
            </button>
            <button
              onClick={handleSwitchAccount}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-surface text-foreground border border-border rounded-xl font-medium hover:bg-white/5 transition-all"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isBanned) {
    return (
      <div className="flex h-[100dvh] w-full relative items-center justify-center bg-background text-foreground">
        <StarryBackground />
        <div className="relative z-10 bg-surface border border-border p-8 rounded-2xl max-w-md text-center shadow-2xl">
          <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">Account Suspended</h2>
          <p className="text-foreground-muted text-sm mb-6">
            Your account has been suspended by an administrator. You can no longer access this application.
          </p>
          <button 
            onClick={handleSwitchAccount}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-foreground text-background rounded-xl font-medium hover:opacity-90 transition-all shadow-lg"
          >
            <LogOut size={18} />
            Login with another account
          </button>
        </div>
      </div>
    );
  }

  if (maintenanceMode && !isAdmin) {
    return (
      <div className="flex h-[100dvh] w-full relative items-center justify-center bg-background text-foreground">
        <StarryBackground />
        <div className="relative z-10 bg-surface border border-border p-8 rounded-2xl max-w-md text-center shadow-2xl">
          <div className="w-16 h-16 bg-info/10 text-info rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldAlert size={32} />
          </div>
          <h2 className="text-2xl font-bold mb-2">Maintenance Mode</h2>
          <p className="text-foreground-muted text-sm mb-6">
            {maintenanceMessage}
          </p>
          <button
            onClick={handleSwitchAccount}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-foreground text-background rounded-xl font-medium hover:opacity-90 transition-all shadow-lg"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] w-full relative">
      <StarryBackground />
      {user && <Sidebar isMobileOpen={isMobileSidebarOpen} setIsMobileOpen={setIsMobileSidebarOpen} />}
      {!isImaginePage && <ChatArea onMenuClick={() => setIsMobileSidebarOpen(true)} />}
      {isImaginePage && <ImagineGallery onMenuClick={() => setIsMobileSidebarOpen(true)} />}
      {children}
    </div>
  );
}
