"use client";
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, LogOut, Mail, Calendar, Shield, User as UserIcon, Camera, Save, Loader2, Sun, Moon, Monitor, Check, Edit2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { logout, auth, storage, db } from '../firebase';
import { updateProfile } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useTheme } from 'next-themes';
import { handleFirestoreError, OperationType } from '../utils/firebaseErrorHandler';
import { handleError } from '../utils/errorHandler';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  const [displayName, setDisplayName] = useState(user?.profile?.displayName || user?.displayName || '');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    if (user) {
      setDisplayName(user.profile?.displayName || user.displayName || '');
    }
  }, [user]);

  if (!user) return null;

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      setShowLogoutConfirm(false);
      onClose();
      // Force a full page reload and redirect to home to clear all states immediately
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

      // Local image compression to avoid hanging storage upload permissions
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

      // Only update Firebase Auth photoURL if it's not a base64 string
      // Firebase Auth has a strict length limit (~2048 chars) for photoURL
      const isBase64 = photoURL?.startsWith('data:image');
      const authUpdates: { displayName: string; photoURL?: string } = {
        displayName: displayName.trim()
      };
      
      if (!isBase64) {
        authUpdates.photoURL = photoURL || '';
      }

      // Update auth profile
      await updateProfile(auth.currentUser, authUpdates);

      // Update Firestore document
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
      try {
        if (err.code?.startsWith('firestore/')) {
          handleFirestoreError(err, OperationType.UPDATE, `users/${auth.currentUser?.uid}`);
        } else {
          setError(err.message || "Failed to update profile");
        }
      } catch (e: any) {
        setError(e.message || "Failed to update profile");
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative w-full max-w-sm bg-background border border-border/40 rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header / Close Button */}
            <div className="absolute top-4 right-4 z-10">
              <button
                onClick={onClose}
                className="p-1.5 rounded-md text-foreground/50 hover:text-foreground hover:bg-surface-hover transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Profile Content */}
            <div className="p-6 pt-8">
              <div className="flex flex-col items-center text-center">
                {/* Avatar with Upload */}
                <div className="relative group mb-5">
                  <div className="relative">
                    {previewUrl || user.profile?.photoURL || user.photoURL ? (
                      <img
                        src={previewUrl || user.profile?.photoURL || user.photoURL || ''}
                        alt={user.profile?.displayName || user.displayName || "User"}
                        className="w-20 h-20 rounded-full object-cover border border-border/50"
                      />
                    ) : (
                      <div 
                        className="w-20 h-20 rounded-full flex items-center justify-center border border-border/50 text-foreground font-medium text-2xl bg-surface"
                      >
                        {(user.profile?.displayName || user.displayName)?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'J'}
                      </div>
                    )}
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 p-1.5 bg-background text-foreground rounded-full border border-border shadow-sm hover:bg-surface-hover transition-colors"
                    >
                      <Camera size={12} />
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

                {/* Name & Email */}
                <div className="w-full space-y-1 mb-6">
                  {isEditing ? (
                    <div className="flex items-center justify-center gap-2">
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full max-w-[200px] bg-surface border border-border/50 rounded-md px-3 py-1.5 text-center text-foreground text-sm focus:outline-none focus:border-foreground/30 transition-colors"
                        placeholder="Display name"
                        autoFocus
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 group/name">
                      <h2 className="text-lg font-medium text-foreground">
                        {user.profile?.displayName || user.displayName || "Anonymous User"}
                      </h2>
                      <button 
                        onClick={() => setIsEditing(true)}
                        className="opacity-0 group-hover/name:opacity-100 text-foreground/40 hover:text-foreground transition-opacity"
                      >
                        <Edit2 size={12} />
                      </button>
                    </div>
                  )}
                  <p className="text-sm text-foreground/50">{user.email}</p>

                  {error && (
                    <p className="text-xs text-red-500 mt-2">{error}</p>
                  )}
                  {success && (
                    <p className="text-xs text-green-500 mt-2 flex items-center justify-center gap-1">
                      <Check size={12} /> Saved
                    </p>
                  )}
                </div>

                {/* Divider */}
                <div className="w-full h-px bg-border/40 mb-6" />

                {/* Settings List */}
                <div className="w-full space-y-1 mb-6">
                  {/* Theme Toggle */}
                  <div className="flex items-center justify-between py-2 px-1">
                    <div className="flex items-center gap-3 text-foreground/70">
                      {mounted && (
                        theme === 'system' ? <Monitor size={16} /> :
                        theme === 'dark' ? <Moon size={16} /> :
                        <Sun size={16} />
                      )}
                      <span className="text-sm font-medium">Appearance</span>
                    </div>
                    <button
                      onClick={() => {
                        if (theme === 'light') setTheme('dark');
                        else if (theme === 'dark') setTheme('system');
                        else setTheme('light');
                      }}
                      className="text-xs font-medium text-foreground/50 hover:text-foreground transition-colors bg-surface-hover px-2 py-1 rounded-md capitalize min-w-[60px]"
                    >
                      {mounted ? theme : 'System'}
                    </button>
                  </div>

                  {/* Joined */}
                  <div className="flex items-center justify-between py-2 px-1">
                    <div className="flex items-center gap-3 text-foreground/70">
                      <Calendar size={16} />
                      <span className="text-sm font-medium">Joined</span>
                    </div>
                    <span className="text-sm text-foreground/50">
                      {user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Recently'}
                    </span>
                  </div>

                  {/* Role */}
                  <div className="flex items-center justify-between py-2 px-1">
                    <div className="flex items-center gap-3 text-foreground/70">
                      <Shield size={16} />
                      <span className="text-sm font-medium">Role</span>
                    </div>
                    <span className="text-sm text-foreground/50 capitalize">
                      {user.profile?.role || 'User'}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="w-full flex flex-col gap-2">
                  {(isEditing || previewUrl) && (
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-foreground text-background hover:opacity-90 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
                    >
                      {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                      Save Changes
                    </button>
                  )}
                  
                  <button
                    onClick={() => setShowLogoutConfirm(true)}
                    className="w-full flex items-center justify-center gap-2 py-2 px-4 text-red-500/80 hover:text-red-500 hover:bg-red-500/10 rounded-lg text-sm font-medium transition-colors"
                  >
                    <LogOut size={14} />
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
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
              className="relative bg-background border border-border/40 w-full max-w-[320px] rounded-2xl p-6 shadow-xl"
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
                    className="flex-1 py-2 px-4 bg-surface hover:bg-surface-hover text-foreground rounded-lg text-sm font-medium transition-colors border border-border/50 disabled:opacity-50"
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
    </AnimatePresence>
  );
};
