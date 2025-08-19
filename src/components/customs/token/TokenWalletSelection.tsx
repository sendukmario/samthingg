"use client";

// ######## Libraries 📦 & Hooks 🪝 ########
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useCurrentTokenChartPriceStore } from "@/stores/token/use-current-token-chart-price.store";
import { useTokenMessageStore } from "@/stores/token/use-token-messages.store";
import { useTokenHoldingStore } from "@/stores/token/use-token-holding.store";
import { useSolPriceMessageStore } from "@/stores/use-solprice-message.store";
// ######## Components 🧩 ########
import PnLScreenshot from "@/components/customs/token/PnL/PnLScreenshot";
import PnLTrigger from "./PnL/PnLTrigger";
// ######## Utils & Helpers 🤝 ########
import { formatAmountWithoutLeadingZero } from "@/utils/formatAmount";
// ######## Types 🗨️ ########
import { CachedImage } from "../CachedImage";
import { usePopupStore } from "@/stores/use-popup-state.store";
import { useLatestTransactionMessageStore } from "@/stores/use-latest-transactions.store";
import { cn } from "@/libraries/utils";
import { getIsStrippedHoldingPreviewData } from "@/utils/getIsStrippedHoldingPreviewData";
import { SolanaSqIconSVG } from "../ScalableVectorGraphics";

const TokenWalletSelection = () => {
  const params = useParams();
  const mintAddress =
    params?.["mint-address"] || (params?.["pool-address"] as string);

  const tokenSymbol = useTokenMessageStore(
    (state) => state.tokenInfoMessage.symbol,
  );

  const tokenImage = useTokenMessageStore(
    (state) => state.tokenInfoMessage.image,
  );

  const tokenIsUSD = useTokenMessageStore(
    (state) => state.tokenInfoMessage.is_usd,
  );

  const isLoadingHolding = useTokenHoldingStore((state) => state.isLoading);

  const priceMessage = useTokenMessageStore((state) => state.priceMessage);
  const initialTokenPriceSol =
    priceMessage?.price_sol || priceMessage?.price_base || 0;

  const currentGlobalChartPrice = useCurrentTokenChartPriceStore(
    (state) => state.price,
  );
  const finalPrice =
    (currentGlobalChartPrice === "" || !currentGlobalChartPrice) &&
      !isNaN(Number(initialTokenPriceSol))
      ? initialTokenPriceSol
      : currentGlobalChartPrice;

  useEffect(() => {
    if (finalPrice === 0) {
    }
  }, [finalPrice, currentGlobalChartPrice, initialTokenPriceSol]);

  const solPrice = useSolPriceMessageStore((state) => state.messages).price;

  // Get token data from store
  const holdingsMessages = useTokenHoldingStore((state) => state.messages);
  const transactionsMessages = useLatestTransactionMessageStore(
    (state) => state.messages,
  );

  // Calculate totals directly
  const calculateTotalInvested = () => {
    let total = 0;
    holdingsMessages?.forEach((message) => {
      const holdToken = (message?.tokens || [])?.find(
        (token) => token.token.mint === mintAddress,
      );

      if (holdToken) {
        total += holdToken.invested_base;
      }
    });

    if (tokenIsUSD && total !== 0) {
      total /= solPrice;
    }

    return String(total);
  };

  const calculateTotalRemaining = () => {
    let total = 0;
    if (holdingsMessages) {
      holdingsMessages?.forEach((message) => {
        const holdToken = (message?.tokens || [])?.find(
          (token) => token.token.mint === mintAddress,
        );
        if (holdToken) {
          total += holdToken.balance * Number(finalPrice);
        }
      });
    } else {
      const balance = transactionsMessages.find(
        (message) => message.mint === mintAddress,
      );
      if (balance) {
        total += balance.balance * Number(finalPrice);
      }
    }

    if (tokenIsUSD && total !== 0) {
      total /= solPrice;
    }

    return String(total);
  };

  const calculateTotalSold = () => {
    let total = 0;
    holdingsMessages?.forEach((message) => {
      const holdToken = (message?.tokens || [])?.find(
        (token) => token.token.mint === mintAddress,
      );
      if (holdToken) {
        total += holdToken.sold_base;
      }
    });

    if (tokenIsUSD && total !== 0) {
      total /= solPrice;
    }

    return String(total);
  };

  const calculateProfitAndLoss = () => {
    let total = 0;
    holdingsMessages?.forEach((message) => {
      const holdToken = (message?.tokens || [])?.find(
        (token) => token.token.mint === mintAddress,
      );
      if (holdToken) {
        const prevCalc =
          holdToken?.sold_base + holdToken?.balance * Number(finalPrice);
        const pnlSol = prevCalc - holdToken?.invested_base;
        total += pnlSol ?? 0;
      }
    });

    if (tokenIsUSD && total !== 0) {
      total /= solPrice;
    }

    return String(total);
  };

  const calculateProfitAndLossPercentage = () => {
    let totalPnl = 0;
    let totalInvested = 0;

    holdingsMessages?.forEach((message) => {
      const holdToken = (message?.tokens || [])?.find(
        (token) => token.token.mint === mintAddress,
      );
      if (holdToken) {
        const prevCalc =
          holdToken?.sold_base + holdToken?.balance * Number(finalPrice);
        const pnlSol = prevCalc - holdToken?.invested_base;
        totalPnl += pnlSol ?? 0;
        totalInvested += holdToken?.invested_base ?? 0;
      }
    });

    return totalInvested ? String((totalPnl / totalInvested) * 100) : "0";
  };

  const [finalSolPrice, setFinalSolPrice] = useState(0);

  const totalInvested = calculateTotalInvested();
  const totalRemaining = calculateTotalRemaining();
  const totalSold = calculateTotalSold();
  const profitAndLoss = calculateProfitAndLoss();
  const profitAndLossPercentage = calculateProfitAndLossPercentage();

  useEffect(() => {
    if (Number(totalRemaining) > 0 || finalSolPrice === 0) {
      setFinalSolPrice(Number(solPrice));
    }
  }, [totalRemaining]);

  const { popups, remainingScreenWidth } = usePopupStore();
  const isSnapOpen = popups.some((p) => p.isOpen && p.snappedSide !== "none");

  return (
    <>
      {isSnapOpen || remainingScreenWidth <= 768 ? (
        <div className="nova-scroller w-full overflow-x-auto">
          <div className="flex flex-row items-center gap-x-1 rounded-[8px] border-border bg-shadeTable max-md:border md:mb-0 md:rounded-none md:border-b md:bg-transparent">
            <div
              className={cn(
                "flex h-full w-full flex-row items-center gap-2 gap-x-0 border-border md:px-1",
                remainingScreenWidth <= 1000 && !isLoadingHolding && "flex-col",
              )}
            >
              {remainingScreenWidth <= 1000 && !isLoadingHolding && (
                <>
                  {isLoadingHolding ? (
                    <PnLTrigger
                      isLoadingHolding={true}
                      profitAndLoss={"0"}
                      profitAndLossPercentage={"0"}
                    />
                  ) : (
                    <PnLScreenshot
                      profitAndLossUsdRaw={
                        Number(profitAndLoss) * finalSolPrice
                      }
                      remainingDRaw={Number(totalRemaining) * finalSolPrice}
                      soldDRaw={Number(totalSold) * finalSolPrice}
                      invevtedDRaw={Number(totalInvested) * finalSolPrice}
                      title={"$" + tokenSymbol}
                      solPrice={solPrice}
                      profitAndLoss={profitAndLoss}
                      profitAndLossPercentage={profitAndLossPercentage}
                      invested={totalInvested}
                      sold={totalSold}
                      image={tokenImage}
                      remaining={totalRemaining}
                    />
                  )}
                </>
              )}

              <div className="grid w-full flex-grow grid-cols-3 gap-x-2 px-1 py-1 pr-2 md:flex-grow md:p-2 md:pl-0.5">
                <div className="relative col-span-1 flex flex-col justify-center gap-1 border-r border-border">
                  <span className="relative inline-block text-[10px] leading-3 text-fontColorSecondary">
                    Invested {tokenIsUSD ? "USD" : "SOL"}
                  </span>
                  <div className="relative mt-[-0.2rem] flex items-center gap-x-1.5">
                    <div className="relative aspect-square h-4 w-4 flex-shrink-0">
                      <SolanaSqIconSVG />
                    </div>
                    <span className="inline-block text-nowrap font-geistSemiBold text-sm text-fontColorPrimary">
                      {isLoadingHolding ||
                        getIsStrippedHoldingPreviewData(
                          totalInvested,
                          totalRemaining,
                        )
                        ? "-"
                        : formatAmountWithoutLeadingZero(Number(totalInvested))}
                    </span>
                  </div>
                </div>
                <div className="relative col-span-1 flex flex-col justify-center gap-1 border-r border-border">
                  <span className="relative inline-block text-[10px] leading-3 text-fontColorSecondary">
                    Remaining
                  </span>
                  <div className="relative mt-[-0.3rem] flex items-center gap-x-1.5 leading-3">
                    <div className="relative aspect-square h-4 w-4 flex-shrink-0">
                      <SolanaSqIconSVG />
                    </div>
                    <span className="inline-block text-nowrap font-geistSemiBold text-sm text-fontColorPrimary">
                      {isLoadingHolding
                        ? "-"
                        : formatAmountWithoutLeadingZero(
                          Number(totalRemaining),
                        )}
                    </span>
                  </div>
                </div>
                <div
                  className={cn(
                    "relative col-span-1 flex flex-col justify-center gap-1 border-border",
                    (remainingScreenWidth > 1000 || isLoadingHolding) &&
                    "border-r",
                  )}
                >
                  <span className="relative inline-block text-[10px] leading-3 text-fontColorSecondary">
                    Sold
                  </span>
                  <div className="relative mt-[-0.2rem] flex items-center gap-x-1.5">
                    <div className="relative aspect-square h-4 w-4 flex-shrink-0">
                      <SolanaSqIconSVG />
                    </div>
                    <span className="inline-block text-nowrap font-geistSemiBold text-sm text-fontColorPrimary">
                      {isLoadingHolding ||
                        getIsStrippedHoldingPreviewData(
                          Number(totalSold) + Number(totalInvested),
                          totalRemaining,
                        )
                        ? "-"
                        : formatAmountWithoutLeadingZero(Number(totalSold))}
                    </span>
                  </div>
                </div>
              </div>

              {(remainingScreenWidth > 1000 || isLoadingHolding) && (
                <>
                  {isLoadingHolding ? (
                    <PnLTrigger
                      isLoadingHolding={true}
                      profitAndLoss={"0"}
                      profitAndLossPercentage={"0"}
                    />
                  ) : (
                    <PnLScreenshot
                      profitAndLossUsdRaw={
                        Number(profitAndLoss) * finalSolPrice
                      }
                      remainingDRaw={Number(totalRemaining) * finalSolPrice}
                      soldDRaw={Number(totalSold) * finalSolPrice}
                      invevtedDRaw={Number(totalInvested) * finalSolPrice}
                      title={"$" + tokenSymbol}
                      solPrice={solPrice}
                      profitAndLoss={profitAndLoss}
                      profitAndLossPercentage={profitAndLossPercentage}
                      invested={totalInvested}
                      sold={totalSold}
                      image={tokenImage}
                      remaining={totalRemaining}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex w-full flex-col items-center gap-x-1 rounded-[8px] border-border bg-shadeTable max-md:border md:mb-0 md:rounded-none md:border-b md:bg-transparent xl:h-[50px] xl:flex-row">
          <div className="flex w-full items-center justify-between gap-x-2 xl:w-auto xl:pr-0">
            <div className="hidden w-full md:flex xl:hidden">
              {isLoadingHolding ? (
                <PnLTrigger
                  isLoadingHolding={true}
                  profitAndLoss={"0"}
                  profitAndLossPercentage={"0"}
                />
              ) : (
                <PnLScreenshot
                  profitAndLossUsdRaw={Number(profitAndLoss) * finalSolPrice}
                  remainingDRaw={Number(totalRemaining) * finalSolPrice}
                  soldDRaw={Number(totalSold) * finalSolPrice}
                  invevtedDRaw={Number(totalInvested) * finalSolPrice}
                  title={"$" + tokenSymbol}
                  solPrice={solPrice}
                  profitAndLoss={profitAndLoss}
                  profitAndLossPercentage={profitAndLossPercentage}
                  invested={totalInvested}
                  sold={totalSold}
                  image={tokenImage}
                  remaining={totalRemaining}
                />
              )}
            </div>
          </div>

          <div className="flex h-full w-full flex-grow flex-col-reverse items-center gap-2 gap-x-0 p-[12px] md:p-1 xl:flex-row">
            <div className="grid w-full flex-grow grid-cols-3 gap-x-2.5 px-1 py-1 pr-2 md:flex-grow md:p-2 md:pl-0.5">
              <div className="relative col-span-1 flex flex-col justify-center gap-1 border-r border-border">
                <span className="relative inline-block text-[10px] leading-3 text-fontColorSecondary">
                  Invested {tokenIsUSD ? "USD" : "SOL"}
                </span>
                <div className="relative mt-[-0.2rem] flex items-center gap-x-1.5">
                  <div className="relative aspect-square h-4 w-4 flex-shrink-0">
                    <SolanaSqIconSVG />
                  </div>
                  <span className="inline-block text-nowrap font-geistSemiBold text-sm text-fontColorPrimary">
                    {isLoadingHolding ||
                      getIsStrippedHoldingPreviewData(
                        totalInvested,
                        totalRemaining,
                      )
                      ? "-"
                      : formatAmountWithoutLeadingZero(Number(totalInvested))}
                  </span>
                </div>
              </div>
              <div className="relative col-span-1 flex flex-col justify-center gap-1 border-r border-border">
                <span className="relative inline-block text-[10px] leading-3 text-fontColorSecondary">
                  Remaining
                </span>
                <div className="relative mt-[-0.3rem] flex items-center gap-x-1.5 leading-3">
                  <div className="relative aspect-square h-4 w-4 flex-shrink-0">
                    <SolanaSqIconSVG />
                  </div>
                  <span className="inline-block text-nowrap font-geistSemiBold text-sm text-fontColorPrimary">
                    {isLoadingHolding
                      ? "-"
                      : formatAmountWithoutLeadingZero(Number(totalRemaining))}
                  </span>
                </div>
              </div>
              <div className="relative col-span-1 flex flex-col justify-center gap-1 border-border xl:border-r">
                <span className="relative inline-block text-[10px] leading-3 text-fontColorSecondary">
                  Sold
                </span>
                <div className="relative mt-[-0.2rem] flex items-center gap-x-1.5">
                  <div className="relative aspect-square h-4 w-4 flex-shrink-0">
                    <SolanaSqIconSVG />
                  </div>
                  <span className="inline-block text-nowrap font-geistSemiBold text-sm text-fontColorPrimary">
                    {isLoadingHolding ||
                      getIsStrippedHoldingPreviewData(
                        Number(totalSold) + Number(totalInvested),
                        totalRemaining,
                      )
                      ? "-"
                      : formatAmountWithoutLeadingZero(Number(totalSold))}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex w-full md:hidden xl:flex xl:w-auto">
              {isLoadingHolding ? (
                <PnLTrigger
                  isLoadingHolding={true}
                  profitAndLoss={"0"}
                  profitAndLossPercentage={"0"}
                />
              ) : (
                <PnLScreenshot
                  profitAndLossUsdRaw={Number(profitAndLoss) * finalSolPrice}
                  remainingDRaw={Number(totalRemaining) * finalSolPrice}
                  soldDRaw={Number(totalSold) * finalSolPrice}
                  invevtedDRaw={Number(totalInvested) * finalSolPrice}
                  title={"$" + tokenSymbol}
                  solPrice={solPrice}
                  profitAndLoss={profitAndLoss}
                  profitAndLossPercentage={profitAndLossPercentage}
                  invested={totalInvested}
                  sold={totalSold}
                  image={tokenImage}
                  remaining={totalRemaining}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default React.memo(TokenWalletSelection);
