import { useState, useEffect } from 'react';
import { getVersion } from '@tauri-apps/api/app';
import { systemApi, type DevTunnelInfo } from '../../lib/api';
import { toast } from '../../components/Toast';
import { useTunnelStore } from '../../stores/tunnelStore';

export default function Settings() {
  const { getDevTunnelInfo, setDevTunnelInfo: setCachedDevTunnelInfo } = useTunnelStore();
  const [devTunnelInfo, setDevTunnelInfo] = useState<DevTunnelInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [appVersion, setAppVersion] = useState<string>('Loading...');

  useEffect(() => {
    checkInstallation();
    loadAppVersion();
  }, []);

  const loadAppVersion = async () => {
    try {
      const version = await getVersion();
      setAppVersion(version);
    } catch (error) {
      console.error('Failed to get app version:', error);
      setAppVersion('Unknown');
    }
  };

  const checkInstallation = async (forceRefresh = false) => {
    // Check cache first
    if (!forceRefresh) {
      const cached = getDevTunnelInfo();
      if (cached) {
        setDevTunnelInfo(cached);
        setIsLoading(false);
        return;
      }
    }

    setIsLoading(true);
    try {
      const info = await systemApi.checkDevTunnelInstallation();
      setDevTunnelInfo(info);
      setCachedDevTunnelInfo(info);
    } catch (error) {
      console.error('Failed to check DevTunnel installation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openDevTunnelGuide = async () => {
    const url = 'https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started';
    try {
      await systemApi.openUrl(url);
    } catch (error) {
      console.error('Failed to open URL:', error);
      toast.error(`Failed to open browser. Please visit: ${url}`);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-gray-400 mt-1">Application preferences and configuration</p>
      </div>

      <div className="space-y-6">
        {/* DevTunnel CLI Settings */}
        <div className="card">
          <h2 className="text-xl font-semibold text-white mb-4">DevTunnel CLI</h2>

          {isLoading ? (
            <div className="text-gray-400">Checking installation...</div>
          ) : devTunnelInfo?.installed ? (
            <div className="space-y-4">
              <div className="bg-green-900/20 border border-green-500/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">✓</span>
                  <span className="text-green-400 font-semibold">DevTunnel is installed</span>
                </div>
                <div className="space-y-1 text-sm">
                  <p className="text-gray-400">
                    <span className="text-white font-medium">Path:</span>{' '}
                    <code className="bg-gray-800 px-2 py-1 rounded">{devTunnelInfo.path}</code>
                  </p>
                  {devTunnelInfo.version && (
                    <p className="text-gray-400">
                      <span className="text-white font-medium">Version:</span>{' '}
                      <code className="bg-gray-800 px-2 py-1 rounded">{devTunnelInfo.version}</code>
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={openDevTunnelGuide}
                className="btn-secondary"
              >
                View DevTunnel Documentation
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-yellow-900/20 border border-yellow-500/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">⚠</span>
                  <span className="text-yellow-400 font-semibold">DevTunnel is not installed</span>
                </div>
                <p className="text-gray-400 text-sm">
                  You need to install the DevTunnel CLI to use this application.
                </p>
              </div>

              <div className="bg-gray-750 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-3">Installation Guide</h3>
                <div className="space-y-3 text-sm text-gray-300">
                  <div>
                    <p className="text-white font-medium mb-1">1. Download DevTunnel CLI</p>
                    <p className="text-gray-400">
                      Visit the official Microsoft DevTunnel documentation to download the CLI for your platform.
                    </p>
                  </div>
                  <div>
                    <p className="text-white font-medium mb-1">2. Install and verify</p>
                    <p className="text-gray-400 mb-2">After installation, verify by running:</p>
                    <code className="block bg-gray-800 px-3 py-2 rounded">devtunnel --version</code>
                  </div>
                  <div>
                    <p className="text-white font-medium mb-1">3. Add to PATH (if needed)</p>
                    <p className="text-gray-400 mb-2">
                      If the command is not found, add the devtunnel binary to your PATH, or set the DEVTUNNEL_BIN environment variable:
                    </p>
                    <code className="block bg-gray-800 px-3 py-2 rounded">export DEVTUNNEL_BIN=/path/to/devtunnel</code>
                  </div>
                  <div>
                    <p className="text-white font-medium mb-1">4. Restart this application</p>
                    <p className="text-gray-400">
                      After installing DevTunnel CLI, restart this application to detect it.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={openDevTunnelGuide}
                  className="btn-primary flex-1"
                >
                  Open Installation Guide
                </button>
                <button
                  onClick={() => checkInstallation(true)}
                  className="btn-secondary"
                >
                  Recheck Installation
                </button>
              </div>
            </div>
          )}
        </div>

        {/* About */}
        <div className="card">
          <h2 className="text-xl font-semibold text-white mb-4">About</h2>
          <div className="space-y-2 text-gray-400">
            <p><span className="text-white">Version:</span> {appVersion}</p>
            <p><span className="text-white">DevTunnel GUI Manager</span></p>
            <p className="text-sm">A graphical interface for Microsoft DevTunnel CLI</p>
          </div>
        </div>
      </div>
    </div>
  );
}
