"use client";
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Type, Modality } from '@google/genai';
import { PlanetLogo } from './PlanetLogo';
import { Paperclip, Mic, AudioLines, ChevronDown, ArrowUp, Image as ImageIcon, X, Volume2, Search, Zap, Bot, MoreHorizontal, Upload, SquarePen, RefreshCcw, RefreshCw, AlertCircle, Copy, Share, ThumbsUp, ThumbsDown, CornerDownRight, Menu, MessageSquare, Check, Cpu, Sparkles, Globe, Square } from 'lucide-react';
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
    })
  });

  if (!response.ok) {
    throw new Error(`API Error ${response.status}: ${await response.text()}`);
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

const callCloudflareStream = async (model: string, messages: any[], onChunk: (text: string) => void) => {
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
    })
  });

  if (!res.ok) throw new Error(`Cloudflare Error: ${await res.text()}`);

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

const callGroqChatNonStream = async (model: string, messages: any[], fallbackModel?: string) => {
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
      })
    });
    if (!res.ok) throw new Error(`Groq Error: ${await res.text()}`);
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
  const [mode, setMode] = useState<ChatMode>('auto');
  const [showModeDropdown, setShowModeDropdown] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ data: string, mimeType: string } | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [streamingMessage, setStreamingMessage] = useState<string>('');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [lastError, setLastError] = useState<{ message: string, retryParams?: any } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const isTranscribingRef = useRef(false);
  const transcriptionVersionRef = useRef(0);
  const initialInputRef = useRef("");
  const modeDropdownRef = useRef<HTMLDivElement>(null);

  const retryLastMessage = async () => {
    if (!lastError || !lastError.retryParams) return;
    const params = lastError.retryParams;
    setLastError(null);
    await handleSubmit(undefined, params.text, params.image);
  };

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

  const transcribeCurrentBuffer = async (isFinal = false) => {
    if (isTranscribingRef.current && !isFinal) return; // Prevent overlapping requests
    if (audioChunksRef.current.length === 0) return;

    isTranscribingRef.current = true;
    const currentVersion = ++transcriptionVersionRef.current;
    
    try {
      // Create a Blob from all chunks collected so far
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/wav';
      const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
      
      // Call Groq Whisper API
      const transcription = await callGroqTranscription(audioBlob, 'whisper-large-v3', 'whisper-large-v3-turbo');
      
      if (transcription && currentVersion === transcriptionVersionRef.current) {
        // Append the new transcription to the initial input
        const base = initialInputRef.current;
        setInput(base ? `${base} ${transcription.trim()}` : transcription.trim());
      }
    } catch (error) {
      console.error("Real-time transcription error:", error);
      // We don't throw here to allow the next chunk to try again seamlessly
    } finally {
      if (currentVersion === transcriptionVersionRef.current) {
        isTranscribingRef.current = false;
      }
    }
  };

  const startRecording = async () => {
    try {
      // Advanced audio preprocessing for clarity
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });
      
      const options = MediaRecorder.isTypeSupported('audio/webm') ? { mimeType: 'audio/webm' } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      transcriptionVersionRef.current = 0;
      initialInputRef.current = input; // Store current input to append to

      mediaRecorder.ondataavailable = async (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
          // Trigger real-time transcription on every chunk
          await transcribeCurrentBuffer();
        }
      };

      mediaRecorder.onstop = async () => {
        setIsLoading(true);
        // Final transcription pass to catch the last bit of audio
        await transcribeCurrentBuffer(true);
        stream.getTracks().forEach(track => track.stop());
        setIsLoading(false);
        setIsRecording(false);
      };

      // Start recording and emit data every 1000ms (1 second) for near-instant processing
      mediaRecorder.start(1000);
      setIsRecording(true);
    } catch (err) {
      handleError(err, "Error accessing microphone");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      // setIsRecording(false) is handled in onstop
    }
  };

  const generateSmartTitle = async (chatId: string, initialMessage: string) => {
    if (!user) return;
    try {
      const prompt = `You are an intelligent assistant tasked with generating a **single, concise, and memorable chat title (5–8 words)** for this project.

Rules:
1. Generate the title **only once per session**. If a title has already been generated for this session, respond exactly: "Title already generated. Cannot create a new one."
2. Focus on the **main topic, key ideas, or recurring themes** in the conversation.
3. Avoid generic words like "chat", "discussion", or "conversation".
4. If no clear topic is present, fallback to: "Chat on [Date]".
5. Make the title **unique, context-aware, and easy to remember**.

Conversation:
"${initialMessage}"

Session Title Status: "false"`;

      const generatedTitle = await callGroqChatNonStream('qwen/qwen3-32b', [{ role: 'user', content: prompt }]);
      
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

  const handleSubmit = async (e?: React.FormEvent, text?: string, image?: { data: string, mimeType: string }) => {
    if (e) e.preventDefault();
    setLastError(null);
    if (!user) {
      try {
        await loginWithGoogle();
      } catch (error) {
        handleError(error, "Login failed");
      }
      return;
    }
    
    const userMessage = text || input.trim();
    const currentImage = image || selectedImage;
    
    if ((!userMessage && !currentImage) || isLoading) return;

    if (!text) setInput('');
    if (!image) setSelectedImage(null);
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
        
        // Generate smart title asynchronously
        generateSmartTitle(chatId, userMessage);
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

    const isImageRequest = /^(?:please\s+)?(?:can you\s+)?(?:generate|draw|create|make|paint)\s+(?:an?\s+)?(?:image|picture|photo|drawing|art|illustration|portrait)/i.test(userMessage.trim());

    if (isImageRequest && !currentImage) {
      setIsGeneratingImage(true);
      
      let finalImageResponse = '';
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
          
          finalImageResponse = `Here is your generated image:\n\n![${userMessage}](${compressedBase64})`;
        }
      } catch (err) {
        console.error("Image generation error:", err);
        finalImageResponse = "I'm sorry, I encountered a network error while generating the image.";
      }

      try {
        await addDoc(collection(db, 'users', user.uid, 'chats', chatId, 'messages'), {
          role: 'model',
          content: finalImageResponse,
          createdAt: serverTimestamp()
        });
        await updateDoc(doc(db, 'users', user.uid, 'chats', chatId), {
          updatedAt: serverTimestamp()
        });
      } catch (error) {
        console.error("Failed to save image response", error);
        try {
          handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/chats/${chatId}/messages`);
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
          const summary = await callGroqChatNonStream('llama-3.3-70b-versatile', [{ role: 'user', content: summaryPrompt }], 'llama-3.1-8b-instant');
          contextText = `[Summary of older conversation: ${summary}]\n\n`;
        } catch (e) {
          console.error("Summarization failed", e);
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
           CRITICAL: You MUST use the search_web tool for any relevant queries requiring up-to-date, real-world, or specific factual information. When you use the search_web tool, you MUST cite your sources by appending [link] to the facts you provide.`;

      const config: any = {
        systemInstruction: systemInstruction
      };

      if (tools.length > 0) {
        config.tools = tools;
      }
      
      let modelName = 'gemini-3-flash-preview';
      let bytezModel = 'openai/gpt-4o';
      let groqModel = 'llama-3.1-8b-instant';
      let cloudflareModel = '';
      
      const lastMessage = contents[contents.length - 1]?.parts?.[0]?.text || '';
      let classification = 'simple';

      if (mode === 'auto') {
        try {
          const classifierPrompt = `Analyze the following user request and classify its intent and complexity.
Categories:
- 'simple': General questions, quick facts, casual conversation.
- 'complex': Analytical tasks, creative writing, deep reasoning, complex logic.
- 'code': Programming, debugging, software architecture, scripting.

User Request: "${lastMessage}"

Return ONLY the category name (simple, complex, or code) in lowercase, with no other text.`;
          
          const result = await callGroqChatNonStream('llama-3.1-8b-instant', [{ role: 'user', content: classifierPrompt }], 'llama-3.3-70b-versatile');
          const cleanResult = result.toLowerCase().trim();
          if (cleanResult.includes('code')) classification = 'code';
          else if (cleanResult.includes('complex')) classification = 'complex';
          else classification = 'simple';
          
          console.log(`Auto Mode Classification: ${classification}`);
        } catch (e) {
          console.error("Classification failed, defaulting to simple", e);
          classification = lastMessage.length > 300 || /analyze|explain|code|write|create|compare|summarize/i.test(lastMessage) ? 'complex' : 'simple';
        }
      }

      let dynamicSystemInstruction = systemInstruction;

      if (mode === 'flash') {
        modelName = 'gemini-3-flash-preview';
        bytezModel = 'openai/gpt-4o';
        groqModel = 'llama-3.1-8b-instant';
      } else if (mode === 'pro') {
        modelName = 'gemini-3.1-pro-preview';
        bytezModel = 'openai/gpt-4-turbo';
        groqModel = 'llama-3.3-70b-versatile';
        cloudflareModel = '@cf/nvidia/nemotron-3-120b-a12b';
      } else if (mode === 'auto') {
        if (classification === 'code') {
          modelName = 'gemini-3.1-pro-preview';
          bytezModel = 'openai/gpt-4-turbo';
          groqModel = 'llama-3.3-70b-versatile';
          cloudflareModel = '@cf/nvidia/nemotron-3-120b-a12b';
          dynamicSystemInstruction += `\n\n[CODE NORMALIZATION LAYER ACTIVE]\nYou are an expert software engineer. Provide clean, efficient, and well-documented code.\n- ALWAYS wrap code snippets in standard Markdown triple-backtick blocks with the correct language identifier.\n- Ensure proper indentation.\n- Do not use HTML tags for code.\n- Structure your response with clear headings and explanations.\n- Avoid incomplete code blocks.`;
        } else if (classification === 'complex') {
          modelName = 'gemini-3.1-pro-preview';
          bytezModel = 'openai/gpt-4-turbo';
          groqModel = 'llama-3.3-70b-versatile';
          cloudflareModel = '@cf/nvidia/nemotron-3-120b-a12b';
          dynamicSystemInstruction += `\n\n[COMPLEXITY LAYER ACTIVE]\nProvide a thorough, well-structured, and deeply reasoned response. Break down complex topics into digestible parts.`;
        } else {
          modelName = 'gemini-3-flash-preview';
          bytezModel = 'openai/gpt-4o';
          groqModel = 'llama-3.1-8b-instant';
        }
      } else {
        modelName = 'gemini-3-flash-preview';
      }

      config.systemInstruction = dynamicSystemInstruction;

      const requestParams: any = {
        model: modelName,
        contents: contents,
        config: config
      };

      const openAIMessages = [
        { role: 'system', content: dynamicSystemInstruction },
        ...(contextText ? [{ role: 'system', content: contextText }] : []),
        ...recentMessages.map(m => ({
          role: m.role === 'model' ? 'assistant' : 'user',
          content: m.content || (m.hasImage ? "[Image uploaded]" : " ")
        })),
        { role: 'user', content: userMessage || (currentImage ? "[Image uploaded]" : " ") }
      ];

      const handleChunk = (text: string) => {
        fullResponse += text;
        setStreamingMessage(fullResponse);
      };

      const runBytez = () => callOpenAIStream('https://api.bytez.com/v1/chat/completions', BYTEZ_API_KEY, bytezModel, openAIMessages, handleChunk);
      const runGroq = () => callOpenAIStream('https://api.groq.com/openai/v1/chat/completions', GROQ_API_KEY, groqModel, openAIMessages, handleChunk);
      const runCloudflare = () => callCloudflareStream(cloudflareModel, openAIMessages, handleChunk);

      // Helper function to execute API call with retry logic and fallback model for 429/503 errors
      const executeWithRetry = async (fn: () => Promise<any>, maxRetries = 3) => {
        let retries = 0;
        while (true) {
          try {
            return await fn();
          } catch (error: any) {
            const isQuotaError = error?.message?.toLowerCase().includes('quota') || 
                               error?.message?.includes('429') || 
                               error?.status === 429 ||
                               error?.message?.includes('402');
            const isUnavailableError = error?.message?.includes('503') || 
                                     error?.status === 503 || 
                                     error?.message?.toLowerCase().includes('unavailable');
            
            if ((isQuotaError || isUnavailableError) && retries < maxRetries) {
              retries++;
              const delay = Math.pow(2, retries) * 1000 + Math.random() * 1000;
              console.warn(`${isQuotaError ? 'Rate limit' : 'Service unavailable'} hit. Retrying in ${Math.round(delay/1000)}s... (Attempt ${retries}/${maxRetries})`);
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            }
            throw error;
          }
        }
      };

      try {
        let streamResponse;
        try {
          streamResponse = await executeWithRetry(() => ai.models.generateContentStream(requestParams), 2);
        } catch (error: any) {
          console.warn("Gemini failed. Falling back to Bytez...", error);
          try {
            await executeWithRetry(runBytez, 1);
            streamResponse = null;
          } catch (bytezError: any) {
            console.warn("Bytez failed. Falling back to Groq...", bytezError);
            try {
              await executeWithRetry(runGroq, 1);
              streamResponse = null;
            } catch (groqError: any) {
              console.error("Groq failed.", groqError);
              if (cloudflareModel) {
                console.warn("Falling back to Cloudflare...", groqError);
                try {
                  await executeWithRetry(runCloudflare, 1);
                  streamResponse = null;
                } catch (cfError: any) {
                  console.error("Cloudflare failed as well.", cfError);
                  throw error; // Throw original error
                }
              } else {
                throw error; // Throw the original Gemini error
              }
            }
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
              setIsSearching(true);
              
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
                const rawSearchText = JSON.stringify(parsedResults.slice(0, 5));
                const formatPrompt = `Organize, clean, and structure the following search results for readable, well-formatted output. Keep the essential facts and links. Return ONLY the formatted markdown.\n\nSearch Results:\n${rawSearchText}`;
                
                let formattedSearch = "";
                try {
                  formattedSearch = await callGroqChatNonStream('qwen/qwen3-32b', [{ role: 'user', content: formatPrompt }]);
                } catch (e) {
                  console.error("Search formatting failed", e);
                  formattedSearch = rawSearchText;
                }

                fullResponse += `\n\n### 🔍 Search Results for "${searchWebCallArgs.query}"\n\n${formattedSearch}\n\n`;
              } else {
                fullResponse += `\n\n### 🔍 Search Results for "${searchWebCallArgs.query}"\n\n*No results found.*\n\n`;
              }
              setIsSearching(false);
              setStreamingMessage(fullResponse);
            }
          }
      } catch (error: any) {
        handleError(error, "Failed to generate AI response");
        setLastError({ 
          message: error.message || "Something went wrong. Please try again.",
          retryParams: { text: userMessage, image: currentImage }
        });
        fullResponse = `Error: ${error.message || "I'm sorry, I encountered an error while processing your request. Please try again later."}`;
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
        setIsSearching(false);
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
    <div className="flex-1 flex flex-col h-full bg-background relative overflow-hidden font-sans">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto scroll-smooth relative flex flex-col">
        {/* Sticky Floating Actions */}
        <div className="sticky top-0 left-0 right-0 z-50 flex justify-between items-center p-4 pointer-events-none shrink-0">
          <button 
            onClick={onMenuClick}
            className="p-3 bg-surface/80 backdrop-blur-md border border-border/50 hover:bg-surface-hover rounded-full text-muted hover:text-foreground md:hidden pointer-events-auto transition-all shadow-lg"
          >
            <Menu size={20} />
          </button>
          <div className="flex-1" />
          <button 
            onClick={() => setCurrentChatId(null)}
            className="p-3 bg-surface/80 backdrop-blur-md border border-border/50 hover:bg-surface-hover rounded-full text-muted hover:text-foreground pointer-events-auto transition-all shadow-lg ml-auto group"
            title="New Chat"
          >
            <SquarePen size={20} className="group-hover:scale-110 transition-transform" />
          </button>
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
              {messages.map((msg) => (
                <motion.div 
                  key={msg.id} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} group w-full`}
                >
                  <div className={`${msg.role === 'user' ? 'max-w-[90%] md:max-w-[85%] bg-surface rounded-[24px] px-4 py-3 md:px-5 md:py-3.5 text-foreground shadow-sm text-[15px] md:text-[15px]' : 'max-w-[95%] md:max-w-[80%] relative bg-transparent text-foreground text-[16px] md:text-[15px] w-full'}`}>
                    {msg.role === 'model' ? (
                      <div className="w-full">
                        {msg.content.startsWith('Error:') ? (
                          <div className="p-4 bg-surface-hover border border-border rounded-xl text-muted flex items-start gap-3 mb-2">
                            <AlertCircle size={18} className="mt-0.5 shrink-0" />
                            <div className="text-sm font-medium leading-relaxed">
                              {msg.content.replace('Error:', '').trim()}
                            </div>
                          </div>
                        ) : (
                          <ResponseFormatter content={msg.content} />
                        )}
                        
                        {/* Action Row */}
                        <div className="flex flex-wrap items-center gap-1 mt-4 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity text-muted">
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
                              className={`p-1.5 rounded-lg hover:bg-surface-hover transition-colors ${btn.color || 'hover:text-foreground'}`} 
                              title={btn.title}
                            >
                              {btn.icon}
                            </button>
                          ))}
                        </div>

                        {/* Suggestions */}
                        <div className="mt-5 space-y-3">
                          <button className="flex items-center gap-3 text-sm font-normal text-muted hover:text-foreground transition-colors">
                            <CornerDownRight size={16} className="text-muted" />
                            Cebu Food Recommendations
                          </button>
                          <button className="flex items-center gap-3 text-sm font-normal text-muted hover:text-foreground transition-colors">
                            <CornerDownRight size={16} className="text-muted" />
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
                  <div className="max-w-[95%] md:max-w-[80%] relative bg-transparent text-foreground text-[16px] md:text-[15px] w-full">
                    <div className="w-full">
                      <ResponseFormatter content={streamingMessage} isStreaming={true} />
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
                  <div className="flex items-center gap-2">
                    <Search size={14} className="text-muted animate-pulse" />
                    <span className="text-[13px] font-medium font-[family-name:var(--font-roboto)] glowing-text">
                      Searching the web...
                    </span>
                  </div>
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
                  <div className="w-full max-w-lg rounded-2xl overflow-hidden relative aspect-square">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full" style={{ animation: 'shimmer-skeleton 2s infinite' }} />
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-muted">
                      <motion.div
                        animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <div className="w-12 h-12 rounded-full border-2 border-dashed border-muted/50 flex items-center justify-center">
                          <span className="text-xl">✨</span>
                        </div>
                      </motion.div>
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-sm font-medium">Generating your image...</span>
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
                  <div className="max-w-[95%] md:max-w-[80%] relative bg-transparent py-4 px-1 w-full">
                    <motion.div
                      animate={{ 
                        opacity: [0.3, 0.6, 0.3],
                        width: [40, 70, 40],
                      }}
                      transition={{ 
                        duration: 1.8, 
                        repeat: Infinity, 
                        ease: "easeInOut" 
                      }}
                      className="h-[2px] bg-gradient-to-r from-transparent via-muted to-transparent rounded-full"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className={`absolute left-0 right-0 p-3 md:p-6 flex flex-col items-center z-20 transition-all duration-500 ${!isChatStarted ? 'top-1/2 -translate-y-1/2' : 'bottom-0 pb-safe'}`}>
        {!isChatStarted && (
          <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
            <PlanetLogo className="text-foreground w-10 h-10 md:w-12 md:h-12" />
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-foreground">Q1</h1>
          </div>
        )}
        <form onSubmit={handleSubmit} className="w-full max-w-3xl relative">
          <div className="relative bg-surface rounded-[24px] md:rounded-[28px] transition-all shadow-2xl border border-border/50 focus-within:border-border flex flex-col p-1.5 md:p-2">
            {lastError && (
              <div className="mb-4 p-4 bg-surface-hover border border-border rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted/20 flex items-center justify-center text-muted shrink-0">
                    <AlertCircle size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Generation Failed</p>
                    <p className="text-xs text-muted leading-tight mt-0.5">{lastError.message}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button 
                    onClick={() => setLastError(null)}
                    className="flex-1 sm:flex-none px-3 py-1.5 text-xs font-medium text-muted hover:text-foreground hover:bg-surface-hover rounded-lg transition-colors"
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

            {selectedImage && (
              <div className="px-2 pt-2 pb-1 flex overflow-hidden">
                <div className="relative group">
                  <img 
                    src={`data:${selectedImage.mimeType};base64,${selectedImage.data}`} 
                    className="w-16 h-16 object-cover rounded-xl border border-border shadow-lg" 
                    alt="Selected"
                    referrerPolicy="no-referrer"
                  />
                  <button 
                    type="button"
                    onClick={() => setSelectedImage(null)} 
                    className="absolute -top-2 -right-2 bg-background border border-border rounded-full p-1 text-muted hover:text-foreground shadow-xl transition-colors z-10"
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
                placeholder={isRecording ? "Listening..." : "Ask anything"}
                className="flex-1 bg-transparent border-none outline-none text-foreground placeholder-muted py-0 my-2 px-1 text-[16px] md:text-[15px] font-normal resize-none overflow-y-auto leading-[24px] break-words"
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
                    className="h-9 md:h-10 px-2 md:px-3 flex items-center gap-1 md:gap-1.5 rounded-full text-foreground text-[12px] md:text-[13px] font-medium hover:bg-surface-hover transition-colors"
                  >
                    <span className="hidden sm:inline">{modeLabels[mode]}</span>
                    <span className="sm:hidden">{modeIcons[mode]}</span>
                    <ChevronDown size={14} className="text-muted" />
                  </button>
                  
                  {showModeDropdown && (
                    <div className="absolute bottom-full mb-2 right-0 md:left-0 w-[240px] md:w-64 bg-surface border border-border rounded-xl shadow-xl overflow-hidden z-50 py-1">
                      {(Object.keys(modeLabels) as ChatMode[]).map((m) => (
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

                <button 
                  type="button" 
                  onClick={() => isRecording ? stopRecording() : startRecording()}
                  className={`w-9 h-9 md:w-10 md:h-10 flex items-center justify-center transition-colors rounded-full shrink-0 ${isRecording ? 'text-red-500 bg-red-500/10 hover:bg-red-500/20' : 'text-muted hover:text-foreground hover:bg-surface-hover'}`}
                  title={isRecording ? "Stop dictating" : "Click to dictate"}
                >
                  {isRecording ? (
                    <Square size={16} className="md:w-4 md:h-4 fill-current animate-pulse" />
                  ) : (
                    <Mic size={18} className="md:w-5 md:h-5" />
                  )}
                </button>
                
                <button 
                  type="submit" 
                  disabled={(!input.trim() && !selectedImage) || isLoading} 
                  className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center bg-foreground text-background rounded-full hover:opacity-90 transition-colors disabled:opacity-50 shrink-0"
                >
                  {input.trim() || selectedImage ? <ArrowUp size={18} className="md:w-5 md:h-5" strokeWidth={2.5} /> : <AudioLines size={18} className="md:w-5 md:h-5" strokeWidth={2.5} />}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
