import React from "react";
import Image from "next/image";
import { cn } from "@/libraries/utils";
import { usePnlSettings } from "@/stores/use-pnl-settings.store";

function PnLCustomContent({ templateData }: { templateData: any }) {
  const { customImageCard } = usePnlSettings();

  return (
    <div className="body z-[10] font-interMedium">
      <Image
        className="absolute left-[26px] top-[22px]"
        src="/template/assets/nova-logo-text.svg"
        alt="logo"
        width={74}
        height={0}
      />
      <main className="pnl-main">
        <div className="main-container">
          <div className="token-container">
            {templateData.image && templateData.symbol !== "ALL HOLDINGS" && (
              <div className="token-logo relative" id="token-logo-container">
                <Image
                  src={templateData.image as string}
                  className="token-logo-image"
                  alt="token-logo"
                  fill
                />
              </div>
            )}

            <span className="token-name">
              {templateData.symbol}
            </span>
          </div>

          <div
            className={cn(
              "custom-pnl mt-2 w-[70%] px-2.5 font-interBold text-[40px] text-black",
              templateData.isProfit ? "bg-[#2EF5B8]" : "bg-[#F52E6B]",
            )}
          >
            {templateData.showUSD ? (
              templateData.profitD
            ) : (
              <div className="flex text-black">
                <div className="relative mr-[10px] flex h-auto w-[30px] items-center justify-center">
                  <Image
                    src="/template/assets/sol-black.svg"
                    alt="sol icon"
                    fill
                    className="object-contain"
                  />
                </div>
                {templateData.profit}
              </div>
            )}
          </div>

          <div className="ml-3 mt-3 flex w-[50%] flex-col font-interMedium">
            <div
              className={cn(
                "flex items-center justify-between text-[18px]",
                templateData.isProfit ? "text-[#2EF5B8]" : "text-[#F52E6B]",
              )}
            >
              <div>PNL</div>
              <div className="pnl-percentage">{templateData.roi}</div>
            </div>
            <div className="flex items-center justify-between text-[18px]">
              <div className="text-white/[80%]">Bought</div>
              <div className="custom-bought text-[#FBF6FF]">
                {templateData.investedD}
              </div>
            </div>
            <div className="flex items-center justify-between text-[18px]">
              <div className="text-white/[80%]">Position</div>
              <div className="custom-position text-[#FBF6FF]">
                {templateData.holdingD}
              </div>
            </div>
          </div>

          <div className="mt-5 flex w-full items-center">
            {customImageCard?.image ? (
              <Image
                src={customImageCard?.image}
                alt="Profile Picture"
                width={32}
                height={32}
                className="size-8 rounded-[4px] object-cover"
              />
            ) : (
              <div className="size-8 rounded-[4px] bg-black" />
            )}
            <div className="ml-2 font-interMedium text-[20px] text-white/[80%]">
              {customImageCard?.name || "TradeOnNova"}
            </div>
          </div>

          <div className="mt-0.5 flex gap-x-1">
            <div className="font-interRegular text-[12px] text-white/[70%]">
              nova.trade - {templateData.referralCode}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default PnLCustomContent;
