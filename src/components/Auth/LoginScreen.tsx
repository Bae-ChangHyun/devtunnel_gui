import { useState } from 'react';
import { authApi } from '../../lib/api';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (provider: 'microsoft' | 'github') => {
    setIsLoading(true);
    setError(null);

    try {
      await authApi.login(provider, false);
      onLoginSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">DevTunnel GUI</h1>
          <p className="text-gray-400">Manage your dev tunnels with ease</p>
        </div>

        <div className="card space-y-6">
          <div>
            <h2 className="text-2xl font-semibold text-white mb-2">Welcome</h2>
            <p className="text-gray-400">Sign in to manage your tunnels</p>
          </div>

          {error && (
            <div className="bg-red-900/50 border border-red-600 rounded-lg p-3 text-red-200">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={() => handleLogin('microsoft')}
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 21 21" fill="currentColor">
                    <rect x="1" y="1" width="9" height="9" />
                    <rect x="11" y="1" width="9" height="9" />
                    <rect x="1" y="11" width="9" height="9" />
                    <rect x="11" y="11" width="9" height="9" />
                  </svg>
                  <span>Sign in with Microsoft</span>
                </>
              )}
            </button>

            <button
              onClick={() => handleLogin('github')}
              disabled={isLoading}
              className="w-full bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                  </svg>
                  <span>Sign in with GitHub</span>
                </>
              )}
            </button>
          </div>

          <div className="text-center text-sm text-gray-500">
            <p>By signing in, you agree to use DevTunnel responsibly</p>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Powered by Microsoft DevTunnels CLI</p>
        </div>
      </div>
    </div>
  );
}
