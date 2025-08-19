import { create } from "zustand";

type TradeType = "BUY" | "SELL" | "ALL";

interface TradeHistoryTableSettingStore {
  ageOrder: "ASC" | "DESC";
  type: TradeType;
  mcOrPrice: "MC" | "PRICE";
  totalSOL: "SOL" | "USDC";
  valueCurrency: "SOL" | "USDC";
  totalCurrency: "SOL" | "USDC";
  setAgeOrder: (order: "ASC" | "DESC") => void;
  setType: (type: TradeType) => void;
  setMCOrPrice: (value: "MC" | "PRICE") => void;
  setTotalSOLCurrency: (value: "SOL" | "USDC") => void;
  setValueCurrency: (value: "SOL" | "USDC") => void;
  setTotalCurrency: (value: "SOL" | "USDC") => void;
}

export const useTradeHistoryTableSettingStore =
  create<TradeHistoryTableSettingStore>((set) => ({
    ageOrder: "DESC",
    type: "ALL",
    mcOrPrice: "MC",
    totalSOL: "SOL",
    valueCurrency: "SOL",
    totalCurrency: "SOL",
    setAgeOrder: (order) => set({ ageOrder: order }),
    setType: (type) => set({ type }),
    setMCOrPrice: (value) => set({ mcOrPrice: value }),
    setTotalSOLCurrency: (value) => set({ totalSOL: value }),
    setValueCurrency: (value) => set({ valueCurrency: value }),
    setTotalCurrency: (value) => set({ totalCurrency: value }),
  }));
