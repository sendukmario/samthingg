import {
  badgeMarginMap,
  customStatGapMap,
  fontSizeMap,
  iconSizeMap,
} from "@/components/customs/cards/partials/StatTexts";
import { CosmoCardStyleSetting } from "@/apis/rest/settings/settings";
import StatText from "@/components/customs/cards/partials/StatText";
import { cn } from "@/libraries/utils";
import {
  IgniteCardViewConfigItem,
  useCustomIgniteCardView,
} from "@/stores/setting/use-custom-ignite-card-view.store";
import { useCustomizeSettingsStore } from "@/stores/setting/use-customize-settings.store";
import { useIgniteFilterPanelStore } from "@/stores/ignite/use-ignite-filter-panel.store";
import { FinalDiscordMessage } from "@/types/monitor";
import React, { useMemo, useRef, useState, useEffect } from "react";
import {
  formatAmount,
  formatAmountDollar,
  formatAmountWithoutLeadingZero,
} from "@/utils/formatAmount";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  LiquidityIconSVG,
} from "@/components/customs/ScalableVectorGraphics";

// Reusable tooltip component aligned with CosmoCard implementation (no icon rendered)
const SimpleTooltip: React.FC<{
  label: string;
  children: React.ReactElement;
  icon?: React.ReactElement; // kept for API compatibility, ignored in rendering
}> = ({ label, children }) => (
  <TooltipProvider>
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent
        side="bottom"
        align="center"
        showTriangle={false}
        sideOffset={10}
        className="!border-none !bg-transparent !p-0 !shadow-none"
      >
        <div className="gb__white__tooltip flex min-w-fit flex-col items-center justify-center gap-1 rounded-[8px] border border-[#242436] bg-[#272730] p-3 text-center shadow-[0_10px_20px_0_#000]">
          <span className="font-geist text-nowrap text-center text-[12px] font-semibold leading-4 text-fontColorPrimary">
            {label}
          </span>
        </div>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);
import {
  DataIconSVG,
  SecurityIconSVG,
  TotalFeesIconSVG,
  USDIconSVG,
  BarchartIconSVG,
} from "@/components/customs/ScalableVectorGraphics";
import { ICON_STAT_SVG_MAP_COMP } from "./StatText";
import { useCustomizeTheme } from "@/hooks/use-customize-theme";
import { Vault, VaultIcon } from "lucide-react";

export type CustomIgniteStatKeys =
  // #== Data Items ==#
  | "volume"
  | "liquidity"
  | "holders"
  | "real-users"

  // #== Security Items ==#
  | "snipe"
  | "insiders"
  | "dev-holdings"
  | "dev-token-migrated"
  | "total-fees";

// Dynamic gap hook for responsive spacing
const useDynamicGap = () => {
  const isFilterOpen = useIgniteFilterPanelStore((state) => state.isOpen);

  // Single source of truth for breakpoints
  const BREAKPOINTS = [
    { max: 1280, gapFilterOpen: "gap-[0px]", gapFilterClosed: "gap-[0px]" },
    { max: 1440, gapFilterOpen: "gap-[0px]", gapFilterClosed: "gap-[0px]" },
    { max: 1600, gapFilterOpen: "gap-[0px]", gapFilterClosed: "gap-[8px]" },
    { max: 1750, gapFilterOpen: "gap-[0px]", gapFilterClosed: "gap-[12px]" },
    { max: 1920, gapFilterOpen: "gap-[8px]", gapFilterClosed: "gap-[16px]" },
    { max: 2400, gapFilterOpen: "gap-[8px]", gapFilterClosed: "gap-[20px]" },
    { max: 2560, gapFilterOpen: "gap-[8px]", gapFilterClosed: "gap-[24px]" },
    { max: 2880, gapFilterOpen: "gap-[8px]", gapFilterClosed: "gap-[28px]" },
    { max: 3200, gapFilterOpen: "gap-[8px]", gapFilterClosed: "gap-[32px]" },
    { max: 3600, gapFilterOpen: "gap-[8px]", gapFilterClosed: "gap-[36px]" },
    { max: 3840, gapFilterOpen: "gap-[8px]", gapFilterClosed: "gap-[40px]" },
    {
      max: Infinity,
      gapFilterOpen: "gap-[0px]",
      gapFilterClosed: "gap-[0px]",
    },
  ];

  // Function to calculate gap based on current conditions
  const calculateGap = (width: number, isOpen: boolean) => {
    const breakpoint = BREAKPOINTS.find((bp) => width <= bp.max);
    return isOpen ? breakpoint?.gapFilterOpen : breakpoint?.gapFilterClosed;
  };

  const [gap, setGap] = useState(() =>
    calculateGap(window.innerWidth, isFilterOpen),
  );

  useEffect(() => {
    const updateGap = () => {
      const width = window.innerWidth;
      const newGap = calculateGap(width, isFilterOpen);
      if (newGap) setGap(newGap);
    };

    updateGap();
    window.addEventListener("resize", updateGap);
    return () => window.removeEventListener("resize", updateGap);
  }, [isFilterOpen]);

  return gap;
};

const CustomIgniteStats = ({
  regular_traders,
  volume_usd,
  market_cap_usd,
  dev_holding_percentage,
  holders,
  insider_percentage,
  liquidity_usd,
  sniper_percentage,
  dev_migrated,
  type,
  bot_total_fees,
  className,
  customCardViewConfig,
  isFirst = false,
}: {
  // #== Data Items ==#
  volume_usd?: number;
  market_cap_usd?: number;
  liquidity_usd?: number;
  holders?: number;
  regular_traders?: number;

  // #== Security Items ==#
  sniper_percentage?: number;
  insider_percentage?: number;
  dev_holding_percentage?: number;
  dev_migrated?: number;
  bot_total_fees?: number;

  // #== Others ==#
  type: "data" | "security";
  className?: string;
  customCardViewConfig?: IgniteCardViewConfigItem[];
  isFirst?: boolean;
}) => {
  const cardViewConfig = useCustomIgniteCardView(
    (state) => state.cardViewConfig,
  );

  const customizedSettingPresets = useCustomizeSettingsStore(
    (state) => state.presets,
  );
  const customizedSettingActivePreset = useCustomizeSettingsStore(
    (state) => state.activePreset,
  );
  const customStatsRef = useRef<HTMLDivElement>(null);
  const dynamicGap = useDynamicGap();

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
  const getActiveItemsByType = (type: "data" | "security") => {
    return (customCardViewConfig || cardViewConfig)
      ?.filter((item) => item.type === type && item.status === "active")
      ?.sort((a, b) => a.position - b.position);
  };

  const formattedStats = useMemo(
    () => ({
      volume: volume_usd ? formatAmountDollar(volume_usd) : "0",
      liquidity: liquidity_usd ? formatAmountDollar(liquidity_usd) : "0",
    }),
    [volume_usd, liquidity_usd],
  );

  const formatCompact = (num?: number): string => {
    if (num === undefined || num === null) return "-";
    if (Math.abs(num) < 1000) return num.toFixed(2).replace(/\.0+$/, "");
    const units = ["", "K", "M", "B", "T"];
    let unitIndex = 0;
    let value = num;
    while (Math.abs(value) >= 1000 && unitIndex < units.length - 1) {
      value /= 1000;
      unitIndex++;
    }
    return `${value.toFixed(1).replace(/\.0$/, "")}${units[unitIndex]}`;
  };

  const activeItems = getActiveItemsByType(type);

  const renderStats = {
    // #== Data Items ==#
    renderVolume: () => (
      <SimpleTooltip label="Volume" icon={<span className="text-xs text-fontColorSecondary">V</span>}>
        <div className="flex h-full items-center justify-center gap-0.5 rounded-[4px] px-2 py-1 font-geistSemiBold text-xs text-fontColorPrimary md:min-w-[80px]">
          <span className="text-xs text-fontColorSecondary">V</span>
          {formattedStats.volume}
        </div>
      </SimpleTooltip>
    ),
    renderLiquidity: () => (
      <SimpleTooltip label="Liquidity" icon={<LiquidityIconSVG />}>
        <div className="flex h-full items-center justify-center gap-0.5 rounded-[4px] px-2 py-1 font-geistSemiBold text-xs text-fontColorPrimary md:min-w-[80px]">
          <LiquidityIconSVG />
          {formattedStats.liquidity}
        </div>
      </SimpleTooltip>
    ),
    renderHolders: () => (
      <SimpleTooltip
        label="Holders"
        icon={
          <>
            {
              ICON_STAT_SVG_MAP_COMP[
                currentPresets.colorSetting === "cupsey"
                  ? "holders-cupsey"
                  : "holders"
              ]
            }
          </>
        }
      >
        <div className="flex h-full items-center justify-center gap-0.5 rounded-[4px] px-2 py-1 font-geistSemiBold text-xs text-fontColorPrimary md:min-w-[55px]">
          {
            ICON_STAT_SVG_MAP_COMP[
              currentPresets.colorSetting === "cupsey"
                ? "holders-cupsey"
                : "holders"
            ]
          }
          {formatCompact(holders)}
        </div>
      </SimpleTooltip>
    ),
    renderRealUsers: () => (
      <SimpleTooltip
        label="Real Users"
        icon={
          <>
            {
              ICON_STAT_SVG_MAP_COMP[
                currentPresets.colorSetting === "cupsey"
                  ? "happy-cupsey"
                  : "like"
              ]
            }
          </>
        }
      >
        <div className="flex h-full items-center justify-center gap-0.5 rounded-[4px] px-2 py-1 font-geistSemiBold text-xs text-fontColorPrimary md:min-w-[55px]">
          {
            ICON_STAT_SVG_MAP_COMP[
              currentPresets.colorSetting === "cupsey" ? "happy-cupsey" : "like"
            ]
          }
          {formatCompact(regular_traders)}
        </div>
      </SimpleTooltip>
    ),

    // #== Security Items ==#
    renderSnipe: () => (
      <SimpleTooltip
        label="Sniper %"
        icon={
          <>
            {
              ICON_STAT_SVG_MAP_COMP[
                currentPresets.colorSetting === "cupsey"
                  ? "snipe-cupsey"
                  : "snipe-gray"
              ]
            }
          </>
        }
      >
        <div className="flex h-full items-center justify-center gap-0.5 rounded-[4px] px-2 py-1 font-geistSemiBold text-xs text-fontColorPrimary md:min-w-[55px]">
          {
            ICON_STAT_SVG_MAP_COMP[
              currentPresets.colorSetting === "cupsey"
                ? "snipe-cupsey"
                : "snipe-gray"
            ]
          }
          {sniper_percentage !== undefined
            ? `${(sniper_percentage * 100).toFixed(0)}%`
            : "-"}
        </div>
      </SimpleTooltip>
    ),
    renderInsiders: () => (
      <SimpleTooltip
        label="Insiders %"
        icon={<>{ICON_STAT_SVG_MAP_COMP["insiders"]}</>}
      >
        <div className="flex h-full items-center justify-center gap-0.5 rounded-[4px] px-2 py-1 font-geistSemiBold text-xs text-fontColorPrimary md:min-w-[75px]">
          <>{ICON_STAT_SVG_MAP_COMP["insiders"]}</>
          {insider_percentage !== undefined
            ? `${(insider_percentage * 100).toFixed(0)}%`
            : "-"}
        </div>
      </SimpleTooltip>
    ),
    renderDevHoldings: () => (
      <SimpleTooltip
        label="Dev Holding %"
        icon={
          <>
            {currentPresets.colorSetting === "cupsey" ? (
              <div className="mr-0.5 flex size-[12px] flex-shrink-0 items-center justify-center rounded-sm bg-[#4eede3] font-geistSemiBold text-[7.5px] leading-[0px] text-black">
                DH
              </div>
            ) : (
              <span className="text-xs text-fontColorSecondary">DH</span>
            )}
          </>
        }
      >
        <div className="flex h-full items-center justify-center gap-0.5 rounded-[4px] px-2 py-1 font-geistSemiBold text-xs text-fontColorPrimary md:min-w-[75px]">
          <>
            {currentPresets.colorSetting === "cupsey" ? (
              <div className="mr-0.5 flex size-[12px] flex-shrink-0 items-center justify-center rounded-sm bg-[#4eede3] font-geistSemiBold text-[7.5px] leading-[0px] text-black">
                DH
              </div>
            ) : (
              <span className="text-xs text-fontColorSecondary">DH</span>
            )}
          </>
          {dev_holding_percentage !== undefined
            ? `${(dev_holding_percentage * 100).toFixed(0)}%`
            : "-"}
        </div>
      </SimpleTooltip>
    ),
    renderDevTokenMigrated: () => (
      <SimpleTooltip
        label="Dev Tokens Migrated"
        icon={<>{ICON_STAT_SVG_MAP_COMP["star"]}</>}
      >
        <div className="flex h-full items-center justify-center gap-0.5 rounded-[4px] px-2 py-1 font-geistSemiBold text-xs text-fontColorPrimary md:min-w-[55px]">
          <>{ICON_STAT_SVG_MAP_COMP["star"]}</>
          {formatCompact(dev_migrated)}
        </div>
      </SimpleTooltip>
    ),
    renderTotalFees: () => (
      <SimpleTooltip
        label="Total Fees Paid"
        icon={<>{ICON_STAT_SVG_MAP_COMP["total-fees"]}</>}
      >
        <div className="flex h-full items-center justify-center gap-0.5 rounded-[4px] px-2 py-1 font-geistSemiBold text-xs text-fontColorPrimary md:min-w-[75px]">
          <>{ICON_STAT_SVG_MAP_COMP["total-fees"]}</>
          {bot_total_fees !== undefined
            ? formatAmountWithoutLeadingZero(
                bot_total_fees / LAMPORTS_PER_SOL,
                1,
              )
            : 0}
        </div>
      </SimpleTooltip>
    ),
  };

  const renderMapping = {
    volume: renderStats.renderVolume,
    liquidity: renderStats.renderLiquidity,
    holders: renderStats.renderHolders,
    "real-users": renderStats.renderRealUsers,

    snipe: renderStats.renderSnipe,
    insiders: renderStats.renderInsiders,
    "dev-holdings": renderStats.renderDevHoldings,
    "dev-token-migrated": renderStats.renderDevTokenMigrated,
    "total-fees": renderStats.renderTotalFees,
  } as const;

  const theme = useCustomizeTheme();

  return (
    <div
      ref={isFirst ? customStatsRef : undefined}
      className={"flex h-full w-fit items-center gap-[14px] rounded-[4px]"}
      style={{
        background: `linear-gradient(to bottom, #1A1A23, ${theme.background.backgroundColor})`,
      }}
    >
      <div className="h-auto rounded-[4px] py-[1px] pl-0 pr-[1px]">
        <div
          className={cn(
            "flex h-full w-full items-center rounded-[4px] pr-2",
            dynamicGap,
            "flex-wrap",
          )}
          style={{
            background: `linear-gradient(to bottom, #1A1A23, ${theme.background.backgroundColor})`,
          }}
        >
          {type === "data" ? (
            <span
              className="-ml-[1px] -mt-[1px] flex min-w-[67px] items-center gap-1 rounded-[4px] bg-gradient-to-b from-[#272734] to-[#13131C] px-2 py-1 font-geistSemiBold text-xs text-fontColorPrimary"
              style={{
                background: `linear-gradient(to bottom, #272734, ${theme.background.backgroundColor})`,
              }}
            >
              <DataIconSVG />
              Data
            </span>
          ) : (
            <span
              className="-ml-[1px] flex min-w-[91px] items-center gap-1 rounded-[4px] bg-gradient-to-b from-[#272734] to-[#13131C] px-2 py-1 font-geistSemiBold text-xs text-fontColorPrimary"
              style={{
                background: `linear-gradient(to bottom, #272734, ${theme.background.backgroundColor})`,
              }}
            >
              <SecurityIconSVG />
              Security
            </span>
          )}
          {(activeItems || [])?.map((item) => {
            const renderFunction =
              renderMapping[item.key as CustomIgniteStatKeys];
            if (renderFunction) {
              return (
                <React.Fragment key={item.key}>
                  {renderFunction()}
                </React.Fragment>
              );
            }
            return null;
          })}
        </div>
      </div>
      {process.env.NODE_ENV === "development" && type === "security" && (
        <span className="absolute bottom-0 left-0 z-10 flex items-center gap-x-1 font-geistSemiBold text-xs text-fontColorSecondary">
          {isFirst && " (isFirst)"}
        </span>
      )}
    </div>
  );
};

export default CustomIgniteStats;
