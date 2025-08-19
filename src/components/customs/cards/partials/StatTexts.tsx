"use client";

// ######## Libraries 📦 & Hooks 🪝 ########
import React, { useMemo } from "react";
import { useCustomizeSettingsStore } from "@/stores/setting/use-customize-settings.store";
import { useCustomCosmoCardView } from "@/stores/setting/use-custom-cosmo-card-view.store";

// ######## Components 🧩 ########
import StatText from "@/components/customs/cards/partials/StatText";
import TokenTrackers from "@/components/customs/cards/partials/TokenTrackers";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Image from "next/image";
// ######## Utils & Helpers 🤝 ########
import { cn } from "@/libraries/utils";
import {
  formatAmount,
  formatAmountDollar,
  formatAmountWithoutLeadingZero,
} from "@/utils/formatAmount";
import { usePopupStore } from "@/stores/use-popup-state.store";
import { useWalletTrackerMessageStore } from "@/stores/footer/use-wallet-tracker-message.store";
import { FinalDiscordMessage } from "@/types/monitor";
import { CosmoCardStyleSetting } from "@/apis/rest/settings/settings";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

// ######## Types ########
type CosmoCardStyleType = "type1" | "type2" | "type3" | "type4";
type StatKey =
  | "bundled"
  | "marketCap"
  | "volume"
  | "holders"
  | "tracker"
  | "botTotalFees"
  | "regularUsers"
  | "discordGroup";

interface StatConfig {
  order: number;
  visible: boolean;
}

interface StatItem {
  key: StatKey;
  component: React.ReactNode;
}

// ######## Configuration ########
interface StatConfigWithLayout extends StatConfig {
  row: number; // Which row this stat should appear in
  position: number; // Position within the row
}

interface LayoutConfig {
  stats: Record<StatKey, StatConfigWithLayout>;
  containerClass?: string; // Custom container classes for this layout
}

const COSMO_CARD_CONFIGS: Record<CosmoCardStyleType, LayoutConfig> = {
  type1: {
    stats: {
      bundled: { order: 1, visible: true, row: 1, position: 1 },
      discordGroup: { order: 2, visible: true, row: 1, position: 2 },
      marketCap: { order: 3, visible: true, row: 1, position: 3 },
      volume: { order: 4, visible: true, row: 1, position: 4 },
      holders: { order: 5, visible: true, row: 1, position: 5 },
      botTotalFees: { order: 6, visible: true, row: 1, position: 6 },
      regularUsers: { order: 7, visible: true, row: 1, position: 7 },
      tracker: { order: 8, visible: true, row: 1, position: 8 },
    },
  },
  type2: {
    stats: {
      discordGroup: { order: 1, visible: true, row: 1, position: 1 },
      marketCap: { order: 2, visible: true, row: 1, position: 6 },
      volume: { order: 3, visible: true, row: 1, position: 5 },
      holders: { order: 4, visible: true, row: 1, position: 4 },
      botTotalFees: { order: 7, visible: true, row: 1, position: 7 },
      regularUsers: { order: 8, visible: true, row: 1, position: 8 },
      tracker: { order: 5, visible: true, row: 1, position: 3 },
      bundled: { order: 6, visible: false, row: 1, position: 2 },
    },
  },
  type3: {
    stats: {
      volume: { order: 1, visible: true, row: 1, position: 1 }, // Top row
      marketCap: { order: 2, visible: true, row: 1, position: 2 }, // Top row
      botTotalFees: { order: 7, visible: true, row: 2, position: 4 },
      regularUsers: { order: 8, visible: true, row: 2, position: 5 },
      discordGroup: { order: 3, visible: true, row: 2, position: 2 }, // Bottom row
      holders: { order: 4, visible: true, row: 2, position: 4 }, // Bottom row
      tracker: { order: 5, visible: true, row: 2, position: 1 }, // Bottom row
      bundled: { order: 6, visible: false, row: 2, position: 3 },
    },
    containerClass: "flex-col", // Stack rows vertically
  },
  type4: {
    stats: {
      discordGroup: { order: 1, visible: true, row: 1, position: 1 }, // Bottom row
      tracker: { order: 2, visible: true, row: 1, position: 2 }, // Bottom row
      holders: { order: 3, visible: true, row: 2, position: 1 }, // Bottom row
      volume: { order: 4, visible: true, row: 2, position: 2 }, // Bottom row
      marketCap: { order: 5, visible: true, row: 2, position: 3 }, // Bottom row
      bundled: { order: 6, visible: false, row: 2, position: 4 }, // Top row - single item
      botTotalFees: { order: 7, visible: true, row: 1, position: 7 },
      regularUsers: { order: 8, visible: true, row: 1, position: 1 },
    },
    containerClass: "flex-col", // Stack rows vertically
  },
};

// mapping text size class
export const fontSizeMap = {
  normal: "text-xs",
  large: "text-sm",
  extralarge: "text-base",
  doubleextralarge: "text-lg",
};
export const customStatGapMap = {
  normal: "gap-x-0.5",
  large: "gap-x-1",
  extralarge: "gap-x-1.5",
  doubleextralarge: "gap-x-2",
};

export const iconSizeMap = {
  normal: "size-4",
  large: "size-[18px]",
  extralarge: "size-5",
  doubleextralarge: "size-[22px]",
};

export const iconBadgeSizeMap = {
  normal: "scale-1 mx-0.5 my-[2px]",
  large: "scale-[1.3] mx-[8px] my-[2px]",
  extralarge: "scale-[1.4] mx-[8px] my-[2px]",
  doubleextralarge: "scale-[1.6] mx-[14px] my-[5px]",
};

export const badgeMarginMap = {
  normal: 3,
  large: 4,
  extralarge: 4,
  doubleextralarge: 4,
};

// mapping value color class
export const valueColorMap = {
  normal: "text-white",
  blue: "text-[#4A89FF]",
  purple: "text-[#DF74FF]",
  fluorescentblue: "text-[#1BF6FD]",
  neutral: "text-warning",
  lemon: "text-[#C0FD30]",
  cupsey: "text-[#B5B7DA]",
};

const StatTexts = ({
  isSnapOpen,
  mint,
  bundled,
  bundled_percentage,
  marketCapUSD,
  volumeUSD,
  holders,
  regular_users,
  bot_total_fees,
  type = "default",
  data,
  justify = "start", // Optional prop for starter card
  className = "",
  col, // Optional prop for custom layout
  colShowed, // Optional prop for custom layout
  cardType,
}: {
  isSnapOpen: boolean;
  mint: string;
  bundled?: boolean;
  bundled_percentage?: number;
  marketCapUSD: number;
  volumeUSD?: number;
  holders?: number;
  regular_users?: number;
  bot_total_fees?: number;
  type?: "default" | "monitor" | "monitor-small";
  data?: {
    is_discord_monitored?: boolean;
    discord_details?: FinalDiscordMessage;
  };
  justify?: "center" | "start" | "end" | "between"; // Optional prop for starter card
  className?: string;
  col?: number; // Optional prop for custom layout
  colShowed?: number; // Optional prop for custom layout
  cardType?: CosmoCardStyleSetting;
}) => {
  const cardViewConfig = useCustomCosmoCardView((state) => state.cardViewConfig);

  const customizedSettingPresets = useCustomizeSettingsStore(
    (state) => state.presets,
  );
  const customizedSettingActivePreset = useCustomizeSettingsStore(
    (state) => state.activePreset,
  );

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

  // Function to check if a specific card view is active
  const isCardViewActive = (key: string): boolean => {
    const configItem = cardViewConfig.find((item) => item.key === key);
    return configItem?.status === "active";
  };

  const formattedStats = useMemo(
    () => ({
      marketCap: marketCapUSD ? formatAmountDollar(marketCapUSD) : "0",
      volume: volumeUSD ? formatAmountDollar(volumeUSD) : "0",
      regularUsers: regular_users ? formatAmount(regular_users) : "0",
      botTotalFees: bot_total_fees
        ? formatAmountWithoutLeadingZero(bot_total_fees / LAMPORTS_PER_SOL, 1)
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

  const remainingScreenWidth = usePopupStore(
    (state) => state.remainingScreenWidth,
  );
  const isExistTracker = useWalletTrackerMessageStore((state) =>
    state.isExistingTx(mint),
  );

  // Get current configuration based on cosmoCardStyleSetting
  const currentLayoutConfig =
    COSMO_CARD_CONFIGS[
      currentPresets.cosmoCardStyleSetting as CosmoCardStyleType
    ] || COSMO_CARD_CONFIGS.type1;
  const currentConfig = currentLayoutConfig.stats;

  // Generate stat items
  const statItems = useMemo((): StatItem[] => {
    const items: StatItem[] = [];
    const baseItems: StatItem[] = [];

    // Bundled stat
    // if (isSnapOpen && isCardViewActive("bundled") && bundled !== undefined) {
    //   items.push({
    //     key: "bundled",
    //     component: (
    //       <StatText
    //         key="bundled"
    //         value={bundled ? "Yes" : "No"}
    //         label="BD"
    //         tooltipLabel="Bundled"
    //         valueColor={bundled ? "text-destructive" : "text-success"}
    //         customClassName={
    //           type !== "default"
    //             ? fontSizeMap["normal"]
    //             : fontSizeMap[currentPresets.fontSetting]
    //         }
    //         customClassIcon={
    //           type !== "default"
    //             ? iconSizeMap["normal"]
    //             : iconSizeMap[currentPresets.fontSetting]
    //         }
    //       />
    //     ),
    //   });
    // }

    // Discord Groups stat
    if (
      data?.is_discord_monitored &&
      data?.discord_details?.group_counts &&
      data?.discord_details?.group_counts?.length > 0
    ) {
      items.push({
        key: "discordGroup",
        component: (
          <div
            key="discordGroup"
            className={cn(
              "mb-[2px] mt-[2px] flex items-center gap-x-0.5 font-geistSemiBold text-fontColorSecondary",
              fontSizeMap[currentPresets.fontSetting],
            )}
          >
            <Image
              src={`/icons/user-group.svg`}
              alt={`Discord group Icon`}
              height={16}
              width={16}
              quality={50}
              className={cn(
                "relative aspect-square size-4 flex-shrink-0",
                iconSizeMap[currentPresets.fontSetting],
              )}
            />
            <TooltipProvider>
              <span className="ml-1 flex gap-x-0.5">
                {(data?.discord_details?.group_counts || [])?.map((group) => (
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
                ))}
              </span>
            </TooltipProvider>
          </div>
        ),
      });
    }

    // Market Cap stat
    if (isCardViewActive("market-cap") && formattedStats?.marketCap) {
      baseItems.push({
        key: "marketCap",
        component: (
          <StatText
            isCupsey={currentPresets.cosmoCardStyleSetting === "type4"}
            key="marketCap"
            value={formattedStats?.marketCap}
            label="MC"
            tooltipLabel="Market Cap"
            valueColor={marketCapValueColor}
            customClassName={
              type !== "default"
                ? fontSizeMap["normal"]
                : fontSizeMap[currentPresets.fontSetting]
            }
            customClassIcon={
              type !== "default"
                ? iconSizeMap["normal"]
                : iconSizeMap[currentPresets.fontSetting]
            }
          />
        ),
      });
    }

    // Volume stat
    if (isCardViewActive("volume") && volumeUSD !== undefined) {
      baseItems.push({
        key: "volume",
        component: (
          <StatText
            isCupsey={currentPresets.cosmoCardStyleSetting === "type4"}
            key="volume"
            value={formattedStats.volume}
            label="V"
            tooltipLabel="Volume"
            valueColor={
              type !== "default"
                ? valueColorMap["normal"]
                : valueColorMap[currentPresets.colorSetting]
            }
            customClassName={
              type !== "default"
                ? fontSizeMap["normal"]
                : fontSizeMap[currentPresets.fontSetting]
            }
            customClassIcon={
              type !== "default"
                ? iconSizeMap["normal"]
                : iconSizeMap[currentPresets.fontSetting]
            }
          />
        ),
      });
    }

    // Holders stat
    if (isCardViewActive("holders") && holders !== undefined) {
      baseItems.push({
        key: "holders",
        component: (
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
            valueColor={
              type !== "default"
                ? valueColorMap["normal"]
                : valueColorMap[currentPresets.colorSetting]
            }
            customClassName={
              type !== "default"
                ? fontSizeMap["normal"]
                : fontSizeMap[currentPresets.fontSetting]
            }
            customClassIcon={
              type !== "default"
                ? iconSizeMap["normal"]
                : iconSizeMap[currentPresets.fontSetting]
            }
          />
        ),
      });
    }

    if (type === "default") {
      items.push(...(cardType === "type1" ? baseItems : baseItems.reverse()));
    }

    // Tracker stat
    if (isExistTracker) {
      items.push({
        key: "tracker",
        component: (
          <TokenTrackers
            key="tracker"
            mint={mint}
            valueColor={
              type !== "default"
                ? valueColorMap["normal"]
                : valueColorMap[currentPresets.colorSetting]
            }
            customClassName={
              type !== "default"
                ? fontSizeMap["normal"]
                : fontSizeMap[currentPresets.fontSetting]
            }
            customClassIcon={
              type !== "default"
                ? iconSizeMap["normal"]
                : iconSizeMap[currentPresets.fontSetting]
            }
          />
        ),
      });
    }

    // regular users/traders
    if (isCardViewActive("regular-users") && regular_users !== undefined) {
      items.push({
        key: "regularUsers",
        component: (
          <StatText
            key="regularUsers"
            icon="like"
            value={formattedStats.regularUsers || "0"}
            label="Regular Users"
            tooltipLabel="Regular Users"
            valueColor={
              type !== "default"
                ? valueColorMap["normal"]
                : valueColorMap[currentPresets.colorSetting]
            }
            customClassName={
              type !== "default"
                ? fontSizeMap["normal"]
                : fontSizeMap[currentPresets.fontSetting]
            }
            customClassIcon={
              type !== "default"
                ? iconSizeMap["normal"]
                : iconSizeMap[currentPresets.fontSetting]
            }
          />
        ),
      });
    }

    // bot total fees
    if (isCardViewActive("bot-total-fee") && bot_total_fees) {
      items.push({
        key: "botTotalFees",
        component: (
          <StatText
            key="botTotalFees"
            icon="total-fees"
            value={formattedStats.botTotalFees || "0"}
            label="Total Fees Paid"
            tooltipLabel="Total Fees Paid"
            valueColor={
              type !== "default"
                ? valueColorMap["normal"]
                : valueColorMap[currentPresets.colorSetting]
            }
            customClassName={
              type !== "default"
                ? fontSizeMap["normal"]
                : fontSizeMap[currentPresets.fontSetting]
            }
            customClassIcon={
              type !== "default"
                ? iconSizeMap["normal"]
                : iconSizeMap[currentPresets.fontSetting]
            }
          />
        ),
      });
    }

    items.push(...(cardType === "type1" ? baseItems : baseItems.reverse()));

    // Tracker stat
    // if (isExistTracker) {
    //   items.push({
    //     key: "tracker",
    //     component: (
    //       <TokenTrackers
    //         key="tracker"
    //         mint={mint}
    //         valueColor={
    //           type !== "default"
    //             ? valueColorMap["normal"]
    //             : valueColorMap[currentPresets.colorSetting]
    //         }
    //         customClassName={
    //           type !== "default"
    //             ? fontSizeMap["normal"]
    //             : fontSizeMap[currentPresets.fontSetting]
    //         }
    //         customClassIcon={
    //           type !== "default"
    //             ? iconSizeMap["normal"]
    //             : iconSizeMap[currentPresets.fontSetting]
    //         }
    //       />
    //     ),
    //   });
    // }

    return items;
  }, [
    isSnapOpen,
    bundled,
    data,
    formattedStats,
    volumeUSD,
    holders,
    isExistTracker,
    mint,
    currentPresets,
    marketCapValueColor,
    isCardViewActive,
  ]);

  // Filter, sort and render stats based on configuration with row grouping
  const renderedStats = useMemo(() => {
    // Filter visible stats and group by row
    const visibleStats = (statItems || [])
      ?.filter((item) => {
        const config = currentConfig[item.key];
        return config && config.visible;
      })
      ?.map((item) => ({
        ...item,
        config: currentConfig[item.key],
      }));

    // Group stats by row
    const rowGroups = visibleStats.reduce(
      (groups, stat) => {
        const rowNumber = stat.config.row;
        if (colShowed && colShowed !== stat.config.row) return groups;
        if (!groups[rowNumber]) {
          groups[rowNumber] = [];
        }
        groups[rowNumber].push(stat);
        return groups;
      },
      {} as Record<number, typeof visibleStats>,
    );

    // Sort stats within each row by position
    Object.keys(rowGroups).forEach((rowKey) => {
      rowGroups[parseInt(rowKey)].sort(
        (a, b) => a.config.position - b.config.position,
      );
    });

    // Convert to JSX - each row is a flex container
    const rows = Object.keys(rowGroups)
      ?.sort((a, b) => parseInt(a) - parseInt(b))
      ?.map((rowKey) => {
        const rowStats = rowGroups[parseInt(rowKey)];
        const padding = (() => {
          if (currentPresets.cosmoCardStyleSetting === "type3") {
            if (
              ["extralarge", "doubleextralarge"].includes(
                currentPresets.fontSetting,
              )
            ) {
              return "pb-0";
            }

            if (
              ["extralarge", "doubleextralarge"].includes(
                currentPresets.buttonSetting,
              )
            ) {
              return "pb-1";
            }

            if (
              ["tripleextralarge", "quadripleextralarge"].includes(
                currentPresets.buttonSetting,
              )
            ) {
              return "pb-0";
            }
          }

          return "pb-2";
        })();

        return (
          <div
            key={`row-${rowKey}`}
            className={cn(
              "flex w-fit flex-wrap items-center justify-end gap-x-1.5",
              isSnapOpen && remainingScreenWidth < 1400 && "justify-start",
              currentPresets.cosmoCardStyleSetting === "type2" &&
                remainingScreenWidth < 1400 &&
                "justify-end",
              currentPresets.cosmoCardStyleSetting === "type2" &&
                remainingScreenWidth < 1300 &&
                "justify-end",
              currentPresets.cosmoCardStyleSetting === "type3" &&
                remainingScreenWidth < 1000
                ? remainingScreenWidth < 430
                  ? "w-[100px]"
                  : "w-[200px]"
                : "w-full",
              padding,
              justify === "start" && "!justify-start",
              justify === "center" && "!justify-center",
              justify === "end" && "!justify-end",
              className,
            )}
          >
            {rowStats?.map((stat) => stat.component)}
          </div>
        );
      });

    return rows;
  }, [statItems, currentConfig]);

  return (
    <div
      className={cn(
        "flex items-end",
        currentPresets.cosmoCardStyleSetting === "type3" &&
          remainingScreenWidth < 1400 &&
          "items-end",
        // Apply layout-specific container classes - this takes precedence
        currentLayoutConfig.containerClass
          ? currentLayoutConfig.containerClass
          : "flex-row gap-x-2",

        // Only apply these responsive classes when NOT using custom layout
        !currentLayoutConfig.containerClass && [
          ["extralarge", "doubleextralarge"].includes(
            currentPresets.fontSetting,
          ) ||
          ["extralarge", "doubleextralarge"].includes(
            currentPresets.avatarSetting,
          )
            ? "max-w-min flex-col items-start justify-end xl:max-w-full xl:flex-row"
            : "",
          isSnapOpen && "flex-wrap",
          remainingScreenWidth < 1440 &&
            ["large", "extralarge", "doubleextralarge"].includes(
              currentPresets.fontSetting,
            ) &&
            "w-[240px] flex-row items-start",
          remainingScreenWidth < 1300 &&
            ["large", "extralarge", "doubleextralarge"].includes(
              currentPresets.fontSetting,
            ) &&
            "w-full flex-row items-start",
          isSnapOpen && "items-start justify-start",
        ],
        type === "monitor" && "!max-w-[150px] !flex-wrap",
        currentPresets.cosmoCardStyleSetting === "type1" && "justify-start",
        currentPresets.cosmoCardStyleSetting === "type2" && "justify-end",
        currentPresets.cosmoCardStyleSetting === "type2" &&
          remainingScreenWidth < 1300 &&
          "justify-end",
        type === "monitor-small" &&
          remainingScreenWidth < 350 &&
          "!max-w-[100px] !flex-wrap",
        type === "monitor-small" &&
          remainingScreenWidth > 350 &&
          "!max-w-[140px] !flex-wrap",
        type === "monitor-small" &&
          remainingScreenWidth > 450 &&
          !isSnapOpen &&
          "!max-w-[145px] !flex-wrap",
        type === "monitor-small" && isSnapOpen && "!max-w-[150px]",
      )}
    >
      {renderedStats}
    </div>
  );
};

StatTexts.displayName = "StatTexts";
export default StatTexts;
