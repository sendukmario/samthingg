import { useCustomizeTheme } from "@/hooks/use-customize-theme";
import { CupseySnapKey, useCupseySnap } from "@/stores/use-cupsey-snap.store";
import React, { useState } from "react";
import SniperContent from "./SniperContent";
import WalletTrackerModalContent from "./modals/contents/footer/WalletTrackerModalContent";
import TwitterMonitorModalContent from "./modals/contents/footer/twitter/TwitterMonitorModalContent";
import AlertsModalContent from "./modals/contents/footer/AlertsModalContent";
import { cn } from "@/libraries/utils";
import { Resizable } from "re-resizable";
import { useWindowSizeStore } from "@/stores/use-window-size.store";

const CupseySnap = ({ position }: { position: "left" | "right" }) => {
  const theme = useCustomizeTheme();
  const width = useWindowSizeStore((state) => state.width);
  const { snap, triggerCalculateHeight } = useCupseySnap();
  const isSnapOpen = snap?.[position]?.top || snap?.[position]?.bottom;
  const isDoubleSnap = snap?.[position]?.top && snap?.[position]?.bottom;

  const [topSnapHeight, setChartHeight] = useState(408);
  const handleResize = (_e: any, _direction: any, ref: HTMLElement) => {
    setChartHeight(ref.offsetHeight);
    triggerCalculateHeight?.();
  };

  const cupseySnapMap: Record<CupseySnapKey, React.ReactNode> = {
    sniper: <SniperContent />,
    "wallet-tracker": <WalletTrackerModalContent variant="cupsey-snap" />,
    monitor: <TwitterMonitorModalContent variant="cupsey-snap" />,
    alerts: <AlertsModalContent variant="cupsey-snap" />,
  };

  return (
    <>
      {width! > 768 && (
        <div
          className={cn(
            "h-full w-fit",
            isSnapOpen && "w-96 p-2",
            position === "left" ? "pl-5" : "pr-5",
          )}
        >
          <div
            style={theme.background}
            className={cn(
              "relative flex size-full h-full flex-col overflow-hidden rounded-md border border-border text-fontColorPrimary shadow-lg",
              !isSnapOpen && "cursor-pointer border-transparent",
            )}
          >
            <Resizable
              size={{
                width: "100%",
                height: !isDoubleSnap ? "100%" : topSnapHeight,
              }}
              minHeight={208}
              maxHeight={!isDoubleSnap ? undefined : window.innerHeight - 328}
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
                  width: "100%",
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
                      "absolute bottom-0 right-0 -z-10 flex h-2 w-full cursor-row-resize flex-col items-center justify-center overflow-visible opacity-0 duration-200 ease-in-out hover:opacity-100",
                    )}
                  >
                    <div className="flex h-1.5 w-full items-center justify-center rounded-full bg-shadeTable">
                      <div className="h-[2.5px] w-24 rounded-full bg-primary"></div>
                    </div>
                    {/* <div className="h-[3px] w-full "></div> */}
                  </div>
                ),
              }}
              className={cn(
                "relative z-10 h-full overflow-hidden rounded-[8px] border border-border md:mt-0 md:rounded-none md:border-0 md:border-b md:border-border",
                snap?.[position]?.top
                  ? snap?.[position]?.top === "wallet-tracker"
                    ? "pb-20"
                    : snap?.[position]?.top === "alerts" && "pb-10"
                  : !snap?.[position]?.top &&
                      snap?.[position]?.bottom === "alerts" &&
                      "pb-10",
              )}
            >
              {snap?.[position]?.top
                ? cupseySnapMap[snap?.[position]?.top]
                : snap?.[position]?.bottom
                  ? cupseySnapMap[snap?.[position]?.bottom]
                  : null}
            </Resizable>
            <div
              className={cn(
                "h-full",
                snap?.[position]?.top &&
                  snap?.[position]?.bottom &&
                  (snap?.[position]?.bottom === "wallet-tracker"
                    ? "pb-20"
                    : snap?.[position]?.bottom === "alerts" && "pb-10"),
              )}
            >
              {snap?.[position]?.top &&
                snap?.[position]?.bottom &&
                cupseySnapMap[snap?.[position]?.bottom]}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CupseySnap;
