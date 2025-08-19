import { useMemo } from "react";
import { useWalletTrackerMessageStore } from "@/stores/footer/use-wallet-tracker-message.store";

export function useTrackedWalletsOfToken() {
  const messages = useWalletTrackerMessageStore((state) => state.messages);

  const walletsOfToken = useMemo(() => {
    const wallets: Record<string, Set<string>> = {};

    // Use Set for O(1) lookups and automatic deduplication
    for (const message of messages) {
      // Safety check to prevent destructuring errors
      if (!message || !message?.mint || !message?.walletAddress) {
        continue;
      }
      
      const { mint, walletAddress } = message;
      if (!wallets[mint]) {
        wallets[mint] = new Set();
      }
      wallets[mint].add(walletAddress);
    }

    // Convert Sets to arrays only once at the end
    const result: Record<string, string[]> = {};
    for (const [mint, addresses] of Object.entries(wallets)) {
      result[mint] = Array.from(addresses);
    }

    return result;
  }, [messages]);

  return { walletsOfToken };
}
