import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type IgniteFilterPanelState = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  togglePanel: () => void;
};

export const useIgniteFilterPanelStore = create<IgniteFilterPanelState>()(
  persist(
    (set) => ({
      isOpen: false,
      setIsOpen: (isOpen: boolean) => set({ isOpen }),
      togglePanel: () => set((state) => ({ isOpen: !state.isOpen })),
    }),
    {
      name: "ignite-filter-panel", // storage key
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ isOpen: state.isOpen }), // store only necessary piece
    },
  ),
);
