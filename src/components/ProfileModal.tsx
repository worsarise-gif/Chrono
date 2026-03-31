"use client";
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, LogOut, Mail, Calendar, Shield, User as UserIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { logout } from '../firebase';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();

  if (!user) return null;

  const handleLogout = async () => {
    try {
      await logout();
      onClose();
    } catch (error) {
      console.error("Logout failed:", error);
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
                className="p-2 rounded-full bg-surface-hover text-muted hover:text-foreground transition-all border border-border/50"
              >
                <X size={20} />
              </button>
            </div>

            {/* Profile Content */}
            <div className="p-8 pt-12">
              <div className="flex flex-col items-center text-center">
                {/* Avatar */}
                <div className="relative group mb-6">
                  <div className="absolute -inset-1 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-full blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || "User"}
                      className="relative w-24 h-24 rounded-full object-cover border-2 border-background shadow-xl"
                    />
                  ) : (
                    <div className="relative w-24 h-24 rounded-full bg-surface-hover flex items-center justify-center border-2 border-background shadow-xl">
                      <UserIcon size={40} className="text-muted" />
                    </div>
                  )}
                </div>

                {/* Name & Email */}
                <div className="space-y-1 mb-8">
                  <h2 className="text-2xl font-bold tracking-tight text-foreground">
                    {user.displayName || "Anonymous User"}
                  </h2>
                  <div className="flex items-center justify-center gap-2 text-muted">
                    <Mail size={14} />
                    <span className="text-sm font-medium">{user.email}</span>
                  </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-3 w-full mb-8">
                  <div className="p-4 rounded-2xl bg-surface-hover/50 border border-border/50 flex flex-col items-start gap-2">
                    <Calendar size={16} className="text-blue-500" />
                    <div className="text-left">
                      <p className="text-[10px] uppercase tracking-wider font-bold text-muted/60">Joined</p>
                      <p className="text-xs font-semibold text-foreground">
                        {user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Recently'}
                      </p>
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-surface-hover/50 border border-border/50 flex flex-col items-start gap-2">
                    <Shield size={16} className="text-purple-500" />
                    <div className="text-left">
                      <p className="text-[10px] uppercase tracking-wider font-bold text-muted/60">Status</p>
                      <p className="text-xs font-semibold text-foreground">Verified</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="w-full space-y-3">
                  <button
                    onClick={handleLogout}
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
    </AnimatePresence>
  );
};
