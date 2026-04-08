import React, { useState } from 'react';
import { Search, Filter, ChevronDown, ChevronUp, AlertCircle, Info, AlertTriangle, Terminal } from 'lucide-react';

const mockLogs = [
  { id: 'log-1', timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), severity: 'error', source: 'AI API', message: 'Rate limit exceeded for Gemini 2.5 Pro', payload: { endpoint: '/v1/models/gemini-2.5-pro:generateContent', status: 429, error: 'Quota exceeded' } },
  { id: 'log-2', timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), severity: 'info', source: 'Database', message: 'Successful backup completed', payload: { size: '4.2GB', duration: '45s', tables: ['users', 'chats', 'messages'] } },
  { id: 'log-3', timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), severity: 'warning', source: 'UI', message: 'High latency detected on client load', payload: { loadTime: '4.5s', userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X)', region: 'eu-west' } },
  { id: 'log-4', timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(), severity: 'info', source: 'Auth', message: 'New admin user provisioned', payload: { adminId: 'usr_8923jkl', grantedBy: 'system' } },
  { id: 'log-5', timestamp: new Date(Date.now() - 1000 * 60 * 300).toISOString(), severity: 'error', source: 'Database', message: 'Firestore connection timeout', payload: { attempt: 3, latency: '15000ms', region: 'us-central1' } },
  { id: 'log-6', timestamp: new Date(Date.now() - 1000 * 60 * 400).toISOString(), severity: 'info', source: 'AI API', message: 'Fallback routing triggered', payload: { primary: 'gemini-2.5-pro', fallback: 'llama-3.1-8b', reason: '429 Too Many Requests' } },
];

export default function LogsTab() {
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterSource, setFilterSource] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = mockLogs.filter(log => {
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

      <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-background border-b border-border text-muted-foreground">
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
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">No logs found matching your filters.</td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <React.Fragment key={log.id}>
                    <tr 
                      onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                      className={`hover:bg-background/50 transition-colors cursor-pointer ${expandedLog === log.id ? 'bg-background/50' : ''}`}
                    >
                      <td className="px-6 py-4 text-muted-foreground">
                        {expandedLog === log.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground font-mono text-xs">
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
                          <div className="bg-[#1e1e1e] rounded-lg p-4 font-mono text-xs text-green-400 overflow-x-auto relative group">
                            <div className="absolute top-3 right-3 text-white/30 group-hover:text-white/70 transition-colors">
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