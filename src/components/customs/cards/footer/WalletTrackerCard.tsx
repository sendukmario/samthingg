"use client";

// ######## Libraries 📦 & Hooks 🪝 ########
import { useState, useCallback, useEffect, useMemo, memo } from "react";
import { useWalletTrackerStore } from "@/stores/footer/use-wallet-tracker.store";
import { useSolPriceMessageStore } from "@/stores/use-solprice-message.store";
import { useRouter } from "next/navigation";
import { useTrackUserEvent } from "@/hooks/use-track-event";
import { useTrackUserEventStore } from "@/stores/use-track-user-event.store";
// ######## Components 🧩 ########
import Copy from "@/components/customs/Copy";
import Separator from "@/components/customs/Separator";
import QuickBuyButton from "@/components/customs/buttons/QuickBuyButton";
import SellBuyBadge from "@/components/customs/SellBuyBadge";
import AvatarWithBadges, {
  getRightBadgeType,
} from "@/components/customs/AvatarWithBadges";
import AddressWithEmojis from "@/components/customs/AddressWithEmojis";
import SocialLinkButton from "@/components/customs/buttons/SocialLinkButton";
import GradientProgressBar from "@/components/customs/GradientProgressBar";
import TimeDifference from "../TimeDifference";
import {
  SolanaIconSVG,
  BlueUSDCIconSVG,
  TokenIconSVG,
} from "@/components/customs/ScalableVectorGraphics";
// ######## Utils & Helpers 🤝 ########
import { truncateAddress } from "@/utils/truncateAddress";
import { cn } from "@/libraries/utils";
import {
  formatAmount,
  formatAmountDollar,
  formatAmountWithoutLeadingZero,
  formatPrice,
} from "@/utils/formatAmount";
import { truncateString } from "@/utils/truncateString";
// ######## Types 🗨️ ########
import { WalletTracker } from "@/apis/rest/wallet-tracker";
import { usePopupStore, WindowName } from "@/stores/use-popup-state.store";
import { CachedImage } from "../../CachedImage";
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
  TooltipProvider,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatPercentage } from "@/utils/formatPercentage";
interface Props {
  index: number;
  isFirst: boolean;
  tracker: WalletTracker;
  wallets: string[];
  type: "buy" | "sell";
  responsiveBreakpoint: 1280 | 768;
  variant?: "normal" | "pop-out";
  amountType?: SolUsdc;
  isSnapOpen?: boolean;
}

const WalletTrackerCard = ({
  index,
  isFirst,
  tracker,
  wallets,
  type,
  responsiveBreakpoint,
  variant = "normal",
  isSnapOpen = false,
}: Props) => {
  const amountType = useWalletTrackerFilterStore((state) => state.amountType);
  const remainingType = useWalletTrackerFilterStore(
    (state) => state.remainingType,
  );
  const remainingScreenWidth = usePopupStore(
    (state) => state.remainingScreenWidth,
  );
  const trackedWallets = useWalletTrackerStore((state) => state.trackedWallets);
  const trackedWalletAdditionalInfo = (trackedWallets || []).find(
    (tw) => tw.address === tracker.walletAddress,
  );

  const solPrice = useSolPriceMessageStore((state) => state.messages.price);

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

  // const { walletTrackerSize, walletTrackerModalMode } =
  //   useWalletTrackerLockedStore();
  // const popUpResponsive =
  //   walletTrackerSize.width < 770 && walletTrackerModalMode === "locked";

  const { popups } = usePopupStore();
  const windowName: WindowName = "wallet_tracker";
  const walletTracker = (popups || []).find(
    (value) => value.name === windowName,
  )!;
  const { size, mode } = walletTracker;
  const popUpResponsive = size.width < 770 && mode !== "footer";

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

  const renderImage = useMemo(() => {
    return (
      <>
        {tracker?.image && remainingType === "COIN" ? (
          <div className="relative aspect-auto size-4 flex-shrink-0">
            <CachedImage
              src={tracker?.image}
              alt="Token Icon"
              fill
              quality={100}
              className="rounded-full object-contain"
            />
          </div>
        ) : remainingType === "COIN" ? (
          <TokenIconSVG className="h-5 w-5" />
        ) : (
          <SolanaIconSVG />
        )}
      </>
    );
  }, [tracker?.image, remainingType]);

  const setIsExternal = useTrackUserEventStore((state) => state.setIsExternal);
  const { mutate: trackUserEvent } = useTrackUserEvent("wallet_tracker");

  return (
    <div
      onClick={() => {
        setIsExternal(false);
        trackUserEvent({ mint: tracker?.mint || "" });
        prefetchChart(queryClient, tracker.mint);
        router.push(tokenUrl);
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsExternal(false);
        trackUserEvent({ mint: tracker?.mint || "" });
        window.open(tokenUrl, "_blank");
      }}
      className={cn(
        "min-h-2 cursor-pointer pb-2 xl:pb-0",
        isSnapOpen && "mb-2 pb-2",
      )}
    >
      <div
        className={cn(
          "transition-color flex-shrink-0 items-center overflow-hidden from-background to-background-1 duration-300 ease-out",
          tracker.type === "buy"
            ? "bg-success/5 hover:bg-success/10"
            : "bg-destructive/5 hover:bg-destructive/10",
          remainingScreenWidth! <= responsiveBreakpoint &&
            "bg-shadeTable hover:bg-shadeTableHover",
          // responsiveBreakpoint === 1280
          //   ? "border-border bg-amber-300 max-xl:rounded-[8px]"
          //   : "border-border bg-red-500 max-md:rounded-[8px]",
          // responsiveBreakpoint === 1280
          //   ? "transition-color border duration-300 ease-out xl:border-0"
          //   : "transition-color border duration-300 ease-out md:border-0",
          isSnapOpen && "rounded-[8px] !border border-border",
        )}
      >
        {/* DESKTOP - Normal View */}
        {remainingScreenWidth! >= responsiveBreakpoint &&
          variant !== "pop-out" &&
          !isSnapOpen && (
            <div
              className={cn(
                "relative",
                responsiveBreakpoint === 1280
                  ? "hidden h-[88px] w-full py-2 xl:block"
                  : "hidden h-[88px] w-full py-2 md:block",
                "pl-4 pr-2",
              )}
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
              <div className="absolute left-0 top-0 z-10 h-full w-full p-[1px]">
                {/* <div
                  className={cn(
                    "h-full w-full",
                    index % 2 === 0 ? "bg-transparent" : "bg-shadeTable",
                  )}
                ></div> */}
              </div>

              <div className="relative z-20 flex items-center">
                {/* Token Column */}
                <div className="flex h-full w-[18%] min-w-[180px] items-start">
                  <div className="flex items-center gap-x-3.5">
                    <div className="flex flex-col items-center gap-y-0.5">
                      <AvatarHighlightWrapper
                        size={58}
                        walletHighlights={walletHighlights}
                      >
                        <AvatarWithBadges
                          classNameParent="border-1 relative flex aspect-square h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border border-[#DF74FF]/30 bg-border/0 lg:size-[48px]"
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

                      <div className="-mt-1 flex items-center gap-x-[3px]">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex h-[12.67px] items-center">
                                <TimeDifference
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

                        {Boolean(tracker?.createdAt) &&
                          tracker?.createdAt > 0 && (
                            <>
                              <span className="text-[11px] leading-[0] text-white">
                                •
                              </span>

                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex h-[12.67px] items-center">
                                      <TimeDifference
                                        created={tracker?.createdAt}
                                        className="inline-block h-[12.67px] !text-success"
                                        shortJustNow
                                      />
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent
                                    side="bottom"
                                    className="z-[2000]"
                                  >
                                    <p>Token Age</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </>
                          )}
                      </div>
                    </div>

                    <div className="flex flex-col items-start gap-y-0.5">
                      <div className="flex items-center gap-x-1">
                        <div className="cursor-pointer text-nowrap font-geistSemiBold text-sm text-fontColorPrimary">
                          {truncateString(tracker.symbol, 6)}
                        </div>
                        <span className="text-nowrap text-xs lowercase leading-3 text-fontColorSecondary">
                          {truncateString(tracker.name, 5)}
                        </span>
                      </div>

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

                      <div className="flex items-center gap-x-1">
                        {tracker?.twitter && (
                          <SocialLinkButton
                            href={tracker?.twitter}
                            icon="x"
                            label="Twitter"
                            size="sm"
                          />
                        )}
                        {tracker?.telegram && (
                          <SocialLinkButton
                            href={tracker?.telegram}
                            icon="telegram"
                            label="Telegram"
                            size="sm"
                          />
                        )}
                        {tracker?.website && (
                          <SocialLinkButton
                            href={tracker?.website}
                            icon="website"
                            label="Website"
                            size="sm"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Type Column */}
                <div className="flex h-full w-[6%] min-w-[55px] items-center">
                  <SellBuyBadge type={type} />
                </div>

                {/* Amount Column */}
                <div
                  className={cn(
                    "flex h-full w-[13%] items-center",
                    "min-w-[140px] xlplus:min-w-[165px]",
                  )}
                >
                  <div className="flex w-fit flex-col justify-center">
                    <div className="flex items-center gap-x-1">
                      {/* <div className="relative aspect-square h-4 w-4 flex-shrink-0">
                        <CachedImage
                          src={
                            amountType === "USDC"
                              ? "/icons/usdc-colored.svg"
                              : "/icons/solana-sq.svg"
                          }
                          alt="Amount Icon"
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
                          type === "sell" ? "text-destructive" : "text-success",
                        )}
                      >
                        {amountType === "USDC"
                          ? formatAmountDollar(
                              Number(tracker.baseAmount) * solPrice,
                            )
                          : formatAmountWithoutLeadingZero(
                              Number(tracker.baseAmount),
                              2,
                              2,
                            )}
                      </span>
                    </div>
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

                {/* Market Cap Column */}
                <div className="flex h-full w-[12%] min-w-[110px] items-center">
                  <div className="flex w-fit flex-col justify-center">
                    <div className="flex items-center gap-x-1">
                      <span
                        className={cn(
                          "inline-block text-nowrap text-xs text-fontColorPrimary",
                          type === "sell" ? "text-destructive" : "text-success",
                        )}
                      >
                        {formatAmountDollar(Number(tracker.marketCap))}
                      </span>
                    </div>
                  </div>
                </div>

                {/* TXNS Column */}
                {/* <div className="flex h-full w-[9%] min-w-[60px] items-center"> */}
                {/*   <div className="flex flex-col"> */}
                {/*     <span className="inline-block text-nowrap font-geistSemiBold text-xs text-fontColorPrimary"> */}
                {/*       {formatAmount(tracker.buys + tracker.sells, 2)} */}
                {/*     </span> */}
                {/*     <span className="inline-block text-nowrap text-xs text-fontColorSecondary"> */}
                {/*       <span className="text-success"> */}
                {/*         {formatAmount(tracker.buys, 2)} */}
                {/*       </span> */}
                {/*       <span>/</span>{" "} */}
                {/*       <span className="text-destructive"> */}
                {/*         {formatAmount(tracker.sells, 2)} */}
                {/*       </span> */}
                {/*     </span> */}
                {/*   </div> */}
                {/* </div> */}

                {/* Wallet Name Column */}
                <div
                  className={cn(
                    "flex h-full w-[17%] items-center",
                    "min-w-[105px] xlplus:min-w-[135px]",
                  )}
                >
                  <AddressWithEmojis
                    address={truncateString(
                      trackedWalletAdditionalInfo?.name || "",
                      remainingScreenWidth! <= 1366 ? 10 : 14,
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

                {/* Remaining Column */}
                <div
                  className={cn(
                    "flex h-full flex-col items-start justify-center gap-y-1",
                    "w-[20%] xlplus:w-[21%]",
                  )}
                >
                  <div className="flex items-center gap-x-0.5">
                    <div className="flex items-center gap-x-1">
                      <div className="flex items-center justify-center gap-x-1 text-nowrap font-geistSemiBold text-sm text-fontColorPrimary">
                        {/* <div className="relative aspect-auto size-4 flex-shrink-0">
                          <CachedImage
                            src={
                              tracker?.image && remainingType === "COIN"
                                ? tracker.image
                                : !tracker?.image && remainingType === "COIN"
                                  ? "/icons/usdc.svg"
                                  : "/icons/solana-sq.svg"
                            }
                            alt={"Solana Icon"}
                            fill
                            quality={100}
                            className="rounded-full object-contain"
                          />
                        </div> */}
                        {renderImage}
                        {remainingType === "COIN"
                          ? formatAmountWithoutLeadingZero(
                              Number(tracker.balanceNow) *
                                Number(tracker?.priceUsd),
                              2,
                              2,
                            )
                          : formatAmountWithoutLeadingZero(
                              Number(tracker.balanceNow) *
                                Number(tracker?.price),
                              2,
                              2,
                            )}
                      </div>
                    </div>
                    <span className="flex h-[16px] items-center justify-center text-nowrap rounded-full px-1 py-0.5 font-geistRegular text-xs text-fontColorSecondary">
                      {formatPercentage(
                        tracker?.balancePercentage * 100,
                        7,
                        false,
                      )}
                    </span>
                  </div>

                  <GradientProgressBar
                    bondingCurveProgress={Number(
                      tracker?.balancePercentage * 100,
                    )}
                    className="h-[4px] w-[60%] xlplus:w-[80%]"
                  />
                </div>

                {/* Actions Column */}
                <div
                  className={cn(
                    "flex h-full items-center justify-start",
                    "w-[20%] xlplus:w-[9%]",
                  )}
                >
                  <div
                    id={
                      isFirst
                        ? "wallet-tracker-quick-buy-button-first"
                        : undefined
                    }
                    className="flex items-center gap-x-2"
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
          )}

        {/* DESKTOP - Pop-out View */}
        {variant === "pop-out" &&
          remainingScreenWidth! >= responsiveBreakpoint && (
            <div
              className={cn(
                responsiveBreakpoint === 1280
                  ? "hidden h-[80px] w-full py-2 xl:block"
                  : "hidden h-[80px] w-full py-2 md:block",
                "pl-4 pr-2",
              )}
            >
              <div className="flex items-center">
                {/* Token Column */}
                <div
                  className={cn(
                    "flex h-full items-center",
                    popUpResponsive ? "min-w-[130px]" : "",
                  )}
                >
                  <div className="flex items-center gap-x-3.5">
                    <div className="flex items-center gap-5">
                      <TimeDifference created={tracker?.timestamp} hoursOnly />

                      <AvatarHighlightWrapper
                        size={58}
                        walletHighlights={walletHighlights}
                      >
                        <AvatarWithBadges
                          classNameParent={cn(
                            "border-1 relative flex aspect-square h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border border-[#DF74FF]/30 bg-border/0 lg:size-[48px]",
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

                    <div className="flex items-center gap-x-2">
                      <div className="flex items-center gap-x-2">
                        <div className="cursor-pointer text-nowrap font-geistSemiBold text-sm text-fontColorPrimary">
                          {truncateString(tracker.symbol, 5)}
                        </div>

                        {!popUpResponsive && (
                          <span className="text-nowrap text-xs lowercase leading-3 text-fontColorSecondary">
                            {truncateString(tracker.name, 7)}
                          </span>
                        )}
                      </div>

                      {!popUpResponsive && (
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
                  </div>
                </div>

                {/* Wallet Name Column */}
                <div className="flex h-full items-center">
                  <AddressWithEmojis
                    address={truncateString(
                      trackedWalletAdditionalInfo?.name || "",
                      14,
                    )}
                    fullAddress={trackedWalletAdditionalInfo?.address}
                    className="!font-geistRegular text-sm"
                    trackedWalletIcon={trackedWalletAdditionalInfo?.emoji}
                    buy={tracker.type === "buy" ? true : false}
                    stripClassname="!-bottom-0.5"
                    isWithLink
                    emojis={[]}
                  />
                </div>

                {/* Amount Column */}
                <div className="flex h-full items-center">
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
                        type === "sell" ? "text-destructive" : "text-success",
                      )}
                    >
                      {amountType === "USDC"
                        ? formatAmountDollar(
                            Number(tracker.baseAmount) * solPrice,
                          )
                        : formatAmountWithoutLeadingZero(
                            Number(tracker.baseAmount),
                            2,
                            2,
                          )}
                    </span>
                  </div>
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
              <div className="flex h-full w-full min-w-[105px] items-center">
                <div className="flex w-fit flex-col justify-center">
                  <div className="flex items-center gap-x-1">
                    <span
                      className={cn(
                        "inline-block text-nowrap text-xs text-fontColorPrimary",
                        type === "sell" ? "text-destructive" : "text-success",
                      )}
                    >
                      {formatAmountDollar(Number(tracker.marketCap))}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex h-full w-full min-w-[80px] items-center">
                <div className="flex flex-col">
                  <span className="inline-block text-nowrap font-geistSemiBold text-xs text-fontColorPrimary">
                    {formatAmount(tracker.buys + tracker.sells, 2)}
                  </span>
                  <span className="inline-block text-nowrap text-xs text-fontColorSecondary">
                    <span className="text-success">
                      {formatAmount(tracker.buys, 2)}
                    </span>
                    <span>/</span>{" "}
                    <span className="text-destructive">
                      {formatAmount(tracker.sells, 2)}
                    </span>
                  </span>
                </div>
              </div>
              <div className="flex h-full w-full min-w-[120px] items-center">
                {/* <Popover>
          <PopoverTrigger> */}
                <AddressWithEmojis
                  address={truncateString(
                    trackedWalletAdditionalInfo?.name || "",
                    14,
                  )}
                  fullAddress={trackedWalletAdditionalInfo?.address}
                  className="!font-geistRegular text-sm"
                  emojis={[]}
                  trackedWalletIcon={trackedWalletAdditionalInfo?.emoji}
                  buy={tracker.type === "buy" ? true : false}
                  stripClassname="!-bottom-0.5"
                  isWithLink
                  // emojis={[
                  //   ...(tracker.animal.length > 0 ? [tracker.animal + ".svg"] : []),
                  //   ...(tracker.is_developer
                  //     ? [tracker.type === "buy" ? "db.svg" : "ds.svg"]
                  //     : []),
                  //   ...(tracker.is_insider ? ["white-anonymous.svg"] : []),
                  //   ...(tracker.is_sniper ? ["sniper.svg"] : []),
                  // ]}
                />
                {/* </PopoverTrigger>
          <WalletPopoverContent />
        </Popover> */}
              </div>
              <div
                className={cn(
                  responsiveBreakpoint === 1280
                    ? "hidden h-full w-full min-w-[180px] flex-col items-start justify-center gap-y-1 xl:flex"
                    : "hidden h-full w-full min-w-[180px] flex-col items-start justify-center gap-y-1 md:flex",
                )}
              >
                <div className="flex items-center gap-x-0.5">
                  <div className="flex items-center gap-x-1">
                    <div className="flex items-center justify-center gap-x-1 text-nowrap font-geistSemiBold text-sm text-fontColorPrimary">
                      {/* <div className="relative aspect-auto size-4 flex-shrink-0">
                      <CachedImage
                        src={
                          tracker?.image && remainingType === "COIN"
                            ? tracker.image
                            : !tracker?.image && remainingType === "COIN"
                              ? "/icons/usdc.svg"
                              : "/icons/solana-sq.svg"
                        }
                        alt={"Solana Icon"}
                        fill
                        quality={100}
                        className="rounded-full object-contain"
                      />
                    </div> */}
                      {renderImage}
                      {remainingType === "COIN"
                        ? formatAmountWithoutLeadingZero(
                            Number(tracker.balanceNow) *
                              Number(tracker?.priceUsd),
                            2,
                            2,
                          )
                        : formatAmountWithoutLeadingZero(
                            Number(tracker.balanceNow) * Number(tracker?.price),
                            2,
                            2,
                          )}
                    </div>
                    {/* <span className="inline-block text-nowrap font-geistSemiBold text-xs text-fontColorPrimary"> */}
                    {/*   {formatAmountWithoutLeadingZero( */}
                    {/*     Number(tracker?.balanceNow), */}
                    {/*   )} */}
                    {/* </span> */}
                    {/* <span className="inline-block text-nowrap font-geistSemiBold text-xs text-fontColorPrimary"> */}
                    {/*   of */}
                    {/* </span> */}
                    {/* <span className="inline-block text-nowrap font-geistSemiBold text-xs text-fontColorPrimary"> */}
                    {/*   {formatAmountWithoutLeadingZero( */}
                    {/*     Number(tracker?.balanceTotal), */}
                    {/*   )} */}
                    {/* </span> */}
                  </div>
                  <span className="flex h-[16px] items-center justify-center text-nowrap rounded-full px-1 py-0.5 font-geistRegular text-xs text-fontColorSecondary">
                    {formatPercentage(
                      tracker?.balancePercentage * 100,
                      7,
                      false,
                    )}
                  </span>
                </div>

                <GradientProgressBar
                  bondingCurveProgress={Number(
                    tracker?.balancePercentage * 100,
                  )}
                  className="h-[4px] max-w-[170px]"
                />
              </div>
              <div className="flex h-full w-full min-w-[90px] max-w-[90px] items-center justify-start">
                <div
                  id={
                    isFirst
                      ? "wallet-tracker-quick-buy-button-first"
                      : undefined
                  }
                  className="flex items-center gap-x-2"
                >
                  <QuickBuyButton
                    module="wallet_tracker"
                    mintAddress={tracker.mint}
                    variant="footer-wallet-tracker"
                  />
                </div>
              </div>
            </div>
          )}

        {variant === "pop-out" && (
          <div
            className={cn(
              responsiveBreakpoint === 1280
                ? "hidden h-[80px] w-full min-w-max items-center py-2 xl:flex"
                : "hidden h-[80px] w-full min-w-max items-center py-2 md:flex",
            )}
          >
            {/* avatar */}
            <div
              className={cn(
                "flex h-full w-full items-center",
                popUpResponsive ? "min-w-[130px]" : "min-w-[340px]",
              )}
            >
              <div className="flex items-center gap-x-3.5">
                <div className="flex items-center gap-5">
                  <TimeDifference created={tracker?.timestamp} hoursOnly />
                  <AvatarHighlightWrapper
                    size={popUpResponsive ? 42 : 58}
                    walletHighlights={walletHighlights}
                  >
                    <AvatarWithBadges
                      classNameParent={cn(
                        "border-1 relative flex aspect-square h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border border-[#DF74FF]/30 bg-border/0 lg:size-[48px]",
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

                <div className="flex items-center gap-x-2">
                  <div className="flex items-center gap-x-2">
                    <div className="cursor-pointer text-nowrap font-geistSemiBold text-sm text-fontColorPrimary">
                      {truncateString(tracker.symbol, 5)}
                    </div>

                    {!popUpResponsive && (
                      <span className="text-nowrap text-xs lowercase leading-3 text-fontColorSecondary">
                        {truncateString(tracker.name, 7)}
                      </span>
                    )}
                  </div>

                  {!popUpResponsive && (
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
              </div>
            </div>

            {/* address */}
            <div className="flex h-full w-full min-w-[120px] items-center">
              <AddressWithEmojis
                address={truncateString(
                  trackedWalletAdditionalInfo?.name || "",
                  14,
                )}
                fullAddress={trackedWalletAdditionalInfo?.address}
                className="!font-geistRegular text-sm"
                trackedWalletIcon={trackedWalletAdditionalInfo?.emoji}
                buy={tracker.type === "buy" ? true : false}
                stripClassname="!-bottom-0.5"
                isWithLink
                emojis={[]}
                // emojis={[
                //   ...(tracker.animal.length > 0 ? [tracker.animal + ".svg"] : []),
                //   ...(tracker.is_developer
                //     ? [tracker.type === "buy" ? "db.svg" : "ds.svg"]
                //     : []),
                //   ...(tracker.is_insider ? ["white-anonymous.svg"] : []),
                //   ...(tracker.is_sniper ? ["sniper.svg"] : []),
                // ]}
              />
            </div>

            {/* amount */}
            <div className="flex h-full w-full min-w-[85px] items-center">
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
                    "inline-block text-nowrap text-xs text-fontColorPrimary",
                    type === "sell" ? "text-destructive" : "text-success",
                  )}
                >
                  {amountType === "USDC"
                    ? formatPrice(Number(tracker.baseAmount) * solPrice)
                    : formatAmountWithoutLeadingZero(
                        Number(tracker.baseAmount),
                        2,
                        2,
                      )}
                </span>
              </div>

              {/* Actions Column */}
              <div className="flex h-full items-center justify-start">
                <div
                  id={
                    isFirst
                      ? "wallet-tracker-quick-buy-button-first"
                      : undefined
                  }
                  className="flex items-center gap-x-2"
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
        )}

        {/* MOBILE */}
        {(remainingScreenWidth! < responsiveBreakpoint || isSnapOpen) && (
          <div
            className={cn(
              responsiveBreakpoint === 1280
                ? isSnapOpen
                  ? "flex w-full flex-col"
                  : "flex w-full flex-col xl:hidden"
                : "flex w-full flex-col md:hidden",
            )}
          >
            {/* Header */}
            <div className="relative flex h-8 w-full items-center justify-between overflow-hidden bg-white/[4%] px-3 py-5">
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
                    rightClassName="-right-[1px] -bottom-[1px]"
                    leftClassName="-left-[1px] -bottom-[1px]"
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
                <div className="flex items-center gap-x-1">
                  <TimeDifference
                    created={tracker?.timestamp}
                    className="text-fontColorSecondary"
                  />

                  {Boolean(tracker?.createdAt) && tracker?.createdAt > 0 && (
                    <>
                      <span className="text-[11px] text-fontColorSecondary">
                        •
                      </span>

                      <TimeDifference
                        created={tracker?.createdAt}
                        className="!text-success"
                      />
                    </>
                  )}
                </div>

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
                              Number(tracker.baseAmount) * solPrice,
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
                {/* <div className="flex flex-col gap-y-0.5"> */}
                {/*   <span className="text-xs text-fontColorSecondary">TXNS</span> */}
                {/*   <div className="flex flex-col"> */}
                {/*     <span className="inline-block text-nowrap text-xs text-fontColorPrimary md:font-geistSemiBold"> */}
                {/*       {formatAmount(tracker.buys + tracker.sells, 2)} */}
                {/*     </span> */}
                {/*     <span className="inline-block text-nowrap text-xs text-fontColorSecondary"> */}
                {/*       <span className="text-success"> */}
                {/*         {formatAmount(tracker.buys, 2)} */}
                {/*       </span> */}
                {/*       <span>/</span> */}
                {/*       <span className="text-destructive"> */}
                {/*         {formatAmount(tracker.sells, 2)} */}
                {/*       </span> */}
                {/*     </span> */}
                {/*   </div> */}
                {/* </div> */}

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
                    // emojis={[
                    //   ...(tracker.animal.length > 0 ? [tracker.animal + ".svg"] : []),
                    //   ...(tracker.is_developer
                    //     ? [tracker.type === "buy" ? "db.svg" : "ds.svg"]
                    //     : []),
                    //   ...(tracker.is_insider ? ["white-anonymous.svg"] : []),
                    //   ...(tracker.is_sniper ? ["sniper.svg"] : []),
                    // ]}
                  />
                </div>
              </div>

              <Separator color="#202037" />

              {/* BC & Actions */}
              <div className="flex h-[42px] w-full items-center justify-between p-2">
                <div className="flex h-full w-full max-w-[200px] flex-col items-start justify-center gap-y-1">
                  <div className="flex items-center gap-x-1">
                    <div className="flex items-center gap-x-1">
                      <span className="flex items-center gap-1 text-nowrap font-geistSemiBold text-sm text-fontColorPrimary">
                        {/* <div className="relative aspect-auto size-4 flex-shrink-0">
                          <CachedImage
                            src={"/icons/solana-sq.svg"}
                            alt="Amount Icon"
                            fill
                            quality={100}
                            className="object-contain"
                          />
                        </div> */}
                        <SolanaIconSVG />
                        {remainingType === "COIN"
                          ? formatAmountWithoutLeadingZero(
                              Number(tracker.balanceNow) *
                                Number(tracker?.priceUsd),
                              2,
                              2,
                            )
                          : formatAmountWithoutLeadingZero(
                              Number(tracker.balanceNow) *
                                Number(tracker?.price),
                              2,
                              2,
                            )}
                      </span>
                      {/* <span className="inline-block text-nowrap font-geistSemiBold text-xs text-fontColorPrimary"> */}
                      {/*   of */}
                      {/* </span> */}
                      {/* <span className="inline-block text-nowrap font-geistSemiBold text-xs text-fontColorPrimary"> */}
                      {/*   {formatAmountWithoutLeadingZero( */}
                      {/*     Number(tracker?.balanceTotal), */}
                      {/*   )} */}
                      {/* </span> */}
                    </div>
                    <span className="flex h-[16px] items-center justify-center text-nowrap rounded-full bg-white/[8%] px-1 py-0.5 font-geistRegular text-xs text-fontColorSecondary">
                      {formatPercentage(
                        tracker?.balancePercentage * 100,
                        7,
                        false,
                      )}
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
};
export default memo(WalletTrackerCard);
