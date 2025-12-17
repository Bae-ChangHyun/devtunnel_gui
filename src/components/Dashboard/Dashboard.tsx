import { useEffect, useState } from 'react';
import { useTunnelStore } from '../../stores/tunnelStore';
import { tunnelApi } from '../../lib/api';
import TunnelCard from './TunnelCard';
import CreateTunnelModal from './CreateTunnelModal';
import TunnelDetailPanel from './TunnelDetailPanel';

export default function Dashboard() {
  const { tunnels, setTunnels, setLoading, setError, selectedTunnel } = useTunnelStore();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [filterTag, setFilterTag] = useState('');

  useEffect(() => {
    loadTunnels();
  }, []);

  const loadTunnels = async () => {
    setLoading(true);
    setError(null);

    try {
      const tunnelList = await tunnelApi.list();
      setTunnels(tunnelList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tunnels');
    } finally {
      setLoading(false);
    }
  };

  const filteredTunnels = filterTag
    ? tunnels.filter((t) => t.tags?.includes(filterTag))
    : tunnels;

  const allTags = Array.from(
    new Set(tunnels.flatMap((t) => t.tags || []))
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between bg-gray-800/70 p-6 rounded-xl border border-gray-700/50 shadow-lg">
        <div>
          <h2 className="text-4xl font-bold text-white">
            Tunnels Dashboard
          </h2>
          <div className="flex items-center gap-3 mt-2">
            <p className="text-gray-400">
              {tunnels.length} tunnel{tunnels.length !== 1 ? 's' : ''} total
            </p>
            {tunnels.length > 0 && (
              <span className="px-3 py-1 bg-green-500/10 text-green-400 rounded-full text-sm border border-green-500/20">
                {tunnels.filter(t => t.status === 'active').length} active
              </span>
            )}
          </div>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="btn-primary flex items-center gap-2 px-6 py-3 transition-colors duration-150"
        >
          <span className="text-xl">+</span>
          <span>Create Tunnel</span>
        </button>
      </div>

      {/* Filter Tags */}
      {allTags.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-400">Filter by tag:</span>
          <button
            onClick={() => setFilterTag('')}
            className={`px-3 py-1 rounded-full text-sm ${
              !filterTag ? 'bg-primary-600 text-white' : 'bg-gray-700 text-gray-300'
            }`}
          >
            All
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setFilterTag(tag)}
              className={`px-3 py-1 rounded-full text-sm ${
                filterTag === tag
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Tunnels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTunnels.length === 0 ? (
          <div className="col-span-full card text-center py-12">
            <p className="text-gray-400 text-lg">No tunnels found</p>
            <p className="text-gray-500 text-sm mt-2">
              Create your first tunnel to get started
            </p>
          </div>
        ) : (
          filteredTunnels.map((tunnel) => (
            <TunnelCard key={tunnel.tunnelId} tunnel={tunnel} onRefresh={loadTunnels} />
          ))
        )}
      </div>

      {/* Modals */}
      {isCreateModalOpen && (
        <CreateTunnelModal
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            setIsCreateModalOpen(false);
            loadTunnels();
          }}
        />
      )}

      {/* Detail Panel */}
      {selectedTunnel && <TunnelDetailPanel onRefresh={loadTunnels} />}
    </div>
  );
}
