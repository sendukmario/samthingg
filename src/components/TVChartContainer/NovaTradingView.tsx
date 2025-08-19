"use client";

// ######## Libraries 📦 & Hooks 🪝 ########
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
} from "react";
import { useCurrentTokenChartPriceStore } from "@/stores/token/use-current-token-chart-price.store";
import { useTokenMessageStore } from "@/stores/token/use-token-messages.store";
import { useFilteredWalletTradesStore } from "@/stores/token/use-filtered-wallet-trades.store";
import { useMatchWalletTrackerTradesStore } from "@/stores/token/use-match-wallet-tracker-trades.store";
import { useCurrentTokenDeveloperTradesStore } from "@/stores/token/use-current-token-developer-trades";
import { useWalletTrackerMessageStore } from "@/stores/footer/use-wallet-tracker-message.store";
import { useTokenHoldingStore } from "@/stores/token/use-token-holding.store";
import useSocialFeedMonitor from "@/hooks/use-social-feed-monitor";
import cookies from "js-cookie";
// ######## Types 🗨️ ########
import {
  Bar,
  ChartingLibraryWidgetOptions,
  IChartingLibraryWidget,
  IDropdownApi,
  LanguageCode,
  LibrarySymbolInfo,
  Mark,
  MarkConstColors,
  MarkCustomColor,
  ResolutionString,
  LineToolsAndGroupsState,
  LineToolState,
  EntityId,
} from "@/types/charting_library";
import {
  TradeFilter,
  Trade,
  TradeLetter,
  NovaChartTrades,
  CurrencyChart,
  ChartType,
  NovaChart,
} from "@/types/nova_tv.types";
import {
  defaultTVChartProperties,
  defaultTVChartPropertiesMainSeriesProperties,
} from "@/constants/trading-view.constant";
// ######## Utils & Helpers 🤝 ########
import throttle from "lodash/throttle";
import {
  addAveragePriceLine,
  filterTrades,
  removeAveragePriceLine,
  updateTradeFilters,
  saveTradeFiltersToLocalStorage,
} from "@/utils/nova_tv.utils";
import {
  getBarStartTime,
  updateTitle,
  areTradesEqual,
  generateMarkText,
  getIntervalResolution,
  getTimeZone,
  getUniqueMarks,
  getUniqueTrades,
  getValueByType,
  formatChartPrice,
  adjustTimestamps,
  getOpenMojiUrl,
  parseResolutionToMilliseconds,
  normalizeTradesLetter,
} from "@/utils/trading-view/trading-view-utils";
import {
  fetchResolveSymbol,
  fetchHistoricalData,
  fetchSeparatedTradesData,
} from "@/apis/rest/trading-view";
import { useWebSocket } from "@/hooks/useWebsocketNew";
import { queryClient } from "@/apis/rest/candles";
import { useQueryClient } from "@tanstack/react-query";
import { TokenDataMessageType, WSMessage } from "@/types/ws-general";
import { isRelevantMessage } from "@/utils/websocket/isRelevantMessage";
import { useServerTimeStore } from "@/stores/use-server-time.store";
import { useTradesWalletModalStore } from "@/stores/token/use-trades-wallet-modal.store";
import { FinalDiscordMessage } from "@/types/monitor";
import { convertISOToMillisecondsTimestamp } from "@/utils/formatTime";
import { formatEpochToUTCDate } from "@/utils/formatDate";
import { convertDecimals } from "@/utils/convertDecimals";
import { convertChartHoldingsLamports } from "@/utils/lamportsConverter";

type Symbols = {
  name: string;
  symbol: string;
  image: string;
  dex: string;
  created_at: number;
};

export const getHistoricalFromInterval = {
  "1s": 60 * 5 * 1000,
  "5s": 60 * 25 * 1000,
  "15s": 60 * 75 * 1000,
  "30s": 60 * 150 * 1000,
  "1m": 60 * 300 * 1000,
  "5m": 60 * 1_500 * 1000,
  "15m": 60 * 4_500 * 1000,
  "30m": 60 * 9_000 * 1000,
  "1h": 60 * 18_000 * 1000,
  "4h": 60 * 76_000 * 1000,
  "1d": 60 * 18_000 * 24 * 1000,
};

// ######## Local Setup ⚒️ ########
export const PRICE_MAP = {
  "1S": "1s",
  "5S": "5s",
  "15S": "15s",
  "30S": "30s",
  "1": "1m",
  "5": "5m",
  "15": "15m",
  "30": "30m",
  "60": "1h",
  "240": "4h",
  "1440": "1d",
};
const supportedResolutions = [
  "1S",
  "5S",
  "15S",
  "30S",
  "1",
  "5",
  "15",
  "30",
  "60",
  "240",
  "1440",
] as ResolutionString[];
const twentyFourHoursInMilliseconds = 24 * 60 * 60 * 1000;
// const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

// ######## Main Component ✨ ########
const NovaTradingView = ({
  mint,
  tokenData,
}: {
  mint: string;
  tokenData: TokenDataMessageType | null;
}) => {
  // ######## Local Utils & Helpers 🤝 ########
  const transactionMessages = useTokenMessageStore(
    (state) => state.transactionMessages,
  );

  const setWalletModalAddress = useTradesWalletModalStore(
    (state) => state.setWallet,
  );
  const setPriceMessage = useTokenMessageStore(
    (state) => state.setPriceMessage,
  );
  const updateDeveloperTokens = useTokenMessageStore(
    (state) => state.updateDeveloperTokens,
  );

  const lastBarRef = useRef<Record<string, Bar>>({});
  const tvWidgetRef = useRef<IChartingLibraryWidget | null>(null);
  const dropdownApiRef = useRef<IDropdownApi | null>(null);
  const buyAveragePriceShapeIdRef = useRef<string | null>(null);
  const buyAveragePriceTradeStartTimeRef = useRef<number | null>(null);
  const buyAveragePriceShapePriceRef = useRef<number | null>(null);
  const sellAveragePriceShapeIdRef = useRef<string | null>(null);
  const sellAveragePriceTradeStartTimeRef = useRef<number | null>(null);
  const sellAveragePriceShapePriceRef = useRef<number | null>(null);
  const isInitialPriceMessageRef = useRef<boolean>(true);
  const isInitialBarRef = useRef<boolean>(true);
  const noDataRef = useRef<boolean | null>(null);
  const transactionMessagesLengthRef = useRef<number>(0);
  const isInitialNoDataRef = useRef<boolean>(false);
  const lastRequestBar = useRef<Bar[]>([]);
  const quoteDecimalsRef = useRef<number | null>(6);
  const baseDecimalsRef = useRef<number | null>(9);

  useEffect(() => {
    transactionMessagesLengthRef.current = transactionMessages.length;
  }, [transactionMessages.length]);

  const reconnectTimeoutInitSocketRef = useRef<NodeJS.Timeout | null>(null);
  const reinitChartTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousPriceRef = useRef<number | null>(null);
  const isConnectionHealthyRef = useRef(true);
  const isInitCandlesSettedRef = useRef(false);
  const queryClientNormal = useQueryClient();

  // These can stay as component-level constants since they're initialized once
  const subscribersMap = useRef(new Map());
  const tradeMap = useRef(new Map<string, NovaChartTrades["trades"]>());
  const tradeFilters = useRef(
    new Set<TradeFilter>([
      "my_trades",
      "dev_trades",
      // "sniper_trades",
      "insider_trades",
      "tracked_trades",
      "other_trades",
    ]),
  );

  useEffect(() => {
    const handleChartTypeStorage = () => {
      const chartTypeLocal = localStorage.getItem("chart_type");
      const validType = ["MCap", "Price"];

      if (!chartTypeLocal) {
        localStorage.setItem("chart_type", "MCap");
        cookies.set("_chart_type", "MCap");
        return;
      }

      if (!validType.includes(chartTypeLocal)) {
        localStorage.setItem("chart_type", "MCap");
        cookies.set("_chart_type", "MCap");
        return;
      }
    };

    const handleCurrencyStorage = () => {
      const currencyLocal = localStorage.getItem("chart_currency");
      const currencyCookies = cookies.get("_chart_currency");

      if (currencyLocal !== currencyCookies) {
        localStorage.setItem("chart_currency", "USD");
        cookies.set("_chart_currency", "USD");
        return;
      }
    };

    const handleIntervalStorage = () => {
      if (!isChartLoadedRef.current) return;

      const fallback = "1S";
      const selectedResolution =
        localStorage.getItem("chart_interval_resolution") ||
        cookies.get("_chart_interval_resolution");

      if (!selectedResolution) return;

      if (
        supportedResolutions.includes(selectedResolution as ResolutionString)
      ) {
        localStorage.setItem("chart_interval_resolution", selectedResolution);
        cookies.set("_chart_interval_resolution", selectedResolution);
        tvWidgetRef.current
          ?.activeChart()
          .setResolution(selectedResolution as ResolutionString);
        return;
      }

      localStorage.setItem("chart_interval_resolution", fallback);
      cookies.set("_chart_interval_resolution", fallback);
      tvWidgetRef.current
        ?.activeChart()
        .setResolution(fallback as ResolutionString);
    };

    // Optional: trigger once on mount
    const handleStorageChange = () => {
      handleCurrencyStorage();
      handleChartTypeStorage();
      handleIntervalStorage();
    };

    handleStorageChange();

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const cleanUp = () => {
    /* console.log("WS HOOK 📺 - chartToken | Running main cleanup...") */ // Clear global timeouts first
    if (reconnectTimeoutInitSocketRef.current)
      clearTimeout(reconnectTimeoutInitSocketRef.current);
    if (reinitChartTimeoutRef.current)
      clearTimeout(reinitChartTimeoutRef.current);
    if (intervalStudiesRef.current) clearInterval(intervalStudiesRef.current);
    if (intervalDrawingsRef.current) clearInterval(intervalDrawingsRef.current);

    // Iterate and close all subscriber sockets intentionally
    subscribersMap.current.clear(); // Clear the map

    // Remove TradingView Widget
    if (tvWidgetRef.current) {
      try {
        /* console.log("TV Widget | Attempting removal during cleanup.") */ tvWidgetRef.current.remove();
        /* console.log("TV Widget | Removed successfully during cleanup.") */
      } catch (error) {
        if (error instanceof DOMException && error.name === "NotFoundError") {
          console.warn(
            "TV Widget | Node already removed during cleanup (NotFoundError caught).",
          );
        } else {
          console.error(
            "TV Widget | Error removing widget during cleanup:",
            error,
          );
        }
      } finally {
        tvWidgetRef.current = null;
      }
    }

    // Clear timeouts
    if (reconnectTimeoutInitSocketRef.current) {
      clearTimeout(reconnectTimeoutInitSocketRef.current);
      reconnectTimeoutInitSocketRef.current = null;
    }
    if (reinitChartTimeoutRef.current) {
      clearTimeout(reinitChartTimeoutRef.current);
      reinitChartTimeoutRef.current = null;
    }

    lastBarRef.current = {};
    dropdownApiRef.current = null;
    buyAveragePriceShapeIdRef.current = null;
    sellAveragePriceShapeIdRef.current = null;
    isInitialBarRef.current = true;
    noDataRef.current = null;
    previousPriceRef.current = null;
    isInitialPriceMessageRef.current = true;
    tokenSupplyRef.current = null;

    // Reset global stores if appropriate
    setCurrentTokenChartPrice("");
    setCurrentTokenChartPriceUsd("");
    setCurrentTokenChartSupply("1000000000");
    resetCurrentTokenDeveloperTradesState();

    // Stop websocket stream
    stopTokenMessage();
    stopChartTradesMessage();

    chartUpdateGlobalStateQueue.length = 0;
    /* console.log("WS HOOK 📺 - chartToken | Main cleanup finished.") */
  };

  const currencyCookiesGlobal: CurrencyChart =
    (cookies.get("_chart_currency") as CurrencyChart) || "SOL";
  const currencyRef = useRef<CurrencyChart | null>(null);
  const tokenSupplyRef = useRef<number | null>(1_000_000_000);

  // useEffect(() => {
  //   if (typeof localStorage.getItem("is_ref") === undefined) {
  //     localStorage.setItem("is_ref", "true");
  //   }
  // }, []);

  useEffect(() => {
    if (!currencyRef.current) {
      currencyRef.current = currencyCookiesGlobal;
    }
  }, [currencyRef.current, currencyCookiesGlobal]);

  // Store in Global State for PnL 📊
  const setCurrentTokenChartPrice = useCurrentTokenChartPriceStore(
    (state) => state.setCurrentTokenChartPrice,
  );
  const setCurrentTokenChartPriceUsd = useCurrentTokenChartPriceStore(
    (state) => state.setCurrentTokenChartPriceUsd,
  );
  const setCurrentTokenChartSupply = useCurrentTokenChartPriceStore(
    (state) => state.setCurrentTokenChartSupply,
  );
  const chartUpdateGlobalStateQueue: {
    price: string;
    price_usd: string;
    supply: string;
  }[] = [];

  let chartTrades: Trade[] = [];
  const isChartLoadedRef = useRef(false); // Assume initially not loaded

  const handleThrottledCurrentTokenChartUpdate = useCallback(
    throttle((data: { price: string; price_usd: string; supply: string }) => {
      setCurrentTokenChartPrice(data.price);
      setCurrentTokenChartPriceUsd(data.price_usd);
      setCurrentTokenChartSupply(data.supply);
    }, 300),
    [
      setCurrentTokenChartPrice,
      setCurrentTokenChartPriceUsd,
      setCurrentTokenChartSupply,
    ],
  );

  const handleQueuedOrThrottledChartUpdate = useCallback(
    (data: { price: string; price_usd: string; supply: string }) => {
      if (!isChartLoadedRef.current || isQueueMessage.current) {
        chartUpdateGlobalStateQueue.push(data);
      } else {
        handleThrottledCurrentTokenChartUpdate(data);
      }
    },
    [handleThrottledCurrentTokenChartUpdate],
  );

  const flushTradeQueue = useCallback(() => {
    const selectedResolution = (
      localStorage.getItem("chart_interval_resolution") ||
      tvWidgetRef.current?.activeChart().resolution() ||
      cookies.get("_chart_interval_resolution") ||
      "1S"
    ).toUpperCase();

    const existingTrades = tradeMap.current.get(
      `${mint}-${selectedResolution}`,
    );

    const currency: CurrencyChart =
      (localStorage.getItem("chart_currency") as CurrencyChart) || "SOL";

    const chartType: ChartType =
      (localStorage.getItem("chart_type") as ChartType) || "Price";

    if (!selectedResolution || (chartTrades || []).length === 0) return;

    const convertedTrades = (chartTrades || [])?.map((trade: any) => ({
      ...trade,
      timestamp:
        String(trade.timestamp).length <= 10
          ? trade.timestamp * 1000
          : trade.timestamp,
    }));

    if (existingTrades) {
      convertedTrades?.forEach((trade: any) => {
        if (!trade) return;
        existingTrades?.push(trade);
      });
    } else {
      tradeMap.current.set(`${mint}-${selectedResolution}`, convertedTrades);
    }

    if (tvWidgetRef.current?.activeChart) {
      tvWidgetRef.current.activeChart().refreshMarks();
    }

    const lastTrade = chartTrades[(chartTrades || []).length - 1];

    if (lastTrade.letter === "B") {
      const tradeStartTime = getBarStartTime(Date.now(), selectedResolution);

      removeAveragePriceLine(
        "buy",
        tvWidgetRef.current,
        buyAveragePriceShapeIdRef.current,
      );

      const priceByCurrency = parseFloat(
        currency === "SOL"
          ? lastTrade?.average_price_base?.toString()
          : lastTrade?.average_price_usd?.toString(),
      );

      buyAveragePriceTradeStartTimeRef.current = tradeStartTime;
      const supply =
        convertDecimals(lastTrade?.supply_str || 0, quoteDecimalsRef.current!)
      console.warn("SUPPLYYYYY 1🙏", supply, lastTrade?.supply_str || 0, priceByCurrency, supply * priceByCurrency, quoteDecimalsRef.current)
      buyAveragePriceShapePriceRef.current =
        chartType === "MCap"
          ? priceByCurrency * Number(supply)
          : priceByCurrency;

      // @ts-ignore
      buyAveragePriceShapeIdRef.current = addAveragePriceLine(
        "buy",
        tvWidgetRef.current,
        tradeStartTime,
        buyAveragePriceShapePriceRef.current,
      );

      if (localStorage.getItem("chart_hide_buy_avg_price_line") === "true") {
        removeAveragePriceLine(
          "buy",
          tvWidgetRef.current,
          buyAveragePriceShapeIdRef.current,
        );
      }
    }

    if (lastTrade.letter === "S") {
      const tradeStartTime = getBarStartTime(Date.now(), selectedResolution);

      removeAveragePriceLine(
        "sell",
        tvWidgetRef.current,
        sellAveragePriceShapeIdRef.current,
      );

      const priceByCurrency =
        currency === "SOL"
          ? lastTrade?.average_sell_price_base
          : lastTrade?.average_sell_price_usd

      sellAveragePriceTradeStartTimeRef.current = tradeStartTime;
      const supply =
        convertDecimals(lastTrade?.supply_str || 0, quoteDecimalsRef.current!)
      console.warn("SUPPLYYYYY 2🙏", supply, lastTrade?.supply_str || 0, priceByCurrency, supply * priceByCurrency, quoteDecimalsRef.current)
      sellAveragePriceShapePriceRef.current =
        chartType === "MCap"
          ? priceByCurrency * Number(supply)
          : priceByCurrency;

      // @ts-ignore
      sellAveragePriceShapeIdRef.current = addAveragePriceLine(
        "sell",
        tvWidgetRef.current,
        tradeStartTime,
        sellAveragePriceShapePriceRef.current,
      );

      if (localStorage.getItem("chart_hide_sell_avg_price_line") === "true") {
        removeAveragePriceLine(
          "sell",
          tvWidgetRef.current,
          sellAveragePriceShapeIdRef.current,
        );
      }
    }

    chartTrades = [];
  }, [mint, chartTrades]);

  // Store in Global State for User Trades ✨
  const setUserTrades = useTokenHoldingStore((state) => state.setUserTrades);

  // Store in Global State for Developer Trades ✨
  const developerAddress = useTokenMessageStore(
    (state) => state.dataSecurityMessage.deployer,
  );
  const resetCurrentTokenDeveloperTradesState =
    useCurrentTokenDeveloperTradesStore(
      (state) => state.resetCurrentTokenDeveloperTradesState,
    );
  const developerTrades = useCurrentTokenDeveloperTradesStore(
    (state) => state.developerTrades,
  );

  const chartContainerRef = useRef<HTMLDivElement>(
    null,
  ) as React.RefObject<HTMLInputElement>;
  const [isTVChartReady, setIsTvChartReady] = useState<boolean>(false);
  const [isLoadingMarks, setIsLoadingMarks] = useState<boolean>(true);
  const [tvWidgetReady, setTvWidgetReady] = useState<boolean>(false);
  const loadCount = useRef(0);
  const intervalStudiesRef = useRef<NodeJS.Timeout | null>(null);
  const intervalDrawingsRef = useRef<NodeJS.Timeout | null>(null);
  const isResetting = useRef<boolean>(false);

  const currentSymbolInfo = useRef<LibrarySymbolInfo | null>(null);

  const isQueueMessage = useRef<boolean>(true);

  const { getCurrentServerTime } = useServerTimeStore();
  // const getCurrentServerTime = () => {
  //   return Date.now();
  // }

  // Change map to store { fn, cancel } per key
  const throttledChartProcessorMap = useRef(
    new Map<
      string,
      {
        fn: (chartPrice: TokenDataMessageType["price"]) => void;
        cancel: () => void;
      }
    >(),
  ).current;

  const getThrottledChartProcessor = (
    sub: any,
    selectedResolution: string,
    currency: CurrencyChart,
    chartType: ChartType,
    previousPriceRef: React.RefObject<number | null>,
  ) => {
    const key = sub.mint + selectedResolution + chartType + currency;

    // 🔁 Clean up previous throttle with same mint but different resolution
    for (const existingKey of throttledChartProcessorMap.keys()) {
      if (
        (existingKey.startsWith(sub.mint) && existingKey !== key) ||
        !isTVChartReady
      ) {
        throttledChartProcessorMap.get(existingKey)?.cancel?.(); // cancel throttle
        throttledChartProcessorMap.delete(existingKey); // remove from map
      }
    }

    if (!throttledChartProcessorMap.has(key)) {
      const throttledFn = throttle(
        (chartPrice: TokenDataMessageType["price"]) => {
          if (
            ((chartPrice && chartPrice?.price_base) ||
              chartPrice?.price_base ||
              "0") === undefined
          )
            return;

          if (
            isInitialNoDataRef.current &&
            transactionMessagesLengthRef.current > 0 &&
            tvWidgetRef.current
          ) {
            isInitialNoDataRef.current = false;
            sub.onResetCacheNeededCallback();
            tvWidgetRef.current?.activeChart().resetData();
          }

          const newSupply = Number(chartPrice?.supply || tokenSupplyRef.current)
          if (!isChartLoadedRef.current || isQueueMessage.current) {
            handleQueuedOrThrottledChartUpdate({
              price:
                chartPrice?.price_base?.toString() || chartPrice?.price_base?.toString() || "0",
              price_usd: chartPrice?.price_usd?.toString() || "0",
              supply: String(newSupply),
            });
          }

          const currentTime = getCurrentServerTime();
          const barStartTime = getBarStartTime(currentTime, sub.resolution);

          if (tokenSupplyRef.current !== newSupply) {
            tokenSupplyRef.current = newSupply;
          }

          let nextPrice = parseFloat(
            currency === "SOL"
              ? chartPrice?.price_base?.toString() || "0"
              : chartPrice?.price_usd?.toString() || "0",
          );
          console.warn("New Supply💓💓💓", {
            newSupply,
            tokenSupplyRef: tokenSupplyRef.current,
            nextPrice,
            usd: chartPrice?.price_usd?.toString() || "0",
            sol: chartPrice?.price_base?.toString() || "0",
            chartPrice,
            quoteDecimalsRef: quoteDecimalsRef.current
          })
          const nextVolume = convertDecimals(chartPrice?.volume_base || 0, baseDecimalsRef.current!)

          if (chartType === "MCap") {
            if (isNaN(newSupply) || newSupply <= 0) return;
            nextPrice *= newSupply;
            if (nextPrice <= 0) return;
          }

          const lastBar = lastBarRef.current[selectedResolution];

          if (lastBar && lastBar.time === barStartTime) {
            const updatedBar: Bar = {
              ...lastBar,
              high: Math.max(lastBar.open, nextPrice, lastBar.high),
              low: Math.min(lastBar.open, nextPrice, lastBar.low),
              close: nextPrice,
              volume: (lastBar.volume || 0) + (nextVolume || 0),
            };
            sub.callback(updatedBar);
            lastBarRef.current[selectedResolution] = updatedBar;
            // const el = document.getElementById("candle-time");
            // if (el) {
            //   el.innerHTML = new Date(lastBar.time).toLocaleString();
            // }
          } else {
            const newBar: Bar = {
              time: barStartTime,
              open: lastBar?.close ?? nextPrice,
              high: Math.max(lastBar?.close ?? nextPrice, nextPrice),
              low: Math.min(lastBar?.close ?? nextPrice, nextPrice),
              close: nextPrice,
              volume: nextVolume || 0,
            };
            sub.callback(newBar);
            lastBarRef.current[selectedResolution] = newBar;
            // const el = document.getElementById("candle-time");
            // if (el) {
            //   el.innerHTML = new Date(barStartTime).toLocaleString();
            // }
          }

          isInitialPriceMessageRef.current = false;
          updateTitle(nextPrice, sub.symbolInfo.name, previousPriceRef);
        },
        250,
        { leading: true, trailing: true },
      );

      throttledChartProcessorMap.set(key, {
        fn: throttledFn,
        cancel: throttledFn.cancel,
      });
    }

    return throttledChartProcessorMap.get(key)!.fn;
  };

  // const resolutionRef = useRef(resolution);
  //
  // useEffect(() => {
  //   resolutionRef.current = resolution;
  // }, [resolution]);

  const { sendMessage: sendTokenMessage, stopMessage: stopTokenMessage } =
    useWebSocket<WSMessage<TokenDataMessageType>>({
      channel: mint as string,
      // initialMessage: {
      //   channel: mint,
      //   action: "join",
      //   from: getCurrentServerTime(),
      // },
      onMessage: (event) => {
        if (!subscribersMap.current) return;
        if (!isRelevantMessage(event, mint)) return;

        const message: TokenDataMessageType = event.data;
        if (!message) return;

        if (!message.price) return;

        setCurrentTokenChartPrice(
          message.price?.price_base?.toString() || message.price?.price_base?.toString() || "0",
        );
        setCurrentTokenChartPriceUsd(message.price.price_usd?.toString());
        setCurrentTokenChartSupply(message.price.supply?.toString());

        const chartPrice = convertChartHoldingsLamports(message).price;
        // if price message from websocket is null then don't update chart
        if (!chartPrice) return;

        subscribersMap.current.forEach((sub) => {
          const currency: CurrencyChart =
            (localStorage
              .getItem("chart_currency")
              ?.toUpperCase() as CurrencyChart) || "SOL";

          const chartType: ChartType =
            (localStorage.getItem("chart_type") as ChartType) || "Price";

          if (sub) sub.lastMessageTimestamp = getCurrentServerTime();

          const selectedResolution = (
            localStorage.getItem("chart_interval_resolution") ||
            tvWidgetRef.current?.activeChart().resolution() ||
            cookies.get("_chart_interval_resolution") ||
            "1S"
          ).toUpperCase();

          if (selectedResolution !== sub.resolution) return;

          const currentTime = getCurrentServerTime();
          const barStartTime = getBarStartTime(currentTime, sub.resolution);

          const resolutionMs =
            parseResolutionToMilliseconds(selectedResolution);
          let lastBar = lastBarRef.current[selectedResolution];
          if (!lastBar) return;

          // 🔁 Fill missing bars if gap detected
          if (lastBar && lastBar.time + resolutionMs < barStartTime) {
            const missingBarTime = lastBar.time + resolutionMs;
            const fillerBar: Bar = {
              time: missingBarTime,
              open: lastBar.close,
              high: lastBar.close,
              low: lastBar.close,
              close: lastBar.close,
              volume: 0,
            };
            sub.callback(fillerBar);
            lastBarRef.current[selectedResolution] = fillerBar;
            lastBar = fillerBar;
            // const el = document.getElementById("candle-time");
            // if (el) {
            //   el.innerHTML = new Date(missingBarTime).toLocaleString();
            // }
          }

          const processor = getThrottledChartProcessor(
            sub,
            selectedResolution,
            currency,
            chartType,
            previousPriceRef,
          );

          processor(chartPrice);
        });
      },
    });

  const { stopMessage: stopChartTradesMessage } = useWebSocket({
    channel: "chartTrades",
    initialMessage: {
      channel: "chartTrades",
      mint,
      action: "join",
    },
    onMessage: (event) => {
      if (event?.channel === "ping") return;

      if (event?.success === true) return;

      const data = event;

      const shouldAddToQueue = subscribersMap.current.size === 0;

      const isReadyToFlush = isChartLoadedRef.current;

      const flushTrade = chartTrades?.length > 0 && isReadyToFlush;

      if (shouldAddToQueue) {
        if (event.channel === "chartTrades") {
          /* console.log("chart trades hahaha", event.data) */ chartTrades =
            event.data;
        }
      }

      if (flushTrade) {
        // console.log(
        //   "TRADINGVIEW PROGRESS: FLUSHING TRADE QUEUE...",
        //   chartTrades,
        // );
        flushTradeQueue();
      }

      subscribersMap.current?.forEach((sub) => {
        const currency: CurrencyChart =
          (localStorage.getItem("chart_currency") as CurrencyChart) || "SOL";

        const chartType: ChartType =
          (localStorage.getItem("chart_type") as ChartType) || "Price";

        // if (sub) sub.lastMessageTimestamp = getCurrentServerTime();

        const selectedResolution = (
          localStorage.getItem("chart_interval_resolution") ||
          tvWidgetRef.current?.activeChart().resolution() ||
          cookies.get("_chart_interval_resolution") ||
          "1S"
        ).toUpperCase();

        if (selectedResolution !== sub.resolution) return;

        if (data?.letter) {
          // Marks
          const existingTrades = tradeMap.current.get(
            `${sub.mint}-${sub.resolution}`,
          );
          /* console.log("WS HOOK 📺 - chartToken | messages ", data) */ /* console.log("WS HOOK 📺 - chartToken | messages ", existingTrades) */ const convertedTrade: Trade =
          {
            ...(data as Trade),
            timestamp:
              String((data as Trade)?.timestamp)?.length <= 10
                ? (data as Trade)?.timestamp * 1000
                : (data as Trade)?.timestamp,
          };
          if (existingTrades) {
            existingTrades.push(convertedTrade);
          } else {
            tradeMap.current.set(`${sub.mint}-${sub.resolution}`, [
              convertedTrade,
            ]);
          }

          if (tvWidgetRef.current && tvWidgetRef.current?.activeChart) {
            tvWidgetRef.current?.activeChart()?.refreshMarks();
          }

          // Avg Price Line
          // ### BUY
          if (data.letter === "B") {
            const tradeStartTime = getBarStartTime(
              getCurrentServerTime(),
              sub.resolution,
            );
            removeAveragePriceLine(
              "buy",
              tvWidgetRef.current,
              buyAveragePriceShapeIdRef.current,
            );
            const priceByCurrency = parseFloat(
              currency === "SOL"
                ? (data as Trade).average_price_base?.toString()
                : (data as Trade).average_price_usd?.toString(),
            );

            buyAveragePriceTradeStartTimeRef.current = tradeStartTime;
            const supply =
              convertDecimals(data?.supply_str || 0, quoteDecimalsRef.current!)
            console.warn("SUPPLYYYYY 3🙏", supply, data?.supply_str || 0, priceByCurrency, supply * priceByCurrency, quoteDecimalsRef.current)
            if (chartType === "MCap") {
              buyAveragePriceShapePriceRef.current =
                priceByCurrency * Number(supply);
            } else {
              buyAveragePriceShapePriceRef.current = priceByCurrency;
            }

            // @ts-ignore
            buyAveragePriceShapeIdRef.current = addAveragePriceLine(
              "buy",
              tvWidgetRef.current,
              tradeStartTime,
              buyAveragePriceShapePriceRef.current,
            );
            if (
              localStorage.getItem("chart_hide_buy_avg_price_line") === "true"
            ) {
              removeAveragePriceLine(
                "buy",
                tvWidgetRef.current,
                buyAveragePriceShapeIdRef.current,
              );
            }
          }

          // ### SELL
          if (data.letter === "S") {
            const tradeStartTime = getBarStartTime(
              getCurrentServerTime(),
              sub.resolution,
            );
            removeAveragePriceLine(
              "sell",
              tvWidgetRef.current,
              sellAveragePriceShapeIdRef.current,
            );
            const priceByCurrency =
              currency === "SOL"
                ? (data as Trade).average_sell_price_base
                : (data as Trade).average_sell_price_usd

            sellAveragePriceTradeStartTimeRef.current = tradeStartTime;
            const supply =
              convertDecimals(data?.supply_str || 0, quoteDecimalsRef.current!)
            console.warn("SUPPLYYYYY 4🙏", supply, data?.supply_str || 0, priceByCurrency, supply * priceByCurrency, quoteDecimalsRef.current)
            if (chartType === "MCap") {
              sellAveragePriceShapePriceRef.current =
                priceByCurrency * Number(supply);
            } else {
              sellAveragePriceShapePriceRef.current = priceByCurrency;
            }

            // @ts-ignore
            sellAveragePriceShapeIdRef.current = addAveragePriceLine(
              "sell",
              tvWidgetRef.current,
              tradeStartTime,
              sellAveragePriceShapePriceRef.current,
            );
            if (
              localStorage.getItem("chart_hide_sell_avg_price_line") === "true"
            ) {
              removeAveragePriceLine(
                "sell",
                tvWidgetRef.current,
                sellAveragePriceShapeIdRef.current,
              );
            }
          }

          return;
        }

        if (data?.channel === "chartTrades") {
          if (data?.length === 0 || data === undefined) return;

          // Marks
          const existingTrades = tradeMap.current.get(
            `${sub.mint}-${sub.resolution}`,
          );

          if (Array.isArray(data?.data)) {
            const convertedTrades = (data?.data || [])?.map((trade: any) => {
              return {
                ...trade,
                timestamp:
                  String(trade.timestamp)?.length <= 10
                    ? trade.timestamp * 1000
                    : trade.timestamp,
              };
            });
            if (existingTrades) {
              convertedTrades?.forEach((trade: any) => {
                if (!trade) return;
                existingTrades?.push(trade);
              });
            } else {
              tradeMap.current.set(
                `${sub.mint}-${sub.resolution}`,
                convertedTrades,
              );
            }
          }

          if (tvWidgetRef.current && tvWidgetRef.current?.activeChart) {
            tvWidgetRef.current?.activeChart()?.refreshMarks();
          }

          // Avg Price Line
          const lastTrade = data[data?.length - 1];
          if (!lastTrade) return;

          // ### BUY
          if (lastTrade.letter === "B") {
            const tradeStartTime = getBarStartTime(
              getCurrentServerTime(),
              sub.resolution,
            );
            removeAveragePriceLine(
              "buy",
              tvWidgetRef.current,
              buyAveragePriceShapeIdRef.current,
            );
            const priceByCurrency = parseFloat(
              currency === "SOL"
                ? lastTrade?.average_price_base
                : lastTrade?.average_price_usd,
            );

            buyAveragePriceTradeStartTimeRef.current = tradeStartTime;
            const supply =
              convertDecimals(lastTrade?.supply_str || 0, quoteDecimalsRef.current!)
            console.warn("SUPPLYYYYY 5🙏", supply, lastTrade?.supply_str || 0, priceByCurrency, supply * priceByCurrency, quoteDecimalsRef.current)
            if (chartType === "MCap") {
              buyAveragePriceShapePriceRef.current =
                priceByCurrency * Number(supply);
            } else {
              buyAveragePriceShapePriceRef.current = priceByCurrency;
            }

            // @ts-ignore
            buyAveragePriceShapeIdRef.current = addAveragePriceLine(
              "buy",
              tvWidgetRef.current,
              tradeStartTime,
              buyAveragePriceShapePriceRef.current,
            );

            if (
              localStorage.getItem("chart_hide_buy_avg_price_line") === "true"
            ) {
              removeAveragePriceLine(
                "buy",
                tvWidgetRef.current,
                buyAveragePriceShapeIdRef.current,
              );
            }
          }

          // ### SELL
          if (lastTrade.letter === "S") {
            const tradeStartTime = getBarStartTime(
              getCurrentServerTime(),
              sub.resolution,
            );
            removeAveragePriceLine(
              "sell",
              tvWidgetRef.current,
              sellAveragePriceShapeIdRef.current,
            );
            const priceByCurrency = parseFloat(
              currency === "SOL"
                ? lastTrade?.average_sell_price_base
                : lastTrade?.average_sell_price_usd,
            );

            sellAveragePriceTradeStartTimeRef.current = tradeStartTime;
            const supply =
              convertDecimals(lastTrade?.supply_str || 0, quoteDecimalsRef.current!)
            console.warn("SUPPLYYYYY 6🙏", supply, lastTrade?.supply_str || 0, priceByCurrency, supply * priceByCurrency, quoteDecimalsRef.current)
            if (chartType === "MCap") {
              sellAveragePriceShapePriceRef.current =
                priceByCurrency * Number(supply);
            } else {
              sellAveragePriceShapePriceRef.current = priceByCurrency;
            }

            // @ts-ignore
            sellAveragePriceShapeIdRef.current = addAveragePriceLine(
              "sell",
              tvWidgetRef.current,
              tradeStartTime,
              sellAveragePriceShapePriceRef.current,
            );
          }

          if (
            localStorage.getItem("chart_hide_sell_avg_price_line") === "true"
          ) {
            removeAveragePriceLine(
              "sell",
              tvWidgetRef.current,
              sellAveragePriceShapeIdRef.current,
            );
          }

          return;
        }
      });
    },
  });

  const candles = useRef<NovaChart | null>(null);
  const symbols = useRef<{
    name: string;
    symbol: string;
    image: string;
    dex: string;
    created_at: number;
  } | null>(null);
  const trade = useRef<NovaChartTrades | null>(null);

  useEffect(() => {
    if (tokenData) {
      quoteDecimalsRef.current = tokenData.token.quote_decimals;
      baseDecimalsRef.current = tokenData.token.base_decimals;
    }
  }, [tokenData])

  useEffect(() => {
    if (!mint) return;

    function loadScriptWithRetry(
      src: string,
      maxRetries = 3,
      delayMs = 500,
    ): Promise<void> {
      let attempts = 0;
      let timeoutId: ReturnType<typeof setTimeout> | null = null;

      const attemptLoad = (): Promise<void> => {
        return new Promise((resolve, reject) => {
          const existingScript = document.querySelector(`script[src="${src}"]`);
          if (existingScript) {
            resolve();
            return;
          }

          const script = document.createElement("script");
          script.src = src;
          script.async = true;

          script.onload = () => {
            if (timeoutId) clearTimeout(timeoutId);
            resolve();
          };

          script.onerror = () => {
            if (attempts < maxRetries) {
              attempts++;
              const backoff = delayMs * 2 ** (attempts - 1);
              console.warn(
                `Retrying script load (${attempts}) in ${backoff}ms`,
              );

              timeoutId = setTimeout(() => {
                attemptLoad().then(resolve).catch(reject);
              }, backoff);
            } else {
              reject(
                new Error(
                  `Failed to load script after ${maxRetries} attempts: ${src}`,
                ),
              );
            }
          };

          document.head.appendChild(script);
        });
      };

      return attemptLoad();
    }

    const injectChart = async () => {
      try {
        await loadScriptWithRetry(
          "/static/charting_library/charting_library.standalone.js",
        );
      } catch (error) {
        console.error("Failed to load TradingView charting library:", error);
      }
    };

    injectChart();

    let handleStorageChange: (e: StorageEvent) => void;

    const earlyFetch = async () => {
      /* console.log("TRADINGVIEW PROGRESS: earlyFetch") */
      let cachedSymbols: Symbols | null = null;

      if (tokenData) {
        cachedSymbols = {
          name: tokenData.token.name,
          symbol: tokenData.token.symbol,
          image: tokenData.token.image,
          dex: tokenData.token.dex,
          created_at: tokenData.token.created_at,
        };
        quoteDecimalsRef.current = tokenData.token.quote_decimals;
        baseDecimalsRef.current = tokenData.token.base_decimals;
      }

      const resolution = (
        localStorage.getItem("chart_interval_resolution") ||
        tvWidgetRef.current?.activeChart().resolution() ||
        cookies.get("_chart_interval_resolution") ||
        "1S"
      ).toUpperCase();

      /* console.log("early fetch: ", resolution) */
      const currency: CurrencyChart =
        (localStorage.getItem("chart_currency") as CurrencyChart) || "SOL";

      // @ts-ignore
      const interval = PRICE_MAP[resolution];

      // @ts-ignore
      const from: number = getHistoricalFromInterval[interval];
      const queryKey = [
        "candles",
        mint,
        currency?.toLowerCase(),
        interval?.toLowerCase(),
      ];

      const cachedCandles: NovaChart | undefined =
        queryClientNormal.getQueryData(queryKey);

      if (cachedCandles) {
        candles.current = cachedCandles;
      } else {
        console.warn("Early Fetch ✨", {
          symbols: symbols.current,
          isMoreThan24Hours:
            Date.now() - (symbols.current?.created_at ?? 0) >
            twentyFourHoursInMilliseconds,
          now: Date.now(),
          createdAt: symbols.current?.created_at ?? Date.now(),
        });

        candles.current = await queryClient.fetchQuery({
          queryKey: [
            "candles",
            mint,
            currency.toLocaleLowerCase(),
            interval?.toLowerCase(),
          ],
          queryFn: () =>
            fetchHistoricalData({
              mint,
              interval,
              currency: currency?.toLowerCase() as "sol" | "usd",
              from: getCurrentServerTime() - from,
              // from:
              //   Date.now() - (symbols.current?.created_at ?? 0) >
              //   twentyFourHoursInMilliseconds
              //     ? Date.now() - twentyFourHoursInMilliseconds
              //     : 0,
              to: getCurrentServerTime() + 60,
              countBack: 300,
              initial: isInitialBarRef.current,
            }),
          staleTime: 10000,
          gcTime: 10000,
        });
        if (candles.current?.quote_decimals) quoteDecimalsRef.current = candles.current?.quote_decimals;
        if (candles.current?.supply) tokenSupplyRef.current = candles.current?.supply;
      }

      const userTradesResult = await queryClientNormal.fetchQuery({
        queryKey: ["user-trades", mint],
        queryFn: () => fetchSeparatedTradesData(mint, "user"),
        staleTime: 10000,
        gcTime: 10000,
        retry: 3,
      });

      const normalizedUserTrades = normalizeTradesLetter({
        trades: userTradesResult?.user_trades ?? [],
        buyLetter: "B",
        sellLetter: "S",
      });

      trade.current = {
        ...(trade.current ?? {}),
        user_trades: normalizedUserTrades,
      } as NovaChartTrades;

      const [walletTrackerResult, developerResult] = await Promise.allSettled([
        queryClientNormal.fetchQuery({
          queryKey: ["wallet-tracker-trades", mint],
          queryFn: () => fetchSeparatedTradesData(mint, "wallet-tracker"),
          staleTime: 10000,
          gcTime: 10000,
          retry: 3,
        }),
        // .then(async (res) => {
        //   await delay(10_000);
        //   return res;
        // }),

        queryClientNormal.fetchQuery({
          queryKey: ["developer-trades", mint],
          queryFn: () => fetchSeparatedTradesData(mint, "developer"),
          staleTime: 10000,
          gcTime: 10000,
          retry: 3,
        }),
        // .then(async (res) => {
        //   await delay(10_000); // 2s delay after fetching
        //   return res;
        // }),
      ]);

      if (walletTrackerResult.status === "fulfilled") {
        trade.current = {
          ...(trade.current ?? {}),
          other_trades: walletTrackerResult.value.other_trades,
        } as NovaChartTrades;

        const tradeKey = `${mint}-${resolution}`;
        const existingTrades = tradeMap.current.get(tradeKey) ?? [];

        const filteredTrades = [
          ...(walletTrackerResult.value.other_trades ?? []),
        ].filter((tx) => {
          return (
            tx.timestamp !== 0 && !isNaN(Number(tx.price))
          );
        });

        if (existingTrades.length > 0) {
          for (const newTrade of filteredTrades) {
            if (!newTrade) continue;

            const isDuplicate = existingTrades.some((existingTrade) =>
              areTradesEqual(existingTrade, newTrade),
            );

            if (!isDuplicate) {
              existingTrades.push(newTrade);
            }
          }
        } else {
          tradeMap.current.set(tradeKey, filteredTrades);
        }
      } else {
        console.warn("wallet-tracker fetch failed", walletTrackerResult.reason);
      }

      if (developerResult.status === "fulfilled") {
        const normalizedDeveloperTrades = normalizeTradesLetter({
          trades: developerResult.value.developer_trades ?? [],
          buyLetter: "DB",
          sellLetter: "DS",
        });
        trade.current = {
          ...(trade.current ?? {}),
          developer_trades: normalizedDeveloperTrades,
        } as NovaChartTrades;

        const tradeKey = `${mint}-${resolution}`;
        const existingTrades = tradeMap.current.get(tradeKey) ?? [];

        const filteredTrades = [
          ...(normalizedDeveloperTrades ?? []),
        ].filter((tx) => {
          return (
            tx.timestamp !== 0 && !isNaN(Number(tx.price))
          );
        });

        if (existingTrades.length > 0) {
          for (const newTrade of filteredTrades) {
            if (!newTrade) continue;

            const isDuplicate = existingTrades.some(
              (existingTrade) => existingTrade.signature === newTrade.signature,
            );

            if (!isDuplicate) {
              existingTrades.push(newTrade);
            }
          }
        } else {
          tradeMap.current.set(tradeKey, filteredTrades);
        }
      } else {
        console.warn("developer fetch failed", developerResult.reason);
      }

      if (trade.current) {
        console.warn("TRADES DEBUG ✨ - 0", trade.current);

        // if (Array.isArray(trade.current.user_trades) && trade.current.user_trades?.length === 0 || trade.current.user_trades === null) {
        //   trade.current = await queryClientNormal.fetchQuery({
        //     queryKey: ["trades", mint],
        //     queryFn: () => fetchInitTradesData(mint),
        //     staleTime: 10000,
        //     gcTime: 10000,
        //     retry: false,
        //   });
        //   console.warn("TRADES DEBUG ✨ - 0.5", trade.current);
        // }
      }

      if (cachedSymbols) {
        symbols.current = cachedSymbols;
      } else {
        symbols.current = await queryClient.fetchQuery({
          queryKey: ["metadata", mint],
          queryFn: async () => {
            let res = await fetchResolveSymbol(mint);

            return {
              name: res.name,
              symbol: res.symbol,
              image: res.image,
              dex: res.dex,
              created_at: res?.created_at || Date.now(),
            };
          },
          staleTime: 10000,
          gcTime: 10000,
        });
      }
    };

    earlyFetch();

    const loadChart = async () => {
      try {
        const initialWidgetOptions: ChartingLibraryWidgetOptions = {
          debug: false,
          symbol: mint,
          interval: getIntervalResolution(),
          time_frames: [
            { text: "3m", resolution: "60" as ResolutionString },
            { text: "1m", resolution: "30" as ResolutionString },
            { text: "5d", resolution: "5" as ResolutionString },
            { text: "1d", resolution: "1" as ResolutionString },
          ],
          container:
            chartContainerRef.current ||
            document.querySelector("#trading-view"),
          load_last_chart: true,
          fullscreen: false,
          autosize: true,
          library_path: "/static/charting_library/",
          locale: "en" as LanguageCode,
          timezone: getTimeZone(),
          enabled_features: [
            "timeframes_toolbar",
            "symbol_search_hot_key",
            "left_toolbar",
            "display_market_status",
            "seconds_resolution",
            "two_character_bar_marks_labels",
            "saveload_separate_drawings_storage",
          ],
          disabled_features: [
            "study_templates",
            "header_symbol_search",
            "header_compare",
            "header_saveload",
            "header_quick_search",
            "symbol_search_hot_key",
            "symbol_info",
            "edit_buttons_in_legend",
            "create_volume_indicator_by_default",
          ],
          custom_font_family: "'Geist', sans-serif",
          custom_css_url: "../themed.css",
          overrides: {
            volumePaneSize: "large",
            "scalesProperties.fontSize": 11,
            "scalesProperties.textColor": "#FFFFFF",

            "paneProperties.legendProperties.showLegend": true,
            "paneProperties.legendProperties.showVolume": true,
            "paneProperties.legendProperties.showSeriesOHLC": true,
            "paneProperties.backgroundType": "solid",
            "paneProperties.background": "#080812",
            "paneProperties.vertGridProperties.color": "#1a1a2e",
            "paneProperties.horzGridProperties.color": "#1a1a2e",

            "mainSeriesProperties.candleStyle.upColor": "#8CD9B6",
            "mainSeriesProperties.candleStyle.downColor": "#F65B93",
            "mainSeriesProperties.candleStyle.borderUpColor": "#8CD9B6",
            "mainSeriesProperties.candleStyle.borderDownColor": "#F65B93",
            "mainSeriesProperties.candleStyle.wickUpColor": "#8CD9B6",
            "mainSeriesProperties.candleStyle.wickDownColor": "#F65B93",
          },
          studies_overrides: {
            "volume.volume.color.0": "#F65B93",
            "volume.volume.color.1": "#8CD9B6",
          },
          loading_screen: {
            backgroundColor: "#080812",
            foregroundColor: "#080812",
          },
          custom_formatters: {
            priceFormatterFactory: () => ({
              format: formatChartPrice,
            }),
            studyFormatterFactory: () => ({
              format: formatChartPrice,
            }),
          },
          theme: "dark",
          datafeed: {
            onReady: (callback) => {
              /* console.log("TRADINGVIEW PROGRESS: onReady") */ return callback(
              {
                supported_resolutions: supportedResolutions,
                supports_marks: true,
                supports_time: true,
              },
            );
            },
            searchSymbols: async (
              _userInput,
              _exchange,
              _symbolType,
              onResultReadyCallback,
            ) => {
              /* console.log("TRADINGVIEW PROGRESS: searchSymbols") */ onResultReadyCallback(
              [],
            );
            },
            resolveSymbol: async (symbolName, onSymbolResolvedCallback) => {
              /* console.log("TRADINGVIEW PROGRESS: resolveSymbol") */ const url =
                new URL(window.location.href);
              const nameParam = url.searchParams.get("name") || symbolName;
              const symbolParam = url.searchParams.get("symbol") || "";
              const dexParam = url.searchParams.get("dex") || "";

              let name, symbol, dex;
              if (tokenData?.token) {
                name = tokenData?.token?.name;
                symbol = tokenData?.token?.symbol;
                dex = tokenData?.token?.dex;
                quoteDecimalsRef.current = tokenData.token.quote_decimals;
                baseDecimalsRef.current = tokenData.token.base_decimals;
              }

              if (symbols.current) {
                name = symbols.current.name;
                symbol = symbols.current.symbol;
                dex =
                  symbols.current.dex === "N/A"
                    ? dexParam
                    : symbols.current.dex;
              } else if (!nameParam || !symbolParam || !dexParam) {
                const res = await queryClient.fetchQuery({
                  queryKey: ["metadata", mint],
                  queryFn: () => fetchResolveSymbol(mint),
                  staleTime: 0,
                  gcTime: 0,
                  retry: 10,
                });
                name = res.name;
                symbol = res.symbol;
                dex = res.dex === "N/A" ? dexParam : res.dex;
              } else {
                name = nameParam;
                symbol = symbolParam;
                dex = dexParam;
              }

              // console.log("SP 💘 - TV TOKEN PARAMS ✨", {
              //   nameParam,
              //   symbolParam,
              //   dexParam,
              //   name,
              //   symbol,
              //   dex,
              // });

              const symbolInfo: LibrarySymbolInfo = {
                name: name,
                ticker: mint,
                description: `${symbol
                  }/${localStorage.getItem("chart_currency")} on ${dex} Nova`,
                type: "crypto",
                session: "24x7",
                timezone: getTimeZone(),
                exchange: "",
                listed_exchange: "",
                format: "price",
                minmov: 1,
                pricescale: 100_000_000_000,
                has_intraday: true,
                has_daily: true,
                has_weekly_and_monthly: false,
                has_seconds: true,
                seconds_multipliers: ["1", "5", "15", "30"],
                supported_resolutions: supportedResolutions,
                volume_precision: 8,
                data_status: "streaming",
              };

              onSymbolResolvedCallback(symbolInfo);
            },
            getBars: async (
              symbolInfo,
              resolution,
              periodParams,
              onHistoryCallback,
              onErrorCallback,
            ) => {
              /* console.log("TRADINGVIEW PROGRESS: getBars") */ console.warn(
              "TV DEBUG ✨ | GET BARS RUN 📊",
              getCurrentServerTime(),
            );
              currentSymbolInfo.current = symbolInfo;

              const { from, to, firstDataRequest, countBack } = periodParams;
              // console.log("WS HOOK 📺 - chartToken | getBars", {
              //   from,
              //   to,
              //   firstDataRequest,
              //   countBack,
              // });

              // console.log(
              //   "WS HOOK 📺 - chartToken | HEARTBEAT🛡️🛡️🎨🎨 getbars",
              //   {
              //     from: new Date(from * 1000).toLocaleTimeString(),
              //     to: new Date(to * 1000).toLocaleTimeString(),
              //     diffFromNow: getCurrentServerTime() / 1000 - from,
              //     diffToNow: to - getCurrentServerTime() / 1000,
              //     diffFromTo: to - from,
              //     countBack,
              //     ticker: symbolInfo.ticker,
              //     mint,
              //   },
              // );

              try {
                // console.warn("TRADES DEBUG ✨ - getBars", {
                //   trades: trade.current,
                //   candles: candles.current,
                //   symbols: symbols.current,
                // });

                if (noDataRef.current) {
                  onHistoryCallback([], {
                    noData: true,
                  });
                  return;
                }

                const currency: CurrencyChart =
                  (localStorage.getItem("chart_currency") as CurrencyChart) ||
                  "SOL";
                const chartType: ChartType =
                  (localStorage.getItem("chart_type") as ChartType) || "Price";
                let bars;

                if (candles.current && isInitialBarRef.current) {
                  let supply = tokenSupplyRef.current!;
                  if (candles.current.supply) {
                    tokenSupplyRef.current = candles.current.supply;
                  }

                  // console.log("multi fetch - init exists", {
                  //   mint: symbolInfo.ticker!,
                  //   countBack,
                  //   initCandles: cachedData,
                  //   candles: candles.current,
                  // });

                  const sortedBars = (candles.current.candles || [])
                    ?.sort((a, b) => a.timestamp - b.timestamp)
                    ?.map((bar) => ({
                      time: getBarStartTime(bar.timestamp, resolution),
                      raw: bar, // store raw values to use in second pass
                    }));

                  const adjustedBars: Bar[] = [];
                  let prevClose: number | null = null;

                  for (const { time, raw } of sortedBars) {
                    const openRaw = raw.open;
                    const highRaw = raw.high;
                    const lowRaw = raw.low;
                    const closeRaw = raw.close;
                    const volume = raw.volume;

                    let close = getValueByType(closeRaw, supply);
                    let open = prevClose ?? getValueByType(openRaw, supply);
                    let high = Math.max(
                      open,
                      close,
                      getValueByType(highRaw, supply),
                    );
                    let low = Math.min(
                      open,
                      close,
                      getValueByType(lowRaw, supply),
                    );

                    adjustedBars.push({
                      time,
                      open,
                      high,
                      low,
                      close,
                      volume,
                    });

                    prevClose = close;
                  }
                  if (adjustedBars.length === 1) {
                    const prevCandle = adjustedBars[0];
                    const dummyTime =
                      prevCandle.time -
                      parseResolutionToMilliseconds(resolution);
                    adjustedBars.unshift({
                      time: dummyTime,
                      open: prevCandle.open,
                      high: prevCandle.open,
                      low: prevCandle.open,
                      close: prevCandle.open,
                      volume: prevCandle.volume,
                    });
                  }

                  // sync right token market cap with tradingview only if currency is USD and chart type is MCap
                  if (
                    currency === "USD" &&
                    chartType === "MCap" &&
                    isInitialBarRef.current
                  ) {
                    setPriceMessage((prev) => ({
                      ...prev,
                      market_cap_usd:
                        adjustedBars[adjustedBars.length - 1].close,
                    }));
                    updateDeveloperTokens(mint, {
                      marketCapUsd: adjustedBars[adjustedBars.length - 1].close,
                    });
                  }

                  if (chartType === "Price" && isInitialBarRef.current) {
                    if (currency === "USD") {
                      setPriceMessage((prev) => ({
                        ...prev,
                        price_usd:
                          adjustedBars[
                            adjustedBars.length - 1
                          ].close,
                      }));
                    } else {
                      setPriceMessage((prev) => ({
                        ...prev,
                        price_base: adjustedBars[adjustedBars.length - 1].close,
                      }));
                    }
                  }

                  bars = adjustedBars;
                  isInitCandlesSettedRef.current = true;
                  if (isInitialBarRef.current) {
                    isInitialBarRef.current = false;
                  }
                  noDataRef.current = candles.current.no_data;

                  onHistoryCallback(bars, {
                    noData: candles.current.no_data,
                  });
                } else {
                  // @ts-ignore
                  const interval = PRICE_MAP[resolution] || "1s";

                  const fromMs = from * 1000;
                  const toMs = to * 1000;
                  // console.log("multi fetch - fetching historical data", {
                  //   from: new Date(fromMs).toLocaleTimeString(),
                  //   to: new Date(toMs).toLocaleTimeString(),
                  //   countBack,
                  // });

                  const res = await queryClient.fetchQuery({
                    queryKey: [
                      "candles",
                      mint,
                      currency.toLocaleLowerCase(),
                      interval?.toLowerCase(),
                    ],
                    queryFn: () =>
                      fetchHistoricalData({
                        mint: symbolInfo.ticker!,
                        interval,
                        currency: currency?.toLowerCase() as "sol" | "usd",
                        from: fromMs,
                        to: toMs,
                        countBack,
                        initial: isInitialBarRef.current,
                      }),

                    staleTime: 0,
                    gcTime: 0,
                    retry: 10,
                  });

                  if (res.success === false) {
                    if (isInitialBarRef.current) {
                      isInitialNoDataRef.current = true;
                      onHistoryCallback([], {
                        noData: true,
                      });
                      return;
                    } else {
                      onHistoryCallback(lastRequestBar.current, {
                        noData: false,
                      });
                      return;
                    }
                  }

                  isInitCandlesSettedRef.current = true;

                  let supply = tokenSupplyRef.current!;
                  if (res.supply) {
                    tokenSupplyRef.current = res.supply;
                  }

                  const { candles, no_data } = res;

                  const sortedBars = (candles || [])
                    ?.sort((a, b) => a.timestamp - b.timestamp)
                    ?.map((bar) => ({
                      time: getBarStartTime(bar.timestamp, resolution),
                      raw: bar, // store raw values to use in second pass
                    }));

                  const adjustedBars: Bar[] = [];
                  let prevClose: number | null = null;

                  for (const { time, raw } of sortedBars) {
                    const openRaw = raw.open;
                    const highRaw = raw.high;
                    const lowRaw = raw.low;
                    const closeRaw = raw.close;
                    const volume = raw.volume;

                    let close = getValueByType(closeRaw, supply);
                    let open = prevClose ?? getValueByType(openRaw, supply);
                    let high = Math.max(
                      open,
                      close,
                      getValueByType(highRaw, supply),
                    );
                    let low = Math.min(
                      open,
                      close,
                      getValueByType(lowRaw, supply),
                    );

                    adjustedBars.push({
                      time,
                      open,
                      high,
                      low,
                      close,
                      volume,
                    });

                    prevClose = close;
                  }

                  if (adjustedBars.length === 1) {
                    const prevCandle = adjustedBars[0];
                    const dummyTime =
                      prevCandle.time -
                      parseResolutionToMilliseconds(resolution);
                    adjustedBars.unshift({
                      time: dummyTime,
                      open: prevCandle.open,
                      high: prevCandle.open,
                      low: prevCandle.open,
                      close: prevCandle.open,
                      volume: prevCandle.volume,
                    });
                  }

                  // sync right token market cap with tradingview only if currency is USD and chart type is MCap
                  if (
                    currency === "USD" &&
                    chartType === "MCap" &&
                    isInitialBarRef.current
                  ) {
                    setPriceMessage((prev) => ({
                      ...prev,
                      market_cap_usd:
                        adjustedBars[adjustedBars.length - 1].close,
                    }));
                    updateDeveloperTokens(mint, {
                      marketCapUsd: adjustedBars[adjustedBars.length - 1].close,
                    });
                  }

                  if (chartType === "Price" && isInitialBarRef.current) {
                    if (currency === "USD") {
                      setPriceMessage((prev) => ({
                        ...prev,
                        price_usd:
                          adjustedBars[
                            adjustedBars.length - 1
                          ].close,
                      }));
                    } else {
                      setPriceMessage((prev) => ({
                        ...prev,
                        price_base: adjustedBars[adjustedBars.length - 1].close,
                      }));
                    }
                  }

                  bars = adjustedBars;
                  lastRequestBar.current.push(...adjustedBars);

                  if (isInitialBarRef.current) {
                    isInitialBarRef.current = false;
                  }

                  noDataRef.current = no_data;

                  if (no_data && bars.length === 0) {
                    // console.log("BALALLALLLLAAA✨✨222", no_data, bars.length)
                    isInitialNoDataRef.current = true;
                  }

                  onHistoryCallback(bars, { noData: no_data });
                }
                isQueueMessage.current = false;

                if (tvWidgetRef.current) {
                  tvWidgetRef.current.activeChart()?.refreshMarks();
                }

                if (firstDataRequest) {
                  // console.warn("TRADES DEBUG ✨ - firstDataRequest ✅", {
                  //   trades: trade.current,
                  //   firstDataRequest,
                  // });
                  lastBarRef.current[resolution] = bars[bars.length - 1];

                  updateTitle(
                    lastBarRef.current[resolution].high,
                    symbolInfo?.name as string,
                    previousPriceRef,
                  );

                  if (trade.current && isInitialBarRef.current) {
                    // console.warn("TRADES DEBUG ✨ - trade.current ✅", {
                    //   trades: trade.current,
                    // });

                    const {
                      developer_trades,
                      insider_trades,
                      other_trades,
                      // sniper_trades,
                      user_trades,
                    } = trade.current;

                    // console.log(
                    //   "TRADINGVIEW PROGRESS: use trade cache",
                    //   trade.current,
                    // );

                    const convertedTimestampUniqueUserTrades = (
                      getUniqueTrades(user_trades) || []
                    )?.map((trade) => {
                      return {
                        ...trade,
                        timestamp:
                          String(trade.timestamp).length <= 10
                            ? trade.timestamp * 1000
                            : trade.timestamp,
                      };
                    });

                    // console.warn("TRADES DEBUG ✨ - 1", {
                    //   firstDataRequest,
                    //   developer_trades,
                    //   insider_trades,
                    //   other_trades,
                    //   user_trades,
                    // });

                    const tradeKey = `${symbolInfo.ticker}-${resolution}`;
                    const existingTrades = tradeMap.current.get(tradeKey) ?? [];

                    const filteredTrades = [
                      ...(developer_trades ?? []),
                      ...(insider_trades ?? []),
                      ...(other_trades ?? []),
                      ...(convertedTimestampUniqueUserTrades ?? []),
                    ].filter((tx) => {
                      return (
                        tx.timestamp !== 0 &&
                        !isNaN(Number(tx.price))
                      );
                    });

                    if (existingTrades.length > 0) {
                      for (const newTrade of filteredTrades) {
                        if (!newTrade) continue;

                        const isDuplicate = existingTrades.some(
                          (existingTrade) => {
                            if (
                              existingTrade.letter === "DB" ||
                              existingTrade.letter === "DS"
                            ) {
                              return (
                                existingTrade.signature === newTrade.signature
                              );
                            } else {
                              return areTradesEqual(existingTrade, newTrade);
                            }
                          },
                        );

                        if (!isDuplicate) {
                          existingTrades.push(newTrade);
                        }
                      }
                    } else {
                      tradeMap.current.set(tradeKey, filteredTrades);
                    }

                    // console.warn("TRADES DEBUG ✨ - 1.5", {
                    //   firstDataRequest,
                    //   developer_trades,
                    //   insider_trades,
                    //   other_trades,
                    //   user_trades,
                    // });

                    setUserTrades(user_trades);

                    if (tvWidgetRef.current) {
                      tvWidgetRef.current.activeChart()?.refreshMarks();
                    }

                    const tradeStartTime = getBarStartTime(
                      getCurrentServerTime(),
                      resolution,
                    );

                    if (
                      (Array.isArray(user_trades) &&
                        user_trades.length === 0) ||
                      user_trades === null
                    )
                      return;

                    const lastUserTrade = user_trades[user_trades.length - 1];
                    removeAveragePriceLine(
                      "buy",
                      tvWidgetRef.current,
                      buyAveragePriceShapeIdRef.current,
                    );
                    removeAveragePriceLine(
                      "sell",
                      tvWidgetRef.current,
                      sellAveragePriceShapeIdRef.current,
                    );
                    const buyPriceByCurrency = parseFloat(
                      currency === "SOL"
                        ? lastUserTrade.average_price_base?.toString()
                        : lastUserTrade.average_price_usd?.toString(),
                    );
                    const sellPriceByCurrency =
                      currency === "SOL"
                        ? lastUserTrade.average_sell_price_base
                        : lastUserTrade.average_sell_price_usd

                    buyAveragePriceTradeStartTimeRef.current = tradeStartTime;
                    sellAveragePriceTradeStartTimeRef.current = tradeStartTime;
                    const supply =
                      convertDecimals(lastUserTrade?.supply_str || 0, quoteDecimalsRef.current!)
                    console.warn("SUPPLYYYYY 7🙏", supply, lastUserTrade?.supply_str || 0, buyPriceByCurrency, supply * buyPriceByCurrency, quoteDecimalsRef.current)
                    if (buyPriceByCurrency > 0) {
                      if (chartType === "MCap") {
                        buyAveragePriceShapePriceRef.current =
                          buyPriceByCurrency * Number(supply);
                        sellAveragePriceShapePriceRef.current =
                          sellPriceByCurrency * Number(supply);
                      } else {
                        buyAveragePriceShapePriceRef.current = buyPriceByCurrency;
                        sellAveragePriceShapePriceRef.current =
                          sellPriceByCurrency;
                      }
                    }

                    if (
                      localStorage.getItem("chart_hide_buy_avg_price_line") ===
                      "false"
                    ) {
                      // @ts-ignore
                      buyAveragePriceShapeIdRef.current = addAveragePriceLine(
                        "buy",
                        tvWidgetRef.current,
                        tradeStartTime,
                        buyAveragePriceShapePriceRef.current!,
                      );
                    }
                    if (
                      localStorage.getItem("chart_hide_sell_avg_price_line") ===
                      "false"
                    ) {
                      // @ts-ignore
                      sellAveragePriceShapeIdRef.current = addAveragePriceLine(
                        "sell",
                        tvWidgetRef.current,
                        tradeStartTime,
                        sellAveragePriceShapePriceRef.current!,
                      );
                    }
                  } else {
                    let newTrade = await queryClientNormal.fetchQuery({
                      queryKey: ["user-trades", mint],
                      queryFn: () => fetchSeparatedTradesData(mint, "user"),
                      staleTime: 0,
                      gcTime: 0,
                      retry: 10,
                    });

                    const normalizedUserTrades = normalizeTradesLetter({
                      trades: newTrade?.user_trades ?? [],
                      buyLetter: "B",
                      sellLetter: "S",
                    });

                    newTrade.user_trades = normalizedUserTrades;

                    const [walletTrackerResult, developerResult] =
                      await Promise.allSettled([
                        queryClientNormal.fetchQuery({
                          queryKey: ["wallet-tracker-trades", mint],
                          queryFn: () =>
                            fetchSeparatedTradesData(mint, "wallet-tracker"),
                          staleTime: 0,
                          gcTime: 0,
                          retry: 10,
                        }),
                        // .then(async (res) => {
                        //   await delay(10_000);
                        //   return res;
                        // }),

                        queryClientNormal.fetchQuery({
                          queryKey: ["developer-trades", mint],
                          queryFn: () =>
                            fetchSeparatedTradesData(mint, "developer"),
                          staleTime: 0,
                          gcTime: 0,
                          retry: 10,
                        }),
                        // .then(async (res) => {
                        //   await delay(10_000); // 2s delay after fetching
                        //   return res;
                        // }),
                      ]);

                    if (walletTrackerResult.status === "fulfilled") {
                      newTrade.other_trades =
                        walletTrackerResult.value.other_trades;
                    } else {
                      console.warn(
                        "wallet-tracker fetch failed",
                        walletTrackerResult.reason,
                      );
                    }

                    if (developerResult.status === "fulfilled") {
                      const normalizedDevTrades = normalizeTradesLetter({
                        trades: newTrade?.developer_trades ?? [],
                        buyLetter: "DB",
                        sellLetter: "DS",
                      });

                      newTrade.developer_trades = normalizedDevTrades;
                    } else {
                      console.warn(
                        "developer fetch failed",
                        developerResult.reason,
                      );
                    }

                    // console.warn("TRADES DEBUG ✨ - trade.current ❌");

                    // console.warn("TRADES DEBUG ✨ - 2", {
                    //   developer_trades: trade.developer_trades,
                    //   insider_trades: trade.insider_trades,
                    //   other_trades: trade.other_trades,
                    //   user_trades: trade.user_trades,
                    // });

                    // make sure user_trades really empty
                    // if (Array.isArray(trade.user_trades) && trade.user_trades.length === 0 || trade.user_trades === null) {
                    //   trade = await queryClientNormal.fetchQuery({
                    //     queryKey: ["trades", mint],
                    //     queryFn: () => fetchInitTradesData(mint),
                    //     staleTime: 0,
                    //     gcTime: 0,
                    //     retry: false,
                    //   });
                    // }

                    const {
                      developer_trades,
                      insider_trades,
                      other_trades,
                      // sniper_trades,
                      user_trades,
                    } = newTrade;

                    trade.current = newTrade;

                    // console.warn("TRADES DEBUG ✨ - trade.current ❌", {
                    //   trade,
                    // });

                    /* console.log("TRADINGVIEW PROGRESS: fetching trades", trade) */
                    const convertedTimestampUniqueUserTrades = getUniqueTrades(
                      user_trades,
                    )?.map((trade) => {
                      return {
                        ...trade,
                        timestamp:
                          String(trade.timestamp).length <= 10
                            ? trade.timestamp * 1000
                            : trade.timestamp,
                      };
                    });

                    const tradeKey = `${symbolInfo.ticker}-${resolution}`;
                    const existingTrades = tradeMap.current.get(tradeKey) ?? [];

                    const filteredTrades = [
                      ...(developer_trades ?? []),
                      ...(insider_trades ?? []),
                      ...(other_trades ?? []),
                      ...(convertedTimestampUniqueUserTrades ?? []),
                    ].filter((tx) => {
                      return (
                        tx.timestamp !== 0 &&
                        !isNaN(Number(tx.price))
                      );
                    });

                    if (existingTrades.length > 0) {
                      for (const newTrade of filteredTrades) {
                        if (!newTrade) continue;

                        const isDuplicate = existingTrades.some(
                          (existingTrade) => {
                            if (
                              existingTrade.letter === "DB" ||
                              existingTrade.letter === "DS"
                            ) {
                              return (
                                existingTrade.signature === newTrade.signature
                              );
                            } else {
                              return areTradesEqual(existingTrade, newTrade);
                            }
                          },
                        );

                        if (!isDuplicate) {
                          existingTrades.push(newTrade);
                        }
                      }
                    } else {
                      tradeMap.current.set(tradeKey, filteredTrades);
                    }

                    setUserTrades(user_trades);

                    if (tvWidgetRef.current) {
                      tvWidgetRef.current.activeChart()?.refreshMarks();
                    }

                    const tradeStartTime = getBarStartTime(
                      getCurrentServerTime(),
                      resolution,
                    );

                    if (user_trades.length === 0) return;

                    const lastUserTrade = user_trades[user_trades.length - 1];
                    removeAveragePriceLine(
                      "buy",
                      tvWidgetRef.current,
                      buyAveragePriceShapeIdRef.current,
                    );
                    removeAveragePriceLine(
                      "sell",
                      tvWidgetRef.current,
                      sellAveragePriceShapeIdRef.current,
                    );
                    const buyPriceByCurrency = parseFloat(
                      currency === "SOL"
                        ? lastUserTrade.average_price_base?.toString()
                        : lastUserTrade.average_price_usd?.toString(),
                    );
                    const sellPriceByCurrency =
                      currency === "SOL"
                        ? lastUserTrade.average_sell_price_base
                        : lastUserTrade.average_sell_price_usd

                    buyAveragePriceTradeStartTimeRef.current = tradeStartTime;
                    sellAveragePriceTradeStartTimeRef.current = tradeStartTime;
                    const supply =
                      convertDecimals(lastUserTrade?.supply_str || 0, quoteDecimalsRef.current!)
                    console.warn("SUPPLYYYYY 7🙏", supply, lastUserTrade?.supply_str || 0, buyPriceByCurrency, supply * buyPriceByCurrency, quoteDecimalsRef.current)
                    if (chartType === "MCap") {
                      buyAveragePriceShapePriceRef.current =
                        buyPriceByCurrency * Number(supply);
                      sellAveragePriceShapePriceRef.current =
                        sellPriceByCurrency * Number(supply);
                    } else {
                      buyAveragePriceShapePriceRef.current = buyPriceByCurrency;
                      sellAveragePriceShapePriceRef.current =
                        sellPriceByCurrency;
                    }

                    if (
                      localStorage.getItem("chart_hide_buy_avg_price_line") ===
                      "false"
                    ) {
                      // @ts-ignore
                      buyAveragePriceShapeIdRef.current = addAveragePriceLine(
                        "buy",
                        tvWidgetRef.current,
                        tradeStartTime,
                        buyAveragePriceShapePriceRef.current,
                      );
                    }
                    if (
                      localStorage.getItem("chart_hide_sell_avg_price_line") ===
                      "false"
                    ) {
                      // @ts-ignore
                      sellAveragePriceShapeIdRef.current = addAveragePriceLine(
                        "sell",
                        tvWidgetRef.current,
                        tradeStartTime,
                        sellAveragePriceShapePriceRef.current,
                      );
                    }
                  }
                } else {
                  // console.warn("TRADES DEBUG ✨ - firstDataRequest ❌", {
                  //   trades: trade.current,
                  //   firstDataRequest,
                  // });
                }
              } catch (error) {
                onErrorCallback(error as string);
              }
            },
            getMarks: (symbolInfo, _from, _to, onDataCallback, resolution) => {
              // console.log("TRADINGVIEW PROGRESS: getMarks")
              console.warn(
                "TV DEBUG ✨ | GET MARKS RUN 🔖",
                getCurrentServerTime(),
              );

              if (tvWidgetRef.current)
                tvWidgetRef.current.activeChart()?.clearMarks();

              const tradeKey = `${symbolInfo.ticker}-${resolution}`;
              const trades = tradeMap.current.get(tradeKey) || [];
              const processEmptySupplyAndLetterTrades = (trades || [])
                ?.map((trade) => {
                  const { letter, imageUrl } = trade;

                  const isMyTrade = letter.length === 1 && !imageUrl;
                  const isSniperTrade =
                    letter.length === 2 && letter[0] === "S";
                  const isDevTrade = letter.length === 2 && letter[0] === "D";
                  const isInsiderTrade =
                    letter.length === 2 && letter[0] === "I";
                  const isTrackedTrade = letter.length === 1 && imageUrl;
                  // const isDiscordGroupTrade = letter.length === 3 && imageUrl;

                  return {
                    ...trade,
                    name:
                      isMyTrade ||
                        isSniperTrade ||
                        isDevTrade ||
                        isInsiderTrade ||
                        isTrackedTrade
                        ? "NOT"
                        : trade.name,
                    supply: tokenSupplyRef.current!,
                  };
                })
                ?.filter(
                  (trade) => trade.letter !== "SB" && trade.letter !== "SS",
                );

              if (!trades) {
                onDataCallback([]);
                return;
              }

              const uniqueTrades = getUniqueTrades(
                filterTrades(
                  processEmptySupplyAndLetterTrades,
                  tradeFilters.current,
                ),
              );
              const adjustedTimestampTrades = adjustTimestamps(uniqueTrades);

              const marks: Mark[] = (uniqueTrades || [])?.map((trade) => {
                const handledEpochAndTimestampValue =
                  String(trade.timestamp).length > 10
                    ? Math.floor(trade.timestamp / 1000)
                    : trade.timestamp;

                const otherTradeAdditionalInfo = (
                  trackedWalletsList || []
                )?.find((tw) => tw.address === trade.wallet)?.name;

                const isMyTrade =
                  trade.letter.length === 1 &&
                  !trade.imageUrl &&
                  !otherTradeAdditionalInfo;
                const isSniperTrade =
                  trade.letter.length === 2 && trade.letter[0] === "S";
                const isDevTrade =
                  trade.letter.length === 2 && trade.letter[0] === "D";
                const isInsiderTrade =
                  trade.letter.length === 2 && trade.letter[0] === "I";
                const isTrackedTrade =
                  trade.letter.length === 1 && trade.imageUrl;
                const isDiscordGroupTrade =
                  trade.letter.length === 3 && trade.imageUrl

                if (isTrackedTrade) {
                  // console.warn("SPECIFIC MARKS DEBUG ⭐ | 1", {
                  //   trade,
                  //   state: {
                  //     isMyTrade,
                  //     isSniperTrade,
                  //     isDevTrade,
                  //     isInsiderTrade,
                  //     isTrackedTrade,
                  //     otherTradeAdditionalInfo,
                  //   },
                  // });

                  type MarkColorBGIdentifier =
                    | "/icons/token/actions/fish.svg"
                    | "/icons/token/actions/whale.svg"
                    | "/icons/token/actions/dolphin.svg";
                  const markColorMap = {
                    "/icons/token/actions/fish.svg": {
                      border: trade?.letter === "B" ? "#24b39b" : "#f23545",
                      background: "#FFF",
                    },
                    "/icons/token/actions/whale.svg": {
                      border: trade?.letter === "B" ? "#24b39b" : "#f23545",
                      background: "#FFF",
                    },
                    "/icons/token/actions/dolphin.svg": {
                      border: trade?.letter === "B" ? "#24b39b" : "#f23545",
                      background: "#FFF",
                    },
                  };

                  return {
                    id: `${trade.timestamp.toString()}-${trade?.signature}-${trade?.letter}-${trade?.wallet}`,
                    time: handledEpochAndTimestampValue,
                    color: markColorMap[
                      trade.imageUrl as MarkColorBGIdentifier
                    ] as MarkCustomColor,
                    text: generateMarkText(
                      trade.wallet,
                      trade.letter as TradeLetter,
                      trade.token_amount?.toString(),
                      trade.price?.toString(),
                      trade.price_usd?.toString(),
                      handledEpochAndTimestampValue,
                      Number(trade.supply),
                      undefined,
                      trade.colour,
                      trade.imageUrl,
                    ),
                    label: trade.letter ? trade.letter : "U",
                    imageUrl: trade.letter
                      ? getOpenMojiUrl(trade.letter || "")
                      : "",
                    labelFontColor:
                      trade?.letter === "B" ? "#24b39b" : "#f23545",
                    minSize: 25,
                  };
                } else if (
                  isMyTrade ||
                  isSniperTrade ||
                  isDevTrade ||
                  isInsiderTrade
                ) {
                  // console.warn("SPECIFIC MARKS DEBUG ⭐ | 2", {
                  //   trade,
                  //   state: {
                  //     isMyTrade,
                  //     isSniperTrade,
                  //     isDevTrade,
                  //     isInsiderTrade,
                  //     isTrackedTrade,
                  //     otherTradeAdditionalInfo,
                  //   },
                  // });

                  return {
                    id: `${trade.timestamp.toString()}-${trade?.signature}-${trade?.letter}-${trade?.wallet}`,
                    time: handledEpochAndTimestampValue,
                    color: trade.colour as MarkConstColors,
                    text: generateMarkText(
                      trade.wallet,
                      trade.letter as TradeLetter,
                      trade.token_amount?.toString(),
                      trade.price?.toString(),
                      trade.price_usd?.toString(),
                      handledEpochAndTimestampValue,
                      Number(trade.supply),
                      undefined,
                      trade.colour,
                      undefined,
                    ),
                    label: trade.letter ? trade.letter : "U",
                    imageUrl: trade.letter
                      ? getOpenMojiUrl(trade.letter || "")
                      : "",
                    labelFontColor: "#ffffff",
                    minSize: 25,
                  };
                } else if (isDiscordGroupTrade) {
                  // console.warn("SPECIFIC MARKS DEBUG ⭐ | 3", {
                  //   trade,
                  //   state: {
                  //     isMyTrade,
                  //     isSniperTrade,
                  //     isDevTrade,
                  //     isInsiderTrade,
                  //     isTrackedTrade,
                  //     otherTradeAdditionalInfo,
                  //   },
                  // });

                  return {
                    id: `${trade.timestamp.toString()}-${trade?.signature}-${trade?.letter}-${trade?.wallet}`,
                    time: handledEpochAndTimestampValue,
                    color: "yellow" as MarkConstColors,
                    text: `Mentioned in ${trade?.name} on ${formatEpochToUTCDate(trade?.timestamp)}`,
                    label: trade.letter ? trade.letter : "U",
                    imageUrl: trade.imageUrl,
                    labelFontColor: "#ffffff",
                    minSize: 25,
                  };
                } else {
                  // console.warn("SPECIFIC MARKS DEBUG ⭐ | 4", {
                  //   trade,
                  //   state: {
                  //     isMyTrade,
                  //     isSniperTrade,
                  //     isDevTrade,
                  //     isInsiderTrade,
                  //     isTrackedTrade,
                  //     otherTradeAdditionalInfo,
                  //   },
                  // });

                  return {
                    id: `${trade.timestamp.toString()}-${trade?.signature}-${trade?.letter}-${trade?.wallet}`,
                    time: handledEpochAndTimestampValue,
                    color: trade.colour as MarkConstColors,
                    text: generateMarkText(
                      trade.wallet,
                      trade.letter as TradeLetter,
                      trade.token_amount?.toString(),
                      trade.price?.toString(),
                      trade.price_usd?.toString(),
                      handledEpochAndTimestampValue,
                      Number(trade.supply),
                      otherTradeAdditionalInfo || trade?.name || "",
                      trade.colour,
                      undefined,
                    ),
                    label: trade.letter ? trade.letter : "U",
                    imageUrl: trade.letter
                      ? getOpenMojiUrl(trade.letter || "")
                      : "",
                    labelFontColor: "#ffffff",
                    minSize: 25,
                  };
                }
              });

              const uniqueMarks = getUniqueMarks(marks);

              console.warn("DC GROUPS 🐣🐣🐣 || MARKS DEBUG ✨", {
                trades,
                uniqueTrades,
                adjustedTimestampTrades,
                result: adjustedTimestampTrades?.filter(
                  (tx) => tx.adjusted === true,
                ),
                marks,
                uniqueMarks,
              });

              onDataCallback(uniqueMarks);

              setIsLoadingMarks(false);
              isQueueMessage.current = false;
            },
            subscribeBars: (
              symbolInfo,
              resolution,
              onRealtimeCallback,
              subscriberUID,
              onResetCacheNeededCallback,
            ) => {
              /* console.log("TRADINGVIEW PROGRESS: subscribeBars") */ // console.log(
              //   `👌 WS HOOK 📺 - chartToken | subscribeBars called for ${subscriberUID} (${resolution})`,
              // );
              subscribersMap.current.set(subscriberUID, {
                resolution,
                callback: onRealtimeCallback,
                mint: symbolInfo.ticker,
                lastMessageTimestamp: 0,
                symbolInfo,
                lastbarRef: lastBarRef.current,
                onResetCacheNeededCallback,
              });

              isQueueMessage.current = false;
            },
            unsubscribeBars: (subscriberUID) => {
              /* console.log("TRADINGVIEW PROGRESS: unsubscribeBars") */ // console.log(
              //   `👌 WS HOOK 📺 - chartToken | unsubscribeBars called for ${subscriberUID}`,
              // );
              const sub = subscribersMap.current.get(subscriberUID);
              if (sub) {
                subscribersMap.current.delete(subscriberUID);
                // console.log(
                //   `👌 WS HOOK 📺 - chartToken | Subscriber ${subscriberUID} removed.`,
                // );

                if (subscribersMap.current.size === 0) {
                  // console.log(
                  //   "👌 WS HOOK 📺 - chartToken | All subscribers removed, setting state to disconnected.",
                  // );
                }
              } else {
                console.warn(
                  `👌 WS HOOK 📺 - chartToken | Attempted to unsubscribe non-existent UID: ${subscriberUID}`,
                );
              }
            },
          },
        };

        const initChart = () => {
          loadCount.current = 0;
          dropdownApiRef.current = null;
          buyAveragePriceShapeIdRef.current = null;
          sellAveragePriceShapeIdRef.current = null;
          isInitialBarRef.current = true;
          noDataRef.current = null;

          if (reconnectTimeoutInitSocketRef.current) {
            clearTimeout(reconnectTimeoutInitSocketRef.current);
          }

          resetCurrentTokenDeveloperTradesState();

          if (!chartContainerRef.current) {
            console.error("Chart container ref is null");
            return;
          }

          const defaultFilters = JSON.stringify([
            "dev_trades",
            // "sniper_trades",
            "insider_trades",
            "tracked_trades",
            "other_trades",
            "my_trades",
          ]);

          const savedFilters =
            localStorage.getItem("chart_trade_filters") || defaultFilters;
          if (savedFilters) {
            const parsedFilters = JSON.parse(savedFilters) as TradeFilter[];
            tradeFilters.current.clear();
            parsedFilters?.forEach((filter) =>
              filter ? tradeFilters.current.add(filter) : null,
            );
          }

          if (!window.TradingView?.widget) {
            reinitChartTimeoutRef.current = setTimeout(() => {
              initChart();
            }, 100);
          }

          if (window?.TradingView?.widget) {
            // @ts-ignore
            tvWidgetRef.current = new window.TradingView.widget(
              initialWidgetOptions,
            );
          }

          if (tvWidgetRef.current) {
            tvWidgetRef.current!.onChartReady(() => {
              /* console.log("TRADINGVIEW PROGRESS: onChartReady") */
              isChartLoadedRef.current = true;

              tvWidgetRef.current!.subscribe("onMarkClick", (event) => {
                if (String(event).includes("-DC-")) return;

                console.warn(
                  "ON MARK CLICK 🎨 | DEBUG 'onMarkClick' EVENT 🖌️",
                  event,
                );
                const fullAddress = String(event).split("-").pop();

                setWalletModalAddress(fullAddress!);
              });

              tvWidgetRef.current!.subscribe("drawing", (event) => {
                console.warn("DRAWINGS 🎨 | DEBUG 'drawing' EVENT 🖌️", event);
              });

              tvWidgetRef.current!.subscribe("drawing_event", (id, type) => {
                // console.warn("DRAWINGS 🎨 | DEBUG 'drawing_event' EVENT 🖼️", {
                //   id,
                //   type,
                // });

                const drawings = tvWidgetRef?.current
                  ?.activeChart?.()
                  ?.getLineToolsState?.();

                const serializedDrawings = {
                  groups: Array.from(drawings?.groups?.entries?.() ?? []),
                  // @ts-ignore
                  groupsToValidate: drawings?.groupsToValidate,
                  // @ts-ignore
                  lineToolsToValidate: drawings?.lineToolsToValidate,
                  sources: Array.from(drawings?.sources?.entries?.() ?? []),
                };

                if (type === "create") {
                  localStorage.setItem(
                    "chart_drawings",
                    JSON.stringify(serializedDrawings),
                  );
                }
                if (type === "remove") {
                  tvWidgetRef.current?.activeChart?.()?.removeEntity(id as any);

                  const drawings = tvWidgetRef?.current
                    ?.activeChart?.()
                    ?.getLineToolsState?.();

                  const serializedDrawings = {
                    groups: Array.from(drawings?.groups?.entries?.() ?? []),
                    // @ts-ignore
                    groupsToValidate: drawings?.groupsToValidate,
                    // @ts-ignore
                    lineToolsToValidate: drawings?.lineToolsToValidate?.filter(
                      // @ts-ignore
                      (s) => s !== id,
                    ),
                    sources: Array.from(
                      drawings?.sources?.entries?.() ?? [],
                    )?.filter(([key]) => key !== id),
                  };

                  localStorage.setItem(
                    "chart_drawings",
                    JSON.stringify(serializedDrawings),
                  );
                }
              });

              tvWidgetRef.current!.setCSSCustomProperty(
                "--tv-spinner-color",
                "#ffffff",
              );
              tvWidgetRef.current!.setCSSCustomProperty(
                "--themed-color-ui-loading-indicator-bg",
                "#ffffff",
              );
              tvWidgetRef.current!.headerReady().then(() => {
                setIsTvChartReady(true);
                setTvWidgetReady(true);

                if (!intervalStudiesRef.current) {
                  intervalStudiesRef.current = setInterval(() => {
                    if (!tvWidgetRef.current) return;

                    const studies = tvWidgetRef?.current
                      ?.activeChart?.()
                      ?.getAllStudies?.();
                    if (!Array.isArray(studies) || isResetting.current) return;
                    localStorage.setItem(
                      "chart_studies",
                      JSON.stringify(studies),
                    );
                  }, 5000);
                }
                // if (!intervalDrawingsRef.current) {
                //   intervalDrawingsRef.current = setInterval(() => {
                //     if (!tvWidgetRef.current) return;

                //     const drawings = tvWidgetRef?.current
                //       ?.activeChart?.()
                //       ?.getLineToolsState?.();

                //     const rawDrawings = JSON.parse(
                //       localStorage.getItem("chart_drawings") || "{}",
                //     );

                //     const deserializedDrawings = {
                //       groups: new Map<string, LineToolState | null>(
                //         rawDrawings?.groups,
                //       ),
                //       groupsToValidate: rawDrawings.groupsToValidate,
                //       lineToolsToValidate: rawDrawings.lineToolsToValidate,
                //       sources: new Map<
                //         EntityId,
                //         LineToolsAndGroupsState | null
                //       >(rawDrawings?.sources),
                //     };

                //     console.warn("DRAWINGS 🎨 | DEBUG ✨", {
                //       drawings,
                //       deserializedDrawings,
                //     });
                //   }, 5000);
                // }
                if (tvWidgetRef.current) {
                  const studies = JSON.parse(
                    localStorage.getItem("chart_studies") as string,
                  );
                  /* console.log("TV DEBUG ✨ | APPLY INDICATOR", studies) */ if (
                    Array.isArray(studies)
                  ) {
                    studies?.forEach(async (study) => {
                      await tvWidgetRef.current
                        ?.activeChart?.()
                        ?.createStudy?.(study.name, false);
                      /* console.log("TV DEBUG ✨ | APPLY INDICATOR", detailStudy) */
                    });
                  }

                  const rawSavedDrawings = JSON.parse(
                    localStorage.getItem("chart_drawings") || "{}",
                  );
                  const deserializedSavedDrawings = {
                    groups: new Map<string, LineToolState | null>(
                      rawSavedDrawings?.groups,
                    ),
                    groupsToValidate: rawSavedDrawings.groupsToValidate,
                    lineToolsToValidate: rawSavedDrawings.lineToolsToValidate,
                    sources: new Map<EntityId, LineToolsAndGroupsState | null>(
                      rawSavedDrawings?.sources,
                    ),
                  } as LineToolsAndGroupsState;

                  if (deserializedSavedDrawings) {
                    tvWidgetRef
                      .current!.activeChart()
                      .applyLineToolsState(deserializedSavedDrawings)
                      .then(() => {
                        console.warn(
                          "DRAWINGS 🎨 | DEBUG 'LOAD' EVENT ✅",
                          rawSavedDrawings,
                          deserializedSavedDrawings,
                        );
                      });
                  } else {
                    console.warn(
                      "DRAWINGS 🎨 | DEBUG 'LOAD' EVENT ⭕",
                      rawSavedDrawings,
                      deserializedSavedDrawings,
                    );
                  }
                }
                tvWidgetRef.current
                  ?.activeChart()
                  .onIntervalChanged()
                  .subscribe(null, async (interval) => {
                    isQueueMessage.current = true;
                    trade.current = null;
                    candles.current = null;

                    // console.log(
                    //   "TRADINGVIEW PROGRESS: INTERVAL CHANGED",
                    //   lastBarRef.current,
                    // );
                    isInitialBarRef.current = true;
                    noDataRef.current = null;
                    localStorage.setItem("chart_interval_resolution", interval);
                    cookies.set("_chart_interval_resolution", interval);
                    setIsLoadingMarks(true);
                  });

                const currency: CurrencyChart =
                  (localStorage.getItem("chart_currency") as CurrencyChart) ||
                  "SOL";
                const switchCurrencyButton =
                  tvWidgetRef.current!.createButton();
                switchCurrencyButton.setAttribute("title", "Switch Currency");
                switchCurrencyButton.classList.add("apply-common-tooltip");
                switchCurrencyButton.addEventListener("click", () => {
                  if (!tvWidgetRef.current) return;

                  if (currency === "SOL") {
                    localStorage.setItem("chart_currency", "USD");
                    currencyRef.current = "USD";
                    cookies.set("_chart_currency", "USD");
                  } else {
                    localStorage.setItem("chart_currency", "SOL");
                    currencyRef.current = "SOL";
                    cookies.set("_chart_currency", "SOL");
                  }
                  trade.current = null;
                  candles.current = null;
                  setTvWidgetReady(false);
                  setIsTvChartReady(false);
                  setIsLoadingMarks(true);
                  resetChart();
                });
                switchCurrencyButton.style.cursor = "pointer";
                switchCurrencyButton.innerHTML =
                  currency === "USD" ? "Switch to SOL" : "Switch to USD";

                const chartType: ChartType =
                  (localStorage.getItem("chart_type") as ChartType) || "Price";
                const switchChartTypeButton =
                  tvWidgetRef.current!.createButton();
                switchChartTypeButton.setAttribute(
                  "title",
                  "Switch Chart Type",
                );
                switchChartTypeButton.classList.add("apply-common-tooltip");
                switchChartTypeButton.addEventListener("click", () => {
                  if (!tvWidgetRef.current?.activeChart()) return;

                  if (chartType === "Price") {
                    localStorage.setItem("chart_type", "MCap");
                    isInitialPriceMessageRef.current = true;
                  } else {
                    localStorage.setItem("chart_type", "Price");
                    isInitialPriceMessageRef.current = true;
                  }

                  trade.current = null;
                  candles.current = null;
                  setTvWidgetReady(false);
                  setIsTvChartReady(false);
                  setIsLoadingMarks(true);
                  resetChart();
                });
                switchChartTypeButton.style.cursor = "pointer";
                switchChartTypeButton.innerHTML =
                  chartType === "Price"
                    ? "<span style='color: #e799ff; font-weight: 700;'>Price</span>/MC"
                    : "Price/<span style='color: #e799ff; font-weight: 700;'>MC</span>";

                if (!dropdownApiRef.current) {
                  updateTradeFilters(
                    tvWidgetRef.current,
                    tradeFilters.current,
                    dropdownApiRef.current,
                  ).then((newDropdownApi) => {
                    dropdownApiRef.current = newDropdownApi;
                  });
                }

                const hideBuyAveragePriceLineButton =
                  tvWidgetRef.current!.createButton();
                hideBuyAveragePriceLineButton.setAttribute(
                  "title",
                  "Hide Buy Average Price Line",
                );
                hideBuyAveragePriceLineButton.classList.add(
                  "apply-common-tooltip",
                );
                hideBuyAveragePriceLineButton.style.cursor = "pointer";

                const currentShowBuyAvgPriceLineState =
                  (localStorage.getItem("chart_hide_buy_avg_price_line") as
                    | "true"
                    | "false") || "false";
                hideBuyAveragePriceLineButton.innerHTML =
                  currentShowBuyAvgPriceLineState === "true"
                    ? "Show Buy Avg Price Line"
                    : "Hide Buy Avg Price Line";

                hideBuyAveragePriceLineButton.addEventListener("click", () => {
                  if (!tvWidgetRef.current?.activeChart()) return;

                  const hideAveragePriceLine =
                    (localStorage.getItem("chart_hide_buy_avg_price_line") as
                      | "true"
                      | "false") || "false";

                  const newState =
                    hideAveragePriceLine === "true" ? "false" : "true";
                  localStorage.setItem(
                    "chart_hide_buy_avg_price_line",
                    newState,
                  );

                  if (newState === "false") {
                    removeAveragePriceLine(
                      "buy",
                      tvWidgetRef.current,
                      buyAveragePriceShapeIdRef.current,
                    );

                    // @ts-ignore
                    buyAveragePriceShapeIdRef.current = addAveragePriceLine(
                      "buy",
                      tvWidgetRef.current,
                      buyAveragePriceTradeStartTimeRef.current!,
                      buyAveragePriceShapePriceRef.current!,
                    );
                  } else if (buyAveragePriceShapeIdRef.current) {
                    removeAveragePriceLine(
                      "buy",
                      tvWidgetRef.current,
                      buyAveragePriceShapeIdRef.current,
                    );
                    buyAveragePriceShapeIdRef.current = null;
                  }

                  hideBuyAveragePriceLineButton.innerHTML =
                    newState === "true"
                      ? "Show Buy Avg Price Line"
                      : "Hide Buy Avg Price Line";
                });

                const hideSellAveragePriceLineButton =
                  tvWidgetRef.current!.createButton();
                hideSellAveragePriceLineButton.setAttribute(
                  "title",
                  "Hide Sell Average Price Line",
                );
                hideSellAveragePriceLineButton.classList.add(
                  "apply-common-tooltip",
                );
                hideSellAveragePriceLineButton.style.cursor = "pointer";

                const currentShowSellAvgPriceLineState =
                  (localStorage.getItem("chart_hide_sell_avg_price_line") as
                    | "true"
                    | "false") || "false";
                hideSellAveragePriceLineButton.innerHTML =
                  currentShowSellAvgPriceLineState === "true"
                    ? "Show Sell Avg Price Line"
                    : "Hide Sell Avg Price Line";

                hideSellAveragePriceLineButton.addEventListener("click", () => {
                  if (!tvWidgetRef.current?.activeChart()) return;

                  const hideAveragePriceLine =
                    (localStorage.getItem("chart_hide_sell_avg_price_line") as
                      | "true"
                      | "false") || "false";

                  const newState =
                    hideAveragePriceLine === "true" ? "false" : "true";
                  localStorage.setItem(
                    "chart_hide_sell_avg_price_line",
                    newState,
                  );

                  if (newState === "false") {
                    removeAveragePriceLine(
                      "sell",
                      tvWidgetRef.current,
                      sellAveragePriceShapeIdRef.current,
                    );

                    // @ts-ignore
                    sellAveragePriceShapeIdRef.current = addAveragePriceLine(
                      "sell",
                      tvWidgetRef.current,
                      sellAveragePriceTradeStartTimeRef.current!,
                      sellAveragePriceShapePriceRef.current!,
                    );
                  } else if (sellAveragePriceShapeIdRef.current) {
                    removeAveragePriceLine(
                      "sell",
                      tvWidgetRef.current,
                      sellAveragePriceShapeIdRef.current,
                    );
                    sellAveragePriceShapeIdRef.current = null;
                  }

                  hideSellAveragePriceLineButton.innerHTML =
                    newState === "true"
                      ? "Show Sell Avg Price Line"
                      : "Hide Sell Avg Price Line";
                });

                const resetThemeButton = tvWidgetRef.current!.createButton();
                resetThemeButton.setAttribute("title", "Reset to Nova Theme");
                resetThemeButton.classList.add("apply-common-tooltip");
                resetThemeButton.addEventListener("click", () => {
                  if (!tvWidgetRef.current?.activeChart()) return;

                  localStorage.setItem(
                    "tradingview.chartproperties",
                    JSON.stringify(defaultTVChartProperties),
                  );

                  localStorage.setItem(
                    "tradingview.chartproperties.mainSeriesProperties",
                    JSON.stringify(
                      defaultTVChartPropertiesMainSeriesProperties,
                    ),
                  );

                  setTvWidgetReady(false);
                  setIsTvChartReady(false);
                  setIsLoadingMarks(true);
                  resetChart();
                });
                resetThemeButton.style.cursor = "pointer";
                resetThemeButton.innerHTML = "Reset Theme";

                const arrowRightButton = tvWidgetRef.current!.createButton();
                arrowRightButton.setAttribute("title", "Scroll to Latest Bar");
                arrowRightButton.classList.add("apply-common-tooltip");
                arrowRightButton.addEventListener("click", () => {
                  if (!tvWidgetRef.current?.activeChart()) return;
                  tvWidgetRef.current
                    .activeChart()
                    .executeActionById("timeScaleReset");
                });
                arrowRightButton.style.cursor = "pointer";
                arrowRightButton.innerHTML = `
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 12L10 8L6 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                `;
              });
            });
          }
        };

        const resetChart = (
          newOptions: Partial<ChartingLibraryWidgetOptions> = {},
        ) => {
          isResetting.current = true;
          if (tvWidgetRef.current) {
            const studies = JSON.parse(
              localStorage.getItem("chart_studies") as string,
            );
            /* console.log("TV DEBUG ✨ | APPLY INDICATOR", studies) */ if (
              Array.isArray(studies)
            ) {
              studies?.forEach(async (study) => {
                await tvWidgetRef.current
                  ?.activeChart?.()
                  ?.createStudy?.(study.name, false);
                /* console.log("TV DEBUG ✨ | APPLY INDICATOR", detailStudy) */
              });
            }
          }

          if (tvWidgetRef.current) {
            tvWidgetRef.current.remove();
            loadCount.current = 0;
            dropdownApiRef.current = null;
            buyAveragePriceShapeIdRef.current = null;
            sellAveragePriceShapeIdRef.current = null;
            isInitialBarRef.current = true;
            noDataRef.current = null;
            resetCurrentTokenDeveloperTradesState();
          }

          if (!chartContainerRef.current) {
            console.error("Chart container ref is null");
            return;
          }

          const savedFilters = localStorage.getItem("chart_trade_filters");
          if (savedFilters) {
            const parsedFilters = JSON.parse(savedFilters) as TradeFilter[];
            tradeFilters.current.clear();
            parsedFilters?.forEach((filter) =>
              filter ? tradeFilters.current.add(filter) : null,
            );
          }

          const currentInterval = getIntervalResolution();
          const updatedOptions: ChartingLibraryWidgetOptions = {
            ...initialWidgetOptions,
            interval: currentInterval,
            ...newOptions,
          };

          if (!window.TradingView?.widget) {
            reinitChartTimeoutRef.current = setTimeout(() => {
              initChart();
            }, 100);
          }
          // @ts-ignore
          tvWidgetRef.current = new window.TradingView.widget(updatedOptions);
          tvWidgetRef.current!.onChartReady(() => {
            isResetting.current = false;

            tvWidgetRef.current!.subscribe("onMarkClick", (event) => {
              if (String(event).includes("-DC-")) return;

              console.warn("MARK 🎨 | DEBUG 'onMarkClick' EVENT 🖌️", event);

              const fullAddress = String(event).split("-").pop();

              setWalletModalAddress(fullAddress!);
            });

            tvWidgetRef.current!.subscribe("drawing", (event) => {
              console.warn("DRAWINGS 🎨 | DEBUG 'drawing' EVENT 🖌️", event);
            });

            tvWidgetRef.current!.subscribe("drawing_event", (id, type) => {
              console.warn("DRAWINGS 🎨 | DEBUG 'drawing_event' EVENT 🖼️", {
                id,
                type,
              });

              const drawings = tvWidgetRef?.current
                ?.activeChart?.()
                ?.getLineToolsState?.();

              const serializedDrawings = {
                groups: Array.from(drawings?.groups?.entries?.() || []),
                // @ts-ignore
                groupsToValidate: drawings?.groupsToValidate,
                // @ts-ignore
                lineToolsToValidate: drawings?.lineToolsToValidate,
                sources: Array.from(drawings?.sources?.entries?.() || []),
              };

              const allShapes = tvWidgetRef?.current
                ?.activeChart?.()
                ?.getAllShapes?.();

              if (type === "create") {
                console.warn("DRAWINGS 🎨 | DEBUG 'save' EVENT 💾", {
                  type,
                  drawings,
                  serializedDrawings,
                });

                localStorage.setItem(
                  "chart_drawings",
                  JSON.stringify(serializedDrawings),
                );
              }
              if (type === "remove") {
                console.warn("DRAWINGS 🎨 | DEBUG 'save' EVENT 💾", {
                  type,
                  drawings,
                  serializedDrawings,
                });
                const lineShouldBeRemoved = allShapes?.filter((shape) => {
                  Array.from(
                    serializedDrawings?.lineToolsToValidate ?? [],
                  )?.includes(shape?.id);
                });

                if (lineShouldBeRemoved?.length) {
                  lineShouldBeRemoved.forEach((shape) => {
                    tvWidgetRef.current
                      ?.activeChart?.()
                      ?.removeEntity(shape?.id);
                  });

                  const drawings = tvWidgetRef?.current
                    ?.activeChart?.()
                    ?.getLineToolsState?.();

                  const serializedDrawings = {
                    groups: Array.from(drawings?.groups?.entries?.() ?? []),
                    // @ts-ignore
                    groupsToValidate: drawings?.groupsToValidate,
                    // @ts-ignore
                    lineToolsToValidate: drawings?.lineToolsToValidate,
                    sources: Array.from(drawings?.sources?.entries?.() ?? []),
                  };

                  localStorage.setItem(
                    "chart_drawings",
                    JSON.stringify(serializedDrawings),
                  );
                }
              }
            });

            tvWidgetRef.current!.setCSSCustomProperty(
              "--tv-spinner-color",
              "#ffffff",
            );
            tvWidgetRef.current!.setCSSCustomProperty(
              "--themed-color-ui-loading-indicator-bg",
              "#ffffff",
            );
            tvWidgetRef.current!.headerReady().then(() => {
              setIsTvChartReady(true);
              setTvWidgetReady(true);

              if (tvWidgetRef.current) {
                const studies = JSON.parse(
                  localStorage.getItem("chart_studies") as string,
                );
                /* console.log("TV DEBUG ✨ | APPLY INDICATOR", studies) */ if (
                  Array.isArray(studies)
                ) {
                  studies?.forEach(async (study) => {
                    await tvWidgetRef.current
                      ?.activeChart?.()
                      ?.createStudy?.(study.name, false);
                    /* console.log("TV DEBUG ✨ | APPLY INDICATOR", detailStudy) */
                  });
                }

                const rawSavedDrawings = JSON.parse(
                  localStorage.getItem("chart_drawings") || "{}",
                );
                const deserializedSavedDrawings = {
                  groups: new Map<string, LineToolState | null>(
                    rawSavedDrawings?.groups,
                  ),
                  groupsToValidate: rawSavedDrawings.groupsToValidate,
                  lineToolsToValidate: rawSavedDrawings.lineToolsToValidate,
                  sources: new Map<EntityId, LineToolsAndGroupsState | null>(
                    rawSavedDrawings?.sources,
                  ),
                } as LineToolsAndGroupsState;

                if (deserializedSavedDrawings) {
                  tvWidgetRef
                    .current!.activeChart()
                    .applyLineToolsState(deserializedSavedDrawings)
                    .then(() => {
                      console.warn(
                        "DRAWINGS 🎨 | DEBUG 'LOAD' EVENT ✅",
                        rawSavedDrawings,
                        deserializedSavedDrawings,
                      );
                    });
                } else {
                  console.warn(
                    "DRAWINGS 🎨 | DEBUG 'LOAD' EVENT ⭕",
                    rawSavedDrawings,
                    deserializedSavedDrawings,
                  );
                }
              }

              tvWidgetRef.current
                ?.activeChart()
                .onIntervalChanged()
                .subscribe(null, async (interval) => {
                  trade.current = null;
                  candles.current = null;
                  isQueueMessage.current = true;
                  isInitialBarRef.current = true;
                  noDataRef.current = null;
                  localStorage.setItem("chart_interval_resolution", interval);
                  cookies.set("_chart_interval_resolution", interval);
                  setIsLoadingMarks(true);
                });

              const currency: CurrencyChart =
                (localStorage.getItem("chart_currency") as CurrencyChart) ||
                "SOL";
              const switchCurrencyButton = tvWidgetRef.current!.createButton();
              switchCurrencyButton.setAttribute("title", "Switch Currency");
              switchCurrencyButton.classList.add("apply-common-tooltip");
              switchCurrencyButton.addEventListener("click", () => {
                if (!tvWidgetRef.current) return;

                const newCurrency = currency === "SOL" ? "USD" : "SOL";

                // Persist the new currency
                localStorage.setItem("chart_currency", newCurrency);
                currencyRef.current = newCurrency;
                cookies.set("_chart_currency", newCurrency);

                trade.current = null;
                candles.current = null;
                setTvWidgetReady(false);
                setIsTvChartReady(false);
                setIsLoadingMarks(true);
                resetChart();
              });
              switchCurrencyButton.style.cursor = "pointer";
              switchCurrencyButton.innerHTML =
                currency === "USD" ? "Switch to SOL" : "Switch to USD";

              const chartType: ChartType =
                (localStorage.getItem("chart_type") as ChartType) || "Price";
              const switchChartTypeButton = tvWidgetRef.current!.createButton();
              switchChartTypeButton.setAttribute("title", "Switch Chart Type");
              switchChartTypeButton.classList.add("apply-common-tooltip");
              switchChartTypeButton.addEventListener("click", () => {
                if (!tvWidgetRef.current) return;

                if (chartType === "Price") {
                  localStorage.setItem("chart_type", "MCap");
                  isInitialPriceMessageRef.current = true;
                } else {
                  localStorage.setItem("chart_type", "Price");
                  isInitialPriceMessageRef.current = true;
                }

                trade.current = null;
                candles.current = null;
                setTvWidgetReady(false);
                setIsTvChartReady(false);
                setIsLoadingMarks(true);
                resetChart();
              });
              switchChartTypeButton.style.cursor = "pointer";
              switchChartTypeButton.innerHTML =
                chartType === "Price"
                  ? "<span style='color: #e799ff; font-weight: 700;'>Price</span>/MC"
                  : "Price/<span style='color: #e799ff; font-weight: 700;'>MC</span>";

              if (!dropdownApiRef.current) {
                updateTradeFilters(
                  tvWidgetRef.current,
                  tradeFilters.current,
                  dropdownApiRef.current,
                ).then((newDropdownApi) => {
                  dropdownApiRef.current = newDropdownApi;
                });
              }

              const hideBuyAveragePriceLineButton =
                tvWidgetRef.current!.createButton();
              hideBuyAveragePriceLineButton.setAttribute(
                "title",
                "Hide Buy Average Price Line",
              );
              hideBuyAveragePriceLineButton.classList.add(
                "apply-common-tooltip",
              );
              hideBuyAveragePriceLineButton.style.cursor = "pointer";

              const currentShowBuyAvgPriceLineState =
                (localStorage.getItem("chart_hide_buy_avg_price_line") as
                  | "true"
                  | "false") || "false";
              hideBuyAveragePriceLineButton.innerHTML =
                currentShowBuyAvgPriceLineState === "true"
                  ? "Show Buy Avg Price Line"
                  : "Hide Buy Avg Price Line";

              hideBuyAveragePriceLineButton.addEventListener("click", () => {
                const hideAveragePriceLine =
                  (localStorage.getItem("chart_hide_buy_avg_price_line") as
                    | "true"
                    | "false") || "false";

                const newState =
                  hideAveragePriceLine === "true" ? "false" : "true";
                localStorage.setItem("chart_hide_buy_avg_price_line", newState);

                if (newState === "false") {
                  removeAveragePriceLine(
                    "buy",
                    tvWidgetRef.current,
                    buyAveragePriceShapeIdRef.current,
                  );
                  // @ts-ignore
                  buyAveragePriceShapeIdRef.current = addAveragePriceLine(
                    "buy",
                    tvWidgetRef.current,
                    buyAveragePriceTradeStartTimeRef.current!,
                    buyAveragePriceShapePriceRef.current!,
                  );
                } else if (buyAveragePriceShapeIdRef.current) {
                  removeAveragePriceLine(
                    "buy",
                    tvWidgetRef.current,
                    buyAveragePriceShapeIdRef.current,
                  );
                  buyAveragePriceShapeIdRef.current = null;
                }

                hideBuyAveragePriceLineButton.innerHTML =
                  newState === "true"
                    ? "Show Buy Avg Price Line"
                    : "Hide Buy Avg Price Line";
              });

              const hideSellAveragePriceLineButton =
                tvWidgetRef.current!.createButton();
              hideSellAveragePriceLineButton.setAttribute(
                "title",
                "Hide Sell Average Price Line",
              );
              hideSellAveragePriceLineButton.classList.add(
                "apply-common-tooltip",
              );
              hideSellAveragePriceLineButton.style.cursor = "pointer";

              const currentShowSellAvgPriceLineState =
                (localStorage.getItem("chart_hide_sell_avg_price_line") as
                  | "true"
                  | "false") || "false";
              hideSellAveragePriceLineButton.innerHTML =
                currentShowSellAvgPriceLineState === "true"
                  ? "Show Sell Avg Price Line"
                  : "Hide Sell Avg Price Line";

              hideSellAveragePriceLineButton.addEventListener("click", () => {
                const hideAveragePriceLine =
                  (localStorage.getItem("chart_hide_sell_avg_price_line") as
                    | "true"
                    | "false") || "false";

                const newState =
                  hideAveragePriceLine === "true" ? "false" : "true";
                localStorage.setItem(
                  "chart_hide_sell_avg_price_line",
                  newState,
                );

                if (newState === "false") {
                  removeAveragePriceLine(
                    "sell",
                    tvWidgetRef.current,
                    sellAveragePriceShapeIdRef.current,
                  );

                  // @ts-ignore
                  sellAveragePriceShapeIdRef.current = addAveragePriceLine(
                    "sell",
                    tvWidgetRef.current,
                    sellAveragePriceTradeStartTimeRef.current!,
                    sellAveragePriceShapePriceRef.current!,
                  );
                } else if (sellAveragePriceShapeIdRef.current) {
                  removeAveragePriceLine(
                    "sell",
                    tvWidgetRef.current,
                    sellAveragePriceShapeIdRef.current,
                  );
                  sellAveragePriceShapeIdRef.current = null;
                }

                hideSellAveragePriceLineButton.innerHTML =
                  newState === "true"
                    ? "Show Sell Avg Price Line"
                    : "Hide Sell Avg Price Line";
              });

              const resetThemeButton = tvWidgetRef.current!.createButton();
              resetThemeButton.setAttribute("title", "Reset to Nova Theme");
              resetThemeButton.classList.add("apply-common-tooltip");
              resetThemeButton.addEventListener("click", () => {
                localStorage.setItem(
                  "tradingview.chartproperties",
                  JSON.stringify(defaultTVChartProperties),
                );

                localStorage.setItem(
                  "tradingview.chartproperties.mainSeriesProperties",
                  JSON.stringify(defaultTVChartPropertiesMainSeriesProperties),
                );

                setTvWidgetReady(false);
                setIsTvChartReady(false);
                setIsLoadingMarks(true);
                resetChart();
              });
              resetThemeButton.style.cursor = "pointer";
              resetThemeButton.innerHTML = "Reset Theme";

              const arrowRightButton = tvWidgetRef.current!.createButton();
              arrowRightButton.setAttribute("title", "Scroll to Latest Bar");
              arrowRightButton.classList.add("apply-common-tooltip");
              arrowRightButton.addEventListener("click", () => {
                if (!tvWidgetRef.current?.activeChart()) return;
                tvWidgetRef.current
                  .activeChart()
                  .executeActionById("timeScaleReset");
              });
              arrowRightButton.style.cursor = "pointer";
              arrowRightButton.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 12L10 8L6 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              `;
            });
          });
        };

        initChart();

        handleStorageChange = (e: StorageEvent) => {
          if (e.key === "chart_currency") {
            resetChart();
          }
          if (e.key === "chart_type") {
            resetChart();
          }
        };

        window.addEventListener("storage", handleStorageChange);
      } catch (error) {
        console.error("Failed to load charting library", error);
        window.removeEventListener("storage", handleStorageChange);
      }
    };
    loadChart();

    return () => {
      cleanUp();
      const invalidateAll = async () => {
        const resolution = (
          localStorage.getItem("chart_interval_resolution") ||
          tvWidgetRef.current?.activeChart().resolution() ||
          cookies.get("_chart_interval_resolution") ||
          "1S"
        ).toUpperCase();

        const currency: CurrencyChart =
          (localStorage.getItem("chart_currency") as CurrencyChart) || "SOL";

        // @ts-ignore
        const interval = PRICE_MAP[resolution];

        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: ["metadata", mint],
          }),
          queryClient.invalidateQueries({
            queryKey: [
              "candles",
              mint,
              currency.toLowerCase(),
              interval?.toLowerCase(),
            ],
          }),
          queryClientNormal.invalidateQueries({
            queryKey: ["user-trades", mint],
          }),
          queryClientNormal.invalidateQueries({
            queryKey: ["wallet-tracker-trades", mint],
          }),
          queryClientNormal.invalidateQueries({
            queryKey: ["developer-trades", mint],
          }),
        ]);
      };

      void invalidateAll();
    };
  }, [mint]);

  const offlineSince = useRef<number | null>(null);

  const detectOnline = useCallback(() => {
    const now = Date.now();

    if (!offlineSince.current || now - offlineSince.current < 10_000) {
      offlineSince.current = null;
      sendTokenMessage({
        channel: mint,
        action: "join",
        from: offlineSince.current,
      });
      return;
    }

    // Reset offline timer
    offlineSince.current = null;

    isConnectionHealthyRef.current = true;
    candles.current = null;
    isInitialBarRef.current = false;
    noDataRef.current = false;
    setTvWidgetReady(false);
    setIsTvChartReady(false);
    setIsLoadingMarks(true);

    const invalidateAll = async () => {
      const resolution = (
        localStorage.getItem("chart_interval_resolution") ||
        tvWidgetRef.current?.activeChart().resolution() ||
        cookies.get("_chart_interval_resolution") ||
        "1S"
      ).toUpperCase();

      const currency: CurrencyChart =
        (localStorage.getItem("chart_currency") as CurrencyChart) || "SOL";

      // @ts-ignore
      const interval = PRICE_MAP[resolution];

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["metadata", mint],
        }),
        queryClient.invalidateQueries({
          queryKey: [
            "candles",
            mint,
            currency.toLowerCase(),
            interval?.toLowerCase(),
          ],
        }),
        queryClientNormal.invalidateQueries({
          queryKey: ["user-trades", mint],
        }),
        queryClientNormal.invalidateQueries({
          queryKey: ["wallet-tracker-trades", mint],
        }),
        queryClientNormal.invalidateQueries({
          queryKey: ["developer-trades", mint],
        }),
      ]);
    };

    subscribersMap.current.forEach((sub) => {
      invalidateAll().finally(() => {
        sub.onResetCacheNeededCallback();
        tvWidgetRef.current?.activeChart().resetData();
      });
      sendTokenMessage({
        channel: mint,
        action: "join",
      });
    });
  }, [mint, tvWidgetRef.current]);

  const detectOffline = useCallback(() => {
    isConnectionHealthyRef.current = false;
    offlineSince.current = Date.now();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    window.addEventListener("online", detectOnline);
    window.addEventListener("offline", detectOffline);

    return () => {
      window.removeEventListener("online", detectOnline);
      window.removeEventListener("offline", detectOffline);
    };
  }, [detectOnline, detectOffline]);

  // ### A. From Filter Trade => Mark
  const trackedWalletsList = useWalletTrackerMessageStore(
    (state) => state.trackedWallets,
  );
  const addTradeMarksBasedOnFilteredWallet = useCallback(
    (trades: Trade[]) => {
      if (!tvWidgetReady || !tvWidgetRef.current) return;

      const currentResolution = (
        localStorage.getItem("chart_interval_resolution") ||
        tvWidgetRef.current?.activeChart().resolution() ||
        cookies.get("_chart_interval_resolution") ||
        "1S"
      ).toUpperCase();
      const key = `${mint}-${currentResolution}`;
      const existingTrades = tradeMap.current.get(key);
      let shouldRefresh = false;

      if (existingTrades) {
        for (const newTrade of trades) {
          if (!newTrade) continue;
          const isDuplicate = (existingTrades || [])?.some((existingTrade) =>
            areTradesEqual(existingTrade, newTrade),
          );
          if (!isDuplicate) {
            existingTrades.push(newTrade);
            shouldRefresh = true;
          }
        }
      } else {
        tradeMap.current.set(key, trades);
        shouldRefresh = true;
      }

      tradeFilters.current.delete("my_trades");
      saveTradeFiltersToLocalStorage(tradeFilters.current);
      updateTradeFilters(
        tvWidgetRef.current,
        tradeFilters.current,
        dropdownApiRef.current,
      );

      if (shouldRefresh) {
        tvWidgetRef.current?.activeChart().refreshMarks();
      }
    },
    [tvWidgetReady, mint],
  );

  const removeTradeMarksBasedOnFilteredWallet = useCallback(() => {
    if (!tvWidgetReady || !tvWidgetRef.current) return;

    const currentResolution = (
      localStorage.getItem("chart_interval_resolution") ||
      tvWidgetRef.current?.activeChart().resolution() ||
      cookies.get("_chart_interval_resolution") ||
      "1S"
    ).toUpperCase();
    const tradeKey = `${mint}-${currentResolution}`;
    const trades = tradeMap.current.get(tradeKey);

    if (trades) {
      const filteredTrades = trades?.filter(
        (trade) => trade.imageUrl === undefined,
      );

      tradeMap.current.set(tradeKey, filteredTrades);

      tradeFilters.current.add("my_trades");
      saveTradeFiltersToLocalStorage(tradeFilters.current);
      updateTradeFilters(
        tvWidgetRef.current,
        tradeFilters.current,
        dropdownApiRef.current,
      );

      tvWidgetRef.current?.activeChart().refreshMarks();
    }
  }, [tvWidgetReady, mint]);

  const wallet = useFilteredWalletTradesStore((state) => state.wallet);
  const trades = useFilteredWalletTradesStore((state) => state.trades);
  const prevWalletRef = useRef(wallet);
  useEffect(() => {
    if (
      isTVChartReady &&
      tvWidgetRef.current &&
      tvWidgetReady &&
      !isLoadingMarks
    ) {
      if (wallet !== "" && trades.length > 0) {
        addTradeMarksBasedOnFilteredWallet(trades);
      } else {
        if (prevWalletRef.current !== "" && wallet === "") {
          removeTradeMarksBasedOnFilteredWallet();
        } else if (loadCount.current === 0) {
          loadCount.current++;
        }
      }
    }

    prevWalletRef.current = wallet;
  }, [
    wallet,
    trades,
    isLoadingMarks,
    tvWidgetRef.current,
    isTVChartReady,
    tvWidgetReady,
  ]);

  // ### B. From Wallet Tracker Trade => Mark
  const addTradeMarksBasedOnWalletTracker = useCallback(
    (trades: Trade[]) => {
      if (!tvWidgetReady || !tvWidgetRef.current) {
        return;
      }

      const currentResolution = (
        localStorage.getItem("chart_interval_resolution") ||
        tvWidgetRef.current?.activeChart().resolution() ||
        cookies.get("_chart_interval_resolution") ||
        "1S"
      ).toUpperCase();
      const key = `${mint}-${currentResolution}`;
      const existingTrades = tradeMap.current.get(key);

      const filteredTrades = trades?.filter((trade) => trade.mint === mint);
      let shouldRefresh = false;

      if (existingTrades) {
        for (const newTrade of filteredTrades) {
          if (!newTrade) continue;
          const isDuplicate = (existingTrades || [])?.some((existingTrade) =>
            areTradesEqual(existingTrade, newTrade),
          );
          if (!isDuplicate) {
            existingTrades.push(newTrade);
            shouldRefresh = true;
          }
        }
      } else {
        tradeMap.current.set(key, filteredTrades);
        shouldRefresh = true;
      }

      updateTradeFilters(
        tvWidgetRef.current,
        tradeFilters.current,
        dropdownApiRef.current,
      );

      if (shouldRefresh) {
        tvWidgetRef.current?.activeChart().refreshMarks();
      }
    },
    [tvWidgetReady, mint],
  );

  const walletTrackerTrades = useMatchWalletTrackerTradesStore(
    (state) => state.trades,
  );

  useEffect(() => {
    if (
      walletTrackerTrades.length > 0 &&
      isTVChartReady &&
      tvWidgetRef.current &&
      tvWidgetReady &&
      !isLoadingMarks
    ) {
      addTradeMarksBasedOnWalletTracker([
        ...walletTrackerTrades,
        ...(trade.current?.other_trades ?? []),
      ]);
    }
  }, [
    walletTrackerTrades,
    isLoadingMarks,
    tvWidgetRef.current,
    isTVChartReady,
    tvWidgetReady,
    trade.current?.other_trades,
  ]);

  // ### C. From Developer Trade => Mark
  const addDeveloperTradeMarks = useCallback(
    (trades: Trade[]) => {
      if (!tvWidgetReady || !tvWidgetRef.current) {
        return;
      }

      const currentResolution = (
        localStorage.getItem("chart_interval_resolution") ||
        tvWidgetRef.current?.activeChart().resolution() ||
        cookies.get("_chart_interval_resolution") ||
        "1S"
      ).toUpperCase();
      const key = `${mint}-${currentResolution}`;
      const existingTrades = tradeMap.current.get(key);

      let shouldRefresh = false;

      if (existingTrades) {
        for (const trade of trades) {
          if (!trade) continue;
          const exists = (existingTrades || [])?.some(
            (t) => t.signature === trade.signature,
          );
          if (!exists) {
            existingTrades.push(trade);
            shouldRefresh = true;
          }
        }
      } else {
        tradeMap.current.set(key, trades);
        shouldRefresh = true;
      }

      if (shouldRefresh) {
        tvWidgetRef.current?.activeChart().refreshMarks();
      }
    },
    [tvWidgetReady, mint],
  );

  useEffect(() => {
    if (
      developerAddress &&
      developerTrades.length > 0 &&
      isTVChartReady &&
      tvWidgetRef.current &&
      tvWidgetReady &&
      !isLoadingMarks
    ) {
      const filteredDeveloperTrades = developerTrades?.filter(
        (trade) => trade.wallet === developerAddress,
      );

      addDeveloperTradeMarks([
        ...filteredDeveloperTrades,
        ...(trade.current?.developer_trades ?? []),
      ]);
    }
  }, [
    developerAddress,
    developerTrades,
    isLoadingMarks,
    tvWidgetRef.current,
    isTVChartReady,
    tvWidgetReady,
    trade.current?.developer_trades,
  ]);

  // ### D. From User Trades => Mark
  // and add average price line
  const addUserTradeMarks = useCallback(
    (trades: Trade[]) => {
      if (!tvWidgetReady || !tvWidgetRef.current) {
        return;
      }

      const currentResolution = (
        localStorage.getItem("chart_interval_resolution") ||
        tvWidgetRef.current?.activeChart().resolution() ||
        cookies.get("_chart_interval_resolution") ||
        "1S"
      ).toUpperCase();

      const key = `${mint}-${currentResolution}`;
      const existingTrades = tradeMap.current.get(key);

      let shouldRefresh = false;

      // wallet tracker
      if (existingTrades) {
        for (const newTrade of trades) {
          if (!newTrade) continue;
          const isDuplicate = (existingTrades || [])?.some((existingTrade) =>
            areTradesEqual(existingTrade, newTrade),
          );
          if (!isDuplicate) {
            existingTrades.push(newTrade);
            shouldRefresh = true;
          }
        }
      } else {
        tradeMap.current.set(key, trades);
        shouldRefresh = true;
      }

      updateTradeFilters(
        tvWidgetRef.current,
        tradeFilters.current,
        dropdownApiRef.current,
      );

      if (shouldRefresh) {
        tvWidgetRef.current?.activeChart().refreshMarks();
      }
    },
    [tvWidgetReady],
  );

  useEffect(() => {
    if (
      trade.current?.user_trades?.length &&
      isTVChartReady &&
      tvWidgetRef.current &&
      tvWidgetReady &&
      !isLoadingMarks
    ) {
      const user_trades = trade.current.user_trades;

      const cleanedUserTrades = user_trades.filter((trade) =>
        ["S", "B"].includes(trade.letter),
      );

      const currency: CurrencyChart =
        (localStorage.getItem("chart_currency") as CurrencyChart) || "SOL";

      const chartType: ChartType =
        (localStorage.getItem("chart_type") as ChartType) || "Price";

      const resolution = (
        localStorage.getItem("chart_interval_resolution") ||
        tvWidgetRef.current?.activeChart().resolution() ||
        cookies.get("_chart_interval_resolution") ||
        "1S"
      ).toUpperCase();

      const tradeStartTime = getBarStartTime(
        getCurrentServerTime(),
        resolution,
      );

      addUserTradeMarks(cleanedUserTrades);

      const lastUserTrade = cleanedUserTrades[cleanedUserTrades.length - 1];
      if (!lastUserTrade) return;

      removeAveragePriceLine(
        "buy",
        tvWidgetRef.current,
        buyAveragePriceShapeIdRef.current,
      );
      removeAveragePriceLine(
        "sell",
        tvWidgetRef.current,
        sellAveragePriceShapeIdRef.current,
      );
      const buyPriceByCurrency = parseFloat(
        currency === "SOL"
          ? lastUserTrade.average_price_base?.toString()
          : lastUserTrade.average_price_usd?.toString(),
      );
      const sellPriceByCurrency =
        currency === "SOL"
          ? lastUserTrade.average_sell_price_base
          : lastUserTrade.average_sell_price_usd

      buyAveragePriceTradeStartTimeRef.current = tradeStartTime;
      sellAveragePriceTradeStartTimeRef.current = tradeStartTime;
      const supply =
        convertDecimals(lastUserTrade?.supply_str || 0, quoteDecimalsRef.current!)
      if (chartType === "MCap") {
        buyAveragePriceShapePriceRef.current =
          buyPriceByCurrency * Number(supply);
        sellAveragePriceShapePriceRef.current =
          sellPriceByCurrency * Number(supply);
      } else {
        buyAveragePriceShapePriceRef.current = buyPriceByCurrency;
        sellAveragePriceShapePriceRef.current = sellPriceByCurrency;
      }

      if (localStorage.getItem("chart_hide_buy_avg_price_line") === "false") {
        // @ts-ignore
        buyAveragePriceShapeIdRef.current = addAveragePriceLine(
          "buy",
          tvWidgetRef.current,
          tradeStartTime,
          buyAveragePriceShapePriceRef.current,
        );
      }
      if (localStorage.getItem("chart_hide_sell_avg_price_line") === "false") {
        // @ts-ignore
        sellAveragePriceShapeIdRef.current = addAveragePriceLine(
          "sell",
          tvWidgetRef.current,
          tradeStartTime,
          sellAveragePriceShapePriceRef.current,
        );
      }
    }
  }, [
    trade.current?.user_trades,
    isTVChartReady,
    tvWidgetRef.current,
    tvWidgetReady,
    isLoadingMarks,
  ]);

  // ### E. From Discord Groups
  const { discordMessages } = useSocialFeedMonitor();
  const discordDataMatchWithMint = useMemo(() => {
    return (discordMessages || [])?.filter((msg) => msg.address === mint);
  }, [discordMessages, mint]);

  const addTradeMarksBasedOnDiscordGroups = useCallback(
    (dcMessages: FinalDiscordMessage[]) => {
      if (!tvWidgetReady || !tvWidgetRef.current) {
        return;
      }

      const currentResolution = (
        localStorage.getItem("chart_interval_resolution") ||
        tvWidgetRef.current?.activeChart().resolution() ||
        cookies.get("_chart_interval_resolution") ||
        "1S"
      ).toUpperCase();
      const key = `${mint}-${currentResolution}`;
      const existingTrades = tradeMap.current.get(key);

      let shouldRefresh = false;

      if (existingTrades) {
        for (const dcMessage of dcMessages) {
          for (const newTrade of dcMessage.group_counts) {
            if (!newTrade) continue;
            const isDuplicate = (existingTrades || [])?.some(
              (existingTrade) => {
                return (
                  existingTrade.signature ===
                  `DC-${newTrade?.name}-${newTrade?.pinged_timestamp}`
                );
              },
            );
            if (!isDuplicate) {
              const convertedDiscordGroupIntoTradeFormat: Trade = {
                average_price_base: 0,
                average_price_usd: 0,
                average_sell_price_base: 0,
                average_sell_price_usd: 0,
                colour: "orange",
                letter: "MDC",
                price: 0,
                price_usd: 0,
                supply: 1000000000,
                supply_str: "1000000000",
                signature: `DC-${newTrade?.name}-${newTrade?.pinged_timestamp
                  ? convertISOToMillisecondsTimestamp(
                    newTrade?.pinged_timestamp,
                  )
                  : ""
                  }`,
                token_amount: 0,
                timestamp: newTrade?.pinged_timestamp
                  ? convertISOToMillisecondsTimestamp(
                    newTrade?.pinged_timestamp,
                  )
                  : 0,
                name: newTrade?.name,
                wallet: newTrade?.name,
                imageUrl: newTrade?.image,
              };
              existingTrades.push(convertedDiscordGroupIntoTradeFormat);
              shouldRefresh = true;
            }
          }
        }
      } else {
        let initialDCGroups: Trade[] = [];

        for (const dcMessage of dcMessages) {
          for (const newTrade of dcMessage.group_counts) {
            if (!newTrade) continue;

            const convertedDiscordGroupIntoTradeFormat: Trade = {
              average_price_base: 0,
              average_price_usd: 0,
              average_sell_price_base: 0,
              average_sell_price_usd: 0,
              colour: "orange",
              letter: "MDC",
              price: 0,
              price_usd: 0,
              supply: 1000000000,
              supply_str: "1000000000",
              signature: `DC-${newTrade?.name}-${newTrade?.pinged_timestamp
                ? convertISOToMillisecondsTimestamp(
                  newTrade?.pinged_timestamp,
                )
                : ""
                }`,
              token_amount: 0,
              timestamp: newTrade?.pinged_timestamp
                ? convertISOToMillisecondsTimestamp(newTrade?.pinged_timestamp)
                : 0,
              name: newTrade?.name,
              wallet: newTrade?.name,
              imageUrl: newTrade?.image,
            };
            initialDCGroups.push(convertedDiscordGroupIntoTradeFormat);
          }
        }

        tradeMap.current.set(key, initialDCGroups);
        shouldRefresh = true;
      }

      updateTradeFilters(
        tvWidgetRef.current,
        tradeFilters.current,
        dropdownApiRef.current,
      );

      if (shouldRefresh) {
        tvWidgetRef.current?.activeChart().refreshMarks();
      }
    },
    [tvWidgetReady, mint],
  );

  useEffect(() => {
    if (
      discordDataMatchWithMint.length > 0 &&
      isTVChartReady &&
      tvWidgetRef.current &&
      tvWidgetReady &&
      !isLoadingMarks
    ) {
      console.warn("DC GROUPS 🐣🐣🐣", {
        discordDataMatchWithMint,
        mint,
      });
      addTradeMarksBasedOnDiscordGroups(discordDataMatchWithMint);
    }
  }, [
    discordDataMatchWithMint,
    isLoadingMarks,
    tvWidgetRef.current,
    isTVChartReady,
    tvWidgetReady,
  ]);
  return (
    <div className="h-full">
      <div ref={chartContainerRef} id="trading-view" className="h-full" />
      {/* <div id="candle-time" className="text-red-500"></div> */}
    </div>
  );
};

export default React.memo(NovaTradingView);
