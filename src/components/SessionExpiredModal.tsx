import { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useUiStore } from '../stores/uiStore';
import { useTunnelStore } from '../stores/tunnelStore';

export function SessionExpiredModal() {
  const { sessionExpired, setSessionExpired, logout } = useAuthStore();
  const { reset: resetUi } = useUiStore();
  const { reset: resetTunnels } = useTunnelStore();

  // ESC 키로 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && sessionExpired) {
        handleClose();
      }
    };

    if (sessionExpired) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => document.removeEventListener('keydown', handleEscape);
  }, [sessionExpired]);

  const handleClose = () => {
    // 모든 상태 초기화
    logout();
    resetUi();
    resetTunnels();
    setSessionExpired(false);
  };

  if (!sessionExpired) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div
        className="card max-w-md w-full"
        role="dialog"
        aria-modal="true"
        aria-labelledby="session-expired-title"
      >
        {/* Icon */}
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-monokai-pink/10">
          <svg
            className="w-8 h-8 text-monokai-pink"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        {/* Title */}
        <h2
          id="session-expired-title"
          className="text-2xl font-bold text-center text-white mb-3"
        >
          세션이 만료되었습니다
        </h2>

        {/* Message */}
        <p className="text-center text-zinc-400 mb-6">
          DevTunnel 로그인 토큰이 만료되었습니다.
          <br />
          다시 로그인해주세요.
        </p>

        {/* Button */}
        <button
          onClick={handleClose}
          className="btn-primary w-full"
          autoFocus
        >
          확인
        </button>
      </div>
    </div>
  );
}
