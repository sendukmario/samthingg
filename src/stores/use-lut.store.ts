import * as solana from "@solana/web3.js";
import { create } from "zustand";

interface LutStore {
  lut: solana.AddressLookupTableAccount | null,
  setLut: (lut: solana.AddressLookupTableAccount | null) => void
}

export const useLutStore = create<LutStore>()((set) => ({
  lut: null,
  setLut: (lut) => set(() => ({ lut })),
}));
