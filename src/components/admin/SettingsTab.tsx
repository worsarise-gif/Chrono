import React, { useState, useEffect } from 'react';
import { Settings, Save, AlertTriangle, CheckCircle2, RefreshCw, Sliders, ShieldAlert, Bot, Trash2 } from 'lucide-react';
import { collection, getDocs, deleteDoc, doc, setDoc, getDoc } from 'firebase/firestore';
import { ref, listAll, deleteObject } from 'firebase/storage';
import { db, storage, auth } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';

export default function SettingsTab() {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [clearingData, setClearingData] = useState(false);
  const [clearingLogs, setClearingLogs] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    maintenanceMessage: 'We are currently undergoing scheduled maintenance. Please check back later.',
    defaultTemperature: 0.7,
    maxTokens: 4096,
    systemPromptOverride: '',
    enableImageGeneration: true,
    enableWebSearch: true,
  });

  const isSuperAdmin = user?.email === 'johnkerveelayese@gmail.com';

  useEffect(() => {
    const fetchSettings = async () => {
      const docSnap = await getDoc(doc(db, 'config', 'system'));
      if (docSnap.exists()) {
        setSettings(prev => ({ ...prev, ...docSnap.data() }));
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'config', 'system'), settings, { merge: true });
      setToast('System settings updated successfully.');
    } catch (error) {
      console.error('Error saving settings:', error);
      setToast('Failed to save settings.');
    } finally {
      setSaving(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const deleteStorageFolder = async (folderRef: any) => {
    try {
      const listResult = await listAll(folderRef);
      const deletePromises = listResult.items.map((itemRef) => deleteObject(itemRef));
      await Promise.all(deletePromises);
      
      for (const prefixRef of listResult.prefixes) {
        await deleteStorageFolder(prefixRef);
      }
    } catch (error: any) {
      if (error.code !== 'storage/object-not-found') {
        console.error("Error deleting storage folder:", error);
      }
    }
  };


  const handleClearLogs = async () => {
    const confirmed = window.confirm("Are you sure you want to clear all system logs? This cannot be undone.");
    if (!confirmed) return;

    setClearingLogs(true);
    try {
      const logsSnap = await getDocs(collection(db, 'logs'));
      const deletePromises = logsSnap.docs.map(logDoc => deleteDoc(doc(db, 'logs', logDoc.id)));
      await Promise.all(deletePromises);

      setToast('All system logs have been cleared.');
      setTimeout(() => setToast(null), 3000);
    } catch (error) {
      console.error('Error clearing logs:', error);
      setToast('Failed to clear system logs.');
      setTimeout(() => setToast(null), 3000);
    } finally {
      setClearingLogs(false);
    }
  };

  const handleClearAllData = async () => {
    if (user?.email !== 'johnkerveelayese@gmail.com') {
      setToast('Unauthorized action.');
      setTimeout(() => setToast(null), 3000);
      return;
    }

    setClearingData(true);
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      
      for (const userDoc of usersSnapshot.docs) {
        const uid = userDoc.id;
        
        // Delete generated_images
        const imagesSnapshot = await getDocs(collection(db, `users/${uid}/generated_images`));
        for (const imgDoc of imagesSnapshot.docs) {
          await deleteDoc(doc(db, `users/${uid}/generated_images`, imgDoc.id));
        }
        
        // Delete chats and messages
        const chatsSnapshot = await getDocs(collection(db, `users/${uid}/chats`));
        for (const chatDoc of chatsSnapshot.docs) {
          const messagesSnapshot = await getDocs(collection(db, `users/${uid}/chats/${chatDoc.id}/messages`));
          for (const msgDoc of messagesSnapshot.docs) {
            await deleteDoc(doc(db, `users/${uid}/chats/${chatDoc.id}/messages`, msgDoc.id));
          }
          await deleteDoc(doc(db, `users/${uid}/chats`, chatDoc.id));
        }
        
        // Delete user document, except for the super admin
        if (uid !== auth.currentUser?.uid) {
          await deleteDoc(doc(db, 'users', uid));
        }
      }
      
      // Delete Storage data
      await deleteStorageFolder(ref(storage, 'profiles'));
      await deleteStorageFolder(ref(storage, 'users'));
      
      setToast('All data cleared successfully.');
    } catch (error) {
      console.error("Error clearing data:", error);
      setToast('Failed to clear data.');
    } finally {
      setClearingData(false);
      setShowClearConfirm(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl">
      {toast && (
        <div className="fixed bottom-6 right-6 bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50 animate-in slide-in-from-bottom-5">
          <CheckCircle2 size={18} />
          <span className="text-sm font-medium">{toast}</span>
        </div>
      )}

      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">System Settings</h2>
        <p className="text-muted-foreground text-sm">Dynamically adjust user experience parameters without redeploying.</p>
      </div>

      <div className="space-y-6">
        {/* Maintenance Mode */}
        <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-red-500/10 text-red-500 rounded-lg">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Maintenance Mode</h3>
              <p className="text-sm text-muted-foreground">Temporarily disable access to the application for all non-admin users.</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <label className="flex items-center justify-between p-4 border border-border rounded-lg bg-background cursor-pointer hover:bg-background/80 transition-colors">
              <div>
                <span className="font-medium text-foreground block">Enable Maintenance Mode</span>
                <span className="text-xs text-muted-foreground">Users will see the maintenance message instead of the app.</span>
              </div>
              <div className="relative inline-block w-12 h-6 rounded-full transition-colors duration-200 ease-in-out" style={{ backgroundColor: settings.maintenanceMode ? '#ef4444' : 'var(--color-border)' }}>
                <input 
                  type="checkbox" 
                  className="opacity-0 w-0 h-0" 
                  checked={settings.maintenanceMode}
                  onChange={(e) => setSettings({...settings, maintenanceMode: e.target.checked})}
                />
                <span className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ease-in-out ${settings.maintenanceMode ? 'translate-x-6' : 'translate-x-0'}`}></span>
              </div>
            </label>

            {settings.maintenanceMode && (
              <div className="space-y-2 animate-in slide-in-from-top-2">
                <label className="text-sm font-medium text-foreground">Maintenance Message</label>
                <textarea 
                  value={settings.maintenanceMessage}
                  onChange={(e) => setSettings({...settings, maintenanceMessage: e.target.value})}
                  className="w-full bg-background border border-border rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20 h-24 resize-none"
                />
              </div>
            )}
          </div>
        </div>


        <div className="flex justify-end pt-4">
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-foreground text-background px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-foreground/90 transition-colors disabled:opacity-70"
          >
            {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
            Save All Settings
          </button>
        </div>

        {/* Danger Zone - Super Admin Only */}
        {isSuperAdmin && (
          <div className="mt-12 border-t border-border pt-8">
            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-red-500/10 text-red-500 rounded-lg">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-red-500">Danger Zone</h3>
                  <p className="text-sm text-red-500/80">Irreversible, destructive actions for the system.</p>
                </div>
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border border-red-500/20 rounded-lg bg-background/50">
                <div>
                  <span className="font-medium text-foreground block">Clear All System Data</span>
                  <span className="text-xs text-muted-foreground">Permanently deletes all users, chats, messages, and uploaded images. Your super admin account will be preserved.</span>
                </div>
                
                {!showClearConfirm ? (
                  <button 
                    onClick={() => setShowClearConfirm(true)}
                    className="flex items-center justify-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors whitespace-nowrap"
                  >
                    <Trash2 size={16} />
                    Clear All Data
                  </button>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                    <button 
                      onClick={() => setShowClearConfirm(false)}
                      disabled={clearingData}
                      className="px-4 py-2 rounded-lg text-sm font-medium bg-surface border border-border hover:bg-background transition-colors disabled:opacity-70"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleClearAllData}
                      disabled={clearingData}
                      className="flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors whitespace-nowrap disabled:opacity-70"
                    >
                      {clearingData ? <RefreshCw size={16} className="animate-spin" /> : <AlertTriangle size={16} />}
                      Confirm Deletion
                    </button>
                  </div>
                )}
              </div>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border border-red-500/20 rounded-lg bg-background/50 mt-4">

                <div>
                  <span className="font-medium text-foreground block">Clear System Logs</span>
                  <span className="text-xs text-muted-foreground">Permanently deletes all debugging and system logs from the database.</span>
                </div>
                <button
                  onClick={handleClearLogs}
                  disabled={clearingLogs}
                  className="flex items-center justify-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors whitespace-nowrap disabled:opacity-70"
                >
                  {clearingLogs ? <RefreshCw size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  Clear Logs
                </button>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}