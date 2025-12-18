import { create } from 'zustand';
import type { TunnelListItem } from '../types/devtunnel';
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
  // Tunnel data
  tunnels: TunnelListItem[];
  tunnelsLastFetched: number | null;
  isLoading: boolean;
  error: string | null;

  // Cache
  tunnelDetailsCache: Map<string, TunnelDetailsCache>;
  devTunnelInfoCache: DevTunnelInfoCache | null;

  // Tunnel actions
  setTunnels: (tunnels: TunnelListItem[]) => void;
  addTunnel: (tunnel: TunnelListItem) => void;
  updateTunnel: (tunnelId: string, updates: Partial<TunnelListItem>) => void;
  removeTunnel: (tunnelId: string) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;

  // Cache actions
  getTunnelDetails: (tunnelId: string) => string | null;
  setTunnelDetails: (tunnelId: string, data: string) => void;
  invalidateTunnelDetails: (tunnelId: string) => void;
  clearAllCache: () => void;
  isTunnelListCacheValid: () => boolean;
  invalidateTunnelList: () => void;
  getDevTunnelInfo: () => DevTunnelInfo | null;
  setDevTunnelInfo: (info: DevTunnelInfo) => void;

  // Reset
  reset: () => void;
}

export const useTunnelStore = create<TunnelStore>((set, get) => ({
  // Initial state
  tunnels: [],
  tunnelsLastFetched: null,
  isLoading: false,
  error: null,
  tunnelDetailsCache: new Map(),
  devTunnelInfoCache: null,

  // Tunnel actions
  setTunnels: (tunnels) => set({ tunnels, tunnelsLastFetched: Date.now() }),

  addTunnel: (tunnel) => set((state) => ({
    tunnels: [...state.tunnels, tunnel],
    tunnelsLastFetched: Date.now(),
  })),

  updateTunnel: (tunnelId, updates) => set((state) => ({
    tunnels: state.tunnels.map((t) =>
      t.tunnelId === tunnelId ? { ...t, ...updates } : t
    ),
  })),

  removeTunnel: (tunnelId) => set((state) => ({
    tunnels: state.tunnels.filter((t) => t.tunnelId !== tunnelId),
    tunnelsLastFetched: Date.now(),
  })),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

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
    set({
      tunnelDetailsCache: new Map(),
      devTunnelInfoCache: null,
    });
  },

  reset: () => set({
    tunnels: [],
    tunnelsLastFetched: null,
    isLoading: false,
    error: null,
    tunnelDetailsCache: new Map(),
    devTunnelInfoCache: null,
  }),
}));
