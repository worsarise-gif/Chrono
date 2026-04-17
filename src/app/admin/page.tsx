"use client";

import React, { useState } from 'react';
import AdminGuard from '../../components/AdminGuard';
import { LayoutDashboard, Users, Server, Database, Terminal, Settings, LogOut, Menu, X } from 'lucide-react';
import { PlanetLogo } from '../../components/PlanetLogo';
import { useAuth } from '../../contexts/AuthContext';
import { auth } from '../../firebase';
import { signOut } from 'firebase/auth';
import Link from 'next/link';

// Import Tab Components
import OverviewTab from '../../components/admin/OverviewTab';
import UsersTab from '../../components/admin/UsersTab';
import DatabaseTab from '../../components/admin/DatabaseTab';
import LogsTab from '../../components/admin/LogsTab';
import SettingsTab from '../../components/admin/SettingsTab';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'database', label: 'Database', icon: Database },
    { id: 'logs', label: 'System Logs', icon: Terminal },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview': return <OverviewTab />;
      case 'users': return <UsersTab />;
      case 'database': return <DatabaseTab />;
      case 'logs': return <LogsTab />;
      case 'settings': return <SettingsTab />;
      default: return <OverviewTab />;
    }
  };

  return (
    <AdminGuard>
      <div className="h-screen bg-background flex flex-col md:flex-row font-sans overflow-hidden">
        
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-border bg-surface z-50 shrink-0">
          <div className="flex items-center gap-2">
            <PlanetLogo className="text-foreground" />
            <span className="font-bold tracking-tight text-foreground">Admin</span>
          </div>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-foreground">
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Sidebar */}
        <aside className={`fixed md:relative top-0 left-0 h-full w-64 bg-surface border-r border-border flex flex-col z-40 transition-transform duration-300 ease-in-out shrink-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
          <div className="p-6 hidden md:flex items-center gap-3">
            <PlanetLogo className="text-foreground" />
            <span className="text-xl font-bold tracking-tight text-foreground">Admin</span>
          </div>
          
          <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto sidebar-scroll">
            {navItems.map((item) => (
              <button 
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === item.id ? 'bg-foreground text-background shadow-md' : 'text-muted-foreground hover:bg-surface-hover hover:text-foreground'}`}
              >
                <item.icon size={18} />
                {item.label}
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-border space-y-2 shrink-0">
            <Link 
              href="/"
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-foreground bg-surface border border-border hover:bg-background transition-colors"
            >
              Back to App
            </Link>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 h-full overflow-y-auto p-6 md:p-10 lg:p-12 w-full">
          <div className="max-w-[1600px] mx-auto">
            {renderTabContent()}
          </div>
        </main>

        {/* Mobile Overlay */}
        {mobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
      </div>
    </AdminGuard>
  );
}