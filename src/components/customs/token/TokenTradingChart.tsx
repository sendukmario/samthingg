"use client";

// ######## Libraries 📦 & Hooks 🪝 ########
import { useChartSizeStore } from "@/stores/token/use-chart-size.store";
import { Resizable } from "re-resizable";
import { useTradesPanelStore } from "@/stores/token/use-trades-panel.store";
import { cn } from "@/libraries/utils";

// ######## Components 🧩 ########
// const TokenWalletSelection = dynamic(
//   () => import("@/components/customs/token/TokenWalletSelection"),
//   {
//     // ssr: false,
//     // loading: TokenWalletSelectionLoading,
//   },
// );
import TokenWalletSelection from "@/components/customs/token/TokenWalletSelection";
import TVChartContainer from "@/components/TVChartContainer/NovaTradingView";
import { TokenDataMessageType } from "@/types/ws-general";
import TradesPanel from "./TradesPanel";
import { memo } from "react";

function TokenTradingChart({
  mint,
  tokenData,
}: {
  mint: string;
  tokenData: TokenDataMessageType | null;
}) {
  const { height, setChartHeight } = useChartSizeStore();
  const isTradesPanelOpen = useTradesPanelStore((state) => state.isOpen);
  const setIsTradesPanelOpen = useTradesPanelStore((state) => state.setIsOpen);

  const handleResize = (_e: any, _direction: any, ref: HTMLElement) => {
    setChartHeight(ref.offsetHeight);
  };

  return (
    <div className="flex w-full gap-2">
      <div
        className={cn(
          "inline-block h-auto space-y-2 rounded-[8px] px-4 transition-all duration-300 md:mt-0 md:border md:border-border md:bg-white/[2%] md:px-0",
          "relative z-0 flex-1",
          isTradesPanelOpen && "pr-6",
        )}
      >
        <TokenWalletSelection />
        <Resizable
          size={{
            width: "100%",
            height: height,
          }}
          minHeight={308}
          enable={{
            top: false,
            right: false,
            bottom: true,
            left: false,
            topRight: false,
            bottomRight: false,
            bottomLeft: false,
            topLeft: false,
          }}
          onResizeStop={handleResize}
          handleStyles={{
            bottom: {
              bottom: "-2px",
              background: "transparent",
              border: "none",
              width: isTradesPanelOpen ? "calc(100vw - 425px)" : "100%",
              height: "4px",
              left: "0",
              transform: "none",
            },
          }}
          handleClasses={{
            bottom: "!bg-transparent",
          }}
          handleComponent={{
            bottom: (
              <div
                className={cn(
                  "absolute bottom-0 right-0 -z-10 -mb-[7px] flex h-2 w-full cursor-row-resize flex-col items-center justify-center overflow-visible opacity-0 duration-200 ease-in-out hover:opacity-100",
                )}
              >
                <div className="flex h-1.5 w-full items-center justify-center rounded-full bg-shadeTable">
                  <div className="h-[2.5px] w-24 rounded-full bg-primary"></div>
                </div>
                {/* <div className="h-[3px] w-full "></div> */}
              </div>
            ),
          }}
          className="relative z-10 h-full rounded-[8px] border border-border bg-[#080812] md:mt-0 md:rounded-none md:border-0 md:border-border"
        >
          <div className="h-full overflow-hidden rounded-[8px] pb-0">
            <TVChartContainer mint={mint} tokenData={tokenData} />
          </div>
        </Resizable>
        <button
          className={cn(
            "absolute right-0 top-1/2 z-20 -translate-y-1/2",
            "h-5 w-3 rounded-l-md border-y border-l border-border bg-[hsl(286,90%,73%/0.1)]",
            "transition-colors duration-200 hover:bg-[hsl(286,90%,73%/0.15)]",
            "hidden items-center justify-center lg:flex",
          )}
          onClick={() => {
            const newState = !isTradesPanelOpen;
            setIsTradesPanelOpen(newState);
            localStorage.setItem(
              "trades-panel-state",
              newState ? "open" : "closed",
            );

            // Dispatch a custom event to notify TokenTabs
            const event = new CustomEvent("tradesPanelStateChange", {
              detail: { isOpen: newState },
            });
            window.dispatchEvent(event);
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn(
              "text-[hsl(286,90%,73%)]",
              "transition-transform duration-200",
              !isTradesPanelOpen && "rotate-180",
            )}
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      </div>
      <TradesPanel initData={tokenData} />
    </div>
  );
}

export default memo(TokenTradingChart);
