"use client";

// ######## Libraries 📦 & Hooks 🪝 ########
import { useParams } from "next/navigation";
// ######## Components 🧩 ########
import HeadCol from "@/components/customs/tables/HeadCol";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/libraries/utils";
import { useTradesWalletModalStore } from "@/stores/token/use-trades-wallet-modal.store";
import { usePopupStore } from "@/stores/use-popup-state.store";
import { LoaderCircle } from "lucide-react";
import { memo, useMemo } from "react";
import { CommonTableProps } from "./TradeHistoryTable";
import { FixedSizeList } from "react-window";
import { useAnnouncementStore } from "@/stores/use-announcement.store";
import { useWindowSizeStore } from "@/stores/use-window-size.store";
import { useQuery } from "@tanstack/react-query";
import VirtualizedMostProfitableRow from "./VirtualizedMostProfitableRow";
import { useMostProfitableTableSettingStore } from "@/stores/table/wallet-trade/use-most-profitable-table-setting.store";
import SortButton from "../../SortButton";
import { useCustomizeTheme } from "@/hooks/use-customize-theme";
import { useDeviceAndBrowserForScrollbarStore } from "@/stores/use-device-and-browser-for-scrollbar-state.store";
import { getPortofolioPnl } from "@/apis/rest/wallet-trade-new";

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
      No profitable tokens found for this wallet address.
    </p>
  </div>
);

function MostProfitableTable({
  isModalContent = true,
  searchQuery = "",
}: CommonTableProps) {
  const theme = useCustomizeTheme();
  const { remainingScreenWidth } = usePopupStore();
  const { width } = useWindowSizeStore();
  const { pnlCurrency, togglePnlCurrency } =
    useMostProfitableTableSettingStore();
  const { wallet: walletAddressState } = useTradesWalletModalStore();
  const isAnnouncementExist = useAnnouncementStore(
    (state) => state.isAnnouncementExist,
  );
  const params = useParams();
  const isAppleEnvirontment = useDeviceAndBrowserForScrollbarStore(
    (state) => state.isAppleEnvirontment,
  );
  const isBrowserWithoutScrollbar = useDeviceAndBrowserForScrollbarStore(
    (state) => state.isBrowserWithoutScrollbar,
  );

  // Get wallet address from path params
  const walletAddress = useMemo(() => {
    if (!params) return null;
    if (isModalContent) return walletAddressState;
    return params["wallet-address"] as string;
  }, [params, isModalContent, walletAddressState]);

  // const {
  //   data: profitableTokens,
  //   isLoading,
  //   isError,
  // } = useQuery({
  //   queryKey: ["wallet-most-profitable", walletAddress],
  //   queryFn: async () => {
  //     const res = await getMostProfitableTokens(
  //       walletAddress as string,
  //       selectedTimeframe,
  //     );
  //     return res.data;
  //   },
  // });

  const {
    data: walletStatsDataPortofolio,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["wallet-stats", walletAddress],
    queryFn: async () => {
      const res = await getPortofolioPnl(walletAddress!);
      return res;
    },
    enabled: false,
  });

  const filteredTokens = useMemo(() => {
    const profitableTokens = walletStatsDataPortofolio?.top_pnl || [];

    if (!profitableTokens) return [];
    if (!searchQuery) return profitableTokens;

    const lowercasedQuery = searchQuery.toLowerCase();

    return (profitableTokens || []).filter(
      (token) =>
        token.name.toLowerCase().includes(lowercasedQuery) ||
        token?.pool?.mint.toLowerCase().includes(lowercasedQuery),
    );
  }, [walletStatsDataPortofolio?.top_pnl, searchQuery]);

  const itemData = useMemo(
    () => ({
      items: filteredTokens!,
      column: 1,
      isModalContent: isModalContent,
    }),
    [filteredTokens],
  );

  // const getItemKey = (index: number) => {
  //   return itemData.items[index]?.address || index;
  // };

  const getItemKey = useMemo(() => {
    const cache = new Map<number, string>();

    return (index: number) => {
      if (!cache.has(index)) {
        const base = itemData.items[index]?.pool?.mint ?? Date.now();
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
      return width! < 768 ? 128 : 56;
    }

    if (width! < 768) {
      return remainingScreenWidth < 800 ? 128 : 56;
    }

    if (width! > 768 && remainingScreenWidth < 800) {
      return 128;
    }

    return 56;
  }, [isModalContent, width, remainingScreenWidth]);

  const headerData = [
    {
      label: "Token",
      tooltipContent: "Token Information",
      className: "ml-4 min-w-[220px]",
    },
    {
      label: "Bought",
      tooltipContent: "Invested Information",
      className: "min-w-[80px]",
    },
    {
      label: "Sold",
      tooltipContent: "Sold Information",
      className: "min-w-[80px]",
    },
    {
      label: (
        <div className="flex items-center gap-x-1">
          <p>P&L</p>
          <SortButton
            type="usdc-or-sol"
            value={pnlCurrency}
            setValue={togglePnlCurrency}
          />
        </div>
      ),
      tooltipContent: "P&L Information",
      className: "min-w-[120px]",
    },
    {
      label: "P&L %",
      tooltipContent: "P&L % Information",
      className: "min-w-[90px]",
    },
    {
      label: "Share",
      tooltipContent: "Share Information",
      className: `min-w-[140px] ${isAppleEnvirontment || isBrowserWithoutScrollbar ? "pr-0" : filteredTokens?.length * 56 > 275 && isModalContent ? "pr-8" : filteredTokens?.length * 56 > 432 ? "pr-4" : "pr-0"}`,
    },
  ];

  return (
    <div className="flex w-full flex-grow flex-col">
      {/* Table headers */}
      <div
        className={cn(
          "z-[9] hidden h-[40px] flex-shrink-0 items-center bg-card md:flex",
          remainingScreenWidth < 800 && !isModalContent && "md:hidden",
        )}
        style={theme.background2}
      >
        {(headerData || [])?.map((item, index) => (
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
          "relative flex h-full w-full flex-grow flex-col border-t border-border max-md:p-3",
          remainingScreenWidth < 800 && !isModalContent && "md:p-0 md:pt-3",
        )}
        style={theme.background2}
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
                  Loading most profitable tokens..
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
        ) : !filteredTokens?.length && !isLoading ? (
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
                itemCount={filteredTokens!.length}
                itemSize={fixedSizeListHeight}
                overscanCount={3}
                itemKey={getItemKey}
                itemData={itemData}
                style={theme.background2}
              >
                {VirtualizedMostProfitableRow}
              </FixedSizeList>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default memo(MostProfitableTable);
