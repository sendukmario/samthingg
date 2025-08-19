import { create } from "zustand";

interface BlockhashStore {
  blockhash: string | null,
  setBlockhash: (blockhash: string | null) => void
}

export const useBlockhashStore = create<BlockhashStore>()((set) => ({
  blockhash: null,
  setBlockhash: (blockhash) => set(() => ({ blockhash })),
}));
