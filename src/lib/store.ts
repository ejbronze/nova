import { create } from "zustand";
import type { Settings } from "@/types";
import { getSettings, updateSettings } from "@/lib/db";

interface AppState {
  settings: Settings;
  isLoading: boolean;
  // Modal state
  openModal: string | null;
  setOpenModal: (modal: string | null) => void;
  // Settings
  loadSettings: () => Promise<void>;
  setDopRate: (rate: number) => Promise<void>;
  setPrimaryCurrency: (currency: "USD" | "DOP") => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  settings: {
    dopRate: 59.5,
    dopRateUpdatedAt: new Date().toISOString(),
    primaryCurrency: "USD",
    theme: "light",
  },
  isLoading: true,
  openModal: null,

  setOpenModal: (modal) => set({ openModal: modal }),

  loadSettings: async () => {
    const settings = await getSettings();
    set({ settings, isLoading: false });
  },

  setDopRate: async (rate) => {
    const patch = { dopRate: rate, dopRateUpdatedAt: new Date().toISOString() };
    await updateSettings(patch);
    set((s) => ({ settings: { ...s.settings, ...patch } }));
  },

  setPrimaryCurrency: async (currency) => {
    await updateSettings({ primaryCurrency: currency });
    set((s) => ({ settings: { ...s.settings, primaryCurrency: currency } }));
  },
}));
