import React from "react";
import { areEqual } from "react-window";
import { cn } from "@/libraries/utils";
import MostProfitableCard from "../../cards/wallet-trade/MostProfitableCard";
import { usePopupStore } from "@/stores/use-popup-state.store";
import { useWindowSizeStore } from "@/stores/use-window-size.store";
import { TokenPnL } from "@/apis/rest/wallet-trade-new";

interface VirtualizedCardRowProps {
  data: {
    items: TokenPnL[];
    column: number;
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
      <MostProfitableCard data={item} isModalContent={data.isModalContent} />
    </div>
  );
}

const VirtualizedMostProfitableRow = React.memo(
  VirtualizedCardRowComponent,
  areEqual,
);

VirtualizedMostProfitableRow.displayName = "VirtualizedMostProfitableRow";
export default VirtualizedMostProfitableRow;
