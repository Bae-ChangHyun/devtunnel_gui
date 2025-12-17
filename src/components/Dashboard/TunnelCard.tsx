import { useState, memo, useMemo, useCallback } from 'react';
import type { TunnelListItem } from '../../types/devtunnel';
import { useTunnelStore } from '../../stores/tunnelStore';
import { tunnelApi } from '../../lib/api';

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
      onRefresh();
    } catch (error) {
      alert('Failed to delete tunnel: ' + error);
    } finally {
      setIsDeleting(false);
    }
  }, [tunnel.tunnelId, onRefresh]);

  const handleSelect = useCallback(() => {
    selectTunnel(tunnel);
  }, [selectTunnel, tunnel]);

  const handleManage = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    selectTunnel(tunnel);
  }, [selectTunnel, tunnel]);

  const statusColor = useMemo(() => {
    switch (tunnel.status) {
      case 'active':
        return 'bg-green-900 text-green-200';
      case 'stopped':
        return 'bg-gray-600 text-gray-200';
      case 'expired':
        return 'bg-red-900 text-red-200';
      default:
        return 'bg-yellow-900 text-yellow-200';
    }
  }, [tunnel.status]);

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

  return (
    <div
      onClick={handleSelect}
      className="card hover:border-primary-500 cursor-pointer transition-all duration-200 group relative overflow-hidden bg-gray-800/90 hover:shadow-xl hover:shadow-primary-500/10 hover:-translate-y-0.5"
    >
      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-white truncate text-xl group-hover:text-primary-400 transition-colors duration-200">
              {tunnel.tunnelId}
            </h3>
            {tunnel.description && (
              <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                {tunnel.description}
              </p>
            )}
          </div>

          <span className={`badge ${statusColor} ml-2 flex-shrink-0`}>
            {tunnel.status}
          </span>
        </div>

        {/* Ports */}
        <div className="flex items-center gap-2 mb-3">
        <span className="text-sm text-gray-400">Ports:</span>
        <div className="flex gap-1 flex-wrap">
          {tunnel.ports.map((port) => (
            <span
              key={port}
              className="px-2 py-1 bg-gray-700 rounded text-sm text-gray-300"
            >
              {port}
            </span>
          ))}
        </div>
      </div>

      {/* Tags */}
      {tunnel.tags && tunnel.tags.length > 0 && (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm text-gray-400">Tags:</span>
          <div className="flex gap-1 flex-wrap">
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
        <div className="text-sm text-gray-400 mb-3">
          {expirationInfo}
        </div>
      )}

        {/* Actions */}
        <div className="flex gap-2 mt-4 pt-4 border-t border-gray-700/50">
          <button
            onClick={handleManage}
            className="flex-1 bg-primary-600 hover:bg-primary-700 text-white px-3 py-2 rounded text-sm transition-colors duration-150"
          >
            Manage
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="btn-danger text-sm px-3 py-2 transition-colors duration-150"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default memo(TunnelCard);
