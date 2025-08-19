import React from "react";
import { areEqual } from "react-window";
import DeployedTokensCard from "../../cards/wallet-trade/DeployedTokensCard";
import { cn } from "@/libraries/utils";
import { usePopupStore } from "@/stores/use-popup-state.store";
import { useWindowSizeStore } from "@/stores/use-window-size.store";
import { NewDeveloperToken } from "@/types/ws-general";

interface VirtualizedCardRowProps {
  data: {
    items: NewDeveloperToken[];
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
  // const item = transformDeployedTokenData(data.items[index]);
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
      <DeployedTokensCard data={item} isModalContent={data.isModalContent} />
    </div>
  );
}

const VirtualizedDeployedTokenRow = React.memo(
  VirtualizedCardRowComponent,
  areEqual,
);

VirtualizedDeployedTokenRow.displayName = "VirtualizedCardDeployedTokenCard";
export default VirtualizedDeployedTokenRow;
