"use client";

// ######## Libraries 📦 & Hooks 🪝 ########
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useWalletTrackerStore } from "@/stores/footer/use-wallet-tracker.store";
import { useSolPriceMessageStore } from "@/stores/use-solprice-message.store";
import { useRouter } from "next/navigation";
import { useTrackUserEvent } from "@/hooks/use-track-event";
import { useTrackUserEventStore } from "@/stores/use-track-user-event.store";
// ######## Components 🧩 ########
import Copy from "@/components/customs/Copy";
import Separator from "@/components/customs/Separator";
import QuickBuyButton from "@/components/customs/buttons/QuickBuyButton";
import AvatarWithBadges, {
  getRightBadgeType,
} from "@/components/customs/AvatarWithBadges";
import AddressWithEmojis from "@/components/customs/AddressWithEmojis";
import SocialLinkButton from "@/components/customs/buttons/SocialLinkButton";
import GradientProgressBar from "@/components/customs/GradientProgressBar";
import {
  SolanaIconSVG,
  BlueUSDCIconSVG,
} from "@/components/customs/ScalableVectorGraphics";
// ######## Utils & Helpers 🤝 ########
import { truncateAddress } from "@/utils/truncateAddress";
import { cn } from "@/libraries/utils";
import {
  formatAmount,
  formatAmountDollar,
  formatAmountWithoutLeadingZero,
} from "@/utils/formatAmount";
import { truncateString } from "@/utils/truncateString";
// ######## Types 🗨️ ########
import { WalletTracker } from "@/apis/rest/wallet-tracker";
import TimeDifference from "../TimeDifference";
import { usePopupStore } from "@/stores/use-popup-state.store";
import { useWindowSizeStore } from "@/stores/use-window-size.store";
import { useQuickAmountStore } from "@/stores/dex-setting/use-quick-amount.store";
import { SolUsdc } from "@/stores/token/use-token-cards-filter.store";
import { useWalletTrackerFilterStore } from "@/stores/dex-setting/use-wallet-tracker-filter.store";
import { prefetchChart } from "@/apis/rest/charts";
import { useQueryClient } from "@tanstack/react-query";
import {
  useWalletHighlightStore,
  type WalletWithColor,
} from "@/stores/wallets/use-wallet-highlight-colors.store";
import { AvatarHighlightWrapper } from "@/components/customs/AvatarHighlightWrapper";
import {
  ColorType,
  defaultColors,
  useWalletTrackerColor,
} from "@/stores/wallet/use-wallet-tracker-color.store";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCustomizeSettingsStore } from "@/stores/setting/use-customize-settings.store";
import { formatPercentage } from "@/utils/formatPercentage";

interface Props {
  index: number;
  isFirst: boolean;
  tracker: WalletTracker;
  wallets: string[];
  type: "buy" | "sell";
  responsiveBreakpoint: 1280 | 768;
  amountType?: SolUsdc;
  variant?: "pop-out" | "cupsey-snap" | "snap";
}

export default React.memo(function WalletTrackerCardPopOut({
  index,
  isFirst,
  tracker,
  wallets,
  type,
  responsiveBreakpoint,
  variant = "pop-out",
}: Props) {
  const { colors } = useWalletTrackerColor();
  const amountType = useWalletTrackerFilterStore((state) => state.amountType);
  const width = useWindowSizeStore((state) => state.width);
  const trackedWallets = useWalletTrackerStore((state) => state.trackedWallets);
  const trackedWalletAdditionalInfo = (trackedWallets || [])?.find(
    (tw) => tw.address === tracker.walletAddress,
  );

  // const solPrice = useSolPriceMessageStore((state) => state.messages.price);

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
    if (!tracker?.mint) return "#";

    const params = new URLSearchParams({
      symbol: tracker?.symbol || "",
      name: tracker?.name || "",
      image: tracker?.image || "",
      dex: tracker?.dex || "",
    });

    return `/token/${tracker.mint}?${params.toString()}`;
  }, [tracker?.symbol, tracker?.name, tracker?.image, tracker?.dex]);

  const router = useRouter();

  const walletColors = useWalletHighlightStore((state) => state.wallets);
  const walletHighlights = useMemo(() => {
    const walletsWithColor: WalletWithColor[] = [];

    for (const address of wallets) {
      const wallet = walletColors[address];
      if (
        wallet &&
        walletsWithColor.findIndex((w) => w.address === wallet.address) === -1
      ) {
        walletsWithColor.push(wallet);
      }
    }

    return walletsWithColor;
  }, [wallets, walletColors]);

  // const router = useRouter();
  const { popups } = usePopupStore();
  const walletTracker = popups.find(
    (value) => value.name === "wallet_tracker",
  )!;
  const { size, mode, snappedSide } = walletTracker;

  const popUpResponsive =
    (size.width < 770 && mode !== "footer") || variant === "cupsey-snap";
  const actionResponsive =
    (size.width < 600 && mode !== "footer") || variant === "cupsey-snap";

  const [isHover, setIsHover] = useState<boolean>(false);
  // Determine when the QuickBuy button should be visible
  const showAction = !actionResponsive || isHover;

  const quickBuyAmount = useQuickAmountStore(
    (state) => state.cosmoQuickBuyAmount,
  );
  const quickBuyLength = quickBuyAmount.toString().length;
  const dynamicChWidth = 120 + quickBuyLength * 5;

  const globalSolPrice = useSolPriceMessageStore(
    (state) => state.messages.price,
  );

  const [isNew, setIsNewTrade] = useState<boolean>(false);
  const [showAnimation, setShowAnimation] = useState<boolean>(false);
  useEffect(() => {
    const rawTimestamp = tracker.timestamp;
    const normalizedTimestamp =
      String(rawTimestamp).length <= 10 ? rawTimestamp * 1000 : rawTimestamp;

    const currentTime = Date.now();
    const timeDiff = Math.abs(currentTime - normalizedTimestamp);
    const isWithinOneSec = timeDiff <= 1000;

    setIsNewTrade(isWithinOneSec);

    let timer: NodeJS.Timeout | null = null;

    if (isWithinOneSec) {
      setShowAnimation(true);
      timer = setTimeout(() => {
        setShowAnimation(false);
        setIsNewTrade(false);
      }, 2500);
    } else {
      setShowAnimation(false);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [tracker.timestamp]);

  const queryClient = useQueryClient();
  // const { getApiResolution } = useTradingViewPreferencesStore();

  const customizedSettingPresets = useCustomizeSettingsStore(
    (state) => state.presets,
  );
  const customizedSettingActivePreset = useCustomizeSettingsStore(
    (state) => state.activePreset,
  );
  const currentThemeStyle =
    customizedSettingPresets[customizedSettingActivePreset].themeSetting ||
    "original";

  const setIsExternal = useTrackUserEventStore((state) => state.setIsExternal);
  const { mutate: trackUserEvent } = useTrackUserEvent("wallet_tracker");

  return (
    <div
      onClick={() => {
        router.push(tokenUrl);
        setIsExternal(false);
        trackUserEvent({ mint: tracker?.mint || "" });
        prefetchChart(queryClient, tracker.mint);
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsExternal(false);
        trackUserEvent({ mint: tracker?.mint || "" });
        window.open(tokenUrl, "_blank");
      }}
      className={cn("relative cursor-pointer pb-2 xl:pb-0")}
    >
      <div
        style={{
          animation: showAnimation
            ? "walletTrackerGlowAndFade 2s ease-in-out forwards"
            : "none",
          display: isNew ? "block" : "none",
        }}
        className="absolute left-0 top-0 z-10 h-full w-full bg-[linear-gradient(150deg,#8b3da180,45%,#e278ff,55%,#8b3da180)] bg-[size:200%_100%]"
      ></div>
      <div
        className={cn(
          "relative z-10 flex-shrink-0 items-center overflow-hidden from-background to-background-1",
          type === "buy"
            ? "bg-success/5 hover:bg-success/10"
            : "bg-destructive/5 hover:bg-destructive/10",
          actionResponsive && "overflow-visible",
          responsiveBreakpoint === 1280
            ? "border-border max-xl:rounded-[8px]"
            : "border-border max-md:rounded-[8px]",
          responsiveBreakpoint === 1280
            ? "transition-color border duration-300 ease-out xl:flex xl:min-w-max xl:border-0 xl:pl-2 xl:pr-2"
            : "transition-color border duration-300 ease-out md:flex md:min-w-max md:border-0 md:pl-2 md:pr-2",
        )}
      >
        {/* DESKTOP */}
        {width! >= responsiveBreakpoint && (
          <div
            className={cn(
              responsiveBreakpoint === 1280
                ? "relative hidden h-[40px] w-full min-w-max items-center py-2 xl:flex"
                : "relative hidden h-[40px] w-full min-w-max items-center py-2 md:flex",
            )}
            onMouseEnter={() => setIsHover(true)}
            onMouseLeave={() => setIsHover(false)}
          >
            {/* avatar */}
            <div
              className={cn(
                "flex h-full w-full items-center",
                snappedSide === "none" && "min-w-[340px]",
                popUpResponsive ? "min-w-[115px]" : "min-w-[250px]",
                size.width > 800 && "min-w-[340px]",
                size.width < 500 && snappedSide !== "none" && "min-w-[130px]",
              )}
              style={{
                minWidth:
                  size.width < 500 ? `size ${size.width / 3 + 5}px` : "",
              }}
            >
              <div className="flex w-full items-center gap-x-1">
                <div className="flex items-center gap-3">
                  <AvatarHighlightWrapper
                    size={36}
                    walletHighlights={walletHighlights}
                  >
                    <AvatarWithBadges
                      classNameParent={cn(
                        "border-1 relative flex aspect-square size-12 lg:size-[32px] flex-shrink-0 items-center justify-center rounded-full border border-[#DF74FF]/30 bg-border/0",
                        popUpResponsive && "lg:size-[32px]",
                      )}
                      src={tracker?.image}
                      symbol={tracker?.symbol}
                      alt={`${tracker?.name} Image`}
                      rightType={getRightBadgeType(
                        tracker?.dex,
                        tracker?.launchpad,
                      )}
                      handleGoogleLensSearch={(e) =>
                        handleGoogleLensSearch(e, tracker.image)
                      }
                      size="lg"
                      rightClassName="size-[16px] -right-[1px] -bottom-[1px]"
                      leftClassName="size-[16px] -left-[1px] -bottom-[1px]"
                    />
                  </AvatarHighlightWrapper>
                </div>

                <div className="flex flex-col items-start">
                  <div className="flex items-center gap-x-2">
                    <div className="flex items-center gap-x-2">
                      <div
                        className="relative z-10 cursor-pointer text-nowrap font-geistSemiBold text-xs"
                        style={{
                          color: colors[ColorType.TOKEN],
                        }}
                      >
                        {truncateString(
                          tracker.symbol,
                          snappedSide === "none"
                            ? 9
                            : Math.floor((size.width - 220) / 20),
                        )}
                      </div>

                      {!popUpResponsive && (
                        <span className="text-nowrap text-xs lowercase leading-3 text-fontColorSecondary">
                          {truncateString(
                            tracker.name,
                            size.width <= 800 ? 25 : 10,
                          )}
                        </span>
                      )}
                    </div>

                    {size.width > 800 && (
                      <div className="-mt-0.5 flex items-center gap-x-1">
                        <span className="inline-block text-nowrap text-xs text-fontColorSecondary">
                          {truncateAddress(tracker.mint)}
                        </span>
                        <Copy
                          value={tracker.mint}
                          dataDetail={tracker}
                          withAnimation={false}
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-x-[3px]">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex h-[12.67px] items-center">
                            <TimeDifference
                              isDayOnly={variant === "cupsey-snap"}
                              created={tracker?.timestamp}
                              className="inline-block h-[12.67px]"
                              shortJustNow
                            />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="z-[2000]">
                          <p>Token Last Bought</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    {Boolean(tracker?.createdAt) && tracker?.createdAt > 0 && (
                      <>
                        <span className="text-[11px] text-white">•</span>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex h-[12.67px] items-center">
                                <TimeDifference
                                  isDayOnly={variant === "cupsey-snap"}
                                  created={tracker?.createdAt}
                                  className="inline-block h-[12.67px] !text-success"
                                  shortJustNow
                                />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="z-[2000]">
                              <p>Token Age</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Wallet Name */}
            <div
              className={cn(
                "relative z-10 flex h-full w-full items-center",
                size.width < 400 && "min-w-[85px]",
                size.width >= 400 && size.width < 500 && "min-w-[100px]",
                size.width >= 500 && "min-w-[125px]",
              )}
            >
              <AddressWithEmojis
                address={(() => {
                  const walletName = trackedWalletAdditionalInfo?.name || "";
                  const shouldTruncate =
                    size.width < 500 ||
                    (size.width < 1050 && walletName.length > 10);
                  return shouldTruncate
                    ? truncateString(
                        walletName,
                        variant === "cupsey-snap"
                          ? 6
                          : popUpResponsive
                            ? 8
                            : 10,
                      )
                    : truncateString(
                        walletName,
                        variant === "cupsey-snap"
                          ? 6
                          : Math.floor((size.width - 330) / 40),
                      );
                })()}
                fullAddress={trackedWalletAdditionalInfo?.address}
                className="!font-geistRegular text-sm"
                trackedWalletIcon={trackedWalletAdditionalInfo?.emoji}
                buy={tracker.type === "buy" ? true : false}
                stripClassname="!-bottom-0.5"
                isWithLink
                emojis={[]}
              />
            </div>

            {/* Amount */}
            <div
              className={cn(
                "flex h-full w-full items-center",
                size.width <= 400 && "min-w-[95px]",
                size.width >= 470 && size.width < 530 && "min-w-[135px]",
                size.width >= 530 ? "min-w-[140px]" : "min-w-[85px]",
                variant === "cupsey-snap" && "min-w-[55px]",
                "pl-2",
              )}
            >
              <div className="flex items-center">
                {/* <div className="relative aspect-square h-4 w-4 flex-shrink-0">
                  <CachedImage
                    src={
                      amountType === "USDC"
                        ? "/icons/usdc-colored.svg"
                        : "/icons/solana-sq.svg"
                    }
                    alt="Solana SQ Icon"
                    fill
                    quality={100}
                    className="object-contain"
                  />
                </div> */}
                {amountType === "USDC" ? (
                  <BlueUSDCIconSVG />
                ) : (
                  <SolanaIconSVG />
                )}
                <span
                  className={cn(
                    "inline-block text-nowrap font-geistSemiBold text-xs",
                  )}
                  style={{
                    color:
                      currentThemeStyle === "cupsey"
                        ? type === "sell"
                          ? defaultColors[ColorType.AMOUNT_SELL]
                          : defaultColors[ColorType.AMOUNT_BUY]
                        : type === "sell"
                          ? colors[ColorType.AMOUNT_SELL]
                          : colors[ColorType.AMOUNT_BUY],
                  }}
                >
                  {amountType === "USDC"
                    ? formatAmountDollar(
                        Number(tracker.baseAmount) * globalSolPrice,
                      )
                    : formatAmountWithoutLeadingZero(
                        Number(tracker.baseAmount),
                        2,
                        2,
                      )}
                </span>
              </div>
            </div>

            {/* Market cap */}
            <div
              className={cn(
                "flex h-full w-full min-w-[65px] flex-col justify-center",
                mode === "footer" ? "max-w-[135px]" : "max-w-[90px]",
              )}
            >
              <span
                className={cn("inline-block text-nowrap text-xs")}
                style={{
                  color:
                    currentThemeStyle === "cupsey"
                      ? type === "sell"
                        ? defaultColors[ColorType.MARKET_CAP_SELL]
                        : defaultColors[ColorType.MARKET_CAP_BUY]
                      : type === "sell"
                        ? colors[ColorType.MARKET_CAP_SELL]
                        : colors[ColorType.MARKET_CAP_BUY],
                }}
              >
                {formatAmountDollar(Number(tracker.marketCap))}
              </span>
            </div>

            {/* Action */}
            <div
              className={cn(
                "flex h-full w-full items-center",
                actionResponsive ? "justify-end" : "justify-start",
                // Dynamically adjust width: show button fully on hover, collapse when not hovered
                showAction
                  ? actionResponsive
                    ? "min-w-[42px] max-w-[42px]"
                    : "w-full min-w-[90px]"
                  : "min-w-0 max-w-0",
                actionResponsive && `absolute right-0 top-0 justify-end`,
                variant === "cupsey-snap" && "right-0 p-0",
                !showAction && actionResponsive && "overflow-hidden",
              )}
              style={
                variant === "cupsey-snap"
                  ? {
                      width: showAction ? `${dynamicChWidth}px` : 0,
                      minWidth: showAction ? `${dynamicChWidth}px` : 0,
                      maxWidth: showAction ? `${dynamicChWidth}px` : 0,
                      right: showAction ? "12px" : "0px",
                    }
                  : undefined
              }
            >
              {/* Gradient */}
              <div
                style={{
                  width: size?.width * (85 / 100),
                  display: actionResponsive ? "block" : "none",
                }}
                className={cn(
                  "absolute top-0 z-0 h-full bg-gradient-to-l from-shadeTableHover/90 from-[30%] to-transparent",
                  size?.width < 400 ? "right-0" : "-right-2",
                )}
              ></div>

              <div
                id={
                  isFirst ? "wallet-tracker-quick-buy-button-first" : undefined
                }
                className={cn(
                  "relative z-20 flex items-center gap-x-2",
                  size?.width < 400 ? "pr-3.5" : "pr-0",
                )}
              >
                <QuickBuyButton
                  module="wallet_tracker"
                  mintAddress={tracker.mint}
                  variant="footer-wallet-tracker"
                  className={cn("hover:bg-shadeTableHover")}
                />
              </div>
            </div>
          </div>
        )}

        {/* MOBILE */}
        {width! < responsiveBreakpoint && (
          <div
            className={cn(
              responsiveBreakpoint === 1280
                ? "flex w-full flex-col xl:hidden"
                : "flex w-full flex-col md:hidden",
            )}
          >
            {/* Header */}
            <div
              className={cn(
                "relative flex h-8 w-full items-center justify-between bg-white/[4%] px-3 py-5",
                actionResponsive ? "overflow-visible" : "overflow-hidden",
              )}
            >
              <div className="relative z-20 flex items-center gap-x-2">
                <AvatarHighlightWrapper
                  size={34}
                  walletHighlights={walletHighlights}
                >
                  <AvatarWithBadges
                    classNameParent="border-1 relative flex aspect-square flex-shrink-0 items-center justify-center rounded-full border border-[#DF74FF]/30 bg-border/0"
                    src={tracker?.image}
                    symbol={tracker?.symbol}
                    alt={`${tracker?.name} Image`}
                    rightType={getRightBadgeType(
                      tracker?.dex,
                      tracker?.launchpad,
                    )}
                    handleGoogleLensSearch={(e) =>
                      handleGoogleLensSearch(e, tracker.image)
                    }
                    size="xs"
                  />
                </AvatarHighlightWrapper>

                <div className="flex items-center gap-x-1">
                  <div className="cursor-pointer text-nowrap font-geistSemiBold text-sm text-fontColorPrimary">
                    {truncateString(tracker.symbol, 6)}
                  </div>
                  <span className="text-nowrap text-xs lowercase leading-3 text-fontColorSecondary">
                    {truncateString(tracker.name, 8)}
                  </span>
                </div>

                <Copy value={tracker.mint} withAnimation={false} />
              </div>

              <div className="relative z-20 flex items-center gap-x-2">
                <TimeDifference
                  isDayOnly={variant === "cupsey-snap"}
                  created={tracker?.timestamp}
                  className="text-fontColorSecondary"
                />

                {(tracker.twitter || tracker.telegram || tracker.website) && (
                  <Separator
                    color="#202037"
                    orientation="vertical"
                    unit="fixed"
                    fixedHeight={18}
                  />
                )}

                {(tracker.twitter || tracker.telegram || tracker.website) && (
                  <div className="flex items-center gap-x-1">
                    {tracker.twitter && (
                      <SocialLinkButton
                        href={tracker.twitter}
                        icon="x"
                        label="Twitter"
                        size="sm"
                      />
                    )}
                    {tracker.telegram && (
                      <SocialLinkButton
                        href={tracker.telegram}
                        icon="telegram"
                        label="Telegram"
                        size="sm"
                      />
                    )}
                    {tracker.website && (
                      <SocialLinkButton
                        href={tracker.website}
                        icon="website"
                        label="Website"
                        size="sm"
                      />
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="relative flex w-full flex-col">
              <div className="flex w-full items-start justify-between px-2 py-3">
                {/* Type */}
                <div className="flex flex-col gap-y-0.5">
                  <span className="whitespace-nowrap text-xs text-fontColorSecondary">
                    Type
                  </span>
                  <span
                    className={cn(
                      "inline-block text-nowrap font-geistSemiBold text-xs",
                      type === "sell" ? "text-destructive" : "text-success",
                    )}
                  >
                    {type[0].toUpperCase() + type.slice(1)}
                  </span>
                </div>

                {/* Amount */}
                <div className="flex flex-col gap-y-0.5">
                  <span className="text-xs text-fontColorSecondary">
                    Amount
                  </span>
                  <div className="flex flex-col">
                    <span className="flex items-center gap-1 text-xs text-fontColorPrimary">
                      {/* <div className="relative -mt-[1px] aspect-square h-4 w-4 flex-shrink-0">
                        <CachedImage
                          src={
                            amountType === "USDC"
                              ? "/icons/usdc-colored.svg"
                              : "/icons/solana-sq.svg"
                          }
                          alt="Solana SQ Icon"
                          fill
                          quality={100}
                          className="object-contain"
                        />
                      </div> */}
                      <div className="relative -mt-[1px] aspect-square h-4 w-4 flex-shrink-0">
                        {amountType === "USDC" ? (
                          <BlueUSDCIconSVG />
                        ) : (
                          <SolanaIconSVG />
                        )}
                      </div>
                      <span
                        className={cn(
                          "inline-block text-nowrap font-geistSemiBold text-xs",
                          type === "sell" ? "text-destructive" : "text-success",
                        )}
                      >
                        {amountType === "USDC"
                          ? formatAmountDollar(
                              Number(tracker.baseAmount) * globalSolPrice,
                            )
                          : formatAmountWithoutLeadingZero(
                              Number(tracker.baseAmount),
                              2,
                              2,
                            )}
                      </span>
                    </span>
                    <div className="flex items-center gap-x-1">
                      <span
                        className={cn(
                          "inline-block text-nowrap text-xs text-fontColorSecondary",
                          type === "sell" ? "text-destructive" : "text-success",
                        )}
                      >
                        {formatAmount(tracker.tokenAmount, 2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Market Cap */}
                <div className="flex flex-col gap-y-0.5">
                  <span className="whitespace-nowrap text-xs text-fontColorSecondary">
                    Market cap
                  </span>
                  <span
                    className={cn(
                      "inline-block text-nowrap font-geistSemiBold text-xs",
                      type === "sell" ? "text-destructive" : "text-success",
                    )}
                  >
                    {formatAmountDollar(Number(tracker.marketCap))}
                  </span>
                </div>

                {/* TXNS */}
                {/* <div className="flex flex-col gap-y-0.5">
                  <span className="text-xs text-fontColorSecondary">TXNS</span>
                  <div className="flex flex-col">
                    <span className="inline-block text-nowrap text-xs text-fontColorPrimary md:font-geistSemiBold">
                      {formatAmount(tracker.buys + tracker.sells, 2)}
                    </span>
                    <span className="inline-block text-nowrap text-xs text-fontColorSecondary">
                      <span className="text-success">
                        {formatAmount(tracker.buys, 2)}
                      </span>
                      <span>/</span>
                      <span className="text-destructive">
                        {formatAmount(tracker.sells, 2)}
                      </span>
                    </span>
                  </div>
                </div> */}

                {/* Wallet */}
                <div className="flex flex-col gap-y-0.5">
                  <span className="text-xs text-fontColorSecondary">
                    Wallet Name
                  </span>

                  <AddressWithEmojis
                    address={truncateString(
                      trackedWalletAdditionalInfo?.name || "",
                      12,
                    )}
                    fullAddress={trackedWalletAdditionalInfo?.address}
                    className="!font-geistRegular text-sm"
                    emojis={[]}
                    trackedWalletIcon={trackedWalletAdditionalInfo?.emoji}
                    buy={tracker.type === "buy" ? true : false}
                    stripClassname="!-bottom-0.5"
                    isWithLink
                  />
                </div>
              </div>

              <Separator color="#202037" />

              {/* BC & Actions */}
              <div className="flex h-[42px] w-full items-center justify-between p-2">
                <div className="flex h-full w-full max-w-[200px] flex-col items-start justify-center gap-y-1">
                  <div className="flex items-center gap-x-1">
                    <div className="flex items-center gap-x-1">
                      <span className="inline-block text-nowrap font-geistSemiBold text-xs text-fontColorPrimary">
                        {formatAmountWithoutLeadingZero(
                          Number(tracker?.balanceNow),
                        )}
                      </span>
                      <span className="inline-block text-nowrap font-geistSemiBold text-xs text-fontColorPrimary">
                        of
                      </span>
                      <span className="inline-block text-nowrap font-geistSemiBold text-xs text-fontColorPrimary">
                        {formatAmountWithoutLeadingZero(
                          Number(tracker?.balanceTotal),
                        )}
                      </span>
                    </div>
                    <span className="flex h-[16px] items-center justify-center text-nowrap rounded-full bg-white/[8%] px-1 py-0.5 font-geistRegular text-xs text-fontColorSecondary">
                      {formatPercentage(tracker?.balancePercentage * 100, 7)}
                    </span>
                  </div>

                  <GradientProgressBar
                    bondingCurveProgress={Number(
                      tracker?.balancePercentage * 100,
                    )}
                    className="h-[4px]"
                  />
                </div>

                <div className="flex items-center justify-end">
                  <div
                    id={
                      isFirst
                        ? "wallet-tracker-quick-buy-button-first"
                        : undefined
                    }
                  >
                    <QuickBuyButton
                      module="wallet_tracker"
                      mintAddress={tracker.mint}
                      variant="footer-wallet-tracker"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
