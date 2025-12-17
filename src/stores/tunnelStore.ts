import { create } from 'zustand';
import type { TunnelListItem, UserInfo } from '../types/devtunnel';

interface TunnelStore {
  tunnels: TunnelListItem[];
  selectedTunnel: TunnelListItem | null;
  isLoading: boolean;
  error: string | null;
  userInfo: UserInfo | null;
  isAuthenticated: boolean;
  activeTab: string;

  // Actions
  setTunnels: (tunnels: TunnelListItem[]) => void;
  addTunnel: (tunnel: TunnelListItem) => void;
  updateTunnel: (tunnelId: string, updates: Partial<TunnelListItem>) => void;
  removeTunnel: (tunnelId: string) => void;
  selectTunnel: (tunnel: TunnelListItem | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setUserInfo: (userInfo: UserInfo | null) => void;
  setAuthenticated: (isAuthenticated: boolean) => void;
  setActiveTab: (tab: string) => void;
  reset: () => void;
}

export const useTunnelStore = create<TunnelStore>((set) => ({
  tunnels: [],
  selectedTunnel: null,
  isLoading: false,
  error: null,
  userInfo: null,
  isAuthenticated: false,
  activeTab: 'dashboard',

  setTunnels: (tunnels) => set({ tunnels }),

  addTunnel: (tunnel) => set((state) => ({
    tunnels: [...state.tunnels, tunnel]
  })),

  updateTunnel: (tunnelId, updates) => set((state) => ({
    tunnels: state.tunnels.map((t) =>
      t.tunnelId === tunnelId ? { ...t, ...updates } : t
    ),
    selectedTunnel:
      state.selectedTunnel?.tunnelId === tunnelId
        ? { ...state.selectedTunnel, ...updates }
        : state.selectedTunnel,
  })),

  removeTunnel: (tunnelId) => set((state) => ({
    tunnels: state.tunnels.filter((t) => t.tunnelId !== tunnelId),
    selectedTunnel:
      state.selectedTunnel?.tunnelId === tunnelId ? null : state.selectedTunnel,
  })),

  selectTunnel: (tunnel) => set({ selectedTunnel: tunnel }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  setUserInfo: (userInfo) => set({ userInfo }),

  setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),

  setActiveTab: (activeTab) => set({ activeTab }),

  reset: () => set({
    tunnels: [],
    selectedTunnel: null,
    isLoading: false,
    error: null,
    userInfo: null,
    isAuthenticated: false,
    activeTab: 'dashboard',
  }),
}));
