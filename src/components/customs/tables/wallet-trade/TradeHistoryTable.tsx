"use client";

// ######## Libraries 📦 & Hooks 🪝 ########
import { useTradeHistoryTableSettingStore } from "@/stores/table/wallet-trade/use-trade-history-table-setting.store";
// ######## Components 🧩 ########
import HeadCol from "@/components/customs/tables/HeadCol";
// ######## Utils & Helpers 🤝 ########
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/libraries/utils";
import { useTradesWalletModalStore } from "@/stores/token/use-trades-wallet-modal.store";
import { usePopupStore } from "@/stores/use-popup-state.store";
import { useWindowSizeStore } from "@/stores/use-window-size.store";
import { LoaderCircle } from "lucide-react";
import { useParams } from "next/navigation";
import { memo, useMemo } from "react";
import SortButton from "../../SortButton";
import { FixedSizeList } from "react-window";
import VirtualizedTradeHistoryRow from "./VirtualizedTradeHistory";
import { useAnnouncementStore } from "@/stores/use-announcement.store";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useCustomizeTheme } from "@/hooks/use-customize-theme";
import { useDeviceAndBrowserForScrollbarStore } from "@/stores/use-device-and-browser-for-scrollbar-state.store";
import {
  getTradeHistory,
} from "@/apis/rest/wallet-trade-new";

export type CommonTableProps = {
  isModalContent?: boolean;
  searchQuery?: string;
};

export const LoadingSkeleton = ({
  isModalContent,
  remainingScreenWidth,
}: {
  isModalContent?: boolean;
  remainingScreenWidth?: number;
}) => (
  <div className="flex h-[56px] w-full items-center">
    <div
      className={`${!isModalContent && "lg:min-w-[168px]"} ${remainingScreenWidth! < 1280 && !isModalContent && "lg:min-w-[72px]"} ml-4 w-auto min-w-[72px] px-0`}
    >
      <Skeleton className="h-4 w-10" />
    </div>
    <div className="flex w-full min-w-[200px] lg:min-w-[240px]">
      <div className="flex items-center gap-x-2">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="flex flex-col gap-y-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
    </div>
    <div className="flex w-full min-w-[115px]">
      <Skeleton className="h-4 w-20" />
    </div>
    <div className="flex w-full min-w-[70px]">
      <Skeleton className="h-4 w-20" />
    </div>
    <div className="flex w-full min-w-[125px]">
      <Skeleton className="h-4 w-24" />
    </div>
  </div>
);

const EmptyState = () => (
  <div className="flex h-full w-full flex-grow items-center justify-center py-5">
    <p className="text-center font-geistRegular text-sm text-fontColorSecondary">
      No trade history found for this wallet address.
    </p>
  </div>
);

// Utility function to convert USD to SOL using token price
// const convertUsdToSol = (usdValue: number, tokenPriceUsd: string): string => {
//   const price = parseFloat(tokenPriceUsd);
//   if (isNaN(price) || price === 0) return "0";
//   const solValue = usdValue / price;
//   return solValue.toFixed(4);
// };

export default memo(function TradeHistoryTable({
  isModalContent = true,
  searchQuery = "",
}: CommonTableProps) {
  const {
    type,
    setType,
    valueCurrency,
    setValueCurrency,
    totalCurrency,
    setTotalCurrency,
  } = useTradeHistoryTableSettingStore();
  const { width } = useWindowSizeStore();
  const theme = useCustomizeTheme();
  const { remainingScreenWidth } = usePopupStore();
  const { wallet: walletAddressState } = useTradesWalletModalStore();
  const params = useParams();
  const isAppleEnvirontment = useDeviceAndBrowserForScrollbarStore(
    (state) => state.isAppleEnvirontment,
  );
  const isBrowserWithoutScrollbar = useDeviceAndBrowserForScrollbarStore(
    (state) => state.isBrowserWithoutScrollbar,
  );
  const isAnnouncementExist = useAnnouncementStore(
    (state) => state.isAnnouncementExist,
  );

  // Get wallet address from path params
  const walletAddress = useMemo(() => {
    if (!params) return null;
    if (isModalContent) return walletAddressState;
    return params["wallet-address"] as string;
  }, [params, isModalContent, walletAddressState]);

  // const {
  //   data: tradeHistoryData,
  //   isLoading,
  //   isError,
  // } = useQuery({
  //   queryKey: ["wallet-trade-history", walletAddress],
  //   queryFn: async () => {
  //     const res = await getWalletTradeHistory(walletAddress as string);
  //     return res.data.results;
  //   },
  // });

  const {
    data: tradeHistoryData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: ["wallet-trade-history", walletAddress],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await getTradeHistory(walletAddress as string, pageParam);
      return res;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      // Adjust this logic depending on your API
      const hasMore = lastPage.hasNextPage;
      return hasMore ? allPages.length + 1 : undefined;
    },
  });

  // const {
  //   data: tradeHistoryData,
  //   isLoading,
  //   isError,
  //   refetch: fetchNextPage,
  // } = useQuery({
  //   queryKey: ["wallet-trade-history", walletAddress, page],
  //   queryFn: async () => {
  //     const res = await getTradeHistory(walletAddress as string, page);
  //     return res;
  //   },
  //   placeholderData: keepPreviousData,
  // });

  // Filter and sort transactions based on type and search query
  const filteredAndSortedTransactions = useMemo(() => {
    const pages = tradeHistoryData?.pages || [];

    // Flatten all transactions
    const transactions = pages.flatMap((page) => page.transactions || []);
    if (!Array.isArray(transactions)) return [];

    // Deduplicate by signature
    const seenSignatures = new Set<string>();
    const dedupedTransactions = transactions.filter((tx) => {
      if (seenSignatures.has(tx.signature)) return false;
      seenSignatures.add(tx.signature);
      return true;
    });

    // Sort by timestamp descending
    const sorted = dedupedTransactions.sort(
      (a, b) => +b.timestamp - +a.timestamp,
    );

    // Filter by method if needed
    switch (type) {
      case "ALL":
        return sorted;
      default:
        return sorted.filter(
          (tx) => tx?.method?.toLowerCase() === type?.toLowerCase(),
        );
    }
  }, [tradeHistoryData, type, searchQuery]);

  const HeaderData = [
    {
      label: "Age",
      tooltipContent: "The time passed since the trade was made.",
      className: `${!isModalContent && "lg:min-w-[168px]"} ${remainingScreenWidth < 1280 && !isModalContent && "lg:min-w-[72px]"} min-w-[72px] px-0 ml-4 w-auto`,
      labelClassName: "md:text-xs lg:text-sm uppercase font-geistSemiBold",
    },
    {
      label: "Type",
      labelClassName: "md:text-xs lg:text-sm uppercase font-geistSemiBold",
      sortButton: (
        <div className="flex h-[20px] w-auto items-center justify-center rounded-[10px] bg-secondary p-1">
          <button
            onClick={() => setType(type === "BUY" ? "ALL" : "BUY")}
            className={cn(
              "inline-block cursor-pointer rounded-[12px] px-1.5 font-geistSemiBold text-xs leading-[14px] text-success duration-300",
              type === "BUY" && "bg-white/10",
            )}
          >
            B
          </button>
          <button
            onClick={() => setType(type === "SELL" ? "ALL" : "SELL")}
            className={cn(
              "inline-block cursor-pointer rounded-[12px] px-1.5 font-geistSemiBold text-xs leading-[14px] text-destructive duration-300",
              type === "SELL" && "bg-white/10",
            )}
          >
            S
          </button>
        </div>
      ),
      tooltipContent: "The type of transaction made.",
      className: "min-w-[240px] lg:min-w-[260px] px-0",
    },
    {
      label: "Value",
      labelClassName: "md:text-xs lg:text-sm uppercase font-geistSemiBold",
      sortButton: (
        <SortButton
          type="usdc-or-sol"
          value={valueCurrency}
          setValue={setValueCurrency}
        />
      ),
      tooltipContent: "The total value of the transaction made in SOL/USD.",
      className: "min-w-[115px] lg:min-w-[125px] px-0",
    },
    {
      label: "Amount",
      labelClassName: "md:text-xs lg:text-sm uppercase font-geistSemiBold",
      tooltipContent: "The amount of tokens traded.",
      className: `min-w-[70px] px-0 lg:min-w-[155px] ${remainingScreenWidth < 1280 && "lg:min-w-[70px]"}`,
    },
    {
      label: "Total",
      labelClassName: "md:text-xs lg:text-sm uppercase font-geistSemiBold",
      sortButton: (
        <SortButton
          type="usdc-or-sol"
          value={totalCurrency}
          setValue={setTotalCurrency}
        />
      ),
      tooltipContent: "The total value of the transaction made in SOL/USD.",
      className: `min-w-[125px] px-0 lg:min-w-[175px] ${isAppleEnvirontment || isBrowserWithoutScrollbar ? "pr-0" : filteredAndSortedTransactions?.length * 56 > 275 ? "pr-4" : "pr-0"}`,
    },
  ];

  const itemData = useMemo(
    () => ({
      items: filteredAndSortedTransactions!,
      isLoadingNextPage: isFetchingNextPage,
      column: 1,
      isModalContent: isModalContent,
      walletAddress: walletAddress ?? walletAddressState,
    }),
    [filteredAndSortedTransactions, tradeHistoryData, isFetchingNextPage],
  );

  // const getItemKey = useMemo((index: number) => {
  //   const base = itemData.items[index]?.timestamp ?? Date.now();
  //   const uniquePart = `${index}-${crypto.randomUUID()}`;
  //   return `${base}-${uniquePart}`;
  // }, []);

  const getItemKey = useMemo(() => {
    const cache = new Map<number, string>();

    return (index: number) => {
      if (!cache.has(index)) {
        const base = itemData.items[index]?.timestamp ?? Date.now();
        const uniquePart = `${index}-${crypto.randomUUID()}`;
        cache.set(index, `${base}-${uniquePart}`);
      }

      return cache.get(index)!;
    };
  }, [itemData]);

  const isBrowser = typeof window !== "undefined";

  const fixedHeight = useMemo(() => {
    if (isModalContent) {
      if (width! > 768) return 275;
      return isBrowser ? window.innerHeight - 600 : 400;
    }

    if (width! > 1280) {
      return isBrowser
        ? window.innerHeight - (remainingScreenWidth < 1000 ? 600 : 560)
        : 500;
    }

    return isBrowser ? window.innerHeight - 540 : 500;
  }, [isModalContent, width, isBrowser, remainingScreenWidth]);

  const fixedSizeListHeight = useMemo(() => {
    if (isModalContent) {
      return width! < 768 ? 182 : 56;
    }

    if (width! < 768) {
      return remainingScreenWidth < 800 ? 182 : 56;
    }

    if (width! > 768 && remainingScreenWidth < 800) {
      return 182;
    }

    return 56;
  }, [isModalContent, width, remainingScreenWidth]);

  return (
    <div className="flex w-full flex-grow flex-col">
      {/* Table headers */}
      <div
        className={cn(
          "z-[9] hidden h-[40px] flex-shrink-0 items-center bg-card md:flex",
          remainingScreenWidth < 768 && !isModalContent && "md:hidden",
        )}
        style={theme.background2}
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
      <div
        className={cn(
          "relative flex h-full w-full flex-grow flex-col overflow-auto max-md:p-3",
          remainingScreenWidth < 768 && !isModalContent && "md:p-0 md:pt-3",
        )}
        style={theme.background2}
      >
        {isLoading ? (
          <>
            {remainingScreenWidth < 768 && !isModalContent ? (
              <div
                className={cn(
                  "flex h-[calc(100vh_-_590px)] w-full flex-row items-center justify-center gap-2 md:hidden xl:h-[calc(100vh_-_560px)]",
                  isModalContent && "h-[286px] overflow-y-auto",
                  remainingScreenWidth < 768 && "md:flex",
                )}
              >
                <LoaderCircle
                  size={16}
                  className="animate-spin text-fontColorSecondary"
                />
                <span className="text-sm text-fontColorSecondary">
                  Loading trade history tokens..
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
                    <LoadingSkeleton
                      isModalContent={isModalContent}
                      remainingScreenWidth={remainingScreenWidth}
                    />
                  </div>
                ))}
              </div>
            )}
          </>
        ) : isError && !isLoading ? (
          <EmptyState />
        ) : !filteredAndSortedTransactions?.length && !isLoading ? (
          <EmptyState />
        ) : (
          <>
            <div
              suppressHydrationWarning
              className="nova-scroller relative flex w-full flex-grow overflow-hidden"
            >
              <FixedSizeList
                height={
                  isAnnouncementExist && !isModalContent
                    ? fixedHeight - 40
                    : fixedHeight
                }
                width="100%"
                itemCount={filteredAndSortedTransactions!.length}
                itemSize={fixedSizeListHeight}
                itemKey={getItemKey}
                itemData={itemData}
                style={theme.background2}
                onItemsRendered={({ visibleStopIndex }) => {
                  const threshold = 5; // items before end to trigger
                  if (
                    hasNextPage &&
                    visibleStopIndex >=
                      filteredAndSortedTransactions!.length - threshold &&
                    !isFetchingNextPage
                  ) {
                    fetchNextPage();
                  }
                }}
              >
                {VirtualizedTradeHistoryRow}
              </FixedSizeList>
            </div>
          </>
        )}
      </div>
    </div>
  );
});
