import { create } from 'zustand';
import type { UserInfo } from '../types/devtunnel';

interface AuthStore {
  userInfo: UserInfo | null;
  isAuthenticated: boolean;
  sessionExpired: boolean;

  // Actions
  setUserInfo: (userInfo: UserInfo | null) => void;
  setAuthenticated: (isAuthenticated: boolean) => void;
  setSessionExpired: (expired: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  userInfo: null,
  isAuthenticated: false,
  sessionExpired: false,

  setUserInfo: (userInfo) => set({ userInfo, sessionExpired: false }),

  setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),

  setSessionExpired: (expired) => set({
    sessionExpired: expired,
    isAuthenticated: !expired,
    userInfo: expired ? null : undefined,
  }),

  logout: () => set({
    userInfo: null,
    isAuthenticated: false,
    sessionExpired: false,
  }),
}));
