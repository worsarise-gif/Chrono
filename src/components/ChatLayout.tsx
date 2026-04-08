"use client";

import React, { useState } from 'react';
import Sidebar from './Sidebar';
import ChatArea from './ChatArea';
import ImagineGallery from './ImagineGallery';
import StarryBackground from './StarryBackground';
import { useAuth } from '../contexts/AuthContext';
import { usePathname } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { LogOut } from 'lucide-react';

export default function ChatLayout({ children }: { children?: React.ReactNode }) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { user, isBanned } = useAuth();
  const pathname = usePathname();

  const handleSwitchAccount = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const isImaginePage = pathname === '/imagine';

  if (isBanned) {
    return (
      <div className="flex h-[100dvh] w-full relative items-center justify-center bg-background text-foreground">
        <StarryBackground />
        <div className="relative z-10 bg-surface border border-border p-8 rounded-2xl max-w-md text-center shadow-2xl">
          <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">Account Suspended</h2>
          <p className="text-muted-foreground text-sm mb-6">
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
