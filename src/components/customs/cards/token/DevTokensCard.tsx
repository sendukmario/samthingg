"use client";

// ######## Libraries 📦 & Hooks 🪝 ########
import { useCallback, useMemo, useEffect, useRef, memo } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { prefetchChart } from "@/apis/rest/charts";
// ######## Components 🧩 ########
import Image from "next/image";
import Link from "next/link";
import Copy from "@/components/customs/Copy";
import AvatarWithBadges, {
  getRightBadgeType,
} from "@/components/customs/AvatarWithBadges";
import { truncateAddress } from "@/utils/truncateAddress";
import { formatAmount, formatAmountDollar } from "@/utils/formatAmount";
// ######## Utils & Helpers 🤝 ########
import { cn } from "@/libraries/utils";
import { truncateString } from "@/utils/truncateString";
import { formatTimeAgo } from "@/utils/formatDate";
// ######## Types 🗨️ ########
import { NewDeveloperToken } from "@/types/ws-general";
import { useWindowSizeStore } from "@/stores/use-window-size.store";
import { usePopupStore } from "@/stores/use-popup-state.store";
import { useCustomizeSettingsStore } from "@/stores/setting/use-customize-settings.store";

interface DevTokensCardProps {
  tokenData: NewDeveloperToken;
}

function DevTokensCard({ tokenData }: DevTokensCardProps) {
  const width = useWindowSizeStore((state) => state.width);
  const isXlDown = width ? width < 1280 : false;
  const { remainingScreenWidth } = usePopupStore();
  const router = useRouter();
  const queryClientNormal = useQueryClient();
  const tokenUrlRef = useRef<string>("#");

  const params = useParams<{ "mint-address": string }>();

  const customizedSettingPresets = useCustomizeSettingsStore(
    (state) => state.presets,
  );
  const customizedSettingActivePreset = useCustomizeSettingsStore(
    (state) => state.activePreset,
  );
  const colorSetting =
    customizedSettingPresets[customizedSettingActivePreset].colorSetting ||
    "normal";

  // Market Cap
  const marketCapValueColor = useMemo(() => {
    if (!tokenData?.marketCapUsd) return "text-destructive";

    if (tokenData?.marketCapUsd > 100000)
      return colorSetting === "cupsey" ? "text-[#50D7B0]" : "text-success";
    if (tokenData?.marketCapUsd > 30000)
      return colorSetting === "cupsey" ? "text-[#E7B587]" : "text-warning";
    if (tokenData?.marketCapUsd > 15000)
      return colorSetting === "cupsey" ? "text-[#73D5F8]" : "text-[#6ac0ed]";
    return colorSetting === "cupsey" ? "text-[#FF4B92]" : "text-destructive";
  }, [tokenData?.marketCapUsd, colorSetting]);

  useEffect(() => {
    if (tokenData?.mint) {
      const params = new URLSearchParams({
        symbol: tokenData?.symbol || "",
        image: tokenData?.image || "",
        market_cap_usd: String(tokenData?.marketCapUsd || ""),
      });

      tokenUrlRef.current = `/token/${tokenData?.mint}?${params.toString()}`;
    }

    return () => {
      tokenUrlRef.current = "#"; // Clear reference on unmount
    };
  }, [
    tokenData?.mint,
    tokenData?.symbol,
    tokenData?.image,
    tokenData?.marketCapUsd,
  ]);

  const handleCardClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!tokenData?.mint) return;
      if (tokenData?.mint === params["mint-address"]) return;

      // console.time("Navigate from Token page:");

      prefetchChart(queryClientNormal, tokenData?.mint);

      // Prefetch the page route
      router.prefetch(tokenUrlRef.current);
      router.push(tokenUrlRef.current);
    },
    [router, queryClientNormal, tokenData?.mint],
  );

  const handleCardContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (tokenData?.mint === params["mint-address"]) return;
    window.open(tokenUrlRef.current, "_blank");
  }, []);

  return (
    <div
      className={cn(
        "flex-shrink-0 items-center overflow-hidden from-background to-background-1",
        "max-xl:rounded-[8px] max-xl:border max-xl:border-border max-xl:bg-card xl:border-none xl:odd:bg-white/[4%]",
        "transition-colors duration-200 ease-out xl:flex xl:h-[70px] xl:min-w-max xl:border-b xl:border-border xl:pr-[16px] xl:hover:bg-white/[8%]",
        remainingScreenWidth <= 1280 &&
          "max-xl:rounded-none max-xl:border-none max-xl:bg-transparent xl:flex xl:h-auto xl:min-w-fit",
      )}
      onClick={handleCardClick}
      onMouseDown={(e) => {
        if (e.button === 1) {
          e.preventDefault();
          handleCardContextMenu(e);
        }
      }}
      onContextMenu={handleCardContextMenu}
    >
      {isXlDown || remainingScreenWidth < 1280 ? (
        <MobileDevTokensCard
          tokenData={tokenData}
          marketCapValueColor={marketCapValueColor}
        />
      ) : (
        <DesktopDevTokensCard
          tokenData={tokenData}
          marketCapValueColor={marketCapValueColor}
        />
      )}
    </div>
  );
}

interface DesktopDevTokensCardProps {
  tokenData: NewDeveloperToken;
  marketCapValueColor:
    | "text-destructive"
    | "text-[#50D7B0]"
    | "text-success"
    | "text-[#E7B587]"
    | "text-warning"
    | "text-[#73D5F8]"
    | "text-[#6ac0ed]"
    | "text-[#FF4B92]";
}

const MobileDevTokensCard = memo(function MobileDevTokensCard({
  tokenData,
  marketCapValueColor,
}: DesktopDevTokensCardProps) {
  return (
    <div className="flex w-full flex-col rounded-[8px] border border-border bg-card">
      {/* Header */}
      <div className="relative flex h-[36px] w-full items-center justify-between bg-white/[4%] px-3 py-2">
        <div className="flex items-center gap-x-2">
          <AvatarWithBadges
            // leftType={getLeftBadgeType(tokenData?.dex, tokenData?.origin_dex)}
            rightType={getRightBadgeType(tokenData?.origin_dex)}
            src={tokenData?.image}
            alt={`${tokenData?.symbol} Image`}
            size="sm"
          />
          <div className="items-left flex flex-col justify-start gap-x-1">
            <Link
              href={`/token/${tokenData?.mint}`}
              prefetch
              className="text-nowrap font-geistSemiBold text-xs text-fontColorPrimary"
            >
              {tokenData?.symbol}
            </Link>
          </div>
          <div className="flex items-center gap-x-1">
            <span className="text-nowrap text-xs text-fontColorSecondary">
              {truncateAddress(tokenData?.mint)}
            </span>
            <Copy value={tokenData?.mint} />
          </div>
        </div>

        <div className="flex h-full items-center gap-x-2">
          <div className="flex items-center gap-x-1">
            <span className="text-xs text-fontColorSecondary">
              {formatTimeAgo(tokenData?.created || 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-2 px-3 py-[6px]">
        {[
          {
            label: "Liquidity",
            value: formatAmountDollar(tokenData?.liquidityUsd || 0),
          },
          {
            label: "Market Cap",
            value: formatAmountDollar(tokenData?.marketCapUsd || 0),
          },
          {
            label: "Transactions",
            value: formatAmount(tokenData?.txCount || 0, 2),
          },
          {
            label: "Volume",
            value: formatAmountDollar(tokenData?.volume || 0),
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
            tokenData?.migrated === true && "text-success",
            tokenData?.migrated === false && "text-destructive",
          )}
        >
          {tokenData?.migrated ? "True" : "False"}
        </div>
      </div>
    </div>
  );
});

const DesktopDevTokensCard = memo(function DesktopDevTokensCard({
  tokenData,
  marketCapValueColor,
}: DesktopDevTokensCardProps) {
  const { remainingScreenWidth } = usePopupStore();
  return (
    <div className="flex w-full items-center pl-4">
      {/* Token Info Column */}
      <div className="w-full min-w-[205px]">
        <div className="flex items-center gap-x-4">
          <AvatarWithBadges
            // leftType={getLeftBadgeType(tokenData?.dex, tokenData?.origin_dex)}
            rightType={getRightBadgeType(tokenData?.dex)}
            src={tokenData?.image}
            alt={`${tokenData?.symbol} Image`}
            size="lg"
          />
          <div className="flex flex-col gap-y-1">
            <div className="flex items-center gap-x-1">
              <Link
                href={`/token/${tokenData?.mint}`}
                prefetch
                className="text-nowrap font-geistSemiBold text-sm text-fontColorPrimary"
              >
                {truncateString(tokenData?.symbol, 8)}
              </Link>
              {/* <span className="text-nowrap text-xs text-fontColorSecondary">
                  {truncateString(tokenData?.symbol, 5)}
                </span> */}
            </div>

            <div className="-mt-0.5 flex items-center gap-x-1">
              <span className="inline-block text-nowrap text-xs text-fontColorSecondary">
                {truncateAddress(tokenData?.mint)}
              </span>
              <Copy value={tokenData?.mint} />
            </div>
          </div>
        </div>
      </div>

      {/* Created Time Column */}
      <div
        className={cn(
          "h-full w-[70%] items-center",
          remainingScreenWidth > 1650 ? "min-w-[73px]" : "min-w-[63px]",
        )}
      >
        <div className="flex items-center gap-x-1">
          <div className="relative aspect-square h-4 w-4 flex-shrink-0">
            <Image
              src="/icons/created-clock.png"
              alt="Created Icon"
              fill
              quality={100}
              className="object-contain"
            />
          </div>
          <span className="inline-block text-nowrap font-geistSemiBold text-sm text-fontColorPrimary">
            {formatTimeAgo(tokenData?.created || 0)}
          </span>
        </div>
      </div>

      {/* Migration Status Column */}
      <div
        className={cn(
          "h-full w-[60%] items-center",
          remainingScreenWidth > 1650 ? "min-w-[73px]" : "min-w-[63px]",
        )}
      >
        <span
          className={cn(
            "inline-block text-nowrap font-geistSemiBold text-sm",
            tokenData?.migrated ? "text-success" : "text-destructive",
          )}
        >
          {tokenData?.migrated ? "True" : "False"}
        </span>
      </div>

      <div
        className={cn(
          "hidden h-full w-[60%] flex-col items-start justify-center xl:flex",
          remainingScreenWidth > 1650 ? "min-w-[73px]" : "min-w-[63px]",
        )}
      >
        <span className="text-nowrap font-geistSemiBold text-sm text-fontColorPrimary">
          {formatAmount(tokenData?.txCount || 0, 2)}
        </span>
      </div>

      <div
        className={cn(
          "hidden h-full w-[75%] flex-col items-start justify-center xl:flex",
          remainingScreenWidth > 1650 ? "min-w-[56px]" : "min-w-[49px]",
        )}
      >
        <span className="text-nowrap font-geistSemiBold text-sm text-fontColorPrimary">
          {formatAmountDollar(tokenData?.volume)}
        </span>
      </div>

      <div
        className={cn(
          "hidden h-full w-[75%] flex-col items-start justify-center xl:flex",
          remainingScreenWidth > 1650 ? "min-w-[56px]" : "min-w-[49px]",
        )}
      >
        <span className="text-nowrap font-geistSemiBold text-sm text-fontColorPrimary">
          {formatAmountDollar(tokenData?.liquidityUsd || 0)}
        </span>
      </div>

      <div
        className={cn(
          "hidden h-full w-[75%] flex-col items-start justify-center xl:flex",
          remainingScreenWidth > 1650 ? "min-w-[56px]" : "min-w-[49px]",
        )}
      >
        <span
          className={cn(
            "text-nowrap font-geistSemiBold text-sm",
            marketCapValueColor,
          )}
        >
          {formatAmountDollar(tokenData?.marketCapUsd || 0)}
        </span>
      </div>
    </div>
  );
});

export default memo(DevTokensCard);
