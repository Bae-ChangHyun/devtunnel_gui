import { create } from 'zustand';
import type { TunnelListItem } from '../types/devtunnel';

interface UiStore {
  activeTab: string;
  selectedTunnel: TunnelListItem | null;

  // Actions
  setActiveTab: (tab: string) => void;
  selectTunnel: (tunnel: TunnelListItem | null) => void;
  reset: () => void;
}

export const useUiStore = create<UiStore>((set) => ({
  activeTab: 'dashboard',
  selectedTunnel: null,

  setActiveTab: (activeTab) => set({ activeTab }),

  selectTunnel: (selectedTunnel) => set({ selectedTunnel }),

  reset: () => set({
    activeTab: 'dashboard',
    selectedTunnel: null,
  }),
}));
