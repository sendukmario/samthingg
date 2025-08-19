import { create } from "zustand";

interface TrackUserEventState {
  isExternal: boolean;
  setIsExternal: (value: boolean) => void;
}

export const useTrackUserEventStore = create<TrackUserEventState>()((set) => ({
  isExternal: true,
  setIsExternal: (value) =>
    set(() => ({
      isExternal: value,
    })),
}));
