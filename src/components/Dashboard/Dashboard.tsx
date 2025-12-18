import { useEffect, useState } from 'react';
import { useTunnelStore } from '../../stores/tunnelStore';
import { tunnelApi } from '../../lib/api';
import TunnelCard from './TunnelCard';
import CreateTunnelModal from './CreateTunnelModal';
import TunnelDetailPanel from './TunnelDetailPanel';

export default function Dashboard() {
  const { tunnels, setTunnels, setLoading, setError, selectedTunnel, isTunnelListCacheValid, invalidateTunnelList } = useTunnelStore();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [filterTag, setFilterTag] = useState('');

  useEffect(() => {
    // Only load tunnels if cache is invalid
    if (!isTunnelListCacheValid()) {
      loadTunnels();
    }
  }, []);

  const loadTunnels = async (forceRefresh = false) => {
    // Check cache before loading
    if (!forceRefresh && isTunnelListCacheValid()) {
      return;
    }

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
    <div className="space-y-8 p-8">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-white tracking-tight">
            Tunnels
          </h2>
          <div className="flex items-center gap-4 mt-2">
            <p className="text-sm text-zinc-400">
              {tunnels.length} total
            </p>
            {tunnels.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                <span className="text-sm text-zinc-400">
                  {tunnels.filter(t => t.status === 'active').length} active
                </span>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="btn-primary flex items-center gap-2"
        >
          <span>+</span>
          <span>Create Tunnel</span>
        </button>
      </div>

      {/* Filter Tags */}
      {allTags.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs text-zinc-500 uppercase tracking-wider">Filter:</span>
          <button
            onClick={() => setFilterTag('')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              !filterTag
                ? 'bg-primary-500/10 text-primary-400 border border-primary-500/20'
                : 'bg-dark-700 text-zinc-400 hover:bg-dark-600'
            }`}
          >
            All
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setFilterTag(tag)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filterTag === tag
                  ? 'bg-primary-500/10 text-primary-400 border border-primary-500/20'
                  : 'bg-dark-700 text-zinc-400 hover:bg-dark-600'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Tunnels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTunnels.length === 0 ? (
          <div className="col-span-full card text-center py-16">
            <p className="text-zinc-400 text-base">No tunnels found</p>
            <p className="text-zinc-600 text-sm mt-1.5">
              Create your first tunnel to get started
            </p>
          </div>
        ) : (
          filteredTunnels.map((tunnel) => (
            <TunnelCard
              key={tunnel.tunnelId}
              tunnel={tunnel}
              onRefresh={() => {
                invalidateTunnelList();
                loadTunnels(true);
              }}
            />
          ))
        )}
      </div>

      {/* Modals */}
      {isCreateModalOpen && (
        <CreateTunnelModal
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            setIsCreateModalOpen(false);
            invalidateTunnelList();
            loadTunnels(true);
          }}
        />
      )}

      {/* Detail Panel */}
      {selectedTunnel && (
        <TunnelDetailPanel
          onRefresh={() => {
            invalidateTunnelList();
            loadTunnels(true);
          }}
        />
      )}
    </div>
  );
}
