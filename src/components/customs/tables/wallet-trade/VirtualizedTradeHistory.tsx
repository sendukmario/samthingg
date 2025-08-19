import React from "react";
import { areEqual } from "react-window";
import { cn } from "@/libraries/utils";
import TradeHistoryCard from "../../cards/wallet-trade/TradeHistoryCard";
// import { usePopupStore } from "@/stores/use-popup-state";
import { useWindowSizeStore } from "@/stores/use-window-size.store";
import { usePopupStore } from "@/stores/use-popup-state.store";
import { LoadingSkeleton } from "./TradeHistoryTable";
import { Transactions } from "@/apis/rest/wallet-trade-new";

interface VirtualizedCardRowProps {
  data: {
    items: Transactions[];
    column: number;
    isLoadingNextPage: boolean;
    [key: string]: any;
  };
  index: number;
  style: React.CSSProperties;
}

// Reusable memoized component
function VirtualizedCardRowComponent({
  data,
  index,
  style,
}: VirtualizedCardRowProps) {
  const item = data.items[index];
  const { remainingScreenWidth } = usePopupStore();
  const width = useWindowSizeStore((state) => state.width);

  return (
    <div
      style={style}
      className={cn(
        "w-full",
        index % 2 === 0 && width! > 768 && "bg-white/[4%]",
        // index % 2 === 0 ? "bg-white/[4%] max-md:bg-card" : "bg-card",
        !data.isModalContent && remainingScreenWidth < 800 && "bg-transparent",
      )}
    >
      <TradeHistoryCard
        data={item}
        walletAddress={data.walletAddress}
        isModalContent={data.isModalContent}
      />
      {data.isLoadingNextPage && index === data.items.length - 1 && (
        <>
          {Array.from({ length: 3 })?.map((_, index) => (
            <LoadingSkeleton
              key={index}
              isModalContent={data.isModalContent}
              remainingScreenWidth={remainingScreenWidth}
            />
          ))}
        </>
      )}
    </div>
  );
}

const VirtualizedTradeHistoryRow = React.memo(
  VirtualizedCardRowComponent,
  areEqual,
);

VirtualizedTradeHistoryRow.displayName = "VirtualizedTradeHistoryRow";
export default VirtualizedTradeHistoryRow;
