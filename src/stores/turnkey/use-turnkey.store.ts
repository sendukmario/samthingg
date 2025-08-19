import { create } from "zustand";
import { TurnkeyClient } from "@turnkey/http";
import {
  TStamper,
  WalletInterface,
  WalletStamper,
} from "@turnkey/wallet-stamper";
import { createTurnkeyClient } from "@/utils/turnkey/clientAuth";
import axios from "@/libraries/axios";
import { createJSONStorage, persist } from "zustand/middleware";
// import { MockAuthenticateTurnkeyResponse } from "@/app/api/turnkey/mock-authenticate/route";

// TO DO: Some feat on be: createSubOrg, signInWithWallet

export interface Wallet {
  /** @description Unique identifier for a given Wallet. */
  walletId: string;
  /** @description Human-readable name for a Wallet. */
  walletName: string;
  createdAt: string;
  updatedAt: string;
  /** @description True when a given Wallet is exported, false otherwise. */
  exported: boolean;
  /** @description True when a given Wallet is imported, false otherwise. */
  imported: boolean;
}

export type User = {
  organizationId: string;
  organizationName: string;
  userId: string;
  username: string;
  addresses?: string[];
};

type TurnkeyWalletsState = {
  client: TurnkeyClient | null;
  passkeyClient: TurnkeyClient | null;
  walletClient: TurnkeyClient | null;
  wallet: WalletInterface | null;

  setWallet: (
    wallet: WalletInterface | null,
    walletClient?: TurnkeyClient | null,
  ) => void;
  getWallets: () => Promise<Wallet[]>;
  authenticating: boolean;
  user: User | null;
  setUser: (user: User | null) => void;
  createWallet: (walletName: string) => Promise<void>;

  login: (wallet?: WalletInterface) => Promise<any>;
};

export const useTurnkeyStore = create<TurnkeyWalletsState>()(
  persist(
    (set, get): TurnkeyWalletsState => ({
      client: null,
      passkeyClient: null,
      walletClient: null,
      wallet: null,

      setWallet: async (wallet, walletClient) => {
        set({ wallet, walletClient: walletClient || get().walletClient });
      },
      getWallets: async () => {
        // Implementation for getting wallets
        return [];
      },
      authenticating: false,
      user: null,
      setUser: (user: User | null) => {
        set({ user });
      },
      createWallet: async (walletName) => {
        // Implementation for creating a new wallet
      },
      login: async (walletParam?: WalletInterface) => {
        const { wallet } = get();
        const finalWallet = walletParam || wallet;
        console.log("Logging in with wallet:", { finalWallet, walletParam });
        if (!finalWallet) {
          throw new Error("Wallet is not set");
        }
        // axios post to /api/turnkey/mock-authenticate
        const res = await axios.post("/api/turnkey/mock-authenticate", {
          publicKey: finalWallet?.getPublicKey(),
        });

        if (res.status !== 200) {
          throw new Error("Failed to authenticate with Turnkey");
        }

        const { data } = res.data;
        if (!data) {
          throw new Error("No user data returned from Turnkey");
        }

        set({
          user: {
            organizationId: data.organizationId,
            organizationName: data.organizationName,
            userId: data.userId,
            username: data.username,
          },
        });
        return res.data;
      },
    }),
    {
      name: "turnkey",
      storage: createJSONStorage(() => localStorage),
    }
  ))
