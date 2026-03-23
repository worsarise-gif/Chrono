/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import StarryBackground from './components/StarryBackground';
import { AuthProvider } from './contexts/AuthContext';
import { ChatProvider } from './contexts/ChatContext';
import { ErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <ChatProvider>
          <div className="flex h-screen bg-[#000000] text-white font-sans overflow-hidden selection:bg-gray-800 selection:text-white relative">
            <StarryBackground />
            <Sidebar isMobileOpen={isMobileSidebarOpen} setIsMobileOpen={setIsMobileSidebarOpen} />
            <ChatArea onMenuClick={() => setIsMobileSidebarOpen(true)} />
          </div>
        </ChatProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
