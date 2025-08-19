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
  BagsTokenRoyaltiesIconSVG
} from "@/components/customs/ScalableVectorGraphics";
import { cn } from "@/libraries/utils";
import { BagsRoyalty } from "@/types/ws-general";

export type CosmoStatusIconType =
  | "star"
  | "snipe-gray"
  | "snipe-cupsey"
  | "insiders"
  | "bundled"
  | "like"
  | "happy-cupsey"
  | "holders"
  | "bags-token-royalties"
  | "holders-cupsey"
  | "total-fees"
  | "wallet";

export const ICON_STAT_SVG_MAP: Record<
  CosmoStatusIconType,
  SVGComponent | null
> = {
  star: StarIconSVG,
  "snipe-gray": SnipeGrayIconSVG,
  "snipe-cupsey": SnipeCupseyIconSVG,
  insiders: InsidersIconSVG,
  bundled: BundledIconSVG,
  like: LikeIconSVG,
  "happy-cupsey": HappyCupseyIconSVG,
  holders: HoldersIconSVG,
  "bags-token-royalties": BagsTokenRoyaltiesIconSVG,
  "holders-cupsey": HoldersCupseyIconSVG,
  "total-fees": TotalFeesIconSVG,
  wallet: WalletIconSVG,
};

export const ICON_STAT_SVG_MAP_COMP: Record<
  CosmoStatusIconType,
  React.ReactElement | null
> = {
  star: <StarIconSVG />,
  "snipe-gray": <SnipeGrayIconSVG />,
  "snipe-cupsey": <SnipeCupseyIconSVG />,
  insiders: <InsidersIconSVG />,
  bundled: <BundledIconSVG />,
  like: <LikeIconSVG />,
  "happy-cupsey": <HappyCupseyIconSVG />,
  holders: <HoldersIconSVG />,
  "bags-token-royalties": <BagsTokenRoyaltiesIconSVG />,
  "holders-cupsey": <HoldersCupseyIconSVG />,
  "total-fees": <TotalFeesIconSVG />,
  wallet: <WalletIconSVG />,
};

const StatText = ({
  icon,
  value,
  label,
  tooltipLabel,
  customTooltipContent,
  isBagsTokenRoyaltiesTooltip,
  valueColor,
  customClassName,
  customClassIcon,
  isCupsey: isCupsey,
  bags_royalties,
  isCreator,
}: {
  icon?: CosmoStatusIconType;
  value: string;
  label: string;
  tooltipLabel: string;
  customTooltipContent?: React.ReactNode;
  isBagsTokenRoyaltiesTooltip?: boolean;
  valueColor: string;
  customClassName?: string;
  customClassIcon?: string;
  isCupsey?: boolean;
  isCreator?: boolean;
  bags_royalties?: BagsRoyalty[];
}) => {
  const IconComponent = icon ? ICON_STAT_SVG_MAP[icon] : null;

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                "mx-[3px] flex items-center justify-center gap-x-[2px]",
                icon && "gap-x-0",
                isCupsey && "font-geistMonoSemiBold",
              )}
            >
              {icon ? (
                // <Image
                //   src={`/icons/${icon}.svg`}
                //   alt={`${label} Icon`}
                //   height={16}
                //   width={16}
                //   quality={50}
                //   className={cn(
                //     "relative aspect-square size-4 flex-shrink-0",
                //     customClassIcon,
                //   )}
                // />
                IconComponent ? (
                  <IconComponent
                    className={cn(
                      "relative aspect-square size-4 flex-shrink-0",
                      customClassIcon,
                    )}
                  />
                ) : null
              ) : (
                <span
                  className={cn(
                    "text-xs text-fontColorSecondary",
                    customClassName,
                    isCupsey && "text-[#8d93b7]",
                  )}
                >
                  {label}
                </span>
              )}
              <span
                className={cn(`text-xs ${valueColor}`, customClassName || "")}
              >
                {value}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent isWithAnimation={false} isCreator={isBagsTokenRoyaltiesTooltip}>
            {customTooltipContent ? customTooltipContent : <p>{tooltipLabel}</p>}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </>
  );
};
StatText.displayName = "StatText";
export default memo(StatText);
