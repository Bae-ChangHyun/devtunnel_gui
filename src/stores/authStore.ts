import { create } from 'zustand';
import type { UserInfo } from '../types/devtunnel';

interface AuthStore {
  userInfo: UserInfo | null;
  isAuthenticated: boolean;

  // Actions
  setUserInfo: (userInfo: UserInfo | null) => void;
  setAuthenticated: (isAuthenticated: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  userInfo: null,
  isAuthenticated: false,

  setUserInfo: (userInfo) => set({ userInfo }),

  setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),

  logout: () => set({
    userInfo: null,
    isAuthenticated: false,
  }),
}));
