"use client";

// ######## Libraries 📦 & Hooks 🪝 ########
import React, { memo } from "react";
// ######## Components 🧩 ########
import Image from "next/image";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  SVGComponent,
  StarIconSVG,
  SnipeGrayIconSVG,
  SnipeCupseyIconSVG,
  InsidersIconSVG,
  BundledIconSVG,
  LikeIconSVG,
  HappyCupseyIconSVG,
  HoldersIconSVG,
  HoldersCupseyIconSVG,
  TotalFeesIconSVG,
  WalletIconSVG,
} from "@/components/customs/ScalableVectorGraphics";
// ######## Utils & Helpers 🤝 ########
import { cn } from "@/libraries/utils";
import { CosmoCardStyleSetting } from "@/apis/rest/settings/settings";

export type CosmoStatusIconType =
  | "star"
  | "snipe-gray"
  | "snipe-cupsey"
  | "insiders"
  | "bundled"
  | "like"
  | "happy-cupsey"
  | "holders"
  | "holders-cupsey"
  | "total-fees"
  | "wallet";

const ICON_SVG_MAP: Record<CosmoStatusIconType, SVGComponent | null> = {
  star: StarIconSVG,
  "snipe-gray": SnipeGrayIconSVG,
  "snipe-cupsey": SnipeCupseyIconSVG,
  insiders: InsidersIconSVG,
  bundled: BundledIconSVG,
  like: LikeIconSVG,
  "happy-cupsey": HappyCupseyIconSVG,
  holders: HoldersIconSVG,
  "holders-cupsey": HoldersCupseyIconSVG,
  "total-fees": TotalFeesIconSVG,
  wallet: WalletIconSVG,
};

const StatBadge = React.memo(
  ({
    icon,
    customIcon,
    value,
    label,
    tooltipLabel,
    customTooltipContent,
    isDevSoldTooltip,
    valueColor,
    suffix,
    isMigrating,
    isDevSold,
    dev_wallet_details,
    cardType = "type1",
    customClassContent,
    customClassName,
  }: {
    icon?: CosmoStatusIconType;
    customIcon?: React.ReactNode;
    value: number | string | React.ReactNode;
    label: string;
    tooltipLabel: string;
    customTooltipContent?: React.ReactNode;
    isDevSoldTooltip?: boolean;
    valueColor: string;
    suffix?: string;
    isMigrating?: boolean;
    isDevSold?: boolean;
    dev_wallet_details?: {
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
    cardType?: CosmoCardStyleSetting;
    customClassContent?: string;
    customClassName?: string;
  }) => {
    const IconComponent = icon ? ICON_SVG_MAP[icon] : null;

    return (
      <>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  "mr-1 flex h-[16px] items-center justify-center gap-x-0.5 rounded-[4px] border border-[rgba(255,255,255,0.03)] bg-[#21212C] pl-1 pr-1.5",
                  isMigrating && "bg-white/[8%]",
                  cardType !== "type1" &&
                    "border-transparent bg-transparent px-0",
                  customClassName,
                  customClassContent,
                )}
              >
                {customIcon ? (
                  <span className={"flex items-center justify-center"}>
                    {customIcon}
                  </span>
                ) : icon ? (
                  // <Image
                  //   src={`/icons/${icon}.svg`}
                  //   alt={`${label} Icon`}
                  //   height={12}
                  //   width={12}
                  //   quality={50}
                  //   loading="lazy"
                  //   className={cn(
                  //     "relative aspect-square size-[12px] flex-shrink-0 lg:size-3.5",
                  //   )}
                  // />
                  IconComponent ? (
                    <IconComponent
                      className={cn(
                        "relative aspect-square size-[12px] flex-shrink-0 lg:size-3.5",
                      )}
                    />
                  ) : null
                ) : (
                  <span
                    className={cn(
                      "text-xs leading-3 text-fontColorSecondary",
                      cardType !== "type1" && "text-[12px] leading-[18px]",
                    )}
                  >
                    {label}
                  </span>
                )}
                <span
                  className={cn(
                    "text-sm leading-[15px]",
                    valueColor,
                    cardType !== "type1" && "text-[12px] leading-[18px]",
                  )}
                >
                  {value}
                  {suffix || ""}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent isWithAnimation={false} isDevSoldTooltip={isDevSoldTooltip}>
              {customTooltipContent ? customTooltipContent : <p>{tooltipLabel}</p>}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </>
    );
  },
);
StatBadge.displayName = "StatBadge";
export default memo(StatBadge);
