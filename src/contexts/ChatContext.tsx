"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface ChatContextType {
  currentChatId: string | null;
  setCurrentChatId: (id: string | null) => void;
}

const ChatContext = createContext<ChatContextType>({
  currentChatId: null,
  setCurrentChatId: () => {},
});

export const useChatContext = () => useContext(ChatContext);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [currentChatId, setCurrentChatIdState] = useState<string | null>(null);

  useEffect(() => {
    if (pathname === '/') {
      setCurrentChatIdState(null);
    } else if (pathname.startsWith('/chat/')) {
      const id = pathname.split('/')[2];
      if (id) {
        setCurrentChatIdState(id);
      }
    }
  }, [pathname]);

  const setCurrentChatId = (id: string | null) => {
    setCurrentChatIdState(id);
    if (id) {
      router.push(`/chat/${id}`);
    } else {
      router.push('/');
    }
  };

  return (
    <ChatContext.Provider value={{ currentChatId, setCurrentChatId }}>
      {children}
    </ChatContext.Provider>
  );
};
