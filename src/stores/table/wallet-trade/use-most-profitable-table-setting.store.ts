import { create } from "zustand";

export type PnlCurrency = "USDC" | "SOL";

type MostProfitableTableSettingState = {
  investedOrder: "ASC" | "DESC";
  soldOrder: "ASC" | "DESC";
  pnlCurrency: PnlCurrency;
  setInvestedOrder: (order: "ASC" | "DESC") => void;
  setSoldOrder: (order: "ASC" | "DESC") => void;
  togglePnlCurrency: () => void;
};

export const useMostProfitableTableSettingStore =
  create<MostProfitableTableSettingState>()((set) => ({
    investedOrder: "ASC",
    soldOrder: "ASC",
    pnlCurrency: "SOL",
    setInvestedOrder: (newInvestedOrder) =>
      set(() => ({ investedOrder: newInvestedOrder })),
    setSoldOrder: (newSoldOrder) => set(() => ({ soldOrder: newSoldOrder })),
    togglePnlCurrency: () =>
      set((state) => ({
        pnlCurrency: state.pnlCurrency === "SOL" ? "USDC" : "SOL",
      })),
  }));
