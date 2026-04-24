import React, { useState, useEffect } from 'react';
import { Search, Filter, ChevronDown, ChevronUp, AlertCircle, Info, AlertTriangle, Terminal } from 'lucide-react';
import { db } from '../../firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';

export default function LogsTab() {
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterSource, setFilterSource] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [realLogs, setRealLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'logs'),
      orderBy('timestamp', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedLogs: any[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        let ts = new Date().toISOString();
        if (data.timestamp && data.timestamp.toDate) {
          ts = data.timestamp.toDate().toISOString();
        } else if (data.timestamp) {
          ts = new Date(data.timestamp).toISOString();
        }
        
        fetchedLogs.push({
          id: doc.id,
          timestamp: ts,
          severity: data.severity || 'info',
          source: data.source || 'Unknown',
          message: data.message || '',
          payload: data.payload || {}
        });
      });
      setRealLogs(fetchedLogs);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching logs:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredLogs = realLogs.filter(log => {
    const matchSeverity = filterSeverity === 'all' || log.severity === filterSeverity;
    const matchSource = filterSource === 'all' || log.source.toLowerCase() === filterSource.toLowerCase();
    const matchSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) || log.id.includes(searchTerm);
    return matchSeverity && matchSource && matchSearch;
  });

  const getSeverityIcon = (severity: string) => {
    switch(severity) {
      case 'error': return <AlertCircle size={16} className="text-red-500" />;
      case 'warning': return <AlertTriangle size={16} className="text-yellow-500" />;
      case 'info': return <Info size={16} className="text-blue-500" />;
      default: return null;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch(severity) {
      case 'error': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'warning': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'info': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default: return 'bg-surface text-muted-foreground border-border';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">System Logs</h2>
          <p className="text-muted-foreground text-sm">Monitor events, errors, and API failures.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input 
              type="text" 
              placeholder="Search logs..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-surface border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-all"
            />
          </div>
          <select 
            value={filterSeverity} 
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
          >
            <option value="all">All Severities</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="error">Critical / Error</option>
          </select>
          <select 
            value={filterSource} 
            onChange={(e) => setFilterSource(e.target.value)}
            className="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
          >
            <option value="all">All Sources</option>
            <option value="database">Database</option>
            <option value="ai api">AI API</option>
            <option value="ui">UI</option>
            <option value="auth">Auth</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Good Condition (Info) */}
        <div className="flex flex-col h-[600px]">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-blue-500/10 rounded-md text-blue-500 border border-blue-500/20">
              <Info size={16} />
            </div>
            <h3 className="font-semibold text-foreground">Good Condition</h3>
            <span className="ml-auto bg-surface border border-border text-muted-foreground text-xs px-2 py-0.5 rounded-full font-medium">
              {filteredLogs.filter(l => l.severity === 'info').length}
            </span>
          </div>
          <div className="bg-surface border border-border rounded-xl flex-1 overflow-y-auto shadow-sm p-4 space-y-3">
            {filteredLogs.filter(l => l.severity === 'info').length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-8">No info logs</div>
            ) : (
              filteredLogs.filter(l => l.severity === 'info').map(log => (
                <div key={log.id} onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)} className="border border-border bg-background rounded-lg p-3 cursor-pointer hover:border-blue-500/30 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-medium text-foreground">{log.source}</span>
                    <span className="text-[10px] font-mono text-muted-foreground">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-sm text-foreground mb-1 line-clamp-2">{log.message}</p>
                  {expandedLog === log.id && (
                    <div className="mt-3 bg-[#1e1e1e] rounded p-3 font-mono text-[10px] text-green-400 overflow-x-auto">
                      <pre>{JSON.stringify(log.payload, null, 2)}</pre>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Maintenance Needed (Warnings) */}
        <div className="flex flex-col h-[600px]">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-yellow-500/10 rounded-md text-yellow-600 border border-yellow-500/20">
              <AlertTriangle size={16} />
            </div>
            <h3 className="font-semibold text-foreground">Maintenance Needed</h3>
            <span className="ml-auto bg-surface border border-border text-muted-foreground text-xs px-2 py-0.5 rounded-full font-medium">
              {filteredLogs.filter(l => l.severity === 'warning').length}
            </span>
          </div>
          <div className="bg-surface border border-border rounded-xl flex-1 overflow-y-auto shadow-sm p-4 space-y-3">
            {filteredLogs.filter(l => l.severity === 'warning').length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-8">No warnings</div>
            ) : (
              filteredLogs.filter(l => l.severity === 'warning').map(log => (
                <div key={log.id} onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)} className="border border-yellow-500/20 bg-background rounded-lg p-3 cursor-pointer hover:border-yellow-500/50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-medium text-foreground">{log.source}</span>
                    <span className="text-[10px] font-mono text-muted-foreground">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-sm text-foreground mb-1 line-clamp-2">{log.message}</p>
                  {expandedLog === log.id && (
                    <div className="mt-3 bg-[#1e1e1e] rounded p-3 font-mono text-[10px] text-green-400 overflow-x-auto">
                      <pre>{JSON.stringify(log.payload, null, 2)}</pre>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Failing (Errors) */}
        <div className="flex flex-col h-[600px]">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-red-500/10 rounded-md text-red-500 border border-red-500/20">
              <AlertCircle size={16} />
            </div>
            <h3 className="font-semibold text-foreground">Failing</h3>
            <span className="ml-auto bg-surface border border-border text-muted-foreground text-xs px-2 py-0.5 rounded-full font-medium">
              {filteredLogs.filter(l => l.severity === 'error').length}
            </span>
          </div>
          <div className="bg-surface border border-border rounded-xl flex-1 overflow-y-auto shadow-sm p-4 space-y-3">
            {filteredLogs.filter(l => l.severity === 'error').length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-8">No errors</div>
            ) : (
              filteredLogs.filter(l => l.severity === 'error').map(log => (
                <div key={log.id} onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)} className="border border-red-500/30 bg-background rounded-lg p-3 cursor-pointer hover:border-red-500/60 transition-colors shadow-sm shadow-red-500/5">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-red-500">{log.source}</span>
                    <span className="text-[10px] font-mono text-muted-foreground">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-sm text-foreground mb-1 line-clamp-3">{log.message}</p>
                  {expandedLog === log.id && (
                    <div className="mt-3 bg-[#1e1e1e] rounded p-3 font-mono text-[10px] text-red-400 overflow-x-auto border border-red-500/20">
                      <pre>{JSON.stringify(log.payload, null, 2)}</pre>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}