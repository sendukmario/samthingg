import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

// Define the card config item type
export type IgniteCardViewConfigItem = {
  key: string;
  label: string;
  status: "active" | "inactive";
  type: "security" | "data";
  position: number;
};

// Define the store type
type CustomViewIgniteCard = {
  cardViewConfig: IgniteCardViewConfigItem[];
  setCardViewConfig: (newConfig: IgniteCardViewConfigItem[]) => void;
  getActiveItemsByType: (
    type?: "data" | "security",
  ) => IgniteCardViewConfigItem[];
  getInactiveItemsByType: (
    type?: "data" | "security",
  ) => IgniteCardViewConfigItem[];
  updateItemPosition: (
    key: string,
    type: "data" | "security",
    position: number,
  ) => void;
};

// Create the store with persistence
export const useCustomIgniteCardView = create<CustomViewIgniteCard>()(
  persist(
    (set, get) => ({
      cardViewConfig: [
        // #== Data Items ==#
        {
          key: "volume",
          label: "Volume",
          status: "active",
          type: "data",
          position: 1,
        },
        {
          key: "liquidity",
          label: "Liquidity",
          status: "active",
          type: "data",
          position: 2,
        },
        {
          key: "holders",
          label: "Holders",
          status: "active",
          type: "data",
          position: 3,
        },
        {
          key: "real-users",
          label: "Real Users",
          status: "active",
          type: "data",
          position: 4,
        },

        // #== Security Items ==#
        {
          key: "snipe",
          label: "Snipe",
          status: "active",
          type: "security",
          position: 1,
        },
        {
          key: "insiders",
          label: "Insiders",
          status: "active",
          type: "security",
          position: 2,
        },
        {
          key: "dev-holdings",
          label: "Dev Holdings",
          status: "active",
          type: "security",
          position: 3,
        },
        {
          key: "dev-token-migrated",
          label: "Dev Tokens Migrated",
          status: "active",
          type: "security",
          position: 4,
        },
        {
          key: "total-fees",
          label: "Total Fees Paid",
          status: "active",
          type: "security",
          position: 5,
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
      name: "custom-ignite-card-view",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
