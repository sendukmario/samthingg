import { debounce } from "lodash";
import { create } from "zustand";

type StatType = "stat-badge" | "stat-text";

type CosmoStyleState = {
  currentCardWidth: number;
  setCurrentCardWidth: (height: number) => void;
  currentCustomStatsHeight: {
    [key in StatType]?: number;
  };
  setCurrentCustomStatsHeight?: (height: number, type: StatType) => void;
};

export const useCosmoStyle = create<CosmoStyleState>()((set, get) => ({
  currentCardWidth: 300,
  setCurrentCardWidth: (width) => {
    debounce(() => {
      set({ currentCardWidth: width });
    }, 100)();
  },
  currentCustomStatsHeight: {
    "stat-badge": 28,
    "stat-text": 28,
  },
  setCurrentCustomStatsHeight: (height, type) =>
    set({
      currentCustomStatsHeight: {
        ...get().currentCustomStatsHeight,
        [type]: height,
      },
    }),
}));
