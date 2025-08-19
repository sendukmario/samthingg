import { create } from "zustand";
import { Trade } from "@/types/nova_tv.types";

type MatchWalletTrackerTradesState = {
  trades: Trade[];
  setMatchWalletTrackerTrades: (data: Trade | Trade[]) => void;
  resetMatchWalletTrackerTrades: () => void;
};

export const useMatchWalletTrackerTradesStore =
  create<MatchWalletTrackerTradesState>()((set) => ({
    trades: [],
    setMatchWalletTrackerTrades: (data) =>
      set((state) =>
        data !== null
          ? {
              trades: Array.isArray(data)
                ? [...state.trades, ...data]
                : [...state.trades, data],
            }
          : {
              trades: state.trades,
            },
      ),
    resetMatchWalletTrackerTrades: () => {
      set(() => ({
        trades: [],
      }));
    },
  }));
