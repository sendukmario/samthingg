"use client";

// ######## Libraries 📦 & Hooks 🪝 ########
import React, {
  useCallback,
  useEffect,
  useState,
  useMemo,
  useRef,
} from "react";
import { useParams } from "next/navigation";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
// ######## Stores 🏪 ########
import { useTradesTableSettingStore } from "@/stores/table/token/use-trades-table-setting.store";
import { useTokenCardsFilter } from "@/stores/token/use-token-cards-filter.store";
import { useTokenMessageStore } from "@/stores/token/use-token-messages.store";
import { useFilteredWalletTradesStore } from "@/stores/token/use-filtered-wallet-trades.store";
import { useCurrentTokenDeveloperTradesStore } from "@/stores/token/use-current-token-developer-trades";
import { useTokenCardsFilterStorePersist } from "@/stores/token/use-token-cards-filter-persist.store";
import { useOpenCustomTable } from "@/stores/token/use-open-custom-table.store";
import { usePopupStore } from "@/stores/use-popup-state.store";
import { useTokenMarketCapToggleState } from "@/stores/token/use-token-market-cap-toggle.store";
import { useWalletFilterStore } from "@/stores/use-wallet-filter.store";
import { useDeviceAndBrowserForScrollbarStore } from "@/stores/use-device-and-browser-for-scrollbar-state.store";
// ######## APIs 🛜 ########
import { getTradesTasks, TransactionType } from "@/apis/rest/trades";
// ######## Components 🧩 ########
import SortButton from "@/components/customs/SortButton";
import HeadCol from "@/components/customs/tables/HeadCol";
import TradesCard from "@/components/customs/cards/token/TradesCard";
import TradesMakerFilter from "@/components/customs/tables/token/Trades/TradesMakerFilter";
import TradesTypeFilter from "@/components/customs/tables/token/Trades/TradesTypeFilter";
import TradesMarketCapTokenToggle from "@/components/customs/tables/token/Trades/TradesMarketCapTokenToggle";
import WalletTrackerModal from "@/components/customs/modals/WalletTrackerModal";
import { HiArrowNarrowUp, HiArrowNarrowDown } from "react-icons/hi";
import { Skeleton } from "@/components/ui/skeleton";
// ######## Utils & Helpers 🤝 ########
import { cn } from "@/libraries/utils";
import { truncateAddress } from "@/utils/truncateAddress";
// ######## Types 🗨️ ########
import { TokenDataMessageType, TransactionInfo } from "@/types/ws-general";
import { Trade } from "@/types/nova_tv.types";
import { useTokenPersist } from "@/stores/token/use-token-persist.store";
import { useCustomizeTheme } from "@/hooks/use-customize-theme";
import { convertTradesLamports } from "@/utils/lamportsConverter";
import { areEqual, FixedSizeList } from "react-window";

// Constants
const TRADES_LIMIT = 50; // Default limit for non-realtime fetches
const REALTIME_FETCH_LIMIT = 100; // Limit for initial fetch in real-time mode
const MAX_DISPLAY_TRADES = 100; // Max combined trades (fetched + WS) to display in real-time mode

// Loading Component
// const LoadingState = ({ text = "Loading..." }: { text?: string }) => {
//   return (
//     <div className="flex h-[60px] flex-grow items-center justify-center bg-shadeTable px-4 sm:h-[80px]">
//       <div className="flex items-center gap-2 text-fontColorPrimary">
//         <div className="relative aspect-square h-5 w-5 flex-shrink-0">
//           <Image
//             src="/icons/search-loading.png"
//             alt="Loading Icon"
//             fill
//             quality={100}
//             className="animate-spin object-contain"
//           />
//         </div>
//         <span>{text}</span>
//       </div>
//     </div>
//   );
// };

const getTransactionKey = (tx: TransactionInfo): string =>
  `${tx.method}-${tx.maker}-${tx.signature}`;

export default React.memo(function TradesTable({
  initData,
}: {
  initData: TokenDataMessageType | null;
}) {
  const theme = useCustomizeTheme();
  const params = useParams();
  const { remainingScreenWidth } = usePopupStore();

  // Component State
  const listRef = useRef<HTMLDivElement>(null);
  // const [walletFilter, setWalletFilter] = useState("");
  const walletFilter = useWalletFilterStore((state) => state.walletFilter);
  const setWalletFilter = useWalletFilterStore(
    (state) => state.setWalletFilter,
  );
  const [walletFilterTemp, setWalletFilterTemp] = useState<string>(""); // Temp state for filter modal
  const [openWalletMakerFilter, setOpenWalletMakerFilter] = useState(false);

  // Zustand Stores
  const { tradesDate, setTradesDate, tradesType, tradesTotal, resetFilters } =
    useTokenCardsFilter();
  const { tradesValue, tradesTokenSol, setTradesValue, setTradesTokenSol } =
    useTokenPersist();
  const { setTradesDateType, tradesDateType } =
    useTokenCardsFilterStorePersist();
  const tokenMarketCap = useTokenMarketCapToggleState((state) => state.column);
  const setTokenMarketCap = useTokenMarketCapToggleState(
    (state) => state.setColumn,
  );

  const setScrollOffsetValue = useTradesTableSettingStore(
    (state) => state.setScrollOffsetValue,
  );
  const transactionMessages = useTokenMessageStore(
    (state) => state.transactionMessages,
  );
  const developerAddress = useTokenMessageStore(
    (state) => state.dataSecurityMessage.deployer,
  );
  // const tokenIsUSD = useTokenMessageStore(
  //   (state) => state.tokenInfoMessage.is_usd,
  // );
  const {
    setFilteredWallet,
    setFilteredWalletTrades,
    resetFilteredWalletTradesState,
  } = useFilteredWalletTradesStore();
  const {
    setCurrentTokenDeveloperTradesMint,
    setCurrentTokenDeveloperTrades,
    resetCurrentTokenDeveloperTradesState,
  } = useCurrentTokenDeveloperTradesStore();
  const { selectedTableColumns } = useOpenCustomTable();

  const [isInitState, setInitState] = useState(true);

  // Derived values
  const mintOrPoolAddress = (params?.["mint-address"] ||
    params?.["pool-address"]) as string;
  const activeTradeTypes = useMemo(
    () =>
      Object.entries(tradesType)
        ?.filter(([_, isActive]) => isActive)
        ?.map(([type]) => type) as TransactionType[],
    [tradesType],
  );
  const isRealTimeMode = useMemo(() => tradesDate === "DESC", [tradesDate]);

  // Reset filters on mount
  useEffect(() => {
    resetFilters();
    setScrollOffsetValue(0);
    if (mintOrPoolAddress) {
      setCurrentTokenDeveloperTradesMint(mintOrPoolAddress);
    }
    return () => {
      resetFilteredWalletTradesState();
      resetCurrentTokenDeveloperTradesState();
    };
  }, [mintOrPoolAddress]); // Re-run if address changes

  // --- Data Fetching with useQuery ---
  const queryKey = useMemo(
    () => [
      `trades-${mintOrPoolAddress}`, // Base key
      tradesDate,
      walletFilter,
      tradesTotal,
      activeTradeTypes,
      isRealTimeMode, // Include mode in key to differentiate fetch logic
    ],
    [
      mintOrPoolAddress,
      tradesDate,
      walletFilter,
      tradesTotal,
      activeTradeTypes,
      isRealTimeMode,
    ],
  );

  // console.log("Query Key:", tradesTotal)
  const {
    data: fetchedTransactions, // Renamed data for clarity
    isLoading: isLoadingTrades, // Initial load or load after filter change
    isFetching: isRefetching, // Background refetching (e.g., window focus)
    isError,
    error,
  } = useQuery({
    // Changed to useQuery
    queryKey: queryKey,
    queryFn: async () => {
      // Determine limit based on mode
      const limit = isRealTimeMode ? REALTIME_FETCH_LIMIT : TRADES_LIMIT;
      const offset = 0; // Always fetch from the beginning

      // console.log(
      //   `Fetching trades (Mode: ${isRealTimeMode ? "Real-time" : "Filtered/Sorted"}) - Limit: ${limit}, Offset: ${offset}, Key:`,
      //   queryKey,
      // );

      const res =
        (await getTradesTasks({
          order: tradesDate?.toLowerCase() as "asc" | "desc",
          limit: limit,
          offset: offset,
          maker: walletFilter,
          mint: mintOrPoolAddress,
          min_sol: tradesTotal.min,
          max_sol: tradesTotal.max,
          methods: activeTradeTypes,
        })) || [];

      // Handle potential API error structure
      if (
        typeof res === "object" &&
        res !== null &&
        "success" in res &&
        !(res as { success: boolean }).success &&
        !Array.isArray(res)
      ) {
        console.warn("API Error fetching trades:", res);
        throw new Error("Failed to fetch trades");
      }
      return convertTradesLamports({
        decimals: {
          base_decimals: initData?.token?.base_decimals || 0,
          quote_decimals: initData?.token?.quote_decimals || 0,
        },
        trades: res as TransactionInfo[],
        supply_str: initData?.token?.supply_str,
      });
    },
    // Use initialData only if filters match the initial state AND it's real-time mode
    initialData: () => {
      const isDefaultFilterState =
        !walletFilter &&
        tradesDate === "DESC" && // Only use for default real-time view
        !tradesTotal.min &&
        !tradesTotal.max &&
        activeTradeTypes.length === 4; // All 4 trade types active (buy, sell, add, remove)

      // console.log(
      //   "BALALALAAA⭕⭕⭕",
      //   isDefaultFilterState && initData?.transactions,
      // );
      if (isDefaultFilterState && initData?.transactions) {
        // Return data directly, not the infinite query structure
        return convertTradesLamports({
          decimals: {
            base_decimals: initData?.token?.base_decimals || 0,
            quote_decimals: initData?.token?.quote_decimals || 0,
          },
          trades: initData.transactions,
          supply_str: initData?.token?.supply_str,
        });
      }
      return undefined;
    },
    enabled: !!mintOrPoolAddress, // Only fetch when address is available
    placeholderData: keepPreviousData, // Keep showing old data while refetching on filter change
    refetchOnWindowFocus: false, // Optional: disable window focus refetching
    // Removed: getNextPageParam, initialPageParam
  });

  const solanaHighestTransactionValue = useRef<number>(0);

  // --- Combine Fetched Data with Real-time Messages ---
  const displayedTransactions = useMemo(() => {
    const currentFetched = fetchedTransactions || [];
    const dataExists =
      transactionMessages.length > 0 ||
      currentFetched.length > 0 ||
      (initData && initData?.transactions?.length > 0);
    if (!dataExists) return [];

    if (isInitState && transactionMessages.length > 0) {
      // console.log("TRANSACTIONS 🔵 - Init")
      setInitState(false);
      const initState =
        (initData?.transactions?.length
          ? convertTradesLamports({
              decimals: {
                base_decimals: initData?.token?.base_decimals || 9,
                quote_decimals: initData?.token?.quote_decimals || 9,
              },
              trades: initData?.transactions as TransactionInfo[],
              supply_str: initData?.token?.supply_str,
            })
          : currentFetched.length
            ? convertTradesLamports({
                decimals: {
                  base_decimals: currentFetched[0]?.base_decimals || 9,
                  quote_decimals: currentFetched[0]?.quote_decimals || 9,
                },
                trades: currentFetched as TransactionInfo[],
                supply_str: initData?.token?.supply_str,
              })
            : transactionMessages?.length
              ? transactionMessages
              : []) || [];

      return initState;
    }

    if (isRealTimeMode) {
      /* console.log("TRANSACTIONS 🔵 - Realtime") */ const uniqueTransactions =
        new Map<string, TransactionInfo>();

      // Add real-time messages first (newest)
      (transactionMessages || [])
        ?.filter((tx) => {
          if (!tradesType[tx.method as keyof typeof tradesType]) return false;

          if (walletFilter && tx.maker !== walletFilter) return false;

          if (tradesTotal.min > 0 || tradesTotal.max > 0) {
            return (
              tx.base_amount >= tradesTotal.min &&
              (tradesTotal.max > 0 ? tx.base_amount <= tradesTotal.max : true)
            );
          } else {
            return true;
          }
        })
        .forEach((tx) => {
          uniqueTransactions.set(getTransactionKey(tx), tx);
        });

      // Add fetched transactions (potentially older, will be overwritten by newer WS if key matches)
      (currentFetched || [])
        ?.filter((tx) => {
          if (!tradesType[tx.method as keyof typeof tradesType]) return false;

          if (walletFilter && tx.maker !== walletFilter) return false;

          if (tradesTotal.min > 0 || tradesTotal.max > 0) {
            return (
              tx.base_amount >= tradesTotal.min &&
              (tradesTotal.max > 0 ? tx.base_amount <= tradesTotal.max : true)
            );
          } else {
            return true;
          }
        })
        .forEach((tx) => {
          uniqueTransactions.set(getTransactionKey(tx), tx);
        });

      let combined = Array.from(uniqueTransactions.values());

      // Sort DESC (newest first) - API should already do this, but good safeguard
      // combined.sort((a, b) => {
      //   // Primary sort by timestamp DESC
      //   if (b.timestamp !== a.timestamp) return b.timestamp - a.timestamp;
      //   // Secondary sort by signature (stable)
      //   if (a.signature < b.signature) return -1;
      //   if (a.signature > b.signature) return 1;
      //   // Tertiary sort by maker (if needed)
      //   if (a.maker < b.maker) return -1;
      //   if (a.maker > b.maker) return 1;
      //   return 0;
      // });

      const highest = combined
        .filter((tx) => tx.method === "buy" || tx.method === "sell")
        .reduce((max, tx) => {
          return tx.base_amount > max ? tx.base_amount : max;
        }, 0);

      solanaHighestTransactionValue.current = highest;

      return combined.slice(0, MAX_DISPLAY_TRADES);
    } else {
      /* console.log("TRANSACTIONS 🔵 - Not realtime") */ // For ASC sort or wallet filter, use the fetched data directly.
      // The API call was already made with the correct 'order'.
      // If additional client-side sorting is strictly needed (e.g., complex rules), add it here.
      if (!(currentFetched || []).length) return [];
      /* console.log("im here", currentFetched) */ const seenSignatures =
        new Set<string>();

      return [...currentFetched]?.filter((tx) => {
        if (seenSignatures.has(`${tx.method}-${tx.signature}`)) return false;
        seenSignatures.add(`${tx.method}-${tx.signature}`);

        if (!tradesType[tx.method as keyof typeof tradesType]) return false;

        if (walletFilter && tx.maker !== walletFilter) return false;

        if (tradesTotal.min > 0 || tradesTotal.max > 0) {
          return (
            tx.base_amount >= tradesTotal.min &&
            (tradesTotal.max > 0 ? tx.base_amount <= tradesTotal.max : true)
          );
        } else {
          return true;
        }
      });
      // .sort((a, b) => {
      //   // Handle 'firstTrade' priority
      //   if (a.firstTrade && !b.firstTrade) return -1;
      //   if (!a.firstTrade && b.firstTrade) return 1;
      //   // Handle 'add' type priority within the same timestamp
      //   const isSameTimestamp = a.timestamp === b.timestamp;
      //   if (isSameTimestamp) {
      //     if (a.type === "add" && b.type !== "add") return -1; // 'add' comes first in DESC
      //     if (b.type === "add" && a.type !== "add") return 1;
      //     // Secondary sort by signature (stable)
      //     if (a.signature < b.signature) return -1;
      //     if (a.signature > b.signature) return 1;
      //     // Tertiary sort by maker (if needed)
      //     if (a.maker < b.maker) return -1;
      //     if (a.maker > b.maker) return 1;
      //   }
      //   // Primary sort by timestamp DESC
      //   return b.timestamp - a.timestamp;
      // });
    }
  }, [
    isInitState,
    fetchedTransactions,
    transactionMessages,
    isRealTimeMode,
    tradesDate,
    tradesType,
  ]); // Added tradesDate dependency for sorting logic
  // console.log("FETCHED TRANSACTIONS", {
  //   initLength: initData?.transactions,
  //   fetchedLength: fetchedTransactions?.length,
  //   transactionLength: transactionMessages.length,
  //   displayedLength: displayedTransactions.length,
  // });

  // ### A. From Filter Trade => Mark
  useEffect(() => {
    const currentFetched = fetchedTransactions || [];
    if (walletFilter && currentFetched.length > 0) {
      setFilteredWallet(walletFilter);
      const walletTrades: Trade[] = currentFetched // Use currentFetched
        ?.filter((tx) => tx.maker === walletFilter)
        ?.map((tx) => ({
          average_price_base: 0,
          average_price_usd: 0,
          average_sell_price_base: 0,
          average_sell_price_usd: 0,
          colour: tx?.method === "buy" ? "blue" : "red",
          letter: tx?.method === "buy" ? "B" : "S",
          price: tx?.price ?? 0,
          price_usd: tx?.price_usd ?? 0,
          supply: initData?.price?.supply || 1000000000,
          supply_str: initData?.token?.supply_str || "1000000000",
          signature: tx?.signature,
          token_amount: tx?.token_amount ?? 0,
          timestamp:
            String(tx?.timestamp).length <= 10
              ? tx?.timestamp * 1000
              : tx?.timestamp,
          wallet: tx?.maker,
          // imageUrl: `/icons/token/actions/${tx?.animal}.svg`,
        }));
      setFilteredWalletTrades(walletTrades);
    } else if (!walletFilter) {
      // Reset only if filter is cleared
      resetFilteredWalletTradesState();
      setFilteredWallet("");
    }
  }, [
    walletFilter,
    fetchedTransactions, // Depend on fetchedTransactions
    setFilteredWallet,
    setFilteredWalletTrades,
    resetFilteredWalletTradesState,
  ]);

  useEffect(() => {
    setWalletFilter("");
  }, []);

  // ### C. From Developer Trade => Mark
  useEffect(() => {
    if (developerAddress && (displayedTransactions || []).length > 0) {
      const developerTrades: Trade[] = displayedTransactions
        ?.filter(
          (tx) =>
            tx.is_developer &&
            tx.maker === developerAddress &&
            tx.method !== "add" &&
            tx.method !== "remove",
        )
        ?.map((tx) => ({
          average_price_base: 0,
          average_price_usd: 0,
          average_sell_price_base: 0,
          average_sell_price_usd: 0,
          colour: tx?.method === "buy" ? "green" : "red",
          letter: tx?.method === "buy" ? "DB" : "DS",
          price: tx?.price ?? 0,
          price_usd: tx?.price_usd ?? 0,
          supply: initData?.price?.supply || 1000000000,
          supply_str: initData?.token?.supply_str || "1000000000",
          signature: tx?.signature,
          token_amount: tx?.token_amount ?? 0,
          timestamp:
            String(tx?.timestamp).length <= 10
              ? tx?.timestamp * 1000
              : tx?.timestamp,
          wallet: tx?.maker,
        }));
      if (developerTrades.length > 0) {
        // console.log("DTM | Processed Developer Trades 🟢", developerTrades);
        setCurrentTokenDeveloperTrades(developerTrades);
      } else {
        // console.log("DTM | Processed Developer Trades 🔴", developerTrades);
      }
    } else {
      resetCurrentTokenDeveloperTradesState();
    }
  }, [
    developerAddress,
    displayedTransactions,
    setCurrentTokenDeveloperTrades,
    resetCurrentTokenDeveloperTradesState,
  ]);

  // --- Event Handlers ---
  const handleSortOrderChange = useCallback(() => {
    setTradesDate(tradesDate === "ASC" ? "DESC" : "ASC");
    // Changing tradesDate updates queryKey, useQuery handles refetch
  }, [tradesDate, setTradesDate]);

  const handleWalletFilterChange = useCallback(
    (newWalletFilter: string) => {
      setWalletFilter(newWalletFilter);
      setScrollOffsetValue(0);
      // Changing walletFilter updates queryKey, useQuery handles refetch
    },
    [setScrollOffsetValue], // Removed queryClient/queryKey dependency as it's implicit
  );

  // --- Render Logic ---
  // Use isLoadingTrades for initial/filter loading, isRefetching for background updates
  const isLoading = isLoadingTrades || isRefetching;
  const setIsPaused = useTradesTableSettingStore((state) => state.setIsPaused);
  const isSorting = useTradesTableSettingStore((state) => state.isSorting);
  const scrollOffsetValue = useTradesTableSettingStore(
    (state) => state.scrollOffsetValue,
  );

  const handleMouseMove = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!listRef.current) return;

      const rect = listRef.current.getBoundingClientRect();
      const isCursorInside =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;

      if (!isCursorInside) {
        if (scrollOffsetValue > 0 || isSorting) return;
        setIsPaused(false);
      } else {
        setIsPaused(true);
      }
    },
    [scrollOffsetValue, isSorting, setIsPaused],
  );

  // useEffect(() => {
  //   document.addEventListener("mousemove", handleMouseMove);
  //   return () => {
  //     document.removeEventListener("mousemove", handleMouseMove);
  //   };
  // }, [handleMouseMove]);

  // --- Header Configuration ---
  // (HeaderData remains largely the same, ensure dependencies are correct)
  const HeaderData = useMemo(
    () => [
      // Date/Age Column
      {
        label: "", // No label, just buttons
        valueIdentifier: "date-age",
        sortButton: (
          <div className="flex h-[20px] w-auto items-center justify-center rounded-[10px] bg-secondary p-1">
            <button
              onClick={() => setTradesDateType("DATE")}
              className={cn(
                "inline-block cursor-pointer rounded-[12px] px-1.5 text-[10px] leading-[14px] text-fontColorPrimary duration-300",
                tradesDateType === "DATE" && "bg-white/10",
              )}
            >
              DATE
            </button>
            <button
              onClick={() => setTradesDateType("AGE")}
              className={cn(
                "inline-block cursor-pointer rounded-[12px] px-1.5 text-[10px] leading-[14px] text-fontColorPrimary duration-300",
                tradesDateType === "AGE" && "bg-white/10",
              )}
            >
              AGE
            </button>
          </div>
        ),
        sortButtonAfterTooltip: (
          <button
            onClick={handleSortOrderChange}
            className="flex cursor-pointer items-center -space-x-[7.5px]"
            title="Toggle sort order (Time)"
          >
            <HiArrowNarrowUp
              className={cn(
                "text-sm duration-300",
                tradesDate === "ASC"
                  ? "text-[#DF74FF]"
                  : "text-fontColorSecondary",
              )}
            />
            <HiArrowNarrowDown
              className={cn(
                "text-sm duration-300",
                tradesDate === "DESC"
                  ? "text-[#DF74FF]"
                  : "text-fontColorSecondary",
              )}
            />
          </button>
        ),
        tooltipContent: "The date/time the transaction was made.",
        className:
          remainingScreenWidth < 1500 ? "min-w-[135px]" : "min-w-[140px]",
      },
      // Type Column
      {
        label: "Type",
        valueIdentifier: "type",
        sortButton: <TradesTypeFilter />,
        tooltipContent: "Filter by transaction type (Buy, Sell, Add, Remove).",
        className:
          remainingScreenWidth < 1500
            ? "min-w-fit min-[1520px]:min-w-[80px] max-[1300px]:max-w-[100px]"
            : "min-w-[80px] min-[1520px]:min-w-[115px] max-[1300px]:max-w-[90px]",
      },
      // Value Column
      {
        label: "Value",
        valueIdentifier: "value",
        sortButton: (
          <SortButton
            type="usdc-or-sol"
            value={tradesValue}
            setValue={setTradesValue}
          />
        ),
        tooltipContent: "The value of the transaction in SOL/USD.",
        className:
          remainingScreenWidth < 1500
            ? "min-w-fit min-[1520px]:min-w-[120px]"
            : "min-w-fit min-[1520px]:min-w-[143px]",
      },
      // Amount Column
      {
        label: tokenMarketCap === "token" ? "Tokens" : "Market Cap",
        valueIdentifier: "amount-of-tokens",
        tooltipContent:
          tokenMarketCap === "token"
            ? "The amount of tokens bought/sold."
            : "Total value of company's share.",
        className:
          remainingScreenWidth < 1400
            ? "min-w-fit min-[1520px]:min-w-[90px]"
            : "min-w-[145px] min-[1520px]:min-w-[150px]",
        sortButton: (
          <TradesMarketCapTokenToggle
            value={tokenMarketCap}
            setValue={setTokenMarketCap}
          />
        ),
      },
      // Total SOL Column
      // {
      //   label: remainingScreenWidth < 1400 ? "Total" : "Total SOL",
      //   valueIdentifier: "total",
      //   sortButton: (
      //     <>
      //       <TradesTotalFilter />
      //       <SortButton
      //         type="usdc-or-sol"
      //         value={tradesTokenSol}
      //         setValue={setTradesTokenSol}
      //       />
      //     </>
      //   ),
      //   tooltipContent:
      //     "Filter by the total value of the transaction in SOL/USD.",
      //   className:
      //     remainingScreenWidth < 1400
      //       ? "min-w-[115px]"
      //       : "min-w-[145px] min-[1520px]:min-w-[175px]",
      // },
      // Maker Column
      {
        label: "Maker",
        valueIdentifier: "maker",
        tooltipContent: "Filter by maker wallet address.",
        className: "min-w-[165px] min-[1520px]:min-w-[175px] justify-end",
        sortButton: (
          <TradesMakerFilter
            openWalletMakerFilter={openWalletMakerFilter}
            setOpenWalletMakerFilter={setOpenWalletMakerFilter}
            setWalletFilter={handleWalletFilterChange}
            setWalletFilterTemp={setWalletFilterTemp}
            walletFilterTemp={walletFilterTemp}
          />
        ),
      },
      // Actions Column
      {
        label: "Actions",
        valueIdentifier: "actions",
        tooltipContent: "View transaction details on Solscan.",
        className:
          remainingScreenWidth < 1500
            ? "min-w-[75px] min-[1520px]:min-w-[75px] justify-end"
            : "min-w-[80px] min-[1520px]:min-w-[100px] justify-end",
      },
    ],
    [
      tradesDateType,
      setTradesDateType,
      tradesDate,
      handleSortOrderChange,
      tradesValue,
      setTradesValue,
      tradesTokenSol,
      setTradesTokenSol,
      tokenMarketCap,
      setTokenMarketCap,
      openWalletMakerFilter,
      setOpenWalletMakerFilter,
      walletFilterTemp,
      setWalletFilterTemp,
      handleWalletFilterChange,
      remainingScreenWidth,
    ],
  );

  const isAppleEnvirontment = useDeviceAndBrowserForScrollbarStore(
    (state) => state.isAppleEnvirontment,
  );
  const isBrowserWithoutScrollbar = useDeviceAndBrowserForScrollbarStore(
    (state) => state.isBrowserWithoutScrollbar,
  );

  // --- Render Logic ---
  // Use isLoadingTrades for initial/filter loading, isRefetching for background updates
  const isEmpty =
    !isLoading && !isRefetching && displayedTransactions.length === 0;

  // console.log("FETCHED TRANSACTIONS", {
  //   initLength: initData?.transactions,
  //   fetchedLength: fetchedTransactions?.length,
  //   transactionLength: transactionMessages.length,
  //   displayedLength: displayedTransactions,
  //   isLoading,
  // });

  if (!initData) return;

  return (
    <>
      <div className="relative flex h-full w-full flex-grow flex-col pb-16 md:pb-0">
        {/* Wallet filter header */}
        {walletFilter && (
          <div className="flex w-full flex-shrink-0 items-center justify-center gap-x-2 bg-secondary p-3 text-fontColorPrimary">
            {/* Show loading only when actively loading this specific filter */}
            {isLoading ? (
              <>Loading trades for {truncateAddress(walletFilter)}...</>
            ) : (
              <>
                {/* Display count from fetchedTransactions when filtered */}
                Showing {displayedTransactions?.length ?? 0} trades for{" "}
                {truncateAddress(walletFilter)}
                <button
                  onClick={() => handleWalletFilterChange("")} // Use handler to clear
                  className="text-primary hover:text-primary/80"
                  aria-label="Reset wallet filter"
                >
                  Reset
                </button>
              </>
            )}
          </div>
        )}

        {/* Main content */}
        <div className="relative h-full w-full flex-grow">
          <div className="absolute inset-0 flex flex-col">
            {/* Table headers */}
            <div
              className={cn(
                "sticky top-0 z-[9] hidden h-[40px] min-w-max flex-shrink-0 items-center border-b border-border pl-4 xl:flex",
                remainingScreenWidth < 1200 && "xl:hidden",
                isAppleEnvirontment && !isBrowserWithoutScrollbar
                  ? "pr-3"
                  : displayedTransactions && displayedTransactions?.length > 15
                    ? "pr-6"
                    : "pr-3",
              )}
              style={theme.background2}
            >
              {(HeaderData || [])?.map((item, index) => {
                const isActive = selectedTableColumns.find(
                  (col) => col === item.valueIdentifier,
                );
                if (!isActive) return null;
                return <HeadCol key={index} {...item} />;
              })}
            </div>

            <div
              onMouseEnter={() => {
                setIsPaused(true);
              }}
              onMouseLeave={() => {
                if (scrollOffsetValue > 0) return;
                setIsPaused(false);
              }}
              onMouseMove={(e) => {
                handleMouseMove(e);
              }}
              ref={listRef}
              className={cn(
                "flex-grow overflow-hidden p-3 md:p-0",
                remainingScreenWidth < 1200 && "md:p-3",
                isLoading && "nova-scroller",
              )}
            >
              {/* Virtualized Transaction list Container */}
              {(() => {
                if (displayedTransactions?.length > 0) {
                  return (
                    <TradesList
                      displayedTransactions={displayedTransactions}
                      walletFilter={walletFilter}
                      handleWalletFilterChange={handleWalletFilterChange}
                      remainingScreenWidth={remainingScreenWidth}
                      isRealTimeMode={isRealTimeMode}
                      isLoading={isLoading}
                      isRefetching={isRefetching}
                      solanaHighestTransactionValue={
                        solanaHighestTransactionValue.current
                      }
                    />
                  );
                }

                if (isError) {
                  const errorMessage =
                    error instanceof Error
                      ? error.message
                      : String(error) || "Unknown error";

                  return (
                    <div className="flex h-full items-center justify-center text-red-500">
                      Error loading trades: {errorMessage}
                    </div>
                  );
                }

                if (isEmpty) {
                  return (
                    <div className="flex h-full items-center justify-center text-fontColorSecondary">
                      No trades found matching your criteria.
                    </div>
                  );
                }

                return (
                  <>
                    {Array.from({ length: 30 })?.map((_, index) => (
                      <div
                        key={index}
                        className="transition-color hidden h-[42px] min-w-max items-center pl-4 pr-4 duration-300 ease-out odd:bg-white/[3%] even:bg-transparent hover:bg-white/10 md:flex"
                      >
                        <div
                          className={cn(
                            "flex h-full w-full items-center",
                            remainingScreenWidth < 1500
                              ? "min-w-[135px]"
                              : "min-w-[140px]",
                          )}
                        >
                          <Skeleton className="h-4 w-[117px]" />
                        </div>
                        <div
                          className={cn(
                            "flex h-full w-full items-center",
                            remainingScreenWidth < 1500
                              ? "min-w-fit max-[1300px]:max-w-[100px] min-[1520px]:min-w-[80px]"
                              : "min-w-[80px] max-[1300px]:max-w-[90px] min-[1520px]:min-w-[115px]",
                          )}
                        >
                          <Skeleton className="h-4 w-[62px]" />
                        </div>
                        <div
                          className={cn(
                            "flex h-full w-full items-center",
                            remainingScreenWidth < 1500
                              ? "min-w-fit min-[1520px]:min-w-[120px]"
                              : "min-w-fit min-[1520px]:min-w-[143px]",
                          )}
                        >
                          <Skeleton className="h-4 w-[96px]" />
                        </div>
                        <div
                          className={cn(
                            "flex h-full w-full items-center",
                            remainingScreenWidth < 1400
                              ? "min-w-fit min-[1520px]:min-w-[90px]"
                              : "min-w-[145px] min-[1520px]:min-w-[150px]",
                          )}
                        >
                          <Skeleton className="h-4 w-[106px]" />
                        </div>
                        <div
                          className={cn(
                            "flex h-full w-full items-center",
                            remainingScreenWidth < 1500
                              ? "min-w-[50px] justify-end min-[1520px]:min-w-[75px]"
                              : "min-w-[165px] justify-end min-[1520px]:min-w-[175px]",
                          )}
                        >
                          <Skeleton className="h-4 w-[80px]" />
                        </div>
                        <div
                          className={cn(
                            "flex h-full w-full items-center",
                            remainingScreenWidth < 1500
                              ? "min-w-[75px] justify-end min-[1520px]:min-w-[75px]"
                              : "min-w-[80px] justify-end min-[1520px]:min-w-[100px]",
                          )}
                        >
                          <Skeleton className="h-4 w-[70px]" />
                        </div>
                      </div>
                    ))}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      </div>

      <WalletTrackerModal />
    </>
  );
});

type TradesListProps = {
  displayedTransactions: TransactionInfo[];
  walletFilter: string;
  handleWalletFilterChange: (value: string) => void;
  remainingScreenWidth: number;
  solanaHighestTransactionValue: number;
  isRealTimeMode: boolean;
  isLoading: boolean;
  isRefetching: boolean;
};

const TradesList = ({
  displayedTransactions,
  walletFilter,
  handleWalletFilterChange,
  remainingScreenWidth,
  isRealTimeMode,
  isLoading,
  isRefetching,
  solanaHighestTransactionValue,
}: TradesListProps) => {
  const itemData = {
    displayedTransactions,
    walletFilter,
    handleWalletFilterChange,
    remainingScreenWidth,
  };

  const listRef = useRef<HTMLDivElement>(null);
  const [fixedListHeight, setFixedListHeight] = useState(0);

  useEffect(() => {
    const node = listRef.current;
    if (!node) return;

    const updateHeight = () => {
      const style = window.getComputedStyle(node);
      const paddingTop = parseFloat(style.paddingTop);
      const paddingBottom = parseFloat(style.paddingBottom);
      setFixedListHeight(node.clientHeight - paddingTop - paddingBottom);
    };

    updateHeight();

    const resizeObserver = new window.ResizeObserver(updateHeight);
    resizeObserver.observe(node);

    return () => {
      resizeObserver.disconnect();
    };
  }, [listRef.current]);

  const Row = React.memo(function Row({ index, style, data }: any) {
    const transaction = data.displayedTransactions[index];

    return (
      <div
        style={style}
        className={cn(
          "mb-2 min-h-[50px] xl:mb-0",
          data.remainingScreenWidth < 1200 && "md:mb-2 xl:mb-2",
        )}
      >
        <TradesCard
          isLoading={isLoading}
          index={index}
          transaction={transaction}
          walletFilter={data.walletFilter}
          setWalletFilter={data.handleWalletFilterChange}
          solanaHighestTransactionValue={solanaHighestTransactionValue}
        />
      </div>
    );
  }, areEqual);

  return (
    <div ref={listRef} className="relative h-full w-full flex-grow">
      <FixedSizeList
        height={fixedListHeight}
        width="100%"
        itemSize={45}
        itemCount={displayedTransactions.length}
        itemData={itemData}
      >
        {Row}
      </FixedSizeList>

      {/* Manual Footer */}
      {!isRealTimeMode &&
        !isLoading &&
        !isRefetching &&
        displayedTransactions.length > 0 && (
          <div className="p-4 text-center text-fontColorSecondary">
            Showing first {displayedTransactions.length} trades.
          </div>
        )}
    </div>
  );
};
