import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/libraries/utils";
import { CupseySnapKey, useCupseySnap } from "@/stores/use-cupsey-snap.store";
import { usePopupStore } from "@/stores/use-popup-state.store";
import { useWindowSizeStore } from "@/stores/use-window-size.store";
import Image from "next/image";
import React from "react";

const CupseyFooter = ({
  menu,
  handleToggleOpenPnLModal,
  openPnLModal,
  position = "left",
}: {
  menu: {
    key: string;
    name: string;
    icon: string;
  }[];
  handleToggleOpenPnLModal: (openPnLModal: boolean) => void;
  openPnLModal: boolean;
  position?: "left" | "right";
}) => {
  const {
    snap: cupseySnap,
    setSnap,
    setIsOpenSniper,
    isOpenSniper,
  } = useCupseySnap();
  const isCupseySnapOpen =
    cupseySnap?.[position]?.bottom || cupseySnap?.[position]?.top;
  const rightSnap = [cupseySnap?.right.bottom, cupseySnap?.right.top];
  const leftSnap = [cupseySnap?.left.bottom, cupseySnap?.left.top];
  const currentSnap = position === "left" ? leftSnap : rightSnap;
  const inverseSnap = position === "left" ? rightSnap : leftSnap;
  const finalMenu = position === "left" ? menu : menu.toReversed();
  const inversePosition = position === "left" ? "right" : "left";
  const width = useWindowSizeStore((state) => state.width);
  const setRemainingScreenWidth = usePopupStore(
    (state) => state.setRemainingScreenWidth,
  );
  const triggerCalculateHeight = useCupseySnap(
    (state) => state.triggerCalculateHeight,
  );

  const handleClickSnapButton = () => {
    triggerCalculateHeight?.()
    if (isCupseySnapOpen) {
      setSnap({ top: undefined, bottom: undefined }, position);
      setRemainingScreenWidth(() => width || window.innerWidth);
    } else {
      if (rightSnap.length > 0 || leftSnap.length > 0) {
        setRemainingScreenWidth(() => (width || window.innerWidth) - 840);
      } else {
        setRemainingScreenWidth(() => (width || window.innerWidth) - 420);
      }
      if (inverseSnap.includes("wallet-tracker")) {
        if (inverseSnap.includes("monitor")) {
          setSnap({ top: "alerts", bottom: undefined }, position);
        } else {
          setSnap({ top: "monitor", bottom: undefined }, position);
        }
      } else if (inverseSnap.includes("monitor")) {
        if (inverseSnap.includes("alerts")) {
          setSnap({ top: "wallet-tracker", bottom: undefined }, position);
        } else {
          setSnap({ top: "alerts", bottom: undefined }, position);
        }
      } else if (inverseSnap.includes("alerts")) {
        if (inverseSnap.includes("wallet-tracker")) {
          setSnap({ top: "monitor", bottom: undefined }, position);
        } else {
          setSnap({ top: "wallet-tracker", bottom: undefined }, position);
        }
      } else {
        setSnap({ top: "wallet-tracker", bottom: undefined }, position);
      }
    }
  };

  return (
    <>
      <div
        className={cn(
          "fixed z-[1000] flex h-[40px] w-[40px] items-center justify-center overflow-hidden rounded-lg border border-t-0 border-white/20 bg-[#ffffff1A] bg-gradient-to-b from-[#2b2d3d] to-[#191a23]",
          isCupseySnapOpen && "w-fit border-transparent",
          position === "left" && "left-20",
          position === "right" && "right-20",
          width! >= 1280 ? "bottom-7" : "bottom-16",
        )}
      >
        {position === "left" && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleClickSnapButton}
                  className={cn(
                    "relative flex h-[40px] w-[40px] items-center justify-center overflow-hidden",
                  )}
                >
                  {isCupseySnapOpen && (
                    <div className="pointer-events-none absolute left-0 top-0 z-[10] size-full bg-black/40" />
                  )}
                  <div className="relative flex size-5 items-center justify-center">
                    <Image
                      src="/icons/grid-cupsey.svg"
                      alt="Cupsey Icon"
                      fill
                      quality={100}
                      className="object-contain"
                      loading="lazy"
                    />
                  </div>
                </button>
              </TooltipTrigger>
              <TooltipContent>Snap</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {isCupseySnapOpen &&
          (finalMenu || [])?.map((item) => (
            <TooltipProvider key={item.key}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => {
                      triggerCalculateHeight?.();
                      if (item.key === "sniper") {
                        setIsOpenSniper(!isOpenSniper);
                        return;
                      } else if (item.key === "pnl-tracker") {
                        handleToggleOpenPnLModal(openPnLModal);
                        return;
                      } else if (cupseySnap?.[position]?.top === item.key) {
                        setSnap(
                          {
                            top: cupseySnap?.[position]?.bottom,
                            bottom: undefined,
                          },
                          position,
                        );
                      } else if (cupseySnap?.[position]?.bottom === item.key) {
                        setSnap(
                          {
                            top: cupseySnap?.[position]?.top,
                            bottom: undefined,
                          },
                          position,
                        );
                      } else {
                        setSnap(
                          {
                            top:
                              cupseySnap?.[position]?.top ||
                              cupseySnap?.[position]?.bottom,
                            bottom: item.key as CupseySnapKey,
                          },
                          position,
                        );
                      }
                      // else if (
                      //   cupseySnap?.[inversePosition]?.top === item.key
                      // ) {
                      //   setSnap(
                      //     {
                      //       top: item.key as CupseySnapKey,
                      //       bottom:
                      //         cupseySnap?.[position]?.bottom ||
                      //         cupseySnap?.[position]?.top,
                      //     },
                      //     position,
                      //   );
                      // } else if (
                      //   cupseySnap?.[inversePosition]?.bottom === item.key
                      // ) {
                      //   setSnap(
                      //     {
                      //       top:
                      //         cupseySnap?.[position]?.top ||
                      //         cupseySnap?.[position]?.bottom,
                      //       bottom: item.key as CupseySnapKey,
                      //     },
                      //     position,
                      //   );
                      // }
                      if (cupseySnap?.[inversePosition]?.bottom === item.key) {
                        setSnap(
                          {
                            top: cupseySnap?.[inversePosition]?.top,
                            bottom: undefined,
                          },
                          inversePosition,
                        );
                      } else if (
                        cupseySnap?.[inversePosition]?.top === item.key
                      ) {
                        setSnap(
                          {
                            top: undefined,
                            bottom: cupseySnap?.[inversePosition]?.bottom,
                          },
                          inversePosition,
                        );
                      }
                    }}
                    className={cn(
                      "relative flex h-[40px] w-[40px] items-center justify-center border-l border-border",
                    )}
                  >
                    {(currentSnap.includes(item.key as CupseySnapKey) ||
                      (item.key === "sniper" && isOpenSniper) ||
                      (item.key === "pnl-tracker" && openPnLModal)) && (
                      <div className="pointer-events-none absolute left-0 top-0 z-[10] size-full bg-black/40" />
                    )}
                    <div className="relative flex size-5 items-center justify-center">
                      <Image
                        src={item.icon}
                        alt={item.name + " Icon"}
                        fill
                        quality={100}
                        className="object-contain"
                        loading="lazy"
                      />
                    </div>
                  </button>
                </TooltipTrigger>
                <TooltipContent>{item.name}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}

        {position === "right" && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleClickSnapButton}
                  className={cn(
                    "relative flex h-[40px] w-[40px] items-center justify-center",
                  )}
                >
                  {isCupseySnapOpen && (
                    <div className="pointer-events-none absolute left-0 top-0 z-[10] size-full bg-black/40" />
                  )}
                  <div className="relative flex size-5 rotate-180 items-center justify-center">
                    <Image
                      src="/icons/grid-cupsey.svg"
                      alt="Cupsey Icon"
                      fill
                      quality={100}
                      className="object-contain"
                      loading="lazy"
                    />
                  </div>
                </button>
              </TooltipTrigger>
              <TooltipContent>Snap</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </>
  );
};

export default CupseyFooter;
