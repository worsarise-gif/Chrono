import React, { createContext, useContext, useState } from 'react';

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
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

  return (
    <ChatContext.Provider value={{ currentChatId, setCurrentChatId }}>
      {children}
    </ChatContext.Provider>
  );
};
