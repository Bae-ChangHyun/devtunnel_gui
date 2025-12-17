import { useTunnelStore } from '../../stores/tunnelStore';
import { authApi } from '../../lib/api';

export default function Header() {
  const { userInfo, reset } = useTunnelStore();

  const handleLogout = async () => {
    try {
      await authApi.logout();
      reset();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">DevTunnel Manager</h1>
          <p className="text-sm text-gray-400">Manage your development tunnels</p>
        </div>

        <div className="flex items-center gap-4">
          {userInfo && (
            <div className="text-right">
              <p className="text-sm font-medium text-white">
                {userInfo.userName || userInfo.email || 'User'}
              </p>
              <p className="text-xs text-gray-400">{userInfo.provider}</p>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="btn-secondary text-sm"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
