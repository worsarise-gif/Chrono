"use client";

import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import ChatArea from '../components/ChatArea';
import StarryBackground from '../components/StarryBackground';

export default function Home() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-full relative">
      <StarryBackground />
      <Sidebar isMobileOpen={isMobileSidebarOpen} setIsMobileOpen={setIsMobileSidebarOpen} />
      <ChatArea onMenuClick={() => setIsMobileSidebarOpen(true)} />
    </div>
  );
}
