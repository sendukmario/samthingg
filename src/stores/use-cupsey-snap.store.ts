import { Size } from "@/components/customs/modals/contents/footer/pnl-tracker/types";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { mergeDeepLeft } from "ramda";

export type CupseySnapKey = "sniper" | "wallet-tracker" | "monitor" | "alerts";

interface CupseySnapState {
  isOpenSniper: boolean;
  setIsOpenSniper: (isOpen: boolean) => void;
  sniperSize: Size;
  setSniperSize: (size: Size) => void;
  sniperPosition?: {
    x: number;
    y: number;
  };
  setSniperPosition?: (position: { x: number; y: number }) => void;
  snap: {
    left: {
      top?: CupseySnapKey;
      bottom?: CupseySnapKey;
    };
    right: {
      top?: CupseySnapKey;
      bottom?: CupseySnapKey;
    };
  };
  calculateHeightTrigger?: number;
  triggerCalculateHeight?: () => void;
  setSnap: (
    snap: { top?: CupseySnapKey; bottom?: CupseySnapKey },
    position: "left" | "right",
  ) => void;
}

export const useCupseySnap = create<CupseySnapState>()(
  persist(
    (set, get) => ({
      calculateHeightTrigger: 0,
      triggerCalculateHeight: () =>
        set((state) => ({
          calculateHeightTrigger: state.calculateHeightTrigger! > 10 ? 0 : state.calculateHeightTrigger! + 1,
        })),
      sniperPosition: { x: 0, y: 0 },
      setSniperPosition: (position) =>
        set(() => ({
          sniperPosition: {
            ...position,
          },
        })),
      isOpenSniper: false,
      setIsOpenSniper: (isOpen) =>
        set(() => ({
          isOpenSniper: isOpen,
        })),
      sniperSize: {
        width: 400,
        height: 600,
      },
      setSniperSize: (size) =>
        set(() => ({
          sniperSize: {
            ...size,
          },
        })),
      snap: {
        left: {
          top:undefined,
          bottom: undefined,
        },
        right: {
          top:undefined,
          bottom: undefined,
        },
      },
      setSnap: (snap, position) => {
        const currentSnap = get().snap;
        return set(() => ({
          snap: {
            ...currentSnap,
            [position]: snap,
          },
        }));
      },
    }),
    {
      name: "cupsey-snap",
      storage: createJSONStorage(() => localStorage),
      merge: (persistedState, currentState) =>
        mergeDeepLeft(persistedState as CupseySnapState, currentState),
    },
  ),
);
