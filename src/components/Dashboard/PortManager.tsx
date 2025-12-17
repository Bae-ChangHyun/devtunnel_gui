import { useState, useEffect } from 'react';
import { portApi, tunnelApi } from '../../lib/api';
import type { Port, Protocol } from '../../types/devtunnel';
import { toast } from '../Toast';

interface PortManagerProps {
  tunnelId: string;
  onPortsChanged?: () => void;
  tunnelDetails?: string; // Pre-loaded tunnel details to avoid redundant API calls
}

export default function PortManager({ tunnelId, onPortsChanged, tunnelDetails: propTunnelDetails }: PortManagerProps) {
  const [ports, setPorts] = useState<Port[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newPort, setNewPort] = useState('');
  const [newProtocol, setNewProtocol] = useState<Protocol>('auto');
  const [newDescription, setNewDescription] = useState('');
  const [editingPort, setEditingPort] = useState<number | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const [editProtocol, setEditProtocol] = useState<Protocol>('auto');
  const [pingingPort, setPingingPort] = useState<number | null>(null);
  const [pingResults, setPingResults] = useState<Map<number, { success: boolean; time: number; status?: number }>>(new Map());

  useEffect(() => {
    loadPorts();
  }, [tunnelId, propTunnelDetails]);

  const loadPorts = async () => {
    setIsLoading(true);
    try {
      // Use pre-loaded tunnel details if available, otherwise fetch
      const details = propTunnelDetails || await tunnelApi.show(tunnelId);

      // Parse ports from the raw details output
      const portNumbers: number[] = [];
      const portUrls: Map<number, string> = new Map();
      const lines = details.split('\n');
      let inPortsSection = false;

      for (const line of lines) {
        const trimmed = line.trim();

        // Check if we're entering the Ports section
        if (trimmed.startsWith('Ports') && trimmed.includes(':')) {
          inPortsSection = true;
          continue;
        }

        // If in ports section and line starts with a number
        if (inPortsSection && trimmed.match(/^\d+/)) {
          // Try to match: portNumber  protocol  url (optional)
          const matchWithUrl = trimmed.match(/^(\d+)\s+(\w+)\s+(https?:\/\/[^\s]+)/);
          if (matchWithUrl) {
            const [, portNum, , uri] = matchWithUrl;
            const portNumber = parseInt(portNum);
            portNumbers.push(portNumber);
            portUrls.set(portNumber, uri);
          } else {
            // Try to match: portNumber  protocol (no url - tunnel not hosted)
            const matchWithoutUrl = trimmed.match(/^(\d+)\s+(\w+)\s*$/);
            if (matchWithoutUrl) {
              const [, portNum] = matchWithoutUrl;
              portNumbers.push(parseInt(portNum));
            }
          }
        } else if (inPortsSection && trimmed.match(/^Tunnel/)) {
          // End of ports section
          break;
        }
      }

      // Now fetch full details for each port in parallel to get description
      const portPromises = portNumbers.map(async (portNumber) => {
        try {
          const portDetails = await portApi.show(tunnelId, portNumber);
          // Add the URL if it was found in the tunnel show output
          if (portUrls.has(portNumber)) {
            portDetails.portForwardingUris = [portUrls.get(portNumber)!];
          }
          return portDetails;
        } catch (error) {
          console.error(`Failed to get details for port ${portNumber}:`, error);
          // Fallback to basic info if port show fails
          return {
            portNumber,
            protocol: 'auto' as const,
            portForwardingUris: portUrls.has(portNumber) ? [portUrls.get(portNumber)!] : [],
          };
        }
      });

      const portList = await Promise.all(portPromises);
      setPorts(portList);
    } catch (error) {
      console.error('Failed to load ports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPort = async () => {
    if (!newPort) return;

    setIsAdding(true);
    try {
      await portApi.create({
        tunnelId,
        portNumber: parseInt(newPort),
        protocol: newProtocol,
        description: newDescription || undefined,
      });

      setNewPort('');
      setNewProtocol('auto');
      setNewDescription('');

      // Restart tunnel if it's being hosted
      try {
        await tunnelApi.restart({
          tunnelId,
          ports: [],
          allowAnonymous: true,
        });
      } catch (restartError) {
        // If restart fails, it might not be hosting, which is fine
        console.log('Tunnel restart skipped (might not be hosting):', restartError);
      }

      await loadPorts();
      if (onPortsChanged) onPortsChanged();
      toast.success(`Port ${newPort} added successfully`);
    } catch (error) {
      toast.error(`Failed to add port: ${error}`);
    } finally {
      setIsAdding(false);
    }
  };

  async function handleDeletePort(portNumber: number) {
    if (!confirm(`Delete port ${portNumber}?`)) return;

    try {
      await portApi.delete(tunnelId, portNumber);

      // Restart tunnel if it's being hosted
      try {
        await tunnelApi.restart({
          tunnelId,
          ports: [],
          allowAnonymous: true,
        });
      } catch (restartError) {
        // If restart fails, it might not be hosting, which is fine
        console.log('Tunnel restart skipped (might not be hosting):', restartError);
      }

      await loadPorts();
      if (onPortsChanged) onPortsChanged();
      toast.success(`Port ${portNumber} deleted successfully`);
    } catch (error) {
      toast.error(`Failed to delete port: ${error}`);
    }
  }

  const handleEditPort = (port: Port) => {
    setEditingPort(port.portNumber);
    setEditDescription(port.description || '');
    setEditProtocol(port.protocol || 'auto');
  };

  const handleSavePort = async (portNumber: number) => {
    try {
      await portApi.update({
        tunnelId,
        portNumber,
        description: editDescription || undefined,
        protocol: editProtocol,
      });
      setEditingPort(null);
      setEditDescription('');
      setEditProtocol('auto');

      // Restart tunnel to apply protocol changes
      try {
        await tunnelApi.restart({
          tunnelId,
          ports: [],
          allowAnonymous: true,
        });
      } catch (restartError) {
        console.log('Tunnel restart skipped (might not be hosting):', restartError);
      }

      await loadPorts();
      toast.success(`Port ${portNumber} updated successfully`);
    } catch (error) {
      toast.error(`Failed to update port: ${error}`);
    }
  };

  const handleCancelEdit = () => {
    setEditingPort(null);
    setEditDescription('');
    setEditProtocol('auto');
  };

  const handlePing = async (port: Port) => {
    if (!port.portForwardingUris || port.portForwardingUris.length === 0) {
      toast.warning('No URL available to ping. Make sure the tunnel is hosting.');
      return;
    }

    setPingingPort(port.portNumber);
    try {
      const url = port.portForwardingUris[0];
      const result = await portApi.ping(url);

      setPingResults(prev => new Map(prev).set(port.portNumber, {
        success: result.success,
        time: result.responseTimeMs,
        status: result.statusCode,
      }));

      if (result.success) {
        console.log(`✓ Port ${port.portNumber} is reachable (${result.responseTimeMs}ms, HTTP ${result.statusCode})`);
      } else {
        console.error(`✗ Port ${port.portNumber} ping failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to ping port:', error);
      setPingResults(prev => new Map(prev).set(port.portNumber, {
        success: false,
        time: 0,
      }));
    } finally {
      setPingingPort(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Add Port Form */}
      <div className="card bg-gray-750">
        <h3 className="text-lg font-semibold text-white mb-4">Add New Port</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Port Number</label>
            <input
              type="number"
              value={newPort}
              onChange={(e) => setNewPort(e.target.value)}
              placeholder="8080"
              className="input-field w-full"
              min="1"
              max="65535"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Protocol</label>
            <select
              value={newProtocol}
              onChange={(e) => setNewProtocol(e.target.value as Protocol)}
              className="input-field w-full"
            >
              <option value="auto">Auto</option>
              <option value="http">HTTP</option>
              <option value="https">HTTPS</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm text-gray-400 mb-1">Description (optional)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="API server, Web app..."
                className="input-field flex-1"
              />
              <button
                onClick={handleAddPort}
                disabled={!newPort || isAdding}
                className="btn-primary px-6"
              >
                {isAdding ? 'Adding...' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Port List */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Active Ports</h3>
        {isLoading ? (
          <div className="text-center text-gray-400 py-8">Loading ports...</div>
        ) : ports.length === 0 ? (
          <div className="card text-center text-gray-400 py-8">
            No ports configured
          </div>
        ) : (
          <div className="space-y-3">
            {ports.map((port) => (
              <div
                key={port.portNumber}
                className="card"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-primary-400">
                        {port.portNumber}
                      </span>
                      {editingPort === port.portNumber ? (
                        <div className="flex items-center gap-2 flex-1 flex-wrap">
                          <select
                            value={editProtocol}
                            onChange={(e) => setEditProtocol(e.target.value as Protocol)}
                            className="input-field text-sm"
                          >
                            <option value="auto">Auto</option>
                            <option value="http">HTTP</option>
                            <option value="https">HTTPS</option>
                          </select>
                          <input
                            type="text"
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            placeholder="Enter description..."
                            className="input-field text-sm flex-1 min-w-[200px]"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSavePort(port.portNumber)}
                            className="btn-primary text-xs px-3 py-1"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="btn-secondary text-xs px-3 py-1"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="badge badge-info">
                            {port.protocol}
                          </span>
                          {port.description ? (
                            <span className="text-sm text-gray-400">
                              {port.description}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-600 italic">
                              No description
                            </span>
                          )}
                          <button
                            onClick={() => handleEditPort(port)}
                            className="text-xs text-primary-400 hover:text-primary-300"
                          >
                            Edit
                          </button>
                        </div>
                      )}
                    </div>
                    {port.portForwardingUris && port.portForwardingUris.length > 0 && (
                      <div className="mt-2">
                        <div className="mb-1">
                          <span className="text-xs text-gray-500">Access URLs:</span>
                        </div>
                        <div className="mt-1 space-y-1">
                          {port.portForwardingUris.map((uri, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <code className="text-xs bg-gray-700 px-2 py-1 rounded text-primary-300">
                                {uri}
                              </code>
                              <button
                                onClick={() => navigator.clipboard.writeText(uri)}
                                className="text-xs text-gray-400 hover:text-white"
                              >
                                Copy
                              </button>
                            </div>
                          ))}
                        </div>
                        {pingResults.has(port.portNumber) && (
                          <div className={`mt-2 text-xs px-2 py-1 rounded ${
                            pingResults.get(port.portNumber)!.success
                              ? 'bg-green-900/30 text-green-400 border border-green-500/30'
                              : 'bg-red-900/30 text-red-400 border border-red-500/30'
                          }`}>
                            {pingResults.get(port.portNumber)!.success ? (
                              <>
                                ✓ Reachable ({pingResults.get(port.portNumber)!.time}ms)
                                {pingResults.get(port.portNumber)!.status && (
                                  <> - HTTP {pingResults.get(port.portNumber)!.status}</>
                                )}
                              </>
                            ) : (
                              '✗ Not reachable'
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    {port.inspectUri && (
                      <div className="mt-2">
                        <a
                          href={port.inspectUri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary-400 hover:underline"
                        >
                          🔍 Inspect traffic
                        </a>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {port.portForwardingUris && port.portForwardingUris.length > 0 && (
                      <button
                        onClick={() => handlePing(port)}
                        disabled={pingingPort === port.portNumber}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {pingingPort === port.portNumber ? 'Pinging...' : 'Ping'}
                      </button>
                    )}
                    <button
                      onClick={() => handleDeletePort(port.portNumber)}
                      className="btn-danger"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
