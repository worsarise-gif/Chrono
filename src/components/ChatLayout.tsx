"use client";

import React, { useState } from 'react';
import Sidebar from './Sidebar';
import ChatArea from './ChatArea';
import ImagineGallery from './ImagineGallery';
import StarryBackground from './StarryBackground';
import AuthPage from './AuthPage';
import { useAuth } from '../contexts/AuthContext';
import { usePathname } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { LogOut } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Settings } from 'lucide-react';


export default function ChatLayout({ children }: { children?: React.ReactNode }) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('We are currently undergoing scheduled maintenance. Please check back later.');
  const { user, isBanned, isAdmin, loading } = useAuth();

  React.useEffect(() => {
    const unsub = onSnapshot(doc(db, 'config', 'system'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setMaintenanceMode(!!data.maintenanceMode);
        if (data.maintenanceMessage) {
          setMaintenanceMessage(data.maintenanceMessage);
        }
      }
    });
    return () => unsub();
  }, []);

  const pathname = usePathname();

  const handleSwitchAccount = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const isImaginePage = pathname === '/imagine';


  if (maintenanceMode && !isAdmin) {
    return (
      <div className="flex h-[100dvh] w-full relative items-center justify-center bg-background text-foreground">
        <StarryBackground />
        <div className="relative z-10 bg-surface border border-border p-8 rounded-2xl max-w-md text-center shadow-2xl">
          <div className="w-16 h-16 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Settings size={32} className="animate-spin-slow" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Under Maintenance</h2>
          <p className="text-muted-foreground text-sm mb-6">
            {maintenanceMessage}
          </p>
          <button
            onClick={handleSwitchAccount}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-surface-hover border border-border rounded-xl font-medium hover:bg-background transition-all shadow-sm text-sm"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

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
      {/* Mobile Top Scrim */}
      <div className="fixed top-0 left-0 right-0 h-[calc(6rem+env(safe-area-inset-top))] bg-gradient-to-b from-chat-bg via-chat-bg/80 to-transparent z-[39] pointer-events-none md:hidden" />
      <StarryBackground />
      {user && <Sidebar isMobileOpen={isMobileSidebarOpen} setIsMobileOpen={setIsMobileSidebarOpen} />}
      {!isImaginePage && <ChatArea onMenuClick={() => setIsMobileSidebarOpen(true)} />}
      {isImaginePage && <ImagineGallery onMenuClick={() => setIsMobileSidebarOpen(true)} />}
      {children}
    </div>
  );
}
