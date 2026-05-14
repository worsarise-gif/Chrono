"use client";
import React, { useEffect, useState } from 'react';
import { ChevronsLeft, ChevronsRight, LogIn, Trash2, MoreVertical, Check, X, Shield, Pin, PinOff, ChevronDown } from 'lucide-react';
import { SearchIcon } from './icons/SearchIcon';
import { EditIcon } from './icons/EditIcon';
import { GalleryIcon } from './icons/GalleryIcon';
import { PlanetLogo } from './PlanetLogo';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { useChatContext } from '../contexts/ChatContext';
import { db, auth, loginWithGoogle } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, deleteDoc, updateDoc, limit, startAfter, getDocs } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../utils/firebaseErrorHandler';
import { handleError } from '../utils/errorHandler';
import { Helix } from 'ldrs/react';
import 'ldrs/react/Helix.css';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from 'next-themes';
import { useRouter, usePathname } from 'next/navigation';
import { ChatHistoryModal } from './ChatHistoryModal';
import { ProfileModal } from './modals/ProfileModal';
import { SettingsModal } from './modals/SettingsModal';

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
        className={`flex items-center w-[calc(100%-16px)] mx-2 rounded-full transition-colors relative pointer-events-auto h-[40px] ${active && !isCollapsed ? 'text-foreground dark:text-white bg-surface-hover' : active && isCollapsed ? 'text-foreground dark:text-white' : 'text-foreground/60 hover:text-foreground dark:text-white dark:hover:text-white'} ${!isCollapsed && !active ? 'hover:bg-surface-hover/50' : ''}`}
      >
        {/* Stationary Icon Container */}
        <div className="w-[40px] flex-shrink-0 flex items-center justify-center relative h-full">
          {/* Hover/Active Highlight Background for Collapsed State */}
          {isCollapsed && (
            <div className="absolute inset-0 flex items-center justify-center z-0">
              <div className={`w-10 h-10 rounded-full transition-colors duration-200 ${active ? 'bg-surface-hover' : 'bg-transparent group-hover:bg-surface-hover/50'}`}></div>
            </div>
          )}
          <div className="relative z-10 flex items-center justify-center">
            {icon}
          </div>
          {hasDot && (
            <div className={`absolute top-1.5 right-1 w-2 h-2 rounded-full bg-[#5c6ad2] border-2 border-background transition-opacity duration-300 z-20 ${isCollapsed ? 'opacity-100' : 'opacity-0'}`}></div>
          )}
        </div>

        {/* Label */}
        <span className={`ml-4 font-medium text-[14px] whitespace-nowrap transition-opacity duration-300 flex-1 text-left ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'}`}>
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
          className="fixed left-[64px] bg-surface border border-border/50 text-foreground text-[11px] tracking-wide px-2.5 py-1.5 rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-[9999] font-medium shadow-sm transition-all duration-200 ease-out ml-[-4px] group-hover:ml-0"
          style={{ 
            top: `${60 + index * 42 + 20}px`,
            transform: 'translateY(-50%)'
          }}
        >
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
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMoreChats, setHasMoreChats] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(true);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [chatToDelete, setChatToDelete] = useState<{ id: string, title: string } | null>(null);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [isSavingTitle, setIsSavingTitle] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isChatHistoryModalOpen, setIsChatHistoryModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
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
    let mounted = true;
    if (!user) {
      setChats([]);
      setIsLoadingChats(false);
      return;
    }

    setIsLoadingChats(true);
    const q = query(
      collection(db, 'users', user.uid, 'chats'),
      orderBy('updatedAt', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!mounted) return;

      const chatData: Chat[] = [];
      snapshot.forEach((doc) => {
        chatData.push({ id: doc.id, ...doc.data({ serverTimestamps: 'estimate' }) } as Chat);
      });
      
      if (snapshot.docs.length > 0) {
        setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      } else {
        setHasMoreChats(false);
      }

      if (snapshot.docs.length < 20) {
        setHasMoreChats(false);
      }

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
      if (!mounted) return;
      // Ignore errors if the user is logged out or logging out
      if (!auth.currentUser) return;
      
      setIsLoadingChats(false);
      try {
        handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/chats`);
      } catch (e) {
        handleError(e, "Failed to load chats");
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [user?.uid]);

  const loadMoreChats = async () => {
    if (!user || !lastDoc || !hasMoreChats) return;

    try {
      const q = query(
        collection(db, 'users', user.uid, 'chats'),
        orderBy('updatedAt', 'desc'),
        startAfter(lastDoc),
        limit(20)
      );

      const snapshot = await getDocs(q);
      const newChatData: Chat[] = [];
      snapshot.forEach((doc) => {
        newChatData.push({ id: doc.id, ...doc.data({ serverTimestamps: 'estimate' }) } as Chat);
      });

      if (snapshot.docs.length > 0) {
        setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      } else {
        setHasMoreChats(false);
      }

      if (snapshot.docs.length < 20) {
        setHasMoreChats(false);
      }

      setChats(prevChats => {
        const merged = [...prevChats, ...newChatData];
        const unique = Array.from(new Map(merged.map(item => [item.id, item])).values());

        unique.sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;

          const timeA = a.updatedAt?.toDate?.()?.getTime() || 0;
          const timeB = b.updatedAt?.toDate?.()?.getTime() || 0;
          return timeB - timeA;
        });
        return unique;
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'load more chats');
    }
  };

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

  const groupedChats = React.useMemo(() => {
    const groups: { label: string, chats: Chat[] }[] = [
      { label: 'Today', chats: [] },
      { label: 'Yesterday', chats: [] },
      { label: 'Earlier', chats: [] }
    ];

    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    chats.forEach(chat => {
      const date = chat.updatedAt?.toDate?.() || new Date();
      const chatDate = new Date(date);
      chatDate.setHours(0, 0, 0, 0);

      if (chatDate.getTime() === today.getTime()) {
        groups[0].chats.push(chat);
      } else if (chatDate.getTime() === yesterday.getTime()) {
        groups[1].chats.push(chat);
      } else {
        groups[2].chats.push(chat);
      }
    });

    return groups.filter(g => g.chats.length > 0);
  }, [chats]);

  return (
    <>
      <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
      <SettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} />

      {/* Mobile Overlay */}
      <div
        className={`fixed inset-0 bg-black/60 z-[100] md:hidden transition-opacity duration-300 ${isMobileOpen ? 'opacity-100 pointer-events-auto cursor-pointer' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsMobileOpen?.(false)}
      />
      <div style={{ fontFamily: 'var(--font-google-sans-flex)' }} className={`h-[100dvh] bg-sidebar-bg text-foreground border-r border-border z-[101] font-normal transition-transform md:transition-all duration-300 ease-in-out fixed md:relative shrink-0 ${isCollapsed ? 'w-[56px] overflow-hidden' : 'w-[250px] overflow-hidden'} ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="w-[250px] h-full flex flex-col">
        {/* Header / Logo Section */}
        <div className="flex items-center pt-safe pb-4 min-h-[60px] relative shrink-0">
          <div className="w-[56px] flex-shrink-0 relative flex items-center justify-center group/logo min-h-[40px]">
            <Link
              href="/"
              className={`w-full flex items-center justify-center hover:opacity-80 transition-opacity ${isCollapsed ? 'opacity-100 group-hover/logo:opacity-0 group-hover/logo:pointer-events-none' : 'opacity-100'}`}
            >
              <PlanetLogo showText={false} className="text-foreground dark:text-white mx-auto" />
            </Link>

            <button
              aria-label="Expand Sidebar"
              onClick={() => setIsCollapsed?.(false)}
              className={`absolute hidden md:flex items-center justify-center text-foreground/60 dark:text-white hover:text-foreground dark:hover:text-white transition-opacity p-2 rounded-md hover:bg-surface ${isCollapsed ? 'opacity-0 group-hover/logo:opacity-100 pointer-events-none group-hover/logo:pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
            >
              <ChevronsRight size={20} strokeWidth={1.5} />
            </button>

            {/* Expand Tooltip */}
            {isCollapsed && (
              <div className="fixed hidden md:block left-[64px] bg-surface border border-border/50 text-foreground text-[11px] tracking-wide px-2.5 py-1.5 rounded-md opacity-0 group-hover/logo:opacity-100 pointer-events-none whitespace-nowrap z-[9999] font-medium shadow-sm transition-all duration-200 ease-out ml-[-4px] group-hover/logo:ml-0 top-[24px]">
                Expand Sidebar
              </div>
            )}
          </div>
          <div className={`flex-1 flex items-center justify-end pr-4 transition-opacity duration-300 ${isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <button
              aria-label="Collapse Sidebar"
              onClick={() => {
                if (window.innerWidth < 768) {
                  setIsMobileOpen?.(false);
                } else {
                  setIsCollapsed?.(true);
                }
              }}
              className="text-foreground/60 hover:text-foreground dark:text-white dark:hover:text-white transition-colors p-1 rounded-md hover:bg-surface"
            >
              <ChevronsLeft size={16} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Main Nav */}
        <nav className="shrink-0">
          <ul className="space-y-0.5">
            <NavItem 
              icon={<SearchIcon style={{ width: '18px', height: '18px' }} />}
              label="Search" 
              onClick={() => setIsChatHistoryModalOpen(true)} 
              isCollapsed={isCollapsed} 
              index={0} 
            />
            <NavItem icon={<EditIcon style={{ width: '18px', height: '18px' }} />} label="Chat" onClick={() => { setCurrentChatId(null); setIsMobileOpen?.(false); }} active={!currentChatId && !pathname.startsWith('/imagine')} isCollapsed={isCollapsed} index={1} />
            <NavItem icon={<GalleryIcon style={{ width: '18px', height: '18px' }} />} label="Imagined" onClick={() => { router.push('/imagine'); setIsMobileOpen?.(false); }} active={pathname.startsWith('/imagine')} hasDot isCollapsed={isCollapsed} index={2} />
          </ul>
        </nav>

        {/* History Section Header */}
        <div
          className={`mt-4 mb-2 shrink-0 transition-opacity duration-300 ${isCollapsed ? 'opacity-0 cursor-pointer' : 'opacity-100'}`}
          onClick={() => isCollapsed && setIsCollapsed?.(false)}
        >
          <div 
            className="flex items-center justify-between px-4 mb-2 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => !isCollapsed && setIsHistoryExpanded(!isHistoryExpanded)}
          >
            <span className="text-sm font-semibold text-foreground dark:text-white">History</span>
            <ChevronDown 
              size={14} 
              className={`text-foreground/50 transition-transform duration-300 dark:text-white ${isHistoryExpanded ? 'rotate-180' : ''}`} 
            />
          </div>
        </div>

        {/* Chat History (Scrollable) */}
        <div
          className={`flex-1 overflow-y-auto sidebar-scroll transition-all duration-300 ${isHistoryExpanded ? 'opacity-100' : 'opacity-0'} ${isCollapsed ? 'cursor-pointer' : ''} ${!isHistoryExpanded && !isCollapsed ? 'pointer-events-none' : ''}`}
          onClick={() => isCollapsed && setIsCollapsed?.(false)}
        >
          {isHistoryExpanded && (
            <div className={`px-2 pb-2 flex flex-col min-h-full transition-opacity duration-300 ${isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            {isLoadingChats ? (
              <div className="flex justify-center py-4">
                <Helix size="24" speed="2.5" color="var(--color-foreground)" />
              </div>
            ) : chats.length > 0 && (
              <>
                <div className="flex-1">
                  {groupedChats.map((group, groupIndex) => (
                    <React.Fragment key={group.label}>
                      <div className={`flex items-center gap-3 px-3 py-2 ${groupIndex > 0 ? 'mt-2' : ''}`}>
                        <span className="text-[11px] text-foreground/50 dark:text-white whitespace-nowrap">{group.label}</span>
                        <div className="h-px bg-border flex-1"></div>
                      </div>
                      <ul className="space-y-0.5">
                        {group.chats.map((chat) => (
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
                                  className="flex-1 bg-transparent border-none outline-none text-sm text-foreground py-1"
                                />
                                <button 
                                  aria-label="Save Title"
                                  onClick={() => handleSaveTitle(chat.id)}
                                  disabled={isSavingTitle}
                                  className="p-1 text-success hover:bg-success/10 rounded transition-colors"
                                >
                                  <Check size={14} />
                                </button>
                                <button 
                                  aria-label="Cancel Edit"
                                  onClick={handleCancelEdit}
                                  className="p-1 text-destructive hover:bg-destructive/10 text-destructive rounded transition-colors"
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
                                  onContextMenu={(e) => {
                                    e.preventDefault();
                                    setActiveMenuId(activeMenuId === chat.id ? null : chat.id);
                                  }}
                                  className={`w-[calc(100%-16px)] mx-2 text-left block px-3 py-2 rounded-full transition-colors text-sm font-medium truncate pr-8 ${currentChatId === chat.id ? 'text-foreground dark:text-white bg-surface-hover' : 'text-foreground/60 dark:text-white dark:hover:text-white hover:bg-surface-hover/50 hover:text-foreground'}`}
                                  title={chat.title}
                                >
                                  {chat.title === 'New Chat' ? (
                                    <div className="relative overflow-hidden h-4 bg-foreground/10 rounded-full w-3/4 my-0.5">
                                      <div className="absolute inset-0 -translate-x-full animate-shimmer-skeleton bg-gradient-to-r from-transparent via-foreground/20 to-transparent" />
                                    </div>
                                  ) : (
                                    chat.title
                                  )}
                                </button>
                                
                                <button
                                  aria-label="More Options"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveMenuId(activeMenuId === chat.id ? null : chat.id);
                                  }}
                                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-surface text-foreground/60 hover:text-foreground transition-all z-[60] hidden md:flex items-center justify-center"
                                  title="More options"
                                >
                                  <div className="relative w-3.5 h-3.5 flex items-center justify-center">
                                    <Pin 
                                      size={14} 
                                      className={`absolute transition-all duration-200 ${chat.isPinned ? 'text-foreground fill-foreground opacity-100 rotate-45' : 'opacity-0'} group-hover:opacity-0 group-hover:scale-75`} 
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
                                        {chat.isPinned ? <PinOff size={12} className="rotate-45" /> : <Pin size={12} className="rotate-45 fill-foreground" />}
                                        {chat.isPinned ? 'Unpin' : 'Pin'}
                                      </button>
                                      <button
                                        onClick={(e) => handleStartEdit(e, chat.id, chat.title)}
                                        className="w-full text-left px-3 py-1.5 text-[12px] text-foreground/60 hover:bg-surface-hover flex items-center gap-2 transition-colors"
                                      >
                                        <EditIcon style={{ width: '12px', height: '12px' }} />
                                        Edit Title
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          handleDeleteChat(e, chat.id, chat.title);
                                        }}
                                        className="w-full text-left px-3 py-1.5 text-[12px] text-destructive hover:bg-surface-hover flex items-center gap-2 transition-colors"
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
                    </React.Fragment>
                  ))}
                </div>
                {chats.length > 5 && (
                  <button
                    onClick={() => setIsChatHistoryModalOpen(true)}
                    className="text-left px-3 py-2 text-sm text-foreground/40 hover:text-foreground dark:text-white dark:hover:text-white mt-2 font-medium"
                  >
                    See all
                  </button>
                )}
                {hasMoreChats && (
                  <div className="flex justify-center mt-2 pb-2">
                    <button
                      onClick={loadMoreChats}
                      className="text-[11px] text-foreground/40 hover:text-foreground dark:text-white/60 dark:hover:text-white font-medium"
                    >
                      Load More
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
          )}
        </div>

        {/* Bottom Section */}
        <div className="mt-auto relative pb-safe pt-2">


          {/* Admin Panel Link */}
          {isAdmin && (
            <div className="w-[56px] flex-shrink-0 flex items-center justify-center group relative mb-2">
              <Link 
                href="/admin"
                className="w-9 h-9 rounded-full bg-foreground/5 hover:bg-foreground/10 flex items-center justify-center text-foreground/60 dark:text-white hover:text-foreground dark:hover:text-white transition-all flex-shrink-0 shadow-sm pointer-events-auto"
                title="Admin Dashboard"
              >
                <Shield size={18} />
              </Link>
              
              {/* Admin Tooltip */}
              {isCollapsed && (
                <div className="fixed left-[64px] bg-surface border border-border/50 text-foreground text-[11px] tracking-wide px-2.5 py-1.5 rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-[9999] font-medium shadow-sm transition-all duration-200 ease-out ml-[-4px] group-hover:ml-0 bottom-[72px]">
                  Admin Dashboard
                </div>
              )}
            </div>
          )}

          {/* User Profile / Login */}
          <div className="w-[56px] flex-shrink-0 flex items-center justify-center group relative">
            {user ? (
              <>
                <div 
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
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
                
                {/* Profile Dropdown */}
                {isProfileDropdownOpen && (
                  <div className="absolute bottom-12 left-[12px] bg-surface border border-border/50 rounded-xl shadow-lg py-2 w-48 z-[10000]">
                    <button
                      onClick={() => { setIsSettingsModalOpen(true); setIsProfileDropdownOpen(false); }}
                      className="block w-full text-left px-4 py-2 text-sm text-foreground/80 hover:text-foreground hover:bg-surface-hover transition-colors"
                    >
                      Settings
                    </button>
                    <button
                      onClick={() => { setIsProfileModalOpen(true); setIsProfileDropdownOpen(false); }}
                      className="block w-full text-left px-4 py-2 text-sm text-foreground/80 hover:text-foreground hover:bg-surface-hover transition-colors"
                    >
                      Profile
                    </button>
                  </div>
                )}

                {/* Profile Tooltip */}
                {isCollapsed && (
                  <div className="fixed left-[64px] bg-surface border border-border/50 text-foreground text-[11px] tracking-wide px-2.5 py-1.5 rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-[9999] font-medium shadow-sm transition-all duration-200 ease-out ml-[-4px] group-hover:ml-0 bottom-[22px]">
                    Profile Settings
                  </div>
                )}
              </>
            ) : (
              <>
                <button aria-label="Login with Google" onClick={loginWithGoogle} className="w-9 h-9 rounded-full bg-[#f43f5e] flex items-center justify-center text-white hover:opacity-90 transition-opacity flex-shrink-0 shadow-sm pointer-events-auto">
                  <LogIn size={16} />
                </button>
                
                {/* Login Tooltip */}
                {isCollapsed && (
                  <div className="fixed left-[64px] bg-surface border border-border/50 text-foreground text-[11px] tracking-wide px-2.5 py-1.5 rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-[9999] font-medium shadow-sm transition-all duration-200 ease-out ml-[-4px] group-hover:ml-0 bottom-[22px]">
                    Login with Google
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        </div>
      </div>

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
                <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center text-destructive mb-2">
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
                    className="w-full py-3 px-4 bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl font-medium transition-colors"
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
