"use client";

// ######## Libraries 📦 & Hooks 🪝 ########
import React, { useCallback } from "react";
import StatBadge from "@/components/customs/cards/partials/StatBadge";
// ######## Utils & Helpers 🤝 ########
import { cn } from "@/libraries/utils";
// ######## Zustand Store ########
import { useCustomCosmoCardView } from "@/stores/setting/use-custom-cosmo-card-view.store";
import { usePopupStore } from "@/stores/use-popup-state.store";
import { CosmoCardStyleSetting } from "@/apis/rest/settings/settings";

const StatBadges = ({
  isMigrating,
  stars,
  snipers,
  insiderPercentage,
  top10Percentage,
  devHoldingPercentage,
  isSnapOpen,
  isLargePreset,
  isXLPreset,
  bundled = false,
  cardType = "type1",
  isWrap,
  className,
}: {
  isMigrating: boolean;
  stars: number;
  snipers: number;
  insiderPercentage: number;
  top10Percentage: number;
  devHoldingPercentage: number;
  isSnapOpen: boolean;
  isLargePreset: boolean;
  isXLPreset: boolean;
  bundled: boolean;
  cardType?: CosmoCardStyleSetting;
  isWrap?: boolean;
  className?: string;
}) => {
  // Get card view configuration from Zustand store
  const cardViewConfig = useCustomCosmoCardView((state) => state.cardViewConfig);

  // Function to check if a specific card view is active
  const isCardViewActive = useCallback(
    (key: string): boolean => {
      const configItem = cardViewConfig.find((item) => item.key === key);
      return configItem?.status === "active";
    },
    [cardViewConfig],
  );
  const remainingScreenWidth = usePopupStore(
    (state) => state.remainingScreenWidth,
  );

  // Render badges in different order for type4
  const renderBadges = () => {
    const renderStar = () => {
      return (
        isCardViewActive("star") && (
          <StatBadge
            isMigrating={isMigrating}
            icon="star"
            value={stars || 0}
            label="Star"
            tooltipLabel="Dev Tokens Migrated"
            valueColor={
              cardType === "type4" ? "text-[#b5b7da]" : "text-fontColorPrimary"
            }
            cardType={cardType}
          />
        )
      );
    };
    const renderSnipers = () => {
      return (
        isCardViewActive("snipers") && (
          <StatBadge
            isMigrating={isMigrating}
            icon={cardType === "type4" ? "snipe-cupsey" : "snipe-gray"}
            value={snipers || 0}
            label="Snipe"
            tooltipLabel="Snipers"
            valueColor={
              cardType === "type4"
                ? snipers >= 1
                  ? "text-[#FF4B92]"
                  : "text-[#b5b7da]"
                : snipers >= 1
                  ? "text-destructive"
                  : "text-fontColorPrimary"
            }
            cardType={cardType}
          />
        )
      );
    };
    const renderInsiders = () => {
      return (
        isCardViewActive("insiders") && (
          <StatBadge
            isMigrating={isMigrating}
            icon="insiders"
            value={insiderPercentage.toFixed(0) || 0}
            label="Insiders"
            tooltipLabel="Insiders"
            valueColor={
              cardType === "type4"
                ? insiderPercentage <= 5
                  ? "text-[#3ed6cc]"
                  : "text-[#FF4B92]"
                : insiderPercentage <= 5
                  ? "text-success"
                  : "text-destructive"
            }
            suffix="%"
            cardType={cardType}
          />
        )
      );
    };
    const renderTop10Holders = () => {
      return (
        isCardViewActive("top-10-holders") && (
          <StatBadge
            isMigrating={isMigrating}
            value={top10Percentage.toFixed(0) || 0}
            customIcon={
              cardType === "type4" ? (
                <div className="mr-0.5 flex size-[12px] items-center justify-center rounded-sm bg-[#727694] font-geistSemiBold text-[7.5px] leading-[0px] text-black">
                  10
                </div>
              ) : undefined
            }
            label="T10"
            tooltipLabel="Top 10 Holders"
            valueColor={
              cardType === "type4"
                ? top10Percentage < 10
                  ? "text-[#3ed6cc]"
                  : top10Percentage > 10 && top10Percentage <= 15
                    ? "text-[#e7b587]"
                    : "text-[#FF4B92]"
                : top10Percentage < 10
                  ? "text-success"
                  : top10Percentage > 10 && top10Percentage <= 15
                    ? "text-warning"
                    : "text-destructive"
            }
            suffix="%"
            cardType={cardType}
          />
        )
      );
    };
    const renderDevHoldings = () => {
      return (
        isCardViewActive("dev-holdings") && (
          <StatBadge
            isMigrating={isMigrating}
            value={devHoldingPercentage.toFixed(0) || 0}
            customIcon={
              cardType === "type4" ? (
                <div className="mr-0.5 flex size-[12px] items-center justify-center rounded-sm bg-[#4eede3] font-geistSemiBold text-[7.5px] leading-[0px] text-black">
                  DH
                </div>
              ) : undefined
            }
            label="DH"
            tooltipLabel="Dev Holdings"
            valueColor={
              cardType === "type4"
                ? devHoldingPercentage === 0
                  ? "text-[#b5b7da]"
                  : devHoldingPercentage < 75
                    ? "text-[#3ed6cc]"
                    : "text-[#FF4B92]"
                : devHoldingPercentage === 0
                  ? "text-fontColorSecondary"
                  : devHoldingPercentage < 75
                    ? "text-success"
                    : "text-destructive"
            }
            suffix="%"
            cardType={cardType}
          />
        )
      );
    };
    const renderBundled = () => {
      return (
        cardType !== "type1" &&
        isCardViewActive("bundled") && (
          <StatBadge
            isMigrating={isMigrating}
            value={bundled ? "YES" : "NO"}
            icon="bundled"
            label="Bundled"
            tooltipLabel="Bundled"
            valueColor={
              cardType === "type4"
                ? Boolean(bundled)
                  ? "text-[#3ed6cc]"
                  : "text-[#FF4B92]"
                : Boolean(bundled)
                  ? "text-success"
                  : "text-destructive"
            }
            cardType={cardType}
          />
        )
      );
    };

    if (cardType === "type3" || cardType === "type2") {
      return (
        <>
          {renderStar()}
          {renderSnipers()}
          {renderInsiders()}
          {renderTop10Holders()}
          {renderDevHoldings()}
          {renderBundled()}
        </>
      );
    }

    if (cardType === "type4") {
      return (
        <>
          {renderTop10Holders()}
          {renderDevHoldings()}
          {renderBundled()}
          {renderStar()}
          {renderSnipers()}
          {renderInsiders()}
        </>
      );
    }

    return (
      <>
        <>
          {renderStar()}
          {renderSnipers()}
          {renderInsiders()}
        </>
        <>
          {renderTop10Holders()}
          {renderDevHoldings()}
          {renderBundled()}
        </>
      </>
    );
  };

  return (
    <div
      className={cn(
        "flex flex-wrap items-center",
        isSnapOpen && "w-[180px]",
        remainingScreenWidth < 1440 &&
          (isXLPreset || isLargePreset) &&
          cardType !== "type1" &&
          "w-[240px]",
        isSnapOpen &&
          remainingScreenWidth < 1440 &&
          cardType === "type3" &&
          "w-[150px]",
        isWrap && "w-fit flex-wrap",
        className,
      )}
    >
      {renderBadges()}
    </div>
  );
};
StatBadges.displayName = "StatBadges";
export default StatBadges;
