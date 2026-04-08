import React, { useState, useEffect } from 'react';
import { Database, HardDrive, Cloud, Activity, CheckCircle2, AlertTriangle, XCircle, RefreshCw } from 'lucide-react';

export default function DatabaseTab() {
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      setLastUpdated(new Date());
    }, 1500);
  };

  const healthServices = [
    { name: 'Firebase Authentication', status: 'operational', latency: '42ms' },
    { name: 'Cloud Firestore', status: 'operational', latency: '85ms' },
    { name: 'Cloud Storage', status: 'operational', latency: '112ms' },
    { name: 'Cloud Functions', status: 'degraded', latency: '850ms' },
    { name: 'Firebase Hosting', status: 'operational', latency: '24ms' },
  ];

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'operational': return <CheckCircle2 className="text-green-500" size={20} />;
      case 'degraded': return <AlertTriangle className="text-yellow-500" size={20} />;
      case 'down': return <XCircle className="text-red-500" size={20} />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Database & Infrastructure</h2>
          <p className="text-muted-foreground text-sm">Monitor Firebase health, connections, and storage metrics.</p>
        </div>
        <button 
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 bg-surface border border-border text-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-background transition-colors disabled:opacity-70"
        >
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          Refresh Metrics
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface border border-border rounded-xl p-6 shadow-sm flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center mb-4">
            <Activity size={32} />
          </div>
          <h3 className="text-3xl font-bold text-foreground">1,204</h3>
          <p className="text-sm font-medium text-muted-foreground mt-1">Active Connections</p>
          <div className="mt-4 text-xs text-green-500 font-medium bg-green-500/10 px-3 py-1 rounded-full">
            Normal Load
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-6 shadow-sm flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-purple-500/10 text-purple-500 flex items-center justify-center mb-4">
            <Database size={32} />
          </div>
          <h3 className="text-3xl font-bold text-foreground">84.2k</h3>
          <p className="text-sm font-medium text-muted-foreground mt-1">Daily Operations</p>
          <div className="w-full mt-4 flex justify-between text-xs text-muted-foreground px-4">
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div> 62k Reads</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div> 21k Writes</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div> 1.2k Deletes</span>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-6 shadow-sm flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4">
            <HardDrive size={32} />
          </div>
          <h3 className="text-3xl font-bold text-foreground">4.2 GB</h3>
          <p className="text-sm font-medium text-muted-foreground mt-1">Storage Used</p>
          <div className="w-full mt-4 bg-background rounded-full h-2 overflow-hidden border border-border">
            <div className="bg-emerald-500 h-full w-[42%]"></div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">42% of 10 GB Quota</p>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border bg-background/50 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-foreground/5 text-foreground rounded-lg">
              <Cloud size={20} />
            </div>
            <h3 className="text-lg font-semibold text-foreground">System Health Status</h3>
          </div>
          <span className="text-xs text-muted-foreground">Last checked: {lastUpdated.toLocaleTimeString()}</span>
        </div>
        
        <div className="divide-y divide-border">
          {healthServices.map((service, idx) => (
            <div key={idx} className="p-5 flex items-center justify-between hover:bg-background/50 transition-colors">
              <div className="flex items-center gap-4">
                {getStatusIcon(service.status)}
                <div>
                  <h4 className="font-medium text-foreground">{service.name}</h4>
                  <p className="text-xs text-muted-foreground capitalize">{service.status === 'operational' ? 'All systems operational' : 'Experiencing degraded performance'}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Latency</p>
                  <p className="font-mono text-sm text-foreground">{service.latency}</p>
                </div>
                <div className="w-24 text-right">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    service.status === 'operational' ? 'bg-green-500/10 text-green-500' : 
                    service.status === 'degraded' ? 'bg-yellow-500/10 text-yellow-600' : 
                    'bg-red-500/10 text-red-500'
                  }`}>
                    {service.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}