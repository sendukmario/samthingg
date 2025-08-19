import { create } from "zustand";

interface IgniteSearchState {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  clearSearchQuery: () => void;
}

export const useIgniteSearchStore = create<IgniteSearchState>((set) => ({
  searchQuery: "",
  setSearchQuery: (query: string) => set({ searchQuery: query }),
  clearSearchQuery: () => set({ searchQuery: "" }),
}));
