import React, { useCallback } from "react";

// ######## Libraries 📦 & Hooks 🪝 ########
import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { useTokenMessageStore } from "@/stores/token/use-token-messages.store";
import { useTokenHoldingStore } from "@/stores/token/use-token-holding.store";
import { useTradesTableSettingStore } from "@/stores/table/token/use-trades-table-setting.store";
import { useHoldingsMessageStore } from "@/stores/holdings/use-holdings-messages.store";
import { useSolPriceMessageStore } from "@/stores/use-solprice-message.store";
import { useWalletsMessageStore } from "@/stores/wallets/use-wallets-message.store";
import { useCurrentTokenFreshWalletsStore } from "@/stores/token/use-current-token-fresh-wallets.store";
import { useSwapKeysStore } from "@/stores/token/use-swap-keys.store";
import { useUserWalletStore } from "@/stores/wallet/use-user-wallet.store";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTrackUserEvent } from "@/hooks/use-track-event";
import useVisibilityRefresh from "@/hooks/use-visibility-refresh";
import axios from "@/libraries/axios";
import cookies from "js-cookie";
import toast from "react-hot-toast";
// ######## APIs 🛜 ########
import { getServerTime } from "@/apis/rest/settings/server-time";
import { getFreshFundedInfo } from "@/apis/rest/trades";
import { SwapApiClient } from "@/apis/rest/swapApi";
// ######## Components 🧩 ########
import Link from "next/link";
import CustomToast from "@/components/customs/toasts/CustomToast";
// ######## Types 🗨️ ########
import {
  HoldingsConvertedMessageType,
  TokenDataMessageType,
  TransactionInfo,
  ChartTraderInfo,
  ChartHoldersInfo,
  WSMessage,
  ChartHoldingMessageType,
  TokenInfo,
  VolumeInfo,
  DataSecurityInfo,
  PriceInfo,
  ChartHolderInfo,
  ChartTransactionsMessageType,
  NewDeveloperToken,
} from "@/types/ws-general";
// ######## Utils & Helpers 🤝 ########
import { deduplicateAndPrioritizeLatestData_TransactionWS } from "@/helpers/deduplicateAndPrioritizeLatestData";
import { getBaseURLBasedOnRegion } from "../../../utils/getBaseURLBasedOnRegion";
// ######## Constants ☑️ ########
import { TRANSACTION_BATCH_PROCESSING_INTERVAL_MS } from "@/constants/duration";
import {
  defaultTVChartProperties,
  defaultTVChartPropertiesMainSeriesProperties,
} from "@/constants/trading-view.constant";
import { useFilteredWalletTradesStore } from "@/stores/token/use-filtered-wallet-trades.store";
import { useCurrentTokenDeveloperTradesStore } from "@/stores/token/use-current-token-developer-trades";
import { useMatchWalletTrackerTradesStore } from "@/stores/token/use-match-wallet-tracker-trades.store";
import { useWebSocket } from "@/hooks/useWebsocketNew";
import { isRelevantMessage } from "@/utils/websocket/isRelevantMessage";
import { useLatestTransactionMessageStore } from "@/stores/use-latest-transactions.store";
import { useCurrentTokenChartPriceStore } from "@/stores/token/use-current-token-chart-price.store";
import { useServerTimeStore } from "@/stores/use-server-time.store";
import { throttle } from "lodash";
import { useTrackUserEventStore } from "@/stores/use-track-user-event.store";
import { useCurrentTokenFollowedHoldersStore } from "@/stores/token/use-current-token-followed-holders.store";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { lamportsToSol } from "@/utils/solToLamport";
import { NovaSwapKeys } from "@/vendor/ts-keys/types";
import { convertChartHoldingsLamports } from "@/utils/lamportsConverter";
import useKeysTx, { KeysTxResult, useGlobalKeysTx } from "@/hooks/use-keys-tx";
import { convertDecimals } from "@/utils/convertDecimals";

type TokenDataQueuedMessage = {
  transactions: TransactionInfo[];
  transaction: TransactionInfo;
  chart_holder: ChartHoldersInfo;
  chart_traders: ChartTraderInfo[];
  swap_keys?: KeysTxResult;
};

const TokenSSRConfig = ({
  initChartData,
  isFetched,
}: {
  initChartData: TokenDataMessageType | null;
  isFetched: boolean;
}) => {
  const mint = useParams()?.["mint-address"] as string;
  const tokenDataMessageQueueRef = useRef<TokenDataQueuedMessage[]>([]);
  const tokenDataProcessingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // const tradesType = useTokenCardsFilter((state) => state.tradesType);

  const handleThrottleHoldersUpdate = useCallback(
    throttle(
      ({
        chartHolders,
        totalHolders,
        chartTraders,
        swap_keys
      }: {
        chartHolders?: ChartHolderInfo[];
        totalHolders?: number;
        chartTraders: ChartTraderInfo[];
        swap_keys?: KeysTxResult;
      }) => {
        if (Boolean(chartHolders) && chartHolders?.length)
          setChartHolderMessages(chartHolders);
        if (Boolean(totalHolders) && totalHolders)
          setTotalHolderMessages(totalHolders);
        if (Boolean(chartTraders)) setChartTraderMessages(chartTraders);
        if (Boolean(swap_keys)) setSwapKeys(swap_keys!);
      },
      600,
      { leading: true, trailing: true },
    ),
    [],
  );

  // Process queued messages
  const processTokenDataMessageQueue = () => {
    const currentQueue = [...tokenDataMessageQueueRef.current];
    tokenDataMessageQueueRef.current = [];
    const transactionBatch: TransactionInfo[] = [];
    currentQueue.forEach(
      ({ transaction, transactions, chart_holder, chart_traders, swap_keys }) => {
        // update init transactions if exists
        if (
          Boolean(transactions) &&
          Array.isArray(transactions) &&
          transactions?.length > 0
        ) {
          transactionBatch.push(...transactions);
        }

        // update live transactions
        if (Boolean(transaction)) {
          if (Array.isArray(transaction)) {
            transactionBatch.push(...transaction);
          } else if (transaction) {
            transactionBatch.push(transaction);
          }
        }

        // update chart holders and top traders
        handleThrottleHoldersUpdate({
          chartHolders: chart_holder?.chart_holders,
          totalHolders: chart_holder?.total_holders,
          chartTraders: chart_traders,
          swap_keys: swap_keys,
        });
      },
    );

    if (isTradesTableScrollMoreThanZeroRef.current) {
      setPausedTransactionMessages(transactionBatch);
    } else {
      setTransactionMessages(transactionBatch);
    }
  };

  // Auto Refresh upon visibility change 👁️
  useVisibilityRefresh({
    ms: 60_000 * 10,
  });

  // State Configuration ✨
  const {
    // setWSMintRef,
    // setWSHoldingRef,
    dataSecurityMessage,
    // timestamp,
    setTokenInfoMessage,
    setInitTransactionMessages,
    setTransactionMessages,
    setPriceMessage,
    setVolumeMessage,
    setDataSecurityMessage,
    setChartHolderMessages,
    setTotalHolderMessages,
    setChartTraderMessages,
    setTimestamp,
    setCreated,
    addDeveloperToken,
    updateDeveloperTokens,
    cleanup: cleanupToken,
    setSwapKeys
  } = useTokenMessageStore();

  const setTokenHolding = useTokenHoldingStore((state) => state.setMessage);
  const setIsLoadingHolding = useTokenHoldingStore(
    (state) => state.setIsLoading,
  );
  const setLastHoldingTimestamp = useTokenHoldingStore(
    (state) => state.setLastTimestamp,
  );
  const setSolPrice = useSolPriceMessageStore((state) => state.setMessages);
  const setHoldingsMessages = useHoldingsMessageStore(
    (state) => state.updateMessage,
  );

  const setWalletHoldingMessages = useWalletsMessageStore(
    (state) => state.setMessages,
  );

  // ### User Wallet Store 👛 ###
  const { activeWallet } = useUserWalletStore();
  const walletAddress = activeWallet?.address;

  // ### Swap Keys Store 🔄 ###
  const {
    setLoading: setSwapKeysLoading,
    setError: setSwapKeysError,
    setCurrentMint,
    cleanup: cleanupSwapKeys,
  } = useSwapKeysStore();

  const setFollowedHolders = useCurrentTokenFollowedHoldersStore(
    (state) => state.setFollowedHolders,
  );
  const setTop10Balance = useCurrentTokenFollowedHoldersStore(
    (state) => state.setTop10Balance,
  );
  const setTotalCount = useCurrentTokenFollowedHoldersStore(
    (state) => state.setTotalCount,
  );

  useQuery({
    queryKey: ["solanaPrice"],
    queryFn: async () => {
      const { data } = await axios.get<{ price: number }>(
        getBaseURLBasedOnRegion("/prices/solana"),
      );
      if (data.price)
        localStorage.setItem("current_solana_price", String(data.price));
      setSolPrice(data);
      return data.price;
    },
  });

  // ### Hover Transaction Paused Configuration
  const [pausedTransactionList, setPausedTransactionList] = useState<
    TransactionInfo[]
  >([]);
  const setPausedTransactionMessages = (
    newMessages: TransactionInfo | TransactionInfo[],
  ) => {
    setPausedTransactionList((prev) => {
      const updatedList = deduplicateAndPrioritizeLatestData_TransactionWS([
        ...(Array.isArray(newMessages) ? newMessages : [newMessages]),
        ...prev,
      ]);

      return updatedList;
    });
  };
  const isPaused = useTradesTableSettingStore((state) => state.isPaused);
  const isTradesTableScrollMoreThanZeroRef = useRef(isPaused);
  useEffect(() => {
    isTradesTableScrollMoreThanZeroRef.current = isPaused;
  }, [isPaused]);
  useEffect(() => {
    if (!isPaused && pausedTransactionList.length > 0) {
      setTransactionMessages(pausedTransactionList);
      setPausedTransactionList([]);
    }
  }, [isPaused]);

  useQuery({
    queryKey: ["developer-tokens", dataSecurityMessage?.deployer],
    queryFn: async () => {
      if (!dataSecurityMessage?.deployer) return null;

      const { data } = await axios.get<NewDeveloperToken[]>(
        getBaseURLBasedOnRegion("/developer-tokens"),
        {
          params: {
            developer: dataSecurityMessage.deployer,
          },
        },
      );
      const otherDeveloperTokens = data.filter(
        (token) => token.mint !== mint && token.mint !== "",
      );
      const currentDeveloperTokens = data.find((token) => token.mint === mint);
      addDeveloperToken(otherDeveloperTokens);
      if (currentDeveloperTokens)
        updateDeveloperTokens(mint, {
          migrated: currentDeveloperTokens.migrated,
        });

      return data;
    },
    enabled: !!dataSecurityMessage?.deployer,
  });

  const handleThrottleChartUpdate = useCallback(
    throttle(
      (
        token: TokenInfo,
        price: PriceInfo | null,
        volume: VolumeInfo,
        data_security: DataSecurityInfo,
        timestamp: number,
        swap_keys?: KeysTxResult,
      ) => {
        // update developer tokens
        if (price && token && volume) {
          updateDeveloperTokens(token.mint, {
            created: token.created_at,
            txCount: token.sells + token.buys,
            volume: volume.total_volume_usd,
            liquidityUsd: price.liquidity_usd,
            marketCapUsd: price.market_cap_usd,
          });
        }
        if (token) setTokenInfoMessage(token);
        if (price) setPriceMessage(price);
        if (volume) setVolumeMessage(volume);
        if (data_security) setDataSecurityMessage(data_security);
        if (timestamp) setTimestamp(timestamp);
        if (swap_keys) setSwapKeys(swap_keys);
      },
      1000,
      { leading: true, trailing: true },
    ),
    [],
  );

  /*
   * Websockets Configuration:
   * websocket to set token tables and side
   */
  const { stopMessage: stopTokenMessage } = useWebSocket<
    WSMessage<TokenDataMessageType | ChartTransactionsMessageType>
  >({
    channel: mint,
    initialMessage: {
      channel: mint,
      action: "join",
    },
    onInit: () => {
      tokenDataProcessingTimerRef.current = setInterval(
        processTokenDataMessageQueue,
        TRANSACTION_BATCH_PROCESSING_INTERVAL_MS,
      );
    },
    onMessage: (event) => {
      if (!isRelevantMessage(event, mint, "chartTransactions")) return;

      const message: TokenDataMessageType | ChartTransactionsMessageType =
        event.data;
      if (!message) return;

      const convertedMessage = convertChartHoldingsLamports(message as TokenDataMessageType);

      const {
        token,
        price,
        volume,
        data_security,
        transaction,
        timestamp,
        chart_holders,
        chart_traders,
        swap_keys
      } = convertedMessage as TokenDataMessageType;

      const { transactions } = message as ChartTransactionsMessageType;

      if (Boolean(transaction)) {
        handleThrottleChartUpdate(
          token,
          price,
          volume,
          data_security,
          timestamp,
          swap_keys,
        );
      }
      tokenDataMessageQueueRef.current.push({
        transaction,
        transactions: transactions || [],
        chart_holder: chart_holders,
        chart_traders: chart_traders,
        swap_keys: swap_keys,
      });
    },
  });

  /*
   * Websockets Configuration:
   * websocket to set token page our holding token:
   * invested, remaining, sold, pnl, my position
   */
  const { stopMessage: stopChartHoldingsMessage } = useWebSocket<
    WSMessage<ChartHoldingMessageType>
  >({
    channel: "chartHoldings",
    initialMessage: {
      channel: "chartHoldings",
      action: "join",
      mint,
    },
    onMessage: (event) => {
      if (!isRelevantMessage(event, "chartHoldings")) return;

      const message = event.data;
      if (!message.wallet) return;

      setIsLoadingHolding(false);

      if (
        (message?.holding?.invested_base <= 0 &&
          message?.holding?.balance <= 0 &&
          message?.holding?.sold_base <= 0) ||
        message?.holding?.token?.mint !== mint
      )
        return;

      const holdingData: HoldingsConvertedMessageType = {
        wallet: message.wallet,
        tokens: [
          {
            ...message?.holding,
          }
        ]
      };

      if (!firstChartHoldingMessage) {
        setFirstChartHoldingMessage(holdingData);
      }

      setLastHoldingTimestamp(Date.now());
      setTokenHolding(holdingData);
      setWalletHoldingMessages([holdingData]);
      setHoldingsMessages(holdingData);
    },
  });

  /*
   * Websockets Configuration:
   * websocket to set user's followings
   */
  const {
    sendMessage: sendHoldersFollowingMessage,
    stopMessage: stopHoldersFollowingMessage,
  } = useWebSocket<WSMessage<any>>({
    channel: "chartHolders",
    initialMessage: {
      channel: "chartHolders",
      mint: mint,
      action: "join",
    },
    onMessage: (event) => {
      // if (!isRelevantMessage(event, mint)) return;

      const message = event.data?.following
      if (!message || !Array.isArray(message) || message?.length <= 0) return;
      console.warn("DISPLAYED HOLDER 👥", message);

      setFollowedHolders(message)

      // const message: {
      //   holders: ChartHolderInfo[];
      //   top10Balance: number;
      //   totalCount: number;
      // } = event.data;
      // if (!message) return;

      // setFollowedHolders(message?.holders);
      // setTop10Balance(message?.top10Balance);
      // setTotalCount(message?.totalCount);
    },
  });

  const cleanupHolding = useTokenHoldingStore((state) => state.cleanup);
  const resetFilteredWalletTradesState = useFilteredWalletTradesStore(
    (state) => state.resetFilteredWalletTradesState,
  );
  const resetCurrentTokenDeveloperTradesState =
    useCurrentTokenDeveloperTradesStore(
      (state) => state.resetCurrentTokenDeveloperTradesState,
    );
  const resetMatchWalletTrackerTrades = useMatchWalletTrackerTradesStore(
    (state) => state.resetMatchWalletTrackerTrades,
  );
  const resetLatestTransactionMessages = useLatestTransactionMessageStore(
    (state) => state.resetMessages,
  );
  const { fetchKeys } = useGlobalKeysTx()

  useEffect(() => {
    setCurrentMint(mint);
    fetchKeys(mint)

    return () => {
      resetMatchWalletTrackerTrades();
      resetLatestTransactionMessages();
      stopChartHoldingsMessage();
      stopTokenMessage();
      stopHoldersFollowingMessage();
      cleanupToken();
      cleanupToken();
      cleanupHolding();
      cleanupSwapKeys(); // Cleanup swap keys store
      resetFilteredWalletTradesState();
      resetCurrentTokenDeveloperTradesState();
      setIsLoadingHolding(true);
    };
  }, []);

  const [firstChartHoldingMessage, setFirstChartHoldingMessage] =
    useState<HoldingsConvertedMessageType | null>(null);

  const setBaseTVState = () => {
    console.warn("TV BASE STATE DEBUG ✨");

    if (
      !localStorage.getItem("tradingview.chartproperties") ||
      localStorage
        .getItem("tradingview.chartproperties.mainSeriesProperties")
        ?.includes(`"candleStyle":{"upColor":"#089981","downColor":"#F23645"`)
    ) {
      localStorage.setItem(
        "tradingview.chartproperties",
        JSON.stringify(defaultTVChartProperties),
      );
    }
    if (
      !localStorage.getItem(
        "tradingview.chartproperties.mainSeriesProperties",
      ) ||
      localStorage
        .getItem("tradingview.chartproperties.mainSeriesProperties")
        ?.includes(`"candleStyle":{"upColor":"#089981","downColor":"#F23645"`)
    ) {
      localStorage.setItem(
        "tradingview.chartproperties.mainSeriesProperties",
        JSON.stringify(defaultTVChartPropertiesMainSeriesProperties),
      );
    }
  };

  useEffect(() => {
    if (
      !cookies.get("_chart_interval_resolution") ||
      cookies.get("_chart_interval_resolution") === "USD" ||
      cookies.get("_chart_interval_resolution") === "SOL"
    ) {
      cookies.set("_chart_interval_resolution", "1S");
    }
    if (!localStorage.getItem("chart_currency")) {
      localStorage.setItem("chart_currency", "USD");
      cookies.set("_chart_currency", "USD");
    }
    if (!localStorage.getItem("chart_type")) {
      localStorage.setItem("chart_type", "MCap");
    }
    if (!localStorage.getItem("chart_hide_buy_avg_price_line")) {
      localStorage.setItem("chart_hide_buy_avg_price_line", "false");
    }
    if (!localStorage.getItem("chart_hide_sell_avg_price_line")) {
      localStorage.setItem("chart_hide_sell_avg_price_line", "false");
    }

    setBaseTVState();

    let themeSetCount = 0;
    const themeSetInterval = setInterval(() => {
      if (themeSetCount < 10) {
        themeSetCount++;
        setBaseTVState();
      } else {
        clearInterval(themeSetInterval);
      }
    }, 500);

    return () => {
      if (themeSetInterval) {
        clearInterval(themeSetInterval);
      }
    };
  }, []);

  // set initial data to global state
  const initialFetch = useRef(true);
  const setCurrentTokenChartPrice = useCurrentTokenChartPriceStore(
    (state) => state.setCurrentTokenChartPrice,
  );
  const setCurrentTokenChartPriceUsd = useCurrentTokenChartPriceStore(
    (state) => state.setCurrentTokenChartPriceUsd,
  );
  const setCurrentTokenChartSupply = useCurrentTokenChartPriceStore(
    (state) => state.setCurrentTokenChartSupply,
  );
  useEffect(() => {
    if (
      initChartData &&
      initChartData.success !== false &&
      initialFetch.current === true
    ) {
      // console.log("INIT CHART DATA after if 🟢", {
      //   init: initChartData,
      //   isFetched,
      //   initialFetch: initialFetch.current,
      // });
      initialFetch.current = false;

      setBaseTVState();

      // console.log("INIT RECEIVED 🟢", {
      //   initChartData,
      // });

      setTokenInfoMessage(initChartData.token);
      setInitTransactionMessages(initChartData?.transactions?.reverse() || []);
      if (initChartData.price) {
        setPriceMessage(initChartData.price);
        if (initChartData?.price?.price_sol) {
          setCurrentTokenChartPrice(
            initChartData?.price?.price_sol?.toString(),
          );
        } else if (initChartData?.price?.price_base) {
          setCurrentTokenChartPrice(
            initChartData?.price?.price_base?.toString(),
          );
        }
        setCurrentTokenChartPriceUsd(initChartData.price.price_usd.toString());
        setCurrentTokenChartSupply(initChartData.price.supply.toString());
      }
      setVolumeMessage(initChartData.volume);
      setDataSecurityMessage(initChartData.data_security);
      setChartHolderMessages(initChartData?.chart_holders?.chart_holders || []);
      if (initChartData?.chart_holders?.chart_holders) {
        setTotalHolderMessages(initChartData?.chart_holders?.total_holders);
      } else {
        setTotalHolderMessages(0);
      }
      setChartTraderMessages(initChartData?.chart_traders || []);
      setTimestamp(Date.now() / 1000);
      setCreated(initChartData?.token.created_at || Date.now() / 1000);
      if (
        initChartData?.token &&
        initChartData?.price &&
        initChartData?.volume
      ) {
        addDeveloperToken({
          symbol: initChartData?.token.symbol,
          dex: initChartData?.token.dex,
          origin_dex: initChartData?.token.origin_dex,
          image: initChartData?.token.image,
          mint: initChartData?.token.mint,
          created: initChartData?.token.created_at,
          txCount: initChartData?.token.sells + initChartData?.token.buys,
          volume: initChartData?.volume.total_volume_usd,
          liquidityUsd: initChartData?.price.liquidity_usd,
          marketCapUsd: initChartData?.price.market_cap_usd,
          migrated: false,
        });
      }

      return () => {
        initialFetch.current = true;
        cleanupToken();
        cleanupHolding();
        if (tokenDataProcessingTimerRef.current) {
          clearInterval(tokenDataProcessingTimerRef.current);
        }
      };
    }
  }, [isFetched]);

  const timeSyncToastId = useRef<null | any>(null);
  const { setServerTime, setTimeOffset } = useServerTimeStore();

  const checkSystemTimeSync = async () => {
    const serverTime = await getServerTime();
    const userTime = new Date().getTime();

    // Calculate time offset between server and client
    const offset = serverTime - userTime;
    // const el = document.getElementById("debug-charts");
    // if (el) {
    //   el.innerHTML = `Server Time:${new Date(serverTime).toLocaleString()}| Client Time:${new Date(userTime).toLocaleString()}| Offset:${offset}`;
    // }

    const diffInSeconds = Math.abs(offset / 1000);
    const threshold = 60 * 3;

    const userAgent = navigator.userAgent || navigator.platform;
    let link = "https://www.google.com/search?q=how+to+sync+system+time";

    if (/Win/i.test(userAgent)) {
      link =
        "https://support.microsoft.com/en-us/windows/set-time-date-and-time-zone-settings-in-windows-dfaa7122-479f-5b98-2a7b-fa0b6e01b261";
    } else if (/Mac/i.test(userAgent)) {
      link =
        "https://eclecticlight.co/2025/05/21/system-time-clocks-and-their-syncing-in-macos/";
    }

    if (diffInSeconds > threshold) {
      setServerTime(serverTime);
      setTimeOffset(offset);
      timeSyncToastId.current = toast.custom(
        (t: any) => (
          <CustomToast
            tVisibleState={t.visible}
            customMessage={
              <div className="flex items-center gap-x-1.5 text-sm leading-[20px] text-fontColorPrimary">
                <span>Sync Error!</span>
                <span>
                  Time to{" "}
                  <Link
                    href={link}
                    target="_blank"
                    className="text-destructive underline"
                  >
                    sync
                  </Link>{" "}
                  your device
                </span>
              </div>
            }
            state="ERROR"
          />
        ),
        {
          duration: Infinity,
          id: "time-sync",
        },
      );
    } else {
      toast.dismiss(timeSyncToastId.current);
    }
  };

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        checkSystemTimeSync();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  useEffect(() => {
    let oldTime: number = new Date().getTime();

    const checkSystemTimePeriodically = () => {
      const d = new Date().getTime();
      const diff = Math.abs(d - oldTime);

      const userAgent = navigator.userAgent || navigator.platform;
      let link = "https://www.google.com/search?q=how+to+sync+system+time";

      if (/Win/i.test(userAgent)) {
        link =
          "https://support.microsoft.com/en-us/windows/set-time-date-and-time-zone-settings-in-windows-dfaa7122-479f-5b98-2a7b-fa0b6e01b261";
      } else if (/Mac/i.test(userAgent)) {
        link =
          "https://eclecticlight.co/2025/05/21/system-time-clocks-and-their-syncing-in-macos/";
      }

      if (diff > 60_000 * 3) {
        timeSyncToastId.current = toast.custom(
          (t: any) => (
            <CustomToast
              tVisibleState={t.visible}
              customMessage={
                <div className="flex items-center gap-x-1.5 text-sm leading-[20px] text-fontColorPrimary">
                  <span>Sync Error!</span>
                  <span>
                    Time to{" "}
                    <Link
                      href={link}
                      target="_blank"
                      className="text-destructive underline"
                    >
                      sync
                    </Link>{" "}
                    your device
                  </span>
                </div>
              }
              state="ERROR"
            />
          ),
          {
            duration: Infinity,
            id: "time-sync",
          },
        );
      } else {
        toast.dismiss(timeSyncToastId.current);
      }

      oldTime = d;
    };

    const checkSystemTimeInSyncInterval = setInterval(
      checkSystemTimePeriodically,
      10_000,
    );
    const checkSystemTimeInSyncWithFetchInterval = setInterval(
      checkSystemTimeSync,
      60_000,
    );

    checkSystemTimePeriodically();
    checkSystemTimeSync();

    return () => {
      clearInterval(checkSystemTimeInSyncInterval);
      clearInterval(checkSystemTimeInSyncWithFetchInterval);
    };
  }, []);

  const isExternal = useTrackUserEventStore((state) => state.isExternal);
  const setIsExternal = useTrackUserEventStore((state) => state.setIsExternal);
  const { mutate: trackUserEvent } = useTrackUserEvent("external");

  useEffect(() => {
    if (!mint || !isExternal) return;

    if (sessionStorage.getItem("prevMint") === mint) return;

    sessionStorage.setItem("prevMint", mint);
    trackUserEvent({ mint: mint });
    setIsExternal(false);
  }, [mint, isExternal]);

  return null;
};

export default TokenSSRConfig;
