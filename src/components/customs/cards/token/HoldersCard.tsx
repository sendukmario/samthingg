"use client";

// ######## Libraries 📦 & Hooks 🪝 ########
import { useTokenCardsFilter } from "@/stores/token/use-token-cards-filter.store";
// ######## Components 🧩 ########
import { DesktopView, MobileView } from "./HoldersCardViews";
// ######## Utils & Helpers 🤝 ########
import { cn } from "@/libraries/utils";
// ######## Types 🗨️ ########
import { ChartHolderInfo, TokenInfo } from "@/types/ws-general";
import { useCallback, useMemo } from "react";
import { useWindowSizeStore } from "@/stores/use-window-size.store";
import { usePopupStore } from "@/stores/use-popup-state.store";
import { useWalletTrackerMessageStore } from "@/stores/footer/use-wallet-tracker-message.store";
import { useUserWalletStore } from "@/stores/wallet/use-user-wallet.store";
import { useTokenMessageStore } from "@/stores/token/use-token-messages.store";
import { useCurrentTokenChartPriceStore } from "@/stores/token/use-current-token-chart-price.store";
import { useSolPriceMessageStore } from "@/stores/use-solprice-message.store";

interface HoldersCardProps {
  rank: number;
  holder: ChartHolderInfo;
  tokenData: TokenInfo;
}

export default function HoldersCard({
  rank,
  holder,
  tokenData,
}: HoldersCardProps) {
  const width = useWindowSizeStore((state) => state.width);
  const { remainingScreenWidth } = usePopupStore();
  const isXlDown = width ? width < 1280 : false;
  const holdersBought = useTokenCardsFilter((state) => state.holdersBought);
  const holdersSold = useTokenCardsFilter((state) => state.holdersSold);
  const holdersRemaining = useTokenCardsFilter(
    (state) => state.holdersRemaining,
  );
  // const price = useTokenMessageStore((state) => state.priceMessage);

  const userWalletFullList = useUserWalletStore(
    (state) => state.userWalletFullList,
  );

  const isTradeMatchWithExistingUserWallet = useMemo(
    () => (userWalletFullList || [])?.find((w) => w.address === holder?.maker),
    [userWalletFullList, holder?.maker],
  );

  const price = useTokenMessageStore((state) => state.priceMessage);

  const initialTokenPriceSol = useTokenMessageStore(
    (state) => state.priceMessage.price_sol || state?.priceMessage?.price_base,
  );
  const currentGlobalChartPrice = useCurrentTokenChartPriceStore(
    (state) => state.price,
  );
  const initialTokenPriceUsd = useTokenMessageStore(
    (state) => state.priceMessage.price_usd,
  );
  const currentGlobalChartPriceUsd = useCurrentTokenChartPriceStore(
    (state) => state.priceUsd,
  );
  const finalPrice =
    currentGlobalChartPrice === "" ||
    isNaN(Number(initialTokenPriceSol)) ||
    !currentGlobalChartPrice
      ? initialTokenPriceSol
      : currentGlobalChartPrice;
  const finalPriceUsd =
    currentGlobalChartPriceUsd === "" ||
    isNaN(Number(initialTokenPriceUsd)) ||
    !currentGlobalChartPriceUsd
      ? initialTokenPriceUsd
      : currentGlobalChartPriceUsd;

  // console.log("HOLDERS DEBUG | USER STATUS ✨", {
  //   userWalletFullList,
  //   isMatch:
  //     isTradeMatchWithExistingUserWallet?.address === holder?.maker
  //       ? "🟢"
  //       : "🔴",
  //   isTradeMatchWithExistingUserWallet,
  // });

  const isTokenUsd = useTokenMessageStore((state) => state.tokenInfoMessage.is_usd);
  const solPrice = useSolPriceMessageStore((state) => state.messages).price;

  const displayedHolders = useMemo(() => {
    return {
      ...holder,
      bought_base: isTokenUsd ? holder.bought_usd / solPrice : holder.bought_base,
      sold_base: isTokenUsd ? holder.sold_usd / solPrice : holder.sold_base,
      token_balance: isTokenUsd ? holder.token_balance / solPrice : holder.token_balance,
    }
  }, [holder, isTokenUsd, solPrice]);

  const getRemainingValue = useCallback(
    (
      type:
        | "amount"
        | "percentage"
        | "total"
        | "amount_in_sol"
        | "amount_in_usd",
    ) => {
      const { sold_tokens, bought_tokens, token_balance } = displayedHolders;
      const totalTokens =
        sold_tokens > bought_tokens
          ? sold_tokens + token_balance
          : bought_tokens + token_balance;

      if (type === "percentage" && totalTokens === 0) {
        console.warn("Total tokens is zero. Cannot calculate percentage.");
        return 0;
      }
      if (type === "total") {
        return totalTokens;
      } else if (type === "amount") {
        return token_balance;
      } else if (type === "amount_in_sol") {
        return isTokenUsd ? token_balance * Number(finalPrice) / solPrice : token_balance * Number(finalPrice);
      } else if (type === "amount_in_usd") {
        return token_balance * Number(finalPriceUsd);
      } else if (type === "percentage") {
        return (token_balance / totalTokens) * 100;
      } else {
        return 0;
      }
    },
    [displayedHolders],
  );

  // Memoize expensive computations
  const trackedWallets = useWalletTrackerMessageStore(
    (state) => state.trackedWallets,
  );
  const isTradeMatchWithExistingTrackedWallet = useMemo(
    () => (trackedWallets || [])?.find((w) => w.address === holder?.maker),
    [trackedWallets, holder?.maker],
  );

  return (
    <div
      className={cn(
        "flex-shrink-0 items-center overflow-hidden from-background to-background-1",
        "max-xl:rounded-[8px] max-xl:border max-xl:border-border max-xl:bg-card",
        "transition-colors duration-200 ease-out xl:flex xl:h-[46px] xl:min-w-max",
        rank % 2 === 0 ? "" : "xl:bg-shadeTable xl:hover:bg-shadeTableHover",
        // remainingScreenWidth < 1280 && "max-xl:rounded-none max-xl:border-none max-xl:bg-transparent xl:flex xl:h-auto xl:min-w-fit",
        remainingScreenWidth < 1280 &&
          "mx-4 my-2 h-[140px] !rounded-[8px] !border !border-border !bg-card xl:flex xl:h-auto xl:min-w-fit",
      )}
    >
      {isXlDown || remainingScreenWidth < 1280 ? (
        <MobileView
          rank={rank}
          holder={displayedHolders}
          holdersBought={holdersBought}
          holdersSold={holdersSold}
          getRemainingValue={getRemainingValue}
          isTradeMatchWithExistingTrackedWallet={
            isTradeMatchWithExistingTrackedWallet
          }
          isTradeMatchWithExistingUserWallet={
            isTradeMatchWithExistingUserWallet
          }
          remainingScreenWidth={remainingScreenWidth}
          tokenData={tokenData}
        />
      ) : (
        <DesktopView
          rank={rank}
          holder={displayedHolders}
          tokenData={tokenData}
          holdersBought={holdersBought}
          holdersSold={holdersSold}
          holdersRemaining={holdersRemaining}
          getRemainingValue={getRemainingValue}
          isTradeMatchWithExistingTrackedWallet={
            isTradeMatchWithExistingTrackedWallet
          }
          isTradeMatchWithExistingUserWallet={
            isTradeMatchWithExistingUserWallet
          }
        />
      )}
    </div>
  );
}
