"use client";

import { cn } from "@/libraries/utils";
import { usePopupStore } from "@/stores/use-popup-state.store";
import { formatAmount, formatAmountDollar } from "@/utils/formatAmount";
import { NewDeveloperToken } from "@/types/ws-general";
import { truncateAddress } from "@/utils/truncateAddress";
import { truncateString } from "@/utils/truncateString";
import AvatarWithBadges, { getRightBadgeType } from "../../AvatarWithBadges";
import Link from "next/link";
import Copy from "../../Copy";
import { memo, useMemo } from "react";
import { useCustomizeSettingsStore } from "@/stores/setting/use-customize-settings.store";

interface DeployedTokensCardProps {
  isModalContent?: boolean;
  data: NewDeveloperToken;
}

interface CardProps {
  data: NewDeveloperToken;
  marketCapValueColor: string;
}

// Helper function to parse P&L value
// const parsePnLValue = (pnlSol: string | null): number => {
//   if (!pnlSol) return 0;
//   // Remove 'SOL' and '+' sign, then parse to number
//   return Number(pnlSol.replace(/[+SOL]/g, "").trim());
// };

export default function DeployedTokensCard({
  isModalContent = true,
  data,
}: DeployedTokensCardProps) {
  // const theme = useCustomizeTheme();
  const { remainingScreenWidth } = usePopupStore();
  // const pnlValue = parsePnLValue(data.pnlSol?.toString() ?? null);
  // const isPositivePnL = pnlValue >= 0;
  const customizedSettingPresets = useCustomizeSettingsStore(
    (state) => state.presets,
  );

  const customizedSettingActivePreset = useCustomizeSettingsStore(
    (state) => state.activePreset,
  );

  const colorSetting =
    customizedSettingPresets[customizedSettingActivePreset].colorSetting ||
    "normal";

  const marketCapValueColor = useMemo(() => {
    if (!data?.marketCapUsd) return "text-destructive";

    if (data?.marketCapUsd > 100000)
      return colorSetting === "cupsey" ? "text-[#50D7B0]" : "text-success";
    if (data?.marketCapUsd > 30000)
      return colorSetting === "cupsey" ? "text-[#E7B587]" : "text-warning";
    if (data?.marketCapUsd > 15000)
      return colorSetting === "cupsey" ? "text-[#73D5F8]" : "text-[#6ac0ed]";
    return colorSetting === "cupsey" ? "text-[#FF4B92]" : "text-destructive";
  }, [data?.marketCapUsd, colorSetting]);

  return (
    <div
      className={cn(
        "items-center overflow-hidden",
        "max-md:mr-2 max-md:rounded-[8px] max-md:border max-md:border-border",
        "flex lg:h-[56px] lg:min-w-max lg:rounded-none lg:pl-4 lg:hover:bg-white/[4%]",
        remainingScreenWidth < 880 &&
          !isModalContent &&
          "mb-2 border border-border lg:h-fit lg:pl-0 xl:rounded-[8px]",
      )}
    >
      {remainingScreenWidth < 880 ? (
        <DeployedTokensCardMobileContent
          data={data}
          marketCapValueColor={marketCapValueColor}
        />
      ) : (
        <DeployedTokensCardDesktopContent
          data={data}
          marketCapValueColor={marketCapValueColor}
        />
      )}
    </div>
  );
}

const DeployedTokensCardDesktopContent = memo(
  ({ data, marketCapValueColor }: CardProps) => (
    <>
      {/* TOKEN */}
      <div className="w-full min-w-[180px]">
        <div className="flex items-center gap-x-2">
          <AvatarWithBadges
            // leftType={getLeftBadgeType(tokenData?.dex, tokenData?.origin_dex)}
            rightType={getRightBadgeType(data?.dex)}
            src={data?.image}
            alt={`${data?.symbol} Image`}
            size="md"
          />
          <div className="flex flex-col gap-y-1">
            <div className="flex items-center gap-x-1">
              <Link
                href={`/token/${data?.mint}`}
                prefetch
                className="text-nowrap font-geistSemiBold text-sm text-fontColorPrimary"
              >
                {truncateString(data?.symbol, 8)}
              </Link>
              {/* <span className="text-nowrap text-xs text-fontColorSecondary">
                  {truncateString(tokenData?.symbol, 5)}
                </span> */}
            </div>

            <div className="-mt-0.5 flex items-center gap-x-1">
              <span className="inline-block text-nowrap text-xs text-fontColorSecondary">
                {truncateAddress(data?.mint)}
              </span>
              <Copy value={data?.mint} />
            </div>
          </div>
        </div>
      </div>

      {/* DATE */}
      <div className="hidden h-full w-full min-w-[120px] flex-grow items-center md:flex">
        <span className="line-clamp-1 inline-block text-nowrap font-geistSemiBold text-sm text-fontColorPrimary">
          {formatTime(data.created)}
        </span>
      </div>

      {/* MIGRATED */}
      <div className="hidden h-full w-full min-w-[120px] flex-grow items-center md:flex">
        <span
          className={cn(
            "line-clamp-1 inline-block text-nowrap font-geistSemiBold text-sm",
            data?.migrated === true && "text-success",
            data?.migrated === false && "text-destructive",
          )}
        >
          {data.migrated ? "True" : "False"}
        </span>
      </div>

      {/* TRANSACTIONS */}
      <div className="hidden h-full w-full min-w-[80px] flex-grow items-center md:flex">
        <span className="inline-block text-nowrap font-geistSemiBold text-sm text-fontColorPrimary">
          {data.txCount}
        </span>
      </div>

      {/* VOLUME */}
      <div className="hidden h-full w-full min-w-[120px] flex-grow items-center md:flex">
        <span className="inline-block text-nowrap font-geistSemiBold text-sm text-fontColorPrimary">
          {formatAmountDollar(data?.volume)}
        </span>
      </div>

      {/* LIQUIDITY */}
      <div className="hidden h-full w-full min-w-[120px] flex-grow items-center md:flex">
        <span className="inline-block text-nowrap font-geistSemiBold text-sm text-fontColorPrimary">
          {formatAmountDollar(data?.liquidityUsd || 0)}
        </span>
      </div>

      {/* MARKET CAP */}
      <div className="hidden h-full w-full min-w-[120px] flex-grow items-center md:flex">
        <span
          className={cn(
            "inline-block text-nowrap font-geistSemiBold text-sm",
            marketCapValueColor,
          )}
        >
          {formatAmountDollar(Number(data.marketCapUsd))}
        </span>
      </div>
    </>
  ),
);

DeployedTokensCardDesktopContent.displayName = "DeployedTokensCard";

const DeployedTokensCardMobileContent = memo(
  ({ data, marketCapValueColor }: CardProps) => {
    return (
      <div className="flex w-full flex-col rounded-[8px] border border-border bg-card">
        {/* Header */}
        <div className="relative flex h-[36px] w-full items-center justify-between bg-white/[4%] px-3 py-2">
          <div className="flex items-center gap-x-2">
            <AvatarWithBadges
              // leftType={getLeftBadgeType(data?.dex, tokenData?.origin_dex)}
              rightType={getRightBadgeType(data?.origin_dex)}
              src={data?.image}
              alt={`${data?.symbol} Image`}
              size="sm"
            />
            <div className="items-left flex flex-col justify-start gap-x-1">
              <Link
                href={`/token/${data?.mint}`}
                prefetch
                className="text-nowrap font-geistSemiBold text-xs text-fontColorPrimary"
              >
                {data?.symbol}
              </Link>
            </div>
            <div className="flex items-center gap-x-1">
              <span className="text-nowrap text-xs text-fontColorSecondary">
                {truncateAddress(data?.mint)}
              </span>
              <Copy value={data?.mint} />
            </div>
          </div>

          <div className="flex h-full items-center gap-x-2">
            <div className="flex items-center gap-x-1">
              <span className="text-xs text-fontColorSecondary">
                {formatTime(data?.created || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-2 px-3 py-[6px]">
          {[
            {
              label: "Liquidity",
              value: formatAmountDollar(data?.liquidityUsd || 0),
            },
            {
              label: "Market Cap",
              value: formatAmountDollar(data?.marketCapUsd || 0),
            },
            {
              label: "Transactions",
              value: formatAmount(data?.txCount || 0, 2),
            },
            {
              label: "Volume",
              value: formatAmountDollar(data?.volume || 0),
            },
          ]?.map((item) => (
            <div key={item.label} className="flex flex-col gap-y-1">
              <span className="text-nowrap text-xs text-fontColorSecondary">
                {item.label}
              </span>
              <span
                className={cn(
                  "font-geistSemiBold text-xs text-fontColorPrimary",
                  item.value === "True" && "text-success",
                  item.value === "False" && "text-destructive",
                  item.label === "Market Cap" && marketCapValueColor,
                )}
              >
                {item.value}
              </span>
            </div>
          ))}
        </div>

        <div className="flex h-[28.4px] w-full justify-between border-t border-border px-3 py-[6px]">
          <div className="flex items-center font-geistSemiBold text-xs text-fontColorPrimary">
            Migrated
          </div>

          <div
            className={cn(
              "flex items-center font-geistSemiBold text-xs text-fontColorPrimary",
              data?.migrated === true && "text-success",
              data?.migrated === false && "text-destructive",
            )}
          >
            {data?.migrated ? "True" : "False"}
          </div>
        </div>
      </div>
    );
  },
);

DeployedTokensCardMobileContent.displayName = "DeployedTokensCard";

// Function to calculate the time difference in hours and minutes
const formatTime = (timestamp: number) => {
  if (timestamp === 0) return "0d 0h";
  const now = Math.floor(Date.now() / 1000);
  const diff = now - Math.floor(timestamp);

  if (diff < 60) return `${diff}s`;
  const minutes = Math.floor(diff / 60);
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${minutes % 60}m`;

  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
};
