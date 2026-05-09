import React, { useState } from 'react';
import { Server, AlertTriangle, CheckCircle2, Key, Settings2, Save, RefreshCw } from 'lucide-react';

const modelsData = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'Google', status: 'healthy', usage: 45000, limit: 50000, rpm: 120, rpmLimit: 150 },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'Google', status: 'warning', usage: 19000, limit: 20000, rpm: 45, rpmLimit: 50 },
  { id: 'llama-3.1-8b', name: 'Llama 3.1 8B', provider: 'Groq/Cerebras', status: 'healthy', usage: 35000, limit: 100000, rpm: 200, rpmLimit: 300 },
  { id: 'llama-3.3-70b', name: 'Llama 3.3 70B', provider: 'Groq', status: 'healthy', usage: 8000, limit: 15000, rpm: 15, rpmLimit: 30 },
  { id: 'sdxl-base', name: 'SDXL Base', provider: 'Cloudflare', status: 'healthy', usage: 2500, limit: 5000, rpm: 5, rpmLimit: 10 },
];

export default function ModelsTab() {
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const handleSaveFallbacks = () => {
    setSaving(true);
    // Simulate saving to Firestore
    setTimeout(() => {
      setSaving(false);
      setToast('Fallback configuration saved successfully. Routing logic updated.');
      setTimeout(() => setToast(null), 3000);
    }, 1000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {toast && (
        <div className="fixed bottom-6 right-6 bg-success text-success-foreground px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50 animate-in slide-in-from-bottom-5">
          <CheckCircle2 size={18} />
          <span className="text-sm font-medium">{toast}</span>
        </div>
      )}

      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">AI Model Management</h2>
        <p className="text-foreground-muted text-sm">Monitor rate limits and configure fallback routing logic.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {modelsData.map((model) => {
          const usagePercent = (model.usage / model.limit) * 100;
          const rpmPercent = (model.rpm / model.rpmLimit) * 100;
          const isWarning = usagePercent > 85 || rpmPercent > 85;

          return (
            <div key={model.id} className={`bg-surface border rounded-xl p-5 shadow-sm transition-colors ${isWarning ? 'border-yellow-500/50 bg-yellow-500/5' : 'border-border'}`}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isWarning ? 'bg-yellow-500/20 text-warning' : 'bg-success/10 text-success'}`}>
                    <Server size={18} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                      {model.name}
                      {isWarning && <AlertTriangle size={14} className="text-warning" />}
                    </h3>
                    <p className="text-xs text-foreground-muted">{model.provider}</p>
                  </div>
                </div>
                <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-md ${isWarning ? 'bg-yellow-500/20 text-warning' : 'bg-success/10 text-success'}`}>
                  {isWarning ? 'Approaching Limit' : 'Healthy'}
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-foreground-muted font-medium">Daily Tokens / Requests</span>
                    <span className="text-foreground font-mono">{model.usage.toLocaleString()} / {model.limit.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-background rounded-full h-2 overflow-hidden border border-border">
                    <div 
                      className={`h-full rounded-full ${usagePercent > 90 ? 'bg-destructive text-destructive-foreground' : usagePercent > 75 ? 'bg-yellow-500' : 'bg-blue-500'}`}
                      style={{ width: `${usagePercent}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-foreground-muted font-medium">Requests Per Minute (RPM)</span>
                    <span className="text-foreground font-mono">{model.rpm} / {model.rpmLimit}</span>
                  </div>
                  <div className="w-full bg-background rounded-full h-2 overflow-hidden border border-border">
                    <div 
                      className={`h-full rounded-full ${rpmPercent > 90 ? 'bg-destructive text-destructive-foreground' : rpmPercent > 75 ? 'bg-yellow-500' : 'bg-emerald-500'}`}
                      style={{ width: `${rpmPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden mt-8">
        <div className="p-6 border-b border-border bg-background/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-info/10 text-info rounded-lg">
              <Settings2 size={20} />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Fallback API Routing</h3>
          </div>
          <p className="text-sm text-foreground-muted">
            Configure secondary and tertiary API keys. If the primary key hits a rate limit (429) or quota error, the system will automatically seamlessly route requests to the fallback keys to ensure zero downtime.
          </p>
        </div>

        <div className="p-6 space-y-6">
          {['Gemini', 'Groq', 'Cerebras', 'Cloudflare'].map((provider) => (
            <div key={provider} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start border-b border-border/50 pb-6 last:border-0 last:pb-0">
              <div className="md:col-span-3">
                <h4 className="font-medium text-foreground">{provider}</h4>
                <p className="text-xs text-foreground-muted mt-1">API Key Chain</p>
              </div>
              <div className="md:col-span-9 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="w-20 text-xs font-medium text-foreground-muted uppercase tracking-wider">Primary</span>
                  <div className="relative flex-1">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted" size={14} />
                    <input type="password" defaultValue="••••••••••••••••••••••••" disabled className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm text-foreground-muted opacity-70 cursor-not-allowed" />
                  </div>
                  <span className="text-[10px] bg-success/10 text-success px-2 py-1 rounded font-bold uppercase tracking-wider">Active</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-20 text-xs font-medium text-foreground-muted uppercase tracking-wider">Secondary</span>
                  <div className="relative flex-1">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted" size={14} />
                    <input type="password" placeholder={`Enter fallback ${provider} key...`} className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-all" />
                  </div>
                  <span className="text-[10px] bg-surface border border-border text-foreground-muted px-2 py-1 rounded font-bold uppercase tracking-wider">Standby</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-20 text-xs font-medium text-foreground-muted uppercase tracking-wider">Tertiary</span>
                  <div className="relative flex-1">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted" size={14} />
                    <input type="password" placeholder={`Enter tertiary ${provider} key...`} className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-all" />
                  </div>
                  <span className="text-[10px] bg-surface border border-border text-foreground-muted px-2 py-1 rounded font-bold uppercase tracking-wider">Standby</span>
                </div>
              </div>
            </div>
          ))}

          <div className="flex justify-end pt-4">
            <button 
              onClick={handleSaveFallbacks}
              disabled={saving}
              className="flex items-center gap-2 bg-foreground text-background px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-foreground/90 transition-colors disabled:opacity-70"
            >
              {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
              Save Routing Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}