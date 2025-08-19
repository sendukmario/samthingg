"use client";

// ######## Libraries 📦 & Hooks 🪝 ########
import React, { useState, useMemo } from "react";
import { useUserWalletStore } from "@/stores/wallet/use-user-wallet.store";
import { useSolPriceMessageStore } from "@/stores/use-solprice-message.store";
import { useHoldingsMessageStore } from "@/stores/holdings/use-holdings-messages.store";
import { useRouter } from "nextjs-toploader/app";
import { useTrackUserEvent } from "@/hooks/use-track-event";
import { useTrackUserEventStore } from "@/stores/use-track-user-event.store";
import { motion } from "framer-motion";
// ######## Components 🧩 ########
import Image from "next/image";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getRightBadgeType } from "@/components/customs/AvatarWithBadges";
import Copy from "@/components/customs/Copy";
import HoldingsButtons from "@/components/customs/buttons/HoldingsButtons";
import AvatarWithBadges from "@/components/customs/AvatarWithBadges";
import SocialLinkButton from "@/components/customs/buttons/SocialLinkButton";
// ######## Utils & Helpers 🤝 ########
import { cn } from "@/libraries/utils";
import truncateCA from "@/utils/truncateCA";
import { truncateString } from "@/utils/truncateString";
import {
  formatAmountDollar,
  formatAmountWithoutLeadingZero,
} from "@/utils/formatAmount";
// ######## Types 🗨️ ########
import { HoldingsTransformedTokenData } from "@/types/ws-general";
import { useQueryClient } from "@tanstack/react-query";
import { prefetchChart } from "@/apis/rest/charts";
import { CachedImage } from "../CachedImage";
import {
  useWalletHighlightStore,
  type WalletWithColor,
} from "@/stores/wallets/use-wallet-highlight-colors.store";
import { AvatarHighlightWrapper } from "@/components/customs/AvatarHighlightWrapper";
import { getIsStrippedHoldingPreviewData } from "@/utils/getIsStrippedHoldingPreviewData";

const TokenInfo = React.memo(
  ({
    token,
    walletHighlights,
  }: {
    token: HoldingsTransformedTokenData["token"];
    walletHighlights: WalletWithColor[];
  }) => (
    <div className="flex items-center gap-x-4">
      <AvatarHighlightWrapper size={58} walletHighlights={walletHighlights}>
        <AvatarWithBadges
          classNameParent="border-1 relative flex aspect-square h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border border-[#DF74FF]/30 bg-border/0 backdrop-blur-lg lg:size-[48px]"
          src={token?.image}
          symbol={token?.symbol}
          alt={`${token?.name} Image`}
          rightType={getRightBadgeType(token?.dex, token?.launchpad)}
          rightClassName="size-4 -right-0.5 -bottom-0.5"
          size="md"
        />
      </AvatarHighlightWrapper>

      <div className="flex flex-col gap-y-0.5">
        <div className="flex items-center gap-x-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <h4 className="cursor-pointer text-nowrap font-geistSemiBold text-xs text-fontColorPrimary">
                  {truncateString(token?.name || "", 8)}
                </h4>
              </TooltipTrigger>
              <TooltipContent className="-mb-1 bg-[#202035] px-2 py-1 shadow-[0_4px_16px_#000000]">
                <p className="text-xs text-fontColorPrimary">
                  {token?.name || ""}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <span className="text-nowrap text-xs lowercase text-fontColorSecondary">
            {truncateString(token?.symbol || "", 6)}
          </span>
        </div>
        <div className="-mt-0.5 flex items-center gap-x-1">
          <span className="inline-block text-nowrap text-xs text-fontColorSecondary">
            {truncateCA(token?.mint || "", 10)}
          </span>
          <Copy
            value={token?.mint || ""}
            dataDetail={{
              mint: token?.mint,
              symbol: token?.symbol,
              name: token?.name,
              image: token?.image,
            }}
          />
        </div>
        <div className="flex items-center gap-x-1">
          {token?.twitter && (
            <SocialLinkButton href={token?.twitter} icon="x" label="Twitter" />
          )}
          {token?.telegram && (
            <SocialLinkButton
              href={token?.telegram}
              icon="telegram"
              label="Telegram"
            />
          )}
          {token?.website && (
            <SocialLinkButton
              href={token?.website}
              icon="website"
              label="Website"
            />
          )}
        </div>
      </div>
    </div>
  ),
);
TokenInfo.displayName = "TokenInfo";

const HoldingsCard = React.memo(
  ({
    index,
    data,
    isFirst = false,
    trackedWalletsOfToken,
  }: {
    index: number;
    data: HoldingsTransformedTokenData;
    isFirst?: boolean;
    trackedWalletsOfToken: Record<string, string[]>;
  }) => {
    const router = useRouter();

    const globalSolPrice = useSolPriceMessageStore(
      (state) => state.messages.price,
    );
    const chartPriceMessage = useHoldingsMessageStore(
      (state) => state.batchPriceMessage,
    );
    const selectedMultipleActiveWalletHoldings = useUserWalletStore(
      (state) => state.selectedMultipleActiveWalletHoldings,
    );

    const tokenUrl = useMemo(() => {
      if (!data?.token?.mint) return "#";

      const params = new URLSearchParams({
        symbol: data?.token?.symbol || "",
        name: data?.token?.name || "",
        image: data?.token?.image || "",
        dex: data?.token?.dex || "",
      });

      return `/token/${data?.token?.mint}?${params.toString()}`;
    }, [
      data?.token?.symbol,
      data?.token?.name,
      data?.token?.image,
      data?.token?.dex,
    ]);

    const [openWalletList, setOpenWalletList] = useState<boolean>(false);
    const handleOpenCloseWallet = (event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      setOpenWalletList((prev) => !prev);
    };

    const firstIndex = data.list.findIndex((item) =>
      (selectedMultipleActiveWalletHoldings || [])?.some(
        (wallet) => wallet.address === item.wallet,
      ),
    );

    const calculateTotals = useMemo(() => {
      let totalInvestedSol = 0;
      let totalSoldSol = 0;
      let totalCurrentValue = 0;

      data.list.forEach((item) => {
        const walletSelected = (
          selectedMultipleActiveWalletHoldings || []
        )?.some((wallet) => wallet.address === item.wallet);

        if (!walletSelected || !item.token) return;

        // Calculate invested amount
        const investedAmount = item.token.invested_base || 0;
        totalInvestedSol += investedAmount;

        // Calculate sold amount
        const soldAmount = item.token.sold_base || 0;
        totalSoldSol += soldAmount;

        // Calculate current holding value
        const currentBalance = item.token.balance || 0;
        const currentPrice =
          (chartPriceMessage || [])?.find(
            (m) => m.mint === item.token.token?.mint,
          )?.price_base ||
          item?.token?.price?.price_sol ||
          item?.token?.price?.price_base ||
          0;
        const currentValue = currentBalance * currentPrice;
        totalCurrentValue += currentValue;
      });

      // Calculate PnL
      const totalValue = totalSoldSol + totalCurrentValue;
      const pnl = totalValue - totalInvestedSol;
      const pnlPercentage =
        totalInvestedSol > 0 ? (pnl / totalInvestedSol) * 100 : 0;

      return {
        invested: totalInvestedSol,
        sold: totalSoldSol,
        pnl: pnl,
        pnlPercentage: pnlPercentage,
      };
    }, [data.list, selectedMultipleActiveWalletHoldings]);

    const firstWalletWithBalance = (data.list || [])?.find(
      (item) => item.token.balance > 0,
    );

    // Replace individual functions with memoized values
    const totalInvested = () => calculateTotals.invested;
    const totalSold = () => calculateTotals.sold;
    const totalPnL = () => calculateTotals.pnl;
    const totalPnLPercentage = () => calculateTotals.pnlPercentage;

    // const currentToken = data.list[0].token;

    // const walletColors = useWalletHighlightStore((state) => state.wallets);
    const walletHighlights = useMemo(() => {
      const walletsWithColor: WalletWithColor[] = [];
      const walletColors = useWalletHighlightStore.getState().wallets;

      const trackedWallets = trackedWalletsOfToken[data.token.mint] || [];
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
    }, [data.token.mint, trackedWalletsOfToken]);

    const queryClient = useQueryClient();
    // const { getApiResolution } = useTradingViewPreferencesStore()
    // let hoverTimeout: NodeJS.Timeout;

    const setIsExternal = useTrackUserEventStore(
      (state) => state.setIsExternal,
    );
    const { mutate: trackUserEvent } = useTrackUserEvent("holdings");

    return (
      <>
        <motion.div
          onClick={() => {
            setIsExternal(false);
            trackUserEvent({ mint: data?.token?.mint || "" });

            prefetchChart(queryClient, data.token.mint);
            // prefetchCandles(queryClient, {
            //   mint: data.token.mint,
            //   interval: getApiResolution(),
            //   currency: (
            //     (localStorage.getItem("chart_currency") as string) || "SOL"
            //   ).toLowerCase() as "sol" | "usd",
            //   initial: true,
            // });
            router.prefetch(tokenUrl);
            router.push(tokenUrl);
            // setTimeout(() => {
            //   prefetchCandles(data.token.mint);
            // }, 10);
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsExternal(false);
            trackUserEvent({ mint: data?.token?.mint || "" });
            window.open(tokenUrl, "_blank");
          }}
          layout
          animate={{
            height: "auto",
          }}
          transition={{ duration: 0 }}
          className={cn(
            "transition-color relative flex min-h-2 min-w-max cursor-pointer items-center border-b border-transparent px-4 py-4",
            "hover:bg-shadeTableHover hover:duration-200 hover:ease-out",
            openWalletList ? "border-border" : "",
            index % 2 === 0 ? "bg-transparent" : "bg-shadeTable",
          )}
        >
          <div className="h-full w-full min-w-[200px]">
            <TokenInfo token={data.token} walletHighlights={walletHighlights} />
          </div>

          <div className="flex h-full w-full min-w-[50px] items-center">
            <div className="flex w-full flex-col gap-y-3">
              <button
                id={isFirst ? "dropdown-wallets-holdings" : undefined}
                onClick={(e) => handleOpenCloseWallet(e)}
                className="flex h-5 w-fit cursor-pointer items-center gap-x-1 rounded-[26px] border border-border pl-2 pr-1"
              >
                <span className="inline-block font-geistSemiBold text-sm leading-[18px] text-fontColorPrimary">
                  {(() => {
                    let count = 0;

                    (selectedMultipleActiveWalletHoldings || [])?.forEach(
                      (wallet) => {
                        const isSelected = (data.list || []).some(
                          (list) => list.wallet === wallet.address,
                        );

                        if (isSelected) {
                          count++;
                        }
                      },
                    );

                    return count;
                  })()}
                </span>
                <div className="relative -mr-0.5 -mt-[1px] aspect-square h-5 w-5">
                  <Image
                    src="/icons/pink-chevron-down.png"
                    alt="Pink Chevron Arrow Icon"
                    fill
                    quality={100}
                    className={cn(
                      "object-contain duration-300",
                      openWalletList ? "rotate-180" : "rotate-0",
                    )}
                  />
                </div>
              </button>

              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{
                  height: openWalletList ? "auto" : "0",
                  opacity: openWalletList ? 1 : 0,
                }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="relative z-10 flex w-full flex-col gap-y-3 pl-1.5">
                  {(data.list || [])?.map((item) => {
                    const walletInfo = (
                      selectedMultipleActiveWalletHoldings || []
                    )?.find((wallet) => wallet.address === item.wallet);

                    const walletSelected = (
                      selectedMultipleActiveWalletHoldings || []
                    )?.some((wallet) => wallet.address === item.wallet);

                    if (!walletInfo || !walletSelected) return;

                    return (
                      <div
                        key={`wallet_${item.wallet}`}
                        className="flex flex-col gap-y-0.5"
                      >
                        <div className="flex items-center gap-x-[4px]">
                          <h4 className="text-nowrap font-geistSemiBold text-sm text-fontColorPrimary">
                            {walletInfo ? walletInfo.name : "SS"}
                          </h4>
                        </div>
                        <div className="flex items-center gap-x-1">
                          <span className="inline-block text-nowrap text-xs text-fontColorSecondary">
                            {truncateCA(item.wallet || "", 10)}
                          </span>
                          <Copy
                            value={item.wallet}
                            dataDetail={{
                              mint: data?.token?.mint,
                              symbol: data?.token?.symbol,
                              name: data?.token?.name,
                              image: data?.token?.image,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            </div>
          </div>

          {/* Invested */}
          <div className="flex h-full w-full min-w-[50px] items-center">
            <motion.div
              animate={{
                marginTop: openWalletList ? 32 : 0,
              }}
              transition={{ duration: 0.3 }}
              className="flex w-full flex-col justify-center"
            >
              {(data.list || [])?.map((item, index) => {
                const walletSelected = (
                  selectedMultipleActiveWalletHoldings || []
                )?.some((wallet) => wallet.address === item.wallet);

                if (!walletSelected) {
                  return null;
                }

                const renderContent = () => (
                  <div className="flex flex-col justify-center gap-y-1">
                    <div className="flex items-center gap-x-1">
                      <div className="relative aspect-auto h-[16px] w-[16px] flex-shrink-0">
                        <CachedImage
                          src={item?.token?.token?.is_usd ? "/icons/usdc.svg" : "/icons/solana-sq.svg"}
                          alt="Solana SQ Icon"
                          fill
                          quality={50}
                          className="object-contain"
                        />
                      </div>
                      <span className="inline-block text-nowrap font-geistSemiBold text-sm text-fontColorPrimary">
                        {getIsStrippedHoldingPreviewData(
                          item?.token?.invested_base?.toString(),
                          item?.token?.balance?.toString(),
                        )
                          ? "-"
                          : formatAmountWithoutLeadingZero(
                            Number(item?.token?.invested_base?.toString()),
                          )}
                      </span>
                    </div>
                    <span className="inline-block text-nowrap text-xs text-fontColorSecondary">
                      {getIsStrippedHoldingPreviewData(
                        item?.token?.invested_base?.toString(),
                        item?.token?.balance?.toString(),
                      )
                        ? "-"
                        : item?.token.invested_usd > 1
                          ? formatAmountDollar(
                            Number(item?.token?.invested_base?.toString())
                          )
                          : `$${formatAmountWithoutLeadingZero(Number(item?.token?.invested_base?.toString()) * (item?.token?.token?.is_usd ? 1 : globalSolPrice))}`}
                    </span>
                  </div>
                );

                if (index === firstIndex) {
                  return (
                    <div
                      key={`invested_${item.wallet}`}
                      className="flex flex-col justify-center gap-y-1"
                    >
                      {renderContent()}
                    </div>
                  );
                }

                return (
                  <motion.div
                    key={`invested_${item.wallet}`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{
                      height: openWalletList ? "auto" : "0",
                      opacity: openWalletList ? 1 : 0,
                    }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="relative z-10 flex w-full flex-col gap-y-3 pt-3">
                      {renderContent()}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>

          {/* Remaining */}
          <div className="relative flex h-full w-full min-w-[50px] items-center">
            <motion.div
              animate={{
                marginTop: openWalletList ? 32 : 0,
              }}
              transition={{ duration: 0.3 }}
              className="flex w-full flex-col justify-center"
            >
              {(data.list || [])?.map((item, index) => {
                const walletSelected = (
                  selectedMultipleActiveWalletHoldings || []
                )?.some((wallet) => wallet.address === item.wallet);

                if (!walletSelected) {
                  return null;
                }

                // const remainingSol =
                //   item?.token.balance * item?.token.price?.price_base;
                // const remainingUsd =
                //   item?.token.balance * item?.token.price?.price_usd;
                const priceBase =
                  (chartPriceMessage || [])?.find(
                    (m) => m.mint === item.token.token?.mint,
                  )?.price_base ||
                  item.token.price?.price_sol ||
                  item?.token?.price?.price_base ||
                  0;
                const priceUsd =
                  (chartPriceMessage || [])?.find(
                    (m) => m.mint === item.token.token?.mint,
                  )?.price_usd ||
                  item.token.price?.price_usd ||
                  0;

                const remainingSol = item?.token.balance * priceBase;
                const remainingUsd = remainingSol * (item?.token?.token?.is_usd ? 1 : globalSolPrice);

                const renderContent = () => (
                  <div className="flex flex-col justify-center gap-y-1">
                    <div className="flex items-center gap-x-1">
                      <div className="relative aspect-auto h-[16px] w-[16px] flex-shrink-0">
                        <CachedImage
                          src={item?.token?.token?.is_usd ? "/icons/usdc.svg" : "/icons/solana-sq.svg"}
                          alt="Solana SQ Icon"
                          fill
                          quality={50}
                          className="object-contain"
                        />
                      </div>
                      <span className="inline-block text-nowrap font-geistSemiBold text-sm text-fontColorPrimary">
                        {formatAmountWithoutLeadingZero(Number(remainingSol))}
                      </span>
                    </div>
                    <span className="inline-block text-nowrap text-xs text-fontColorSecondary">
                      {remainingUsd > 1
                        ? formatAmountDollar(Number(remainingUsd))
                        : `$${formatAmountWithoutLeadingZero(Number(remainingUsd))}`}
                    </span> 
                  </div>
                );

                if (index === firstIndex) {
                  return (
                    <div
                      key={`remaining_${item.wallet}`}
                      className="flex flex-col justify-center gap-y-1"
                    >
                      {renderContent()}
                    </div>
                  );
                }

                return (
                  <motion.div
                    key={`remaining_${item.wallet}`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{
                      height: openWalletList ? "auto" : "0",
                      opacity: openWalletList ? 1 : 0,
                    }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="relative z-10 flex w-full flex-col gap-y-3 pt-3">
                      {renderContent()}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>

          {/* Sold */}
          <div className="flex h-full w-full min-w-[50px] items-center">
            <motion.div
              animate={{
                marginTop: openWalletList ? 32 : 0,
              }}
              transition={{ duration: 0.3 }}
              className="flex w-full flex-col justify-center"
            >
              {(data.list || [])?.map((item, index) => {
                const walletSelected = (
                  selectedMultipleActiveWalletHoldings || []
                )?.some((wallet) => wallet.address === item.wallet);

                if (!walletSelected) {
                  return null;
                }

                // const priceBase =
                //   (chartPriceMessage || [])?.find(
                //     (m) => m.mint === item.token.token?.mint,
                //   )?.priceBase ||
                //   item.token.price?.price_base ||
                //   0;

                const soldBase = item?.token.sold_base;
                // const soldUsd = item?.token.soldBase * priceBase;
                const soldUsd = item?.token.sold_base * (item?.token?.token?.is_usd ? 1 : globalSolPrice);

                const renderContent = () => (
                  <div className="flex flex-col justify-center gap-y-1">
                    <div className="flex items-center gap-x-1">
                      <div className="relative aspect-auto h-[16px] w-[16px] flex-shrink-0">
                        <CachedImage
                          src={item?.token?.token?.is_usd ? "/icons/usdc.svg" : "/icons/solana-sq.svg"}
                          alt="Solana SQ Icon"
                          fill
                          quality={50}
                          className="object-contain"
                        />
                      </div>
                      <span className="inline-block text-nowrap font-geistSemiBold text-sm text-fontColorPrimary">
                        {getIsStrippedHoldingPreviewData(
                          item?.token?.sold_base +
                          Number(item?.token?.invested_base),
                          item?.token?.balance?.toString(),
                        )
                          ? "-"
                          : formatAmountWithoutLeadingZero(Number(soldBase))}
                      </span>
                    </div>
                    <span className="inline-block text-nowrap text-xs text-fontColorSecondary">
                      {getIsStrippedHoldingPreviewData(
                        Number(item?.token?.sold_base) +
                        Number(item?.token?.invested_base),
                        item?.token?.balance?.toString(),
                      )
                        ? "-"
                        : soldUsd > 1
                          ? formatAmountDollar(Number(soldUsd))
                          : `$${formatAmountWithoutLeadingZero(Number(soldUsd))}`}
                    </span>
                  </div>
                );

                if (index === firstIndex) {
                  return (
                    <div
                      key={`sold_${item.wallet}`}
                      className="flex flex-col justify-center gap-y-1"
                    >
                      {renderContent()}
                    </div>
                  );
                }

                return (
                  <motion.div
                    key={`sold_${item.wallet}`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{
                      height: openWalletList ? "auto" : "0",
                      opacity: openWalletList ? 1 : 0,
                    }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="relative z-10 flex w-full flex-col gap-y-3 pt-3">
                      {renderContent()}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>

          {/* P&L */}
          <div className="flex h-full w-full min-w-[50px] items-center">
            <motion.div
              animate={{
                marginTop: openWalletList ? 32 : 0,
              }}
              transition={{ duration: 0.3 }}
              className="flex w-full flex-col justify-center"
            >
              {(data.list || [])?.map((item, index) => {
                const walletSelected = (
                  selectedMultipleActiveWalletHoldings || []
                )?.some((wallet) => wallet.address === item.wallet);

                if (!walletSelected) {
                  return null;
                }

                const priceBase =
                  (chartPriceMessage || [])?.find(
                    (m) => m.mint === item.token.token?.mint,
                  )?.price_base ||
                  item.token.price?.price_sol ||
                  item?.token?.price?.price_base ||
                  0;

                const prevCalc =
                  item.token?.sold_base + item.token?.balance * priceBase;
                const pnlSol = prevCalc - item.token?.invested_base;
                const pnlUsd = pnlSol * (item?.token?.token?.is_usd ? 1 : globalSolPrice);
                const pnlPercentage = (pnlSol / item.token?.invested_base) * 100;

                const renderContent = () => (
                  <div className="flex flex-col justify-center gap-y-1">
                    <span
                      className={cn(
                        "inline-block text-nowrap font-geistSemiBold text-sm",
                        pnlPercentage > 0 ||
                          getIsStrippedHoldingPreviewData(
                            item?.token?.invested_base?.toString(),
                            item?.token?.balance?.toString(),
                          )
                          ? "text-success"
                          : pnlPercentage < 0 ||
                            getIsStrippedHoldingPreviewData(
                              item?.token?.invested_base?.toString(),
                              item?.token?.balance?.toString(),
                            )
                            ? "text-destructive"
                            : "text-fontColorPrimary",
                      )}
                    >
                      {pnlPercentage > 0 &&
                        !getIsStrippedHoldingPreviewData(
                          item?.token?.invested_base?.toString(),
                          item?.token?.balance?.toString(),
                        )
                        ? "+"
                        : ""}
                      {getIsStrippedHoldingPreviewData(
                        item?.token?.invested_base?.toString(),
                        item?.token?.balance?.toString(),
                      )
                        ? "-"
                        : pnlPercentage.toFixed(2)}
                      %
                    </span>

                    <span
                      className={cn(
                        "inline-block text-nowrap text-xs",
                        pnlUsd > 0 ||
                          getIsStrippedHoldingPreviewData(
                            item?.token?.invested_base?.toString(),
                            item?.token?.balance?.toString(),
                          )
                          ? "text-success"
                          : pnlUsd < 0 ||
                            getIsStrippedHoldingPreviewData(
                              item?.token?.invested_base?.toString(),
                              item?.token?.balance?.toString(),
                            )
                            ? "text-destructive"
                            : "text-fontColorPrimary",
                      )}
                    >
                      {pnlUsd > 0 &&
                        !getIsStrippedHoldingPreviewData(
                          item?.token?.invested_base?.toString(),
                          item?.token?.balance?.toString(),
                        )
                        ? "+"
                        : ""}
                      $
                      {getIsStrippedHoldingPreviewData(
                        item?.token?.invested_base?.toString(),
                        item?.token?.balance?.toString(),
                      )
                        ? "-"
                        : formatAmountWithoutLeadingZero(
                          Number(pnlUsd),
                        ).replace("-", "")}
                    </span>
                  </div>
                );

                if (index === firstIndex) {
                  return (
                    <div
                      key={`pl_${item.wallet}`}
                      className="flex flex-col justify-center gap-y-1"
                    >
                      {renderContent()}
                    </div>
                  );
                }

                return (
                  <motion.div
                    key={`pl_${item.wallet}`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{
                      height: openWalletList ? "auto" : "0",
                      opacity: openWalletList ? 1 : 0,
                    }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="relative z-10 flex w-full flex-col gap-y-3 pt-3">
                      {renderContent()}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>

          {/* Action */}
          <div className="mr-auto flex h-full w-full min-w-[50px] items-center justify-end">
            <div
              className="holdings-button relative z-[10] flex w-fit items-center gap-x-2"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <HoldingsButtons
                isFirst={isFirst}
                symbol={data?.token?.symbol || "-"}
                image={data?.token?.image || ""}
                profitAndLoss={totalPnL()}
                profitAndLossPercentage={totalPnLPercentage()}
                invested={totalInvested()}
                sold={totalSold()}
                mint={data?.token?.mint || ""}
                remainingSol={
                  (firstWalletWithBalance?.token.balance ?? 0) *
                  ((chartPriceMessage || [])?.find(
                    (m) => m.mint === data?.token?.mint,
                  )?.price_base ||
                    firstWalletWithBalance?.token?.price?.price_sol ||
                    firstWalletWithBalance?.token?.price?.price_base ||
                    0)
                }
              />
            </div>
          </div>
        </motion.div>
      </>
    );
  },
);
HoldingsCard.displayName = "HoldingsCard";
export default HoldingsCard;
