import { useAuthStore } from '../../stores/authStore';
import { useUiStore } from '../../stores/uiStore';
import { useTunnelStore } from '../../stores/tunnelStore';
import { authApi } from '../../lib/api';

export default function Header() {
  const { userInfo, logout: logoutAuth } = useAuthStore();
  const { reset: resetUi } = useUiStore();
  const { reset: resetTunnels } = useTunnelStore();

  const handleLogout = async () => {
    try {
      await authApi.logout();
      // Reset all stores
      logoutAuth();
      resetUi();
      resetTunnels();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <header className="bg-dark-800/50 border-b border-zinc-800/50 px-8 py-4">
      <div className="flex items-center justify-end">
        <div className="flex items-center gap-4">
          {userInfo && (
            <div className="text-right">
              <p className="text-sm font-medium text-white">
                {userInfo.userName || userInfo.email || 'User'}
              </p>
              <p className="text-xs text-zinc-500">{userInfo.provider}</p>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="btn-secondary text-xs"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
