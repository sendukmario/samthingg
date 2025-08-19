import { WatchlistToken } from "@/apis/rest/watchlist";
import { create } from "zustand";
import { BatchPriceMessage } from "@/stores/holdings/use-holdings-messages.store";

type WatchlistTokenState = {
  isLoading: boolean;
  watchlistToken: WatchlistToken[];
  oldestTokenMint: string;
  setIsLoading: (value: boolean) => void;
  setOldestTokenMint: (mint: string) => void;
  setWatchlistToken: (watchlistTokens: WatchlistToken[]) => void;
  addToWatchlistToken: (watchlistTokenData: WatchlistToken) => void;
  updateWatchlistToken: (batchPriceMessage: BatchPriceMessage) => void;
  removeFromWatchlistToken: (tokenMint: string) => void;
};

export const useWatchlistTokenStore = create<WatchlistTokenState>()((set) => ({
  isLoading: true,
  watchlistToken: [],
  oldestTokenMint: "",
  setIsLoading: (value: boolean) => set({ isLoading: value }),
  setOldestTokenMint: (mint: string) => set({ oldestTokenMint: mint }),
  setWatchlistToken: (watchlistToken) =>
    set(() => ({
      watchlistToken,
    })),
  addToWatchlistToken: (watchlistTokenData) =>
    set((state) => ({
      watchlistToken:
        watchlistTokenData !== null
          ? [
              ...[watchlistTokenData, ...(state.watchlistToken ?? [])].slice(
                0,
                10,
              ),
            ]
          : state.watchlistToken,
    })),
  updateWatchlistToken: (batchPriceMessage) =>
    set((state) => {
      const newWatchlistToken = state.watchlistToken.map((token) => {
        if (token.mint === batchPriceMessage?.mint) {
          return {
            ...token,
            marketCap: batchPriceMessage.market_cap_usd || 1000000000,
          };
        }
        return token;
      });

      return {
        watchlistToken: newWatchlistToken,
      };
    }),
  removeFromWatchlistToken: (tokenMint) =>
    set((state) => {
      const updatedList = state.watchlistToken?.filter(
        (item) => item.mint !== tokenMint,
      );

      return { watchlistToken: updatedList };
    }),
}));
