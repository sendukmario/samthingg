import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import Cookies from "js-cookie";

type HiddenTokensState = {
  cosmoShowHiddenTokens: boolean;
  setCosmoShowHiddenTokens: (show: boolean) => void;
  hiddenTokens: string[];
  setHiddenTokens: (tokens: string[]) => void;
  isTokenHidden: (tokenMint: string) => boolean;
  hideToken: (tokenMint: string) => void;
  unhideToken: (tokenMint: string) => void;
  trendingShowHiddenTokens: boolean;
  setTrendingShowHiddenTokens: (show: boolean) => void;
};

const STORAGE_NAME = "cosmo-hidden-tokens";

function getInitialTokens(): string[] {
  try {
    const cookieValue = Cookies.get(STORAGE_NAME);
    return cookieValue ? JSON.parse(cookieValue) : [];
  } catch (e) {
    return [];
  }
}

function syncWithCookies(tokens: string[]) {
  Cookies.set(STORAGE_NAME, JSON.stringify(tokens), {
    expires: 365,
    path: "/",
  });
}

export const useHiddenTokensStore = create<HiddenTokensState>()(
  persist(
    (set, get) => ({
      cosmoShowHiddenTokens: false,
      setTrendingShowHiddenTokens: (show) => {
        set({ trendingShowHiddenTokens: show });
      },
      hiddenTokens: getInitialTokens(),
      trendingShowHiddenTokens: false,
      setHiddenTokens: (tokens) => {
        syncWithCookies(tokens);
        set({ hiddenTokens: tokens });
      },
      isTokenHidden: (tokenMint) => get().hiddenTokens.includes(tokenMint),
      hideToken: (tokenMint) => {
        const current = get().hiddenTokens;
        if (!current.includes(tokenMint)) {
          const updated = [...current, tokenMint];
          syncWithCookies(updated);
          set({ hiddenTokens: updated });
        }
      },
      setCosmoShowHiddenTokens: (show) => set({ cosmoShowHiddenTokens: show }),
      unhideToken: (tokenMint) => {
        const updated = get().hiddenTokens?.filter((t) => t !== tokenMint);
        syncWithCookies(updated);
        set({ hiddenTokens: updated });
      },
    }),
    {
      name: "cosmo-hidden-tokens",
      storage: createJSONStorage(() => ({
        getItem: (name) => {
          const value = localStorage.getItem(name);
          return value === null ? null : value;
        },
        setItem: (name, value) => {
          localStorage.setItem(name, value);
          const parsed = JSON.parse(value);
          if (parsed.state && Array.isArray(parsed.state.hiddenTokens)) {
            syncWithCookies(parsed.state.hiddenTokens);
          }
        },
        removeItem: (name) => {
          localStorage.removeItem(name);
          Cookies.remove(STORAGE_NAME);
        },
      })),
    },
  ),
);
