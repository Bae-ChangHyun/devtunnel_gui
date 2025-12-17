import { useEffect, useState } from 'react';
import { tunnelApi } from '../../lib/api';

export default function AccessControlList() {
  const [tunnels, setTunnels] = useState<Array<{ id: string; access: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadTunnels();
  }, []);

  const loadTunnels = async () => {
    setIsLoading(true);
    try {
      const result = await tunnelApi.list();
      setTunnels(result.map((t) => ({ id: t.tunnelId, access: 'Anonymous' })));
    } catch (error) {
      console.error('Failed to load tunnels:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Access Control</h1>
          <p className="text-gray-400 mt-1">Manage tunnel access permissions</p>
        </div>
        <button onClick={loadTunnels} className="btn-secondary">
          {isLoading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {isLoading ? (
        <div className="card text-center py-12">
          <div className="text-gray-400">Loading...</div>
        </div>
      ) : tunnels.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-gray-400">No tunnels found</div>
        </div>
      ) : (
        <div className="space-y-4">
          {tunnels.map(tunnel => (
            <div key={tunnel.id} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">{tunnel.id}</h3>
                  <p className="text-sm text-gray-400 mt-1">Access: {tunnel.access}</p>
                </div>
                <button className="btn-primary">Configure</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
