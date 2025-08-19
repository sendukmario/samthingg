"use client";

// ######## Libraries 📦 & Hooks 🪝 ########
import React, {
  useCallback,
  useEffect,
  useState,
  useMemo,
  useRef,
} from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useParams } from "next/navigation";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Virtuoso } from "react-virtuoso";
import { CachedImage } from "../../../CachedImage";

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
// ######## APIs 🛜 ########
import { getTradesTasks, TransactionType } from "@/apis/rest/trades";
// ######## Components 🧩 ########
import dynamic from "next/dynamic";
import Image from "next/image";
import SortButton from "@/components/customs/SortButton";
import HeadCol from "@/components/customs/tables/HeadCol";
import TradesCard from "@/components/customs/cards/token/TradesCardPanel";
import TradesMakerFilter from "@/components/customs/tables/token/Trades/TradesMakerFilter";
import TradesTypeFilter from "@/components/customs/tables/token/Trades/TradesTypeFilter";
import TradesTotalFilter from "@/components/customs/tables/token/Trades/TradesTotalFilter";
import TradesMarketCapTokenToggle from "@/components/customs/tables/token/Trades/TradesMarketCapTokenToggle";
import WalletTrackerModal from "@/components/customs/modals/WalletTrackerModal";
import { TokenCardLoading } from "@/components/customs/loadings/TokenCardLoading";
import { HiArrowNarrowUp, HiArrowNarrowDown } from "react-icons/hi";
// ######## Utils & Helpers 🤝 ########
import { cn } from "@/libraries/utils";
import { truncateAddress } from "@/utils/truncateAddress";
// ######## Types 🗨️ ########
import { TokenDataMessageType, TransactionInfo } from "@/types/ws-general";
import { Trade } from "@/types/nova_tv.types";
import { useTokenPersist } from "@/stores/token/use-token-persist.store";
import { ToggleSortButton } from "@/components/customs/SortButton";
import { ToggleTokenSolButton } from "@/components/customs/SortButton";
import CustomTablePopover from "@/components/customs/popovers/custom-table/CustomTablePopover";
import { useCustomizeSettingsStore } from "@/stores/setting/use-customize-settings.store";
import { useCustomizeTheme } from "@/hooks/use-customize-theme";

// Constants
const TRADES_LIMIT = 50; // Default limit for non-realtime fetches
const REALTIME_FETCH_LIMIT = 100; // Limit for initial fetch in real-time mode
const MAX_DISPLAY_TRADES = 100; // Max combined trades (fetched + WS) to display in real-time mode

// Loading Component
const LoadingState = ({ text = "Loading..." }: { text?: string }) => {
  return (
    <div className="flex h-[60px] flex-grow items-center justify-center bg-shadeTable px-4 sm:h-[80px]">
      <div className="flex items-center gap-2 text-fontColorPrimary">
        <div className="relative aspect-square h-5 w-5 flex-shrink-0">
          <Image
            src="/icons/search-loading.png"
            alt="Loading Icon"
            fill
            quality={100}
            className="animate-spin object-contain"
          />
        </div>
        <span>{text}</span>
      </div>
    </div>
  );
};

const getTransactionKey = (tx: TransactionInfo): string =>
  `${tx.method}-${tx.maker}-${tx.signature}`;

export default React.memo(function TradesTable({
  initData,
}: {
  initData: TokenDataMessageType | null;
}) {
  const params = useParams();
  const { remainingScreenWidth } = usePopupStore();

  // Theme
  const theme = useCustomizeTheme();

  // Component State
  const listRef = useRef<HTMLDivElement>(null);
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

  /* console.log("Query Key:", tradesTotal) */ const {
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

      const res = await getTradesTasks({
        order: tradesDate?.toLowerCase() as "asc" | "desc",
        limit: limit,
        offset: offset,
        maker: walletFilter,
        mint: mintOrPoolAddress,
        min_sol: tradesTotal.min,
        max_sol: tradesTotal.max,
        methods: activeTradeTypes,
      });

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

      return res as TransactionInfo[];
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
        return initData.transactions;
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
    const currentFetched = fetchedTransactions?.reverse() || [];
    const dataExists =
      currentFetched.length > 0 ||
      transactionMessages.length > 0 ||
      (initData && initData?.transactions?.length > 0);
    if (!dataExists) return [];

    if (isInitState && transactionMessages.length > 0) {
      /* console.log("TRANSACTIONS 🔵 - Init") */ setInitState(false);
      const initState =
        (initData?.transactions?.length ? initData.transactions : null) ||
        (transactionMessages?.length ? transactionMessages : null) ||
        [];

      return initState;
    }

    if (isRealTimeMode) {
      /* console.log("TRANSACTIONS 🔵 - Realtime") */ const uniqueTransactions =
        new Map<string, TransactionInfo>();

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
        ?.forEach((tx) => {
          uniqueTransactions.set(getTransactionKey(tx), tx);
        });

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
        ?.forEach((tx) => {
          uniqueTransactions.set(getTransactionKey(tx), tx);
        });

      let combined = Array.from(uniqueTransactions.values());

      // Sort DESC (newest first) - API should already do this, but good safeguard
      combined.sort((a, b) => {
        // Handle 'firstTrade' priority
        // if (a.firstTrade && !b.firstTrade) return 1;
        // if (!a.firstTrade && b.firstTrade) return -1;
        // // Handle 'add' type priority within the same timestamp
        // const isSameTimestamp = a.timestamp === b.timestamp;
        // if (isSameTimestamp) {
        //   if (a.type === "add" && b.type !== "add") return 1; // 'add' comes first in DESC
        //   if (b.type === "add" && a.type !== "add") return -1;
        // }
        // Primary sort by timestamp DESC
        if (b.timestamp !== a.timestamp) return b.timestamp - a.timestamp;
        // Secondary sort by signature (stable)
        if (a.signature < b.signature) return -1;
        if (a.signature > b.signature) return 1;
        // Tertiary sort by maker (if needed)
        if (a.maker < b.maker) return -1;
        if (a.maker > b.maker) return 1;
        return 0;
      });

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
      if (!currentFetched.length) return [];
      /* console.log("im here", currentFetched) */ const seenSignatures =
        new Set<string>();

      return [...currentFetched]
        ?.filter((tx) => {
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
        })
        .sort((a, b) => {
          // Handle 'firstTrade' priority
          // if (a.firstTrade && !b.firstTrade) return -1;
          // if (!a.firstTrade && b.firstTrade) return 1;
          // Handle 'add' type priority within the same timestamp
          const isSameTimestamp = a.timestamp === b.timestamp;
          if (isSameTimestamp) {
            if (a.method === "add" && b.method !== "add") return -1; // 'add' comes first in DESC
            if (b.method === "add" && a.method !== "add") return 1;
            // Secondary sort by signature (stable)
            if (a.signature < b.signature) return -1;
            if (a.signature > b.signature) return 1;
            // Tertiary sort by maker (if needed)
            if (a.maker < b.maker) return -1;
            if (a.maker > b.maker) return 1;
          }
          // Primary sort by timestamp ASC
          return a.timestamp - b.timestamp;
        });
    }
  }, [
    isInitState,
    fetchedTransactions,
    transactionMessages,
    isRealTimeMode,
    tradesDate,
    tradesType,
  ]); // Added tradesDate dependency for sorting logic

  // ### A. From Filter Trade => Mark
  useEffect(() => {
    const currentFetched = fetchedTransactions || [];
    if (walletFilter && (currentFetched || []).length > 0) {
      setFilteredWallet(walletFilter);
      setFilteredWalletTrades(
        currentFetched // Use currentFetched
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
            supply_str: initData?.price?.supply_str || "1000000000",
            signature: tx?.signature,
            token_amount: tx?.token_amount ?? 0,
            timestamp: tx?.timestamp,
            wallet: tx?.maker,
            // imageUrl: `/icons/token/actions/${tx?.animal}.svg`,
          })),
      );
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

  // ### C. From Developer Trade => Mark
  useEffect(() => {
    if (developerAddress && (displayedTransactions || []).length > 0) {
      const developerTrades: Trade[] = displayedTransactions
        ?.filter((tx) => tx.is_developer && tx.maker === developerAddress)
        ?.map((tx) => ({
          average_price_base: 0,
          average_price_usd: 0,
          average_sell_price_base: 0,
          average_sell_price_usd: 0,
          colour: tx?.method === "buy" ? "green" : "red",
          letter: tx?.method === "buy" ? "DB" : "DS",
          price: tx?.price ?? 0,
          price_usd: tx?.price_usd ?? 0,
          supply: 1000000000,
          supply_str: "1000000000",
          signature: tx?.signature,
          token_amount: tx?.token_amount ?? 0,
          timestamp: tx?.timestamp,
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
  const handleSortOrderPanelChange = useCallback(() => {
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

  const calendarSVG = useMemo(() => {
    return (
      <svg
        width="14"
        height="14"
        viewBox="0 0 10 10"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M9.00098 4.50001C8.8787 3.62011 8.47051 2.80484 7.8393 2.17975C7.20808 1.55467 6.38885 1.15446 5.50781 1.04078C4.62677 0.927099 3.73279 1.10625 2.96358 1.55063C2.19437 1.99501 1.5926 2.67997 1.25098 3.50001M1.00098 5.5C1.12326 6.37989 1.53144 7.19517 2.16266 7.82025C2.79387 8.44533 3.6131 8.84554 4.49414 8.95922C5.37518 9.07291 6.26917 8.89376 7.03838 8.44938C7.80759 8.005 8.40935 7.32003 8.75098 6.5M1.00098 2.50001V3.50001H2.00098M8.00098 6.5H9.00098V7.5"
          stroke="#FCFCFD"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M6.47949 5.08691H3.51855V6.40918L3.52051 6.43066C3.52515 6.45011 3.53686 6.46919 3.55469 6.48535L3.59961 6.5127C3.6169 6.51917 3.63615 6.52245 3.65625 6.52246H6.3418C6.38147 6.52239 6.4173 6.50786 6.44238 6.48535L6.4707 6.44922C6.47678 6.43612 6.47944 6.42237 6.47949 6.40918V5.08691ZM4.6543 5.57324C4.64006 5.54284 4.60473 5.51476 4.55176 5.51465H4.10352C4.03311 5.51487 3.99431 5.56438 3.99414 5.60352V6.00586C3.99414 6.04504 4.03295 6.0945 4.10352 6.09473H4.55176C4.62242 6.09457 4.66113 6.04507 4.66113 6.00586V5.60352L4.6543 5.57324ZM4.3418 5.69238C4.3968 5.69247 4.44116 5.73703 4.44141 5.79199V5.81738C4.44141 5.87256 4.39696 5.91789 4.3418 5.91797H4.31348C4.25839 5.9178 4.21387 5.87251 4.21387 5.81738V5.79199C4.21412 5.73708 4.25854 5.69255 4.31348 5.69238H4.3418ZM5.58398 3.99414V3.87988H4.41406V3.99414L4.40723 4.05469C4.37655 4.19072 4.24502 4.28197 4.10449 4.28223H4.10352C3.96289 4.28202 3.83144 4.19072 3.80078 4.05469L3.79395 3.99414V3.87988H3.65625C3.63659 3.87989 3.6177 3.88329 3.60059 3.88965L3.55469 3.91699C3.5301 3.93924 3.51855 3.96757 3.51855 3.99414V4.50977H6.47949V3.99414C6.47949 3.98103 6.47668 3.96714 6.4707 3.9541L6.44238 3.91699C6.42335 3.89994 6.39825 3.88785 6.37012 3.88281H6.36914L6.3418 3.87988H6.2041V3.99414L6.19727 4.05469C6.17092 4.17158 6.07016 4.25587 5.95312 4.27734L5.89453 4.28223C5.75372 4.28223 5.62151 4.19088 5.59082 4.05469L5.58398 3.99414ZM4.21387 3.18848C4.21377 3.1592 4.19193 3.12418 4.15137 3.1084L4.10352 3.09961C4.03307 3.09983 3.99427 3.14933 3.99414 3.18848V3.40234C3.99414 3.45747 3.94961 3.50178 3.89453 3.50195H3.65625C3.5429 3.50197 3.43401 3.53307 3.34277 3.58789L3.25879 3.65039C3.15531 3.7435 3.09863 3.86751 3.09863 3.99414V6.40332L3.10254 6.45898C3.11525 6.56766 3.16899 6.67216 3.25879 6.75293C3.36259 6.84608 3.5054 6.90037 3.65625 6.90039H6.3418C6.49256 6.90032 6.63547 6.8461 6.73926 6.75293L6.80762 6.67773C6.84742 6.62423 6.87489 6.56483 6.88867 6.50293L6.89941 6.40918V3.99414C6.89941 3.8676 6.84285 3.74358 6.73926 3.65039C6.64836 3.56864 6.52751 3.51652 6.39746 3.50488V3.50391L6.33691 3.50195H6.10352C6.04843 3.50178 6.00391 3.45747 6.00391 3.40234V3.18848C6.00381 3.15914 5.98197 3.12415 5.94141 3.1084L5.89453 3.09961C5.82378 3.09961 5.78431 3.14924 5.78418 3.18848V3.40234C5.78418 3.45747 5.73966 3.50179 5.68457 3.50195H4.31348C4.25839 3.50179 4.21387 3.45747 4.21387 3.40234V3.18848ZM6.67285 6.47266C6.66362 6.51401 6.64533 6.55283 6.62012 6.58691L6.57617 6.63477C6.51227 6.69203 6.42775 6.72258 6.3418 6.72266H3.65625C3.59167 6.72263 3.52758 6.70575 3.47266 6.67285L3.4209 6.63477C3.37258 6.59129 3.33902 6.53471 3.3252 6.47266L3.32324 6.46191V6.46094L3.31934 6.41992L3.31836 6.40918V4.9873C3.31837 4.93208 3.36372 4.8877 3.41895 4.8877H6.5791C6.63432 4.8877 6.67968 4.93208 6.67969 4.9873V6.40918L6.67285 6.47266ZM4.86133 6.00586C4.86133 6.17489 4.71248 6.29476 4.55176 6.29492H4.10352C3.94285 6.29468 3.79395 6.17483 3.79395 6.00586V5.60352C3.7941 5.43468 3.94293 5.31567 4.10352 5.31543H4.55176C4.7124 5.31559 4.86118 5.43462 4.86133 5.60352V6.00586ZM6.67969 4.61035C6.67948 4.6654 6.6342 4.70996 6.5791 4.70996H3.41895C3.36385 4.70996 3.31857 4.6654 3.31836 4.61035V3.99414C3.31836 3.90759 3.35678 3.82644 3.4209 3.76855L3.47266 3.73047C3.5275 3.69747 3.59137 3.67971 3.65625 3.67969H3.89453C3.94945 3.67986 3.99388 3.72439 3.99414 3.7793V3.99414L4.00098 4.02441C4.01523 4.05481 4.05071 4.08186 4.10352 4.08203L4.15137 4.07422C4.17842 4.06369 4.19753 4.04464 4.20703 4.02441L4.21387 3.99414V3.7793C4.21412 3.72439 4.25855 3.67985 4.31348 3.67969H5.68457C5.7395 3.67985 5.78392 3.72439 5.78418 3.7793V3.99414L5.79102 4.02441C5.80531 4.0549 5.84145 4.08203 5.89453 4.08203L5.94141 4.07422C5.96847 4.0637 5.98757 4.04467 5.99707 4.02441L6.00391 3.99414V3.7793C6.00416 3.72439 6.04859 3.67986 6.10352 3.67969H6.35059L6.39648 3.68457L6.40527 3.68555L6.49707 3.71484C6.52582 3.72871 6.55226 3.74705 6.57617 3.76855L6.62012 3.81543C6.65803 3.86656 6.67969 3.92891 6.67969 3.99414V4.61035Z"
          fill="white"
        />
      </svg>
    );
  }, []);

  const ageSVG = useMemo(() => {
    return (
      <svg
        width="14"
        height="14"
        viewBox="0 0 10 10"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M9.00098 4.50001C8.8787 3.62011 8.47051 2.80484 7.8393 2.17975C7.20808 1.55467 6.38885 1.15446 5.50781 1.04078C4.62677 0.927099 3.73279 1.10625 2.96358 1.55063C2.19437 1.99501 1.5926 2.67997 1.25098 3.50001M1.00098 5.5C1.12326 6.37989 1.53144 7.19517 2.16266 7.82025C2.79387 8.44533 3.6131 8.84554 4.49414 8.95922C5.37518 9.07291 6.26917 8.89376 7.03838 8.44938C7.80759 8.005 8.40935 7.32003 8.75098 6.5M1.00098 2.50001V3.50001H2.00098M8.00098 6.5H9.00098V7.5"
          stroke="#FCFCFD"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M4.90527 2.66252C4.99613 2.63758 5.09462 2.65079 5.17773 2.70061L6.17773 3.30023L6.24902 3.35687C6.31138 3.42124 6.34755 3.50811 6.34766 3.60004V4.50143L7.17773 5.00046L7.24902 5.05711C7.31136 5.12151 7.34761 5.20832 7.34766 5.30027V6.40088C7.34738 6.52353 7.28293 6.63758 7.17773 6.7007L6.17773 7.30032C6.06706 7.36657 5.92904 7.36657 5.81836 7.30032L4.99805 6.80812L4.17773 7.30032C4.06706 7.36657 3.92904 7.36657 3.81836 7.30032L2.81836 6.7007C2.71316 6.63758 2.64871 6.52353 2.64844 6.40088V5.30027C2.64851 5.17747 2.7131 5.06371 2.81836 5.00046L3.64844 4.50143V3.58149C3.65461 3.46952 3.71501 3.36232 3.81836 3.30023L4.81836 2.70061L4.90527 2.66252Z"
          fill="white"
        />
      </svg>
    );
  }, []);

  const valueSVG = useMemo(() => {
    return (
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M10 10H7.5C6.17392 10 4.90215 9.47322 3.96447 8.53554C3.02678 7.59785 2.5 6.32608 2.5 5V3.33334H5C6.32608 3.33334 7.59785 3.86012 8.53553 4.7978C9.47322 5.73548 10 7.00725 10 8.33334V16.6667M10 11.6667C10 10.3406 10.5268 9.06882 11.4645 8.13114C12.4021 7.19345 13.6739 6.66667 15 6.66667H17.5V7.5C17.5 8.82608 16.9732 10.0979 16.0355 11.0355C15.0979 11.9732 13.8261 12.5 12.5 12.5H10"
          stroke="#FCFCFD"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }, []);

  const amountSVG = useMemo(() => {
    return (
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M4 4V16H16M16 4L12 5M11.4089 6.43335L13.2562 8.89668M12.6667 10.3333L9.33333 11.6667M6.66667 12C6.66667 12.3536 6.80714 12.6928 7.05719 12.9428C7.30724 13.1929 7.64638 13.3333 8 13.3333C8.35362 13.3333 8.69276 13.1929 8.94281 12.9428C9.19286 12.6928 9.33333 12.3536 9.33333 12C9.33333 11.6464 9.19286 11.3072 8.94281 11.0572C8.69276 10.8071 8.35362 10.6667 8 10.6667C7.64638 10.6667 7.30724 10.8071 7.05719 11.0572C6.80714 11.3072 6.66667 11.6464 6.66667 12ZM9.33333 5.33333C9.33333 5.68696 9.47381 6.02609 9.72386 6.27614C9.97391 6.52619 10.313 6.66667 10.6667 6.66667C11.0203 6.66667 11.3594 6.52619 11.6095 6.27614C11.8595 6.02609 12 5.68696 12 5.33333C12 4.97971 11.8595 4.64057 11.6095 4.39052C11.3594 4.14048 11.0203 4 10.6667 4C10.313 4 9.97391 4.14048 9.72386 4.39052C9.47381 4.64057 9.33333 4.97971 9.33333 5.33333ZM12.6667 10C12.6667 10.3536 12.8071 10.6928 13.0572 10.9428C13.3072 11.1929 13.6464 11.3333 14 11.3333C14.3536 11.3333 14.6928 11.1929 14.9428 10.9428C15.1929 10.6928 15.3333 10.3536 15.3333 10C15.3333 9.64638 15.1929 9.30724 14.9428 9.05719C14.6928 8.80714 14.3536 8.66667 14 8.66667C13.6464 8.66667 13.3072 8.80714 13.0572 9.05719C12.8071 9.30724 12.6667 9.64638 12.6667 10Z"
          stroke="#FCFCFD"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }, []);

  const makerSVG = useMemo(() => {
    return (
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M6.11111 16H13.8889M5.33333 5.29412L10 4.52941L14.6667 5.29412M5.33333 5.29412L7.66667 9.88235C7.66667 10.4908 7.42083 11.0743 6.98325 11.5045C6.54566 11.9348 5.95217 12.1765 5.33333 12.1765C4.71449 12.1765 4.121 11.9348 3.68342 11.5045C3.24583 11.0743 3 10.4908 3 9.88235L5.33333 5.29412ZM14.6667 5.29412L17 9.88235C17 10.4908 16.7542 11.0743 16.3166 11.5045C15.879 11.9348 15.2855 12.1765 14.6667 12.1765C14.0478 12.1765 13.4543 11.9348 13.0168 11.5045C12.5792 11.0743 12.3333 10.4908 12.3333 9.88235L14.6667 5.29412ZM10 3V16"
          stroke="#FCFCFD"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }, []);

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // Add resize observer to track container width
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // --- Header Configuration ---
  const HeaderData = useMemo(
    () => [
      // Date/Age Column
      {
        label: "",
        valueIdentifier: "date-age",
        className: "min-w-[70px] text-xss",
        tooltipContent: "Switch between time and age display formats",
        sortButton: (
          <div className="flex items-center">
            <div className="flex h-[20px] items-center justify-center rounded-[10px] bg-secondary">
              <button
                onClick={() =>
                  setTradesDateType(tradesDateType === "DATE" ? "AGE" : "DATE")
                }
                className="inline-flex items-center gap-x-1 rounded-[12px] px-1.5 text-[10px] leading-[14px] text-fontColorPrimary duration-300 hover:bg-white/5"
              >
                {containerWidth <= 400 ? (
                  tradesDateType === "DATE" ? (
                    calendarSVG
                  ) : (
                    ageSVG
                  )
                ) : (
                  <>{tradesDateType === "DATE" ? "Time" : "Age"}</>
                )}
              </button>
            </div>
            <button
              onClick={handleSortOrderPanelChange}
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
          </div>
        ),
      },
      // Value Column
      {
        label: "Value",
        valueIdentifier: "value",
        className: "min-w-[75px] text-xss",
        tooltipContent: "Trade value in SOL or USD",
        sortButton: (
          <div onClick={(e) => e.stopPropagation()}>
            <ToggleSortButton value={tradesValue} setValue={setTradesValue} />
          </div>
        ),
        iconBefore: valueSVG,
      },
      // Amount / MCap Column
      {
        label: tokenMarketCap === "token" ? "Amount" : "MCap",
        valueIdentifier: "amount-of-tokens",
        className: "min-w-[70px] text-xss",
        tooltipContent:
          tokenMarketCap === "token"
            ? "Number of tokens traded"
            : "Market capitalization (USD)",
        sortButton: (
          <div onClick={(e) => e.stopPropagation()}>
            <ToggleTokenSolButton
              value={tokenMarketCap}
              setValue={setTokenMarketCap}
            />
          </div>
        ),
        iconBefore: amountSVG,
      },
      // Maker Column
      {
        label: "Maker",
        valueIdentifier: "maker",
        className: "min-w-[90px] text-xss",
        tooltipContent: "Wallet address that initiated the trade",
        iconBefore: makerSVG,
        sortButton: (
          <TradesMakerFilter
            openWalletMakerFilter={openWalletMakerFilter}
            setOpenWalletMakerFilter={setOpenWalletMakerFilter}
            setWalletFilter={setWalletFilter}
            setWalletFilterTemp={setWalletFilterTemp}
            walletFilterTemp={walletFilterTemp}
          />
        ),
      },
    ],
    [
      containerWidth,
      tradesDateType,
      setTradesDateType,
      tradesDate,
      handleSortOrderPanelChange,
      tradesValue,
      setTradesValue,
      tokenMarketCap,
      setTokenMarketCap,
      calendarSVG,
      ageSVG,
      valueSVG,
      amountSVG,
      makerSVG,
      openWalletMakerFilter,
      setOpenWalletMakerFilter,
      setWalletFilter,
      walletFilterTemp,
      setWalletFilterTemp,
    ],
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

  const isPaused = useTradesTableSettingStore((state) => state.isPaused);

  return (
    <>
      <div
        ref={containerRef}
        className="relative hidden h-full w-full flex-grow flex-col overflow-x-hidden overscroll-none md:flex md:pb-0"
      >
        {/* Filter controls */}
        <div className="flex w-full items-center gap-x-2 bg-secondary py-2 pl-4 pr-2">
          <div className="relative aspect-square h-5 w-5 flex-shrink-0">
            <Image
              src={`/icons/token/tabs/inactive-trades.png`}
              alt={`trades Icon`}
              fill
              quality={50}
              className="object-contain"
            />
          </div>
          <span className="whitespace-nowrap text-nowrap font-geistSemiBold text-sm text-fontColorSecondary">
            Trades
          </span>
          {containerWidth && containerWidth > 1024 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="relative aspect-square h-4 w-4 flex-shrink-0">
                    <CachedImage
                      src="/icons/info-tooltip.png"
                      alt="Info Icon"
                      fill
                      quality={50}
                      className="object-contain"
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Latest Trades on this Token</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* Add paused indicator */}
          <div className="relative ml-auto flex items-center gap-x-2">
            <div
              className={cn(
                "flex h-[20px] items-center gap-x-0.5 rounded-[4px] bg-success/20",
                isPaused ? "flex" : "hidden",
              )}
            >
              <div className="relative aspect-square h-5 w-5 flex-shrink-0">
                <Image
                  src="/icons/paused.png"
                  alt="Pause Icon"
                  fill
                  quality={50}
                  className="object-contain"
                />
              </div>
              <span
                className={cn(
                  "font-geistSemiBold text-sm text-success",
                  containerWidth && containerWidth <= 1960 && "hidden",
                )}
              >
                Paused
              </span>
            </div>

            <CustomTablePopover remainingScreenWidth={remainingScreenWidth} />
          </div>
        </div>

        {/* Wallet filter header */}
        {walletFilter && (
          <div className="flex w-full flex-shrink-0 items-center justify-center gap-x-2 border-t border-border bg-secondary p-3 text-xs text-fontColorPrimary">
            {/* Show loading only when actively loading this specific filter */}
            {isLoading ? (
              <>Loading trades for ${truncateAddress(walletFilter)}...</>
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
        <div className="relative h-full w-full flex-grow overflow-x-hidden overscroll-none">
          <div className="absolute inset-0 flex flex-col">
            {/* Table headers */}
            <div
              className="sticky top-0 z-[9] flex h-[30px] w-full flex-shrink-0 overscroll-none border-b border-border bg-background"
              style={theme.background2}
            >
              <div className="flex w-full items-center px-2">
                {(HeaderData || [])?.map((item, index) => {
                  const isActive = (selectedTableColumns || [])?.find(
                    (col) => col === item?.valueIdentifier,
                  );
                  if (!isActive) return null;

                  return (
                    <HeadCol
                      key={index}
                      label={
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-x-1">
                                {item?.iconBefore}
                                {containerWidth > 470 && (
                                  <span>{item?.label}</span>
                                )}
                              </div>
                            </TooltipTrigger>
                            {item?.tooltipContent && (
                              <TooltipContent>
                                <p>{item?.tooltipContent}</p>
                              </TooltipContent>
                            )}
                          </Tooltip>
                        </TooltipProvider>
                      }
                      className={item?.className}
                      sortButton={item?.sortButton}
                    />
                  );
                })}
              </div>
            </div>

            <div
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => {
                if (scrollOffsetValue > 0) return;
                setIsPaused(false);
              }}
              onMouseMove={(e) => {
                handleMouseMove(e);
              }}
              ref={listRef}
              className={cn(
                "flex-grow overflow-y-auto overflow-x-hidden overscroll-none pb-[5px]",
                // containerWidth <= 1024 ? "p-3" : "p-0"
              )}
            >
              {/* Virtuoso list - Adjust height settings */}
              {(() => {
                if (displayedTransactions.length > 0) {
                  return (
                    <Virtuoso
                      totalCount={100}
                      initialItemCount={10}
                      fixedItemHeight={36}
                      data={displayedTransactions}
                      style={{ height: "100%" }}
                      overscan={200}
                      itemContent={(index: number, transaction) => (
                        <div
                          key={`${transaction?.timestamp}-${transaction?.maker}-${transaction?.signature}-${index}`}
                          className={cn(
                            "group relative",
                            "h-9",
                            "hover:bg-white/5",
                            "transition-colors duration-200",
                            // containerWidth < 1024 && "mb-2 xl:mb-2",
                          )}
                        >
                          {/* {transaction && (
                            <div
                              className={cn(
                                "pointer-events-none absolute inset-y-0 -left-4",
                                transaction.method?.toLowerCase() === "buy"
                                  ? "bg-green-500/20"
                                  : "bg-red-500/20",
                              )}
                              style={{
                                width: `calc(${
                                  (Math.min(
                                    transaction.base_amount ?? 0,
                                    solanaHighestTransactionValue.current,
                                  ) /
                                    solanaHighestTransactionValue.current) *
                                  100
                                }% + 1rem)`,
                              }}
                            />
                          )} */}
                          <div className="absolute inset-0">
                            <TradesCard
                              index={index}
                              transaction={transaction}
                              walletFilter={walletFilter}
                              setWalletFilter={handleWalletFilterChange}
                              solanaHighestTransactionValue={
                                solanaHighestTransactionValue.current
                              }
                            />
                          </div>
                        </div>
                      )}
                      components={{
                        Footer: () => {
                          if (
                            !isRealTimeMode &&
                            !isLoading &&
                            !isRefetching &&
                            displayedTransactions.length > 0
                          ) {
                            return (
                              <div className="p-4 text-center text-fontColorSecondary">
                                Showing first {displayedTransactions.length}{" "}
                                trades.
                              </div>
                            );
                          }

                          return null;
                        },
                      }}
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
                return <LoadingState text="Loading trades..." />;
              })()}
            </div>
          </div>
        </div>
      </div>
      <WalletTrackerModal />
    </>
  );
});
