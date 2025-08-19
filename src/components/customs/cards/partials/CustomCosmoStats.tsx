import { CosmoCardStyleSetting } from "@/apis/rest/settings/settings";
import StatBadge from "@/components/customs/cards/partials/StatBadge";
import StatText from "@/components/customs/cards/partials/StatText";
import DevSoldTooltip from "@/components/customs/cards/partials/DevSoldTooltip";
import BagsTokenRoyaltiesTooltip from "@/components/customs/cards/partials/BagsTokenRoyaltiesTooltip";
import {
  badgeMarginMap,
  customStatGapMap,
  fontSizeMap,
  iconBadgeSizeMap,
  iconSizeMap,
  valueColorMap,
} from "@/components/customs/cards/partials/StatTexts";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/libraries/utils";
import {
  CosmoCardViewConfigItem,
  useCustomCosmoCardView,
} from "@/stores/setting/use-custom-cosmo-card-view.store";
import { useCustomizeSettingsStore } from "@/stores/setting/use-customize-settings.store";
import { FinalDiscordMessage } from "@/types/monitor";
import Image from "next/image";
import React, { useEffect, useMemo, useRef } from "react";
import TokenTrackers from "@/components/customs/cards/partials/TokenTrackers";
import {
  formatAmount,
  formatAmountDollar,
  formatAmountWithoutLeadingZero,
} from "@/utils/formatAmount";
import { DiscordGroupIconSVG } from "@/components/customs/ScalableVectorGraphics";
import { useCosmoStyle } from "@/stores/cosmo/use-cosmo-style.store";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { BagsRoyalty } from "@/types/ws-general";

export type CustomCosmoStatKeys =
  | "star"
  | "snipers"
  | "insiders"
  | "top-10-holders"
  | "dev-holdings"
  | "market-cap"
  | "volume"
  | "holders"
  | "bags-token-royalties"
  | "bundled"
  | "discord"
  | "tracker"
  | "regular-users"
  | "bot-total-fee";

const CustomCosmoStats = ({
  devHoldingPercentage,
  discord,
  holders,
  bags_royalties,
  bot_total_fees,
  regular_users,
  insiderPercentage,
  isMigrating,
  isDevSold,
  marketCapUSD,
  mint,
  snipers,
  stars,
  top10Percentage,
  volumeUSD,
  bundled_percentage = 0,
  type,
  cardType = "type1",
  className,
  customCardViewConfig,
  isFirst = false,
  dev_wallet_details,
}: {
  // Default Stat Badges
  isMigrating: boolean;
  isDevSold: boolean;
  stars: number;
  snipers: number;
  insiderPercentage: number;
  top10Percentage: number;
  devHoldingPercentage: number;
  bundled_percentage?: number;

  // Default Stat Texts
  discord: {
    is_discord_monitored?: boolean;
    discord_details?: FinalDiscordMessage;
  };
  marketCapUSD: number;
  volumeUSD: number;
  holders: number;
  bags_royalties?: BagsRoyalty[];
  regular_users?: number;
  bot_total_fees?: number;

  // Others prop
  mint: string;
  type: "stat-badge" | "stat-text";
  cardType?: CosmoCardStyleSetting;
  className?: string;
  customCardViewConfig?: CosmoCardViewConfigItem[];
  isFirst?: boolean;
  dev_wallet_details: {
    developer: string;
    funder: {
      amount: number;
      time: number;
      wallet: string;
      exchange: string;
      tx_hash: string;
    };
    mint: string;
  };
}) => {
  const cardViewConfig = useCustomCosmoCardView(
    (state) => state.cardViewConfig,
  );

  const customizedSettingPresets = useCustomizeSettingsStore(
    (state) => state.presets,
  );
  const customizedSettingActivePreset = useCustomizeSettingsStore(
    (state) => state.activePreset,
  );
  const setCurrentCustomStatsHeight = useCosmoStyle(
    (s) => s.setCurrentCustomStatsHeight,
  );
  const currentCustomStatsHeight = useCosmoStyle(
    (s) => s.currentCustomStatsHeight,
  );
  const customStatsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      if (customStatsRef.current && setCurrentCustomStatsHeight && isFirst) {
        setCurrentCustomStatsHeight(customStatsRef.current.offsetHeight, type);
      }
    }, 100); // Every 1 second

    return () => clearInterval(interval); // Cleanup
  }, [
    setCurrentCustomStatsHeight,
    devHoldingPercentage,
    discord,
    holders,
    bags_royalties,
    bot_total_fees,
    regular_users,
    insiderPercentage,
    isMigrating,
    isDevSold,
    marketCapUSD,
    mint,
    snipers,
    stars,
    top10Percentage,
    volumeUSD,
    bundled_percentage,
    type,
    cardType,
    className,
    customCardViewConfig,
    isFirst,
    dev_wallet_details,
  ]);

  const currentPresets = useMemo(
    () => ({
      fontSetting:
        customizedSettingPresets[customizedSettingActivePreset].fontSetting ||
        "normal",
      avatarSetting:
        customizedSettingPresets[customizedSettingActivePreset].avatarSetting ||
        "normal",
      colorSetting:
        customizedSettingPresets[customizedSettingActivePreset].colorSetting ||
        "normal",
      buttonSetting:
        customizedSettingPresets[customizedSettingActivePreset].buttonSetting ||
        "normal",
      cosmoCardStyleSetting:
        customizedSettingPresets[customizedSettingActivePreset]
          .cosmoCardStyleSetting || "type1",
    }),
    [customizedSettingPresets, customizedSettingActivePreset],
  );

  // Get active items by type and sorted by position
  const activeItemsBy = useMemo(() => {
    return (customCardViewConfig || cardViewConfig)
      ?.filter((item) => item.type === type && item.status === "active")
      ?.sort((a, b) => a.position - b.position);
  }, [type]);

  const formattedStats = useMemo(
    () => ({
      marketCap: marketCapUSD ? formatAmountDollar(marketCapUSD) : "0",
      volume: volumeUSD ? formatAmountDollar(volumeUSD) : "0",
      regularUsers: regular_users ? formatAmount(regular_users) : "0",
      botTotalFees: bot_total_fees
        ? formatAmountWithoutLeadingZero(bot_total_fees, 1)
        : "0",
    }),
    [marketCapUSD, volumeUSD, regular_users, bot_total_fees],
  );

  // Market Cap
  const marketCapValueColor = useMemo(() => {
    if (!marketCapUSD) return "text-destructive";

    if (marketCapUSD > 100000)
      return currentPresets.colorSetting === "cupsey"
        ? "text-[#50D7B0]"
        : "text-success";
    if (marketCapUSD > 30000)
      return currentPresets.colorSetting === "cupsey"
        ? "text-[#E7B587]"
        : "text-warning";
    if (marketCapUSD > 15000)
      return currentPresets.colorSetting === "cupsey"
        ? "text-[#73D5F8]"
        : "text-[#6ac0ed]";
    return currentPresets.colorSetting === "cupsey"
      ? "text-[#FF4B92]"
      : "text-destructive";
  }, [marketCapUSD, currentPresets.colorSetting]);

  const renderStats = {
    // Default Stat Badges
    renderStar: () => {
      return (
        <StatBadge
          customClassName={fontSizeMap[currentPresets.fontSetting]}
          customClassContent={iconBadgeSizeMap[currentPresets.fontSetting]}
          isMigrating={isMigrating}
          icon="star"
          value={stars || 0}
          label="Star"
          tooltipLabel="Dev Tokens Migrated"
          valueColor={
            currentPresets.colorSetting === "cupsey"
              ? "text-[#b5b7da]"
              : "text-fontColorPrimary"
          }
          cardType={cardType}
        />
      );
    },
    renderSnipers: () => {
      return (
        <StatBadge
          customClassName={fontSizeMap[currentPresets.fontSetting]}
          customClassContent={iconBadgeSizeMap[currentPresets.fontSetting]}
          isMigrating={isMigrating}
          icon={
            currentPresets.colorSetting === "cupsey"
              ? "snipe-cupsey"
              : "snipe-gray"
          }
          value={snipers > 100 ? 100 : snipers?.toFixed(0) || 0}
          label="Snipe"
          tooltipLabel="Sniper Percentage"
          valueColor={
            currentPresets.colorSetting === "cupsey"
              ? snipers < 75
                ? "text-[#3ed6cc]"
                : "text-[#FF4B92]"
              : snipers < 75
                ? "text-success"
                : "text-destructive"
          }
          suffix="%"
          cardType={cardType}
        />
      );
    },
    renderInsiders: () => {
      return (
        <StatBadge
          customClassName={fontSizeMap[currentPresets.fontSetting]}
          customClassContent={iconBadgeSizeMap[currentPresets.fontSetting]}
          isMigrating={isMigrating}
          icon="insiders"
          value={
            insiderPercentage > 100 ? 100 : insiderPercentage.toFixed(0) || 0
          }
          label="Insiders"
          tooltipLabel="Insiders"
          valueColor={
            currentPresets.colorSetting === "cupsey"
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
      );
    },
    renderTop10Holders: () => {
      return (
        <StatBadge
          customClassName={fontSizeMap[currentPresets.fontSetting]}
          customClassContent={iconBadgeSizeMap[currentPresets.fontSetting]}
          isMigrating={isMigrating}
          value={top10Percentage > 100 ? 100 : top10Percentage.toFixed(0) || 0}
          customIcon={
            currentPresets.colorSetting === "cupsey" ? (
              <div className="mr-0.5 flex size-[12px] flex-shrink-0 items-center justify-center rounded-sm bg-[#727694] font-geistSemiBold text-[7.5px] leading-[0px] text-black">
                10
              </div>
            ) : undefined
          }
          label="T10"
          tooltipLabel="Top 10 Holders"
          valueColor={
            currentPresets.colorSetting === "cupsey"
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
      );
    },
    renderDevSold: () => {
      // Helper function to format time using DevSoldTooltip's logic
      const formatTime = (timestamp: number) => {
        const date = new Date(timestamp * 1000);
        const now = new Date();
        const diffInHours = Math.floor(
          (now.getTime() - date.getTime()) / (1000 * 60 * 60),
        );
        if (diffInHours < 24) {
          return `${diffInHours}h`;
        }
        return `${Math.floor(diffInHours / 24)}d`;
      };

      const FUNDING_LOGOS = dev_wallet_details?.funder?.exchange;
      const FUNDING_LOGOS_PATH =
        !FUNDING_LOGOS || FUNDING_LOGOS === "Unknown" || FUNDING_LOGOS === ""
          ? "/icons/solana.svg"
          : FUNDING_LOGOS === "Binance 2"
            ? "/icons/funding-logos/binance.webp"
            : `/icons/funding-logos/${FUNDING_LOGOS.toLowerCase()}.webp`;
      const FUNDING_LOGOS_ALT =
        !FUNDING_LOGOS || FUNDING_LOGOS === "Unknown" || FUNDING_LOGOS === ""
          ? "Unknown Logo"
          : FUNDING_LOGOS;

      return (
        <StatBadge
          customClassName={fontSizeMap[currentPresets.fontSetting]}
          customClassContent={iconBadgeSizeMap[currentPresets.fontSetting]}
          isMigrating={isMigrating}
          value={
            <div className="ml-1 flex items-center gap-1">
              <Image
                src={FUNDING_LOGOS_PATH}
                alt={FUNDING_LOGOS_ALT}
                height={14}
                width={14}
                quality={100}
                className="aspect-square rounded-full object-cover"
              />
              <span className="text-xs">
                {formatTime(dev_wallet_details?.funder?.time)}
              </span>
            </div>
          }
          customIcon={
            currentPresets.colorSetting === "cupsey" ? (
              <div className="mr-0.5 flex size-[12px] flex-shrink-0 items-center justify-center rounded-sm bg-[#4eede3] font-geistSemiBold text-[7.5px] leading-[0px] text-black">
                DS
              </div>
            ) : undefined
          }
          label="DS"
          tooltipLabel="Dev Sold"
          isDevSoldTooltip={true}
          customTooltipContent={
            dev_wallet_details ? (
              <DevSoldTooltip
                dev_wallet_details={dev_wallet_details}
                // colorSetting={currentPresets.colorSetting}
              />
            ) : (
              <div className="flex flex-col items-center justify-center px-3 py-1.5 text-xs text-fontColorPrimary">
                <span>No Dev Wallet Details</span>
                <span>available at this moment</span>
              </div>
            )
          }
          valueColor={
            currentPresets.colorSetting === "cupsey"
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
          suffix=""
          cardType={cardType}
        />
      );
    },
    renderDevHoldings: () => {
      return (
        <StatBadge
          customClassName={fontSizeMap[currentPresets.fontSetting]}
          customClassContent={iconBadgeSizeMap[currentPresets.fontSetting]}
          isMigrating={isMigrating}
          value={
            devHoldingPercentage > 100
              ? 100
              : devHoldingPercentage.toFixed(0) || 0
          }
          customIcon={
            currentPresets.colorSetting === "cupsey" ? (
              <div className="mr-0.5 flex size-[12px] flex-shrink-0 items-center justify-center rounded-sm bg-[#4eede3] font-geistSemiBold text-[7.5px] leading-[0px] text-black">
                DH
              </div>
            ) : undefined
          }
          label="DH"
          tooltipLabel="Dev Holdings"
          valueColor={
            currentPresets.colorSetting === "cupsey"
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
      );
    },
    renderBundled: () => {
      return (
        cardType !== "type1" && (
          <StatBadge
            customClassName={fontSizeMap[currentPresets.fontSetting]}
            customClassContent={iconBadgeSizeMap[currentPresets.fontSetting]}
            isMigrating={isMigrating}
            value={
              bundled_percentage > 100
                ? 100
                : bundled_percentage.toFixed(0) || 0
            }
            icon="bundled"
            label="Bundled"
            tooltipLabel="Bundled"
            valueColor={
              currentPresets.colorSetting === "cupsey"
                ? bundled_percentage <= 10
                  ? "text-[#3ed6cc]"
                  : "text-[#FF4B92]"
                : bundled_percentage <= 10
                  ? "text-success"
                  : "text-destructive"
            }
            cardType={cardType}
            suffix="%"
          />
        )
      );
    },
    renderRegularUsers: () => {
      return (
        <StatText
          key="regularUsers"
          icon={
            currentPresets.colorSetting === "cupsey" ? "happy-cupsey" : "like"
          }
          value={formattedStats.regularUsers || "0"}
          label="Regular Users"
          tooltipLabel="Regular Users"
          valueColor={valueColorMap[currentPresets.colorSetting]}
          customClassName={fontSizeMap[currentPresets.fontSetting]}
          customClassIcon={iconSizeMap[currentPresets.fontSetting]}
        />
      );
    },

    // Default Stat Texts
    renderDiscord: () => {
      if (
        discord?.is_discord_monitored &&
        discord?.discord_details?.group_counts &&
        discord?.discord_details?.group_counts?.length > 0 &&
        cardType !== "type1"
      ) {
        return (
          <div
            key="discordGroup"
            className={cn(
              "mb-[2px] mt-[2px] flex items-center gap-x-0.5 font-geistSemiBold text-fontColorSecondary",
              fontSizeMap[currentPresets.fontSetting],
            )}
          >
            {/* <Image
              src={`/icons/user-group.svg`}
              alt={`Discord group Icon`}
              height={16}
              width={16}
              quality={50}
              className={cn(
                "relative aspect-square size-4 flex-shrink-0",
                iconSizeMap[currentPresets.fontSetting],
              )}
            /> */}
            <DiscordGroupIconSVG
              className={cn(
                "relative aspect-square size-4 flex-shrink-0",
                iconSizeMap[currentPresets.fontSetting],
              )}
            />
            <TooltipProvider>
              <span className="ml-1 flex gap-x-0.5">
                {(discord?.discord_details?.group_counts || [])?.map(
                  (group) => (
                    <Tooltip key={group.name} delayDuration={0}>
                      <TooltipTrigger asChild>
                        <div className="relative h-4 w-4 overflow-hidden rounded-full">
                          <Image
                            src={group.image}
                            alt={group.name}
                            fill
                            sizes="16px"
                            style={{ objectFit: "contain" }}
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>{group.name}</TooltipContent>
                    </Tooltip>
                  ),
                )}
              </span>
            </TooltipProvider>
          </div>
        );
      }
    },
    renderMarketCap: () => {
      return (
        <StatText
          isCupsey={currentPresets.cosmoCardStyleSetting === "type4"}
          key="marketCap"
          value={formattedStats?.marketCap}
          label="MC"
          tooltipLabel="Market Cap"
          valueColor={marketCapValueColor}
          customClassName={fontSizeMap[currentPresets.fontSetting]}
          customClassIcon={iconSizeMap[currentPresets.fontSetting]}
        />
      );
    },
    renderVolume: () => {
      return (
        <StatText
          isCupsey={currentPresets.cosmoCardStyleSetting === "type4"}
          key="volume"
          value={formattedStats.volume}
          label="V"
          tooltipLabel="Volume"
          valueColor={valueColorMap[currentPresets.colorSetting]}
          customClassName={fontSizeMap[currentPresets.fontSetting]}
          customClassIcon={iconSizeMap[currentPresets.fontSetting]}
        />
      );
    },
    renderHolders: () => {
      return (
        <StatText
          isCupsey={currentPresets.cosmoCardStyleSetting === "type4"}
          key="holders"
          icon={
            currentPresets.cosmoCardStyleSetting === "type4"
              ? "holders-cupsey"
              : "holders"
          }
          value={String(holders) || "0"}
          label="Holders"
          tooltipLabel="Holders"
          valueColor={valueColorMap[currentPresets.colorSetting]}
          customClassName={fontSizeMap[currentPresets.fontSetting]}
          customClassIcon={iconSizeMap[currentPresets.fontSetting]}
        />
      );
    },
    renderBagsTokenRoyalties: () => {
      return (
        <StatText
          key="bags-token-royalties"
          value={`${bags_royalties?.length}` || "0"}
          icon="bags-token-royalties"
          label="BTR"
          tooltipLabel="Bags Token Royalties"
          isBagsTokenRoyaltiesTooltip={true}
          customTooltipContent={
            bags_royalties && bags_royalties.length > 0 ? (
              <BagsTokenRoyaltiesTooltip
                bags_royalties={bags_royalties}
                isCreator={isCreator}
                dev_wallet_details={dev_wallet_details}
              />
            ) : (
              <div className="flex flex-col items-center justify-center px-3 py-1.5 text-xs text-fontColorPrimary">
                <span>No Bags Token Royalties</span>
                <span>available at this moment</span>
              </div>
            )
          }
          valueColor={valueColorMap[currentPresets.colorSetting]}
          customClassName={fontSizeMap[currentPresets.fontSetting]}
          customClassIcon={iconSizeMap[currentPresets.fontSetting]}
          bags_royalties={bags_royalties}
          isCreator={isCreator}
        />
      );
    },
    renderTracker: () => {
      return (
        <TokenTrackers
          key="tracker"
          mint={mint}
          valueColor={valueColorMap[currentPresets.colorSetting]}
          customClassName={fontSizeMap[currentPresets.fontSetting]}
          customClassIcon={iconSizeMap[currentPresets.fontSetting]}
        />
      );
    },
    renderBotTotalFees: () => {
      return (
        <StatText
          key="botTotalFees"
          icon="total-fees"
          value={formattedStats.botTotalFees || "0"}
          label="Total Fees Paid"
          tooltipLabel="Total Fees Paid"
          valueColor={valueColorMap[currentPresets.colorSetting]}
          customClassName={fontSizeMap[currentPresets.fontSetting]}
          customClassIcon={iconSizeMap[currentPresets.fontSetting]}
        />
      );
    },
  };

  const isCreator = useMemo(() => {
    return bags_royalties?.some(royalty => royalty.is_creator) || false;
  }, [bags_royalties]);

  const renderMapping = {
    star: renderStats.renderStar,
    snipers: renderStats.renderSnipers,
    insiders: renderStats.renderInsiders,
    "regular-users": renderStats.renderRegularUsers,
    "top-10-holders": renderStats.renderTop10Holders,
    "dev-holdings": isDevSold
      ? renderStats.renderDevSold
      : renderStats.renderDevHoldings,
    "market-cap": renderStats.renderMarketCap,
    volume: renderStats.renderVolume,
    holders: renderStats.renderHolders,
    "bags-token-royalties": isCreator
      ? renderStats.renderBagsTokenRoyalties
      : undefined,
    bundled: renderStats.renderBundled,
    discord: renderStats.renderDiscord,
    tracker: renderStats.renderTracker,
    "bot-total-fee": renderStats.renderBotTotalFees,
  } as const;

  return (
    <div
      ref={isFirst ? customStatsRef : undefined}
      className={cn(
        "flex w-fit flex-wrap items-center gap-x-0.5",
        customStatGapMap[currentPresets.fontSetting],
        className,
      )}
      style={{
        marginLeft:
          className?.includes("justify-start") ||
          !className?.includes("justify-end")
            ? "-" + badgeMarginMap[currentPresets.fontSetting] + "px"
            : 0,
        marginRight: className?.includes("justify-end")
          ? "-" + badgeMarginMap[currentPresets.fontSetting] + "px"
          : 0,
      }}
    >
      {(activeItemsBy || [])?.map((item) => {
        const renderFunction = renderMapping[item.key as CustomCosmoStatKeys];
        if (renderFunction) {
          return (
            <React.Fragment key={item.key}>{renderFunction()}</React.Fragment>
          );
        }
        return null;
      })}
      {process.env.NODE_ENV === "development" && type === "stat-text" && (
        <span className="absolute bottom-0 left-0 z-10 flex items-center gap-x-1 font-geistSemiBold text-xs text-fontColorSecondary">
          {currentCustomStatsHeight["stat-badge"]} |{" "}
          {currentCustomStatsHeight["stat-text"]}
          {isFirst && " (isFirst)"}
        </span>
      )}
    </div>
  );
};

export default CustomCosmoStats;
