import { ReferralUserData } from "@/apis/rest/earn-new";
import { create } from "zustand";

type EarnState = {
  refUserData: ReferralUserData | null;
  setRefUserData: (value: ReferralUserData) => void;
  isLoading: boolean;
  setIsLoading: (state: boolean) => void;
  isError: boolean;
  setIsError: (error: boolean) => void;
};

export const useEarnStore = create<EarnState>()((set) => ({
  refUserData: null,
  setRefUserData: (value) => set({ refUserData: value }),
  isLoading: false,
  setIsLoading: (state) => set({ isLoading: state }),
  isError: false,
  setIsError: (error) => set({ isError: error }),
}));
