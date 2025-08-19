import { create } from 'zustand';

interface TradesPanelStore {
  isOpen: boolean;
  isHovered: boolean;
  setIsOpen: (isOpen: boolean) => void;
  setIsHovered: (isHovered: boolean) => void;
}

export const useTradesPanelStore = create<TradesPanelStore>((set) => ({
  isOpen: false,
  isHovered: false,
  setIsOpen: (isOpen) => set({ isOpen }),
  setIsHovered: (isHovered) => set({ isHovered }),
})); 