import { create } from "zustand";
import { persist } from "zustand/middleware";

export type FeedType = "All" | "Twitter" | "Truth" | "Discord";

type SocialMonitorStoreState = {
  selectedTypeFeeds: FeedType[];
  toggleFeedType: (filter: FeedType) => void;
};

export const useSocialMonitorStore = create<SocialMonitorStoreState>()(
  persist(
    (set) => ({
      selectedTypeFeeds: ["All"],
      toggleFeedType: (filter: FeedType) =>
        set((state) => {
          const currentFeeds = state.selectedTypeFeeds || [];
          if (filter === "All" || currentFeeds.length === 0) {
            return { selectedTypeFeeds: ["All"] };
          }
          if (currentFeeds.includes(filter)) {
            // If already selected, remove it
            const updatedFeeds = currentFeeds?.filter((f) => f !== filter);
            return {
              selectedTypeFeeds:
                updatedFeeds.length === 0 ? ["All"] : updatedFeeds,
            };
          } else {
            // If not selected, add it and remove 'All' if present
            const updatedFeeds = [
              ...currentFeeds?.filter((f) => f !== "All"),
              filter,
            ];
            return {
              selectedTypeFeeds: updatedFeeds,
            };
          }
        }),
    }),
    {
      name: "social-monitor-filter",
      version: 1,
      partialize: (state) => ({
        selectedTypeFeeds: state.selectedTypeFeeds,
      }),
    },
  ),
);
