import { create } from 'zustand';
import type { TunnelListItem, UserInfo } from '../types/devtunnel';
import type { DevTunnelInfo } from '../lib/api';

// Cache configuration
const CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

interface TunnelDetailsCache {
  data: string;
  timestamp: number;
}

interface DevTunnelInfoCache {
  data: DevTunnelInfo;
  timestamp: number;
}

interface TunnelStore {
  tunnels: TunnelListItem[];
  tunnelsLastFetched: number | null;
  selectedTunnel: TunnelListItem | null;
  isLoading: boolean;
  error: string | null;
  userInfo: UserInfo | null;
  isAuthenticated: boolean;
  activeTab: string;
  tunnelDetailsCache: Map<string, TunnelDetailsCache>;
  devTunnelInfoCache: DevTunnelInfoCache | null;

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

  // Cache actions
  getTunnelDetails: (tunnelId: string) => string | null;
  setTunnelDetails: (tunnelId: string, data: string) => void;
  invalidateTunnelDetails: (tunnelId: string) => void;
  clearAllCache: () => void;
  isTunnelListCacheValid: () => boolean;
  invalidateTunnelList: () => void;
  getDevTunnelInfo: () => DevTunnelInfo | null;
  setDevTunnelInfo: (info: DevTunnelInfo) => void;
}

export const useTunnelStore = create<TunnelStore>((set, get) => ({
  tunnels: [],
  tunnelsLastFetched: null,
  selectedTunnel: null,
  isLoading: false,
  error: null,
  userInfo: null,
  isAuthenticated: false,
  activeTab: 'dashboard',
  tunnelDetailsCache: new Map(),
  devTunnelInfoCache: null,

  setTunnels: (tunnels) => set({ tunnels, tunnelsLastFetched: Date.now() }),

  addTunnel: (tunnel) => set((state) => ({
    tunnels: [...state.tunnels, tunnel],
    tunnelsLastFetched: Date.now(),
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
    tunnelsLastFetched: Date.now(),
  })),

  selectTunnel: (tunnel) => set({ selectedTunnel: tunnel }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  setUserInfo: (userInfo) => set({ userInfo }),

  setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),

  setActiveTab: (activeTab) => set({ activeTab }),

  reset: () => set({
    tunnels: [],
    tunnelsLastFetched: null,
    selectedTunnel: null,
    isLoading: false,
    error: null,
    userInfo: null,
    isAuthenticated: false,
    activeTab: 'dashboard',
    tunnelDetailsCache: new Map(),
    devTunnelInfoCache: null,
  }),

  // Cache methods
  getDevTunnelInfo: () => {
    const cached = get().devTunnelInfoCache;
    if (!cached) return null;

    // Check if cache is expired
    const now = Date.now();
    if (now - cached.timestamp > CACHE_EXPIRY_MS) {
      // Cache expired, remove it
      set({ devTunnelInfoCache: null });
      return null;
    }

    return cached.data;
  },

  setDevTunnelInfo: (info: DevTunnelInfo) => {
    set({
      devTunnelInfoCache: {
        data: info,
        timestamp: Date.now(),
      },
    });
  },

  isTunnelListCacheValid: () => {
    const lastFetched = get().tunnelsLastFetched;
    if (!lastFetched) return false;

    const now = Date.now();
    return now - lastFetched < CACHE_EXPIRY_MS;
  },

  invalidateTunnelList: () => {
    set({ tunnelsLastFetched: null });
  },

  getTunnelDetails: (tunnelId: string) => {
    const cached = get().tunnelDetailsCache.get(tunnelId);
    if (!cached) return null;

    // Check if cache is expired
    const now = Date.now();
    if (now - cached.timestamp > CACHE_EXPIRY_MS) {
      // Cache expired, remove it
      get().invalidateTunnelDetails(tunnelId);
      return null;
    }

    return cached.data;
  },

  setTunnelDetails: (tunnelId: string, data: string) => {
    set((state) => {
      const newCache = new Map(state.tunnelDetailsCache);
      newCache.set(tunnelId, {
        data,
        timestamp: Date.now(),
      });
      return { tunnelDetailsCache: newCache };
    });
  },

  invalidateTunnelDetails: (tunnelId: string) => {
    set((state) => {
      const newCache = new Map(state.tunnelDetailsCache);
      newCache.delete(tunnelId);
      return { tunnelDetailsCache: newCache };
    });
  },

  clearAllCache: () => {
    set({ tunnelDetailsCache: new Map() });
  },
}));
