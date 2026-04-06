"use client";
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { GoogleGenAI, Type, Modality } from '@google/genai';
import { PlanetLogo } from './PlanetLogo';
import { Paperclip, AudioLines, ChevronDown, ArrowUp, Image as ImageIcon, X, Volume2, Search, Zap, Bot, MoreHorizontal, Upload, SquarePen, RefreshCcw, RefreshCw, AlertCircle, Copy, Share, ThumbsUp, ThumbsDown, CornerDownRight, Menu, MessageSquare, Check, Cpu, Sparkles, Globe, Square, Download, Edit2 } from 'lucide-react';
import { ResponseFormatter } from './ResponseFormatter';
import { useAuth } from '../contexts/AuthContext';
import { useChatContext } from '../contexts/ChatContext';
import { db, storage, loginWithGoogle, auth } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { handleFirestoreError, OperationType } from '../utils/firebaseErrorHandler';
import { handleError, ErrorSeverity } from '../utils/errorHandler';
import Loader from './Loader';

import { Helix } from 'ldrs/react';
import 'ldrs/react/Helix.css';

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  hasImage?: boolean;
  imageUrl?: string;
  hasAudio?: boolean;
  createdAt?: any;
  isStreaming?: boolean;
  recommendations?: {title: string, prompt: string}[];
}

type ChatMode = 'auto' | 'flash' | 'pro' | 'search';

const GROQ_API_KEY = process.env.NEXT_PUBLIC_GROQ_API_KEY || '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';
const CEREBRAS_API_KEY = process.env.NEXT_PUBLIC_CEREBRAS_API_KEY || 'csk-p3dn42jen83vtykvwjcdpedcy5mcfnenvemhd65kx9jj6c4c';

const callCerebrasNonStream = async (model: string, messages: any[], signal?: AbortSignal) => {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      url: 'https://api.cerebras.ai/v1/chat/completions',
      apiKey: CEREBRAS_API_KEY,
      model,
      messages,
      stream: false,
      temperature: 0.3
    }),
    signal
  });
  if (!res.ok) {
    const errorText = await res.text();
    try {
      const errorJson = JSON.parse(errorText);
      throw new Error(errorJson.error || errorJson.message || `Cerebras Error ${res.status}: ${errorText}`);
    } catch {
      throw new Error(`Cerebras Error ${res.status}: ${errorText}`);
    }
  }
  const data = await res.json();
  return data.choices[0].message.content;
};

const callOpenAIStream = async (url: string, apiKey: string, model: string, msgs: any[], onChunk: (text: string) => void, signal?: AbortSignal) => {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      url,
      apiKey,
      model,
      messages: msgs,
      stream: true
    }),
    signal
  });

  if (!response.ok) {
    const errorText = await response.text();
    try {
      const errorJson = JSON.parse(errorText);
      throw new Error(errorJson.error || errorJson.message || `API Error ${response.status}: ${errorText}`);
    } catch {
      throw new Error(`API Error ${response.status}: ${errorText}`);
    }
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No reader available');
  const decoder = new TextDecoder();
  let done = false;
  let buffer = '';

  while (!done) {
    const { value, done: doneReading } = await reader.read();
    done = doneReading;
    if (value) {
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('data: ') && trimmedLine !== 'data: [DONE]') {
          try {
            const data = JSON.parse(trimmedLine.slice(6));
            if (data.choices && data.choices[0].delta && data.choices[0].delta.content) {
              onChunk(data.choices[0].delta.content);
            }
          } catch (e) {
            // ignore parse errors
          }
        }
      }
    }
  }

  if (buffer.trim()) {
    const trimmedLine = buffer.trim();
    if (trimmedLine.startsWith('data: ') && trimmedLine !== 'data: [DONE]') {
      try {
        const data = JSON.parse(trimmedLine.slice(6));
        if (data.choices && data.choices[0].delta && data.choices[0].delta.content) {
          onChunk(data.choices[0].delta.content);
        }
      } catch (e) {
        // ignore parse errors
      }
    }
  }
};

const callCloudflareStream = async (model: string, messages: any[], onChunk: (text: string) => void, signal?: AbortSignal) => {
  const res = await fetch('/api/cloudflare-chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ 
      model, 
      messages, 
      stream: true,
      temperature: 0.3
    }),
    signal
  });

  if (!res.ok) {
    const errorText = await res.text();
    try {
      const errorJson = JSON.parse(errorText);
      throw new Error(errorJson.error || errorJson.message || `Cloudflare Error ${res.status}: ${errorText}`);
    } catch {
      throw new Error(`Cloudflare Error ${res.status}: ${errorText}`);
    }
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error('No reader available');
  const decoder = new TextDecoder();
  let done = false;
  let buffer = '';

  while (!done) {
    const { value, done: doneReading } = await reader.read();
    done = doneReading;
    if (value) {
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('data: ') && trimmedLine !== 'data: [DONE]') {
          try {
            const data = JSON.parse(trimmedLine.slice(6));
            if (data.response) {
              onChunk(data.response);
            } else if (data.choices && data.choices[0].delta && data.choices[0].delta.content) {
              onChunk(data.choices[0].delta.content);
            }
          } catch (e) {
            // ignore parse errors
          }
        }
      }
    }
  }

  if (buffer.trim()) {
    const trimmedLine = buffer.trim();
    if (trimmedLine.startsWith('data: ') && trimmedLine !== 'data: [DONE]') {
      try {
        const data = JSON.parse(trimmedLine.slice(6));
        if (data.response) {
          onChunk(data.response);
        } else if (data.choices && data.choices[0].delta && data.choices[0].delta.content) {
          onChunk(data.choices[0].delta.content);
        }
      } catch (e) {
        // ignore parse errors
      }
    }
  }
};

const callGroqChatNonStream = async (model: string, messages: any[], fallbackModel?: string, signal?: AbortSignal) => {
  const makeRequest = async (m: string) => {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        url: 'https://api.groq.com/openai/v1/chat/completions',
        apiKey: GROQ_API_KEY,
        model: m, 
        messages, 
        stream: false,
        temperature: 0.3
      }),
      signal
    });
    if (!res.ok) {
      const errorText = await res.text();
      try {
        const errorJson = JSON.parse(errorText);
        throw new Error(errorJson.error || errorJson.message || `Groq Error ${res.status}: ${errorText}`);
      } catch {
        throw new Error(`Groq Error ${res.status}: ${errorText}`);
      }
    }
    const data = await res.json();
    return data.choices[0].message.content;
  };

  try {
    return await makeRequest(model);
  } catch (e) {
    if (fallbackModel) {
      console.warn(`Groq ${model} failed, falling back to ${fallbackModel}`);
      return await makeRequest(fallbackModel);
    }
    throw e;
  }
};

const callGroqTranscription = async (audioBlob: Blob, model: string, fallbackModel?: string, prompt?: string) => {
  const makeRequest = async (m: string) => {
    const formData = new FormData();
    const ext = audioBlob.type.includes('webm') ? 'webm' : 'wav';
    formData.append('file', audioBlob, `audio.${ext}`);
    formData.append('model', m);
    formData.append('apiKey', GROQ_API_KEY);
    if (prompt) {
      formData.append('prompt', prompt);
    }
    const res = await fetch('/api/transcribe', {
      method: 'POST',
      body: formData
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `Groq Transcription Error: ${res.statusText}`);
    }
    const data = await res.json();
    return data.text;
  };

  try {
    return await makeRequest(model);
  } catch (e) {
    if (fallbackModel) {
      console.warn(`Groq ${model} failed, falling back to ${fallbackModel}`);
      return await makeRequest(fallbackModel);
    }
    throw e;
  }
};

export default function ChatArea({ onMenuClick }: { onMenuClick?: () => void }) {
  const { user } = useAuth();
  const { currentChatId, setCurrentChatId } = useChatContext();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [mode, setMode] = useState<ChatMode>('auto');
  const [showModeDropdown, setShowModeDropdown] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ data: string, mimeType: string } | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [streamingMessage, setStreamingMessage] = useState<string>('');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [lastError, setLastError] = useState<{ message: string, retryParams?: any } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('Thinking...');
  const [currentStreamingMessageId, setCurrentStreamingMessageId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewImageIndex, setPreviewImageIndex] = useState<number | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [guestRequestCount, setGuestRequestCount] = useState<number>(0);
  const [showSignInModal, setShowSignInModal] = useState(false);

  useEffect(() => {
    if (!user) {
      const count = parseInt(localStorage.getItem('guestRequestCount') || '0', 10);
      setGuestRequestCount(count);
    }
  }, [user]);

  const getAllImages = () => {
    const images: { src: string; alt?: string }[] = [];
    messages.forEach(msg => {
      if (msg.imageUrl) {
        images.push({ src: msg.imageUrl, alt: 'User uploaded image' });
      }
      // Extract markdown images from content
      const imgRegex = /!\[(.*?)\]\((.*?)\)/g;
      let match;
      while ((match = imgRegex.exec(msg.content)) !== null) {
        images.push({ src: match[2], alt: match[1] });
      }
    });
    return images;
  };

  const allImages = getAllImages();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (previewImageIndex === null) return;

      if (e.key === 'Escape') {
        setPreviewImageIndex(null);
      } else if (e.key === 'ArrowRight') {
        setPreviewImageIndex((prev) => (prev !== null && prev < allImages.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'ArrowLeft') {
        setPreviewImageIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : prev));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewImageIndex, allImages.length]);

  const handleImageClick = (src: string) => {
    const index = allImages.findIndex(img => img.src === src);
    if (index !== -1) {
      setPreviewImageIndex(index);
    } else {
      // Fallback for images not in history (e.g. just sent)
      setPreviewImage(src);
    }
  };
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modeDropdownRef = useRef<HTMLDivElement>(null);

  const [showScrollButton, setShowScrollButton] = useState(false);

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      // Show button if we are more than 200px from the bottom and have scrolled down a bit
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 200;
      setShowScrollButton(!isNearBottom && scrollTop > 300);
    }
  };

  const retryLastMessage = async () => {
    if (!lastError || !lastError.retryParams) return;
    const params = lastError.retryParams;
    setLastError(null);
    await handleSubmit(undefined, params.text, params.image);
  };

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, [currentChatId]);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  useEffect(() => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      const maxHeight = 200;
      const newHeight = Math.min(scrollHeight, maxHeight);
      textarea.style.height = `${newHeight}px`;
      textarea.style.overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden';
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.nativeEvent.isComposing) return;

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768;
    
    if (e.key === 'Enter' && !e.shiftKey && !isMobile) {
      e.preventDefault();
      if (input.trim() || selectedImage) {
        handleSubmit(e as unknown as React.FormEvent);
      }
    }
  };

  useEffect(() => {
    if (input === '' && textareaRef.current) {
      textareaRef.current.style.height = '24px';
      textareaRef.current.scrollTop = 0;
    }
  }, [input]);

  useEffect(() => {
    if (!user) {
      setIsLoadingMessages(false);
      return;
    }
    if (!currentChatId) {
      setMessages([]);
      setIsLoadingMessages(false);
      return;
    }

    setIsLoadingMessages(true);
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
      setIsLoadingMessages(false);
    }, (error) => {
      // Ignore errors if the user is logged out or logging out
      if (!auth.currentUser) return;
      
      setIsLoadingMessages(false);
      try {
        handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/chats/${currentChatId}/messages`);
      } catch (e) {
        handleError(e, "Failed to load messages");
      }
    });

    return () => unsubscribe();
  }, [user, currentChatId]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 1024;

          if (width > height && width > maxDim) {
            height *= maxDim / width;
            width = maxDim;
          } else if (height > maxDim) {
            width *= maxDim / height;
            height = maxDim;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            const base64String = dataUrl.split(',')[1];
            setSelectedImage({
              data: base64String,
              mimeType: 'image/jpeg'
            });
          }
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
      e.target.value = ''; // Reset to allow re-selection of the same file
    }
  };

  const generateSmartTitle = async (chatId: string, userMessage: string, aiResponse: string) => {
    if (!user) return;
    try {
      const prompt = `You are an intelligent assistant tasked with generating a **single, concise, and memorable chat title (5–8 words)** for this project.

Rules:
1. Generate the title **only once per session**.
2. Focus on the **main topic, key ideas, or recurring themes** in the conversation.
3. Avoid generic words like "chat", "discussion", or "conversation".
4. If no clear topic is present, fallback to: "Chat on [Date]".
5. Make the title **unique, context-aware, and easy to remember**.

Conversation:
User: "${userMessage}"
AI: "${aiResponse}"

Session Title Status: "false"`;

      let generatedTitle = '';
      try {
        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
        if (!apiKey) throw new Error("Missing Gemini key");
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: prompt
        });
        generatedTitle = response.text || '';
      } catch (e) {
        console.warn("Gemini title generation failed, falling back to Groq:", e);
        generatedTitle = await callGroqChatNonStream('llama-3.1-8b-instant', [{ role: 'user', content: prompt }]);
      }
      
      if (generatedTitle && !generatedTitle.includes("Title already generated")) {
        const cleanTitle = generatedTitle.replace(/^["']|["']$/g, '').trim();
        await updateDoc(doc(db, 'users', user.uid, 'chats', chatId), {
          title: cleanTitle
        });
      }
    } catch (error) {
      console.error("Failed to generate smart title:", error);
    }
  };

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const handleCopyMessage = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const handleEditMessage = (id: string, content: string) => {
    setEditingMessageId(id);
    setEditContent(content);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditContent('');
  };

  const handleSaveEdit = async (id: string, resubmit: boolean = false) => {
    if (!editContent.trim() || !user || !currentChatId) return;
    try {
      await updateDoc(doc(db, 'users', user.uid, 'chats', currentChatId, 'messages', id), {
        content: editContent.trim()
      });
      const newContent = editContent.trim();
      setEditingMessageId(null);
      setEditContent('');
      if (resubmit) {
        handleSubmit(undefined, newContent);
      }
    } catch (e) {
      console.error("Failed to edit message", e);
    }
  };

  const handleRegenerate = async (msgIndex: number) => {
    let lastUserMsg = '';
    let lastUserImage = null;
    for (let i = msgIndex - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        lastUserMsg = messages[i].content;
        if (messages[i].imageUrl) {
          // We don't have the raw data/mimeType easily available here, 
          // but we can pass the text. For full regenerate with image, 
          // we might need to fetch the image blob, but let's just resubmit text for now.
        }
        break;
      }
    }
    if (lastUserMsg) {
      handleSubmit(undefined, lastUserMsg);
    }
  };

  const handleStop = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
  };

  const generateRecommendations = async (messageId: string, userMessage: string, chatId: string | null) => {
    try {
      const prompt = `Based ONLY on the user's latest input, suggest exactly 2 follow-up questions or prompts the user could ask next to improve, extend, or deepen their request.
Do not repeat the same idea. Do not generate generic suggestions. Do not include explanations or extra text.
Format your response strictly as a JSON array of objects, with each object having a "title" (maximum 5 words) and a "prompt" (the full follow-up question).
Example: [{"title": "Explain the underlying mechanism", "prompt": "Can you explain the underlying mechanism in more detail?"}]

User Input:
"${userMessage.substring(0, 1000)}"

Return ONLY the JSON array.`;
      
      const result = await callGroqChatNonStream('llama-3.1-8b-instant', [{ role: 'user', content: prompt }]);
      const jsonMatch = result.match(/\[.*\]/s);
      if (jsonMatch) {
        const recs = JSON.parse(jsonMatch[0]);
        if (Array.isArray(recs) && recs.length > 0) {
          const finalRecs = recs.slice(0, 2);
          if (user && chatId) {
            await updateDoc(doc(db, 'users', user.uid, 'chats', chatId, 'messages', messageId), {
              recommendations: finalRecs
            });
          } else {
            setMessages(prev => prev.map(m => m.id === messageId ? { ...m, recommendations: finalRecs } : m));
          }
        }
      }
    } catch (e) {
      console.error("Failed to generate recommendations", e);
    }
  };

  const handleSubmit = async (e?: React.FormEvent, text?: string, image?: { data: string, mimeType: string }) => {
    if (e) e.preventDefault();
    setLastError(null);
    
    const userMessage = text || input.trim();
    const currentImage = image || selectedImage;
    
    if ((!userMessage && !currentImage) || isLoading) return;

    const isImageRequest = /^(?:please\s+)?(?:can you\s+)?(?:generate|draw|create|make|paint)\s+(?:an?\s+)?(?:image|picture|photo|drawing|art|illustration|portrait)/i.test(userMessage.trim());

    if (!user) {
      if (currentImage || isImageRequest) {
        setShowSignInModal(true);
        return;
      }
      
      if (guestRequestCount >= 10) {
        setShowSignInModal(true);
        return;
      }
      
      const newCount = guestRequestCount + 1;
      setGuestRequestCount(newCount);
      localStorage.setItem('guestRequestCount', newCount.toString());
      
      if (mode !== 'flash') {
        setMode('flash');
      }
    }

    if (!text) setInput('');
    if (!image) setSelectedImage(null);
    setIsLoading(true);
    setStreamingMessage('');
    
    const controller = new AbortController();
    setAbortController(controller);
    
    // Quick classification for loader text
    const lowerMsg = userMessage.toLowerCase();
    if (mode === 'search' || /search|find|lookup|who is|what is|current|latest/i.test(lowerMsg)) {
      setLoadingStatus('Searching...');
    } else if (/code|debug|function|class|implement|script|programming|syntax/i.test(lowerMsg)) {
      setLoadingStatus('Crafting Code...');
    } else if (/analyze|explain|reason|complex|calculate|solve/i.test(lowerMsg)) {
      setLoadingStatus('Analyzing...');
    } else if (currentImage) {
      setLoadingStatus('Viewing Image...');
    } else {
      setLoadingStatus('Thinking...');
    }

    let chatId = currentChatId;
    let isNewChat = false;

    if (user) {
      if (!chatId) {
        isNewChat = true;
        try {
          const chatRef = await addDoc(collection(db, 'users', user.uid, 'chats'), {
            title: userMessage.slice(0, 40) || 'New Chat',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
          chatId = chatRef.id;
          setCurrentChatId(chatId);
        } catch (error) {
          setIsLoading(false);
          try {
            handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}/chats`);
          } catch (e) {
            handleError(e, "Failed to create chat session");
          }
          return;
        }
      }
    }

    let userMessageRef: any = null;
    const messageData: any = {
      role: 'user',
      content: userMessage,
      hasImage: !!currentImage,
      createdAt: user ? serverTimestamp() : new Date()
    };
    if (currentImage) {
      messageData.imageUrl = `data:${currentImage.mimeType};base64,${currentImage.data}`;
    }

    if (user) {
      try {
        userMessageRef = await addDoc(collection(db, 'users', user.uid, 'chats', chatId!, 'messages'), messageData);
        await updateDoc(doc(db, 'users', user.uid, 'chats', chatId!), {
          updatedAt: serverTimestamp()
        });
      } catch (error) {
        setIsLoading(false);
        try {
          handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/chats/${chatId}/messages`);
        } catch (e) {
          handleError(e, "Failed to send message");
        }
        return;
      }

      // Upload image to storage in the background
      if (currentImage && userMessageRef) {
        const imageToUpload = currentImage;
        const msgRef = userMessageRef;
        const cid = chatId;
        (async () => {
          try {
            const imageRef = ref(storage, `users/${user.uid}/chats/${cid}/images/${Date.now()}`);
            await uploadString(imageRef, `data:${imageToUpload.mimeType};base64,${imageToUpload.data}`, 'data_url');
            const uploadedImageUrl = await getDownloadURL(imageRef);
            await updateDoc(msgRef, { imageUrl: uploadedImageUrl });
            
            // Save to dedicated images collection for the gallery
            await addDoc(collection(db, 'users', user.uid, 'generated_images'), {
              prompt: userMessage || 'Uploaded Image',
              imageData: uploadedImageUrl,
              createdAt: serverTimestamp(),
              isUploaded: true
            });
          } catch (error) {
            console.error("Failed to upload image to storage in background", error);
          }
        })();
      }
    } else {
      // Guest mode: update local state
      const newMsg: Message = {
        id: Date.now().toString(),
        ...messageData
      };
      setMessages(prev => [...prev, newMsg]);
    }

    if (isImageRequest && !currentImage) {
      setIsGeneratingImage(true);
      setLoadingStatus('Creating Art...');
      
      let finalImageResponse = '';
      let generatedImageBase64 = '';
      try {
        const res = await fetch('/api/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: userMessage })
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          if (res.status === 429 || errData.error === 'QUOTA_EXCEEDED') {
            finalImageResponse = "I'm sorry, but it looks like we've reached our image generation quota for now. Please try again later!";
          } else {
            finalImageResponse = "I'm sorry, I encountered an error while generating the image. Please try again.";
          }
        } else {
          const blob = await res.blob();
          
          // Compress the image to avoid Firestore's 1MB document limit
          const compressedBase64 = await new Promise<string>((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement('canvas');
              // Max dimensions to keep size small but quality decent
              const MAX_WIDTH = 800;
              const MAX_HEIGHT = 800;
              let width = img.width;
              let height = img.height;

              if (width > height) {
                if (width > MAX_WIDTH) {
                  height *= MAX_WIDTH / width;
                  width = MAX_WIDTH;
                }
              } else {
                if (height > MAX_HEIGHT) {
                  width *= MAX_HEIGHT / height;
                  height = MAX_HEIGHT;
                }
              }
              canvas.width = width;
              canvas.height = height;
              
              const ctx = canvas.getContext('2d');
              if (!ctx) {
                reject(new Error('Failed to get canvas context'));
                return;
              }
              
              // Fill with white background to prevent transparent areas from turning black
              ctx.fillStyle = '#FFFFFF';
              ctx.fillRect(0, 0, width, height);
              
              ctx.drawImage(img, 0, 0, width, height);
              // Compress as WEBP with 0.8 quality (smaller size, better quality)
              resolve(canvas.toDataURL('image/webp', 0.8));
            };
            img.onerror = () => reject(new Error('Failed to load image for compression'));
            img.src = URL.createObjectURL(blob);
          });
          
          generatedImageBase64 = compressedBase64;
          const safeAltText = userMessage.replace(/[\r\n\[\]]/g, ' ').substring(0, 150).trim() || 'Generated Image';
          finalImageResponse = `Here is your generated image:\n\n![${safeAltText}](${compressedBase64})`;
        }
      } catch (err) {
        console.error("Image generation error:", err);
        finalImageResponse = "I'm sorry, I encountered a network error while generating the image.";
      }

      try {
        await addDoc(collection(db, 'users', user!.uid, 'chats', chatId!, 'messages'), {
          role: 'model',
          content: finalImageResponse,
          createdAt: serverTimestamp(),
          isGeneratedImage: true
        });
        await updateDoc(doc(db, 'users', user!.uid, 'chats', chatId!), {
          updatedAt: serverTimestamp()
        });

        // Save to dedicated images collection for the gallery
        if (generatedImageBase64) {
          await addDoc(collection(db, 'users', user!.uid, 'generated_images'), {
            prompt: userMessage,
            imageData: generatedImageBase64,
            createdAt: serverTimestamp()
          });
        }
      } catch (error) {
        console.error("Failed to save image response", error);
        try {
          handleFirestoreError(error, OperationType.WRITE, `users/${user!.uid}/chats/${chatId!}/messages`);
        } catch (e) {
          handleError(e, "Failed to save image response");
        }
      }
      
      setIsGeneratingImage(false);
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
      
      const contents: any[] = [];
      
      // Add previous messages for context, ensuring alternating roles
      // Memory Summarization via Groq
      let contextText = "";
      const recentMessages = messages.slice(-6); // Keep last 6 messages intact
      const olderMessages = messages.slice(0, -6);

      if (olderMessages.length > 0) {
        const historyText = olderMessages.map(m => `${m.role}: ${m.content}`).join('\n');
        const summaryPrompt = `Summarize the following conversation history, keeping only important details to reduce token usage while retaining context for future responses:\n\n${historyText}`;
        try {
          let summary = '';
          try {
            summary = await callCerebrasNonStream('llama-3.1-8b-instant', [{ role: 'user', content: summaryPrompt }]);
          } catch (e) {
            console.warn("Cerebras summarization failed, falling back to Gemini 2.5 Pro:", e);
            const aiFallback = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY! });
            const response = await aiFallback.models.generateContent({ model: 'gemini-2.5-pro', contents: summaryPrompt });
            summary = response.text || '';
          }
          contextText = `[Summary of older conversation: ${summary}]\n\n`;
        } catch (e) {
          console.error("Summarization failed completely", e);
        }
      }

      if (contextText) {
        contents.push({ role: 'user', parts: [{ text: contextText }] });
        contents.push({ role: 'model', parts: [{ text: 'Understood. I will remember this context.' }] });
      }

      for (const msg of recentMessages) {
        const textContent = msg.content || (msg.hasImage ? "[Image uploaded]" : "");
        if (!textContent) continue;

        if (contents.length > 0 && contents[contents.length - 1].role === msg.role) {
          // Append to the previous message's parts
          contents[contents.length - 1].parts.push({ text: "\n\n" + textContent });
        } else {
          contents.push({
            role: msg.role,
            parts: [{ text: textContent }]
          });
        }
      }

      // Ensure the first message is from 'user'
      if (contents.length > 0 && contents[0].role !== 'user') {
        contents.shift();
      }

      const currentParts: any[] = [];
      if (userMessage) {
        currentParts.push({ text: userMessage });
      } else if (currentImage) {
        currentParts.push({ text: "Describe this image." });
      }
      
      if (currentImage) {
        currentParts.push({
          inlineData: {
            data: currentImage.data,
            mimeType: currentImage.mimeType
          }
        });
      }

      if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
        contents[contents.length - 1].parts.push(...currentParts);
      } else {
        contents.push({
          role: 'user',
          parts: currentParts
        });
      }

      const tools: any[] = [];
      const searchWebTool = {
        functionDeclarations: [
          {
            name: "search_web",
            description: "Search the web for up-to-date information.",
            parameters: {
              type: "OBJECT",
              properties: {
                query: { type: "STRING", description: "The search query" }
              },
              required: ["query"]
            }
          }
        ]
      };

      if (mode === 'search') {
        tools.push(searchWebTool);
      } else if (mode === 'auto' || mode === 'pro') {
        tools.push(searchWebTool);
      }

      const systemInstruction = `You are Q1, a helpful, intelligent, and friendly AI assistant. You maintain conversation history and provide clear, concise, and accurate answers.
           CRITICAL: You MUST use the search_web tool for any relevant queries requiring up-to-date, real-world, or specific factual information. When you use the search_web tool, you MUST cite your sources by appending [link] to the facts you provide.
           
           MATH FORMATTING GUIDELINES:
           When answering math problems, produce clean, structured, and highly readable outputs that mirror professional mathematical presentation.
           - Use LaTeX-style formatting for all mathematical expressions (e.g., $$ for block math and $ for inline math).
           - Distinctly separate problem statements, step-by-step solutions, and final answers.
           - Use section headers such as "### Given", "### Solution", and "### Final Answer" to create a visually organized flow.
           - Follow a logical progression, breaking down complex operations into smaller, digestible steps.
           - Provide concise explanations for each transformation or rule applied (e.g., distributive property, factoring, integration rules).
           - Align equations vertically where appropriate to improve readability.
           - Keep inline calculations minimal; display more complex derivations in block format for clarity.
           - Emphasize consistency in symbols, notation, and formatting across all responses.
           - Ensure the final answer is clearly highlighted or summarized at the end.`;

      const config: any = {
        systemInstruction: systemInstruction
      };

      if (tools.length > 0) {
        config.tools = tools;
      }
      
      let modelName = user ? 'gemini-3-flash-preview' : 'gemini-3.1-flash-lite-preview';
      if (mode === 'pro' && !user) {
        modelName = 'gemini-3.1-flash-lite-preview';
      } else if (mode === 'pro' && user) {
        modelName = 'gemini-3.1-pro-preview';
      }
      
      const lastMessage = contents[contents.length - 1]?.parts?.[0]?.text || '';
      let classification = 'fast';

      if (mode === 'auto') {
        const text = lastMessage.toLowerCase();
        const isProRule = /\b(function|class|def|const|let|var|import|export|npm|pip|code|debug|error|exception|api|endpoint|script|query|math|calculate|solve|equation|integral|derivative|sum|multiply|divide)\b/i.test(text) || 
                           /(?:=>|\{|\}|\[|\]|<html>|<script>)/.test(text);
        
        if (isProRule) {
          classification = 'pro';
          setLoadingStatus('Crafting Code...');
        } else {
          classification = 'fast';
          setLoadingStatus('Thinking...');
        }
      } else {
        classification = mode;
      }

      let dynamicSystemInstruction = systemInstruction;

      if (classification === 'pro') {
        dynamicSystemInstruction += `\n\n[PRO LAYER ACTIVE]\nYou are an expert software engineer and mathematician. Provide clean, efficient, and well-documented code or step-by-step logic.\n- ALWAYS wrap code snippets in standard Markdown triple-backtick blocks with the correct language identifier.\n- Ensure proper indentation.\n- Do not use HTML tags for code.\n- Structure your response with clear headings and explanations.\n- Avoid incomplete code blocks.`;
      }

      config.systemInstruction = dynamicSystemInstruction;

      const openAIMessages = [
        { role: 'system', content: dynamicSystemInstruction },
        ...(contextText ? [{ role: 'system', content: contextText }] : []),
        ...recentMessages.map(m => ({
          role: m.role === 'model' ? 'assistant' : 'user',
          content: m.content || (m.hasImage ? "[Image uploaded]" : " ")
        })),
        { 
          role: 'user', 
          content: currentImage ? [
            { type: 'text', text: userMessage || "Describe this image." },
            { type: 'image_url', image_url: { url: `data:${currentImage.mimeType};base64,${currentImage.data}` } }
          ] : (userMessage || " ")
        }
      ];

      let aiMessageRef: any = null;
      if (user) {
        try {
          const ref = await addDoc(collection(db, 'users', user.uid, 'chats', chatId!, 'messages'), {
            role: 'model',
            content: '',
            isStreaming: true,
            createdAt: serverTimestamp()
          });
          aiMessageRef = ref;
          setCurrentStreamingMessageId(ref.id);
        } catch (e) {
          console.error("Failed to create placeholder message", e);
        }
      }

      let lastUpdateTime = Date.now();
      const handleChunk = (text: string) => {
        fullResponse += text;
        setStreamingMessage(fullResponse);
        
        if (user && aiMessageRef && Date.now() - lastUpdateTime > 1500) {
          lastUpdateTime = Date.now();
          updateDoc(aiMessageRef, { content: fullResponse }).catch(e => console.error("Failed to sync chunk", e));
        }
      };

      const executeWithTimeoutAndFallback = async (primaryFn: () => Promise<void>, fallbackFn: () => Promise<void>, timeoutMs: number = 6000) => {
        try {
          const timeoutPromise = new Promise<void>((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), timeoutMs));
          await Promise.race([primaryFn(), timeoutPromise]);
        } catch (error: any) {
          console.warn(`Primary failed (${error.message}). Triggering fallback (1 level max)...`);
          await fallbackFn();
        }
      };

      let searchWebCallArgs: any = null;
      let searchWebCallId: string | null = null;

      const runGeminiStream = async (model: string) => {
        const res = await ai.models.generateContentStream({ model, contents, config });
        for await (const chunk of res) {
          if (controller.signal.aborted) throw new DOMException('Aborted', 'AbortError');
          if (chunk.functionCalls && chunk.functionCalls.length > 0) {
            const call = chunk.functionCalls[0];
            if (call.name === 'search_web') {
              searchWebCallArgs = call.args;
              searchWebCallId = call.id || null;
            }
          }
          if (chunk.text) handleChunk(chunk.text);
        }
      };

      try {
        if (currentImage) {
          // Image Analysis
          const runPrimary = () => callOpenAIStream('https://api.groq.com/openai/v1/chat/completions', GROQ_API_KEY, 'llama-4-scout-17b-16e-instruct', openAIMessages, handleChunk, controller.signal);
          await executeWithTimeoutAndFallback(runPrimary, () => runGeminiStream('gemini-3-flash-preview'), 8000);
        } else if (classification === 'pro') {
          // Pro Mode
          const runPrimary = () => callOpenAIStream('https://api.cerebras.ai/v1/chat/completions', CEREBRAS_API_KEY, 'qwen-3-235b-a22b-instruct-2507', openAIMessages, handleChunk, controller.signal);
          const runFallback = () => callOpenAIStream('https://api.groq.com/openai/v1/chat/completions', GROQ_API_KEY, 'llama-3.3-70b-versatile', openAIMessages, handleChunk, controller.signal);
          await executeWithTimeoutAndFallback(runPrimary, runFallback, 6000);
        } else if (classification === 'search') {
          // Search Mode: groq/compound -> groq/compound-mini -> Gemini (with Tavily tool)
          const runPrimary = () => callOpenAIStream('https://api.groq.com/openai/v1/chat/completions', GROQ_API_KEY, 'groq/compound', openAIMessages, handleChunk, controller.signal);
          const runFallback = async () => {
            try {
              await callOpenAIStream('https://api.groq.com/openai/v1/chat/completions', GROQ_API_KEY, 'groq/compound-mini', openAIMessages, handleChunk, controller.signal);
            } catch (err) {
              console.warn("groq/compound-mini failed, falling back to Gemini with search tool", err);
              await runGeminiStream('gemini-3-flash-preview');
            }
          };
          await executeWithTimeoutAndFallback(runPrimary, runFallback, 10000);
        } else {
          // Fast Mode (with Load Distribution)
          const useLlama = Math.random() < 0.25; // ~25% to Llama 3.1 8B
          if (useLlama) {
            const runPrimary = () => callOpenAIStream('https://api.groq.com/openai/v1/chat/completions', GROQ_API_KEY, 'llama-3.1-8b-instant', openAIMessages, handleChunk, controller.signal);
            const runFallback = () => runGeminiStream('gemini-3-flash-preview');
            await executeWithTimeoutAndFallback(runPrimary, runFallback, 5000);
          } else {
            const runPrimary = () => runGeminiStream('gemini-3-flash-preview');
            const runFallback = () => runGeminiStream('gemini-2.5-flash');
            await executeWithTimeoutAndFallback(runPrimary, runFallback, 5000);
          }
        }

        if (searchWebCallArgs && !controller.signal.aborted) {
          // If the AI model has already provided a substantial response, do not trigger search
          if (fullResponse.trim().length > 0) {
            console.log("AI already provided a response, skipping search.");
          } else {
            setIsSearching(true);
            setLoadingStatus('Searching...');
            
            let searchResults = "Search unavailable. Rely on training data.";
            try {
              const searchRes = await fetch('/api/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: searchWebCallArgs.query }),
                signal: controller.signal
              });
              if (searchRes.ok) {
                const searchData = await searchRes.json();
                searchResults = searchData.results;
              }
            } catch (err: any) {
              if (err.name !== 'AbortError') {
                console.error('Search API call failed:', err);
              }
            }
            
            if (!controller.signal.aborted) {
              let parsedResults: any[] = [];
              try {
                parsedResults = typeof searchResults === 'string' ? JSON.parse(searchResults) : searchResults;
              } catch (e) {
                // ignore
              }

              if (Array.isArray(parsedResults) && parsedResults.length > 0) {
                const rawSearchText = JSON.stringify(parsedResults.slice(0, 5));
                const formatPrompt = `Organize, clean, and structure the following search results for readable, well-formatted output. Keep the essential facts and links. Return ONLY the formatted markdown.\n\nSearch Results:\n${rawSearchText}`;
                
                let formattedSearch = "";
                try {
                  const aiFormat = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY! });
                  const response = await aiFormat.models.generateContent({ model: 'gemini-3-flash-preview', contents: formatPrompt });
                  formattedSearch = response.text || rawSearchText;
                } catch (e: any) {
                  if (e.name !== 'AbortError') {
                    console.warn("Gemini search formatting failed, falling back to Cerebras:", e);
                    try {
                      formattedSearch = await callCerebrasNonStream('llama-3.1-8b-instant', [{ role: 'user', content: formatPrompt }]);
                    } catch (fallbackError) {
                      console.error("Search formatting fallback failed", fallbackError);
                      formattedSearch = rawSearchText;
                    }
                  } else {
                    formattedSearch = rawSearchText;
                  }
                }

                if (!controller.signal.aborted) {
                  fullResponse += `\n\n### 🔍 Search Results for "${searchWebCallArgs.query}"\n\n${formattedSearch}\n\n`;
                }
              } else {
                fullResponse += `\n\n### 🔍 Search Results for "${searchWebCallArgs.query}"\n\n*No results found.*\n\n`;
              }
              setIsSearching(false);
              setStreamingMessage(fullResponse);
            }
          }
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          console.log('Generation aborted by user');
        } else {
          const { message: friendlyMessage } = handleError(error, "Failed to generate AI response");
          setLastError({ 
            message: friendlyMessage,
            retryParams: { text: userMessage, image: currentImage }
          });
          fullResponse = `Error: ${friendlyMessage}`;
        }
      }

      try {
        let finalMessageId = aiMessageRef?.id;
        if (user) {
          if (aiMessageRef) {
            await updateDoc(aiMessageRef, {
              content: fullResponse,
              isStreaming: false
            });
          } else {
            const messageData: any = {
              role: 'model',
              content: fullResponse,
              createdAt: serverTimestamp()
            };
            const docRef = await addDoc(collection(db, 'users', user.uid, 'chats', chatId!, 'messages'), messageData);
            finalMessageId = docRef.id;
          }

          await updateDoc(doc(db, 'users', user.uid, 'chats', chatId!), {
            updatedAt: serverTimestamp()
          });

          // Generate smart title asynchronously for new chats using the AI response
          if (isNewChat) {
            generateSmartTitle(chatId!, userMessage || (currentImage ? "Image uploaded" : "New Chat"), fullResponse);
          }
        } else {
          // Guest mode: update local state
          finalMessageId = Date.now().toString();
          const newMsg: Message = {
            id: finalMessageId,
            role: 'model',
            content: fullResponse,
            createdAt: new Date()
          };
          setMessages(prev => [...prev, newMsg]);
        }

        // Generate prompt recommendations
        if (finalMessageId && !fullResponse.startsWith('Error:')) {
          generateRecommendations(finalMessageId, userMessage || (currentImage ? "Image uploaded" : ""), chatId);
        }
      } catch (error) {
        try {
          if (user) {
            handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/chats/${chatId}/messages`);
          }
        } catch (e) {
          handleError(e, "Failed to save AI response");
        }
      } finally {
        setIsLoading(false);
        setIsSearching(false);
        setStreamingMessage('');
        setCurrentStreamingMessageId(null);
      }
    } catch (error: any) {
      setIsLoading(false);
      handleError(error, "Failed to process request");
    }
  };

  const modeLabels: Record<ChatMode, string> = {
    auto: 'Auto',
    flash: 'Flash',
    pro: 'Pro',
    search: 'Search'
  };

  const modeDescriptions: Record<ChatMode, string> = {
    auto: 'Smartly switches models based on task complexity.',
    flash: 'Optimized for speed and simple tasks.',
    pro: 'Best for complex reasoning and creative tasks.',
    search: 'Real-time web search for up-to-date info.'
  };

  const modeIcons: Record<ChatMode, React.ReactNode> = {
    auto: <Cpu size={16} />,
    flash: <Zap size={16} />,
    pro: <Sparkles size={16} />,
    search: <Globe size={16} />
  };

  const isChatStarted = messages.length > 0 || streamingMessage || isLoadingMessages;

  useEffect(() => {
    if (!isLoading && isChatStarted) {
      textareaRef.current?.focus();
    }
  }, [isLoading, isChatStarted]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modeDropdownRef.current && !modeDropdownRef.current.contains(event.target as Node)) {
        setShowModeDropdown(false);
      }
    };

    if (showModeDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showModeDropdown]);

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent relative overflow-hidden font-sans">
      {/* Messages Area */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto scroll-smooth relative flex flex-col"
      >
        {/* Sticky Floating Actions */}
        <div className="sticky top-0 left-0 right-0 z-50 flex justify-between items-center p-4 pointer-events-none shrink-0">
          {!user ? (
            <div className="flex items-center gap-2 pointer-events-auto">
              <Link href="/">
                <PlanetLogo className="text-foreground/60 hover:text-foreground w-6 h-6 transition-all" />
              </Link>
            </div>
          ) : (
            <button 
              onClick={onMenuClick}
              className="p-3 bg-surface/80 backdrop-blur-md border border-border/50 hover:bg-surface-hover rounded-full text-foreground/60 hover:text-foreground md:hidden pointer-events-auto transition-all shadow-lg"
            >
              <Menu size={20} />
            </button>
          )}
          <div className="flex-1" />
          {!user ? (
            <button 
              onClick={loginWithGoogle}
              className="px-4 py-2 bg-foreground text-background hover:opacity-90 rounded-full font-medium pointer-events-auto transition-all shadow-lg text-sm"
            >
              Sign In
            </button>
          ) : (
            <button 
              onClick={() => setCurrentChatId(null)}
              className="p-3 bg-surface/80 backdrop-blur-md border border-border/50 hover:bg-surface-hover rounded-full text-foreground/60 hover:text-foreground pointer-events-auto transition-all shadow-lg ml-auto group"
              title="New Chat"
            >
              <SquarePen size={20} className="group-hover:scale-110 transition-transform" />
            </button>
          )}
        </div>

        {isLoadingMessages ? (
          <div className="flex-1 flex flex-col items-center justify-center px-4">
            <Helix size="35" speed="2.5" color="var(--color-foreground)" />
          </div>
        ) : !isChatStarted ? (
          <div className="flex-1 flex flex-col items-center justify-center px-4">
            {/* Welcome screen is handled by the input area's positioning */}
          </div>
        ) : (
          <div className="max-w-3xl mx-auto w-full px-4 pb-40 md:pb-32 space-y-6 md:space-y-8 flex-1">
            <AnimatePresence initial={false}>
              {messages.filter(msg => msg.id !== currentStreamingMessageId).map((msg, index) => (
                <motion.div 
                  key={msg.id} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} group w-full`}
                >
                  <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-[95%] md:max-w-[85%] relative`}>
                    {msg.role === 'user' && msg.imageUrl && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mb-2 cursor-pointer group relative"
                        onClick={() => handleImageClick(msg.imageUrl!)}
                      >
                        <img 
                          src={msg.imageUrl} 
                          alt="Uploaded" 
                          className="max-w-[200px] md:max-w-[300px] rounded-2xl object-contain shadow-md border border-border/50"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-2xl flex items-center justify-center">
                          <Search className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={20} />
                        </div>
                      </motion.div>
                    )}

          <div className={`${msg.role === 'user' ? 'bg-surface rounded-[24px] px-4 py-3 md:px-5 md:py-3.5 text-foreground shadow-sm text-[15px] md:text-[15px]' : 'bg-transparent text-foreground text-[16px] md:text-[15px] w-full'}`}>
                      {msg.role === 'model' ? (
                        <div className="w-full">
                          {msg.content.startsWith('Error:') ? (
                            <div className="p-4 bg-surface-hover border border-border rounded-xl text-foreground flex items-start gap-3 mb-2">
                              <AlertCircle size={18} className="mt-0.5 shrink-0" />
                              <div className="text-sm font-medium leading-relaxed">
                                {msg.content.replace('Error:', '').trim()}
                              </div>
                            </div>
                          ) : (
                            <ResponseFormatter content={msg.content} isStreaming={msg.isStreaming} onImageClick={handleImageClick} />
                          )}
                          
                          {!msg.isStreaming && (
                            <>
                              {/* Action Row */}
                              <div className="flex flex-wrap items-center gap-1 mt-4 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity text-foreground/40">
                                {[
                                  { icon: <RefreshCcw size={14} />, title: "Regenerate", onClick: () => handleRegenerate(index) },
                                  { icon: copiedMessageId === msg.id ? <Check size={14} className="text-green-500" /> : <Copy size={14} />, title: "Copy", onClick: () => handleCopyMessage(msg.id, msg.content) },
                                  { icon: <ThumbsUp size={14} />, title: "Good response", onClick: () => {} },
                                  { icon: <ThumbsDown size={14} />, title: "Bad response", onClick: () => {} },
                                  (!msg.content.includes('![') && !msg.content.includes('<img') && !msg.content.includes('data:image/')) ? { 
                                    icon: speakingMessageId === msg.id ? <Square size={14} className="fill-current" /> : <Volume2 size={14} />, 
                                    title: speakingMessageId === msg.id ? "Stop reading" : "Read aloud", 
                                    onClick: () => {
                                      if (speakingMessageId === msg.id) {
                                        window.speechSynthesis.cancel();
                                        setSpeakingMessageId(null);
                                      } else {
                                        window.speechSynthesis.cancel();
                                        const utterance = new SpeechSynthesisUtterance(msg.content);
                                        utterance.onstart = () => setSpeakingMessageId(msg.id);
                                        utterance.onend = () => setSpeakingMessageId(null);
                                        utterance.onerror = () => setSpeakingMessageId(null);
                                        window.speechSynthesis.speak(utterance);
                                      }
                                    } 
                                  } : null,
                                  { icon: <Share size={14} />, title: "Share", onClick: () => {} },
                                  { icon: <MoreHorizontal size={14} />, title: "More options", onClick: () => {} }
                                ].filter(Boolean).map((btn: any, i) => (
                                  <button 
                                    key={i}
                                    onClick={btn.onClick}
                                    className={`p-1.5 rounded-lg hover:bg-surface-hover transition-colors ${btn.color || 'hover:text-foreground'}`} 
                                    title={btn.title}
                                  >
                                    {btn.icon}
                                  </button>
                                ))}
                              </div>

                              {/* Suggestions */}
                              {msg.recommendations && msg.recommendations.length > 0 && (
                                <div className="mt-5 space-y-3">
                                  {msg.recommendations.map((rec, i) => (
                                    <button 
                                      key={i}
                                      onClick={() => {
                                        setInput(rec.prompt);
                                        textareaRef.current?.focus();
                                      }}
                                      className="flex items-center gap-3 text-sm font-normal text-foreground/60 hover:text-foreground transition-colors text-left"
                                      title={rec.prompt}
                                    >
                                      <CornerDownRight size={16} className="text-foreground/40 shrink-0" />
                                      {rec.title}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2 group/user relative w-full">
                          {editingMessageId === msg.id ? (
                            <div className="flex flex-col gap-2 w-full min-w-[250px]">
                              <textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="w-full bg-chat-bg/50 text-foreground rounded-xl p-3 text-[15px] resize-none focus:outline-none focus:ring-1 focus:ring-border border border-border/50"
                                rows={3}
                                autoFocus
                              />
                              <div className="flex items-center justify-end gap-2 mt-1">
                                <button onClick={handleCancelEdit} className="px-3 py-1.5 text-xs font-medium text-foreground/60 hover:text-foreground transition-colors rounded-lg hover:bg-surface-hover">Cancel</button>
                                <button onClick={() => handleSaveEdit(msg.id, false)} className="px-3 py-1.5 text-xs font-medium text-foreground bg-surface-hover hover:bg-surface transition-colors rounded-lg border border-border/50">Save</button>
                                <button onClick={() => handleSaveEdit(msg.id, true)} className="px-3 py-1.5 text-xs font-medium text-background bg-foreground hover:opacity-90 transition-colors rounded-lg">Save & Submit</button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <p className="whitespace-pre-wrap leading-relaxed break-words font-normal">{msg.content}</p>
                              <div className="absolute -bottom-10 right-0 flex items-center gap-1 opacity-0 group-hover/user:opacity-100 transition-opacity">
                                <button onClick={() => handleEditMessage(msg.id, msg.content)} className="p-1.5 rounded-lg hover:bg-surface-hover transition-colors text-foreground/40 hover:text-foreground" title="Edit">
                                  <Edit2 size={14} />
                                </button>
                                <button onClick={() => handleCopyMessage(msg.id, msg.content)} className="p-1.5 rounded-lg hover:bg-surface-hover transition-colors text-foreground/40 hover:text-foreground" title="Copy">
                                  {copiedMessageId === msg.id ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
              {streamingMessage && (
                <motion.div 
                  key="streaming"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="flex justify-start group w-full"
                >
                  <div className="max-w-[95%] md:max-w-[80%] relative bg-transparent text-foreground text-[16px] md:text-[15px] w-full">
                    <div className="w-full">
                      <ResponseFormatter content={streamingMessage} isStreaming={true} onImageClick={handleImageClick} />
                    </div>
                  </div>
                </motion.div>
              )}
              {isSearching && (
                <motion.div 
                  key="searching"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex justify-start px-1 mb-4"
                >
                  <Loader text="Searching..." />
                </motion.div>
              )}
              {isGeneratingImage && (
                <motion.div 
                  key="generating-image"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex justify-start group w-full"
                >
                  <div className="w-full max-w-lg rounded-2xl overflow-hidden relative aspect-square border border-border bg-surface">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/5 to-transparent -translate-x-full" style={{ animation: 'shimmer-skeleton 2s infinite' }} />
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-muted">
                      <motion.div
                        animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <div className="w-12 h-12 rounded-full border-2 border-dashed border-muted/30 flex items-center justify-center">
                          <span className="text-xl">✨</span>
                        </div>
                      </motion.div>
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-sm font-medium">Creating Art...</span>
                        <span className="text-xs opacity-70">This usually takes a few seconds</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              {isLoading && !streamingMessage && !isSearching && !isGeneratingImage && (
                <motion.div 
                  key="loading"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, transition: { duration: 0.2 } }}
                  className="flex justify-start group w-full"
                >
                  <Loader text={loadingStatus} />
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Image Preview Modal */}
      <AnimatePresence>
        {(previewImageIndex !== null || previewImage !== null) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 md:p-10"
            onClick={() => {
              setPreviewImage(null);
              setPreviewImageIndex(null);
            }}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-fit h-fit group flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img 
                src={previewImageIndex !== null ? allImages[previewImageIndex].src : previewImage!} 
                alt="Preview" 
                className="max-w-full max-h-[90vh] block rounded-lg shadow-2xl border border-white/10" 
                referrerPolicy="no-referrer"
              />
              
              {/* Action Buttons Overlay */}
              <div className="absolute top-6 right-6 flex items-center gap-3">
                {previewImageIndex !== null && (
                  <button 
                    onClick={() => {
                      const img = allImages[previewImageIndex];
                      const link = document.createElement('a');
                      link.href = img.src;
                      link.download = 'download.png';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    className="p-2 bg-black/20 hover:bg-black/40 backdrop-blur-sm border border-white/10 rounded-full text-white/70 hover:text-white transition-all duration-200 drop-shadow-md"
                    title="Download"
                  >
                    <Download size={20} />
                  </button>
                )}
                <button 
                  onClick={() => {
                    setPreviewImage(null);
                    setPreviewImageIndex(null);
                  }}
                  className="p-2 bg-black/20 hover:bg-black/40 backdrop-blur-sm border border-white/10 rounded-full text-white/70 hover:text-white transition-all duration-200 drop-shadow-md"
                  title="Close preview"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Navigation Arrows */}
              {previewImageIndex !== null && allImages.length > 1 && (
                <>
                  {previewImageIndex > 0 && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewImageIndex(previewImageIndex - 1);
                      }}
                      className="absolute left-4 p-3 rounded-full bg-black/20 hover:bg-black/40 text-white/70 hover:text-white transition-all backdrop-blur-sm border border-white/10"
                    >
                      <ChevronDown size={24} className="rotate-90" />
                    </button>
                  )}
                  {previewImageIndex < allImages.length - 1 && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewImageIndex(previewImageIndex + 1);
                      }}
                      className="absolute right-4 p-3 rounded-full bg-black/20 hover:bg-black/40 text-white/70 hover:text-white transition-all backdrop-blur-sm border border-white/10"
                    >
                      <ChevronDown size={24} className="-rotate-90" />
                    </button>
                  )}
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sign In Modal */}
      <AnimatePresence>
        {showSignInModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowSignInModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-surface border border-border rounded-2xl shadow-2xl p-6 md:p-8 max-w-sm w-full relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setShowSignInModal(false)}
                className="absolute top-4 right-4 p-2 text-foreground/60 hover:text-foreground hover:bg-surface-hover rounded-full transition-colors"
              >
                <X size={20} />
              </button>
              
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-16 h-16 bg-foreground/5 rounded-full flex items-center justify-center mb-4">
                  <PlanetLogo className="w-8 h-8 text-foreground" />
                </div>
                <h2 className="text-2xl font-semibold text-foreground mb-2">Sign In Required</h2>
                <p className="text-foreground text-sm">
                  {guestRequestCount >= 10 
                    ? "You've reached the free guest limit. Sign in to continue chatting and unlock more features." 
                    : "Sign in to use image recognition and unlock the full power of Q1."}
                </p>
              </div>

              <button 
                onClick={async () => {
                  try {
                    await loginWithGoogle();
                    setShowSignInModal(false);
                  } catch (error) {
                    handleError(error, "Login failed");
                  }
                }}
                className="w-full py-3 px-4 bg-foreground text-background hover:opacity-90 rounded-xl font-medium transition-all shadow-md flex items-center justify-center gap-2"
              >
                <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className={`absolute left-0 right-0 p-3 md:p-6 flex flex-col items-center z-20 transition-all duration-500 ${!isChatStarted ? 'top-1/2 -translate-y-1/2' : 'bottom-0 pb-safe'}`}>
        {/* Scroll to Bottom Button */}
        <AnimatePresence>
          {showScrollButton && isChatStarted && (
            <motion.button
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              onClick={scrollToBottom}
              className="absolute -top-12 left-1/2 -translate-x-1/2 p-2.5 bg-surface/80 backdrop-blur-md border border-border/50 rounded-full text-foreground/60 hover:text-foreground shadow-xl transition-all hover:scale-110 active:scale-95 z-30 flex items-center justify-center"
              title="Scroll to bottom"
            >
              <ChevronDown size={20} />
            </motion.button>
          )}
        </AnimatePresence>

        {!isChatStarted && (
          <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
            {!user ? (
              <Link href="/">
                <PlanetLogo className="text-foreground w-10 h-10 md:w-12 md:h-12 hover:opacity-80 transition-opacity" />
              </Link>
            ) : (
              <>
                <PlanetLogo className="text-foreground w-10 h-10 md:w-12 md:h-12" />
                <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-foreground">Q1</h1>
              </>
            )}
          </div>
        )}
        <form onSubmit={handleSubmit} className="w-full max-w-3xl relative">
          <motion.div 
            className="relative bg-surface rounded-[24px] md:rounded-[28px] shadow-2xl border border-border/50 focus-within:border-border flex flex-col p-1.5 md:p-2"
          >
            {lastError && (
              <div className="mb-4 p-4 bg-surface-hover border border-border rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-foreground/10 flex items-center justify-center text-foreground/60 shrink-0">
                    <AlertCircle size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Generation Failed</p>
                    <p className="text-xs text-foreground leading-tight mt-0.5">{lastError.message}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button 
                    onClick={() => setLastError(null)}
                    className="flex-1 sm:flex-none px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface-hover rounded-lg transition-colors"
                  >
                    Dismiss
                  </button>
                  <button 
                    onClick={retryLastMessage}
                    className="flex-1 sm:flex-none px-4 py-1.5 text-xs font-medium bg-foreground text-background hover:opacity-90 rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <RefreshCw size={12} />
                    Retry
                  </button>
                </div>
              </div>
            )}

            <AnimatePresence>
              {selectedImage && (
                <motion.div 
                  initial={{ opacity: 0, height: 0, scale: 0.95 }}
                  animate={{ opacity: 1, height: 'auto', scale: 1 }}
                  exit={{ opacity: 0, height: 0, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="px-3 pt-3 pb-2 flex overflow-hidden"
                >
                  <div className="relative group">
                    <img 
                      src={`data:${selectedImage.mimeType};base64,${selectedImage.data}`} 
                      className="w-20 h-20 md:w-24 md:h-24 object-cover rounded-xl border border-border shadow-sm" 
                      alt="Selected"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute -top-2 -right-2 flex gap-1 z-10">
                      <button 
                        type="button"
                        onClick={() => setSelectedImage(null)} 
                        className="bg-foreground text-background rounded-full p-1 shadow-lg hover:scale-110 transition-transform"
                        title="Remove image"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()} 
                      className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl text-white"
                      title="Replace image"
                    >
                      <RefreshCw size={18} />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
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
                className="w-10 h-10 flex items-center justify-center text-muted hover:text-foreground hover:bg-surface-hover rounded-full transition-colors shrink-0"
                title="Attach image"
              >
                <Paperclip size={20} />
              </button>

              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything"
                className="flex-1 bg-transparent border-none outline-none text-foreground placeholder-muted py-0 my-2 px-1 text-[16px] md:text-[15px] font-normal resize-none leading-[24px] break-words"
                rows={1}
                disabled={isLoading}
                style={{ minHeight: '24px', maxHeight: '200px' }}
              />

              <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 h-10">
                {/* Mode Selector */}
                {user && (
                  <div className="relative" ref={modeDropdownRef}>
                    <button 
                      type="button" 
                      onClick={() => setShowModeDropdown(!showModeDropdown)}
                      className="h-9 md:h-10 px-2 md:px-3 flex items-center gap-1 md:gap-1.5 rounded-full text-foreground text-[12px] md:text-[13px] font-medium hover:bg-surface-hover transition-colors"
                    >
                      <span className="hidden sm:inline">{modeLabels[mode]}</span>
                      <span className="sm:hidden">{modeIcons[mode]}</span>
                      <ChevronDown size={14} className="text-muted" />
                    </button>
                    
                    {showModeDropdown && (
                      <div className="absolute bottom-full mb-2 right-0 md:left-0 w-[240px] md:w-64 bg-surface border border-border rounded-xl shadow-xl overflow-hidden z-50 py-1">
                        {(Object.keys(modeLabels) as ChatMode[]).filter(m => m !== 'flash').map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => { setMode(m); setShowModeDropdown(false); }}
                            className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-surface-hover transition-colors relative ${mode === m ? 'bg-surface-hover/50' : ''}`}
                          >
                            <div className={`mt-0.5 ${mode === m ? 'text-foreground' : 'text-muted'}`}>
                              {modeIcons[m]}
                            </div>
                            <div className="flex-1">
                              <div className={`text-sm font-medium ${mode === m ? 'text-foreground' : 'text-muted'}`}>
                                {modeLabels[m]}
                              </div>
                              <div className="text-[11px] text-muted leading-tight mt-0.5">
                                {modeDescriptions[m]}
                              </div>
                            </div>
                            {mode === m && (
                              <div className="text-blue-500 mt-0.5">
                                <Check size={14} />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <AnimatePresence mode="wait">
                                  {isLoading ? (
                                    <motion.button 
                                      key="stop"
                                      initial={{ opacity: 0, scale: 0.8 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      exit={{ opacity: 0, scale: 0.8 }}
                                      transition={{ duration: 0.2 }}
                                      type="button" 
                                      onClick={handleStop}
                                      className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center bg-foreground text-background rounded-full hover:opacity-90 transition-colors shrink-0"
                                      title="Stop responding"
                                    >
                                      <Square size={16} className="md:w-4 md:h-4 fill-current" />
                                    </motion.button>
                                  ) : (
                                    <motion.button 
                                      key="send"
                                      initial={{ opacity: 0, scale: 0.8 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      exit={{ opacity: 0, scale: 0.8 }}
                                      transition={{ duration: 0.2 }}
                                      type="submit" 
                                      disabled={!input.trim() && !selectedImage}
                                      className={`w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-full transition-all shrink-0 ${
                                        (!input.trim() && !selectedImage) 
                                          ? 'bg-muted/20 text-muted cursor-not-allowed' 
                                          : 'bg-foreground text-background hover:opacity-90'
                                      }`}
                                    >
                                      <ArrowUp size={18} className="md:w-5 md:h-5" strokeWidth={2.5} />
                                    </motion.button>
                                  )}
                                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </form>
      </div>
    </div>
  );
}
