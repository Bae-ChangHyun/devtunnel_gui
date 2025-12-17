import { useState } from 'react';
import { tunnelApi } from '../../lib/api';
import type { CreateTunnelRequest } from '../../types/devtunnel';

interface CreateTunnelModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateTunnelModal({ onClose, onSuccess }: CreateTunnelModalProps) {
  const [tunnelId, setTunnelId] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [allowAnonymous, setAllowAnonymous] = useState(false);
  const [expiration, setExpiration] = useState('30d');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const request: CreateTunnelRequest = {
      tunnelId: tunnelId.trim() || undefined,
      description: description.trim() || undefined,
      tags: tags.length > 0 ? tags : undefined,
      allowAnonymous,
      expiration,
    };

    try {
      await tunnelApi.create(request);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create tunnel');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Create New Tunnel</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-600 rounded-lg p-3 text-red-200 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tunnel ID */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Tunnel ID (optional)
            </label>
            <input
              type="text"
              value={tunnelId}
              onChange={(e) => setTunnelId(e.target.value)}
              placeholder="Leave empty for auto-generated ID"
              className="input-field w-full"
            />
            <p className="text-xs text-gray-500 mt-1">
              Custom identifier for your tunnel
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe this tunnel..."
              rows={3}
              className="input-field w-full resize-none"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Tags
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Add tag..."
                className="input-field flex-1"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="btn-secondary"
              >
                Add
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="badge badge-info flex items-center gap-1"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-red-300"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Allow Anonymous */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="allowAnonymous"
              checked={allowAnonymous}
              onChange={(e) => setAllowAnonymous(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="allowAnonymous" className="text-sm text-gray-300">
              Allow anonymous access
            </label>
          </div>

          {/* Expiration */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Expiration
            </label>
            <select
              value={expiration}
              onChange={(e) => setExpiration(e.target.value)}
              className="input-field w-full"
            >
              <option value="1h">1 hour</option>
              <option value="6h">6 hours</option>
              <option value="12h">12 hours</option>
              <option value="1d">1 day</option>
              <option value="7d">7 days</option>
              <option value="30d">30 days</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary flex-1"
            >
              {isLoading ? 'Creating...' : 'Create Tunnel'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
