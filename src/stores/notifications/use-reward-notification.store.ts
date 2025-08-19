// store/useRewardNotificationStore.ts
import { create } from "zustand";

type RewardNotification = {
  id: string;
  message: string;
  timestamp: number;
};

type RewardNotificationState = {
  rewards: RewardNotification[];
  addReward: (reward: RewardNotification) => void;
  removeReward: (id: string) => void;
};

export const useRewardNotificationStore = create<RewardNotificationState>()(
  (set) => ({
    rewards: [],
    addReward: (reward) =>
      set((state) => ({
        rewards: [...(state.rewards || []), reward],
      })),
    removeReward: (id) =>
      set((state) => ({
        rewards: state.rewards?.filter((reward) => reward.id !== id),
      })),
  }),
);
