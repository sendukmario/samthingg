import { TrackedWallet, WalletTracker } from "@/apis/rest/wallet-tracker";
import { create } from "zustand";
import { deduplicateAndPrioritizeLatestData_WalletTracker } from "@/helpers/deduplicateAndPrioritizeLatestData";
import { convertWalletTrackerLamports } from "@/utils/lamportsConverter";

type WalletTrackerMessageState = {
  messages: WalletTracker[];
  messagesPaused: WalletTracker[];
  currentSingleSelectedAddress: string;
  setMessages: (
    newMessages: WalletTracker[] | WalletTracker,
    type?: "add" | "replace",
  ) => void;
  setMessagesPaused: (newMessages: WalletTracker[] | WalletTracker) => void;
  setInitMessages: (newMessages: WalletTracker[] | WalletTracker) => void;
  setCurrentSingleSelectedAddress: (address: string) => void;
  trackedWallets: TrackedWallet[];
  setTrackedWallets: (newTrackedWallets: TrackedWallet[]) => void;
  isExistingTx: (mint: string) => boolean;
};

export const useWalletTrackerMessageStore = create<WalletTrackerMessageState>()(
  (set, get) => ({
    messages: [],
    messagesPaused: [],
    currentSingleSelectedAddress: "",
    setMessagesPaused: (newMessages) =>
      set((state) => ({
        messagesPaused: newMessages !== null ? [
          ...deduplicateAndPrioritizeLatestData_WalletTracker([
            ...(Array.isArray(newMessages) ? newMessages.map(convertWalletTrackerLamports) : [newMessages].map(convertWalletTrackerLamports)),
            ...state.messagesPaused,
          ]),
        ] : state.messagesPaused,
      })),
    setMessages: (newMessages, type = "add") =>
      set((state) => {
        if (type === "add") {
          return {
            messages: newMessages !== null ? [
              ...deduplicateAndPrioritizeLatestData_WalletTracker([
                ...(Array.isArray(newMessages) ? newMessages.map(convertWalletTrackerLamports) : [newMessages].map(convertWalletTrackerLamports)),
                ...state.messages,
              ]),
            ].slice(0, 100) : state.messages,
          };
        } else {
          return {
            messages: newMessages !== null ? deduplicateAndPrioritizeLatestData_WalletTracker(
              Array.isArray(newMessages) ? newMessages.map(convertWalletTrackerLamports) : [newMessages].map(convertWalletTrackerLamports),
            ) : state.messages,
          };
        }
      }),
    setInitMessages: (newMessages) =>
      set({
        messages: newMessages !== null ? Array.isArray(newMessages) ? newMessages.map(convertWalletTrackerLamports) : [newMessages].map(convertWalletTrackerLamports) : [],
      }),
    setCurrentSingleSelectedAddress: (address) =>
      set({
        currentSingleSelectedAddress: address,
      }),
    trackedWallets: [],
    setTrackedWallets: (newTrackedWallets) =>
      set((state) => ({
        ...state,
        trackedWallets: (newTrackedWallets || []),
      })),
    isExistingTx: (mint: string) => {
      return get().messages.some((tx: WalletTracker) => tx.mint === mint);
    },
  }),
);
