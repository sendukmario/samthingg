import { create } from "zustand";
import { ChartHolderInfo } from "@/types/ws-general";
import { shallow } from "zustand/shallow";

type CurrentTokenFreshWalletsState = {
  followedHolders: ChartHolderInfo[];
  top10Balance: number;
  totalCount: number;
  setFollowedHolders: (newHolders: ChartHolderInfo[]) => void;
  setTop10Balance: (newTop10Balance: number) => void;
  setTotalCount: (newTotalCount: number) => void;
  cleanup: () => void;
};

export const useCurrentTokenFollowedHoldersStore =
  create<CurrentTokenFreshWalletsState>()((set) => ({
    followedHolders: [],
    top10Balance: 0,
    totalCount: 0,
    setFollowedHolders: (newHolders) =>
      set((state) => {
        if (shallow(state.followedHolders, newHolders)) {
          return state;
        }
        return { followedHolders: newHolders };
      }),
    setTop10Balance: (newTop10Balance) =>
      set(() => ({
        top10Balance: newTop10Balance,
      })),
    setTotalCount: (newTotalCount) =>
      set(() => ({
        totalCount: newTotalCount,
      })),
    cleanup: () =>
      set(() => ({
        followedHolders: [],
        top10Balance: 0,
        totalCount: 0,
      })),
  }));
