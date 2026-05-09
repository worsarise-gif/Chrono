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
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    maintenanceMessage: 'We are currently undergoing scheduled maintenance. Please check back later.',
    enableImageGeneration: true,
    enableWebSearch: true,
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'system_settings', 'main');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setSettings(prev => ({
            ...prev,
            maintenanceMode: data.maintenanceMode || false,
            maintenanceMessage: data.maintenanceMessage || 'We are currently undergoing scheduled maintenance. Please check back later.',
            enableImageGeneration: data.enableImageGeneration !== undefined ? data.enableImageGeneration : true,
            enableWebSearch: data.enableWebSearch !== undefined ? data.enableWebSearch : true,
          }));
        }
      } catch (error) {
        console.error("Error fetching system settings:", error);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'system_settings', 'main'), {
        maintenanceMode: settings.maintenanceMode,
        maintenanceMessage: settings.maintenanceMessage,
        enableImageGeneration: settings.enableImageGeneration,
        enableWebSearch: settings.enableWebSearch,
      }, { merge: true });
      setToast('System settings updated successfully.');
    } catch (error) {
      console.error("Error saving settings:", error);
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
      
      const folderPromises = listResult.prefixes.map((prefixRef) => deleteStorageFolder(prefixRef));
      await Promise.all(folderPromises);
    } catch (error: any) {
      if (error.code !== 'storage/object-not-found') {
        console.error("Error deleting storage folder:", error);
      }
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
      
      const userDeletions = usersSnapshot.docs.map(async (userDoc) => {
        const uid = userDoc.id;
        
        // Delete generated_images
        const imagesSnapshot = await getDocs(collection(db, `users/${uid}/generated_images`));
        const imageDeletions = imagesSnapshot.docs.map((imgDoc) =>
          deleteDoc(doc(db, `users/${uid}/generated_images`, imgDoc.id))
        );
        
        // Delete chats and messages
        const chatsSnapshot = await getDocs(collection(db, `users/${uid}/chats`));
        const chatDeletions = chatsSnapshot.docs.map(async (chatDoc) => {
          const messagesSnapshot = await getDocs(collection(db, `users/${uid}/chats/${chatDoc.id}/messages`));
          const messageDeletions = messagesSnapshot.docs.map((msgDoc) =>
            deleteDoc(doc(db, `users/${uid}/chats/${chatDoc.id}/messages`, msgDoc.id))
          );

          await Promise.all(messageDeletions);
          return deleteDoc(doc(db, `users/${uid}/chats`, chatDoc.id));
        });

        await Promise.all([...imageDeletions, ...chatDeletions]);
        
        // Delete user document, except for the super admin
        if (uid !== auth.currentUser?.uid) {
          await deleteDoc(doc(db, 'users', uid));
        }
      });

      await Promise.all(userDeletions);
      
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

  const isSuperAdmin = user?.email === 'johnkerveelayese@gmail.com';

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl">
      {toast && (
        <div className="fixed bottom-6 right-6 bg-success text-success-foreground px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50 animate-in slide-in-from-bottom-5">
          <CheckCircle2 size={18} />
          <span className="text-sm font-medium">{toast}</span>
        </div>
      )}

      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">System Settings</h2>
        <p className="text-foreground-muted text-sm">Dynamically adjust user experience parameters without redeploying.</p>
      </div>

      <div className="space-y-6">
        {/* Maintenance Mode */}
        <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-destructive/10 text-destructive rounded-lg">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Maintenance Mode</h3>
              <p className="text-sm text-foreground-muted">Temporarily disable access to the application for all non-admin users.</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <label className="flex items-center justify-between p-4 border border-border rounded-lg bg-background cursor-pointer hover:bg-background/80 transition-colors">
              <div>
                <span className="font-medium text-foreground block">Enable Maintenance Mode</span>
                <span className="text-xs text-foreground-muted">Users will see the maintenance message instead of the app.</span>
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

        {/* Additional Features */}
        <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-info/10 text-info rounded-lg">
              <Sliders size={20} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Additional Features</h3>
              <p className="text-sm text-foreground-muted">Enable or disable specific features across the application.</p>
            </div>
          </div>

          <div className="space-y-4">
            <label className="flex items-center justify-between p-4 border border-border rounded-lg bg-background cursor-pointer hover:bg-background/80 transition-colors">
              <div>
                <span className="font-medium text-foreground block">Enable Image Generation</span>
                <span className="text-xs text-foreground-muted">Allow users to generate images using Cloudflare SDXL.</span>
              </div>
              <div className="relative inline-block w-12 h-6 rounded-full transition-colors duration-200 ease-in-out" style={{ backgroundColor: settings.enableImageGeneration ? '#10b981' : 'var(--color-border)' }}>
                <input 
                  type="checkbox" 
                  className="opacity-0 w-0 h-0" 
                  checked={settings.enableImageGeneration}
                  onChange={(e) => setSettings({...settings, enableImageGeneration: e.target.checked})}
                />
                <span className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ease-in-out ${settings.enableImageGeneration ? 'translate-x-6' : 'translate-x-0'}`}></span>
              </div>
            </label>

            <label className="flex items-center justify-between p-4 border border-border rounded-lg bg-background cursor-pointer hover:bg-background/80 transition-colors">
              <div>
                <span className="font-medium text-foreground block">Enable Web Search</span>
                <span className="text-xs text-foreground-muted">Allow the AI to use Tavily/Google for real-time information.</span>
              </div>
              <div className="relative inline-block w-12 h-6 rounded-full transition-colors duration-200 ease-in-out" style={{ backgroundColor: settings.enableWebSearch ? '#10b981' : 'var(--color-border)' }}>
                <input 
                  type="checkbox" 
                  className="opacity-0 w-0 h-0" 
                  checked={settings.enableWebSearch}
                  onChange={(e) => setSettings({...settings, enableWebSearch: e.target.checked})}
                />
                <span className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ease-in-out ${settings.enableWebSearch ? 'translate-x-6' : 'translate-x-0'}`}></span>
              </div>
            </label>
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
            <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-destructive/10 text-destructive rounded-lg">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-destructive">Danger Zone</h3>
                  <p className="text-sm text-destructive/80">Irreversible, destructive actions for the system.</p>
                </div>
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border border-destructive/20 rounded-lg bg-background/50">
                <div>
                  <span className="font-medium text-foreground block">Clear All System Data</span>
                  <span className="text-xs text-foreground-muted">Permanently deletes all users, chats, messages, and uploaded images. Your super admin account will be preserved.</span>
                </div>
                
                {!showClearConfirm ? (
                  <button 
                    onClick={() => setShowClearConfirm(true)}
                    className="flex items-center justify-center gap-2 bg-destructive text-destructive-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-destructive/90 transition-colors whitespace-nowrap"
                  >
                    <Trash2 size={16} />
                    Clear All Data
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
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
                      className="flex items-center justify-center gap-2 bg-destructive text-destructive-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-destructive/90 transition-colors whitespace-nowrap disabled:opacity-70"
                    >
                      {clearingData ? <RefreshCw size={16} className="animate-spin" /> : <AlertTriangle size={16} />}
                      Confirm Deletion
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}