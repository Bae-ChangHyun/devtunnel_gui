import { useEffect, useState } from 'react';
import { useTunnelStore } from './stores/tunnelStore';
import { authApi } from './lib/api';
import Dashboard from './components/Dashboard/Dashboard';
import LogsViewer from './components/Logs/LogsViewer';
import Settings from './components/Settings/Settings';
import LoginScreen from './components/Auth/LoginScreen';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import { ToastContainer } from './components/Toast';
import './index.css';

function App() {
  const { isAuthenticated, setAuthenticated, setUserInfo, activeTab } = useTunnelStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const userInfo = await authApi.getUserInfo();
      setUserInfo(userInfo);
      setAuthenticated(true);
    } catch (error) {
      setAuthenticated(false);
    } finally {
      setIsChecking(false);
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen onLoginSuccess={checkAuthStatus} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'logs':
        return <LogsViewer />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 text-white">
      <div className="flex">
        <Sidebar />
        <div className="flex-1">
          <Header />
          <main className="bg-dark-900">
            {renderContent()}
          </main>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}

export default App;
