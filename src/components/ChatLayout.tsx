"use client";

import React, { useState } from 'react';
import Sidebar from './Sidebar';
import ChatArea from './ChatArea';
import StarryBackground from './StarryBackground';
import { useAuth } from '../contexts/AuthContext';

export default function ChatLayout({ children }: { children?: React.ReactNode }) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="flex h-[100dvh] w-full relative">
      <StarryBackground />
      {user && <Sidebar isMobileOpen={isMobileSidebarOpen} setIsMobileOpen={setIsMobileSidebarOpen} />}
      <ChatArea onMenuClick={() => setIsMobileSidebarOpen(true)} />
      {children}
    </div>
  );
}
