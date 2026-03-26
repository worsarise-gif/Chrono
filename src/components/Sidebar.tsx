"use client";
import React, { useEffect, useState } from 'react';
import { Search, SquarePen, AudioLines, Image as ImageIcon, ChevronsLeft, ChevronsRight, LogIn, Trash2 } from 'lucide-react';
import { PlanetLogo } from './PlanetLogo';
import { useAuth } from '../contexts/AuthContext';
import { useChatContext } from '../contexts/ChatContext';
import { loginWithGoogle, db } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, deleteDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../utils/firebaseErrorHandler';
import { handleError } from '../utils/errorHandler';
import { Helix } from 'ldrs/react';
import 'ldrs/react/Helix.css';

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
        className={`flex items-center w-full rounded-lg transition-all relative pointer-events-auto h-[44px] ${active ? 'text-white' : 'text-gray-400 hover:text-white'} ${!isCollapsed && !active ? 'hover:bg-[#1a1a1a]' : ''}`}
      >
        {/* Stationary Icon Container */}
        <div className="w-[68px] flex-shrink-0 flex items-center justify-center relative">
          {/* Hover Highlight Background for Collapsed State */}
          {isCollapsed && (
            <div className="absolute inset-0 flex items-center justify-center z-0">
              <div className="w-10 h-10 rounded-[12px] bg-transparent group-hover:bg-[#2D2D2D] transition-colors duration-200"></div>
            </div>
          )}
          <div className="relative z-10 flex items-center justify-center">
            {icon}
          </div>
          {hasDot && (
            <div className={`absolute top-3 right-6 w-2 h-2 rounded-full bg-[#5c6ad2] border-2 border-black transition-opacity duration-300 z-20 ${isCollapsed ? 'opacity-100' : 'opacity-0'}`}></div>
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
          className="fixed left-[76px] bg-[#2D2D2D] text-white text-[11px] px-[10px] py-[6px] rounded-[6px] opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-[9999] font-medium shadow-2xl transition-all duration-200 ease-in-out border border-gray-800/50 ml-[-10px] group-hover:ml-0"
          style={{ 
            top: `${60 + index * 46 + 22}px`,
            transform: 'translateY(-50%)'
          }}
        >
          <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 bg-[#2D2D2D] border-l border-b border-gray-800/50 rotate-45"></div>
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

  const handleDeleteChat = async (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    if (!user) return;
    
    if (window.confirm('Are you sure you want to delete this chat?')) {
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'chats', chatId));
        if (currentChatId === chatId) {
          setCurrentChatId(null);
        }
      } catch (error) {
        try {
          handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}/chats/${chatId}`);
        } catch (e) {
          handleError(e, "Failed to delete chat");
        }
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
      <div className={`h-screen bg-[#000000] text-white border-r border-[#1a1a1a] z-50 font-sans transition-all duration-300 ease-in-out fixed md:relative ${isCollapsed ? 'w-[68px] overflow-visible' : 'w-[250px] overflow-x-hidden'} ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="w-full h-full flex flex-col">
        {/* Header / Logo Section */}
        <div className="flex items-center pt-5 pb-4 h-[60px] relative">
          <div className="w-[68px] flex-shrink-0 flex items-center justify-center">
            <PlanetLogo className="text-white w-6 h-6" />
          </div>
          <div className={`flex-1 flex items-center justify-end pr-4 transition-opacity duration-300 ${isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <button
              onClick={() => setIsCollapsed(true)}
              className="text-gray-500 hover:text-white transition-colors p-1 rounded-md hover:bg-[#1a1a1a] hidden md:block"
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
        <div className={`mx-4 h-px bg-[#1a1a1a] my-3 transition-opacity duration-300 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}></div>

        {/* Chat History (Scrollable) */}
        <div className={`flex-1 overflow-y-auto sidebar-scroll transition-all duration-300 ${isCollapsed ? 'scrollbar-hide' : ''}`}>
          <div className={`px-2 pb-2 flex flex-col min-h-full transition-opacity duration-300 ${isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            {isLoadingChats ? (
              <div className="flex justify-center py-4">
                <Helix size="24" speed="2.5" color="white" />
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
                        className={`w-full text-left block px-3 py-2 rounded-lg transition-colors text-[13px] font-normal truncate pr-8 ${currentChatId === chat.id ? 'text-white bg-[#1a1a1a]' : 'text-gray-400 hover:bg-[#1a1a1a] hover:text-white'}`}
                      >
                        {chat.title}
                      </button>
                      <button
                        onClick={(e) => handleDeleteChat(e, chat.id)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-[#2a2a2a] text-gray-500 hover:text-red-400 transition-all"
                        title="Delete chat"
                      >
                        <Trash2 size={12} />
                      </button>
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
          <div className={`absolute bottom-[72px] left-0 w-[68px] flex justify-center transition-opacity duration-300 hidden md:flex ${isCollapsed ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <button
              onClick={() => setIsCollapsed(false)}
              className="text-gray-500 hover:text-white transition-colors p-2 rounded-full hover:bg-[#1a1a1a] pointer-events-auto"
            >
              <ChevronsRight size={20} strokeWidth={1.5} />
            </button>
          </div>

          {/* User Profile / Login */}
          <div className="w-[68px] flex-shrink-0 flex items-center justify-center">
            {user ? (
              <div className="w-9 h-9 rounded-full bg-[#f43f5e] flex items-center justify-center text-white font-medium text-[14px] cursor-pointer hover:opacity-90 transition-opacity flex-shrink-0 shadow-sm pointer-events-auto">
                {user.displayName?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'J'}
              </div>
            ) : (
              <button onClick={loginWithGoogle} className="w-9 h-9 rounded-full bg-[#f43f5e] flex items-center justify-center text-white hover:opacity-90 transition-opacity flex-shrink-0 shadow-sm pointer-events-auto">
                <LogIn size={16} />
              </button>
            )}
          </div>
        </div>
        </div>
      </div>
    </>
  );
}
