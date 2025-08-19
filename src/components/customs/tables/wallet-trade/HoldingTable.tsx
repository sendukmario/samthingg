"use client";

// ######## Libraries 📦 & Hooks 🪝 ########
import { useParams } from "next/navigation";
import { memo, useEffect, useMemo, useRef, useState } from "react";
// ######## Components 🧩 ########
import HeadCol from "@/components/customs/tables/HeadCol";
import { Skeleton } from "@/components/ui/skeleton";
// ######## Utils & Helpers 🤝 ########
import { cn } from "@/libraries/utils";
import { useTradesWalletModalStore } from "@/stores/token/use-trades-wallet-modal.store";
import { usePopupStore } from "@/stores/use-popup-state.store";
import { useSolPriceMessageStore } from "@/stores/use-solprice-message.store";
import { LoaderCircle } from "lucide-react";
import { HiArrowNarrowDown, HiArrowNarrowUp } from "react-icons/hi";
import { CommonTableProps } from "./TradeHistoryTable";
import { useQuery } from "@tanstack/react-query";
import { useWindowSizeStore } from "@/stores/use-window-size.store";
import { FixedSizeList } from "react-window";
import { useAnnouncementStore } from "@/stores/use-announcement.store";
import VirtualizedHoldingRow from "./VirtualizedHoldingRow";
import { useCustomizeTheme } from "@/hooks/use-customize-theme";
import { useDeviceAndBrowserForScrollbarStore } from "@/stores/use-device-and-browser-for-scrollbar-state.store";
import { getPortofolioPnl, Holding } from "@/apis/rest/wallet-trade-new";

interface Token {
  symbol: string;
  name: string;
  image: string;
  mint: string;
  origin_dex: string;
  launchpad: string;
}

export interface TransformedHoldingData {
  id: string;
  token: Token;
  investedUsd: number;
  soldUsd: number;
  balance: number;
  balanceUsd: number;
  lastBought: string;
  investedBase: number;
  remaining: number;
  pnl: number;
  pnlPercentage: string;
  soldBase: number;
  price: {
    usd: number;
    sol: number;
  };
}

// Types
type SortOrder = "ASC" | "DESC";

interface SortConfig {
  key: "amount" | "amountBought" | "amountSold" | "remaining" | "pl" | "recent";
  order: SortOrder;
}

// Transform API data to match HoldingCard requirements
// const transformHoldingData = (
//   data: HoldingData,
//   solPrice: number,
// ): TransformedHoldingData => {
//   return {
//     id: data.address,
//     token: {
//       symbol: data.symbol,
//       name: data.name,
//       image: data.image || "",
//       mint: data.address,
//       launchpad: data.launchpad,
//       origin_dex: data.origin_dex,
//     },
//     investedUsd: data.invested,
//     soldUsd: data.sold,
//     balance: data.amount / solPrice,
//     balanceUsd: data.value,
//     remaining: data.remaining / solPrice,
//     pnl: data.pnl / solPrice,
//     pnlPercentage: data.pnlPercentage,
//     lastBought: new Date().toISOString(),
//     investedBase: data.invested / solPrice,
//     soldBase: data.sold / solPrice,
//     price: {
//       usd: data.price,
//       sol: data.price / solPrice,
//     },
//   };
// };

const LoadingSkeleton = () => (
  <div className="flex h-[56px] w-full items-center pl-4">
    <div className="flex w-full min-w-[220px]">
      <div className="flex items-center gap-x-2">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="flex flex-col gap-y-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
    </div>
    <div className="flex w-full min-w-[80px]">
      <Skeleton className="h-4 w-20" />
    </div>
    <div className="flex w-full min-w-[80px]">
      <Skeleton className="h-4 w-20" />
    </div>
    <div className="flex w-full min-w-[120px]">
      <Skeleton className="h-4 w-24" />
    </div>
    <div className="flex w-full min-w-[90px]">
      <Skeleton className="h-4 w-24" />
    </div>
    <div className="flex w-full min-w-[140px]">
      <Skeleton className="h-4 w-24" />
    </div>
  </div>
);

const EmptyState = () => (
  <div className="flex h-full w-full flex-grow items-center justify-center py-5">
    <p className="text-center font-geistRegular text-sm text-fontColorSecondary">
      No holdings found for this wallet address.
    </p>
  </div>
);

function HoldingTable({
  isModalContent = true,
  searchQuery = "",
}: CommonTableProps) {
  const { remainingScreenWidth } = usePopupStore();
  const { width } = useWindowSizeStore();
  const theme = useCustomizeTheme();
  const isAnnouncementExist = useAnnouncementStore(
    (state) => state.isAnnouncementExist,
  );
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "recent",
    order: "ASC",
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const params = useParams();
  const isAppleEnvirontment = useDeviceAndBrowserForScrollbarStore(
    (state) => state.isAppleEnvirontment,
  );
  const isBrowserWithoutScrollbar = useDeviceAndBrowserForScrollbarStore(
    (state) => state.isBrowserWithoutScrollbar,
  );
  const {
    wallet: walletAddressState,
    holdingSortType,
    setHoldingSortType,
  } = useTradesWalletModalStore();

  const solPriceState = useSolPriceMessageStore(
    (state) => state.messages?.price,
  );

  const sortFunctions = {
    amount: (a: Holding, b: Holding, order: SortOrder) =>
      order === "ASC"
        ? Number(a.remaining_token_balance || 0) -
          Number(b.remaining_token_balance || 0)
        : Number(b.remaining_token_balance || 0) -
          Number(a.remaining_token_balance || 0),

    amountBought: (a: Holding, b: Holding, order: SortOrder) =>
      order === "ASC"
        ? Number(a.invested_usd * solPriceState || 0) -
          Number(b.invested_usd * solPriceState || 0)
        : Number(b.invested_usd * solPriceState || 0) -
          Number(a.invested_usd * solPriceState || 0),

    amountSold: (a: Holding, b: Holding, order: SortOrder) =>
      order === "ASC"
        ? Number(a.sold_base * solPriceState || 0) -
          Number(b.sold_base * solPriceState || 0)
        : Number(b.sold_base * solPriceState || 0) -
          Number(a.sold_base * solPriceState || 0),

    remaining: (a: Holding, b: Holding, order: SortOrder) =>
      order === "ASC"
        ? Number(a.remaining_token_balance || 0) -
          Number(b.remaining_token_balance || 0)
        : Number(b.remaining_token_balance || 0) -
          Number(a.remaining_token_balance || 0),

    pl: (a: Holding, b: Holding, order: SortOrder) => {
      const aPL = Number(a.realized_pnl_base || 0);
      const bPL = Number(b.realized_pnl_base || 0);
      return order === "ASC" ? aPL - bPL : bPL - aPL;
    },
    recent: (_a: Holding, _b: Holding, _order: SortOrder) => 0,
  };

  // Get wallet address from path params
  const walletAddress = useMemo(() => {
    if (!params) return null;
    if (isModalContent) return walletAddressState;
    return params["wallet-address"] as string;
  }, [params, isModalContent, walletAddressState]);

  const {
    data: walletStatsDataPortofolio,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["wallet-stats", walletAddress],
    queryFn: async () => {
      const res = await getPortofolioPnl(walletAddress || "");
      return res;
    },
    enabled: false,
  });

  // const {
  //   data: holdingsData,
  //   isLoading,
  //   isError,
  // } = useQuery({
  //   queryKey: ["wallet-trade-holding", walletAddress, holdingSortType],
  //   queryFn: async () => {
  //     if (walletAddress) {
  //       const res = await getWalletHoldings(
  //         walletAddress as string,
  //         holdingSortType,
  //       );
  //       return (res.data || [])?.map((data) =>
  //         transformHoldingData(data, solPriceState),
  //       );
  //     }
  //     return Promise.reject(new Error("Wallet address is not defined"));
  //   },
  //   enabled: !!walletAddress && !!solPriceState,
  // });

  // Filter and sort holdings
  const filteredAndSortedHoldings = useMemo(() => {
    const holdingsData = walletStatsDataPortofolio?.holdings;
    if (!holdingsData) return [];

    let filteredData = holdingsData;
    if (searchQuery && searchQuery.trim() !== "") {
      const lowercasedQuery = searchQuery.toLowerCase().trim();
      filteredData = (holdingsData || [])?.filter((holding) => {
        const tokenName = holding.name?.toLowerCase() ?? "";
        const tokenAddress = holding?.pool?.mint?.toLowerCase() ?? "";
        return (
          tokenName.includes(lowercasedQuery) ||
          tokenAddress.includes(lowercasedQuery)
        );
      });
    }

    const sortableData = [...filteredData];
    const sortFunction = sortFunctions[sortConfig.key];
    if (sortFunction) {
      sortableData.sort((a, b) => sortFunction(a, b, sortConfig.order));
    }

    return sortableData;
  }, [walletStatsDataPortofolio?.holdings, searchQuery, sortConfig]);

  const handleSort = (key: keyof typeof sortFunctions) => {
    setSortConfig((prev) => ({
      key,
      order: prev.key === key && prev.order === "ASC" ? "DESC" : "ASC",
    }));
  };

  useEffect(() => {
    if (holdingSortType) {
      handleSort(holdingSortType);
    }
  }, [holdingSortType]);

  const itemData = useMemo(
    () => ({
      items: filteredAndSortedHoldings!,
      column: 1,
      isModalContent: isModalContent,
      solPrice: solPriceState,
    }),
    [filteredAndSortedHoldings],
  );

  const getItemKey = (index: number) => {
    return itemData.items[index]?.pool.mint + index;
  };

  const isBrowser = typeof window !== "undefined";

  const fixedHeight = useMemo(() => {
    if (isModalContent) {
      if (width! > 768) return 275;
      return isBrowser ? window.innerHeight - 640 : 400;
    }

    if (width! > 1280) {
      return isBrowser
        ? window.innerHeight - (remainingScreenWidth < 1000 ? 620 : 560)
        : 500;
    }

    return isBrowser ? window.innerHeight - 588 : 500;
  }, [isModalContent, width, isBrowser, remainingScreenWidth]);

  const fixedSizeListHeight = useMemo(() => {
    const mobileCardSize = 124;
    const desktopCardSize = 56;
    if (isModalContent) {
      return width! < 768 ? mobileCardSize : desktopCardSize;
    }

    if (width! < 768) {
      return remainingScreenWidth < 800 ? mobileCardSize : desktopCardSize;
    }

    if (width! > 768 && remainingScreenWidth < 800) {
      return mobileCardSize;
    }

    return desktopCardSize;
  }, [isModalContent, width, remainingScreenWidth]);

  const HeaderData = [
    {
      label: "Token",
      tooltipContent: "Token name",
      className: "ml-4 min-w-[220px]",
    },
    {
      label: "Bought",
      tooltipContent: "Amount bought",
      className: "min-w-[80px]",
    },
    {
      label: "Sold",
      tooltipContent: "Amount sold",
      className: "min-w-[80px]",
    },
    {
      label: "Remaining",
      tooltipContent: "Remaining amount",
      className: "min-w-[120px]",
      sortButton: (
        <button
          onClick={() => handleSort("remaining")}
          className="flex cursor-pointer items-center -space-x-[7.5px]"
        >
          <HiArrowNarrowUp
            className={cn(
              "text-sm duration-300",
              sortConfig.key === "remaining" && sortConfig.order === "ASC"
                ? "text-[#DF74FF]"
                : "text-fontColorSecondary",
            )}
          />
          <HiArrowNarrowDown
            className={cn(
              "text-sm duration-300",
              sortConfig.key === "remaining" && sortConfig.order === "DESC"
                ? "text-[#DF74FF]"
                : "text-fontColorSecondary",
            )}
          />
        </button>
      ),
    },
    {
      label: "P&L",
      tooltipContent: "Profit and Loss",
      className: "min-w-[90px]",
    },
    {
      label: "Share",
      tooltipContent: "Share PnL",
      className: `min-w-[140px] ${isAppleEnvirontment || isBrowserWithoutScrollbar ? "pr-0" : filteredAndSortedHoldings?.length * 56 > 275 && isModalContent ? "pr-8" : filteredAndSortedHoldings?.length * 56 > 432 ? "pr-4" : "pr-0"}`,
    },
  ];

  return (
    <div className="flex h-full w-full flex-grow flex-col overflow-hidden">
      {/* Table headers */}
      <div
        className={cn(
          "z-[9] hidden h-[40px] flex-shrink-0 items-center bg-card md:flex",
          remainingScreenWidth < 800 && !isModalContent && "md:hidden",
        )}
        style={theme.background}
      >
        {(HeaderData || [])?.map((item, index) => (
          <HeadCol
            isWithBorder={false}
            key={index}
            {...item}
            labelClassName="text-xs"
          />
        ))}
      </div>
      {/* Amount or Recent on Mobile */}
      <div
        className={cn(
          "p-3.5 pb-0 md:hidden",
          remainingScreenWidth < 800 &&
            !isModalContent &&
            "flex-grow md:flex md:p-0 md:pt-3",
        )}
        style={theme.background}
      >
        <div className="flex h-8 w-full items-center rounded-[8px] border border-border p-[3px]">
          <div className="flex h-full w-full items-center rounded-[6px] bg-white/[6%]">
            <button
              onClick={() => {
                setHoldingSortType("amount");
              }}
              className={cn(
                "flex h-[20px] w-full items-center justify-center gap-x-2 rounded-[6px] duration-300",
                holdingSortType === "amount" && "bg-white/[6%]",
              )}
            >
              <span className="inline-block text-nowrap font-geistSemiBold text-sm text-fontColorPrimary">
                Amount
              </span>
            </button>
            <button
              onClick={() => {
                setHoldingSortType("recent");
              }}
              className={cn(
                "flex h-[20px] w-full items-center justify-center gap-x-2 rounded-[6px] bg-transparent duration-300",
                holdingSortType === "recent" && "bg-white/[6%]",
              )}
            >
              <span className="inline-block text-nowrap font-geistSemiBold text-sm text-fontColorPrimary">
                Recent
              </span>
            </button>
          </div>
        </div>
      </div>

      <div
        ref={containerRef}
        className={cn(
          "relative flex h-full w-full flex-grow flex-col overflow-auto max-md:p-3",
          remainingScreenWidth < 800 && !isModalContent && "md:p-0 md:pt-3",
        )}
        style={theme.background}
      >
        {isLoading ? (
          <>
            {remainingScreenWidth < 800 && !isModalContent ? (
              <div
                className={cn(
                  "flex h-[calc(100vh_-_590px)] w-full flex-row items-center justify-center gap-2 md:hidden xl:h-[calc(100vh_-_560px)]",
                  isModalContent && "h-[286px] overflow-y-auto",
                  remainingScreenWidth < 800 && "md:flex",
                )}
              >
                <LoaderCircle
                  size={16}
                  className="animate-spin text-fontColorSecondary"
                />
                <span className="text-sm text-fontColorSecondary">
                  Loading holding tokens..
                </span>
              </div>
            ) : (
              <div
                className={cn(
                  "nova-scroller hidden h-full w-full flex-col gap-y-2 overflow-x-hidden overflow-y-scroll md:flex",
                )}
                style={{
                  height:
                    isAnnouncementExist && !isModalContent
                      ? fixedHeight - 40
                      : fixedHeight,
                }}
              >
                {Array.from({ length: 10 })?.map((_, index) => (
                  <div
                    key={`loading-skeleton-${index}`}
                    className={cn(
                      "max-md:mb-2",
                      index % 2 === 0 ? "bg-white/[4%]" : "",
                    )}
                    style={theme.background}
                  >
                    <LoadingSkeleton />
                  </div>
                ))}
              </div>
            )}
          </>
        ) : isError && !isLoading ? (
          <EmptyState />
        ) : !filteredAndSortedHoldings?.length && !isLoading ? (
          <EmptyState />
        ) : (
          <>
            <div className="nova-scroller relative flex w-full flex-grow overflow-hidden">
              <FixedSizeList
                height={
                  isAnnouncementExist && !isModalContent
                    ? fixedHeight - 40
                    : fixedHeight
                }
                width="100%"
                itemCount={filteredAndSortedHoldings.length}
                itemSize={fixedSizeListHeight}
                overscanCount={3}
                itemKey={getItemKey}
                itemData={itemData}
                style={theme.background}
              >
                {VirtualizedHoldingRow}
              </FixedSizeList>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default memo(HoldingTable);
