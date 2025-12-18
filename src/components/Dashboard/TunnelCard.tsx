import { useState, memo, useMemo, useCallback } from 'react';
import type { TunnelListItem } from '../../types/devtunnel';
import { useTunnelStore } from '../../stores/tunnelStore';
import { tunnelApi } from '../../lib/api';
import { toast } from '../Toast';

interface TunnelCardProps {
  tunnel: TunnelListItem;
  onRefresh: () => void;
}

function TunnelCard({ tunnel, onRefresh }: TunnelCardProps) {
  const { selectTunnel } = useTunnelStore();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!confirm(`Delete tunnel "${tunnel.tunnelId}"?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      await tunnelApi.delete(tunnel.tunnelId);
      toast.success(`Tunnel "${tunnel.tunnelId}" deleted successfully`);
      onRefresh();
    } catch (error) {
      toast.error(`Failed to delete tunnel: ${error}`);
    } finally {
      setIsDeleting(false);
    }
  }, [tunnel.tunnelId, onRefresh]);

  const handleSelect = useCallback(() => {
    selectTunnel(tunnel);
  }, [selectTunnel, tunnel]);

  const handleSelectKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      selectTunnel(tunnel);
    }
  }, [selectTunnel, tunnel]);

  const handleManage = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    selectTunnel(tunnel);
  }, [selectTunnel, tunnel]);


  const expirationInfo = useMemo(() => {
    if (!tunnel.expiresAt) return null;

    const expiresDate = new Date(tunnel.expiresAt);
    const now = new Date();
    const daysRemaining = Math.ceil(
      (expiresDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysRemaining < 0) return 'Expired';
    if (daysRemaining === 0) return 'Expires today';
    if (daysRemaining === 1) return 'Expires tomorrow';
    return `${daysRemaining} days remaining`;
  }, [tunnel.expiresAt]);

  const statusDotClass = useMemo(() => {
    switch (tunnel.status) {
      case 'active':
        return 'status-dot-active';
      case 'stopped':
        return 'status-dot-stopped';
      case 'expired':
        return 'status-dot-expired';
      default:
        return 'status-dot-stopped';
    }
  }, [tunnel.status]);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleSelect}
      onKeyDown={handleSelectKeyDown}
      aria-label={`Tunnel ${tunnel.tunnelId}`}
      className="card hover:bg-dark-600/50 cursor-pointer transition-all duration-200 group relative"
    >
      <div className="relative">
        {/* Header with status dot */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`status-dot ${statusDotClass}`} />
              <h3 className="font-semibold text-white truncate text-base group-hover:text-primary-400 transition-colors">
                {tunnel.tunnelId}
              </h3>
            </div>
            {tunnel.description && (
              <p className="text-xs text-zinc-500 mt-1.5 line-clamp-2 pl-5">
                {tunnel.description}
              </p>
            )}
          </div>
        </div>

        {/* Ports */}
        {tunnel.ports.length > 0 && (
          <div className="mb-4">
            <span className="text-xs text-zinc-500 uppercase tracking-wider">Ports</span>
            <div className="flex gap-1.5 flex-wrap mt-2">
              {tunnel.ports.map((port) => (
                <span
                  key={port}
                  className="px-2.5 py-1 bg-dark-700 rounded-md text-xs text-zinc-300 font-mono"
                >
                  {port}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {tunnel.tags && tunnel.tags.length > 0 && (
          <div className="mb-4">
            <span className="text-xs text-zinc-500 uppercase tracking-wider">Tags</span>
            <div className="flex gap-1.5 flex-wrap mt-2">
              {tunnel.tags.map((tag) => (
                <span
                  key={tag}
                  className="badge badge-info"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Expiration */}
        {tunnel.expiresAt && (
          <div className="text-xs text-zinc-500 mb-4">
            {expirationInfo}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-4 pt-4 border-t border-zinc-800">
          <button
            onClick={handleManage}
            className="flex-1 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-xs font-medium transition-all"
          >
            Manage
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-4 py-2 bg-dark-700 hover:bg-red-500/10 text-zinc-400 hover:text-red-400 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
            title="Delete tunnel"
            aria-label={`Delete tunnel ${tunnel.tunnelId}`}
          >
            {isDeleting ? '...' : '🗑'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default memo(TunnelCard);
