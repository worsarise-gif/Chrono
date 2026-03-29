"use client";
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Type, Modality } from '@google/genai';
import { PlanetLogo } from './PlanetLogo';
import { Paperclip, Mic, AudioLines, ChevronDown, ArrowUp, Image as ImageIcon, X, Volume2, Search, Zap, Bot, MoreHorizontal, Upload, SquarePen, RefreshCcw, Copy, Share, ThumbsUp, ThumbsDown, CornerDownRight, Menu, MessageSquare, Check } from 'lucide-react';
import { ResponseFormatter } from './ResponseFormatter';
import { useAuth } from '../contexts/AuthContext';
import { useChatContext } from '../contexts/ChatContext';
import { db, loginWithGoogle } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../utils/firebaseErrorHandler';
import { handleError, ErrorSeverity } from '../utils/errorHandler';

import { Helix } from 'ldrs/react';
import 'ldrs/react/Helix.css';

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  hasImage?: boolean;
  hasAudio?: boolean;
  createdAt?: any;
}

type ChatMode = 'auto' | 'flash' | 'pro' | 'search';

const BYTEZ_API_KEY = process.env.NEXT_PUBLIC_BYTEZ_API_KEY || '62f9e959f3fff48ee9ec96bd091ba1ec';
const GROQ_API_KEY = process.env.NEXT_PUBLIC_GROQ_API_KEY || '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';

const callOpenAIStream = async (url: string, apiKey: string, model: string, msgs: any[], onChunk: (text: string) => void) => {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: msgs,
      stream: true
    })
  });

  if (!response.ok) {
    throw new Error(`API Error ${response.status}: ${await response.text()}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No reader available');
  const decoder = new TextDecoder();
  let done = false;

  while (!done) {
    const { value, done: doneReading } = await reader.read();
    done = doneReading;
    if (value) {
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(line => line.trim() !== '');
      for (const line of lines) {
        if (line.startsWith('data: ') && line !== 'data: [DONE]') {
          try {
            const data = JSON.parse(line.slice(6));
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
};

export default function ChatArea({ onMenuClick }: { onMenuClick?: () => void }) {
  const { user } = useAuth();
  const { currentChatId, setCurrentChatId } = useChatContext();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
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
  const modeDropdownRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, [currentChatId]);

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
      handleError(err, "Error accessing microphone");
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
      handleError(error, "Voice transcription failed");
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
        handleError(error, "Login failed");
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
        setIsLoading(false);
        try {
          handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}/chats`);
        } catch (e) {
          handleError(e, "Failed to create chat session");
        }
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
      setIsLoading(false);
      try {
        handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/chats/${chatId}/messages`);
      } catch (e) {
        handleError(e, "Failed to send message");
      }
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
      // Sliding Window: Only use the last 20 messages to manage token limits
      const recentMessages = messages.slice(-20);
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
           CRITICAL: You MUST use the search_web tool for any relevant queries requiring up-to-date, real-world, or specific factual information. When you use the search_web tool, you MUST cite your sources by appending [link] to the facts you provide.`;

      const config: any = {
        systemInstruction: systemInstruction
      };

      if (tools.length > 0) {
        config.tools = tools;
      }
      
      let modelName = 'gemini-2.5-flash';

      if (mode === 'flash') {
        modelName = 'meta-llama/Meta-Llama-3-8B-Instruct'; // Bytez
      } else if (mode === 'pro') {
        modelName = 'llama3-8b-8192'; // Groq
      } else if (mode === 'auto') {
        // Auto: Determine based on user message complexity
        const lastMessage = contents[contents.length - 1]?.parts?.[0]?.text || '';
        const isComplex = lastMessage.length > 300 || /analyze|explain|code|write|create|compare|summarize/i.test(lastMessage);
        modelName = isComplex ? 'gemini-2.5-pro' : 'gemini-2.5-flash';
      } else {
        // Default for search, etc.
        modelName = 'gemini-2.5-flash';
      }

      const requestParams: any = {
        model: modelName,
        contents: contents,
        config: config
      };

      const openAIMessages = [
        { role: 'system', content: systemInstruction },
        ...messages.map(m => ({
          role: m.role === 'model' ? 'assistant' : 'user',
          content: m.content
        })),
        { role: 'user', content: userMessage }
      ];

      const handleChunk = (text: string) => {
        fullResponse += text;
        setStreamingMessage(fullResponse);
      };

      const runBytez = () => callOpenAIStream('https://api.bytez.com/v1/chat/completions', BYTEZ_API_KEY, 'meta-llama/Meta-Llama-3-8B-Instruct', openAIMessages, handleChunk);
      const runGroq = () => callOpenAIStream('https://api.groq.com/openai/v1/chat/completions', GROQ_API_KEY, 'llama3-8b-8192', openAIMessages, handleChunk);

      // Helper function to execute API call with retry logic and fallback model for 429 errors
      const executeWithRetry = async (params: any, maxRetries = 3) => {
        let retries = 0;
        let currentParams = { ...params };
        while (true) {
          try {
            return await ai.models.generateContentStream(currentParams);
          } catch (error: any) {
            const isQuotaError = error?.message?.toLowerCase().includes('quota') || error?.message?.includes('429') || error?.status === 429;
            if (isQuotaError) {
              if (retries < maxRetries) {
                retries++;
                const delay = Math.pow(2, retries) * 1000 + Math.random() * 1000; // Exponential backoff with jitter
                console.warn(`Rate limit hit. Retrying in ${Math.round(delay/1000)}s... (Attempt ${retries}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
              }
            }
            throw error;
          }
        }
      };

      try {
        if (mode === 'flash') {
          await runBytez();
        } else if (mode === 'pro') {
          await runGroq();
        } else {
          // auto or search
          let streamResponse;
          try {
            streamResponse = await executeWithRetry(requestParams, 3);
          } catch (error: any) {
            if (mode === 'auto') {
              const isQuotaError = error?.message?.toLowerCase().includes('quota') || error?.message?.includes('429') || error?.status === 429;
              if (isQuotaError) {
                console.warn("Gemini quota exceeded. Falling back to Bytez...");
                try {
                  await runBytez();
                  streamResponse = null; // Handled by runBytez
                } catch (bytezError: any) {
                  const isBytezQuotaError = bytezError?.message?.toLowerCase().includes('quota') || bytezError?.message?.includes('429') || bytezError?.message?.includes('402');
                  if (isBytezQuotaError) {
                    console.warn("Bytez quota exceeded. Falling back to Groq...");
                    await runGroq();
                    streamResponse = null; // Handled by runGroq
                  } else {
                    throw bytezError;
                  }
                }
              } else {
                throw error;
              }
            } else {
              throw error;
            }
          }

          if (streamResponse) {
            let searchWebCallArgs: any = null;
            let searchWebCallId: string | null = null;

            for await (const chunk of streamResponse) {
              if (chunk.functionCalls && chunk.functionCalls.length > 0) {
                const call = chunk.functionCalls[0];
                if (call.name === 'search_web') {
                  searchWebCallArgs = call.args;
                  searchWebCallId = call.id || null;
                }
              }
              const text = chunk.text;
              if (text) {
                fullResponse += text;
                setStreamingMessage(fullResponse);
              }
            }

            if (searchWebCallArgs) {
              fullResponse += "\n\n*Searching the web...*\n\n";
              setStreamingMessage(fullResponse);
              
              let searchResults = "Search unavailable. Rely on training data.";
              try {
                const searchRes = await fetch('/api/search', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ query: searchWebCallArgs.query })
                });
                if (searchRes.ok) {
                  const searchData = await searchRes.json();
                  searchResults = searchData.results;
                }
              } catch (err) {
                console.error('Search API call failed:', err);
              }
              
              let parsedResults: any[] = [];
              try {
                parsedResults = typeof searchResults === 'string' ? JSON.parse(searchResults) : searchResults;
              } catch (e) {
                // ignore
              }

              if (Array.isArray(parsedResults) && parsedResults.length > 0) {
                fullResponse = fullResponse.replace("*Searching the web...*\n\n", "");
                
                // Client-side filtering algorithm to clean up irrelevant or messy snippets
                const cleanedResults = parsedResults.map((res: any) => {
                  let snippet = res.snippet || '';
                  
                  // 1. Remove markdown heading markers, bold/italic markers, and URL artifacts
                  snippet = snippet.replace(/[#*`_]/g, '').replace(/\[.*?\]\(.*?\)/g, '').replace(/\[.*?\]/g, '');
                  
                  // 2. Remove repetitive nav/footer phrases and non-content text
                  const stopPhrases = [
                    'free download', 'log in', 'sign up', 'cookie policy', 'privacy policy', 
                    'all rights reserved', 'read more', 'click here', 'edit section', 
                    'other icons related', 'find a variety of', 'explore unique'
                  ];
                  
                  let lines = snippet.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0);
                  
                  lines = lines.filter((line: string) => {
                    const lower = line.toLowerCase();
                    // Filter out lines that are mostly just a stop phrase (e.g. navigation buttons)
                    return !stopPhrases.some(phrase => lower.includes(phrase) && line.length < phrase.length + 20);
                  });
                  
                  // 3. Rejoin and normalize whitespace
                  let cleanedSnippet = lines.join(' ').replace(/\s+/g, ' ').trim();
                  
                  // 4. Truncate to a clean, readable length for the UI cards
                  if (cleanedSnippet.length > 180) {
                    cleanedSnippet = cleanedSnippet.substring(0, 180).trim() + '...';
                  }
                  
                  return { ...res, snippet: cleanedSnippet };
                });

                const searchDataPayload = JSON.stringify({ query: searchWebCallArgs.query, results: cleanedResults });
                fullResponse += `\n\n\`\`\`search-results\n${searchDataPayload}\n\`\`\`\n\n`;
              } else {
                fullResponse = fullResponse.replace("*Searching the web...*\n\n", `### 🔍 Search Results for "${searchWebCallArgs.query}"\n\n*No results found.*\n\n`);
              }
              setStreamingMessage(fullResponse);
            }
          }
        }
      } catch (error: any) {
        handleError(error, "Failed to generate AI response");
        fullResponse = "I'm sorry, I encountered an error while processing your request. Please try again later.";
      }

      try {
        const messageData: any = {
          role: 'model',
          content: fullResponse,
          createdAt: serverTimestamp()
        };

        await addDoc(collection(db, 'users', user.uid, 'chats', chatId, 'messages'), messageData);

        await updateDoc(doc(db, 'users', user.uid, 'chats', chatId), {
          updatedAt: serverTimestamp()
        });
      } catch (error) {
        try {
          handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/chats/${chatId}/messages`);
        } catch (e) {
          handleError(e, "Failed to save AI response");
        }
      } finally {
        setIsLoading(false);
        setStreamingMessage('');
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
    auto: <Zap size={16} />,
    flash: <Zap size={16} className="text-yellow-500" />,
    pro: <Zap size={16} className="text-purple-500" />,
    search: <Search size={16} />
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
        {isLoadingMessages ? (
          <div className="h-full flex flex-col items-center justify-center px-4">
            <Helix size="35" speed="2.5" color="white" />
          </div>
        ) : !isChatStarted ? (
          <div className="h-full flex flex-col items-center justify-center px-4">
            {/* Welcome screen is handled by the input area's positioning */}
          </div>
        ) : (
          <div className="max-w-3xl mx-auto w-full px-4 pt-6 pb-32 space-y-8">
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div 
                  key={msg.id} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} group w-full`}
                >
                  <div className={`${msg.role === 'user' ? 'max-w-[85%] bg-[#1a1a1a] rounded-[24px] px-5 py-3.5 text-white shadow-sm' : 'max-w-[80%] relative bg-transparent text-white text-[15px] w-full'}`}>
                    {msg.role === 'model' ? (
                      <div className="w-full">
                        <ResponseFormatter content={msg.content} />
                        
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
                          ].map((btn: any, i) => (
                            <button 
                              key={i}
                              onClick={btn.onClick}
                              className={`p-1.5 rounded-lg hover:bg-[#1a1a1a] transition-colors ${btn.color || 'hover:text-white'}`} 
                              title={btn.title}
                            >
                              {btn.icon}
                            </button>
                          ))}
                        </div>

                        {/* Suggestions */}
                        <div className="mt-5 space-y-3">
                          <button className="flex items-center gap-3 text-sm font-normal text-gray-200 hover:text-white transition-colors">
                            <CornerDownRight size={16} className="text-gray-500" />
                            Cebu Food Recommendations
                          </button>
                          <button className="flex items-center gap-3 text-sm font-normal text-gray-200 hover:text-white transition-colors">
                            <CornerDownRight size={16} className="text-gray-500" />
                            Cebu Nightlife Spots
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap leading-relaxed break-words">{msg.content}</p>
                    )}
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
                  <div className="max-w-[80%] relative bg-transparent text-white text-[15px] w-full">
                    <div className="w-full">
                      <ResponseFormatter content={streamingMessage} />
                    </div>
                  </div>
                </motion.div>
              )}
              {isLoading && !streamingMessage && (
                <motion.div 
                  key="loading"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="flex justify-start mb-4"
                >
                  <div className="bg-[#1a1a1a]/50 border border-gray-800/50 rounded-2xl px-4 py-3 flex items-center gap-3">
                    <Helix size="20" speed="2.5" color="white" />
                    <span className="text-xs text-gray-500 font-normal ml-1">Q1 is thinking...</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className={`absolute left-0 right-0 p-4 md:p-6 flex flex-col items-center z-20 transition-all duration-500 ${!isChatStarted ? 'top-1/2 -translate-y-1/2' : 'bottom-0'}`}>
        {!isChatStarted && (
          <div className="flex items-center gap-4 mb-8">
            <PlanetLogo className="text-white w-10 h-10 md:w-12 md:h-12" />
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">Q1</h1>
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
                className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-500 py-0 my-2 px-1 text-[15px] font-normal resize-none overflow-y-auto leading-[24px] break-words"
                rows={1}
                disabled={isLoading || isRecording}
                style={{ minHeight: '24px', maxHeight: '200px' }}
              />

              <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                {/* Mode Selector */}
                <div className="relative" ref={modeDropdownRef}>
                  <button 
                    type="button" 
                    onClick={() => setShowModeDropdown(!showModeDropdown)}
                    className="h-10 px-3 flex items-center gap-1.5 rounded-full text-white text-[13px] font-medium hover:bg-[#2a2a2a] transition-colors"
                  >
                    <span className="hidden sm:inline">{modeLabels[mode]}</span>
                    <span className="sm:hidden">{modeIcons[mode]}</span>
                    <ChevronDown size={14} className="text-gray-400" />
                  </button>
                  
                  {showModeDropdown && (
                    <div className="absolute bottom-full mb-2 right-0 w-64 bg-[#1a1a1a] border border-gray-800 rounded-xl shadow-xl overflow-hidden z-50 py-1">
                      {(Object.keys(modeLabels) as ChatMode[]).map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => { setMode(m); setShowModeDropdown(false); }}
                          className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-[#2a2a2a] transition-colors relative ${mode === m ? 'bg-gray-800/50' : ''}`}
                        >
                          <div className={`mt-0.5 ${mode === m ? 'text-white' : 'text-gray-500'}`}>
                            {modeIcons[m]}
                          </div>
                          <div className="flex-1">
                            <div className={`text-sm font-medium ${mode === m ? 'text-white' : 'text-gray-300'}`}>
                              {modeLabels[m]}
                            </div>
                            <div className="text-[11px] text-gray-500 leading-tight mt-0.5">
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
