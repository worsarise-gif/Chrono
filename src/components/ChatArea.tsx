"use client";
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Type, Modality } from '@google/genai';
import { PlanetLogo } from './PlanetLogo';
import { Paperclip, Mic, AudioLines, ChevronDown, ArrowUp, Image as ImageIcon, X, Volume2, MapPin, Search, Zap, Bot, MoreHorizontal, Upload, SquarePen, RefreshCcw, Copy, Share, ThumbsUp, ThumbsDown, CornerDownRight, Menu, MessageSquare } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from '../contexts/AuthContext';
import { useChatContext } from '../contexts/ChatContext';
import { db, loginWithGoogle } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../utils/firebaseErrorHandler';

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  hasImage?: boolean;
  hasAudio?: boolean;
  createdAt?: any;
}

type ChatMode = 'auto' | 'fast' | 'search' | 'maps';

export default function ChatArea({ onMenuClick }: { onMenuClick?: () => void }) {
  const { user } = useAuth();
  const { currentChatId, setCurrentChatId } = useChatContext();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<ChatMode>('auto');
  const [showModeDropdown, setShowModeDropdown] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ data: string, mimeType: string } | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [streamingMessage, setStreamingMessage] = useState<string>('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const scrollTop = textarea.scrollTop;
      const isAtBottom = textarea.scrollTop + textarea.clientHeight >= textarea.scrollHeight - 10;
      
      textarea.style.height = '24px';
      const maxHeight = 200;
      const newHeight = Math.min(textarea.scrollHeight, maxHeight);
      textarea.style.height = `${newHeight}px`;
      
      if (newHeight === maxHeight) {
        if (isAtBottom || textarea.selectionStart === textarea.value.length) {
          textarea.scrollTop = textarea.scrollHeight;
        } else {
          textarea.scrollTop = scrollTop;
        }
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  useEffect(() => {
    if (input === '' && textareaRef.current) {
      textareaRef.current.style.height = '24px';
      textareaRef.current.scrollTop = 0;
    }
  }, [input]);

  useEffect(() => {
    if (!user || !currentChatId) {
      setMessages([]);
      return;
    }

    const q = query(
      collection(db, 'users', user.uid, 'chats', currentChatId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messageData: Message[] = [];
      snapshot.forEach((doc) => {
        messageData.push({ id: doc.id, ...doc.data() } as Message);
      });
      setMessages(messageData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/chats/${currentChatId}/messages`);
    });

    return () => unsubscribe();
  }, [user, currentChatId]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        setSelectedImage({
          data: base64String,
          mimeType: file.type
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];
          await handleVoiceInput(base64Audio);
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleVoiceInput = async (base64Audio: string) => {
    setIsLoading(true);
    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("NEXT_PUBLIC_GEMINI_API_KEY is missing. Please add it to your environment variables.");
      }
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [{ inlineData: { data: base64Audio, mimeType: 'audio/wav' } }, { text: "Transcribe this audio accurately." }] }
      });
      const transcription = response.text;
      if (transcription) {
        setInput(transcription);
      }
    } catch (error) {
      console.error("Voice transcription error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      try {
        await loginWithGoogle();
      } catch (error) {
        console.error("Login failed:", error);
      }
      return;
    }
    if ((!input.trim() && !selectedImage) || isLoading) return;

    const userMessage = input.trim();
    const currentImage = selectedImage;
    setInput('');
    setSelectedImage(null);
    setIsLoading(true);
    setStreamingMessage('');

    let chatId = currentChatId;
    if (!chatId) {
      try {
        const chatRef = await addDoc(collection(db, 'users', user.uid, 'chats'), {
          title: userMessage.slice(0, 40) || 'New Chat',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        chatId = chatRef.id;
        setCurrentChatId(chatId);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}/chats`);
        setIsLoading(false);
        return;
      }
    }

    try {
      await addDoc(collection(db, 'users', user.uid, 'chats', chatId, 'messages'), {
        role: 'user',
        content: userMessage,
        hasImage: !!currentImage,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/chats/${chatId}/messages`);
      setIsLoading(false);
      return;
    }

    let fullResponse = '';
    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("NEXT_PUBLIC_GEMINI_API_KEY is missing. Please add it to your environment variables.");
      }
      
      const ai = new GoogleGenAI({ apiKey });
      const parts: any[] = [];
      if (userMessage) {
        parts.push({ text: userMessage });
      } else if (currentImage) {
        parts.push({ text: "Describe this image." });
      }
      
      if (currentImage) {
        parts.push({
          inlineData: {
            data: currentImage.data,
            mimeType: currentImage.mimeType
          }
        });
      }

      const tools: any[] = [];
      if (mode === 'search') tools.push({ googleSearch: {} });
      if (mode === 'maps') tools.push({ googleMaps: {} });

      const config: any = {};
      if (tools.length > 0) {
        config.tools = tools;
      }

      const requestParams: any = {
        model: 'gemini-3-flash-preview',
        contents: { parts }
      };

      if (Object.keys(config).length > 0) {
        requestParams.config = config;
      }

      const streamResponse = await ai.models.generateContentStream(requestParams);

      for await (const chunk of streamResponse) {
        const text = chunk.text;
        if (text) {
          fullResponse += text;
          setStreamingMessage(fullResponse);
        }
      }
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      fullResponse = `I'm sorry, I encountered an error while processing your request: ${error.message || error}`;
    }

    try {
      await addDoc(collection(db, 'users', user.uid, 'chats', chatId, 'messages'), {
        role: 'model',
        content: fullResponse,
        createdAt: serverTimestamp()
      });

      await updateDoc(doc(db, 'users', user.uid, 'chats', chatId), {
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/chats/${chatId}/messages`);
    } finally {
      setIsLoading(false);
      setStreamingMessage('');
    }
  };

  const modeLabels: Record<ChatMode, string> = {
    auto: 'Auto',
    fast: 'Fast',
    search: 'Search',
    maps: 'Maps'
  };

  const modeIcons: Record<ChatMode, React.ReactNode> = {
    auto: <Zap size={16} />,
    fast: <Zap size={16} className="text-yellow-500" />,
    search: <Search size={16} />,
    maps: <MapPin size={16} />
  };

  const isChatStarted = messages.length > 0 || streamingMessage;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#000000] relative overflow-hidden font-sans">
      {/* Floating Actions */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-40 pointer-events-none">
        <button 
          onClick={onMenuClick}
          className="p-3 bg-[#1a1a1a]/80 backdrop-blur-md border border-gray-800/50 hover:bg-[#2a2a2a] rounded-full text-gray-400 hover:text-white md:hidden pointer-events-auto transition-all shadow-lg"
        >
          <Menu size={20} />
        </button>
        <div className="flex-1" />
        <button 
          onClick={() => setCurrentChatId(null)}
          className="p-3 bg-[#1a1a1a]/80 backdrop-blur-md border border-gray-800/50 hover:bg-[#2a2a2a] rounded-full text-gray-400 hover:text-white pointer-events-auto transition-all shadow-lg ml-auto group"
          title="New Chat"
        >
          <SquarePen size={20} className="group-hover:scale-110 transition-transform" />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto scroll-smooth relative pt-16">
        {!isChatStarted ? (
          <div className="h-full flex flex-col items-center justify-center px-4">
            {/* Welcome screen is handled by the input area's positioning */}
          </div>
        ) : (
          <div className="max-w-3xl mx-auto w-full px-4 pt-6 pb-32 space-y-8">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} group w-full`}
              >
                <div className={`${msg.role === 'user' ? 'max-w-[85%] bg-[#1a1a1a] rounded-[24px] px-5 py-3.5 text-white shadow-sm' : 'max-w-[80%] relative bg-transparent text-white text-[15px] w-full'}`}>
                  {msg.role === 'model' ? (
                    <div className="w-full">
                      <div className="prose prose-invert prose-p:leading-relaxed max-w-none font-medium break-words">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                      
                      {/* Action Row */}
                      <div className="flex items-center gap-1 mt-4 opacity-0 group-hover:opacity-100 transition-opacity text-gray-500">
                        {[
                          { icon: <RefreshCcw size={14} />, title: "Regenerate" },
                          { icon: <Copy size={14} />, title: "Copy" },
                          { icon: <ThumbsUp size={14} />, title: "Good response" },
                          { icon: <ThumbsDown size={14} />, title: "Bad response" },
                          { icon: <Volume2 size={14} />, title: "Read aloud" },
                          { icon: <Share size={14} />, title: "Share" },
                          { icon: <MoreHorizontal size={14} />, title: "More options" }
                        ].map((btn, i) => (
                          <button 
                            key={i}
                            className="p-1.5 rounded-lg hover:bg-[#1a1a1a] hover:text-white transition-colors" 
                            title={btn.title}
                          >
                            {btn.icon}
                          </button>
                        ))}
                      </div>

                      {/* Suggestions */}
                      <div className="mt-5 space-y-3">
                        <button className="flex items-center gap-3 text-sm font-medium text-gray-200 hover:text-white transition-colors">
                          <CornerDownRight size={16} className="text-gray-500" />
                          Cebu Food Recommendations
                        </button>
                        <button className="flex items-center gap-3 text-sm font-medium text-gray-200 hover:text-white transition-colors">
                          <CornerDownRight size={16} className="text-gray-500" />
                          Cebu Nightlife Spots
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap leading-relaxed break-words">{msg.content}</p>
                  )}
                </div>
              </div>
            ))}
            {streamingMessage && (
              <div className="flex justify-start group w-full">
                <div className="max-w-[80%] relative bg-transparent text-white text-[15px] w-full">
                  <div className="w-full">
                    <div className="prose prose-invert prose-p:leading-relaxed max-w-none font-medium break-words">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {streamingMessage}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {isLoading && !streamingMessage && (
              <div className="flex justify-start mb-4">
                <div className="bg-[#1a1a1a]/50 border border-gray-800/50 rounded-2xl px-4 py-3 flex items-center gap-1.5">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '0s' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '0.2s' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '0.4s' }} />
                  </div>
                  <span className="text-xs text-gray-500 font-medium ml-1">Chris is thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className={`absolute left-0 right-0 p-4 md:p-6 flex flex-col items-center z-20 transition-all duration-500 ${!isChatStarted ? 'top-1/2 -translate-y-1/2' : 'bottom-0'}`}>
        {!isChatStarted && (
          <div className="flex items-center gap-4 mb-8">
            <PlanetLogo className="text-white w-10 h-10 md:w-12 md:h-12" />
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Chris</h1>
          </div>
        )}
        <form onSubmit={handleSubmit} className="w-full max-w-3xl relative">
          <div className="relative bg-[#1a1a1a] rounded-[28px] transition-all shadow-2xl border border-gray-800/50 focus-within:border-gray-700/50 flex flex-col p-1.5">
            {selectedImage && (
              <div className="px-2 pt-2 pb-1 flex overflow-hidden">
                <div className="relative group">
                  <img 
                    src={`data:${selectedImage.mimeType};base64,${selectedImage.data}`} 
                    className="w-16 h-16 object-cover rounded-xl border border-gray-800 shadow-lg" 
                    alt="Selected"
                    referrerPolicy="no-referrer"
                  />
                  <button 
                    type="button"
                    onClick={() => setSelectedImage(null)} 
                    className="absolute -top-2 -right-2 bg-black border border-gray-800 rounded-full p-1 text-gray-400 hover:text-white shadow-xl transition-colors z-10"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>
            )}
            
            <div className="flex items-end gap-1">
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleImageUpload}
              />
              
              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()}
                className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#2a2a2a] rounded-full transition-colors shrink-0"
                title="Attach image"
              >
                <Paperclip size={20} />
              </button>

              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                placeholder={isRecording ? "Listening..." : "Ask anything"}
                className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-500 py-0 my-2 px-1 text-[15px] font-medium resize-none overflow-y-auto leading-[24px] break-words"
                rows={1}
                disabled={isLoading || isRecording}
                style={{ minHeight: '24px', maxHeight: '200px' }}
              />

              <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                {/* Mode Selector */}
                <div className="relative">
                  <button 
                    type="button" 
                    onClick={() => setShowModeDropdown(!showModeDropdown)}
                    className="h-10 px-3 flex items-center gap-1.5 rounded-full text-white text-[13px] font-bold hover:bg-[#2a2a2a] transition-colors"
                  >
                    <span className="hidden sm:inline">{modeLabels[mode]}</span>
                    <span className="sm:hidden">{modeIcons[mode]}</span>
                    <ChevronDown size={14} className="text-gray-400" />
                  </button>
                  
                  {showModeDropdown && (
                    <div className="absolute bottom-full mb-2 right-0 w-36 bg-[#1a1a1a] border border-gray-800 rounded-xl shadow-xl overflow-hidden z-50">
                      {(Object.keys(modeLabels) as ChatMode[]).map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => { setMode(m); setShowModeDropdown(false); }}
                          className={`w-full flex items-center gap-2 px-4 py-2 text-sm text-left hover:bg-[#2a2a2a] transition-colors ${mode === m ? 'text-white bg-gray-800/50' : 'text-gray-400'}`}
                        >
                          {modeIcons[m]}
                          {modeLabels[m]}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button 
                  type="button" 
                  onMouseDown={startRecording}
                  onMouseUp={stopRecording}
                  onMouseLeave={stopRecording}
                  className={`w-10 h-10 flex items-center justify-center transition-colors rounded-full shrink-0 ${isRecording ? 'text-red-500 bg-red-500/10 hover:bg-red-500/20' : 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]'}`}
                  title="Hold to dictate"
                >
                  <Mic size={20} className={isRecording ? 'animate-pulse' : ''} />
                </button>
                
                <button 
                  type="submit" 
                  disabled={(!input.trim() && !selectedImage) || isLoading} 
                  className="w-10 h-10 flex items-center justify-center bg-white text-black rounded-full hover:bg-gray-200 transition-colors disabled:opacity-50 shrink-0"
                >
                  {input.trim() || selectedImage ? <ArrowUp size={20} strokeWidth={2.5} /> : <AudioLines size={20} strokeWidth={2.5} />}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
