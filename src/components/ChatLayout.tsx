"use client";

import React, { useState } from 'react';
import Sidebar from './Sidebar';
import ChatArea from './ChatArea';
import ImagineGallery from './ImagineGallery';
import StarryBackground from './StarryBackground';
import { useAuth } from '../contexts/AuthContext';
import { usePathname } from 'next/navigation';

export default function ChatLayout({ children }: { children?: React.ReactNode }) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { user } = useAuth();
  const pathname = usePathname();

  const isImaginePage = pathname === '/imagine';

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
