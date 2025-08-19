import { create } from "zustand";
import { persist } from "zustand/middleware";

const SOUNDS = ["none", "ping", "ding", "blink"] as const;
export type SoundType = (typeof SOUNDS)[number];

export type ListType =
  | "newlyCreated"
  | "aboutToGraduate"
  | "graduated"
  | "trending";

// Per-wallet sound configuration
interface WalletSoundConfig {
  walletAddress: string;
  walletName?: string; // For display purposes
  newlyCreatedSound: SoundType;
  aboutToGraduateSound: SoundType;
  graduatedSound: SoundType;
  trendingSound: SoundType;
}

// Global defaults for each list type
interface GlobalSoundDefaults {
  newlyCreatedSound: SoundType;
  aboutToGraduateSound: SoundType;
  graduatedSound: SoundType;
  trendingSound: SoundType;
}

interface CosmoSoundState {
  // Global defaults (fallback when no wallet-specific config exists)
  globalDefaults: GlobalSoundDefaults;

  // Per-wallet sound configurations
  walletConfigs: Record<string, WalletSoundConfig>; // key: wallet address

  // Actions for global defaults
  setGlobalSound: (listType: ListType, sound: SoundType) => void;

  // Actions for wallet-specific sounds
  setWalletSound: (
    walletAddress: string,
    listType: ListType,
    sound: SoundType,
    walletName?: string,
  ) => void;
  getWalletSound: (walletAddress: string, listType: ListType) => SoundType;

  // Bulk operations
  initializeWalletConfigs: (
    wallets: { address: string; name?: string }[],
  ) => void;
  removeWalletConfig: (walletAddresses: string[]) => void; // Updated to accept array

  // Sound playing utilities
  getSoundForWallet: (walletAddress: string, listType: ListType) => SoundType;
  playWalletSound: (walletAddress: string, listType: ListType) => Promise<void>;
}

export const useCosmoSoundStore = create<CosmoSoundState>()(
  persist(
    (set, get) => ({
      globalDefaults: {
        newlyCreatedSound: "none",
        aboutToGraduateSound: "none",
        graduatedSound: "none",
        trendingSound: "none",
      },

      walletConfigs: {},

      setGlobalSound: (listType: ListType, sound: SoundType) =>
        set((state) => ({
          globalDefaults: {
            ...state.globalDefaults,
            [`${listType}Sound`]: sound,
          },
        })),

      setWalletSound: (
        walletAddress: string,
        listType: ListType,
        sound: SoundType,
        walletName?: string,
      ) =>
        set((state) => ({
          walletConfigs: {
            ...state.walletConfigs,
            [walletAddress]: {
              ...state.walletConfigs[walletAddress],
              walletAddress,
              walletName:
                walletName || state.walletConfigs[walletAddress]?.walletName,
              [`${listType}Sound`]: sound,
            } as WalletSoundConfig,
          },
        })),

      getWalletSound: (walletAddress: string, listType: ListType) => {
        const state = get();
        const walletConfig = state.walletConfigs[walletAddress];
        if (walletConfig) {
          return walletConfig[`${listType}Sound`];
        }
        return state.globalDefaults[`${listType}Sound`];
      },

      initializeWalletConfigs: (
        wallets: { address: string; name?: string }[],
      ) =>
        set((state) => {
          const newConfigs = { ...state.walletConfigs };

          wallets.forEach((wallet) => {
            if (!newConfigs[wallet.address]) {
              // Initialize all wallet sounds to "none" for first time
              newConfigs[wallet.address] = {
                walletAddress: wallet.address,
                walletName: wallet.name,
                newlyCreatedSound: "none",
                aboutToGraduateSound: "none",
                graduatedSound: "none",
                trendingSound: "none",
              };
            } else {
              // Update wallet name if provided, but keep existing sound configs
              if (wallet.name) {
                newConfigs[wallet.address].walletName = wallet.name;
              }
            }
          });

          return { walletConfigs: newConfigs };
        }),

      removeWalletConfig: (walletAddresses: string[]) =>
        set((state) => {
          const newConfigs = { ...state.walletConfigs };

          // Remove all specified wallet addresses
          walletAddresses.forEach((address) => {
            delete newConfigs[address];
          });

          return { walletConfigs: newConfigs };
        }),

      getSoundForWallet: (walletAddress: string, listType: ListType) => {
        const state = get();
        return state.getWalletSound(walletAddress, listType);
      },

      playWalletSound: async (walletAddress: string, listType: ListType) => {
        const sound = get().getSoundForWallet(walletAddress, listType);
        if (sound !== "none") {
          try {
            const audio = new Audio(`/sfx/cosmo/${sound}.mp3`);
            await audio.play();
          } catch (error) {
            console.warn(
              `Failed to play sound for wallet ${walletAddress}:`,
              error,
            );
          }
        }
      },
    }),
    {
      name: "cosmo-sound-storage",
    },
  ),
);
