"use client";
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, LogOut, Mail, Calendar, Shield, User as UserIcon, Camera, Save, Loader2, Sun, Moon, Check } from 'lucide-react';
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
      await logout();
      setShowLogoutConfirm(false);
      onClose();
      // Force a full page reload and redirect to home to clear all states immediately
      window.location.href = '/';
    } catch (error) {
      console.error("Logout failed:", error);
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

      // Upload new photo if selected
      if (fileInputRef.current?.files?.[0]) {
        const file = fileInputRef.current.files[0];
        const storageRef = ref(storage, `profiles/${auth.currentUser.uid}`);
        await uploadBytes(storageRef, file);
        photoURL = await getDownloadURL(storageRef);
      }

      // Update profile
      await updateProfile(auth.currentUser, {
        displayName: displayName.trim(),
        photoURL: photoURL
      });

      // Update Firestore document
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        displayName: displayName.trim(),
        photoURL: photoURL,
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
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md bg-surface border border-border rounded-[32px] shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header / Close Button */}
            <div className="absolute top-6 right-6 z-10">
              <button
                onClick={onClose}
                className="p-2 rounded-full bg-surface-hover text-foreground/60 hover:text-foreground transition-all border border-border/50"
              >
                <X size={20} />
              </button>
            </div>

            {/* Profile Content */}
            <div className="p-8 pt-12">
              <div className="flex flex-col items-center text-center">
                {/* Avatar with Upload */}
                <div className="relative group mb-6">
                  <div className="absolute -inset-1 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-full blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                  <div className="relative">
                    {previewUrl || user.profile?.photoURL || user.photoURL ? (
                      <img
                        src={previewUrl || user.profile?.photoURL || user.photoURL || ''}
                        alt={user.profile?.displayName || user.displayName || "User"}
                        className="w-24 h-24 rounded-full object-cover border-2 border-background shadow-xl"
                      />
                    ) : (
                      <div 
                        className="w-24 h-24 rounded-full flex items-center justify-center border-2 border-background shadow-xl text-white font-bold text-3xl"
                        style={{ backgroundColor: `hsl(${(user.email?.length || 0) * 137.5 % 360}, 60%, 50%)` }}
                      >
                        {(user.profile?.displayName || user.displayName)?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'J'}
                      </div>
                    )}
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 p-2 bg-foreground text-background rounded-full shadow-lg hover:scale-110 transition-transform border-2 border-background"
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

                {/* Name & Email */}
                <div className="w-full space-y-4 mb-8">
                  <div className="space-y-1">
                    {isEditing ? (
                      <div className="flex flex-col gap-2">
                        <input
                          type="text"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          className="w-full bg-surface-hover border border-border rounded-xl px-4 py-2 text-center text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-semibold text-lg"
                          placeholder="Your display name"
                          autoFocus
                        />
                      </div>
                    ) : (
                      <h2 
                        className="text-2xl font-bold tracking-tight text-foreground cursor-pointer hover:text-blue-500 transition-colors"
                        onClick={() => setIsEditing(true)}
                      >
                        {user.profile?.displayName || user.displayName || "Anonymous User"}
                      </h2>
                    )}
                    <div className="flex items-center justify-center gap-2 text-foreground/60">
                      <Mail size={14} />
                      <span className="text-sm font-medium">{user.email}</span>
                    </div>
                  </div>

                  {error && (
                    <p className="text-xs text-red-500 font-medium bg-red-500/10 py-2 px-3 rounded-lg border border-red-500/20">
                      {error}
                    </p>
                  )}

                  {success && (
                    <p className="text-xs text-green-500 font-medium bg-green-500/10 py-2 px-3 rounded-lg border border-green-500/20 flex items-center justify-center gap-1.5">
                      <Check size={12} /> Profile updated successfully
                    </p>
                  )}
                </div>

                {/* Theme Toggle & Info Grid */}
                <div className="w-full space-y-3 mb-8">
                  {/* Theme Toggle */}
                  <div className="p-4 rounded-2xl bg-surface-hover/50 border border-border/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center border border-border/50">
                        {mounted && (theme === 'dark' ? <Moon size={16} className="text-indigo-500" /> : <Sun size={16} className="text-yellow-500" />)}
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-bold text-foreground">Appearance</p>
                        <p className="text-[10px] text-foreground/60 font-medium uppercase tracking-wider">{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                      className="relative inline-flex h-6 w-11 items-center rounded-full bg-surface-hover border border-border transition-colors focus:outline-none"
                    >
                      <span
                        className={`${
                          theme === 'dark' ? 'translate-x-6 bg-indigo-500' : 'translate-x-1 bg-yellow-500'
                        } inline-block h-4 w-4 transform rounded-full transition-transform duration-200 ease-in-out`}
                      />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 w-full">
                    <div className="p-4 rounded-2xl bg-surface-hover/50 border border-border/50 flex flex-col items-start gap-2">
                      <Calendar size={16} className="text-blue-500" />
                      <div className="text-left">
                        <p className="text-[10px] uppercase tracking-wider font-bold text-foreground/40">Joined</p>
                        <p className="text-xs font-semibold text-foreground">
                          {user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Recently'}
                        </p>
                      </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-surface-hover/50 border border-border/50 flex flex-col items-start gap-2">
                      <Shield size={16} className="text-purple-500" />
                      <div className="text-left">
                        <p className="text-[10px] uppercase tracking-wider font-bold text-foreground/40">Status</p>
                        <p className="text-xs font-semibold text-foreground">Verified</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="w-full space-y-3">
                  {(isEditing || previewUrl) && (
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-foreground text-background hover:opacity-90 rounded-2xl font-bold transition-all duration-300 shadow-lg disabled:opacity-50"
                    >
                      {isSaving ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Save size={18} />
                      )}
                      Save Changes
                    </button>
                  )}
                  
                  <button
                    onClick={() => setShowLogoutConfirm(true)}
                    className="w-full group flex items-center justify-center gap-2 py-4 px-6 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-2xl font-bold transition-all duration-300 border border-red-500/20 hover:border-red-500 shadow-sm"
                  >
                    <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
                    Sign Out
                  </button>
                </div>
              </div>
            </div>

            {/* Footer Decoration */}
            <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-50" />
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
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-surface border border-border w-full max-w-[360px] rounded-[32px] p-8 shadow-2xl overflow-hidden"
            >
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-2">
                  <LogOut size={32} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-foreground">Sign Out?</h3>
                  <p className="text-sm text-foreground/60 leading-relaxed">
                    Are you sure you want to sign out of your account? You'll need to sign in again to access your chats.
                  </p>
                </div>
                <div className="flex flex-col w-full gap-3 pt-2">
                  <button
                    onClick={handleLogout}
                    className="w-full py-4 px-6 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-bold transition-all shadow-lg active:scale-[0.98]"
                  >
                    Yes, Sign Out
                  </button>
                  <button
                    onClick={() => setShowLogoutConfirm(false)}
                    className="w-full py-4 px-6 bg-surface-hover text-foreground/60 hover:text-foreground rounded-2xl font-bold transition-all active:scale-[0.98]"
                  >
                    Cancel
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
