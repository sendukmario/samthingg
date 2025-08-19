import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

// Define the card config item type
export type CosmoCardViewConfigItem = {
  key: string;
  label: string;
  status: "active" | "inactive";
  type: "stat-text" | "stat-badge";
  position: number;
};

// Define the store type
type CustomViewCosmoCard = {
  cardViewConfig: CosmoCardViewConfigItem[];
  setCardViewConfig: (newConfig: CosmoCardViewConfigItem[]) => void;
  getActiveItemsByType: (
    type?: "stat-badge" | "stat-text",
  ) => CosmoCardViewConfigItem[];
  getInactiveItemsByType: (
    type?: "stat-badge" | "stat-text",
  ) => CosmoCardViewConfigItem[];
  updateItemPosition: (
    key: string,
    type: "stat-badge" | "stat-text",
    position: number,
  ) => void;
};

// Create the store with persistence
export const useCustomCosmoCardView = create<CustomViewCosmoCard>()(
  persist(
    (set, get) => ({
      cardViewConfig: [
        {
          key: "top-10-holders",
          label: "Top 10 Holders",
          status: "active",
          type: "stat-badge",
          position: 1,
        },
        {
          key: "dev-holdings",
          label: "Dev Holdings",
          status: "active",
          type: "stat-badge",
          position: 2,
        },
        {
          key: "star",
          label: "Star",
          status: "active",
          type: "stat-badge",
          position: 3,
        },
        {
          key: "snipers",
          label: "Snipers",
          status: "active",
          type: "stat-badge",
          position: 4,
        },
        {
          key: "insiders",
          label: "Insiders",
          status: "active",
          type: "stat-badge",
          position: 5,
        },
        {
          key: "bundled",
          label: "Bundled",
          status: "active",
          type: "stat-badge",
          position: 6,
        },
        {
          key: "market-cap",
          label: "Market Cap",
          status: "active",
          type: "stat-text",
          position: 1,
        },
        {
          key: "volume",
          label: "Volume",
          status: "active",
          type: "stat-text",
          position: 2,
        },
        {
          key: "holders",
          label: "Holders",
          status: "active",
          type: "stat-text",
          position: 3,
        },
        {
          key: "bags-token-royalties",
          label: "Bags Token Royalties",
          status: "active",
          type: "stat-text",
          position: 4,
        },
        {
          key: "discord",
          label: "Discord Group",
          status: "active",
          type: "stat-text",
          position: 5,
        },
        {
          key: "tracker",
          label: "Tracker",
          status: "active",
          type: "stat-text",
          position: 6,
        },
        {
          key: "bot-total-fee",
          label: "Total Fees Paid",
          status: "active",
          type: "stat-text",
          position: 7,
        },
        {
          key: "regular-users",
          label: "Regular Users",
          status: "active",
          type: "stat-text",
          position: 8,
        },
      ],
      setCardViewConfig: (newConfig) =>
        set({
          cardViewConfig: newConfig,
        }),
      getActiveItemsByType: (type) => {
        const state = get();
        return state.cardViewConfig?.filter(
          (item) => item.type === type && item.status === "active",
        );
      },
      getInactiveItemsByType: (type) => {
        const state = get();
        return (
          state.cardViewConfig?.filter(
            (item) => item.type === type && item.status === "inactive",
          ) || []
        );
      },
      updateItemPosition: (key, type, position) =>
        set((state) => {
          const updatedConfig = state.cardViewConfig?.map((item) =>
            item.key === key && item.type === type
              ? { ...item, position }
              : item,
          );
          return { cardViewConfig: updatedConfig };
        }),
    }),
    {
      name: "custom-cosmo-card-view",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
