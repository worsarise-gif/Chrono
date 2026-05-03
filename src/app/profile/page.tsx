"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, Save, Loader2, Check, Edit2, LogOut, ChevronLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { logout, auth, db } from '../../firebase';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import Link from 'next/link';

export default function ProfilePage() {
  const { user } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setDisplayName(user.profile?.displayName || user.displayName || '');
    }
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background text-foreground p-4">
        <Loader2 className="animate-spin text-foreground/50" size={32} />
      </div>
    );
  }

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      setShowLogoutConfirm(false);
      window.location.href = '/';
    } catch (error) {
      console.error("Logout failed:", error);
      setIsLoggingOut(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 6 * 1024 * 1024) {
        setError("Image size must be less than 6MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError(null);
    }
  };

  const handleSave = async () => {
    if (!auth.currentUser) return;

    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      let photoURL = auth.currentUser.photoURL;

      if (fileInputRef.current?.files?.[0]) {
        const file = fileInputRef.current.files[0];
        photoURL = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              const MAX_WIDTH = 250;
              const MAX_HEIGHT = 250;
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
              ctx?.drawImage(img, 0, 0, width, height);
              resolve(canvas.toDataURL('image/jpeg', 0.8));
            };
            img.onerror = () => reject(new Error('Failed to parse image'));
            img.src = e.target?.result as string;
          };
          reader.onerror = () => reject(new Error('Failed to read file'));
          reader.readAsDataURL(file);
        });
      }

      const isBase64 = photoURL?.startsWith('data:image');
      const authUpdates: { displayName: string; photoURL?: string } = {
        displayName: displayName.trim()
      };

      if (!isBase64) {
        authUpdates.photoURL = photoURL || '';
      }

      await updateProfile(auth.currentUser, authUpdates);

      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        displayName: displayName.trim(),
        photoURL: photoURL || null,
        updatedAt: serverTimestamp()
      });

      setSuccess(true);
      setIsEditing(false);
      setPreviewUrl(null);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error("Update profile failed:", err);
      setError(err.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background text-foreground p-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="inline-flex items-center gap-2 text-foreground/60 hover:text-foreground mb-6 transition-colors">
          <ChevronLeft size={20} />
          <span>Back</span>
        </Link>
        <div className="bg-surface border border-border/40 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-8">
            <div className="flex flex-col items-center text-center">
              <div className="relative group mb-6">
                <div className="relative">
                  {previewUrl || user.profile?.photoURL || user.photoURL ? (
                    <img
                      src={previewUrl || user.profile?.photoURL || user.photoURL || ''}
                      alt={user.profile?.displayName || user.displayName || "User"}
                      className="w-24 h-24 rounded-full object-cover border border-border/50"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full flex items-center justify-center border border-border/50 text-foreground font-medium text-3xl bg-surface">
                      {(user.profile?.displayName || user.displayName)?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'J'}
                    </div>
                  )}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 p-2 bg-background text-foreground rounded-full border border-border shadow-sm hover:bg-surface-hover transition-colors"
                  >
                    <Camera size={14} />
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              </div>

              <div className="w-full space-y-2 mb-8">
                {isEditing ? (
                  <div className="flex items-center justify-center gap-2">
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full max-w-[220px] bg-background border border-border/50 rounded-lg px-4 py-2 text-center text-foreground text-sm focus:outline-none focus:border-foreground/30 transition-colors"
                      placeholder="Display name"
                      autoFocus
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2 group/name">
                    <h2 className="text-xl font-medium text-foreground">
                      {user.profile?.displayName || user.displayName || "Anonymous User"}
                    </h2>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="md:opacity-0 md:group-hover/name:opacity-100 opacity-100 text-foreground/40 hover:text-foreground transition-opacity"
                    >
                      <Edit2 size={14} />
                    </button>
                  </div>
                )}
                <p className="text-sm text-foreground/50">{user.email}</p>

                {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
                {success && (
                  <p className="text-sm text-green-500 mt-2 flex items-center justify-center gap-1">
                    <Check size={14} /> Saved
                  </p>
                )}
              </div>

              <div className="w-full flex flex-col gap-3">
                {(isEditing || previewUrl) && (
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-foreground text-background hover:opacity-90 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    Save Changes
                  </button>
                )}

                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 text-red-500/80 hover:text-red-500 hover:bg-red-500/10 rounded-xl text-sm font-medium transition-colors"
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogoutConfirm(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative bg-surface border border-border/40 w-full max-w-[320px] rounded-2xl p-6 shadow-xl"
            >
              <div className="flex flex-col text-center space-y-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-medium text-foreground">Sign Out</h3>
                  <p className="text-sm text-foreground/60">
                    Are you sure you want to sign out?
                  </p>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setShowLogoutConfirm(false)}
                    disabled={isLoggingOut}
                    className="flex-1 py-2 px-4 bg-background hover:bg-surface-hover text-foreground rounded-lg text-sm font-medium transition-colors border border-border/50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {isLoggingOut ? <Loader2 size={16} className="animate-spin" /> : null}
                    {isLoggingOut ? 'Signing out...' : 'Sign Out'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
