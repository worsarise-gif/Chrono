"use client";
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search, Trash2, MessageSquare, Calendar, Clock, ArrowRight, Edit2, Check, Pin, PinOff } from 'lucide-react';
import { format } from 'date-fns';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { handleFirestoreError, OperationType } from '../utils/firebaseErrorHandler';
import { handleError } from '../utils/errorHandler';

interface Chat {
  id: string;
  title: string;
  updatedAt: any;
  isPinned?: boolean;
}

interface ChatHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  chats: Chat[];
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string, title: string) => void;
  currentChatId: string | null;
}

export const ChatHistoryModal: React.FC<ChatHistoryModalProps> = ({
  isOpen,
  onClose,
  chats,
  onSelectChat,
  onDeleteChat,
  currentChatId
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure the modal animation has started and the element is in the DOM
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  const handleStartEdit = (e: React.MouseEvent, chatId: string, currentTitle: string) => {
    e.stopPropagation();
    setEditingChatId(chatId);
    setEditingTitle(currentTitle);
  };

  const handleSaveTitle = async (e: React.MouseEvent | React.KeyboardEvent, chatId: string) => {
    e.stopPropagation();
    const user = auth.currentUser;
    if (!user || !editingTitle.trim() || isSaving) return;

    setIsSaving(true);
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
      setIsSaving(false);
    }
  };

  const handleCancelEdit = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    setEditingChatId(null);
    setEditingTitle("");
  };

  const handleTogglePin = async (e: React.MouseEvent, chatId: string, currentPinned: boolean) => {
    e.stopPropagation();
    const user = auth.currentUser;
    if (!user || isSaving) return;

    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid, 'chats', chatId), {
        isPinned: !currentPinned,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}/chats/${chatId}`);
      } catch (e) {
        handleError(e, "Failed to toggle pin status");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const filteredChats = useMemo(() => {
    let result = chats;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = chats.filter(chat => 
        chat.title.toLowerCase().includes(query)
      );
    }

    // Sort by isPinned first, then updatedAt
    return [...result].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      
      const timeA = a.updatedAt?.toDate?.()?.getTime() || 0;
      const timeB = b.updatedAt?.toDate?.()?.getTime() || 0;
      return timeB - timeA;
    });
  }, [chats, searchQuery]);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown date';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return format(date, 'MMM d, yyyy');
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return format(date, 'h:mm a');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 md:p-8">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-5xl h-[80vh] bg-surface border border-border rounded-[32px] shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 md:p-8 border-b border-border flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-foreground/5 flex items-center justify-center text-foreground">
                  <MessageSquare size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">Chat History</h2>
                  <p className="text-sm text-foreground/60">{chats.length} conversations found</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-surface-hover text-foreground/60 hover:text-foreground transition-all"
              >
                <X size={24} />
              </button>
            </div>

            {/* Search Bar */}
            <div className="px-6 md:px-8 py-4 bg-surface/50 border-b border-border shrink-0">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40 group-focus-within:text-foreground transition-colors" size={18} />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search your conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-surface-hover border border-border rounded-2xl pl-12 pr-4 py-3 text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-foreground/10 transition-all"
                />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 sidebar-scroll">
              {filteredChats.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-60">
                  <div className="w-16 h-16 rounded-full bg-surface-hover flex items-center justify-center">
                    <Search size={32} />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium">No chats found</h3>
                    <p className="text-sm">Try searching for a different keyword</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredChats.map((chat) => (
                    <motion.div
                      layout
                      key={chat.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`group relative p-5 rounded-2xl border transition-all cursor-pointer ${
                        currentChatId === chat.id 
                          ? 'bg-foreground/5 border-foreground/20' 
                          : 'bg-surface-hover/30 border-border/50 hover:bg-surface-hover hover:border-border'
                      }`}
                      onClick={() => {
                        onSelectChat(chat.id);
                        onClose();
                      }}
                    >
                      <div className="flex flex-col h-full justify-between space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            {editingChatId === chat.id ? (
                              <div className="flex-1 flex items-center gap-1 bg-surface border border-blue-500/50 rounded-lg p-1" onClick={(e) => e.stopPropagation()}>
                                <input
                                  autoFocus
                                  type="text"
                                  value={editingTitle}
                                  onChange={(e) => setEditingTitle(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveTitle(e, chat.id);
                                    if (e.key === 'Escape') handleCancelEdit(e);
                                  }}
                                  className="flex-1 bg-transparent border-none outline-none text-sm text-foreground py-1 px-2"
                                />
                                <button 
                                  onClick={(e) => handleSaveTitle(e, chat.id)}
                                  disabled={isSaving}
                                  className="p-1 text-success hover:bg-success/10 rounded transition-colors"
                                >
                                  <Check size={16} />
                                </button>
                                <button 
                                  onClick={(e) => handleCancelEdit(e)}
                                  className="p-1 text-destructive hover:bg-destructive/10 text-destructive rounded transition-colors"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            ) : (
                              <>
                                <h3 className="font-semibold text-foreground line-clamp-2 leading-tight flex items-center gap-2">
                                  {chat.title}
                                  {chat.isPinned && (
                                    <Pin size={12} className="text-info fill-blue-500/20 shrink-0" />
                                  )}
                                </h3>
                                {currentChatId === chat.id && (
                                  <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                                )}
                              </>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-foreground/40 font-medium uppercase tracking-wider">
                            <div className="flex items-center gap-1">
                              <Calendar size={12} />
                              {formatDate(chat.updatedAt)}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock size={12} />
                              {formatTime(chat.updatedAt)}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <div className="flex items-center gap-1">
                            {editingChatId !== chat.id && (
                              <>
                                <button
                                  onClick={(e) => handleTogglePin(e, chat.id, !!chat.isPinned)}
                                  className={`p-2 rounded-lg transition-all ${
                                    chat.isPinned 
                                      ? 'bg-info/10 text-info hover:bg-info/20'
                                      : 'hover:bg-foreground/10 text-foreground/40 hover:text-foreground'
                                  }`}
                                  title={chat.isPinned ? "Unpin" : "Pin"}
                                >
                                  {chat.isPinned ? <PinOff size={14} /> : <Pin size={14} />}
                                </button>
                                <button
                                  onClick={(e) => handleStartEdit(e, chat.id, chat.title)}
                                  className="p-2 rounded-lg hover:bg-foreground/10 text-foreground/40 hover:text-foreground transition-all"
                                  title="Rename"
                                >
                                  <Edit2 size={14} />
                                </button>
                              </>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteChat(chat.id, chat.title);
                              }}
                              className="p-2 rounded-lg hover:bg-destructive/10 text-destructive text-foreground/40 hover:text-destructive transition-all"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                          <div className="text-foreground/0 group-hover:text-foreground/40 transition-all">
                            <ArrowRight size={16} />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 bg-surface/50 border-t border-border flex items-center justify-between shrink-0">
              <div className="text-xs text-foreground/40 font-medium">
                Showing {filteredChats.length} of {chats.length} conversations
              </div>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-foreground text-background rounded-xl font-bold text-sm hover:opacity-90 transition-all"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
