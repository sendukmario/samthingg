import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export const DEFAULT_QUICK_CLIPBOARD_BUY_AMOUNT = 0.0001;

interface QuickClipboardAmountState {
  quickClipboardAmount: number;
  setQuickClipboardAmount: (amount: number) => void;
}

export const useQuickClipboardAmountStore = create<QuickClipboardAmountState>()(
  persist(
    (set) => ({
      quickClipboardAmount: DEFAULT_QUICK_CLIPBOARD_BUY_AMOUNT,
      setQuickClipboardAmount: (amount) => set({ quickClipboardAmount: amount }),
    }),
    {
      name: "quick-clipboard-amount-storage",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
