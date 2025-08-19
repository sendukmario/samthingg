import { create } from "zustand";
import { persist } from "zustand/middleware";

export enum ColorType {
  TOKEN,
  WALLET_NAME,
  AMOUNT_BUY,
  AMOUNT_SELL,
  MARKET_CAP_BUY,
  MARKET_CAP_SELL,
}

type IWalletTrackerColor = {
  colors: Record<ColorType, string>;
  setColor: (type: ColorType, color: string) => void;
  resetColors: () => void;
};

export const defaultColors: Record<ColorType, string> = {
  [ColorType.TOKEN]: "#FCFCFD",
  [ColorType.WALLET_NAME]: "#F0A664",
  [ColorType.AMOUNT_BUY]: "#85D6B1",
  [ColorType.AMOUNT_SELL]: "#F65B93",
  [ColorType.MARKET_CAP_BUY]: "#85D6B1",
  [ColorType.MARKET_CAP_SELL]: "#F65B93",
};

export const useWalletTrackerColor = create<IWalletTrackerColor>()(
  persist(
    (set, get) => ({
      colors: { ...defaultColors },

      setColor: (type, color) =>
        set((state) => ({
          colors: {
            ...state.colors,
            [type]: color,
          },
        })),

      resetColors: () => {
        set(() => ({
          colors: { ...defaultColors },
        }));
      },
    }),
    {
      name: "nova-wallet-tracker-colors", // localStorage key
    },
  ),
);
