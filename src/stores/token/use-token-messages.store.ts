import { create } from "zustand";
import { deduplicateAndPrioritizeLatestData_TransactionWS } from "@/helpers/deduplicateAndPrioritizeLatestData";
import {
  TokenInfo,
  TransactionInfo,
  PriceInfo,
  VolumeInfo,
  DataSecurityInfo,
  ChartHolderInfo,
  ChartTraderInfo,
  NewDeveloperToken,
} from "@/types/ws-general";
import { shallow } from "zustand/shallow";
import { convertTopTradersLamports, convertTradesLamports } from "@/utils/lamportsConverter";
import { NovaSwapKeys } from "@/vendor/ts-keys/types";
import { KeysTxResult } from "@/hooks/use-keys-tx";

const TRANSACTION_LIMIT = 100;
const CHART_HOLDERS_LIMIT = 50;
const CHART_TRADERS_LIMIT = 50;

type TokenMessageState = {
  WSMintRef: WebSocket | null;
  setWSMintRef: (ws: WebSocket | null) => void;
  WSHoldingRef: WebSocket | null;
  setWSHoldingRef: (ws: WebSocket | null) => void;
  tokenInfoMessage: TokenInfo;
  transactionMessages: TransactionInfo[];
  transectionMessagesChangedCount: number;
  priceMessage: PriceInfo;
  volumeMessage: VolumeInfo;
  followingPercentage: number;
  dataSecurityMessage: DataSecurityInfo;
  chartHolderMessages: ChartHolderInfo[];
  totalHolderMessages: number;
  chartTraderMessages: ChartTraderInfo[];
  created: number;
  timestamp: number;
  developerTokens: NewDeveloperToken[];
  swap_keys: KeysTxResult;
  setSwapKeys: (newKeys: KeysTxResult) => void;
  setTokenInfoMessage: (newMessage: TokenInfo) => void;
  setInitTransactionMessages: (init: TransactionInfo[]) => void;
  setTransactionMessages: (
    newMessage: TransactionInfo | TransactionInfo[],
  ) => void;
  // setPriceMessage: (newMessage: PriceInfo) => void;
  setPriceMessage: (
    update: PriceInfo | ((prev: PriceInfo) => PriceInfo),
  ) => void;
  setVolumeMessage: (newMessage: VolumeInfo) => void;
  setDataSecurityMessage: (newMessage: DataSecurityInfo) => void;
  setChartHolderMessages: (newMessages: ChartHolderInfo[]) => void;
  setTotalHolderMessages: (newMessages: number) => void;
  setChartTraderMessages: (newMessages: ChartTraderInfo[]) => void;
  setTimestamp: (newMessage: number) => void;
  setCreated: (newMessage: number) => void;
  setDeveloperTokens: (tokens: NewDeveloperToken[]) => void;
  addDeveloperToken: (token: NewDeveloperToken | NewDeveloperToken[]) => void;
  updateDeveloperTokens: (
    mint: string,
    update:
      | Partial<NewDeveloperToken>
      | ((prev: NewDeveloperToken) => Partial<NewDeveloperToken>),
  ) => void;
  setFollowingPercentage: (percentage: number) => void;
  cleanup: () => void;
};

export const useTokenMessageStore = create<TokenMessageState>()((set, get) => ({
  WSMintRef: null,
  followingPercentage: 0,
  updateDeveloperTokens: (mint, update) =>
    set((state) => {
      const index = state.developerTokens.findIndex((t) => t.mint === mint);
      if (index === -1) return state;

      const prevToken = state.developerTokens[index];
      const partialUpdate =
        typeof update === "function" ? update(prevToken) : update;

      const nextToken = { ...prevToken, ...partialUpdate };

      if (shallow(prevToken, nextToken)) return state;

      const updatedTokens = [...state.developerTokens];
      updatedTokens[index] = nextToken;

      const dedupedTokens = Array.from(
        new Map(updatedTokens.map((t) => [t.mint, t])).values(),
      );

      return {
        developerTokens: dedupedTokens,
      };
    }),
  addDeveloperToken: (token: NewDeveloperToken | NewDeveloperToken[]) =>
    set((state) => {
      const tokensToAdd = Array.isArray(token) ? token : [token];

      // Merge and deduplicate based on mint
      const combined = [...state.developerTokens, ...tokensToAdd];
      const deduped = Array.from(
        new Map(combined.map((t) => [t.mint, t])).values(),
      );

      return {
        developerTokens: deduped,
      };
    }),
  setFollowingPercentage: (percentage) =>
    set(() => ({ followingPercentage: percentage })),
  setWSMintRef: (ws) => {
    if (ws === null) {
      set((state) => {
        if (state.WSMintRef) {
          state.WSMintRef.onclose = null;
          state.WSMintRef.onerror = null;
          state.WSMintRef.onmessage = null;
          state.WSMintRef.onopen = null;
          state.WSMintRef.close();
        }
        return { WSMintRef: null };
      });
    } else {
      set(() => ({ WSMintRef: ws }));
    }
  },
  WSHoldingRef: null,
  setWSHoldingRef: (ws) => {
    if (ws === null) {
      set((state) => {
        if (state.WSHoldingRef) {
          state.WSHoldingRef.onclose = null;
          state.WSHoldingRef.onerror = null;
          state.WSHoldingRef.onmessage = null;
          state.WSHoldingRef.onopen = null;
          state.WSHoldingRef.close();
        }
        return { WSHoldingRef: null };
      });
    } else {
      set(() => ({ WSHoldingRef: ws }));
    }
  },
  tokenInfoMessage: {} as TokenInfo,
  transactionMessages: [],
  transectionMessagesChangedCount: 0,
  priceMessage: {} as PriceInfo,
  volumeMessage: {} as VolumeInfo,
  dataSecurityMessage: {} as DataSecurityInfo,
  chartHolderMessages: [],
  totalHolderMessages: 0,
  chartTraderMessages: [],
  created: 0,
  timestamp: 0,
  developerTokens: [],
  swap_keys: {} as KeysTxResult,
  setSwapKeys: (newKeys) => set(() => ({ swap_keys: newKeys })),
  setTokenInfoMessage: (newMessage) =>
    set(() => ({ tokenInfoMessage: newMessage })),
  setInitTransactionMessages: (init) =>
    set(() => ({
      transactionMessages: convertTradesLamports({
        decimals: {
          base_decimals: get()?.tokenInfoMessage?.base_decimals || 0,
          quote_decimals: get()?.tokenInfoMessage?.quote_decimals || 0,
        },
        trades: init?.slice(0, TRANSACTION_LIMIT) || [],
        supply_str: get().tokenInfoMessage?.supply_str,
      }),
    })),
  setTransactionMessages: (newMessage) =>
    set((state) => {
      if (newMessage === null || newMessage === undefined) return state;
      const messages = Array.isArray(newMessage) ? newMessage : [newMessage];
      const updatedMessages = deduplicateAndPrioritizeLatestData_TransactionWS([
        ...messages,
        ...state.transactionMessages,
      ]);
      return {
        transactionMessages: convertTradesLamports({
          decimals: {
            base_decimals: get()?.tokenInfoMessage?.base_decimals || 0,
            quote_decimals: get()?.tokenInfoMessage?.quote_decimals || 0,
          },
          trades: updatedMessages.slice(0, TRANSACTION_LIMIT),
          supply_str: get().tokenInfoMessage?.supply_str,
        }),
        transectionMessagesChangedCount:
          state.transectionMessagesChangedCount + 1,
      };
    }),
  // setPriceMessage: (newMessage) => set(() => ({ priceMessage: newMessage })),
  setPriceMessage: (update: PriceInfo | ((prev: PriceInfo) => PriceInfo)) => {
    console.warn("SET PRICE MESSAGE 👀", update);

    return set((state) => ({
      priceMessage:
        typeof update === "function"
          ? update(state.priceMessage)
          : { ...state.priceMessage, ...update },
    }));
  },
  setVolumeMessage: (newMessage) => set(() => ({ volumeMessage: newMessage })),
  setDataSecurityMessage: (newMessage) =>
    set(() => ({ dataSecurityMessage: newMessage })),
  setChartHolderMessages: (newMessages) =>
    set(() => ({
      chartHolderMessages: newMessages?.slice(-CHART_HOLDERS_LIMIT) || [],
    })),
  setTotalHolderMessages: (newMessages) =>
    set(() => ({ totalHolderMessages: newMessages })),
  setChartTraderMessages: (newMessages) =>
    set(() => ({
      chartTraderMessages: convertTopTradersLamports({
        decimals: {
          base_decimals: get()?.tokenInfoMessage?.base_decimals || 0,
          quote_decimals: get()?.tokenInfoMessage?.quote_decimals || 0,
        },
        trades: (newMessages?.slice(-CHART_TRADERS_LIMIT) || []),
        // supply_str: get().tokenInfoMessage?.supply_str,
      })
    })),
  setTimestamp: (newMessage) => set(() => ({ timestamp: newMessage })),
  setCreated: (newMessage) => set(() => ({ created: newMessage })),
  setDeveloperTokens: (tokens) =>
    set(() => ({ developerTokens: tokens || [] })),
  cleanup: () =>
    set(() => ({
      tokenInfoMessage: {} as TokenInfo,
      transactionMessages: [],
      transectionMessagesChangedCount: 0,
      priceMessage: {} as PriceInfo,
      volumeMessage: {} as VolumeInfo,
      dataSecurityMessage: {} as DataSecurityInfo,
      chartHolderMessages: [],
      totalHolderMessages: 0,
      chartTraderMessages: [],
      timestamp: 0,
      created: 0,
      developerTokens: [],
      WSMintRef: null,
      WSHoldingRef: null,
      swap_keys: {} as KeysTxResult,
    })),
}));
