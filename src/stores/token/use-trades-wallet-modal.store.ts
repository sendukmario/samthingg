import { Timeframe } from "@/apis/rest/wallet-trade";
import { create } from "zustand";

type TradesWalletModalState = {
  wallet: string;
  setWallet: (wallet: string) => void;
  selectedTimeframe: Timeframe;
  setSelectedTimeframe: (tf: Timeframe) => void;
  cleanup: () => void;
  holdingSortType: "amount" | "recent";
  setHoldingSortType: (type: "amount" | "recent") => void;
};

export const useTradesWalletModalStore = create<TradesWalletModalState>()(
  (set) => ({
    wallet: "",
    setWallet: (wallet) =>
      set((state) => ({
        ...state,
        wallet: wallet,
      })),
    selectedTimeframe: "360d" as Timeframe,
    setSelectedTimeframe: (tf) => set({ selectedTimeframe: tf }),
    cleanup: () =>
      set(() => ({
        wallet: "",
        selectedTimeframe: "360d" as Timeframe,
      })),
    holdingSortType: "recent" as "amount" | "recent",
    setHoldingSortType: (type) => set({ holdingSortType: type }),
  }),
);
