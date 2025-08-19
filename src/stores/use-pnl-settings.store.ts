// ######## Libraries 📦 & Hooks 🪝 ########
import { create } from "zustand";
import { persist } from "zustand/middleware";

// ######## Types 🗨️ ########
import {
  Display,
  Size,
} from "@/components/customs/modals/contents/footer/pnl-tracker/types";

const DEFAULT_PNL_SETTINGS = {
  selectedDisplayUSD: "Both",
  selectedTheme: "theme1",
};

interface StoredWallet {
  balance: number;
  address: string;
}

interface CustomImageCard {
  image: string;
  name: string;
}

interface PNLSettingsState {
  userName: string;
  selectedDisplayUSD: Display;
  profilePicture: string;
  selectedTheme: string;
  customPnlCardBackground: string[];
  selectedBackgroundPnlCard?: string;
  customImageCard: CustomImageCard;
  size: Size;
  isOpen: boolean;
  isSettingOpen: boolean;
  storedWallets: StoredWallet[];
  activePnL: number;
  isInitialized: boolean;
  setIsInitialized: (state: boolean) => void;
  setStoredWallets: (state: StoredWallet[]) => void;
}

interface PNLSettingsStore extends PNLSettingsState {
  setSize: (size: Size) => void;
  setActivePnL: (pnl: number) => void;
  setIsOpen: (state: boolean) => void;
  setIsSettingOpen: (state: boolean) => void;
  handleSavePNLSettings: (value: Partial<PNLSettingsState>) => void;
  handleAddCustomPnlCardBackground: (image: string) => void;
  handleDeleteCustomPnlCardBackground: (image: string) => void;
  handleSelectedBackgroundPnlCard: (image: string) => void;
  handleSaveCustomImageCard: (image: string, name: string) => void;
  handleAddNewStoredWallet: (storedWallets: StoredWallet[]) => void;
  handleResetPNLSettings: (storedWallets: StoredWallet[]) => void;
}

export const usePnlSettings = create<PNLSettingsStore>()(
  persist(
    (set) => ({
      selectedDisplayUSD: DEFAULT_PNL_SETTINGS.selectedDisplayUSD as Display,
      selectedTheme: DEFAULT_PNL_SETTINGS.selectedTheme,
      userName: "",
      profilePicture: "",
      customPnlCardBackground: [],
      customImageCard: {
        image: "",
        name: "",
      },
      selectedBackgroundPnlCard: undefined,
      size: { width: 457, height: 194 },
      isOpen: false,
      isSettingOpen: false,
      storedWallets: [],
      activePnL: 0,
      setActivePnL: (activePnL) => set(() => ({ activePnL })),
      setSize: (size) => set(() => ({ size })),
      setIsOpen: (state) => set(() => ({ isOpen: state })),
      setIsSettingOpen: (state) => set(() => ({ isSettingOpen: state })),
      setStoredWallets: (storedWallets) =>
        set((state) => ({
          storedWallets:
            storedWallets !== null ? storedWallets : state.storedWallets,
        })),
      handleSavePNLSettings: (values) =>
        set((state) => {
          let updatedValues = { ...values };
          if (
            values.selectedTheme &&
            values.selectedTheme === state.selectedTheme
          ) {
            updatedValues.size = state.size;
          }

          return { ...state, ...updatedValues };
        }),
      handleAddNewStoredWallet: (values) =>
        set((state) => {
          if (!values) return state;
          const newWalletsTemp = values
            ?.map((w) => {
              const isExisting = state.storedWallets.find(
                (sw) => sw.address === w.address,
              );
              if (isExisting) {
                return null;
              }
              return {
                address: w.address,
                balance: Number(w.balance),
              };
            })
            ?.filter((w) => w !== null) as StoredWallet[];

          const updatedWallets = state.storedWallets;
          updatedWallets.push(...newWalletsTemp);
          return {
            storedWallets: updatedWallets,
          };
        }),
      handleAddCustomPnlCardBackground: (image) =>
        set((state) => {
          const updatedCustomPnlCardBackground = [
            ...state.customPnlCardBackground,
            image,
          ];
          return { customPnlCardBackground: updatedCustomPnlCardBackground };
        }),
      handleDeleteCustomPnlCardBackground: (image) =>
        set((state) => {
          const updatedCustomPnlCardBackground =
            state.customPnlCardBackground?.filter(
              (bgImage) => bgImage !== image,
            );
          return { customPnlCardBackground: updatedCustomPnlCardBackground };
        }),
      handleSelectedBackgroundPnlCard: (image) =>
        set(() => ({
          selectedBackgroundPnlCard: image,
        })),
      handleSaveCustomImageCard: (image, name) =>
        set(() => {
          return {
            customImageCard: { image, name },
          };
        }),
      handleResetPNLSettings: (newWallets) =>
        set((state) => {
          if (state.storedWallets.length === 0) {
            /* console.log("No stored wallets to update.") */
            return {
              storedWallets: newWallets?.map((w) => ({
                address: w.address,
                balance: Number(w.balance),
              })),
            };
          }

          const updatedWallets = state.storedWallets?.map((wallet) => {
            const match = newWallets.find((w) => w.address === wallet.address);
            return match
              ? { ...wallet, balance: Number(match.balance) }
              : { ...wallet };
          });
          return {
            storedWallets: updatedWallets,
          };
        }),
      isInitialized: false,
      setIsInitialized: (state) => set(() => ({ isInitialized: state })),
    }),
    {
      name: "pnl-settings",
    },
  ),
);
