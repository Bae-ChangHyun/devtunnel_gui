import { useTunnelStore } from '../../stores/tunnelStore';

export default function Sidebar() {
  const { activeTab, setActiveTab } = useTunnelStore();

  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: '📊' },
    { id: 'logs', name: 'Logs', icon: '📝' },
    { id: 'settings', name: 'Settings', icon: '⚙️' },
  ];

  return (
    <aside className="w-64 bg-gray-800 border-r border-gray-700 min-h-screen">
      <div className="p-4">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center text-2xl">
            🚇
          </div>
          <div>
            <h2 className="font-bold text-white">DevTunnel</h2>
            <p className="text-xs text-gray-400">GUI Manager</p>
          </div>
        </div>

        <nav className="space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === item.id
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="font-medium">{item.name}</span>
            </button>
          ))}
        </nav>
      </div>
    </aside>
  );
}
