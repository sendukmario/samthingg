import React from "react";
import { areEqual } from "react-window";
import { cn } from "@/libraries/utils";
import { TransformedHoldingData } from "./HoldingTable";
import HoldingCard from "../../cards/wallet-trade/HoldingCard";
import { usePopupStore } from "@/stores/use-popup-state.store";
import { useWindowSizeStore } from "@/stores/use-window-size.store";
import { Holding } from "@/apis/rest/wallet-trade-new";

interface VirtualizedCardRowProps {
  data: {
    items: Holding[];
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
  const width = useWindowSizeStore((state) => state.width);
  const { remainingScreenWidth } = usePopupStore();

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
      <HoldingCard
        data={item}
        solPrice={data.solPrice}
        isModalContent={data.isModalContent}
      />
    </div>
  );
}

const VirtualizedHoldingRow = React.memo(VirtualizedCardRowComponent, areEqual);

VirtualizedHoldingRow.displayName = "VirtualizedHoldingRow";
export default VirtualizedHoldingRow;
