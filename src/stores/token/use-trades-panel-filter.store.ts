import { create } from 'zustand';

type TradesType = {
  buy: boolean;
  sell: boolean;
  add: boolean;
  remove: boolean;
};

type TradesTotal = {
  min: number;
  max: number;
};

type TradesPanelFilterState = {
  tradesDate: "ASC" | "DESC";
  setTradesDate: (value: "ASC" | "DESC") => void;
  tradesDateType: "DATE" | "AGE";
  setTradesDateType: (value: "DATE" | "AGE") => void;
  tradesType: TradesType;
  setTradesType: (value: TradesType) => void;
  tradesTotal: TradesTotal;
  setTradesTotal: (value: TradesTotal) => void;
  resetFilters: () => void;
};

export const useTradesPanelFilter = create<TradesPanelFilterState>()((set) => ({
  tradesDate: "DESC",
  setTradesDate: (value) => set({ tradesDate: value }),
  tradesDateType: "DATE",
  setTradesDateType: (value) => set({ tradesDateType: value }),
  tradesType: {
    buy: true,
    sell: true,
    add: true,
    remove: true,
  },
  tradesTotal: {
    min: 0,
    max: 0,
  },
  setTradesTotal: (value) => set({ tradesTotal: value }),
  setTradesType: (value) => set({ tradesType: value }),
  resetFilters: () =>
    set({
      tradesDate: "DESC",
      tradesDateType: "DATE",
      tradesType: {
        buy: true,
        sell: true,
        add: true,
        remove: true,
      },
      tradesTotal: {
        min: 0,
        max: 0,
      },
    }),
})); 