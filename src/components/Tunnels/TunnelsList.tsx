import { useEffect } from 'react';
import { useTunnelStore } from '../../stores/tunnelStore';
import { useUiStore } from '../../stores/uiStore';
import { tunnelApi } from '../../lib/api';

export default function TunnelsList() {
  const { tunnels, setTunnels, setLoading, setError } = useTunnelStore();
  const { selectTunnel } = useUiStore();

  useEffect(() => {
    loadTunnels();
  }, []);

  const loadTunnels = async () => {
    try {
      setLoading(true);
      const result = await tunnelApi.list();
      setTunnels(result);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load tunnels');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">All Tunnels</h1>
        <button
          onClick={loadTunnels}
          className="btn-secondary"
        >
          Refresh
        </button>
      </div>

      <div className="grid gap-4">
        {tunnels.map((tunnel) => (
          <div key={tunnel.tunnelId} className="card">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold mb-2">{tunnel.tunnelId}</h3>
                {tunnel.description && (
                  <p className="text-gray-400 mb-2">{tunnel.description}</p>
                )}
                <div className="flex gap-2 mb-2">
                  <span className="badge badge-success">{tunnel.status}</span>
                  {tunnel.ports.length > 0 && (
                    <span className="badge badge-info">{tunnel.ports.length} ports</span>
                  )}
                </div>
                {tunnel.ports.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tunnel.ports.map((port) => (
                      <span key={port} className="badge badge-info">{port}</span>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => selectTunnel(tunnel)}
                className="btn-primary"
              >
                Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
