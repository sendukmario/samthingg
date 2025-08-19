import { create } from "zustand";
import type { SwapKeysResponse } from "../../types/swap";

interface SwapKeysState {
  // Current token swap data
  swapKeys: SwapKeysResponse | null;
  isLoading: boolean;
  error: string | null;
  
  // Current token mint for reference
  currentMint: string | null;
  
  // Actions
  setSwapKeys: (swapKeys: SwapKeysResponse) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setCurrentMint: (mint: string) => void;
  
  // Reset/cleanup
  cleanup: () => void;
}

export const useSwapKeysStore = create<SwapKeysState>((set) => ({
  // Initial state
  swapKeys: null,
  isLoading: false,
  error: null,
  currentMint: null,
  
  // Actions
  setSwapKeys: (swapKeys) => 
    set({ 
      swapKeys, 
      error: null // Clear any previous errors when successful
    }),
    
  setLoading: (isLoading) => 
    set({ isLoading }),
    
  setError: (error) => 
    set({ error, isLoading: false }),
    
  setCurrentMint: (currentMint) => 
    set({ currentMint }),
  
  // Cleanup function to reset all state
  cleanup: () => 
    set({
      swapKeys: null,
      isLoading: false,
      error: null,
      currentMint: null,
    }),
}));
