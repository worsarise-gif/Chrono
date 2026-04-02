"use client";
import React, { useEffect, useState } from 'react';
import { Search, SquarePen, AudioLines, Image as ImageIcon, ChevronsLeft, ChevronsRight, LogIn, Trash2, MoreVertical, Sun, Moon } from 'lucide-react';
import { PlanetLogo } from './PlanetLogo';
import { useAuth } from '../contexts/AuthContext';
import { useChatContext } from '../contexts/ChatContext';
import { loginWithGoogle, db } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, deleteDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../utils/firebaseErrorHandler';
import { handleError } from '../utils/errorHandler';
import { Helix } from 'ldrs/react';
import 'ldrs/react/Helix.css';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from 'next-themes';
import { ProfileModal } from './ProfileModal';

interface Chat {
  id: string;
  title: string;
  updatedAt: any;
}

const NavItem = ({ icon, label, onClick, active, hasDot, isCollapsed, index }: any) => {
  return (
    <li className="w-full relative group">
      <button
        onClick={onClick}
        className={`flex items-center w-full rounded-lg transition-all relative pointer-events-auto h-[44px] ${active ? 'text-foreground' : 'text-muted hover:text-foreground'} ${!isCollapsed && !active ? 'hover:bg-surface' : ''}`}
      >
        {/* Stationary Icon Container */}
        <div className="w-[68px] flex-shrink-0 flex items-center justify-center relative">
          {/* Hover Highlight Background for Collapsed State */}
          {isCollapsed && (
            <div className="absolute inset-0 flex items-center justify-center z-0">
              <div className="w-10 h-10 rounded-[12px] bg-transparent group-hover:bg-surface-hover transition-colors duration-200"></div>
            </div>
          )}
          <div className="relative z-10 flex items-center justify-center">
            {icon}
          </div>
          {hasDot && (
            <div className={`absolute top-3 right-6 w-2 h-2 rounded-full bg-[#5c6ad2] border-2 border-background transition-opacity duration-300 z-20 ${isCollapsed ? 'opacity-100' : 'opacity-0'}`}></div>
          )}
        </div>

        {/* Label */}
        <span className={`font-medium text-[14px] whitespace-nowrap transition-all duration-300 flex-1 text-left ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'}`}>
          {label}
        </span>

        {/* Dot for Expanded State */}
        {hasDot && !isCollapsed && (
          <div className="w-1.5 h-1.5 rounded-full bg-[#5c6ad2] mr-4 flex-shrink-0 transition-opacity duration-300 opacity-100"></div>
        )}
      </button>
      
      {/* Tooltip - Fixed positioning to float above everything */}
      {isCollapsed && (
        <div 
          className="fixed left-[76px] bg-surface-hover text-foreground text-[11px] px-[10px] py-[6px] rounded-[6px] opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-[9999] font-medium shadow-2xl transition-all duration-200 ease-in-out border border-border ml-[-10px] group-hover:ml-0"
          style={{ 
            top: `${60 + index * 44.5 + 22}px`,
            transform: 'translateY(-50%)'
          }}
        >
          <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 bg-surface-hover border-l border-b border-border rotate-45"></div>
          {label}
        </div>
      )}
    </li>
  );
};

export default function Sidebar({ isMobileOpen, setIsMobileOpen }: { isMobileOpen?: boolean, setIsMobileOpen?: (val: boolean) => void }) {
  const { user } = useAuth();
  const { currentChatId, setCurrentChatId } = useChatContext();
  const [chats, setChats] = useState<Chat[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [chatToDelete, setChatToDelete] = useState<{ id: string, title: string } | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleDeleteChat = async (e: React.MouseEvent, chatId: string, chatTitle: string) => {
    e.stopPropagation();
    if (!user) return;
    setChatToDelete({ id: chatId, title: chatTitle });
    setActiveMenuId(null);
  };

  const confirmDeleteChat = async () => {
    if (!user || !chatToDelete) return;
    
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'chats', chatToDelete.id));
      if (currentChatId === chatToDelete.id) {
        setCurrentChatId(null);
      }
      setChatToDelete(null);
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}/chats/${chatToDelete.id}`);
      } catch (e) {
        handleError(e, "Failed to delete chat");
      }
    }
  };

  useEffect(() => {
    if (!user) {
      setChats([]);
      setIsLoadingChats(false);
      return;
    }

    setIsLoadingChats(true);
    const q = query(
      collection(db, 'users', user.uid, 'chats'),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatData: Chat[] = [];
      snapshot.forEach((doc) => {
        chatData.push({ id: doc.id, ...doc.data() } as Chat);
      });
      setChats(chatData);
      setIsLoadingChats(false);
    }, (error) => {
      setIsLoadingChats(false);
      try {
        handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/chats`);
      } catch (e) {
        handleError(e, "Failed to load chats");
      }
    });

    return () => unsubscribe();
  }, [user]);

  const handleNewChat = async () => {
    if (!user) return;
    try {
      const chatRef = await addDoc(collection(db, 'users', user.uid, 'chats'), {
        title: 'New Chat',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setCurrentChatId(chatRef.id);
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}/chats`);
      } catch (e) {
        handleError(e, "Failed to create new chat");
      }
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden transition-opacity cursor-pointer"
          onClick={() => setIsMobileOpen?.(false)}
        />
      )}
      <div className={`h-[100dvh] bg-background text-foreground border-r border-border z-50 font-sans transition-all duration-300 ease-in-out fixed md:relative ${isCollapsed ? 'w-[68px] overflow-visible' : 'w-[250px] overflow-x-hidden'} ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="w-full h-full flex flex-col">
        {/* Header / Logo Section */}
        <div className="flex items-center pt-5 pb-4 h-[60px] relative">
          <div className="w-[68px] flex-shrink-0 flex items-center justify-center">
            <PlanetLogo className="text-foreground w-6 h-6" />
          </div>
          <div className={`flex-1 flex items-center justify-end pr-4 transition-opacity duration-300 ${isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <button
              onClick={() => setIsCollapsed(true)}
              className="text-muted hover:text-foreground transition-colors p-1 rounded-md hover:bg-surface hidden md:block"
            >
              <ChevronsLeft size={16} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Main Nav */}
        <nav className="transition-all duration-300">
          <ul className="space-y-0.5">
            <NavItem icon={<Search size={18} strokeWidth={2} />} label="Search" onClick={() => {}} isCollapsed={isCollapsed} index={0} />
            <NavItem icon={<SquarePen size={18} strokeWidth={2} />} label="Chat" onClick={() => { setCurrentChatId(null); setIsMobileOpen?.(false); }} active={!currentChatId} isCollapsed={isCollapsed} index={1} />
            <NavItem icon={<AudioLines size={18} strokeWidth={2} />} label="Voice" onClick={() => {}} isCollapsed={isCollapsed} index={2} />
            <NavItem icon={<ImageIcon size={18} strokeWidth={2} />} label="Imagine" onClick={() => {}} hasDot isCollapsed={isCollapsed} index={3} />
          </ul>
        </nav>

        {/* Divider */}
        <div className={`mx-4 h-px bg-border my-3 transition-opacity duration-300 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}></div>

        {/* Chat History (Scrollable) */}
        <div className={`flex-1 overflow-y-auto sidebar-scroll transition-all duration-300 ${isCollapsed ? 'scrollbar-hide' : ''}`}>
          <div className={`px-2 pb-2 flex flex-col min-h-full transition-opacity duration-300 ${isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            {isLoadingChats ? (
              <div className="flex justify-center py-4">
                <Helix size="24" speed="2.5" color="var(--color-foreground)" />
              </div>
            ) : chats.length > 0 && (
              <>
                <ul className="space-y-0.5 flex-1">
                  {chats.map(chat => (
                    <li key={chat.id} className="group relative">
                      <button
                        onClick={() => {
                          setCurrentChatId(chat.id);
                          setIsMobileOpen?.(false);
                        }}
                        className={`w-full text-left block px-3 py-2 rounded-lg transition-colors text-[13px] font-normal truncate pr-8 ${currentChatId === chat.id ? 'text-foreground bg-surface' : 'text-muted hover:bg-surface hover:text-foreground'}`}
                      >
                        {chat.title}
                      </button>
                      
                      {/* Chat Title Full Visibility on Hover */}
                      <div className="absolute left-0 top-0 w-full h-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-[50]">
                        <div className="absolute left-0 top-0 min-w-full bg-surface border border-border rounded-lg px-3 py-2 text-[13px] text-foreground shadow-xl whitespace-normal break-words z-[51]">
                          {chat.title}
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(activeMenuId === chat.id ? null : chat.id);
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md opacity-100 md:opacity-0 md:group-hover:opacity-100 hover:bg-surface-hover text-muted hover:text-foreground transition-all z-[60]"
                        title="More options"
                      >
                        <MoreVertical size={14} />
                      </button>

                      {activeMenuId === chat.id && (
                        <>
                          <div 
                            className="fixed inset-0 z-[100]" 
                            onClick={() => setActiveMenuId(null)}
                          />
                          <div className="absolute right-2 top-10 bg-surface border border-border rounded-lg shadow-xl py-1 z-[101] min-w-[120px]">
                            <button
                              onClick={(e) => {
                                handleDeleteChat(e, chat.id, chat.title);
                              }}
                              className="w-full text-left px-3 py-1.5 text-[12px] text-red-400 hover:bg-surface-hover flex items-center gap-2 transition-colors"
                            >
                              <Trash2 size={12} />
                              Delete
                            </button>
                          </div>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
                <button className="text-left px-3 py-2 text-[13px] text-gray-400 hover:text-white mt-2 font-normal">
                  See all
                </button>
              </>
            )}
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-auto relative pb-4 pt-2">
          {/* Expand Toggle Button */}
          <div className={`absolute bottom-[112px] left-0 w-[68px] flex justify-center transition-opacity duration-300 hidden md:flex group ${isCollapsed ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <button
              onClick={() => setIsCollapsed(false)}
              className="text-muted hover:text-foreground transition-colors p-2 rounded-full hover:bg-surface pointer-events-auto"
            >
              <ChevronsRight size={20} strokeWidth={1.5} />
            </button>
            
            {/* Expand Tooltip */}
            {isCollapsed && (
              <div className="fixed left-[76px] bg-surface-hover text-foreground text-[11px] px-[10px] py-[6px] rounded-[6px] opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-[9999] font-medium shadow-2xl transition-all duration-200 ease-in-out border border-border ml-[-10px] group-hover:ml-0 bottom-[118px]">
                <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 bg-surface-hover border-l border-b border-border rotate-45"></div>
                Expand Sidebar
              </div>
            )}
          </div>

          {/* User Profile / Login */}
          <div className="w-[68px] flex-shrink-0 flex items-center justify-center group relative">
            {user ? (
              <>
                <div 
                  onClick={() => setIsProfileModalOpen(true)}
                  className="w-9 h-9 rounded-full bg-[#f43f5e] flex items-center justify-center text-white font-medium text-[14px] cursor-pointer hover:opacity-90 transition-opacity flex-shrink-0 shadow-sm pointer-events-auto overflow-hidden"
                >
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName || 'User'} className="w-full h-full object-cover" />
                  ) : (
                    user.displayName?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'J'
                  )}
                </div>
                
                {/* Profile Tooltip */}
                {isCollapsed && (
                  <div className="fixed left-[76px] bg-surface-hover text-foreground text-[11px] px-[10px] py-[6px] rounded-[6px] opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-[9999] font-medium shadow-2xl transition-all duration-200 ease-in-out border border-border ml-[-10px] group-hover:ml-0 bottom-[22px]">
                    <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 bg-surface-hover border-l border-b border-border rotate-45"></div>
                    Profile Settings
                  </div>
                )}
              </>
            ) : (
              <>
                <button onClick={loginWithGoogle} className="w-9 h-9 rounded-full bg-[#f43f5e] flex items-center justify-center text-white hover:opacity-90 transition-opacity flex-shrink-0 shadow-sm pointer-events-auto">
                  <LogIn size={16} />
                </button>
                
                {/* Login Tooltip */}
                {isCollapsed && (
                  <div className="fixed left-[76px] bg-surface-hover text-foreground text-[11px] px-[10px] py-[6px] rounded-[6px] opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-[9999] font-medium shadow-2xl transition-all duration-200 ease-in-out border border-border ml-[-10px] group-hover:ml-0 bottom-[22px]">
                    <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 bg-surface-hover border-l border-b border-border rotate-45"></div>
                    Login with Google
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        </div>
      </div>

      {/* Profile Modal */}
      <ProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
      />

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {chatToDelete && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setChatToDelete(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-surface border border-border w-full max-w-[360px] rounded-[24px] p-6 shadow-2xl overflow-hidden"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-2">
                  <Trash2 size={24} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-foreground">Delete Chat?</h3>
                  <p className="text-sm text-muted leading-relaxed">
                    This will permanently delete <span className="text-foreground font-medium">"{chatToDelete.title}"</span> and all its messages. This action cannot be undone.
                  </p>
                </div>
                <div className="flex flex-col w-full gap-2 pt-2">
                  <button
                    onClick={confirmDeleteChat}
                    className="w-full py-3 px-4 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setChatToDelete(null)}
                    className="w-full py-3 px-4 bg-transparent hover:bg-surface text-muted hover:text-foreground rounded-xl font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
