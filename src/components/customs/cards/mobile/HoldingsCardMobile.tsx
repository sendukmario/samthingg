"use client";

// ######## Libraries 📦 & Hooks 🪝 ########
import React, { useMemo, useState, useEffect, useRef } from "react";
import { useRouter } from "nextjs-toploader/app";
import { useUserWalletStore } from "@/stores/wallet/use-user-wallet.store";
import { useSolPriceMessageStore } from "@/stores/use-solprice-message.store";
import { useTrackUserEvent } from "@/hooks/use-track-event";
import { useTrackUserEventStore } from "@/stores/use-track-user-event.store";
import { motion } from "framer-motion";
// ######## Components 🧩 ########
import Image from "next/image";
import Separator from "@/components/customs/Separator";
import { getRightBadgeType } from "@/components/customs/AvatarWithBadges";
import Copy from "@/components/customs/Copy";
import HoldingsButtons from "@/components/customs/buttons/HoldingsButtons";
import AvatarWithBadges from "@/components/customs/AvatarWithBadges";
import SocialLinkButton from "@/components/customs/buttons/SocialLinkButton";
// ######## Utils & Helpers 🤝 ########
import { cn } from "@/libraries/utils";
import { truncateString } from "@/utils/truncateString";
import {
  formatAmountDollar,
  formatAmountWithoutLeadingZero,
} from "@/utils/formatAmount";
// ######## Types 🗨️ ########
import { HoldingsTransformedTokenData } from "@/types/ws-general";
import { useHoldingsMessageStore } from "@/stores/holdings/use-holdings-messages.store";
import { useQueryClient } from "@tanstack/react-query";
import { prefetchCandles, prefetchChart } from "@/apis/rest/charts";
import { CachedImage } from "../../CachedImage";
import {
  useWalletHighlightStore,
  type WalletWithColor,
} from "@/stores/wallets/use-wallet-highlight-colors.store";
import { AvatarHighlightWrapper } from "@/components/customs/AvatarHighlightWrapper";
import { useTradingViewPreferencesStore } from "@/stores/token/use-tradingview-preferences.store";

export default function HoldingsCardMobile({
  data,
  isFirst,
  trackedWalletsOfToken,
}: {
  data: HoldingsTransformedTokenData;
  isFirst: boolean;
  trackedWalletsOfToken: Record<string, string[]>;
}) {
  const router = useRouter();

  const hasMounted = useRef(false);
  useEffect(() => {
    hasMounted.current = true;
  }, []);

  const currentPriceMessage = useHoldingsMessageStore(
    (state) => state.batchPriceMessage,
  )?.find((message) => message.mint === data.token.mint);
  const globalSolPrice = useSolPriceMessageStore(
    (state) => state.messages.price,
  );
  const solPrice = Number(currentPriceMessage?.price_base);
  const usdPrice = Number(currentPriceMessage?.price_usd);
  const selectedMultipleActiveWalletHoldings = useUserWalletStore(
    (state) => state.selectedMultipleActiveWalletHoldings,
  );
  const chartPriceMessage = useHoldingsMessageStore(
    (state) => state.batchPriceMessage,
  );
  const firstWalletWithBalance = (data.list || [])?.find(
    (item) => item.token.balance > 0,
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

  const [openWalletList, setOpenWalletList] = useState<boolean>(true);
  const handleOpenCloseWallet = (event: React.MouseEvent) => {
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
      const walletSelected = (selectedMultipleActiveWalletHoldings || [])?.some(
        (wallet) => wallet.address === item.wallet,
      );

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
        item.token.price?.price_sol ||
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

  // Replace individual functions with memoized values
  const totalInvested = () => calculateTotals.invested;
  const totalSold = () => calculateTotals.sold;
  const totalPnL = () => calculateTotals.pnl;
  const totalPnLPercentage = () => calculateTotals.pnlPercentage;

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
  const { getApiResolution } = useTradingViewPreferencesStore();
  let hoverTimeout: NodeJS.Timeout;

  const setIsExternal = useTrackUserEventStore((state) => state.setIsExternal);
  const { mutate: trackUserEvent } = useTrackUserEvent("holdings");

  return (
    <div
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
        //   prefetchCandles(data.mint);
        // }, 10);
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsExternal(false);
        trackUserEvent({ mint: data?.token?.mint || "" });
        window.open(tokenUrl, "_blank");
      }}
      className="group relative mb-2 min-h-2 w-full flex-shrink-0 cursor-pointer overflow-hidden rounded-[8px] border border-border bg-card duration-300 hover:border-border"
    >
      {/* Header */}
      <div className="relative flex h-[40px] w-full items-center justify-between overflow-hidden bg-white/[4%] px-3">
        <div className="relative z-[20] flex items-center gap-x-2">
          <AvatarHighlightWrapper size={34} walletHighlights={walletHighlights}>
            <AvatarWithBadges
              src={data?.token?.image || ""}
              symbol={data?.token?.symbol || ""}
              alt="Token Image"
              rightType={getRightBadgeType(
                data?.token?.dex,
                data?.token?.launchpad,
              )}
              rightClassName="!size-3.5 -right-0.5 -bottom-[1.5px]"
              size="xs"
            />
          </AvatarHighlightWrapper>
          <div className="flex items-center gap-x-1">
            <h4 className="text-nowrap font-geistSemiBold text-xs text-fontColorPrimary">
              {truncateString(data?.token?.name || "", 8)}
            </h4>
            <span className="inline-block text-nowrap text-xs uppercase text-fontColorSecondary">
              {truncateString(data?.token?.symbol || "", 14)}
            </span>
            <Copy value={data?.token?.mint} />
          </div>
        </div>

        <div className="z-[20] flex items-center gap-x-1">
          {data?.token?.twitter && (
            <SocialLinkButton
              href={data?.token?.twitter}
              icon="x"
              label="Twitter"
            />
          )}
          {data?.token?.telegram && (
            <SocialLinkButton
              href={data?.token?.telegram}
              icon="telegram"
              label="Telegram"
            />
          )}
          {data?.token?.website && (
            <SocialLinkButton
              href={data?.token?.website}
              icon="website"
              label="Website"
            />
          )}
        </div>
      </div>

      {/* Content */}
      <div className="relative flex w-full flex-col">
        <button
          id={isFirst ? "dropdown-wallets-holdings-mobile" : undefined}
          onClick={(e) => handleOpenCloseWallet(e)}
          className="absolute right-3 top-3 z-[20] flex items-center gap-x-0.5"
        >
          <span className="font-geistSemiBold text-sm text-primary">
            {(() => {
              let count = 0;

              (selectedMultipleActiveWalletHoldings || [])?.forEach(
                (wallet) => {
                  const isSelected = (data.list || [])?.some(
                    (list) => list.wallet === wallet.address,
                  );

                  if (isSelected) {
                    count++;
                  }
                },
              );

              return `Wallet (${count})`;
            })()}
          </span>
          <div className="relative aspect-square h-4 w-4 flex-shrink-0">
            <Image
              src="/icons/pink-chevron-down.png"
              alt="Pink Chevron Down Icon"
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
          initial={{
            height: hasMounted.current ? 0 : "auto",
            opacity: hasMounted.current ? 0 : 1,
          }}
          animate={{
            height: openWalletList ? "auto" : "45px",
            opacity: openWalletList ? 1 : 0,
          }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: hasMounted.current ? 0.3 : 0 }}
          className="overflow-hidden"
        >
          <div className="relative flex w-full flex-col gap-y-3 p-3">
            {(data?.list || [])?.map((item, index) => {
              const walletInfo = (
                selectedMultipleActiveWalletHoldings || []
              )?.find((wallet) => wallet.address === item.wallet);

              const walletSelected = (
                selectedMultipleActiveWalletHoldings || []
              )?.some((wallet) => wallet.address === item.wallet);

              if (!walletInfo || !walletSelected) return;

              return (
                <React.Fragment key={index + item?.wallet}>
                  {index !== firstIndex && <Separator color="#202037" />}

                  <WalletList
                    key={index}
                    walletName={walletInfo.name}
                    investedBase={item?.token?.invested_base}
                    investedBaseStr={item?.token?.invested_base?.toString()}
                    investedUsdStr={item?.token?.invested_usd?.toString()}
                    soldBase={item?.token?.sold_base}
                    soldBaseStr={item?.token?.sold_base?.toString()}
                    priceBase={
                      solPrice ||
                      item?.token?.price?.price_sol ||
                      item?.token.price?.price_base ||
                      0
                    }
                    priceUsd={usdPrice || item?.token?.price.price_usd}
                    // priceBase={item?.token?.price.price_base}
                    // priceUsd={usdPrice || item?.token?.price.price_usd}
                    balance={item.token?.balance}
                    solPrice={globalSolPrice}
                  />
                </React.Fragment>
              );
            })}
          </div>
        </motion.div>

        <Separator color="#202037" />

        <div
          onClick={(e) => e.stopPropagation()}
          className="z-[10] flex w-full items-center justify-end gap-x-2 px-3 py-2"
        >
          <HoldingsButtons
            isFirst={isFirst}
            symbol={data?.token?.symbol || "-"}
            image={data?.token?.image || ""}
            sold={totalSold()}
            invested={totalInvested()}
            profitAndLoss={totalPnL()}
            profitAndLossPercentage={totalPnLPercentage()}
            mint={data?.token?.mint}
            remainingSol={
              (firstWalletWithBalance?.token.balance ?? 0) *
              ((solPrice ||
                firstWalletWithBalance?.token?.price?.price_sol ||
                firstWalletWithBalance?.token?.price?.price_base) ??
                0)
            }
          />
        </div>
      </div>
    </div>
  );
}

const WalletList = ({
  walletName,
  investedBase,
  investedBaseStr,
  investedUsdStr,
  soldBase,
  soldBaseStr,
  priceBase,
  priceUsd,
  solPrice,
  balance,
}: {
  walletName: string;
  investedBase: number;
  investedBaseStr: string;
  investedUsdStr: string;
  soldBase: number;
  soldBaseStr: string;
  priceBase: number;
  priceUsd: number;
  solPrice: number;
  balance: number;
}) => {
  // Remaining
  const remainingSol = balance * priceBase;
  const remainingUsd = balance * priceUsd;

  // Sold
  // const soldUsd = soldBase * priceBase;
  const soldUsd = soldBase * solPrice;

  // P&L
  const prevCalc = soldBase + balance * priceBase;
  const pnlSol = prevCalc - investedBase;
  const pnlUsd = pnlSol * solPrice;
  const pnlPercentage = (pnlSol / investedBase) * 100;

  return (
    <div className="flex w-full flex-col gap-y-3">
      <span className="inline-block font-geistSemiBold text-sm text-fontColorPrimary">
        {walletName}
      </span>

      <div className="flex items-center justify-between sm:justify-start sm:gap-x-9">
        {/* Invested */}
        <div className="flex flex-col gap-y-1">
          <span className="line-clamp-1 text-xs text-fontColorSecondary">
            Invested
          </span>
          <div className="flex flex-col gap-y-0.5">
            <div className="flex items-center gap-x-1">
              <div className="relative aspect-auto h-[16px] w-[16px] flex-shrink-0">
                <CachedImage
                  src="/icons/solana-sq.svg"
                  alt="Solana SQ Icon"
                  fill
                  quality={50}
                  className="object-contain"
                />
              </div>
              <span className="inline-block text-nowrap font-geistSemiBold text-xs text-fontColorPrimary">
                {formatAmountWithoutLeadingZero(Number(investedBaseStr))}
              </span>
            </div>
            <span className="line-clamp-1 text-xs text-fontColorSecondary">
              {Number(investedUsdStr) > 1
                ? formatAmountDollar(Number(investedUsdStr))
                : `$${formatAmountWithoutLeadingZero(Number(investedUsdStr))}`}
            </span>
          </div>
        </div>

        {/* Remaining */}
        <div className="flex flex-col gap-y-1">
          <span className="line-clamp-1 text-xs text-fontColorSecondary">
            Remaining
          </span>
          <div className="flex flex-col gap-y-0.5">
            <div className="flex items-center gap-x-1">
              <div className="relative aspect-auto h-[16px] w-[16px] flex-shrink-0">
                <CachedImage
                  src="/icons/solana-sq.svg"
                  alt="Solana SQ Icon"
                  fill
                  quality={50}
                  className="object-contain"
                />
              </div>
              <span className="inline-block text-nowrap font-geistSemiBold text-xs text-fontColorPrimary">
                {formatAmountWithoutLeadingZero(Number(remainingSol))}
              </span>
            </div>
            <span className="line-clamp-1 text-xs text-fontColorSecondary">
              {remainingUsd > 1
                ? formatAmountDollar(Number(remainingUsd))
                : `$${formatAmountWithoutLeadingZero(Number(remainingUsd))}`}
            </span>
          </div>
        </div>

        {/* Sold */}
        <div className="flex flex-col gap-y-1">
          <span className="line-clamp-1 text-xs text-fontColorSecondary">
            Sold
          </span>
          <div className="flex flex-col gap-y-0.5">
            <div className="flex items-center gap-x-1">
              <div className="relative aspect-auto h-[16px] w-[16px] flex-shrink-0">
                <CachedImage
                  src="/icons/solana-sq.svg"
                  alt="Solana SQ Icon"
                  fill
                  quality={50}
                  className="object-contain"
                />
              </div>
              <span className="inline-block text-nowrap font-geistSemiBold text-xs text-fontColorPrimary">
                {formatAmountWithoutLeadingZero(Number(soldBaseStr))}
              </span>
            </div>
            <span className="line-clamp-1 text-xs text-fontColorSecondary">
              {soldUsd > 1
                ? formatAmountDollar(Number(soldUsd.toFixed(2)))
                : `$${formatAmountWithoutLeadingZero(Number(soldUsd))}`}
            </span>
          </div>
        </div>

        {/* P&L */}
        <div className="flex flex-col gap-y-1">
          <span className="line-clamp-1 text-xs text-fontColorSecondary">
            P&L
          </span>
          <div className="flex flex-col gap-y-0.5">
            <span
              className={cn(
                "inline-block text-nowrap font-geistSemiBold text-xs",
                pnlPercentage > 0 ? "text-success" : "text-destructive",
              )}
            >
              {pnlPercentage > 0 ? "+" : ""}
              {pnlPercentage.toFixed(2)}%
            </span>
            <span
              className={cn(
                "line-clamp-1 text-xs",
                pnlUsd > 0 ? "text-success" : "text-destructive",
              )}
            >
              ${formatAmountWithoutLeadingZero(Number(pnlUsd)).replace("-", "")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
