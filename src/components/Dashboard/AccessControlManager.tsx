import { useState, useEffect } from 'react';
import { accessApi } from '../../lib/api';
import { ACCESS_PRESETS, type AccessPresetType } from '../../types/devtunnel';
import { toast } from '../Toast';

interface AccessControlManagerProps {
  tunnelId: string;
  tunnelDetails?: string; // Pre-loaded tunnel details to avoid redundant API calls
  onAccessChanged?: () => void;
}

export default function AccessControlManager({ tunnelId, tunnelDetails: propTunnelDetails, onAccessChanged }: AccessControlManagerProps) {
  const [accessInfo, setAccessInfo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<AccessPresetType>('public-demo');
  const [customExpiration, setCustomExpiration] = useState('24h');
  const [customOrgId, setCustomOrgId] = useState('');
  const [selectedPorts, setSelectedPorts] = useState<string>('');

  useEffect(() => {
    loadAccessInfo();
  }, [tunnelId, propTunnelDetails]);

  const loadAccessInfo = async () => {
    // If we have pre-loaded tunnel details, parse access control from it
    if (propTunnelDetails) {
      const accessMatch = propTunnelDetails.match(/Access control\s*:\s*(.+?)(?:\n|$)/i);
      if (accessMatch) {
        setAccessInfo(`Access control list for tunnel ${tunnelId}:\n  ${accessMatch[1]}`);
        return;
      }
    }

    // Otherwise fetch from API
    setIsLoading(true);
    try {
      const info = await accessApi.list(tunnelId);
      setAccessInfo(info);
    } catch (error) {
      console.error('Failed to load access info:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyPreset = async () => {
    const preset = ACCESS_PRESETS.find((p) => p.type === selectedPreset);
    if (!preset) return;

    try {
      const entry = { ...preset.template };

      if (customExpiration) {
        entry.expiration = customExpiration;
      }

      if (selectedPreset === 'team-only' && customOrgId) {
        entry.organizationId = customOrgId;
      }

      if (selectedPorts) {
        entry.ports = selectedPorts.split(',').map((p) => parseInt(p.trim()));
      }

      await accessApi.create({
        tunnelId,
        entry,
      });

      if (onAccessChanged) onAccessChanged();
      loadAccessInfo();
      toast.success('Access control applied successfully!');
    } catch (error) {
      toast.error(`Failed to apply access control: ${error}`);
    }
  };

  const handleResetAccess = async () => {
    if (!confirm('Reset all access controls to default?')) return;

    try {
      await accessApi.reset(tunnelId);
      if (onAccessChanged) onAccessChanged();
      loadAccessInfo();
      toast.success('Access controls reset successfully!');
    } catch (error) {
      toast.error(`Failed to reset access controls: ${error}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Presets */}
      <div className="card bg-gray-750">
        <h3 className="text-lg font-semibold text-white mb-4">Access Control Presets</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          {ACCESS_PRESETS.map((preset) => (
            <button
              key={preset.type}
              onClick={() => setSelectedPreset(preset.type)}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                selectedPreset === preset.type
                  ? 'border-primary-500 bg-primary-900/30'
                  : 'border-gray-600 hover:border-gray-500'
              }`}
            >
              <h4 className="font-semibold text-white mb-1">{preset.name}</h4>
              <p className="text-sm text-gray-400">{preset.description}</p>
            </button>
          ))}
        </div>

        {/* Custom Options */}
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Expiration</label>
            <select
              value={customExpiration}
              onChange={(e) => setCustomExpiration(e.target.value)}
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

          {selectedPreset === 'team-only' && (
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Organization ID (GitHub)
              </label>
              <input
                type="text"
                value={customOrgId}
                onChange={(e) => setCustomOrgId(e.target.value)}
                placeholder="my-organization"
                className="input-field w-full"
              />
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Specific Ports (optional, comma-separated)
            </label>
            <input
              type="text"
              value={selectedPorts}
              onChange={(e) => setSelectedPorts(e.target.value)}
              placeholder="8080, 3000, 5000"
              className="input-field w-full"
            />
          </div>

          <button
            onClick={handleApplyPreset}
            className="btn-primary w-full"
          >
            Apply Access Control
          </button>
        </div>
      </div>

      {/* Current Access Info */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Current Access Rules</h3>
          <button
            onClick={handleResetAccess}
            className="btn-danger text-sm"
          >
            Reset to Default
          </button>
        </div>

        {isLoading ? (
          <div className="card text-center text-gray-400 py-8">
            Loading access information...
          </div>
        ) : (
          <div className="card">
            <pre className="text-sm text-gray-300 whitespace-pre-wrap">
              {accessInfo || 'No access rules configured'}
            </pre>
          </div>
        )}
      </div>

      {/* Help Text */}
      <div className="card bg-blue-900/20 border-blue-700">
        <h4 className="font-semibold text-blue-300 mb-2">ℹ️ Access Control Info</h4>
        <ul className="text-sm text-blue-200 space-y-1">
          <li>• <strong>Public Demo</strong>: Anyone with the URL can access</li>
          <li>• <strong>Team Access</strong>: Only members of your GitHub organization</li>
          <li>• <strong>Client Preview</strong>: Token-based access for external clients</li>
          <li>• Port-specific rules override tunnel-level settings</li>
        </ul>
      </div>
    </div>
  );
}
