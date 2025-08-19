import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Wallet } from "@/apis/rest/wallet-manager";

export const DEFAULT_COSMO_QUICK_BUY_AMOUNT = 0.0001;

type QuickAmountState = {
  cosmoQuickBuyAmount: number;
  cosmoQuickBuyAmountDisplay: string;
  holdingQuickSellAmount: number;
  holdingQuickType: "%" | "SOL";
  cosmoWallets: Wallet[];
  holdingsWallets: Wallet[];
  setCosmoWallets: (walletList: Wallet[]) => void;
  setHoldingsWallets: (walletList: Wallet[]) => void;
  setCosmoQuickBuyAmount: (newQuickBuyAmount: number) => void;
  setCosmoQuickBuyAmountDisplay: (newQuickBuyAmount: string) => void;
  setHoldingQuickSellAmount: (newQuickSellPercentage: number) => void;
  setHoldingQuickType: (newQuickSellType: "%" | "SOL") => void;
  cleanUp: () => void;
};

export const useQuickAmountStore = create<QuickAmountState>()(
  persist(
    (set, get) => ({
      cosmoQuickBuyAmount: DEFAULT_COSMO_QUICK_BUY_AMOUNT,
      cosmoQuickBuyAmountDisplay: DEFAULT_COSMO_QUICK_BUY_AMOUNT.toString(),
      holdingQuickSellAmount: 10,
      holdingQuickType: "%",
      cosmoWallets: [] as Wallet[],
      holdingsWallets: [] as Wallet[],
      twitterWallets: [] as Wallet[],
      setCosmoWallets: (walletList: Wallet[]) => {
        set(() => ({
          cosmoWallets: [...walletList],
        }));
      },
      setHoldingsWallets: (walletList: Wallet[]) => {
        set(() => ({
          holdingsWallets: [...walletList],
        }));
      },
      setCosmoQuickBuyAmount: (newQuickBuyAmount) =>
        set(() => ({ cosmoQuickBuyAmount: newQuickBuyAmount })),
      setCosmoQuickBuyAmountDisplay: (newQuickBuyAmount) =>
        set(() => ({ cosmoQuickBuyAmountDisplay: newQuickBuyAmount })),
      setHoldingQuickSellAmount: (newQuickSellPercentage) =>
        set(() => ({ holdingQuickSellAmount: newQuickSellPercentage })),
      setHoldingQuickType: (newQuickSellType) =>
        set(() => ({ holdingQuickType: newQuickSellType })),
      cleanUp: () => {
        set(() => ({
          cosmoQuickBuyAmount: DEFAULT_COSMO_QUICK_BUY_AMOUNT,
          cosmoQuickBuyAmountDisplay: DEFAULT_COSMO_QUICK_BUY_AMOUNT.toString(),
          holdingQuickSellAmount: 10,
          holdingQuickType: "%",
          cosmoWallets: [] as Wallet[],
          holdingsWallets: [] as Wallet[],
        }));
      },
    }),
    {
      name: "quick-buy-amount",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
