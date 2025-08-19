import { create } from "zustand";
import { DiscordChannel, FinalDiscordMessage } from "@/types/monitor";
import { fetchTokenPings } from "@/apis/rest/discord-monitor";
import { DiscordMonitorMessageType } from "@/types/ws-general";
import { persist, createJSONStorage } from "zustand/middleware";

type DiscordMonitorState = {
  isLoading: boolean;
  // isRenewing: boolean;
  messages: FinalDiscordMessage[];
  accounts: string[] | DiscordChannel[];
  // websocketRef: WebSocket | null;
  setIsLoading: (state: boolean) => void;
  // setIsRenewing: (state: boolean) => void;
  setMessages: (newMessages: DiscordMonitorMessageType) => void;
  removeMessagesBasedOnRemovedAccount: (account: string) => void;
  setAccounts: (newAccounts: string[] | DiscordChannel[]) => void;
  resetMessages: () => void;
  // setWebsocketRef: (ws: WebSocket | null) => void;
};

const tokenMap = new Map<string, FinalDiscordMessage>();

const groupImages: Record<string, string> = {
  Vanquish: "/icons/vanquish.jpg",
  Potion: "/icons/potion.jpg",
  Minted: "/icons/minted.jpg",
  "Champs Only": "/icons/champs-only.jpg",
  "Shocked Trading": "/icons/shocked-trading.png",
  "Technical Alpha Group": "/icons/alpha-group.jpg",
  "Nova Playground": "/logo.png",
};

export async function fetchAndUpdatePings(address: string) {
  const data = await fetchTokenPings(address);
  if (!data) return;

  const existing = tokenMap.get(address);
  if (!existing) return;

  existing.total_count = data.total_count;
  existing.group_counts = [];
  existing.channel_counts = {};

  const groupCountMap: Record<string, number> = {};

  for (const ping of data.pings) {
    const { group, channel, count } = ping;

    // Update group count map
    groupCountMap[group] = (groupCountMap[group] || 0) + count;

    // Update channel counts
    if (!existing.channel_counts[group]) {
      existing.channel_counts[group] = {};
    }
    existing.channel_counts[group][channel] = count;
  }

  // Convert to group_counts array
  for (const groupName in groupCountMap) {
    existing.group_counts.push({
      name: groupName,
      count: groupCountMap[groupName],
      image: groupImages[groupName] || "/images/groups/default.png",
      pinged_first:
        data.pings.find((ping) => ping.group === groupName)?.pinged_first ||
        false,
    });
  }
}

export function saveTokenMessage(msg: FinalDiscordMessage) {
  tokenMap.set(msg.address, msg);
}

export const useDiscordMonitorMessageStore = create<DiscordMonitorState>()(
  persist(
    (set, get) => ({
      isLoading: true,
      // isRenewing: false,
      messages: [],
      accounts: [],
      // websocketRef: null,
      setIsLoading: (newState) => set(() => ({ isLoading: newState })),
      // setIsRenewing: (newState) => set(() => ({ isRenewing: newState })),
      setMessages: async (newMessage: DiscordMonitorMessageType) => {
        if ((newMessage as any).action || (newMessage as any).licenseKey)
          return;

        const state = get();

        const pingData = await fetchTokenPings(newMessage.address);
        if (!pingData) return;

        const enriched: FinalDiscordMessage = {
          ...newMessage,
          last_updated: newMessage.timestamp,
          total_count: pingData?.total_count || 0,
          group_counts: [],
          channel_counts: {},
        };

        const groupMap = new Map<
          string,
          {
            name: string;
            count: number;
            image: string;
            pinged_first: boolean;
            pinged_timestamp?: string;
          }
        >();

        (pingData?.pings || []).forEach((ping) => {
          // Group counts
          if (groupMap.has(ping.group)) {
            groupMap.get(ping.group)!.count += ping.count;
          } else {
            groupMap.set(ping.group, {
              name: ping.group,
              count: ping.count,
              image: groupImages[ping.group] || "/images/groups/default.png",
              pinged_first: ping.pinged_first,
              pinged_timestamp: ping?.pinged_timestamp,
            });
          }

          // Channel counts
          if (!enriched?.channel_counts?.[ping.group]) {
            enriched.channel_counts[ping.group] = {};
          }
          enriched.channel_counts[ping.group][ping.channel] = ping.count;
        });

        enriched.group_counts = Array.from(groupMap.values()) || [];

        saveTokenMessage(enriched);

        const updatedMessages = [...(state.messages || []), enriched].slice(
          -50,
        );
        set({ messages: updatedMessages });
      },
      removeMessagesBasedOnRemovedAccount: (account) => {
        const state = get();

        const updatedMessages = state.messages
          .filter((msg) => msg.group !== account)
          .map((msg) => {
            // Find the group to check its pinged_first status
            const targetGroup = msg.group_counts.find(
              (group) => group.name === account,
            );

            // If group doesn't exist or is pinged_first, do nothing
            if (!targetGroup || targetGroup.pinged_first) return msg;

            // Otherwise, remove from group_counts and channel_counts
            const updatedGroupCounts = msg.group_counts.filter(
              (group) => group.name !== account,
            );

            const { [account]: _, ...updatedChannelCounts } =
              msg.channel_counts;

            return {
              ...msg,
              group_counts: updatedGroupCounts,
              channel_counts: updatedChannelCounts,
            };
          });

        console.warn("DC 🐣🐣🐣👋", {
          account,
          updatedMessages,
        });

        set({ messages: updatedMessages });
      },

      setAccounts: (newAccounts) =>
        set(() => ({ accounts: newAccounts || [] })),
      // setWebsocketRef: (ws) =>
      //   set(() => {
      //     if (ws === null) {
      //       set((state) => {
      //         if (state.websocketRef) {
      //           state.websocketRef.onclose = null;
      //           state.websocketRef.onerror = null;
      //           state.websocketRef.onmessage = null;
      //           state.websocketRef.onopen = null;
      //           state.websocketRef.close();
      //         }
      //         return {};
      //       });
      //     }
      //     return ws === null
      //       ? {
      //           websocketRef: null,
      //         }
      //       : { websocketRef: ws };
      //   }),
      resetMessages: () => set(() => ({ messages: [] })),
    }),
    {
      name: "discord-monitor-storage",
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);
