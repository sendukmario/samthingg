import { TrendingDataMessageType } from "@/types/ws-general";
import React from "react";
import { areEqual } from "react-window";
import TrendingCardMobile from "./mobile/TrendingCardMobile";

interface RowProps {
  data: {
    items: TrendingDataMessageType[];
    trackedWalletsOfToken: Record<string, string[]>;
    column: number;
  };
  index: number;
  style: React.CSSProperties;
}

// Memoized row component to prevent re-renders
const TrendingCardMobileRow = React.memo(({ data, index, style }: RowProps) => {
  const item = data.items[index];

  return (
    <div style={style}>
      <TrendingCardMobile
        isFirst={index === 0}
        key={index}
        tokenData={item}
        trackedWalletsOfToken={data.trackedWalletsOfToken}
      />
    </div>
  );
}, areEqual); // Using react-window's areEqual for deep comparison

TrendingCardMobileRow.displayName = "TrendingCardMobileRow";
export default TrendingCardMobileRow;
