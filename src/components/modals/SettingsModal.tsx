import React, { useEffect, useState } from 'react';
import { Moon, Sun, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from 'next-themes';
import { db } from '../../firebase';
import { doc, updateDoc } from 'firebase/firestore';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (user?.profile?.systemPrompt) {
      setSystemPrompt(user.profile.systemPrompt);
    }
  }, [user]);

  if (!isOpen) return null;

  const handleSavePrompt = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        systemPrompt: systemPrompt
      });
    } catch (error) {
      console.error('Error saving system prompt:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-surface border border-border/40 rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-foreground/50 hover:text-foreground">
          <X size={20} />
        </button>
        <div className="p-6">
          <h2 className="text-xl font-medium text-foreground mb-6">Settings</h2>

          <div className="space-y-6">
            {/* Appearance */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-foreground/70">
                {mounted && (theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />)}
                <span className="text-sm font-medium">Appearance</span>
              </div>
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="text-xs font-medium text-foreground/80 hover:text-foreground transition-colors bg-background border border-border/50 hover:bg-surface-hover px-3 py-1.5 rounded-lg"
              >
                {mounted && (theme === 'dark' ? 'Dark Mode' : 'Light Mode')}
              </button>
            </div>

            {/* Personalization */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-foreground/80">Personalization</h3>
              <div>
                <label className="block text-xs text-foreground/60 mb-1">Custom System Prompt</label>
                <textarea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  className="w-full bg-background border border-border/50 rounded-lg p-2 text-sm text-foreground focus:outline-none focus:border-foreground/30 min-h-[100px] resize-y"
                  placeholder="Enter a custom system prompt to guide Chrono..."
                />
              </div>
              <button
                onClick={handleSavePrompt}
                disabled={isSaving}
                className="w-full py-2 bg-foreground text-background rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Prompt'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
