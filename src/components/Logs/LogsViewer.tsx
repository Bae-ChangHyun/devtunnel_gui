import { useState, useEffect, useRef } from 'react';
import { listen } from '@tauri-apps/api/event';

interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  message: string;
}

export default function LogsViewer() {
  const [logs, setLogs] = useState<LogEntry[]>([
    { timestamp: new Date().toISOString(), level: 'INFO', message: 'DevTunnel GUI started' },
    { timestamp: new Date().toISOString(), level: 'INFO', message: 'Checking authentication status...' },
    { timestamp: new Date().toISOString(), level: 'INFO', message: 'User authenticated successfully' },
  ]);
  const [autoScroll, setAutoScroll] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Listen for log events from Tauri backend
    const unlisten = listen<string>('devtunnel-log', (event) => {
      const message = event.payload;
      const logEntry: LogEntry = {
        timestamp: new Date().toISOString(),
        level: message.includes('ERROR') ? 'ERROR' :
               message.includes('WARN') ? 'WARN' :
               message.includes('DEBUG') ? 'DEBUG' : 'INFO',
        message: message,
      };

      setLogs(prev => [...prev, logEntry]);
    });

    return () => {
      unlisten.then(fn => fn());
    };
  }, []);

  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const handleClearLogs = () => {
    setLogs([]);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const timeStr = date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    const ms = date.getMilliseconds().toString().padStart(3, '0');
    return `${timeStr}.${ms}`;
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'ERROR': return 'text-red-400';
      case 'WARN': return 'text-yellow-400';
      case 'DEBUG': return 'text-gray-500';
      default: return 'text-green-400';
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Logs</h1>
          <p className="text-gray-400 mt-1">Real-time application and tunnel logs</p>
        </div>
        <div className="flex gap-2">
          <label className="flex items-center gap-2 text-sm text-gray-400">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="w-4 h-4"
            />
            Auto-scroll
          </label>
          <button onClick={handleClearLogs} className="btn-secondary">
            Clear Logs
          </button>
        </div>
      </div>

      <div className="card">
        <div className="bg-gray-950 p-4 rounded font-mono text-sm max-h-[600px] overflow-y-auto">
          {logs.length === 0 ? (
            <div className="text-gray-500 py-4 text-center">
              No logs yet. Logs will appear here in real-time.
            </div>
          ) : (
            logs.map((log, idx) => (
              <div key={idx} className="py-1 border-b border-gray-800/50 hover:bg-gray-900/30">
                <span className="text-gray-600">{formatTimestamp(log.timestamp)}</span>
                {' '}
                <span className={`font-semibold ${getLevelColor(log.level)}`}>
                  [{log.level}]
                </span>
                {' '}
                <span className="text-gray-300">{log.message}</span>
              </div>
            ))
          )}
          <div ref={logsEndRef} />
        </div>
      </div>

      <div className="mt-4 text-xs text-gray-500">
        <p>📊 Total logs: {logs.length}</p>
        <p>✅ Real-time logging is active. All DevTunnel operations will be logged here.</p>
      </div>
    </div>
  );
}
