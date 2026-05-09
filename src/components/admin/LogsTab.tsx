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
      case 'error': return <AlertCircle size={16} className="text-destructive" />;
      case 'warning': return <AlertTriangle size={16} className="text-warning" />;
      case 'info': return <Info size={16} className="text-info" />;
      default: return null;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch(severity) {
      case 'error': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'warning': return 'bg-yellow-500/10 text-warning border-yellow-500/20';
      case 'info': return 'bg-info/10 text-info border-blue-500/20';
      default: return 'bg-surface text-foreground-muted border-border';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">System Logs</h2>
          <p className="text-foreground-muted text-sm">Monitor events, errors, and API failures.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted" size={16} />
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

      <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-background border-b border-border text-foreground-muted">
              <tr>
                <th className="px-6 py-4 font-medium w-12"></th>
                <th className="px-6 py-4 font-medium">Timestamp</th>
                <th className="px-6 py-4 font-medium">Severity</th>
                <th className="px-6 py-4 font-medium">Source</th>
                <th className="px-6 py-4 font-medium">Message</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-foreground-muted">No logs found matching your filters.</td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <React.Fragment key={log.id}>
                    <tr 
                      onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                      className={`hover:bg-background/50 transition-colors cursor-pointer ${expandedLog === log.id ? 'bg-background/50' : ''}`}
                    >
                      <td className="px-6 py-4 text-foreground-muted">
                        {expandedLog === log.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </td>
                      <td className="px-6 py-4 text-foreground-muted font-mono text-xs">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider border ${getSeverityBadge(log.severity)}`}>
                          {getSeverityIcon(log.severity)}
                          {log.severity}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-foreground">{log.source}</td>
                      <td className="px-6 py-4 text-foreground">{log.message}</td>
                    </tr>
                    {expandedLog === log.id && (
                      <tr className="bg-background border-b border-border">
                        <td colSpan={5} className="px-6 py-6">
                          <div className="bg-[#1e1e1e] rounded-lg p-4 font-mono text-xs text-success overflow-x-auto relative group">
                            <div className="absolute top-3 right-3 text-background/30 group-hover:text-background/70 transition-colors">
                              <Terminal size={16} />
                            </div>
                            <pre>{JSON.stringify(log.payload, null, 2)}</pre>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}