"use client";

import { useTradesPanelStore } from "@/stores/token/use-trades-panel.store";
import { cn } from "@/libraries/utils";
import { Resizable } from "re-resizable";
import TradesPanelTable from "../tables/token/Trades/TradesPanelTable";
import { TokenDataMessageType } from "@/types/ws-general";
import { usePanelTradesSizeStore } from "@/stores/token/use-panel-size.store";
import { useMemo } from "react";
import { useWindowSize } from "@/hooks/use-window-size";

interface TradesPanelProps {
  initData: TokenDataMessageType | null;
}

export default function TradesPanel({ initData }: TradesPanelProps) {
  const isOpen = useTradesPanelStore((state) => state.isOpen);
  const { width, height, setPanelTradesWidth, setPanelTradesHeight } =
    usePanelTradesSizeStore();

  const { width: windowWidth } = useWindowSize();
  const isLargeScreen = useMemo(() => windowWidth! > 1024, [windowWidth]);

  if (!isOpen || !isLargeScreen) return null;

  return (
    <Resizable
      size={{
        width: width,
        height: "100%",
      }}
      onResizeStop={(_e, _direction, ref) => {
        setPanelTradesWidth(ref.style.width);
      }}
      minWidth={300}
      maxWidth="50%"
      minHeight={460}
      enable={{
        top: false,
        right: false,
        bottom: false,
        left: true,
        topRight: false,
        bottomRight: false,
        bottomLeft: false,
        topLeft: false,
      }}
      handleComponent={{
        left: (
          <div className="group absolute -left-2 top-0 flex h-full w-[12px] cursor-col-resize items-center">
            <div className="h-full w-[3px] bg-border/20 transition-colors group-hover:bg-shadeTable"></div>
          </div>
        ),
      }}
      className={cn(
        "relative hidden h-auto overflow-visible rounded-[8px] md:inline-block",
        "md:border md:border-border md:bg-white/[2%]",
        "after:pointer-events-auto after:absolute after:-left-3 after:top-0 after:z-[-1] after:h-full after:w-[16px] after:transition-colors after:hover:bg-shadeTable/20",
        "pt-0",
      )}
      handleWrapperClass="handle-wrapper z-[5]"
      handleStyles={{
        left: {
          transition: "all 0.1s ease",
          zIndex: 5,
        },
        bottom: {
          transition: "all 0.1s ease",
          zIndex: 5,
        },
      }}
    >
      <TradesPanelTable initData={initData} />
    </Resizable>
  );
}
