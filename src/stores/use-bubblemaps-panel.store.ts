import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface BubbleMapsPanelState {
  selectedVariant: "InsightX" | "BubbleMapsIO" | "CabalSpy";
  setSelectedVariant: (
    variant: "InsightX" | "BubbleMapsIO" | "CabalSpy",
  ) => void;
  isOpen: boolean;
  width: number;
  setOpen: (open: boolean) => void;
  setWidth: (width: number) => void;
}

export const useBubbleMapsPanelStore = create<BubbleMapsPanelState>()(
  persist(
    (set) => ({
      selectedVariant: "BubbleMapsIO",
      setSelectedVariant: (variant) => set({ selectedVariant: variant }),
      isOpen: false,
      width: 250,
      setOpen: (open) => set({ isOpen: open }),
      setWidth: (width) => set({ width }),
    }),
    {
      name: "bubblemaps-panel-store",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
