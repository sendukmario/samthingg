"use client";

// ######## Libraries 📦 & Hooks 🪝 ########
import { useCallback, useMemo } from "react";
import { useRouter } from "nextjs-toploader/app";
import { useHiddenTokensStore } from "@/stores/cosmo/use-hidden-tokens.store";
import { useTrackUserEvent } from "@/hooks/use-track-event";
import { useTrackUserEventStore } from "@/stores/use-track-user-event.store";
import toast from "react-hot-toast";
// ######## Components 🧩 ########
import Image from "next/image";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import AvatarWithBadges, {
  BadgeType,
  getRightBadgeType,
} from "@/components/customs/AvatarWithBadges";
import QuickBuyButton from "@/components/customs/buttons/QuickBuyButton";
import SocialLinkButton from "@/components/customs/buttons/SocialLinkButton";
import Copy from "@/components/customs/Copy";
import CustomToast from "@/components/customs/toasts/CustomToast";
import { CachedImage } from "@/components/customs/CachedImage";
import TwitterHoverPopover from "@/components/customs/TwitterHoverPopover";
// ######## Utils & Helpers 🤝 ########
import truncateCA from "@/utils/truncateCA";
import { formatTimeAgo } from "@/utils/formatDate";
import { cn } from "@/libraries/utils";
import {
  formatAmount,
  formatAmountDollar,
  formatCommaWithDecimal,
} from "@/utils/formatAmount";
import { truncateString } from "@/utils/truncateString";
// ######## Types 🗨️ ########
import { TrendingDataMessageType } from "@/types/ws-general";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { prefetchTokenData } from "@/utils/prefetch";
import { prefetchChart } from "@/apis/rest/charts";
import {
  useWalletHighlightStore,
  type WalletWithColor,
} from "@/stores/wallets/use-wallet-highlight-colors.store";
import { AvatarHighlightWrapper } from "@/components/customs/AvatarHighlightWrapper";
import { useWindowSizeStore } from "@/stores/use-window-size.store";
import { useMoreFilterStore } from "@/stores/dex-setting/use-more-filter.store";
import { useCustomToast } from "@/hooks/use-custom-toast";

interface TrendingCardProps {
  index: number;
  isFirst: boolean;
  tokenData: TrendingDataMessageType;
  trackedWalletsOfToken: Record<string, string[]>;
}

export default function TrendingCard({
  index,
  isFirst,
  tokenData,
  trackedWalletsOfToken,
}: TrendingCardProps) {
  const router = useRouter();
  const width = useWindowSizeStore((state) => state.width);
  const { success } = useCustomToast();

  // const walletColors = useWalletHighlightStore((state) => state.wallets);
  const walletHighlights = useMemo(() => {
    const walletsWithColor: WalletWithColor[] = [];
    const walletColors = useWalletHighlightStore.getState().wallets;

    const trackedWallets = trackedWalletsOfToken[tokenData.mint] || [];
    for (const address of trackedWallets) {
      const wallet = walletColors[address];
      if (
        wallet &&
        walletsWithColor.findIndex((w) => w.address === wallet.address) === -1
      ) {
        walletsWithColor.push(wallet);
      }
    }

    return walletsWithColor;
  }, [tokenData.mint, trackedWalletsOfToken]);

  const handleGoogleLensSearch = useCallback(
    (event: React.MouseEvent, imageUrl: string) => {
      event.stopPropagation();
      window.open(
        `https://lens.google.com/uploadbyurl?url=${encodeURIComponent(imageUrl)}`,
        "_blank",
      );
    },
    [],
  );

  const tokenUrl = useMemo(() => {
    if (!tokenData?.mint) return "#";

    const params = new URLSearchParams({
      symbol: tokenData?.symbol || "",
      name: tokenData?.name || "",
      image: tokenData?.image || "",
      dex: tokenData?.dex || "",
    });

    return `/token/${tokenData.mint}?${params.toString()}`;
  }, [tokenData?.symbol, tokenData?.name, tokenData?.image, tokenData?.dex]);

  const queryClient = useQueryClient();
  let hoverTimeout: NodeJS.Timeout;

  const isHidden = useHiddenTokensStore((state) =>
    state.isTokenHidden(tokenData.mint),
  );

  const showHiddenTokens = useMoreFilterStore(
    (state) => state.filters.genuine.checkBoxes.showHide,
  );

  const setIsExternal = useTrackUserEventStore((state) => state.setIsExternal);
  const { mutate: trackUserEvent } = useTrackUserEvent("trending");

  // Return null if token visibility doesn't match filter setting
  // If showHiddenTokens is true, only show hidden tokens, otherwise show non-hidden tokens
  if ((showHiddenTokens && !isHidden) || (!showHiddenTokens && isHidden))
    return null;

  return (
    <div
      onClick={() => {
        setIsExternal(false);
        trackUserEvent({ mint: tokenData?.mint || "" });
        prefetchChart(queryClient, tokenData.mint);
        router.push(tokenUrl);
        // setTimeout(() => {
        //   prefetchCandles(data.mint);
        // }, 10);
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsExternal(false);
        trackUserEvent({ mint: tokenData?.mint || "" });
        window.open(tokenUrl, "_blank");
      }}
      className={cn(
        "transition-color xl-bg-card group relative flex h-[95px] min-w-max cursor-pointer items-center pl-4 pr-2 duration-200 ease-out hover:bg-shadeTableHover",
        index % 2 === 0 ? "" : "xl:bg-shadeTable xl:hover:bg-shadeTableHover",
      )}
    >
      <div className="flex w-full min-w-[196px]">
        <div className="flex items-center gap-x-4">
          <AvatarHighlightWrapper size={58} walletHighlights={walletHighlights}>
            <AvatarWithBadges
              classNameParent="border-1 relative flex aspect-square h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border border-[#DF74FF]/30 bg-border/0 backdrop-blur-lg lg:size-[48px]"
              src={tokenData?.image}
              symbol={tokenData?.symbol}
              alt={`${tokenData?.name} Image`}
              rightType={getRightBadgeType(
                tokenData?.dex,
                tokenData?.launchpad,
              )}
              handleGoogleLensSearch={(e) =>
                handleGoogleLensSearch(e, tokenData.image)
              }
              size="lg"
              rightClassName="size-[16px] -right-0.5 -bottom-0.5"
              leftClassName="size-[16px]"
            />
          </AvatarHighlightWrapper>
          <div className="flex flex-col gap-y-0.5">
            <div className="flex items-center gap-x-1">
              <button
                title={
                  useHiddenTokensStore.getState().isTokenHidden(tokenData.mint)
                    ? "Unhide Token"
                    : "Hide Token"
                }
                className="relative z-[10] hidden aspect-square size-4 flex-shrink-0 group-hover:flex"
                onClick={async (e) => {
                  e.stopPropagation();
                  try {
                    const hideToken = useHiddenTokensStore.getState().hideToken;
                    const unhideToken =
                      useHiddenTokensStore.getState().unhideToken;
                    const isTokenHidden = useHiddenTokensStore
                      .getState()
                      .isTokenHidden(tokenData.mint);

                    if (isTokenHidden) {
                      unhideToken(tokenData.mint);
                      // toast.custom((t: any) => (
                      //   <CustomToast
                      //     tVisibleState={t.visible}
                      //     message="Successfully unhidden token"
                      //     state="SUCCESS"
                      //   />
                      // ));
                      success("Successfully unhidden token");
                    } else {
                      hideToken(tokenData.mint);
                      // toast.custom((t: any) => (
                      //   <CustomToast
                      //     tVisibleState={t.visible}
                      //     message="Successfully hidden token"
                      //     state="SUCCESS"
                      //   />
                      // ));
                      success("Successfully hidden token");
                    }
                  } catch (error) {
                    console.warn("Error toggling token visibility:", error);
                  }
                }}
              >
                <CachedImage
                  src={
                    useHiddenTokensStore
                      .getState()
                      .isTokenHidden(tokenData.mint)
                      ? "/icons/eye-show.svg"
                      : "/icons/eye-hide.svg"
                  }
                  alt={
                    useHiddenTokensStore
                      .getState()
                      .isTokenHidden(tokenData.mint)
                      ? "Show Token Icon"
                      : "Hide Token Icon"
                  }
                  height={16}
                  width={16}
                  quality={100}
                  className="object-contain"
                />
              </button>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <h4 className="cursor-pointer text-nowrap font-geistSemiBold text-sm text-fontColorPrimary">
                      {truncateString(tokenData.symbol, 8)}
                    </h4>
                  </TooltipTrigger>
                  <TooltipContent className="-mb-1 bg-[#202035] px-2 py-1 shadow-[0_4px_16px_#000000]">
                    <p className="text-sm text-fontColorPrimary">
                      {tokenData.name}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <span className="text-nowrap text-xs lowercase leading-3 text-fontColorSecondary">
                {truncateString(tokenData.name, 6)}
              </span>
            </div>

            <div className="-mt-0.5 flex items-center gap-x-1">
              <span className="inline-block text-nowrap text-xs text-fontColorSecondary">
                {truncateCA(tokenData.mint, 10)}
              </span>
              <Copy value={tokenData.mint} dataDetail={tokenData} />
            </div>

            <div
              onClick={(e) => e.stopPropagation()}
              className="flex w-[96px] flex-nowrap items-center gap-1"
            >
              {tokenData?.twitter &&
                (tokenData.twitter.includes("/i/communities/") ? (
                  <TwitterHoverPopover
                    href={tokenData.twitter}
                    variant="secondary"
                    containerSize="size-[20px]"
                    iconSize="size-[16px]"
                  />
                ) : (
                  <TwitterHoverPopover
                    href={tokenData.twitter}
                    variant="secondary"
                    containerSize="size-[20px]"
                    iconSize="size-[16px]"
                  />
                ))}
              {tokenData?.telegram && (
                <SocialLinkButton
                  href={tokenData.telegram}
                  icon="telegram"
                  label="Telegram"
                />
              )}
              {tokenData?.website && (
                <SocialLinkButton
                  href={tokenData?.website}
                  icon="website"
                  label="Website"
                />
              )}
              {tokenData?.youtube && (
                <SocialLinkButton
                  href={tokenData?.youtube ?? ""}
                  icon="youtube"
                  label="YouTube"
                />
              )}
              {tokenData?.instagram && (
                <SocialLinkButton
                  href={tokenData?.instagram ?? ""}
                  icon="instagram"
                  label="Instagram"
                />
              )}
              {tokenData?.tiktok && (
                <SocialLinkButton
                  href={tokenData?.tiktok ?? ""}
                  icon="tiktok"
                  label="TikTok"
                />
              )}
            </div>
          </div>
        </div>
      </div>
      <div
        className={cn(
          "flex h-full w-full items-center",
          width! > 1480 ? "min-w-[140px]" : "min-w-[90px]",
        )}
      >
        <div className="flex items-center gap-x-1">
          <div className="relative aspect-square h-4 w-4 flex-shrink-0">
            <Image
              src="/icons/created-clock.png"
              alt="Created Clock Icon"
              fill
              quality={100}
              className="object-contain"
            />
          </div>
          <span className="inline-block text-nowrap font-geistSemiBold text-sm text-fontColorPrimary">
            {formatTimeAgo(tokenData.created)}
          </span>
        </div>
      </div>
      <div className="flex h-full w-full min-w-[80px] items-center">
        <div className="flex flex-col">
          <div className="flex items-center gap-x-1">
            <div className="relative aspect-square h-4 w-4 flex-shrink-0">
              <Image
                src="/icons/solana-sq.svg"
                alt="Solana SQ Icon"
                fill
                quality={100}
                className="object-contain"
              />
            </div>
            <span className="inline-block text-nowrap font-geistSemiBold text-sm text-fontColorPrimary">
              {formatAmount(tokenData.liquidity_base, 2)}
            </span>
          </div>
          <span className="inline-block text-nowrap text-sm text-fontColorSecondary">
            {formatAmountDollar(tokenData.liquidity_usd)}
          </span>
        </div>
      </div>
      <div className="flex h-full w-full min-w-[80px] items-center">
        <div className="flex flex-col">
          <span className="inline-block text-nowrap font-geistSemiBold text-sm text-fontColorPrimary">
            {formatAmountDollar(tokenData.market_cap_usd)}
          </span>
          <span className="inline-block text-nowrap text-sm text-fontColorSecondary">
            {formatAmountDollar(tokenData.market_cap_base)}
          </span>
        </div>
      </div>
      <div className="flex h-full w-full min-w-[72px] items-center">
        <span className="inline-block text-nowrap font-geistSemiBold text-sm text-fontColorPrimary">
          {formatAmountDollar(tokenData.volume_usd)}
        </span>
      </div>
      <div className="flex h-full w-full min-w-[75px] items-center">
        <div className="flex flex-col">
          <span className="inline-block text-nowrap font-geistSemiBold text-sm text-fontColorPrimary">
            {formatAmount(tokenData.buys + tokenData.sells, 2)}
          </span>
          <span className="inline-block text-nowrap text-sm text-fontColorSecondary">
            <span className="text-success">
              {formatAmount(tokenData.buys, 2)}
            </span>
            <span>/</span>{" "}
            <span className="text-destructive">
              {formatAmount(tokenData.sells, 2)}
            </span>
          </span>
        </div>
      </div>

      {["1m", "5m", "30m", "1h"]?.map((period) => (
        <div
          key={period}
          className="flex h-full w-full min-w-[70px] items-center"
        >
          <span
            className={cn(
              "inline-block text-nowrap font-geistSemiBold text-sm",
              tokenData[
                period as keyof Pick<
                  TrendingDataMessageType,
                  "1m" | "5m" | "30m" | "1h"
                >
              ] >= 0
                ? "text-success"
                : "text-destructive",
            )}
          >
            {formatCommaWithDecimal(
              tokenData[
                period as keyof Pick<
                  TrendingDataMessageType,
                  "1m" | "5m" | "30m" | "1h"
                >
              ],
            )}
            %
          </span>
        </div>
      ))}
      <div className="flex h-full w-full min-w-[170px] items-center gap-x-2">
        <AuditResult
          isChecked={tokenData.mint_disabled}
          auditMetric="MAD"
          tooltipMessage="Mint Auth Disabled"
        />
        <AuditResult
          isChecked={tokenData.freeze_disabled}
          auditMetric="FAD"
          tooltipMessage="Freeze Auth Disabled"
        />
        <AuditResult
          isChecked={tokenData.burned}
          auditMetric="LPB"
          tooltipMessage="LP Burned"
        />
        <AuditResult
          isChecked={tokenData.top10 <= 15 ? true : false}
          auditMetric="T10"
          tooltipMessage="Top 10 Holders"
        />
        <AuditResult
          isChecked={tokenData.bundled}
          auditMetric="BT"
          tooltipMessage="Bundled Token"
        />
      </div>
      <div className="mr-auto flex h-full w-full min-w-[90px] items-center justify-end">
        <div
          id={isFirst ? "trending-quick-buy-button-first" : undefined}
          className="h-auto w-auto"
        >
          <QuickBuyButton
            module="ignite"
            mintAddress={tokenData.mint}
            variant="trending"
          />
        </div>
      </div>
    </div>
  );
}

const AuditResult = ({
  isChecked,
  auditMetric,
  tooltipMessage,
}: {
  isChecked: boolean;
  auditMetric: string;
  tooltipMessage: string;
}) => {
  const imageURL = isChecked
    ? "/icons/audit-checked.png"
    : "/icons/audit-unchecked.png";
  const textColor = isChecked ? "#8CD9B6" : "#F65B93";

  return (
    <div className="flex w-auto flex-shrink-0 flex-col items-center gap-y-1">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="relative aspect-auto h-5 w-5 flex-shrink-0">
              <Image
                src={imageURL}
                alt="Audit Status Icon"
                fill
                quality={100}
                className="object-contain"
              />
            </div>
          </TooltipTrigger>
          <TooltipContent className="mb-1.5">
            <p className="text-xs text-fontColorPrimary">{tooltipMessage}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <span
        style={{ color: textColor }}
        className="inline-block text-wrap font-geistSemiBold text-xs"
      >
        {auditMetric}
      </span>
    </div>
  );
};
