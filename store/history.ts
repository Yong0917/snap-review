import { create } from "zustand";
import type { ReviewHistory } from "@/types/receipt";
import { loadHistory, saveHistory } from "@/lib/storage";

interface HistoryState {
  items: ReviewHistory[];

  loadFromStorage: () => void;
  addItem: (item: ReviewHistory) => void;
  removeItem: (id: string) => void;
  clearAll: () => void;
}

export const useHistoryStore = create<HistoryState>((set) => ({
  items: [],

  loadFromStorage: () => {
    const items = loadHistory();
    set({ items });
  },

  addItem: (item) =>
    set((state) => {
      // Avoid duplicate IDs
      const filtered = state.items.filter((i) => i.id !== item.id);
      const next = [item, ...filtered];
      saveHistory(next);
      return { items: next };
    }),

  removeItem: (id) =>
    set((state) => {
      const next = state.items.filter((i) => i.id !== id);
      saveHistory(next);
      return { items: next };
    }),

  clearAll: () => {
    saveHistory([]);
    set({ items: [] });
  },
}));
