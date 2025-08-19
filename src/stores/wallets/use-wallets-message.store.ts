import { create } from "zustand";
import { HoldingsConvertedMessageType } from "@/types/ws-general";

type WalletsMessages = {
  wallet: string;
  tokens: number;
};

type WalletsMessageState = {
  messages: WalletsMessages[];
  setMessages: (newMessages: HoldingsConvertedMessageType[]) => void;
};

export const useWalletsMessageStore = create<WalletsMessageState>()((set) => ({
  messages: [],
  setMessages: (newMessages) =>
    set((state) => ({
      messages:
        newMessages !== null
          ? newMessages?.map((message) => {
              let tokenCount = message.tokens.length;
              message.tokens.forEach((token) => {
                if (token.balance - token.sold_base <= 0) {
                  tokenCount -= 1;
                }
              });
              return {
                wallet: message.wallet,
                tokens: tokenCount,
              };
            })
          : state.messages,
    })),
}));
