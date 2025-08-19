"use client";
// ######## Libraries 📦 & Hooks 🪝 ########
import React, { useMemo } from "react";
// ######## Components 🧩 ########
import TokenTradingChart from "@/components/customs/token/TokenTradingChart";
import TokenTabs from "@/components/customs/token/TokenTabs";
// const TokenTabs = dynamic(
//   () => import("@/components/customs/token/TokenTabs"),
//   {
//     ssr: false,
//     loading: TokenTablesLoading,
//   },
// );
// ######## Types 🗨️ ########
import { TokenDataMessageType } from "@/types/ws-general";
// ######## Utils & Helpers 🤝 ########
import { cn } from "@/libraries/utils";
import { usePopupStore } from "@/stores/use-popup-state.store";
import { useCupseySnap } from "@/stores/use-cupsey-snap.store";
// import dynamic from "next/dynamic";
// import { TokenTablesLoading } from "../loadings/TokenPageLoading";
const LeftTokenSection = React.memo(
  ({
    initChartData,
    mint,
  }: {
    initChartData: TokenDataMessageType | null;
    mint: string;
  }) => {
    const popups = usePopupStore((state) => state.popups);
    const remainingScreenWidth = usePopupStore(
      (state) => state.remainingScreenWidth,
    );
    const cupseySnap = useCupseySnap((state) => state.snap);
    const isSnapOpen = useMemo(() => {
      return (
        popups.some((p) => p.isOpen && p.snappedSide !== "none") ||
        cupseySnap?.["left"]?.bottom ||
        cupseySnap?.["left"]?.top ||
        cupseySnap?.["right"]?.bottom ||
        cupseySnap?.["right"]?.top
      );
    }, [popups, cupseySnap]);

    return (
      <div
        className={cn(
          "flex h-full flex-grow flex-col items-start gap-4 md:gap-2",
          isSnapOpen && "min-w-0 basis-0",
          remainingScreenWidth && remainingScreenWidth <= 900
            ? "w-full gap-4 md:px-3"
            : "w-[calc(100%-365px)]",
          // "md:gap-4 xl:w-[100%] xl:px-3",
        )}
      >
        <TokenTradingChart mint={mint} tokenData={initChartData} />

        <TokenTabs initChartData={initChartData} />
      </div>
    );
  },
);
LeftTokenSection.displayName = "LeftTokenSection";

export default LeftTokenSection;
