import { useState, useEffect } from 'react';
import { useTunnelStore } from '../../stores/tunnelStore';
import { tunnelApi } from '../../lib/api';
import PortManager from './PortManager';
import AccessControlManager from './AccessControlManager';

interface TunnelDetailPanelProps {
  onRefresh: () => void;
}

export default function TunnelDetailPanel({ onRefresh: _onRefresh }: TunnelDetailPanelProps) {
  const { selectedTunnel, selectTunnel } = useTunnelStore();
  const [activeTab, setActiveTab] = useState<'info' | 'ports' | 'access'>('info');
  const [tunnelDetails, setTunnelDetails] = useState<string>('');
  const [_isLoading, setIsLoading] = useState(false);
  const [isHosting, setIsHosting] = useState(false);
  const [isAlreadyHosted, setIsAlreadyHosted] = useState(false);
  const [startTime, setStartTime] = useState<string | null>(null);
  const [isRestarting, setIsRestarting] = useState(false);

  useEffect(() => {
    if (selectedTunnel) {
      loadTunnelDetails();
    }
  }, [selectedTunnel]);

  const loadTunnelDetails = async () => {
    if (!selectedTunnel) return;

    setIsLoading(true);
    try {
      const details = await tunnelApi.show(selectedTunnel.tunnelId);
      setTunnelDetails(details);

      // Check if tunnel is already hosted by looking for "Host connections"
      const hostConnectionsMatch = details.match(/Host connections\s*:\s*(\d+)/);
      if (hostConnectionsMatch) {
        const hostConnections = parseInt(hostConnectionsMatch[1]);
        const isHosted = hostConnections > 0;
        setIsAlreadyHosted(isHosted);

        // If tunnel is hosted, try to get start time
        if (isHosted) {
          try {
            const time = await tunnelApi.getStartTime(selectedTunnel.tunnelId);
            setStartTime(time);
          } catch (error) {
            console.log('Could not get start time:', error);
            setStartTime(null);
          }
        } else {
          setStartTime(null);
        }
      } else {
        setIsAlreadyHosted(false);
        setStartTime(null);
      }
    } catch (error) {
      console.error('Failed to load tunnel details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartHost = async () => {
    if (!selectedTunnel || selectedTunnel.ports.length === 0) {
      alert('Please add at least one port before hosting the tunnel');
      return;
    }

    setIsHosting(true);
    try {
      await tunnelApi.host({
        tunnelId: selectedTunnel.tunnelId,
        ports: selectedTunnel.ports,
        allowAnonymous: true,
      });

      alert(`Tunnel ${selectedTunnel.tunnelId} is now hosting in the background!`);

      // Refresh tunnel details to show URLs
      setTimeout(() => {
        loadTunnelDetails();
      }, 2000);
    } catch (error) {
      alert('Failed to host tunnel: ' + error);
    } finally {
      setIsHosting(false);
    }
  };

  const handleForceRestart = async () => {
    if (!selectedTunnel) return;

    if (!confirm('Are you sure you want to restart this tunnel? It will briefly disconnect all active connections.')) {
      return;
    }

    setIsRestarting(true);
    try {
      await tunnelApi.restart({
        tunnelId: selectedTunnel.tunnelId,
        ports: selectedTunnel.ports,
        allowAnonymous: true,
      });

      alert('Tunnel restarted successfully!');

      // Refresh tunnel details to show new start time
      setTimeout(() => {
        loadTunnelDetails();
      }, 2000);
    } catch (error) {
      alert('Failed to restart tunnel: ' + error);
    } finally {
      setIsRestarting(false);
    }
  };

  if (!selectedTunnel) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="card max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-white">{selectedTunnel.tunnelId}</h2>
            {selectedTunnel.description && (
              <p className="text-gray-400 mt-1">{selectedTunnel.description}</p>
            )}
          </div>
          <button
            onClick={() => selectTunnel(null)}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-700 flex-shrink-0">
          {[
            { id: 'info', label: 'Information' },
            { id: 'ports', label: 'Ports' },
            { id: 'access', label: 'Access Control' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-primary-400 border-b-2 border-primary-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'info' && (
            <div className="space-y-4">
              {/* Host Status / Button */}
              {isAlreadyHosted ? (
                <div className="bg-green-900/20 border border-green-500/50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 bg-green-500/20 rounded-full">
                        <span className="text-2xl">✓</span>
                      </div>
                      <div>
                        <h3 className="text-green-400 font-semibold mb-1">Tunnel is Currently Hosting</h3>
                        <p className="text-sm text-gray-400">
                          This tunnel is active and hosting connections. URLs are available below.
                        </p>
                        {startTime && (
                          <p className="text-xs text-gray-500 mt-1">
                            Started: {startTime}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={handleForceRestart}
                      disabled={isRestarting}
                      className="btn-secondary px-4 py-2 text-sm"
                    >
                      {isRestarting ? 'Restarting...' : 'Force Restart'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-primary-900/20 border border-primary-500/50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-semibold mb-1">Tunnel Hosting</h3>
                      <p className="text-sm text-gray-400">
                        Start hosting this tunnel to activate ports and generate URLs
                      </p>
                    </div>
                    <button
                      onClick={handleStartHost}
                      disabled={isHosting || selectedTunnel.ports.length === 0}
                      className="btn-primary px-6"
                    >
                      {isHosting ? 'Starting...' : 'Start Hosting'}
                    </button>
                  </div>
                  {selectedTunnel.ports.length === 0 && (
                    <p className="text-xs text-yellow-400 mt-2">
                      ⚠️ Add at least one port in the Ports tab before hosting
                    </p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400">Tunnel ID</label>
                  <p className="text-white font-mono">{selectedTunnel.tunnelId}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Status</label>
                  <p className="text-white">
                    <span className={`badge ${
                      selectedTunnel.status === 'active' ? 'badge-success' :
                      selectedTunnel.status === 'expired' ? 'badge-danger' :
                      'badge-warning'
                    }`}>
                      {selectedTunnel.status}
                    </span>
                  </p>
                </div>
                {selectedTunnel.expiresAt && (
                  <div>
                    <label className="text-sm text-gray-400">Expires At</label>
                    <p className="text-white">
                      {new Date(selectedTunnel.expiresAt).toLocaleString()}
                    </p>
                  </div>
                )}
                <div>
                  <label className="text-sm text-gray-400">Ports</label>
                  <p className="text-white">{selectedTunnel.ports.join(', ')}</p>
                </div>
              </div>

              {selectedTunnel.tags && selectedTunnel.tags.length > 0 && (
                <div>
                  <label className="text-sm text-gray-400 block mb-2">Tags</label>
                  <div className="flex gap-2 flex-wrap">
                    {selectedTunnel.tags.map((tag) => (
                      <span key={tag} className="badge badge-info">{tag}</span>
                    ))}
                  </div>
                </div>
              )}

              {tunnelDetails && (
                <div>
                  <label className="text-sm text-gray-400 block mb-2">Raw Details</label>
                  <pre className="bg-gray-800 p-4 rounded-lg text-sm text-gray-300 overflow-x-auto">
                    {tunnelDetails}
                  </pre>
                </div>
              )}
            </div>
          )}

          {activeTab === 'ports' && (
            <PortManager tunnelId={selectedTunnel.tunnelId} onPortsChanged={loadTunnelDetails} />
          )}

          {activeTab === 'access' && (
            <AccessControlManager tunnelId={selectedTunnel.tunnelId} />
          )}
        </div>
      </div>
    </div>
  );
}
