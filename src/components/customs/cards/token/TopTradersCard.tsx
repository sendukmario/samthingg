"use client";

// ######## Libraries 📦 & Hooks 🪝 ########
import { useTokenMessageStore } from "@/stores/token/use-token-messages.store";
import { useTokenCardsFilter } from "@/stores/token/use-token-cards-filter.store";
import { useCallback, useMemo } from "react";
import { useCurrentTokenChartPriceStore } from "@/stores/token/use-current-token-chart-price.store";
import { usePnLModalStore } from "@/stores/use-pnl-modal.store";
import { useWindowSizeStore } from "@/stores/use-window-size.store";
import { usePopupStore } from "@/stores/use-popup-state.store";
import { useWalletTrackerMessageStore } from "@/stores/footer/use-wallet-tracker-message.store";
import { useWalletFilterStore } from "@/stores/use-wallet-filter.store";
import { useTokenActiveTabStore } from "@/stores/use-token-active-tab.store";
// ######## Components 🧩 ########
import { DesktopView, MobileView } from "./TopTradersCardViews";
// ######## Utils & Helpers 🤝 ########
import { cn } from "@/libraries/utils";
// ######## Types 🗨️ ########
import { ChartTraderInfo, TokenInfo } from "@/types/ws-general";
import { useSolPriceMessageStore } from "@/stores/use-solprice-message.store";

interface TopTradersCardProps {
  rank: number;
  trader: ChartTraderInfo;
  tokenData?: TokenInfo;
}

export default function TopTradersCard({
  rank,
  trader,
  tokenData,
}: TopTradersCardProps) {
  const width = useWindowSizeStore((state) => state.width);
  const isXlDown = width ? width < 1280 : false;
  const topTradersBought = useTokenCardsFilter(
    (state) => state.topTradersBought,
  );
  const topTradersSold = useTokenCardsFilter((state) => state.topTradersSold);
  const topTradersRemaining = useTokenCardsFilter(
    (state) => state.topTradersRemaining,
  );
  const price = useTokenMessageStore((state) => state.priceMessage);

  const initialTokenPriceSol = useTokenMessageStore(
    (state) => state.priceMessage.price_sol || state?.priceMessage?.price_base,
  );
  const currentGlobalChartPrice = useCurrentTokenChartPriceStore(
    (state) => state.price,
  );
  const finalPrice = useMemo(() => {
    return currentGlobalChartPrice === "" ||
      isNaN(Number(initialTokenPriceSol)) ||
      !currentGlobalChartPrice
      ? initialTokenPriceSol
      : currentGlobalChartPrice;
  }, [currentGlobalChartPrice, initialTokenPriceSol]);

  // Remaining
  const remainingSol = trader.token_balance * Number(finalPrice);
  const remainingUsd = trader.token_balance * price.price_usd;

  // const prevCalc = trader.sold_base + trader.token_balance * Number(finalPrice);
  // const pnlSol = prevCalc - trader.bought_base;
  // const pnlUsd = pnlSol * Number(finalPrice);
  // const pnlPercentage = (pnlSol / trader.bought_base) * 100;

  // Get the openModal function from the store
  const openModal = usePnLModalStore((state) => state.openModal);

  // Create a handler to open the modal
  const handleOpenPnL = useCallback(() => {
    openModal(
      trader.maker,
      trader,
      tokenData as TokenInfo,
      Number(finalPrice),
      remainingSol,
      remainingUsd,
      trader.profit_base,
      trader.profit_usd,
      trader.profit_percentage,
      trader.bought_base,
      trader.bought_usd,
      trader.sold_base,
      trader.sold_usd,
    );
  }, [trader, tokenData, finalPrice, remainingSol, openModal]);
  const { remainingScreenWidth } = usePopupStore();

  // Filter Configuration
  const setActiveTab = useTokenActiveTabStore((state) => state.setActiveTab);
  const walletFilter = useWalletFilterStore((state) => state.walletFilter);
  const setWalletFilter = useWalletFilterStore(
    (state) => state.setWalletFilter,
  );
  const handleFilter = () => {
    if (walletFilter.length > 0) {
      setWalletFilter("");
    } else {
      setActiveTab("Trades");
      setWalletFilter(trader?.maker || "");
    }
  };

  // Memoize expensive computations
  const trackedWallets = useWalletTrackerMessageStore(
    (state) => state.trackedWallets,
  );
  const isTradeMatchWithExistingTrackedWallet = useMemo(
    () => (trackedWallets || [])?.find((w) => w.address === trader?.maker),
    [trackedWallets, trader?.maker],
  );

  const isTokenUsd = useTokenMessageStore(
    (state) => state.tokenInfoMessage.is_usd,
  );
  const solPrice = useSolPriceMessageStore((state) => state.messages).price;

  const displayedTrader = useMemo(() => {
    return {
      ...trader,
      bought_base: isTokenUsd ? trader.bought_usd / solPrice : trader.bought_base,
      sold_base: isTokenUsd ? trader.sold_usd / solPrice : trader.sold_base,
    }
  }, [trader, isTokenUsd, solPrice]);

  return (
    <div
      className={cn(
        "flex-shrink-0 items-center overflow-hidden from-background to-background-1",
        "max-xl:rounded-[8px] max-xl:border max-xl:border-border max-xl:bg-card xl:border-none",
        "transition-colors duration-200 ease-out xl:flex xl:h-[46px] xl:min-w-max xl:border-b xl:border-border xl:pr-[16px] xl:hover:bg-white/[8%]",
        rank % 2 === 0 ? "" : "xl:bg-shadeTable xl:hover:bg-shadeTableHover",
        remainingScreenWidth < 1280 &&
          "mx-4 my-2 h-[150px] !rounded-[8px] !bg-card xl:flex xl:h-auto xl:min-w-fit xl:border-border xl:pr-0",
      )}
    >
      {isXlDown || remainingScreenWidth < 1280 ? (
        <MobileView
          rank={rank}
          trader={displayedTrader}
          topTradersBought={topTradersBought}
          topTradersSold={topTradersSold}
          handleOpenPnL={handleOpenPnL}
          isTradeMatchWithExistingTrackedWallet={
            isTradeMatchWithExistingTrackedWallet
          }
          remainingSol={remainingSol}
          handleFilter={handleFilter}
        />
      ) : (
        <DesktopView
          rank={rank}
          trader={displayedTrader}
          topTradersBought={topTradersBought}
          topTradersSold={topTradersSold}
          topTradersRemaining={topTradersRemaining}
          handleOpenPnL={handleOpenPnL}
          isTradeMatchWithExistingTrackedWallet={
            isTradeMatchWithExistingTrackedWallet
          }
          remainingSol={remainingSol}
          tokenImage={tokenData?.image}
          handleFilter={handleFilter}
        />
      )}
    </div>
  );
}
