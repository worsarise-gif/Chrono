"use client";
import React, { useEffect, useState } from 'react';
import { Search, SquarePen, AudioLines, Image as ImageIcon, ChevronsLeft, ChevronsRight, LogIn } from 'lucide-react';
import { PlanetLogo } from './PlanetLogo';
import { useAuth } from '../contexts/AuthContext';
import { useChatContext } from '../contexts/ChatContext';
import { loginWithGoogle, db } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../utils/firebaseErrorHandler';
import { handleError } from '../utils/errorHandler';
// import { Helix } from 'ldrs/react';
// import 'ldrs/react/Helix.css';

interface Chat {
  id: string;
  title: string;
  updatedAt: any;
}

const NavItem = ({ icon, label, onClick, active, hasDot, isCollapsed }: any) => {
  return (
    <li className="w-full relative group">
      <button
        onClick={onClick}
        className={`flex items-center gap-3.5 px-3 py-2.5 w-full rounded-lg transition-colors relative pointer-events-auto ${active ? 'text-white' : 'text-gray-400 hover:text-white'} ${!isCollapsed && !active ? 'hover:bg-[#1a1a1a]' : ''}`}
      >
        <div className="relative flex-shrink-0 flex items-center justify-center w-[18px] h-[18px]">
          {/* Hover Highlight Background */}
          {isCollapsed && (
            <div className="absolute inset-[-10px] rounded-[14px] bg-transparent group-hover:bg-[#2D2D2D] transition-colors duration-200 ease-in-out z-0"></div>
          )}
          <div className="relative z-10 flex items-center justify-center">
            {icon}
          </div>
          {hasDot && (
            <div className={`absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#5c6ad2] border-2 border-black transition-opacity duration-300 z-20 ${isCollapsed ? 'opacity-100' : 'opacity-0'}`}></div>
          )}
        </div>
        <span className={`font-semibold text-[14px] whitespace-nowrap transition-opacity duration-300 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>{label}</span>
        {hasDot && (
          <div className={`w-1.5 h-1.5 rounded-full bg-[#5c6ad2] ml-auto flex-shrink-0 transition-opacity duration-300 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}></div>
        )}
      </button>
      
      {/* Tooltip */}
      {isCollapsed && (
        <div className="absolute left-[calc(100%+8px)] top-1/2 -translate-y-1/2 bg-[#2D2D2D] text-white text-xs px-[10px] py-[6px] rounded-[8px] opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 font-medium shadow-xl transition-opacity duration-200 ease-in-out">
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
          className="fixed inset-0 bg-black/60 z-40 md:hidden transition-opacity"
          onClick={() => setIsMobileOpen?.(false)}
        />
      )}
      <div className={`h-screen bg-[#000000] text-white border-r border-[#1a1a1a] z-50 font-sans transition-all duration-300 ease-in-out fixed md:relative w-[250px] ${isCollapsed ? 'md:w-[68px]' : 'md:w-[250px]'} ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className={`w-[250px] h-full flex flex-col ${isCollapsed ? 'pointer-events-none' : ''}`}>
        {/* Header / Logo */}
        <div className="flex items-center justify-between pl-[22px] pr-4 pt-5 pb-4">
          <div className="flex items-center justify-center w-6 h-6 flex-shrink-0">
            <PlanetLogo className="text-white w-6 h-6" />
          </div>
          <button
            onClick={() => setIsCollapsed(true)}
            className={`text-gray-500 hover:text-white transition-opacity duration-300 p-1 rounded-md hover:bg-[#1a1a1a] hidden md:block ${isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'}`}
          >
            <ChevronsLeft size={16} strokeWidth={2} />
          </button>
        </div>

        {/* Main Nav */}
        <nav className="pl-[13px] pr-2">
          <ul className="space-y-0.5">
            <NavItem icon={<Search size={18} strokeWidth={2} />} label="Search" onClick={() => {}} isCollapsed={isCollapsed} />
            <NavItem icon={<SquarePen size={18} strokeWidth={2} />} label="Chat" onClick={() => { setCurrentChatId(null); setIsMobileOpen?.(false); }} active={!currentChatId} isCollapsed={isCollapsed} />
            <NavItem icon={<AudioLines size={18} strokeWidth={2} />} label="Voice" onClick={() => {}} isCollapsed={isCollapsed} />
            <NavItem icon={<ImageIcon size={18} strokeWidth={2} />} label="Imagine" onClick={() => {}} hasDot isCollapsed={isCollapsed} />
          </ul>
        </nav>

        {/* Divider */}
        <div className={`mx-4 h-px bg-[#1a1a1a] my-3 transition-opacity duration-300 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}></div>

        {/* Chat History (Scrollable) */}
        <div className="flex-1 overflow-y-auto sidebar-scroll">
          <div className={`px-2 pb-2 flex flex-col min-h-full transition-opacity duration-300 ${isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            {isLoadingChats ? (
              <div className="flex justify-center py-4">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : chats.length > 0 && (
              <>
                <ul className="space-y-0.5 flex-1">
                  {chats.map(chat => (
                    <li key={chat.id}>
                      <button
                        onClick={() => {
                          setCurrentChatId(chat.id);
                          setIsMobileOpen?.(false);
                        }}
                        className={`w-full text-left block px-3 py-2 rounded-lg transition-colors text-[13px] font-medium truncate ${currentChatId === chat.id ? 'text-white bg-[#1a1a1a]' : 'text-gray-400 hover:bg-[#1a1a1a] hover:text-white'}`}
                      >
                        {chat.title}
                      </button>
                    </li>
                  ))}
                </ul>
                <button className="text-left px-3 py-2 text-[13px] text-gray-400 hover:text-white mt-2 font-medium">
                  See all
                </button>
              </>
            )}
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-auto relative pb-4 pt-2">
          <div className={`absolute bottom-[72px] left-[16px] transition-opacity duration-300 hidden md:block ${isCollapsed ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <button
              onClick={() => setIsCollapsed(false)}
              className="text-gray-500 hover:text-white transition-colors p-2 rounded-full hover:bg-[#1a1a1a] pointer-events-auto"
            >
              <ChevronsRight size={20} strokeWidth={1.5} />
            </button>
          </div>

          <div className="pl-[16px]">
            {user ? (
              <div className="w-9 h-9 rounded-full bg-[#f43f5e] flex items-center justify-center text-white font-bold text-[14px] cursor-pointer hover:opacity-90 transition-opacity flex-shrink-0 shadow-sm pointer-events-auto">
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
