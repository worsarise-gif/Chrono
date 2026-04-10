"use client";
import React, { useEffect, useState } from 'react';
import { Search, SquarePen, AudioLines, Image as ImageIcon, ChevronsLeft, ChevronsRight, LogIn, Trash2, MoreVertical, Sun, Moon, Edit2, Check, X, Shield, Pin, PinOff } from 'lucide-react';
import { PlanetLogo } from './PlanetLogo';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { useChatContext } from '../contexts/ChatContext';
import { loginWithGoogle, db, auth } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../utils/firebaseErrorHandler';
import { handleError } from '../utils/errorHandler';
import { Helix } from 'ldrs/react';
import 'ldrs/react/Helix.css';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from 'next-themes';
import { useRouter, usePathname } from 'next/navigation';
import { ProfileModal } from './ProfileModal';
import { ChatHistoryModal } from './ChatHistoryModal';

interface Chat {
  id: string;
  title: string;
  updatedAt: any;
  isPinned?: boolean;
}

const NavItem = ({ icon, label, onClick, active, hasDot, isCollapsed, index }: any) => {
  return (
    <li className="w-full relative group">
      <button
        onClick={onClick}
        className={`flex items-center w-[calc(100%-16px)] mx-2 rounded-full transition-all relative pointer-events-auto h-[40px] ${active ? 'text-foreground bg-surface-hover' : 'text-foreground/60 hover:text-foreground'} ${!isCollapsed && !active ? 'hover:bg-surface-hover/50' : ''}`}
      >
        {/* Stationary Icon Container */}
        <div className="w-[52px] flex-shrink-0 flex items-center justify-center relative h-full">
          {/* Hover Highlight Background for Collapsed State */}
          {isCollapsed && !active && (
            <div className="absolute inset-0 flex items-center justify-center z-0">
              <div className="w-10 h-10 rounded-full bg-transparent group-hover:bg-surface-hover/50 transition-colors duration-200"></div>
            </div>
          )}
          <div className="relative z-10 flex items-center justify-center">
            {icon}
          </div>
          {hasDot && (
            <div className={`absolute top-2 right-2 w-2 h-2 rounded-full bg-[#5c6ad2] border-2 border-background transition-opacity duration-300 z-20 ${isCollapsed ? 'opacity-100' : 'opacity-0'}`}></div>
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
            top: `${60 + index * 42 + 20}px`,
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
  const { user, isAdmin } = useAuth();
  const { currentChatId, setCurrentChatId } = useChatContext();
  const router = useRouter();
  const pathname = usePathname();
  const [chats, setChats] = useState<Chat[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [chatToDelete, setChatToDelete] = useState<{ id: string, title: string } | null>(null);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [isSavingTitle, setIsSavingTitle] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isChatHistoryModalOpen, setIsChatHistoryModalOpen] = useState(false);
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

  const handleStartEdit = (e: React.MouseEvent, chatId: string, currentTitle: string) => {
    e.stopPropagation();
    setEditingChatId(chatId);
    setEditingTitle(currentTitle);
    setActiveMenuId(null);
  };

  const handleSaveTitle = async (chatId: string) => {
    if (!user || !editingTitle.trim() || isSavingTitle) return;
    
    setIsSavingTitle(true);
    try {
      await updateDoc(doc(db, 'users', user.uid, 'chats', chatId), {
        title: editingTitle.trim(),
        updatedAt: serverTimestamp()
      });
      setEditingChatId(null);
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}/chats/${chatId}`);
      } catch (e) {
        handleError(e, "Failed to update chat title");
      }
    } finally {
      setIsSavingTitle(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingChatId(null);
    setEditingTitle("");
  };

  const handleTogglePin = async (e: React.MouseEvent, chatId: string, currentPinned: boolean) => {
    e.stopPropagation();
    if (!user) return;
    
    try {
      await updateDoc(doc(db, 'users', user.uid, 'chats', chatId), {
        isPinned: !currentPinned,
        updatedAt: serverTimestamp()
      });
      setActiveMenuId(null);
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}/chats/${chatId}`);
      } catch (e) {
        handleError(e, "Failed to toggle pin status");
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
      
      // Sort by isPinned first, then updatedAt
      chatData.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        
        const timeA = a.updatedAt?.toDate?.()?.getTime() || 0;
        const timeB = b.updatedAt?.toDate?.()?.getTime() || 0;
        return timeB - timeA;
      });

      setChats(chatData);
      setIsLoadingChats(false);
    }, (error) => {
      // Ignore errors if the user is logged out or logging out
      if (!auth.currentUser) return;
      
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
      <div className={`h-[100dvh] bg-sidebar-bg text-foreground border-r border-border z-50 font-sans transition-all duration-300 ease-in-out fixed md:relative ${isCollapsed ? 'w-[68px] overflow-visible' : 'w-[250px] overflow-x-hidden'} ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="w-full h-full flex flex-col">
        {/* Header / Logo Section */}
        <div className="flex items-center pt-5 pb-4 h-[60px] relative">
          <div className="w-[68px] flex-shrink-0 flex items-center justify-center">
            <PlanetLogo className="text-foreground w-6 h-6" />
          </div>
          <div className={`flex-1 flex items-center justify-end pr-4 transition-opacity duration-300 ${isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <button
              onClick={() => setIsCollapsed(true)}
              className="text-foreground/60 hover:text-foreground transition-colors p-1 rounded-md hover:bg-surface hidden md:block"
            >
              <ChevronsLeft size={16} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Main Nav */}
        <nav className="transition-all duration-300">
          <ul className="space-y-0.5">
            <NavItem icon={<Search size={18} strokeWidth={2} />} label="Search" onClick={() => {}} isCollapsed={isCollapsed} index={0} />
            <NavItem icon={<SquarePen size={18} strokeWidth={2} />} label="Chat" onClick={() => { setCurrentChatId(null); setIsMobileOpen?.(false); }} active={!currentChatId && !pathname.startsWith('/imagine')} isCollapsed={isCollapsed} index={1} />
            <NavItem icon={<AudioLines size={18} strokeWidth={2} />} label="Voice" onClick={() => {}} isCollapsed={isCollapsed} index={2} />
            <NavItem icon={<ImageIcon size={18} strokeWidth={2} />} label="Imagined" onClick={() => { router.push('/imagine'); setIsMobileOpen?.(false); }} active={pathname.startsWith('/imagine')} hasDot isCollapsed={isCollapsed} index={3} />
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
                      {editingChatId === chat.id ? (
                        <div className="flex items-center gap-1 px-2 py-1 bg-surface rounded-lg border border-blue-500/50">
                          <input
                            autoFocus
                            type="text"
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveTitle(chat.id);
                              if (e.key === 'Escape') handleCancelEdit();
                            }}
                            className="flex-1 bg-transparent border-none outline-none text-[13px] text-foreground py-1"
                          />
                          <button 
                            onClick={() => handleSaveTitle(chat.id)}
                            disabled={isSavingTitle}
                            className="p-1 text-green-500 hover:bg-green-500/10 rounded transition-colors"
                          >
                            <Check size={14} />
                          </button>
                          <button 
                            onClick={handleCancelEdit}
                            className="p-1 text-red-500 hover:bg-red-500/10 rounded transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setCurrentChatId(chat.id);
                              setIsMobileOpen?.(false);
                            }}
                            className={`w-[calc(100%-16px)] mx-2 text-left block px-3 py-2 rounded-full transition-colors text-[13px] font-normal truncate pr-8 ${currentChatId === chat.id ? 'text-foreground bg-surface-hover' : 'text-foreground/60 hover:bg-surface-hover/50 hover:text-foreground'}`}
                            title={chat.title}
                          >
                            {chat.title}
                          </button>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuId(activeMenuId === chat.id ? null : chat.id);
                            }}
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-surface text-foreground/60 hover:text-foreground transition-all z-[60] flex items-center justify-center"
                            title="More options"
                          >
                            <div className="relative w-3.5 h-3.5 flex items-center justify-center">
                              <Pin 
                                size={14} 
                                className={`absolute transition-all duration-200 ${chat.isPinned ? 'text-blue-500 fill-blue-500/20 opacity-100' : 'opacity-0'} group-hover:opacity-0 group-hover:scale-75`} 
                              />
                              <MoreVertical 
                                size={14} 
                                className="absolute transition-all duration-200 opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100" 
                              />
                            </div>
                          </button>

                          {activeMenuId === chat.id && (
                            <>
                              <div 
                                className="fixed inset-0 z-[100]" 
                                onClick={() => setActiveMenuId(null)}
                              />
                              <div className="absolute right-2 top-10 bg-surface border border-border rounded-lg shadow-xl py-1 z-[101] min-w-[120px]">
                                <button
                                  onClick={(e) => handleTogglePin(e, chat.id, !!chat.isPinned)}
                                  className="w-full text-left px-3 py-1.5 text-[12px] text-foreground/60 hover:bg-surface-hover flex items-center gap-2 transition-colors"
                                >
                                  {chat.isPinned ? <PinOff size={12} /> : <Pin size={12} />}
                                  {chat.isPinned ? 'Unpin' : 'Pin'}
                                </button>
                                <button
                                  onClick={(e) => handleStartEdit(e, chat.id, chat.title)}
                                  className="w-full text-left px-3 py-1.5 text-[12px] text-foreground/60 hover:bg-surface-hover flex items-center gap-2 transition-colors"
                                >
                                  <Edit2 size={12} />
                                  Edit Title
                                </button>
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
                        </>
                      )}
                    </li>
                  ))}
                </ul>
                <button 
                  onClick={() => setIsChatHistoryModalOpen(true)}
                  className="text-left px-3 py-2 text-[13px] text-foreground/40 hover:text-foreground mt-2 font-normal"
                >
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
              className="text-foreground/60 hover:text-foreground transition-colors p-2 rounded-full hover:bg-surface pointer-events-auto"
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

          {/* Admin Panel Link */}
          {isAdmin && (
            <div className="w-[68px] flex-shrink-0 flex items-center justify-center group relative mb-2">
              <Link 
                href="/admin"
                className="w-9 h-9 rounded-full bg-foreground/5 hover:bg-foreground/10 flex items-center justify-center text-foreground/60 hover:text-foreground transition-all flex-shrink-0 shadow-sm pointer-events-auto"
                title="Admin Dashboard"
              >
                <Shield size={18} />
              </Link>
              
              {/* Admin Tooltip */}
              {isCollapsed && (
                <div className="fixed left-[76px] bg-surface-hover text-foreground text-[11px] px-[10px] py-[6px] rounded-[6px] opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-[9999] font-medium shadow-2xl transition-all duration-200 ease-in-out border border-border ml-[-10px] group-hover:ml-0 bottom-[72px]">
                  <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 bg-surface-hover border-l border-b border-border rotate-45"></div>
                  Admin Dashboard
                </div>
              )}
            </div>
          )}

          {/* User Profile / Login */}
          <div className="w-[68px] flex-shrink-0 flex items-center justify-center group relative">
            {user ? (
              <>
                <div 
                  onClick={() => setIsProfileModalOpen(true)}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white font-medium text-[14px] cursor-pointer hover:opacity-90 transition-opacity flex-shrink-0 shadow-sm pointer-events-auto overflow-hidden"
                  style={{ 
                    backgroundColor: (user.profile?.photoURL || user.photoURL) ? 'transparent' : `hsl(${(user.email?.length || 0) * 137.5 % 360}, 60%, 50%)` 
                  }}
                >
                  {(user.profile?.photoURL || user.photoURL) ? (
                    <img src={user.profile?.photoURL || user.photoURL || ''} alt={user.profile?.displayName || user.displayName || 'User'} className="w-full h-full object-cover" />
                  ) : (
                    (user.profile?.displayName || user.displayName)?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'J'
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

      {/* Chat History Modal */}
      <ChatHistoryModal
        isOpen={isChatHistoryModalOpen}
        onClose={() => setIsChatHistoryModalOpen(false)}
        chats={chats}
        onSelectChat={(id) => {
          setCurrentChatId(id);
          setIsMobileOpen?.(false);
        }}
        onDeleteChat={(id, title) => {
          setChatToDelete({ id, title });
        }}
        currentChatId={currentChatId}
      />

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {chatToDelete && (
          <div className="fixed inset-0 z-[20000] flex items-center justify-center p-4">
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
                  <p className="text-sm text-foreground/60 leading-relaxed">
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
                    className="w-full py-3 px-4 bg-transparent hover:bg-surface text-foreground/60 hover:text-foreground rounded-xl font-medium transition-colors"
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
