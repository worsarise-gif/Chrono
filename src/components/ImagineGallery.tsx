"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, getDocs, doc, getDoc, setDoc, addDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { Download, Image as ImageIcon, Loader2 } from 'lucide-react';

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
    <div className="flex-1 flex flex-col h-[100dvh] relative bg-background/50 backdrop-blur-3xl">
      {/* Header */}
      <header className="h-[60px] flex items-center justify-between px-4 border-b border-border bg-background/80 backdrop-blur-md z-10 shrink-0">
        <div className="flex items-center gap-3">
          <button 
            onClick={onMenuClick}
            className="md:hidden p-2 -ml-2 text-muted hover:text-foreground rounded-lg hover:bg-surface transition-colors"
          >
            <ImageIcon size={20} />
          </button>
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-[#5c6ad2]" />
            <h1 className="font-medium text-foreground">Imagine Gallery</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
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
                    onClick={() => setSelectedImage(img)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.imageData}
                      alt={img.prompt}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                      <p className="text-white text-sm line-clamp-2 mb-3 font-medium">
                        {img.prompt}
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(img);
                        }}
                        className="flex items-center justify-center gap-2 w-full py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white rounded-lg transition-colors text-sm font-medium"
                      >
                        <Download size={16} />
                        Download
                      </button>
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
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 md:p-8"
            onClick={() => setSelectedImage(null)}
          >
            <div className="relative max-w-5xl w-full max-h-full flex flex-col items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedImage.imageData}
                alt={selectedImage.prompt}
                className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              />
              <div 
                className="mt-6 bg-surface/80 backdrop-blur-md border border-border p-4 rounded-xl max-w-2xl w-full text-center"
                onClick={(e) => e.stopPropagation()}
              >
                <p className="text-foreground font-medium mb-4">{selectedImage.prompt}</p>
                <button
                  onClick={() => handleDownload(selectedImage)}
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#5c6ad2] hover:bg-[#4b56b2] text-white rounded-lg transition-colors font-medium"
                >
                  <Download size={18} />
                  Download High-Res
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
