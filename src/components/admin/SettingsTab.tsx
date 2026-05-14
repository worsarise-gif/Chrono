import React, { useState, useEffect } from 'react';
import { Settings, Save, AlertTriangle, CheckCircle2, RefreshCw, Sliders, ShieldAlert, Bot, Trash2 } from 'lucide-react';
import { collection, getDocs, deleteDoc, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';

export default function SettingsTab() {
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    maintenanceMessage: 'We are currently undergoing scheduled maintenance. Please check back later.',
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
                  onChange={async (e) => {
                    const newMode = e.target.checked;
                    setSettings({...settings, maintenanceMode: newMode});
                    try {
                      await setDoc(doc(db, 'system_settings', 'main'), { maintenanceMode: newMode }, { merge: true });
                      setToast('Maintenance mode updated successfully.');
                    } catch (error) {
                      console.error("Error saving maintenance mode:", error);
                      setToast('Failed to update maintenance mode.');
                    }
                  }}
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
      </div>
    </div>
  );
}