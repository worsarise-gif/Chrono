"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, loginWithGoogle } from '../firebase';
import { collection, query, orderBy, onSnapshot, getDocs, doc, getDoc, setDoc, addDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { Download, Image as ImageIcon, Loader2, Menu, Info, X } from 'lucide-react';
import Link from 'next/link';
import { PlanetLogo } from './PlanetLogo';

interface GeneratedImage {
  id: string;
  prompt: string;
  imageData: string;
  createdAt: any;
}

export default function ImagineGallery({ onMenuClick }: { onMenuClick?: () => void }) {
  const { user } = useAuth();
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [isMigrating, setIsMigrating] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  // Migration logic to pull old images from chat messages
  useEffect(() => {
    if (!user) return;

    const migrateOldImages = async () => {
      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        // If we've already migrated, don't do it again
        if (userSnap.data()?.hasMigratedImagesV2) {
          return;
        }

        setIsMigrating(true);
        const chatsSnapshot = await getDocs(collection(db, 'users', user.uid, 'chats'));
        
        for (const chatDoc of chatsSnapshot.docs) {
          const messagesSnapshot = await getDocs(collection(db, 'users', user.uid, 'chats', chatDoc.id, 'messages'));
          
          for (const msgDoc of messagesSnapshot.docs) {
            const data = msgDoc.data();
            
            // Check for user uploaded images
            if (data.imageUrl) {
              await addDoc(collection(db, 'users', user.uid, 'generated_images'), {
                prompt: data.content || 'Uploaded Image',
                imageData: data.imageUrl,
                createdAt: data.createdAt || new Date(),
                isUploaded: true
              });
            }
            
            // Check if it's a model message containing an image markdown
            if (data.role === 'model' && data.content && data.content.includes('![')) {
              // Extract prompt and base64 data or URL
              const imgRegex = /!\[(.*?)\]\((.*?)\)/g;
              let match;
              while ((match = imgRegex.exec(data.content)) !== null) {
                const prompt = match[1] || 'Generated Image';
                const imageData = match[2];
                
                // Add to generated_images collection
                await addDoc(collection(db, 'users', user.uid, 'generated_images'), {
                  prompt,
                  imageData,
                  createdAt: data.createdAt || new Date()
                });
              }
            }
          }
        }

        // Mark migration as complete
        await setDoc(userRef, { hasMigratedImagesV2: true }, { merge: true });
        setIsMigrating(false);
      } catch (error) {
        console.error("Failed to migrate old images:", error);
        setIsMigrating(false);
      }
    };

    migrateOldImages();
  }, [user]);

  useEffect(() => {
    if (!user) {
      setImages([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const q = query(
      collection(db, 'users', user.uid, 'generated_images'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const imgData: GeneratedImage[] = [];
      snapshot.forEach((doc) => {
        imgData.push({ id: doc.id, ...doc.data({ serverTimestamps: 'estimate' }) } as GeneratedImage);
      });
      setImages(imgData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching images:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleDownload = (img: GeneratedImage) => {
    // Convert to PNG before downloading to ensure format consistency
    const image = new window.Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0);
        const pngDataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = pngDataUrl;
        link.download = `generated-${img.id}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    };
    image.src = img.imageData;
  };

  return (
    <div className="flex flex-row h-full w-full relative">
      {/* Mobile Top Scrim restricted to ImagineGallery */}
      <div className="absolute top-0 left-0 right-0 h-[calc(6rem+env(safe-area-inset-top))] bg-gradient-to-b from-chat-bg via-chat-bg/80 to-transparent z-[39] pointer-events-none md:hidden" />

      <div className="flex-1 flex flex-col h-full bg-transparent relative overflow-hidden font-sans">
        {/* Sticky Floating Actions */}
        <div className="sticky top-0 left-0 right-0 z-50 flex justify-between items-center p-4 pt-safe pointer-events-none shrink-0">
          {!user ? (
            <div className="flex items-center gap-2 pointer-events-auto">
              <Link href="/">
                <PlanetLogo className="text-foreground/60 hover:text-foreground transition-all" />
              </Link>
            </div>
          ) : (
            <button
              onClick={onMenuClick}
              className="p-2 bg-surface/80 backdrop-blur-md border border-border/50 hover:bg-surface-hover rounded-full text-foreground/60 hover:text-foreground md:hidden pointer-events-auto transition-all shadow-lg"
            >
              <Menu size={18} />
            </button>
          )}
          <div className="flex-1" />
          {!user && (
            <button
              onClick={loginWithGoogle}
              className="px-4 py-2 bg-foreground text-background hover:opacity-90 rounded-full font-medium pointer-events-auto transition-all shadow-lg text-sm"
            >
              Sign In
            </button>
          )}
        </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 scroll-smooth relative">
        <div className="max-w-7xl mx-auto">
          {isLoading || isMigrating ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="aspect-square rounded-xl bg-surface border border-border relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer-skeleton_2s_infinite]" />
                </div>
              ))}
            </div>
          ) : images.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted">
              <ImageIcon className="w-12 h-12 mb-4 opacity-50" />
              <p className="text-lg font-medium text-foreground mb-2">No images yet</p>
              <p className="text-sm text-center max-w-md">
                Images you generate in the chat will automatically appear here. Try asking the AI to "generate an image of a futuristic city".
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              <AnimatePresence>
                {images.map((img) => (
                  <motion.div
                    key={img.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    className="group relative aspect-square rounded-xl overflow-hidden bg-surface border border-border hover:border-[#5c6ad2]/50 transition-colors cursor-pointer shadow-sm hover:shadow-md"
                    onClick={() => {
                      setSelectedImage(img);
                      setShowPrompt(false);
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.imageData}
                      alt={img.prompt}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-3">
                      <div className="flex justify-end translate-y-[-10px] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(img);
                          }}
                          className="flex items-center justify-center p-2 bg-black/40 hover:bg-black/60 backdrop-blur-md text-white rounded-full transition-colors"
                          title="Download"
                          aria-label="Download"
                        >
                          <Download size={16} />
                        </button>
                      </div>
                      <div className="translate-y-[10px] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 delay-75">
                        <p className="text-white text-sm line-clamp-3 font-medium drop-shadow-md">
                          {img.prompt}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 md:p-8"
            onClick={() => {
              setSelectedImage(null);
              setShowPrompt(false);
            }}
          >
            {/* Top Right Controls Container */}
            <div className="absolute top-4 right-4 md:top-6 md:right-6 flex items-center gap-3 z-[210]">
              <button
                onClick={() => handleDownload(selectedImage)}
                className="group relative p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all duration-300 shadow-lg border border-white/10 hover:border-white/20 flex items-center justify-center"
                aria-label="Download Image"
              >
                <Download size={20} />
                {/* Tooltip */}
                <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap backdrop-blur-md border border-white/10">
                  Download
                </div>
              </button>

              {/* Global Close Button */}
              <button
                onClick={() => {
                  setSelectedImage(null);
                  setShowPrompt(false);
                }}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-colors"
                aria-label="Close"
              >
                <X size={24} />
              </button>
            </div>

            <div className="relative max-w-5xl w-full flex justify-center items-center h-full max-h-[90vh]">
              <div className="relative inline-flex max-w-full max-h-full" onClick={(e) => e.stopPropagation()}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedImage.imageData}
                  alt={selectedImage.prompt}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                />

                {/* Glassmorphic Prompt Overlay */}
                <AnimatePresence>
                  {showPrompt && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 p-4 sm:p-6 bg-black/60 backdrop-blur-xl border border-white/10 rounded-xl sm:rounded-2xl shadow-2xl"
                    >
                      <p className="text-white text-sm sm:text-base leading-relaxed font-medium drop-shadow-md">
                        {selectedImage.prompt}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}
