import { create } from "zustand";
import { persist } from "zustand/middleware";

type TelegramSettingsState = {
  telegramUserId: number;
  setTelegramUserId: (value: number) => void;
  novaUserId: string;
  setNovaUserId: (value: string) => void;
  isInitialized: boolean;
  setIsInitialized: (value: boolean) => void;
};

export const useTelegramSettingsStore = create<TelegramSettingsState>()(
  persist(
    (set) => ({
      isInitialized: false,
      setIsInitialized: (value) => set({ isInitialized: value }),
      telegramUserId: 0,
      setTelegramUserId: (value) => set({ telegramUserId: value }),
      novaUserId: "",
      setNovaUserId: (value) => set({ novaUserId: value }),
    }),
    {
      name: "telegram-settings",
    },
  ),
);
