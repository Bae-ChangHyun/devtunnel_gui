import { useUiStore } from '../../stores/uiStore';

export default function Sidebar() {
  const { activeTab, setActiveTab } = useUiStore();

  const menuItems = [
    { id: 'dashboard', name: 'Dashboard' },
    { id: 'logs', name: 'Logs' },
    { id: 'settings', name: 'Settings' },
  ];

  return (
    <aside className="w-56 bg-dark-800 min-h-screen">
      <div className="p-6">
        {/* Logo */}
        <div className="mb-12">
          <h2 className="text-lg font-semibold text-white tracking-tight">DevTunnel</h2>
          <p className="text-xs text-zinc-500 mt-0.5">GUI Manager</p>
        </div>

        {/* Navigation */}
        <nav className="space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all relative group ${
                activeTab === item.id
                  ? 'text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {/* Active Indicator Line */}
              {activeTab === item.id && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary-500 rounded-r" />
              )}

              <span className="font-medium text-sm">{item.name}</span>
            </button>
          ))}
        </nav>
      </div>
    </aside>
  );
}
