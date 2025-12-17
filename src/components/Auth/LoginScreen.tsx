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
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-semibold text-white tracking-tight mb-2">DevTunnel</h1>
          <p className="text-sm text-zinc-500">GUI Manager</p>
        </div>

        <div className="card space-y-6 bg-dark-800">
          <div className="text-center">
            <h2 className="text-lg font-medium text-white mb-1">Sign in</h2>
            <p className="text-xs text-zinc-500">Choose your authentication provider</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={() => handleLogin('microsoft')}
              disabled={isLoading}
              className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-3"
            >
              {isLoading ? (
                <span className="text-sm">Signing in...</span>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 21 21" fill="currentColor">
                    <rect x="1" y="1" width="9" height="9" />
                    <rect x="11" y="1" width="9" height="9" />
                    <rect x="1" y="11" width="9" height="9" />
                    <rect x="11" y="11" width="9" height="9" />
                  </svg>
                  <span className="text-sm">Sign in with Microsoft</span>
                </>
              )}
            </button>

            <button
              onClick={() => handleLogin('github')}
              disabled={isLoading}
              className="w-full bg-dark-700 hover:bg-dark-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-3"
            >
              {isLoading ? (
                <span className="text-sm">Signing in...</span>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                  </svg>
                  <span className="text-sm">Sign in with GitHub</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="mt-8 text-center text-xs text-zinc-600">
          <p>Powered by Microsoft DevTunnels CLI</p>
        </div>
      </div>
    </div>
  );
}
