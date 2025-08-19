import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface DeviceAndBrowserForScrollbar {
  isAppleEnvirontment: boolean;
  isBrowserWithoutScrollbar: boolean;
  isOSEnvirontmentAlreadySet: boolean;
  isBrowserAlreadySet: boolean;
  setIsAppleEnvirontment: (isApple: boolean) => void;
  setIsBrowserWithoutScrollbar: (isBrowser: boolean) => void;
}

export const useDeviceAndBrowserForScrollbarStore =
  create<DeviceAndBrowserForScrollbar>()(
    persist(
      (set) => ({
        isAppleEnvirontment: false,
        isBrowserWithoutScrollbar: false,
        isOSEnvirontmentAlreadySet: false,
        isBrowserAlreadySet: false,
        setIsAppleEnvirontment: (isApple = false) => {
          set(() => ({
            isAppleEnvirontment: isApple,
            isOSEnvirontmentAlreadySet: true,
          }));
        },
        setIsBrowserWithoutScrollbar: (isBrowserWithoutScrollbar = false) => {
          set(() => ({
            isBrowserWithoutScrollbar: isBrowserWithoutScrollbar,
            isBrowserAlreadySet: true,
          }));
        },
      }),
      {
        name: "device-and-browser-for-scrollbar-state",
        storage: createJSONStorage(() => localStorage),
      },
    ),
  );
