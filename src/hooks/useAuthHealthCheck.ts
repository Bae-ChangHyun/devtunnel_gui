import { useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '../stores/authStore';
import { authApi } from '../lib/api';

// 2시간마다 헬스체크
const HEALTH_CHECK_INTERVAL = 2 * 60 * 60 * 1000; // 2시간 = 7,200,000ms

// 포커스 복귀 시 체크 기준 (30분)
const FOCUS_CHECK_THRESHOLD = 30 * 60 * 1000; // 30분 = 1,800,000ms

export function useAuthHealthCheck() {
  const { isAuthenticated, setUserInfo, setSessionExpired } = useAuthStore();
  const intervalRef = useRef<number | null>(null);
  const lastCheckRef = useRef<number>(Date.now());

  /**
   * 인증 상태 헬스체크
   * getUserInfo() API를 호출하여 세션 유효성 검증
   */
  const performHealthCheck = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const userInfo = await authApi.getUserInfo();
      setUserInfo(userInfo);
      lastCheckRef.current = Date.now();
      console.log('[HealthCheck] 세션 유효 확인:', userInfo.userName);
    } catch (error) {
      // getUserInfo 실패 = 세션 만료
      console.warn('[HealthCheck] 세션 만료 감지:', error);
      setSessionExpired(true);
    }
  }, [isAuthenticated, setUserInfo, setSessionExpired]);

  /**
   * 앱 포커스 복귀 시 세션 체크
   * 백그라운드에서 오래 있었다면 즉시 확인
   */
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isAuthenticated) {
        const timeSinceLastCheck = Date.now() - lastCheckRef.current;

        // 마지막 체크 이후 30분 이상 경과했으면 즉시 체크
        if (timeSinceLastCheck > FOCUS_CHECK_THRESHOLD) {
          console.log('[HealthCheck] 포커스 복귀 - 세션 확인 시작');
          performHealthCheck();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [performHealthCheck, isAuthenticated]);

  /**
   * 주기적 헬스체크 (2시간마다)
   */
  useEffect(() => {
    // 인증 상태가 아니면 타이머 정리
    if (!isAuthenticated) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // 첫 체크는 즉시 (앱 시작 시 이미 checkAuthStatus에서 확인하므로 생략 가능)
    // performHealthCheck();

    // 2시간마다 주기적으로 체크
    intervalRef.current = window.setInterval(() => {
      console.log('[HealthCheck] 주기적 체크 실행 (2시간)');
      performHealthCheck();
    }, HEALTH_CHECK_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isAuthenticated, performHealthCheck]);

  return { performHealthCheck };
}
