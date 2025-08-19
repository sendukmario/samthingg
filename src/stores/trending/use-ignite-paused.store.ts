import { create } from "zustand";

interface IgnitePausedState {
  /** Whether the user is currently hovering over the Ignite token list */
  isIgniteHovered: boolean;
  /** Setter to update the hovered state */
  setIsIgniteHovered: (isHovered: boolean) => void;
}

/**
 * Global store that signals when the Ignite token list should pause real-time updates.
 * The list component (IgniteTokensSection) will toggle `isIgniteHovered` on mouse enter/leave,
 * and data providers such as `TrendingClient` should consult this flag before mutating state.
 */
export const useIgnitePaused = create<IgnitePausedState>()((set) => ({
  isIgniteHovered: false,
  setIsIgniteHovered: (isHovered) => set({ isIgniteHovered: isHovered }),
}));
