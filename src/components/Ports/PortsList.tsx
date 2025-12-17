import { useEffect, useState } from 'react';
import { tunnelApi } from '../../lib/api';

interface PortWithTunnel {
  tunnelId: string;
  port: number;
  protocol?: string;
  description?: string;
}

export default function PortsList() {
  const [ports, setPorts] = useState<PortWithTunnel[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadPorts();
  }, []);

  const loadPorts = async () => {
    setIsLoading(true);
    try {
      const tunnels = await tunnelApi.list();
      const allPorts: PortWithTunnel[] = tunnels.flatMap((tunnel) =>
        tunnel.ports.map((port) => ({
          tunnelId: tunnel.tunnelId,
          port,
          protocol: 'http',
          description: undefined
        }))
      );
      setPorts(allPorts);
    } catch (error) {
      console.error('Failed to load ports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">All Ports</h1>
          <p className="text-gray-400 mt-1">View all ports across all tunnels</p>
        </div>
        <button onClick={loadPorts} className="btn-secondary">
          {isLoading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {isLoading ? (
        <div className="card text-center py-12">
          <div className="text-gray-400">Loading ports...</div>
        </div>
      ) : ports.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-gray-400">No ports found</div>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-800">
              <tr className="border-b border-gray-700">
                <th className="text-left p-4 font-semibold">Tunnel ID</th>
                <th className="text-left p-4 font-semibold">Port</th>
                <th className="text-left p-4 font-semibold">Protocol</th>
              </tr>
            </thead>
            <tbody>
              {ports.map(({ tunnelId, port, protocol }, idx) => (
                <tr key={idx} className="border-b border-gray-800 hover:bg-gray-800/50">
                  <td className="p-4 text-primary-400">{tunnelId}</td>
                  <td className="p-4 font-mono font-bold">{port}</td>
                  <td className="p-4">
                    <span className="badge badge-info">{protocol}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
