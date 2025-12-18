import { useState, useEffect, useCallback } from 'react';
import { useTunnelStore } from '../../stores/tunnelStore';
import { tunnelApi } from '../../lib/api';
import { toast } from '../Toast';
import PortManager from './PortManager';
import AccessControlManager from './AccessControlManager';

// Configuration constants
const TUNNEL_REFRESH_DELAY_MS = 2000; // Wait time before refreshing tunnel details after host/restart

// Chevron Down Icon Component
function ChevronDownIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

interface TunnelDetailPanelProps {
  onRefresh: () => void;
}

export default function TunnelDetailPanel({ onRefresh: _onRefresh }: TunnelDetailPanelProps) {
  const { selectedTunnel, selectTunnel, getTunnelDetails, setTunnelDetails: setCachedTunnelDetails, invalidateTunnelDetails } = useTunnelStore();
  const [activeTab, setActiveTab] = useState<'info' | 'ports' | 'access'>('info');
  const [tunnelDetails, setTunnelDetails] = useState<string>('');
  const [_isLoading, setIsLoading] = useState(false);
  const [isHosting, setIsHosting] = useState(false);
  const [isAlreadyHosted, setIsAlreadyHosted] = useState(false);
  const [startTime, setStartTime] = useState<string | null>(null);
  const [isRestarting, setIsRestarting] = useState(false);
  const [isRawDetailsOpen, setIsRawDetailsOpen] = useState(false);

  const parseTunnelDetailsState = useCallback((details: string) => {
    // Check if tunnel is already hosted by looking for "Host connections"
    const hostConnectionsMatch = details.match(/Host connections\s*:\s*(\d+)/);
    if (hostConnectionsMatch) {
      const hostConnections = parseInt(hostConnectionsMatch[1]);
      const isHosted = hostConnections > 0;
      setIsAlreadyHosted(isHosted);

      // If tunnel is hosted, try to get start time
      if (isHosted && selectedTunnel) {
        tunnelApi.getStartTime(selectedTunnel.tunnelId)
          .then(time => setStartTime(time))
          .catch(error => {
            console.log('Could not get start time:', error);
            setStartTime(null);
          });
      } else {
        setStartTime(null);
      }
    } else {
      setIsAlreadyHosted(false);
      setStartTime(null);
    }
  }, [selectedTunnel]);

  const loadTunnelDetails = useCallback(async (forceRefresh = false) => {
    if (!selectedTunnel) return;

    // Check cache first
    if (!forceRefresh) {
      const cached = getTunnelDetails(selectedTunnel.tunnelId);
      if (cached) {
        setTunnelDetails(cached);
        // Parse cached data to update UI states
        parseTunnelDetailsState(cached);
        return;
      }
    }

    setIsLoading(true);
    try {
      const details = await tunnelApi.show(selectedTunnel.tunnelId);
      setTunnelDetails(details);
      setCachedTunnelDetails(selectedTunnel.tunnelId, details);
      parseTunnelDetailsState(details);
    } catch (error) {
      console.error('Failed to load tunnel details:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedTunnel, getTunnelDetails, setCachedTunnelDetails, parseTunnelDetailsState]);

  useEffect(() => {
    if (selectedTunnel) {
      loadTunnelDetails();
    }
  }, [selectedTunnel, loadTunnelDetails]);

  const handleStartHost = async () => {
    if (!selectedTunnel || selectedTunnel.ports.length === 0) {
      toast.warning('Please add at least one port before hosting the tunnel');
      return;
    }

    setIsHosting(true);
    try {
      await tunnelApi.host({
        tunnelId: selectedTunnel.tunnelId,
        ports: selectedTunnel.ports,
        allowAnonymous: true,
      });

      toast.success(`Tunnel ${selectedTunnel.tunnelId} is now hosting in the background!`);

      // Invalidate cache and refresh tunnel details to show URLs
      invalidateTunnelDetails(selectedTunnel.tunnelId);
      setTimeout(() => {
        loadTunnelDetails(true);
      }, TUNNEL_REFRESH_DELAY_MS);
    } catch (error) {
      toast.error(`Failed to host tunnel: ${error}`);
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

      toast.success('Tunnel restarted successfully!');

      // Invalidate cache and refresh tunnel details to show new start time
      invalidateTunnelDetails(selectedTunnel.tunnelId);
      setTimeout(() => {
        loadTunnelDetails(true);
      }, TUNNEL_REFRESH_DELAY_MS);
    } catch (error) {
      toast.error(`Failed to restart tunnel: ${error}`);
    } finally {
      setIsRestarting(false);
    }
  };

  if (!selectedTunnel) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="card max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col bg-dark-800">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            {isAlreadyHosted && (
              <div className="status-dot status-dot-active" />
            )}
            <div>
              <h2 className="text-xl font-semibold text-white tracking-tight">{selectedTunnel.tunnelId}</h2>
              {selectedTunnel.description && (
                <p className="text-zinc-500 text-sm mt-0.5">{selectedTunnel.description}</p>
              )}
            </div>
          </div>
          <button
            onClick={() => selectTunnel(null)}
            className="text-zinc-400 hover:text-white text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-zinc-800 flex-shrink-0" role="tablist" aria-label="Tunnel details tabs">
          {[
            { id: 'info', label: 'Information' },
            { id: 'ports', label: 'Ports' },
            { id: 'access', label: 'Access Control' },
          ].map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`${tab.id}-panel`}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 font-medium text-sm transition-all relative ${
                activeTab === tab.id
                  ? 'text-white'
                  : 'text-zinc-500 hover:text-white'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500" />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'info' && (
            <div className="space-y-6">
              {/* Host Status / Button */}
              <div className="flex items-center justify-between p-4 bg-dark-700 rounded-lg">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-medium text-white">Host Status</h3>
                    {isAlreadyHosted && (
                      <span className="text-xs text-emerald-400">Active</span>
                    )}
                  </div>
                  {isAlreadyHosted ? (
                    <p className="text-xs text-zinc-400">
                      {startTime ? `Started: ${startTime}` : 'Tunnel is hosting connections'}
                    </p>
                  ) : (
                    <p className="text-xs text-zinc-400">
                      {selectedTunnel.ports.length === 0
                        ? 'Add ports before hosting'
                        : 'Ready to host'}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  {isAlreadyHosted ? (
                    <button
                      onClick={handleForceRestart}
                      disabled={isRestarting}
                      className="btn-secondary text-xs"
                    >
                      {isRestarting ? 'Restarting...' : 'Restart'}
                    </button>
                  ) : (
                    <button
                      onClick={handleStartHost}
                      disabled={isHosting || selectedTunnel.ports.length === 0}
                      className="btn-primary text-xs"
                    >
                      {isHosting ? 'Starting...' : 'Start Host'}
                    </button>
                  )}
                </div>
              </div>

              {/* Information Grid */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <label className="text-xs text-zinc-500 uppercase tracking-wider">Tunnel ID</label>
                  <p className="text-sm text-white font-mono mt-1">{selectedTunnel.tunnelId}</p>
                </div>
                <div>
                  <label className="text-xs text-zinc-500 uppercase tracking-wider">Status</label>
                  <p className="mt-1">
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
                    <label className="text-xs text-zinc-500 uppercase tracking-wider">Expires At</label>
                    <p className="text-sm text-white mt-1">
                      {new Date(selectedTunnel.expiresAt).toLocaleString()}
                    </p>
                  </div>
                )}
                <div>
                  <label className="text-xs text-zinc-500 uppercase tracking-wider">Ports</label>
                  <p className="text-sm text-white mt-1 font-mono">
                    {selectedTunnel.ports.length > 0 ? selectedTunnel.ports.join(', ') : 'None'}
                  </p>
                </div>
              </div>

              {/* Tags */}
              {selectedTunnel.tags && selectedTunnel.tags.length > 0 && (
                <div>
                  <label className="text-xs text-zinc-500 uppercase tracking-wider block mb-2">Tags</label>
                  <div className="flex gap-2 flex-wrap">
                    {selectedTunnel.tags.map((tag) => (
                      <span key={tag} className="badge badge-info">{tag}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Raw Details Accordion */}
              {tunnelDetails && (
                <div className="border border-zinc-800 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setIsRawDetailsOpen(!isRawDetailsOpen)}
                    className="w-full flex items-center justify-between p-4 bg-dark-700 hover:bg-dark-600 transition-colors"
                  >
                    <span className="text-xs text-zinc-400 uppercase tracking-wider font-medium">
                      Advanced Details
                    </span>
                    <ChevronDownIcon
                      className={`w-4 h-4 text-zinc-400 transition-transform ${
                        isRawDetailsOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isRawDetailsOpen && (
                    <div className="p-4 bg-dark-900">
                      <pre className="text-xs text-zinc-400 overflow-x-auto font-mono leading-relaxed">
                        {tunnelDetails}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'ports' && (
            <PortManager
              tunnelId={selectedTunnel.tunnelId}
              onPortsChanged={() => {
                invalidateTunnelDetails(selectedTunnel.tunnelId);
                loadTunnelDetails(true);
              }}
              tunnelDetails={tunnelDetails}
            />
          )}

          {activeTab === 'access' && (
            <AccessControlManager
              tunnelId={selectedTunnel.tunnelId}
              tunnelDetails={tunnelDetails}
              onAccessChanged={() => {
                invalidateTunnelDetails(selectedTunnel.tunnelId);
                loadTunnelDetails(true);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
