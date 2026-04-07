"use client";

import React, { useState, useEffect } from 'react';
import AdminGuard from '../../components/AdminGuard';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';
import { collection, query, orderBy, limit, onSnapshot, getDocs, doc, updateDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { Users, MessageSquare, Shield, Activity, Search, Filter, ArrowRight, Check, X, ChevronRight, LayoutDashboard, Settings, LogOut } from 'lucide-react';
import { PlanetLogo } from '../../components/PlanetLogo';
import Link from 'next/link';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalChats: 0,
    activeToday: 0
  });
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    // Fetch basic stats
    const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(5));
    
    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRecentUsers(users);
      setStats(prev => ({ ...prev, totalUsers: snapshot.size }));
    });

    return () => {
      unsubscribeUsers();
    };
  }, []);

  return (
    <AdminGuard>
      <div className="min-h-screen bg-background flex flex-col md:flex-row">
        {/* Sidebar */}
        <aside className="w-full md:w-64 bg-surface border-b md:border-r border-border flex flex-col z-50">
          <div className="p-6 flex items-center gap-3">
            <PlanetLogo className="w-8 h-8 text-foreground" />
            <span className="text-xl font-bold tracking-tight text-foreground">Q1 Admin</span>
          </div>
          
          <nav className="flex-1 px-4 py-6 space-y-2">
            <button 
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all ${activeTab === 'overview' ? 'bg-foreground text-background shadow-lg' : 'text-foreground/60 hover:bg-surface-hover hover:text-foreground'}`}
            >
              <LayoutDashboard size={18} />
              Overview
            </button>
            <button 
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all ${activeTab === 'users' ? 'bg-foreground text-background shadow-lg' : 'text-foreground/60 hover:bg-surface-hover hover:text-foreground'}`}
            >
              <Users size={18} />
              User Management
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all ${activeTab === 'settings' ? 'bg-foreground text-background shadow-lg' : 'text-foreground/60 hover:bg-surface-hover hover:text-foreground'}`}
            >
              <Settings size={18} />
              System Settings
            </button>
          </nav>

          <div className="p-4 mt-auto border-t border-border/50">
            <div className="flex items-center gap-3 p-3 bg-surface-hover rounded-2xl mb-4">
              <img src={user?.photoURL || ''} alt="" className="w-8 h-8 rounded-full border border-border" referrerPolicy="no-referrer" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-foreground truncate">{user?.displayName}</p>
                <p className="text-[10px] text-foreground/40 truncate">Administrator</p>
              </div>
            </div>
            <Link href="/" className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-surface-hover hover:bg-red-500/10 text-foreground/60 hover:text-red-500 rounded-xl text-xs font-bold transition-all">
              <LogOut size={14} />
              Exit Admin
            </Link>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-10">
          <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-foreground mb-1">
                {activeTab === 'overview' ? 'System Overview' : activeTab === 'users' ? 'User Management' : 'Settings'}
              </h2>
              <p className="text-foreground/60 text-sm">Welcome back to the Q1 control panel.</p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40 group-focus-within:text-foreground transition-colors" size={18} />
                <input 
                  type="text" 
                  placeholder="Search system..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-6 py-3 bg-surface border border-border rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-foreground/10 w-full md:w-64 transition-all"
                />
              </div>
              <button className="p-3 bg-surface border border-border rounded-2xl text-foreground/60 hover:text-foreground hover:bg-surface-hover transition-all">
                <Filter size={18} />
              </button>
            </div>
          </header>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {[
              { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-500' },
              { label: 'Total Chats', value: stats.totalChats, icon: MessageSquare, color: 'text-purple-500' },
              { label: 'System Health', value: '99.9%', icon: Activity, color: 'text-green-500' },
              { label: 'Security Level', value: 'High', icon: Shield, color: 'text-orange-500' }
            ].map((stat, i) => (
              <motion.div 
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-surface border border-border rounded-3xl p-6 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-2xl bg-foreground/5 ${stat.color}`}>
                    <stat.icon size={20} />
                  </div>
                  <span className="text-[10px] font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded-full">+12%</span>
                </div>
                <p className="text-2xl font-bold text-foreground mb-1">{stat.value}</p>
                <p className="text-xs text-foreground/40 font-medium uppercase tracking-wider">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Content Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Activity */}
            <div className="lg:col-span-2 space-y-8">
              <section className="bg-surface border border-border rounded-[32px] overflow-hidden shadow-sm">
                <div className="px-8 py-6 border-b border-border flex items-center justify-between">
                  <h3 className="font-bold text-foreground">Recent Users</h3>
                  <button className="text-xs font-bold text-foreground/40 hover:text-foreground transition-colors flex items-center gap-1">
                    View All <ArrowRight size={14} />
                  </button>
                </div>
                <div className="divide-y divide-border">
                  {recentUsers.length > 0 ? recentUsers.map((u) => (
                    <div key={u.id} className="px-8 py-5 flex items-center justify-between hover:bg-surface-hover transition-colors group">
                      <div className="flex items-center gap-4">
                        <img src={u.photoURL || ''} alt="" className="w-10 h-10 rounded-full border border-border" referrerPolicy="no-referrer" />
                        <div>
                          <p className="text-sm font-bold text-foreground">{u.displayName || 'Anonymous'}</p>
                          <p className="text-xs text-foreground/40">{u.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${u.role === 'admin' ? 'bg-purple-500/10 text-purple-500' : 'bg-blue-500/10 text-blue-500'}`}>
                          {u.role || 'user'}
                        </span>
                        <button className="p-2 text-foreground/20 group-hover:text-foreground/60 hover:text-foreground transition-colors">
                          <ChevronRight size={18} />
                        </button>
                      </div>
                    </div>
                  )) : (
                    <div className="p-10 text-center text-foreground/40 text-sm">No users found.</div>
                  )}
                </div>
              </section>
            </div>

            {/* System Status */}
            <div className="space-y-8">
              <section className="bg-surface border border-border rounded-[32px] p-8 shadow-sm">
                <h3 className="font-bold text-foreground mb-6">System Status</h3>
                <div className="space-y-6">
                  {[
                    { name: 'API Gateway', status: 'Operational', color: 'bg-green-500' },
                    { name: 'Database', status: 'Operational', color: 'bg-green-500' },
                    { name: 'Storage', status: 'Operational', color: 'bg-green-500' },
                    { name: 'AI Models', status: 'High Load', color: 'bg-orange-500' }
                  ].map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${item.color} animate-pulse`} />
                        <span className="text-sm font-medium text-foreground">{item.name}</span>
                      </div>
                      <span className="text-xs text-foreground/40">{item.status}</span>
                    </div>
                  ))}
                </div>
                <button className="w-full mt-8 py-3 bg-foreground/5 hover:bg-foreground/10 text-foreground text-xs font-bold rounded-2xl transition-all">
                  View Detailed Logs
                </button>
              </section>

              <section className="bg-foreground text-background rounded-[32px] p-8 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700" />
                <h3 className="font-bold mb-2 relative z-10">Security Alert</h3>
                <p className="text-xs opacity-70 mb-6 relative z-10">All systems are currently monitored. No unauthorized access attempts detected in the last 24 hours.</p>
                <div className="flex items-center gap-2 relative z-10">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    <Shield size={14} />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest">Protected by Q1-SEC</span>
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>
    </AdminGuard>
  );
}
