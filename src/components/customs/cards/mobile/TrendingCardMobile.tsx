"use client";

// ######## Libraries 📦 & Hooks 🪝 ########
import { useMemo, useCallback } from "react";
import { useRouter } from "nextjs-toploader/app";
import { useSolPriceMessageStore } from "@/stores/use-solprice-message.store";
import { useTrackUserEvent } from "@/hooks/use-track-event";
import { useTrackUserEventStore } from "@/stores/use-track-user-event.store";
import toast from "react-hot-toast";
// ######## Components 🧩 ########
import Image from "next/image";
import Separator from "@/components/customs/Separator";
import QuickBuyButton from "@/components/customs/buttons/QuickBuyButton";
import AvatarWithBadges, {
  BadgeType,
  getRightBadgeType,
} from "@/components/customs/AvatarWithBadges";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Copy from "@/components/customs/Copy";
import SocialLinkButton from "@/components/customs/buttons/SocialLinkButton";
import CustomToast from "@/components/customs/toasts/CustomToast";
import { CachedImage } from "@/components/customs/CachedImage";
// ######## Utils & Helpers 🤝 ########
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
import { useHiddenTokensStore } from "@/stores/cosmo/use-hidden-tokens.store";
import { useMoreFilterStore } from "@/stores/dex-setting/use-more-filter.store";
import { useCustomToast } from "@/hooks/use-custom-toast";
import { usePopupStore } from "@/stores/use-popup-state.store";

interface TrendingCardMobileProps {
  isFirst: boolean;
  tokenData: TrendingDataMessageType;
  trackedWalletsOfToken: Record<string, string[]>;
}

export default function TrendingCardMobile({
  isFirst,
  tokenData,
  trackedWalletsOfToken,
}: TrendingCardMobileProps) {
  const router = useRouter();
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

  const formatTimeAgo = (timestamp: number) => {
    if (timestamp === 0) return "0d 0h";
    const now = Math.floor(Date.now() / 1000);
    const diff = now - Math.floor(timestamp / 1000);

    if (diff < 60) return `${diff}s`;
    const minutes = Math.floor(diff / 60);
    if (minutes < 60) return `${minutes}m`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ${minutes % 60}m`;

    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  };

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

  const queryClient = useQueryClient();
  let hoverTimeout: NodeJS.Timeout;

  const isHidden = useHiddenTokensStore((state) =>
    state.isTokenHidden(tokenData.mint),
  );

  const showHiddenTokens = useMoreFilterStore(
    (state) => state.filters.genuine.checkBoxes.showHide,
  );
  const remainingScreenWidth = usePopupStore(
    (state) => state.remainingScreenWidth,
  );

  const setIsExternal = useTrackUserEventStore((state) => state.setIsExternal);
  const { mutate: trackUserEvent } = useTrackUserEvent("trending");

  if (showHiddenTokens !== isHidden) return null;

  return (
    <div
      onClick={() => {
        setIsExternal(false);
        trackUserEvent({ mint: tokenData?.mint || "" });
        prefetchChart(queryClient, tokenData.mint);
        router.push("/token/" + tokenData.mint);
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsExternal(false);
        trackUserEvent({ mint: tokenData?.mint || "" });
        window.open("/token/" + tokenData.mint, "_blank");
      }}
      className="group mb-2 w-full flex-shrink-0 cursor-pointer overflow-hidden rounded-[8px] border border-border bg-transparent duration-300 hover:border-border"
    >
      {/* Header */}
      <div className="relative flex h-[auto] w-full items-center justify-between overflow-hidden bg-shadeTable px-2 py-2">
        <div className="relative z-20 flex items-center gap-x-1">
          <AvatarHighlightWrapper
            size={36.4}
            walletHighlights={walletHighlights}
          >
            <AvatarWithBadges
              classNameParent="border-1 relative !size-[26.4px] flex aspect-square flex-shrink-0 items-center justify-center rounded-full border border-[#DF74FF]/30 bg-border/0 backdrop-blur-lg"
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
              rightClassName="!size-3.5 -right-0.5 -bottom-[1.5px]"
              size="xs"
            />
          </AvatarHighlightWrapper>
          <button
            title={
              useHiddenTokensStore.getState().isTokenHidden(tokenData.mint)
                ? "Unhide Token"
                : "Hide Token"
            }
            className="relative z-[10] aspect-square size-4 flex-shrink-0 group-hover:block"
            onClick={async (e) => {
              e.stopPropagation();
              try {
                const hideToken = useHiddenTokensStore.getState().hideToken;
                const unhideToken = useHiddenTokensStore.getState().unhideToken;
                const isTokenHidden = useHiddenTokensStore
                  .getState()
                  .isTokenHidden(tokenData.mint);

                if (isTokenHidden) {
                  unhideToken(tokenData.mint); // Store update
                  // toast.custom((t: any) => (
                  //   <CustomToast
                  //     tVisibleState={t.visible}
                  //     message="Successfully unhidden token"
                  //     state="SUCCESS"
                  //   />
                  // ));
                  success("Successfully unhidden token");
                } else {
                  hideToken(tokenData.mint); // Store update
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
                useHiddenTokensStore.getState().isTokenHidden(tokenData.mint)
                  ? "/icons/eye-show.svg"
                  : "/icons/eye-hide.svg"
              }
              alt={
                useHiddenTokensStore.getState().isTokenHidden(tokenData.mint)
                  ? "Show Token Icon"
                  : "Hide Token Icon"
              }
              height={16}
              width={16}
              quality={100}
              className="object-contain"
            />
          </button>
          <div className="flex flex-wrap gap-1">
            <h4 className="text-nowrap font-geistSemiBold text-xs text-fontColorPrimary">
              {truncateString(tokenData.name, 8)}
            </h4>
            <span className="text-nowrap text-[10px] uppercase text-fontColorSecondary">
              {truncateString(tokenData.symbol, 6)}
            </span>
            <Copy value={tokenData.mint} dataDetail={tokenData} />
          </div>
        </div>

        {/* Created On & Links */}
        <div className="relative z-20 flex items-center gap-x-2">
          <span className="inline-block text-nowrap font-geistSemiBold text-xs text-fontColorSecondary">
            {formatTimeAgo(tokenData.created)}
          </span>
          {(tokenData.twitter || tokenData.telegram || tokenData.website) && (
            <Separator
              color="#202037"
              orientation="vertical"
              unit="fixed"
              fixedHeight={18}
            />
          )}

          {(tokenData.twitter || tokenData.telegram || tokenData.website) && (
            <div className="flex items-center gap-x-1">
              {tokenData.twitter && (
                <SocialLinkButton
                  href={tokenData.twitter}
                  icon="x"
                  label="Twitter"
                />
              )}
              {tokenData.telegram && (
                <SocialLinkButton
                  href={tokenData.telegram}
                  icon="telegram"
                  label="Telegram"
                />
              )}
              {tokenData.website && (
                <SocialLinkButton
                  href={tokenData.website}
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
          )}
        </div>
      </div>

      {/* Content */}
      <div className="relative flex w-full flex-col">
        <div className="flex w-full flex-col gap-y-3 px-2 py-3">
          <div className="flex items-center gap-x-4 min-[430px]:gap-x-6">
            {[
              {
                label: "Liquidity",
                value: `$${formatAmount(tokenData.liquidity_usd, 2)}`,
              },
              {
                label: "Market cap",
                value: `$${formatAmount(tokenData.market_cap_usd, 2)}`,
              },

              {
                label: "TXNS",
                value: formatAmount(tokenData.buys + tokenData.sells, 2),
              },
              {
                label: "Volume",
                value: `$${formatAmount(tokenData.volume_usd, 2)}`,
                className: "text-success",
              },
            ]?.map((item) => (
              <div key={item.label} className="flex flex-col gap-y-0.5">
                <span className="line-clamp-1 text-xs text-fontColorSecondary">
                  {item.label}
                </span>
                <span
                  className={cn(
                    "line-clamp-1 font-geistSemiBold text-xs text-fontColorPrimary",
                    item.className,
                  )}
                >
                  {item.value}
                </span>
              </div>
            ))}
          </div>

          <div
            className={cn(
              "flex flex-wrap items-center gap-x-1 gap-y-1",
              remainingScreenWidth < 420
                ? "min-h-[44px] max-w-[280px]"
                : "min-h-fit max-w-none",
            )}
          >
            {[
              { period: "1M", value: tokenData["1m"] },
              { period: "5M", value: tokenData["5m"] },
              { period: "30M", value: tokenData["30m"] },
              { period: "1H", value: tokenData["1h"] },
            ]?.map((item) => (
              <div
                key={item.period}
                className="flex h-5 items-center justify-center gap-x-1 rounded-[4px] bg-white/[8%] p-1"
              >
                <span className="font-geistSemiBold text-xs text-fontColorSecondary">
                  {item.period}
                </span>
                <span
                  className={cn(
                    "font-geistSemiBold text-xs",
                    item.value >= 0 ? "text-success" : "text-destructive",
                  )}
                >
                  {formatCommaWithDecimal(item.value)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        <Separator color="#202037" />

        <div className="flex h-[auto] w-full items-center justify-between p-2">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
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

          <div id={isFirst ? "trending-quick-buy-button-first" : undefined}>
            <QuickBuyButton
              module="ignite"
              mintAddress={tokenData.mint}
              variant="trending"
            />
          </div>
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
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-x-1">
            <div className="relative aspect-auto h-5 w-5 flex-shrink-0">
              <Image
                src={imageURL}
                alt="Audit Status Icon"
                fill
                quality={100}
                className="object-contain"
              />
            </div>
            <span
              style={{ color: textColor }}
              className="-mb-0.5 inline-block text-wrap font-geistSemiBold text-[10px]"
            >
              {auditMetric}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent className="mb-1.5">
          <p className="text-xs text-fontColorSecondary">{tooltipMessage}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
