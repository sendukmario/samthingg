import { create } from "zustand";
import { HoldingsConvertedMessageType } from "@/types/ws-general";
import { persist } from "zustand/middleware";
import { StateCreator, StoreApi } from "zustand";
import { PersistOptions, createJSONStorage } from "zustand/middleware";
import { TurnkeyClient } from "@turnkey/http";
import { decryptData, encryptData } from "@/utils/turnkey/encryption";

type TurnkeyWalletsState = {
  eBundles: {
    [key: string]: string | null;
  }
  eBundlesSize: number;
  setEBundles: (
    eBundles: Map<string, string | null>,
    isInit?: boolean,
  ) => Promise<void>;
  getEBundles: () => Promise<Map<string, string | null>>;
  latestGetEBundle: Date | null;
  setPkPb: (pk: string, pb: string) => Promise<void>;
  getPkPb: () => Promise<{ pk: string; pb: string }>;
  pk: string;
  pb: string;
  organizationId: string | null;
  pkBundle: string | null;
  pbBundle: string | null;
  bundle: string | null;
  client: TurnkeyClient | null;
  setClient: (client: TurnkeyClient | null) => void;
  setTurnkey: ({
    organizationId,
    pkBundle,
    pbBundle,
    bundle,
  }: {
    organizationId: string | null;
    pkBundle: string | null;
    pbBundle: string | null;
    bundle: string | null;
  }) => void;
  cleanUp: () => void;
};

export const useTurnkeyWalletsStore = create<TurnkeyWalletsState>()(
  persist(
    (set, get): TurnkeyWalletsState => ({
      eBundlesSize: 0,
      eBundles: {},
      setEBundles: async (bundles, isInit = false) => {
        const encryptedBundles: { [key: string]: string | null } = {};

        for (const [id, eBundle] of bundles) {
          if (eBundle) {
            // const encrypted = await encryptData(eBundle, "SALT");
            encryptedBundles[id] = eBundle;
          } else {
            encryptedBundles[id] = null;
          }
        }
        set({
          eBundles: encryptedBundles,
          latestGetEBundle: isInit ? null : new Date(),
          eBundlesSize: Object.keys(encryptedBundles).length,
        });
      },
      getEBundles: async (): Promise<Map<string, string | null>> => {
        const { eBundles } = get();
        console.log("Getting eBundles:😂", eBundles);
        if (Object.keys(eBundles).length === 0) return new Map();

        const decrypted: { [key: string]: string | null } = {};

        for (const [id, encryptedBundle] of Object.entries(eBundles)) {
          if (encryptedBundle) {
            try {
              // const decryptedBundle = await decryptData(
              //   encryptedBundle,
              //   "SALT",
              // );
              decrypted[id] = encryptedBundle;
            } catch (err) {
              console.warn(`Failed to decrypt e-bundle for ${id}`);
              decrypted[id] = null;
            }
          } else {
            decrypted[id] = null;
          }
        }

        const decryptedMap = new Map(
          Object.entries(decrypted).filter(([_, value]) => value !== null),
        );
        console.log("Getting eBundles:😭", eBundles);

        return decryptedMap;
      },
      latestGetEBundle: null,
      setPkPb: async (pk: string, pb: string) => {
        // const encryptedPk = await encryptData(pk, "SALT");
        // const encryptedPb = await encryptData(pb, "SALT");
        set({ pk: pk, pb: pb });
      },
      getPkPb: async (): Promise<{ pk: string; pb: string }> => {
        const { pk, pb } = get();
        // const decryptedPk = await decryptData(pk, "SALT");
        // const decryptedPb = await decryptData(pb, "SALT");
        return { pk: pk, pb: pb };
      },
      pk: "",
      pb: "",
      pbBundle: null,
      organizationId: null,
      pkBundle: null,
      bundle: null,
      setTurnkey: ({ organizationId, bundle, pkBundle, pbBundle }) =>
        set((state) => ({
          organizationId,
          pkBundle,
          bundle,
          pbBundle
        })),
      cleanUp: () => {
        set({
          eBundles: {},
          eBundlesSize: 0,
          latestGetEBundle: null,
          pk: "",
          pb: "",
          organizationId: null,
          pkBundle: null,
          bundle: null,
        });
      },
      client: null,
      setClient: (client: TurnkeyClient | null) => {
        set({ client });
      }
    }),
    {
      name: "tk-storage",
      storage: createJSONStorage(() => localStorage),
      // partialize: (state) => {
      //   console.log("😂😂😂 Persisting state:", {
      //     state,
      //     eBundles: Object.fromEntries(state.eBundles || {}),
      //   })
      //   return {
      //     ...state,
      //     eBundles: Object.fromEntries(state.eBundles || {}),
      //   }
      // },
      // merge: (persistedState, currentState) => {
      //   const _persisted = persistedState as any;
      //   console.log(
      //     "😂😂😂 Merging persisted state with current state:",
      //     {
      //       currentState,
      //       _persisted,
      //       final: {
      //         ...currentState,
      //         ..._persisted,
      //         eBundles: new Map(Object.entries(_persisted.eBundles || {})),
      //       }
      //     }
      //   )
      //   currentState = _persisted;
      //   return {
      //     ...currentState,
      //     ..._persisted,
      //     eBundles: new Map(Object.entries(_persisted.eBundles || {})),
      //   };
      // },
    },
  ),
);
