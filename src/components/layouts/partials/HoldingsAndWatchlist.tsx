"use client";

// ######## Libraries 📦 & Hooks 🪝 ########
import React, { useRef, useMemo, useCallback, useEffect } from "react";
import { useUserWalletStore } from "@/stores/wallet/use-user-wallet.store";
import { useHoldingsHideStore } from "@/stores/holdings/use-holdings-hide.store";
import {
  BatchPriceMessage,
  useHoldingsMessageStore,
} from "@/stores/holdings/use-holdings-messages.store";
import { useHoldingsMarqueeSortStore } from "@/stores/holdings/use-holdings-marquee-sort.store";
import { useWatchlistTokenStore } from "@/stores/use-watchlist-token.store";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
// ######## APIs 🛜 ########
import {
  fetchWatchlist,
  removeFromWatchlist,
  WatchlistToken,
} from "@/apis/rest/watchlist";
// ######## Components 🧩 #########
import Link from "next/link";
import Image from "next/image";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
// ######## Utils & Helpers 🤝 ########
import { cn } from "@/libraries/utils";
import { truncateString } from "@/utils/truncateString";
import {
  formatAmountWithoutLeadingZero,
  formatAmountDollar,
} from "@/utils/formatAmount";
import { getProxyUrl } from "@/utils/getProxyUrl";
import {
  HOLDINGS_BATCH_PROCESSING_INTERVAL_MS,
  HOLDINGS_CHART_PRICE_BATCH_PROCESSING_INTERVAL_MS,
} from "@/constants/duration";
import {
  HoldingsBatchPriceDataQueuedMessage,
  HoldingsDataQueuedMessage,
} from "@/components/customs/sections/HoldingsListSection";
import cookies from "js-cookie";
import { useWebSocket } from "@/hooks/useWebsocketNew";
import {
  HoldingsConvertedMessageType,
  HoldingsTokenData,
} from "@/types/ws-general";
import { useParams, usePathname } from "next/navigation";
import { useCustomizeTheme } from "@/hooks/use-customize-theme";
import { useCustomToast } from "@/hooks/use-custom-toast";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { useTokenMessageStore } from "@/stores/token/use-token-messages.store";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

type HoldingItemProps = {
  isLast: boolean;
  image: string;
  tokenSymbol: string;
  remainingSol: number;
  percentage: number;
  mint: string;
  walletName: string;
};
const HoldingItem = React.memo(
  ({
    isLast,
    image,
    tokenSymbol,
    remainingSol,
    percentage,
    mint,
    walletName,
  }: HoldingItemProps) => {
    return (
      <Link
        href={`/token/${mint}`}
        prefetch
        className={cn(
          "flex flex-shrink-0 items-center justify-center gap-x-1 border-r border-border pl-1.5 pr-2 hover:cursor-pointer",
          isLast && "border-r-0",
        )}
      >
        <span className="font-geistMonoBold text-xs text-fontColorPrimary">
          {`(${truncateString(walletName, 5)})`}
        </span>
        <div className="relative aspect-square h-4 w-4 flex-shrink-0 overflow-hidden rounded-full">
          <Image
            src={image}
            alt="Token Image"
            fill
            quality={100}
            className="object-contain"
          />
        </div>
        <span className="font-geistMonoLight text-xs text-fontColorPrimary">
          {truncateString(tokenSymbol, 5)}
        </span>
        <span className="font-geistMonoLight text-xs text-fontColorSecondary">
          {formatAmountWithoutLeadingZero(Number(remainingSol ?? 0))}
        </span>
        <span
          className={cn(
            "font-geistMonoLight text-xs",
            percentage > 0
              ? "text-success"
              : percentage < 0
                ? "text-destructive"
                : "text-fontColorPrimary",
          )}
        >
          {percentage > 0 ? "+" : ""}
          {!percentage ? 0 : percentage?.toFixed(2)}%
        </span>
      </Link>
    );
  },
);
HoldingItem.displayName = "HoldingItem";

const WatchlistItem = React.memo(
  ({ image, symbol, marketCap, pnl, mint }: WatchlistToken) => {
    const { success, error: errorToast } = useCustomToast();
    const queryClient = useQueryClient();
    const removeFromWatchlistMutation = useMutation({
      mutationFn: removeFromWatchlist,
      onSuccess: () => {
        // toast.custom((t: any) => (
        //   <CustomToast
        //     tVisibleState={t.visible}
        //     message="Removed from Watchlist"
        //     state="SUCCESS"
        //   />
        // ));
        success("Removed from Watchlist");
        queryClient.invalidateQueries({ queryKey: ["watchlist"] });
      },
      onError: (error: Error) => {
        // toast.custom((t: any) => (
        //   <CustomToast
        //     tVisibleState={t.visible}
        //     message={error.message}
        //     state="ERROR"
        //   />
        // ));
        errorToast(error.message);
      },
    });

    const handleRemove = (mint: string) => {
      removeFromWatchlistMutation.mutate(mint);
    };

    const imageSrc = useMemo(
      () => getProxyUrl(image as string, symbol?.[0] || ""),
      [image, symbol],
    );

    return (
      <div className="group relative flex w-auto flex-shrink-0 items-center justify-center gap-x-1 rounded-[4px] bg-secondary py-[2.5px] pl-0.5 pr-1 transition-all duration-200 ease-in-out">
        <div className="absolute left-0 top-px z-10 h-px w-1/2 bg-gradient-to-r from-[#FFFFFF00] via-[#FFFFFF]/50 to-[#FFFFFF00] opacity-0 duration-200 ease-in-out group-hover:opacity-100"></div>
        <div className="absolute bottom-px right-0 z-10 h-px w-1/2 bg-gradient-to-r from-[#FFFFFF00] via-[#FFFFFF]/50 to-[#FFFFFF00] opacity-0 duration-200 ease-in-out group-hover:opacity-100"></div>

        <Link
          href={`/token/${mint}`}
          prefetch
          className="relative z-20 flex gap-x-1"
        >
          <div className="relative aspect-square h-4 w-4 flex-shrink-0 overflow-hidden rounded-full">
            <Image
              key={imageSrc}
              src={imageSrc as string}
              alt="Token Watchlist Image"
              fill
              quality={50}
              crossOrigin="anonymous"
              referrerPolicy="no-referrer"
              className="object-contain"
            />
          </div>
          <span className="font-geistMonoLight text-xs text-fontColorPrimary">
            ${truncateString(symbol, 5)}
          </span>
        </Link>
        <span className="font-geistMonoLight text-xs text-fontColorSecondary">
          {formatAmountDollar(Number(marketCap))}
        </span>
        {/* <span
          className={cn(
            "font-geistMonoLight text-xs",
            pnl > 0
              ? "text-success"
              : pnl < 0
                ? "text-destructive"
                : "text-fontColorPrimary",
          )}
        >
          {pnl > 0 ? "+" : "-"}
          {!pnl ? 0 : pnl?.toFixed(2)}%
        </span> */}

        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          className="w-0 scale-0 cursor-pointer opacity-0 transition-all duration-200 ease-in-out group-hover:w-4 group-hover:scale-100 group-hover:opacity-100"
          onClick={() => handleRemove(mint)}
        >
          <path
            d="M8.86266 2.00066C9.61657 2.00077 10.2279 2.61196 10.2279 3.36589V3.94109H12.8861C13.0448 3.94109 13.1742 4.06946 13.1742 4.2282V4.80339C13.174 4.96198 13.0447 5.0905 12.8861 5.0905H12.2924L11.809 11.7809C11.7886 12.0635 11.7713 12.3089 11.7406 12.5104C11.7081 12.7239 11.6548 12.9347 11.5394 13.1354C11.3664 13.4365 11.106 13.6779 10.7933 13.8288C10.5848 13.9294 10.3709 13.968 10.1556 13.985C9.95243 14.0011 9.70652 14.0007 9.42321 14.0007H6.57653C6.2931 14.0007 6.04736 14.0011 5.84411 13.985C5.62882 13.968 5.41493 13.9294 5.20641 13.8288C4.89384 13.6779 4.63429 13.4363 4.4613 13.1354C4.34589 12.9347 4.29264 12.724 4.26012 12.5104C4.22944 12.3089 4.21119 12.0636 4.19079 11.7809L3.70837 5.0905H3.11364C2.95516 5.09033 2.82671 4.96187 2.82653 4.80339V4.2282C2.82653 4.06957 2.95505 3.94126 3.11364 3.94109H5.77282V3.36589C5.77284 2.61189 6.38405 2.00066 7.13805 2.00066H8.86266ZM6.77868 6.81511C6.61994 6.81511 6.49157 6.94348 6.49157 7.10222V10.5514C6.49166 10.7101 6.62 10.8386 6.77868 10.8386H7.20934C7.36803 10.8386 7.49734 10.7101 7.49743 10.5514V7.10222C7.49743 6.94348 7.36808 6.81511 7.20934 6.81511H6.77868ZM8.7904 6.81511C8.63175 6.81522 8.50329 6.94355 8.50329 7.10222V10.5514C8.50338 10.71 8.63181 10.8384 8.7904 10.8386H9.22204C9.38058 10.8384 9.50906 10.71 9.50915 10.5514V7.10222C9.50915 6.94358 9.38064 6.81528 9.22204 6.81511H8.7904ZM7.13805 3.00652C6.93964 3.00652 6.7787 3.16748 6.77868 3.36589V3.94109H9.22204V3.36589C9.22202 3.16755 9.06098 3.00663 8.86266 3.00652H7.13805Z"
            fill="#FCFCFD"
          />
        </svg>
      </div>
    );
  },
);
WatchlistItem.displayName = "WatchlistItem";

// const HOLDINGS_SORT_BUTTON_WIDTH = 130;
// const WATCLIST_ICON = 130;
// const GAPS = 50;
// const HOLDING_ITEM_WIDTH = 235;
// const WATCHLIST_ITEM_WIDTH = 180;

export default function HoldingsAndWatchlist() {
  const pathname = usePathname();
  const holdingsDataMessageQueueRef = useRef<HoldingsDataQueuedMessage[]>([]);
  const holdingsDataProcessingTimerRef = useRef<NodeJS.Timeout | null>(null);
  // const chartPriceHoldingsDataMessageQueueRef = useRef<
  //   HoldingsBatchPriceDataQueuedMessage[]
  // >([]);
  // const chartPriceHoldingsDataProcessingTimerRef =
  //   useRef<NodeJS.Timeout | null>(null);
  // const { width } = useWindowSize();
  const theme = useCustomizeTheme();

  // ######## Holdings 🪙 ########
  const holdingsMessages = useHoldingsMessageStore((state) => state.messages);
  // const tokenInfo = useTokenMessageStore((state) => state.tokenInfoMessage);
  const price = useTokenMessageStore((state) => state.priceMessage);
  const mint = useParams()?.["mint-address"] as string;

  const sortType = useHoldingsMarqueeSortStore((state) => state.sortType);
  const setSortType = useHoldingsMarqueeSortStore((state) => state.setSortType);
  const updateHoldingsMessages = useHoldingsMessageStore(
    (state) => state.updateMessage,
  );
  const chartPriceMessage = useHoldingsMessageStore(
    (state) => state.batchPriceMessage,
  );
  // const setChartPriceMessage = useHoldingsMessageStore(
  //   (state) => state.setBatchPriceMessage,
  // );
  const setMarqueeMint = useHoldingsMessageStore(
    (state) => state.setMarqueeMint,
  );
  // const marqueeMints = useHoldingsMessageStore((state) => state.marqueeMint);

  const hiddenTokenList = useHoldingsHideStore(
    (state) => state.hiddenTokenList,
  );

  // const holdingsItemLimit = useMemo(() => {
  //   const remainingWidth =
  //     (width! - HOLDINGS_SORT_BUTTON_WIDTH - GAPS - WATCLIST_ICON) / 2;

  //   return Math.round(remainingWidth / HOLDING_ITEM_WIDTH);
  // }, [width]);
  // const watchlistItemLimit = useMemo(() => {
  //   const remainingWidth =
  //     (width! - HOLDINGS_SORT_BUTTON_WIDTH - GAPS - WATCLIST_ICON) / 2;

  //   return Math.round(remainingWidth / WATCHLIST_ITEM_WIDTH + 0.5);
  // }, [width]);

  const finalHoldings = useMemo(() => {
    if (!(holdingsMessages || []).length) return [];

    return (holdingsMessages || [])
      ?.map((cm) => ({
        ...cm,
        tokens: (cm.tokens || [])
          ?.map((t) => {
            return {
              ...t,
              walletName: cm.wallet,
            } as HoldingsTokenData;
          })
          // ?.filter((token) => token.balance !== 0),
          ?.filter((token) => token.invested_base > 0),
      }))
      ?.filter((cm) => cm.tokens.length > 0);
  }, [holdingsMessages]);

  const filteredAndSortedTokens = useMemo(() => {
    let allTokens =
      finalHoldings
        ?.flatMap((wallet) => wallet.tokens || [])
        ?.filter((t: any) => !hiddenTokenList.includes(t.token.mint)) || [];

    if (mint && price && price.price_base && price.price_usd) {
      const index = allTokens.findIndex((t) => t.token.mint === mint);

      if (index !== -1) {
        const updatedToken: HoldingsTokenData = {
          ...allTokens[index],
          price,
        };
        allTokens[index] = updatedToken;
      }
    }

    // Only show holding with remaining & always sort after potential mutation
    allTokens = allTokens
      .filter((token) => token.balance > 0)
      .sort((a, b) =>
        sortType === "amount"
          ? b.balance - a.balance
          : b.last_bought - a.last_bought,
      );

    return allTokens;
  }, [finalHoldings, hiddenTokenList, sortType, mint, price]);

  const userWalletsWithName = useUserWalletStore(
    (state) => state.userWalletFullList,
  );

  const renderHoldingItems = useCallback(() => {
    const source = (filteredAndSortedTokens || [])?.slice(0, 10);
    // const source = filteredAndSortedTokens?.slice(0, holdingsItemLimit);

    return source?.map((item, index) => {
      const priceBase =
        (chartPriceMessage || [])?.find(
          (price) => price?.mint === item?.token?.mint,
        )?.price_base ||
        item?.price?.price_sol ||
        item?.price?.price_base ||
        0;
      const remainingSol = item?.balance * priceBase;
      const prevCalc = item?.sold_base + item?.balance * priceBase;
      const pnlSol = prevCalc - item?.invested_base;
      const pnlPercentage = (pnlSol / item?.invested_base) * 100;
      // console.log("pnlPercentage", {
      //   pnlSol,
      //   investedBase: item?.investedBase,
      //   pnlPercentage,
      //   item
      // })
      const walletName = (userWalletsWithName || [])?.find(
        (wallet) => wallet?.address === item?.walletName,
      )?.name;
      const proxyImage = getProxyUrl(item?.token?.image, item?.token?.symbol);

      return (
        <HoldingItem
          isLast={source.length - 1 === index}
          key={item?.token?.mint + index}
          remainingSol={remainingSol || 0}
          image={proxyImage}
          mint={item?.token?.mint}
          percentage={pnlPercentage || 0}
          tokenSymbol={item?.token?.symbol}
          walletName={walletName || "UW"}
        />
      );
    });
  }, [
    filteredAndSortedTokens,
    // holdingsItemLimit,
    chartPriceMessage,
    userWalletsWithName,
  ]);

  const prevMints = useRef<string[]>([]);
  const handleSendMessage = (
    mints: string[],
  ) => {
    try {
      // console.warn("WATCHLIST ⭐ | SUBSCRIPTION JOIN 🟢", mints);
      const batchPriceSubscriptionLeaveMessage = {
        channel: "batchPrice",
        token: cookies.get("_nova_session"),
        method: "watchlist",
        action: "leave",
      };
      const batchPriceSubscriptionJoinMessage = {
        channel: "batchPrice",
        mints,
        token: cookies.get("_nova_session"),
        method: "watchlist",
        action: "join",
      };

      sendMessage(batchPriceSubscriptionLeaveMessage);
      sendMessage(batchPriceSubscriptionJoinMessage);
    } catch (error) {
      console.warn("Error sending message:", error);
    }
  };
  const processHoldingsDataMessageQueue = () => {
    const currentQueue: HoldingsDataQueuedMessage[] = [
      ...holdingsDataMessageQueueRef.current,
    ];
    holdingsDataMessageQueueRef.current = [];

    currentQueue.forEach(({ data }) => {
      updateHoldingsMessages(data);
    });
  };
  // const processChartPriceHoldingsDataMessageQueue = () => {
  //   // const currentQueue = [...chartPriceHoldingsDataMessageQueueRef.current];
  //   chartPriceHoldingsDataMessageQueueRef.current = [];

  //   // setChartPriceMessage((currentQueue || [])?.map((item) => item?.data));
  // };
  const { sendMessage } = useWebSocket({
    channel: "watchlist",
    onInit: () => {
      if (pathname === "/holdings") return;
      holdingsDataProcessingTimerRef.current = setInterval(
        processHoldingsDataMessageQueue,
        HOLDINGS_BATCH_PROCESSING_INTERVAL_MS,
      );
      // chartPriceHoldingsDataProcessingTimerRef.current = setInterval(
      //   processChartPriceHoldingsDataMessageQueue,
      //   HOLDINGS_CHART_PRICE_BATCH_PROCESSING_INTERVAL_MS,
      // );
    },
    onLeave: () => {
      if (pathname === "/holdings") return;
      if (holdingsDataProcessingTimerRef.current) {
        clearInterval(holdingsDataProcessingTimerRef.current);
        holdingsDataProcessingTimerRef.current = null;
      }
    },
    onMessage: (event) => {
      try {
        if (event?.channel === "ping" && event.success === true) {
          return;
        }

        const newMessage = event; 
        if (
          newMessage.channel == "batchPrice" &&
          newMessage.method !== "watchlist"
        ) {
          return;
          // if (pathname === "/holdings") return;
          // chartPriceHoldingsDataMessageQueueRef.current.push({
          //   data: newMessage,
          //   timestamp: Date.now(),
          // });
        } else if (
          newMessage.channel == "batchPrice" &&
          newMessage.method === "watchlist"
        ) {
          // console.warn("WATCHLIST ⭐ | MESSAGE RECEIVED 📨", newMessage);

          updateWatchlistToken(newMessage?.data as BatchPriceMessage);
          return;
        }
      } catch (e) {
        console.warn("Error parsing message:", e);
        // addError("holding", {
        //   message: (e as any).message || "Error parsing message",
        //   timestamp: new Date(),
        // });
      }
    },
  });
  const stringKeyMarqueeMints = useMemo(() => {
    if (
      ((filteredAndSortedTokens || [])?.slice(0, 10)?.length || 0) > 0
      // (filteredAndSortedTokens?.slice(0, holdingsItemLimit)?.length || 0) > 0
    ) {
      return (
        (filteredAndSortedTokens || [])
          ?.slice(0, 10)
          // ?.slice(0, holdingsItemLimit)
          ?.map((h) => h.token.mint)
          ?.join(",") || ""
      );
    }
    return "";
  }, [
    (filteredAndSortedTokens || [])
      ?.slice(0, 10)
      // ?.slice(0, holdingsItemLimit)
      ?.map((h) => h.token.mint),
  ]);

  useEffect(() => {
    setMarqueeMint(
      (filteredAndSortedTokens || [])
        ?.slice(0, 10)
        // ?.slice(0, holdingsItemLimit)
        ?.map((h) => h.token.mint) || [],
    );
  }, [
    stringKeyMarqueeMints,
    // holdingsItemLimit
  ]);

  // ######## Watchlist ⭐ ########
  const isLoading = useWatchlistTokenStore((state) => state.isLoading);
  const watchlistTokenMints = useWatchlistTokenStore(
    (state) => state.watchlistToken,
  );
  const updateWatchlistToken = useWatchlistTokenStore(
    (state) => state.updateWatchlistToken,
  );

  const isInitialLeave = useRef<boolean>(true);
  useEffect(() => {
    if (isLoading) return;

    console.warn("WATCHLIST ⭐ | LIST 🌿", watchlistTokenMints);

    if (watchlistTokenMints.length === 0) {
      if (isInitialLeave.current) {
        isInitialLeave.current = false;
        return;
      }
      console.warn("WATCHLIST ⭐ | SUBSCRIPTION LEAVE 🔴 ");

      sendMessage({
        channel: "batchPrice",
        token: cookies.get("_nova_session"),
        method: "watchlist",
        action: "leave",
      });
    } else {
      console.warn("WATCHLIST ⭐ | ELSE 😂😂😂😂");
      if (isInitialLeave.current) {
        isInitialLeave.current = false;
      }
      handleSendMessage(
        watchlistTokenMints?.slice(0, 10).map((w) => w.mint) || [],
      );
    }
  }, [watchlistTokenMints.length, isLoading]);

  const renderWatchlistItems = useCallback(() => {
    return watchlistTokenMints
      ?.slice(0, 10)
      ?.map((item) => <WatchlistItem key={item?.mint} {...item} />);
  }, [watchlistTokenMints]);

  // ===== Scroll Refs for Holdings & Watchlist =====
  const holdingsScrollerRef = useRef<HTMLDivElement>(null);
  const watchlistScrollerRef = useRef<HTMLDivElement>(null);

  // ===== Arrow Navigation Logic =====
  const scrollByAmount = 250;
  const handleScroll = (ref: HTMLDivElement, dir: "left" | "right") => {
    if (ref) {
      ref.scrollBy({
        left: dir === "left" ? -scrollByAmount : scrollByAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div
      className={cn(
        "relative hidden h-10 w-full flex-shrink-0 items-center justify-start gap-x-4 overflow-hidden border-b border-border pl-4 sm:flex",
      )}
      style={theme.background2}
    >
      {/* <div className="fixed left-1/2 top-10 z-[10000] flex -translate-x-1/2 flex-col rounded-md border border-white/50 bg-black p-1.5 font-geistMonoRegular text-xs text-white">
        <h4 className="mb-1 font-geistMonoSemiBold text-sm">
          HOLDING & WATHCLIST DEBUG ⭐
        </h4>
        <span>
          Screen Width:{" "}
          {width! - HOLDINGS_SORT_BUTTON_WIDTH - GAPS - WATCLIST_ICON}
        </span>
        <span>
          Holdings Width:{" "}
          {(width! - HOLDINGS_SORT_BUTTON_WIDTH - GAPS - WATCLIST_ICON) / 2}
        </span>
        <span>
          Wathclist Width:{" "}
          {(width! - HOLDINGS_SORT_BUTTON_WIDTH - GAPS - WATCLIST_ICON) / 2}
        </span>
        <div className="my-2 h-px w-full bg-white/40"></div>
        <span>
          Raw Holdings Limit:{" "}
          {(width! - HOLDINGS_SORT_BUTTON_WIDTH - GAPS - WATCLIST_ICON) /
            2 /
            HOLDING_ITEM_WIDTH}
        </span>
        <span>
          Raw Wathclist Limit:{" "}
          {(width! - HOLDINGS_SORT_BUTTON_WIDTH - GAPS - WATCLIST_ICON) /
            2 /
            WATCHLIST_ITEM_WIDTH}
        </span>
        <span>Final Holdings Limit: {holdingsItemLimit}</span>
        <span>Final Wathclist Limit: {watchlistItemLimit}</span>
      </div> */}

      <TooltipProvider>
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild></TooltipTrigger>
          <TooltipContent
            side="bottom"
            isWithAnimation={false}
            className="px-2 py-0.5"
          ></TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <div className="flex w-1/2 items-center">
        <div className="relative mr-2 h-[24px] w-auto flex-shrink-0 rounded-[6px]">
          <div
            className={cn(
              "relative flex h-full w-full overflow-hidden rounded-[6px] bg-[#1b1b24]",
            )}
          >
            <div
              className={cn(
                "absolute left-0 top-1/2 h-full w-1/2 -translate-y-1/2 rounded-[6px] bg-[#2B2B3B] duration-300 ease-in-out",
                sortType === "amount" ? "left-0" : "left-1/2",
              )}
            ></div>

            <TooltipProvider>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <div className="relative z-20 h-full w-full">
                    <button
                      type="button"
                      onClick={() => setSortType("amount")}
                      className={cn(
                        "flex h-full w-[34px] cursor-pointer items-center justify-center rounded-[4px] font-geistMonoSemiBold text-[10px] leading-3 text-fontColorPrimary duration-300 hover:text-[#cccce1] lg:text-xs",
                      )}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="duration-300"
                      >
                        <path
                          d="M12.0795 0.734973H1.92078C1.10266 0.734973 0.437655 1.39998 0.437655 2.21811V7.58621C0.437655 8.39999 1.10266 9.06496 1.92078 9.06496H12.0795C12.8976 9.06496 13.5627 8.39998 13.5627 7.58621V2.21811C13.5627 1.39998 12.8976 0.734973 12.0795 0.734973ZM2.28827 4.89998C2.28827 4.54999 2.57266 4.2656 2.92265 4.2656H3.56141C3.91141 4.2656 4.19579 4.54999 4.19579 4.89998C4.19579 5.24998 3.91141 5.53433 3.56141 5.53433H2.92265C2.57266 5.53433 2.28827 5.24998 2.28827 4.89998ZM4.77765 4.89998C4.77765 3.67499 5.77516 2.67748 7.00016 2.67748C8.22515 2.67748 9.22267 3.67499 9.22267 4.89999C9.22267 6.12498 8.22515 7.12246 7.00016 7.12246C5.77516 7.12246 4.77765 6.12498 4.77765 4.89998ZM11.0777 5.53433H10.4389C10.0889 5.53433 9.80452 5.24998 9.80452 4.89998C9.80452 4.54999 10.0889 4.2656 10.4389 4.2656H11.0777C11.4277 4.2656 11.712 4.54999 11.712 4.89998C11.712 5.24998 11.4277 5.53433 11.0777 5.53433Z"
                          fill="black"
                        />
                        <path
                          d="M12.0795 0.734973H1.92078C1.10266 0.734973 0.437655 1.39998 0.437655 2.21811V7.58621C0.437655 8.39999 1.10266 9.06496 1.92078 9.06496H12.0795C12.8976 9.06496 13.5627 8.39998 13.5627 7.58621V2.21811C13.5627 1.39998 12.8976 0.734973 12.0795 0.734973ZM2.28827 4.89998C2.28827 4.54999 2.57266 4.2656 2.92265 4.2656H3.56141C3.91141 4.2656 4.19579 4.54999 4.19579 4.89998C4.19579 5.24998 3.91141 5.53433 3.56141 5.53433H2.92265C2.57266 5.53433 2.28827 5.24998 2.28827 4.89998ZM4.77765 4.89998C4.77765 3.67499 5.77516 2.67748 7.00016 2.67748C8.22515 2.67748 9.22267 3.67499 9.22267 4.89999C9.22267 6.12498 8.22515 7.12246 7.00016 7.12246C5.77516 7.12246 4.77765 6.12498 4.77765 4.89998ZM11.0777 5.53433H10.4389C10.0889 5.53433 9.80452 5.24998 9.80452 4.89998C9.80452 4.54999 10.0889 4.2656 10.4389 4.2656H11.0777C11.4277 4.2656 11.712 4.54999 11.712 4.89998C11.712 5.24998 11.4277 5.53433 11.0777 5.53433Z"
                          fill={sortType === "amount" ? "#FFFFFF" : "#9191A4"}
                        />
                        <path
                          d="M6.99922 5.85384C7.52597 5.85384 7.95297 5.42683 7.95297 4.90009C7.95297 4.37335 7.52597 3.94634 6.99922 3.94634C6.47248 3.94634 6.04547 4.37335 6.04547 4.90009C6.04547 5.42683 6.47248 5.85384 6.99922 5.85384Z"
                          fill="black"
                        />
                        <path
                          d="M6.99922 5.85384C7.52597 5.85384 7.95297 5.42683 7.95297 4.90009C7.95297 4.37335 7.52597 3.94634 6.99922 3.94634C6.47248 3.94634 6.04547 4.37335 6.04547 4.90009C6.04547 5.42683 6.47248 5.85384 6.99922 5.85384Z"
                          fill={sortType === "amount" ? "#FFFFFF" : "#9191A4"}
                        />
                        <path
                          d="M12.9276 9.81842H1.07276C0.722149 9.81842 0.437682 10.1027 0.437682 10.4535C0.437682 10.8043 0.722149 11.0886 1.07276 11.0886H12.9276C13.2782 11.0886 13.5627 10.8043 13.5627 10.4535C13.5627 10.1027 13.2782 9.81842 12.9276 9.81842Z"
                          fill="black"
                        />
                        <path
                          d="M12.9276 9.81842H1.07276C0.722149 9.81842 0.437682 10.1027 0.437682 10.4535C0.437682 10.8043 0.722149 11.0886 1.07276 11.0886H12.9276C13.2782 11.0886 13.5627 10.8043 13.5627 10.4535C13.5627 10.1027 13.2782 9.81842 12.9276 9.81842Z"
                          fill={sortType === "amount" ? "#FFFFFF" : "#9191A4"}
                        />
                        <path
                          d="M12.9276 11.9955H1.07276C0.722149 11.9955 0.437682 12.2797 0.437682 12.6306C0.437682 12.9814 0.722149 13.2656 1.07276 13.2656H12.9276C13.2782 13.2656 13.5627 12.9814 13.5627 12.6306C13.5627 12.2797 13.2782 11.9955 12.9276 11.9955Z"
                          fill="black"
                        />
                        <path
                          d="M12.9276 11.9955H1.07276C0.722149 11.9955 0.437682 12.2797 0.437682 12.6306C0.437682 12.9814 0.722149 13.2656 1.07276 13.2656H12.9276C13.2782 13.2656 13.5627 12.9814 13.5627 12.6306C13.5627 12.2797 13.2782 11.9955 12.9276 11.9955Z"
                          fill={sortType === "amount" ? "#FFFFFF" : "#9191A4"}
                        />
                      </svg>
                    </button>
                  </div>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  isWithAnimation={false}
                  className="px-2 py-0.5"
                >
                  Amount
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <div className="relative z-20 h-full w-full">
                    <button
                      type="button"
                      onClick={() => setSortType("recent")}
                      className={cn(
                        "flex h-full w-[34px] cursor-pointer items-center justify-center rounded-[4px] font-geistMonoSemiBold text-[10px] leading-3 text-fontColorPrimary duration-300 hover:text-[#cccce1] lg:text-xs",
                      )}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="duration-300"
                      >
                        <path
                          d="M7.58306 4.6666V6.75843L8.57881 7.75418C8.63452 7.80799 8.67896 7.87236 8.70953 7.94353C8.7401 8.0147 8.7562 8.09124 8.75687 8.1687C8.75754 8.24615 8.74278 8.32296 8.71345 8.39465C8.68412 8.46634 8.64081 8.53147 8.58604 8.58624C8.53127 8.64101 8.46614 8.68433 8.39445 8.71366C8.32276 8.74299 8.24594 8.75775 8.16849 8.75708C8.09103 8.7564 8.01449 8.74031 7.94332 8.70974C7.87215 8.67917 7.80778 8.63473 7.75397 8.57901L6.58731 7.41235C6.4779 7.30298 6.41642 7.15463 6.41639 6.99993V4.6666C6.41639 4.51189 6.47785 4.36351 6.58724 4.25412C6.69664 4.14472 6.84501 4.08326 6.99972 4.08326C7.15443 4.08326 7.30281 4.14472 7.4122 4.25412C7.5216 4.36351 7.58306 4.51189 7.58306 4.6666ZM7.01489 1.1666C6.25284 1.16756 5.49849 1.31904 4.79515 1.61235C4.09181 1.90566 3.45333 2.33501 2.91639 2.87576V1.74993C2.91639 1.59522 2.85493 1.44685 2.74553 1.33745C2.63614 1.22805 2.48777 1.1666 2.33306 1.1666C2.17835 1.1666 2.02997 1.22805 1.92058 1.33745C1.81118 1.44685 1.74972 1.59522 1.74972 1.74993V4.08326C1.74972 4.23797 1.81118 4.38634 1.92058 4.49574C2.02997 4.60514 2.17835 4.6666 2.33306 4.6666H4.66639C4.8211 4.6666 4.96947 4.60514 5.07887 4.49574C5.18826 4.38634 5.24972 4.23797 5.24972 4.08326C5.24972 3.92855 5.18826 3.78018 5.07887 3.67078C4.96947 3.56139 4.8211 3.49993 4.66639 3.49993H3.94364C4.51038 3.00478 5.18864 2.65431 5.92038 2.4785C6.65213 2.30269 7.41558 2.30678 8.1454 2.49042C8.87522 2.67405 9.54969 3.03177 10.1111 3.53296C10.6725 4.03415 11.1041 4.66389 11.369 5.3683C11.6339 6.0727 11.7242 6.8308 11.6322 7.57772C11.5402 8.32465 11.2686 9.03815 10.8406 9.6572C10.4127 10.2762 9.8411 10.7824 9.17484 11.1323C8.50858 11.4823 7.76746 11.6656 7.01489 11.6666C6.14842 11.6702 5.29855 11.429 4.56314 10.9708C3.82773 10.5126 3.23668 9.85598 2.85806 9.0766C2.82643 9.00455 2.78055 8.93965 2.72318 8.8858C2.66581 8.83195 2.59814 8.79026 2.52425 8.76324C2.45035 8.73622 2.37175 8.72443 2.29317 8.72858C2.2146 8.73273 2.13768 8.75273 2.06704 8.78738C1.9964 8.82203 1.93349 8.87062 1.88212 8.93021C1.83074 8.9898 1.79195 9.05918 1.76809 9.13415C1.74422 9.20913 1.73577 9.28816 1.74324 9.36648C1.75071 9.44481 1.77395 9.52082 1.81156 9.58993C2.28513 10.5659 3.02485 11.3882 3.94546 11.962C4.86607 12.5359 5.93009 12.8379 7.01489 12.8333C8.56199 12.8333 10.0457 12.2187 11.1397 11.1247C12.2336 10.0308 12.8482 8.54703 12.8482 6.99993C12.8482 5.45283 12.2336 3.9691 11.1397 2.87514C10.0457 1.78118 8.56199 1.1666 7.01489 1.1666Z"
                          fill={sortType === "recent" ? "#FFFFFF" : "#9191A4"}
                        />
                      </svg>
                    </button>
                  </div>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  isWithAnimation={false}
                  className="px-2 py-0.5"
                >
                  Recent
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        {/* Arrow Left Holdings */}
        {/* {holdingsDisplayedCount > 3 && ( */}
        {filteredAndSortedTokens && filteredAndSortedTokens.length > 3 && (
          <button
            className="mr-1 flex h-6 w-6 items-center justify-center rounded-lg bg-secondary hover:bg-primary"
            onClick={() => {
              if (!holdingsScrollerRef.current) return;
              handleScroll(holdingsScrollerRef.current, "left");
            }}
            aria-label="Scroll Holdings Left"
            type="button"
          >
            <FaArrowLeft size={14} className="text-white" />
          </button>
        )}
        <div
          className="hide scrollbar-none relative flex h-[24px] flex-grow items-center justify-start overflow-x-auto"
          style={{
            overflowY: "auto",
            scrollbarColor: "#29293d transparent",
            scrollbarWidth: "thin",
          }}
          ref={holdingsScrollerRef}
        >
          {isLoading ? (
            <div className="absolute left-0 top-0 flex h-full w-full items-center gap-x-1">
              {Array.from({
                length: 5,
              })
                ?.slice(0, 10)
                // .slice(0, holdingsItemLimit)
                ?.map((_, index) => (
                  <div
                    key={index}
                    className="group relative flex h-5 w-[200px] flex-shrink-0 animate-pulse items-center justify-center gap-x-1 rounded-[4px] bg-secondary px-2 py-[2.5px]"
                  />
                ))}
            </div>
          ) : (
            <>
              {filteredAndSortedTokens &&
                filteredAndSortedTokens?.length > 0 ? (
                <div className="absolute left-0 top-0 flex h-full w-full items-center gap-x-1">
                  {renderHoldingItems()}
                  {/* {dummyHoldingItems?.map((item, index) => (
                    <HoldingItem key={item.mint + index} {...item} />
                  ))} */}
                </div>
              ) : (
                <div className="absolute left-0 top-0 flex h-full w-full items-center justify-start gap-x-1">
                  <span className="font-geistMonoSemiBold text-[10px] leading-3 text-[#9191A4]">
                    Start making some trades to see your holdings...
                  </span>
                  {/* {dummyHoldingItems?.map((item, index) => (
                    <HoldingItem key={item.mint + index} {...item} />
                  ))} */}
                </div>
              )}
            </>
          )}
        </div>
        {/* Arrow Right Holdings */}
        {/* {holdingsDisplayedCount > 3 && ( */}
        {filteredAndSortedTokens && filteredAndSortedTokens.length > 3 && (
          <button
            className="flex h-6 w-6 items-center justify-center rounded-lg bg-secondary hover:bg-primary"
            onClick={() => {
              if (!holdingsScrollerRef.current) return;
              handleScroll(holdingsScrollerRef.current, "right");
            }}
            aria-label="Scroll Holdings Right"
            type="button"
          >
            <FaArrowRight size={14} className="text-white" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-x-0.5">
        <div className="h-5 w-[1px] bg-border"></div>
        <div className="h-7 w-[1px] bg-border"></div>
        <div className="h-5 w-[1px] bg-border"></div>
      </div>

      <div className="flex w-1/2 items-center gap-x-3">
        <div className="flex items-center">
          {/* <span className="font-geistMonoSemiBold text-[10px] text-fontColorPrimary lg:text-xs">
            Watchlist
          </span> */}
          <svg
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="aspect-square size-[18px]"
          >
            <path
              d="M8.39381 2L8.42649 2.00339C8.85088 2.04741 9.22622 2.30174 9.42266 2.68326L9.42693 2.69156L10.6793 5.2146L13.4758 5.62029C13.9485 5.68812 14.3436 6.01448 14.4999 6.46415L14.5038 6.47536C14.6543 6.93616 14.5243 7.4414 14.1719 7.77294L14.1708 7.774L12.0721 9.76044L12.5712 12.5227C12.6573 13.0012 12.4569 13.4852 12.0599 13.7633C11.67 14.0444 11.1559 14.0764 10.7348 13.8525L8.23285 12.5475L8.19586 12.5475L5.72621 13.8414C5.48428 13.963 5.20932 14.0063 4.93945 13.963L4.93072 13.9616L4.92202 13.96C4.24895 13.8326 3.8004 13.1917 3.91058 12.5159L3.91235 12.505L4.4129 9.73845L2.37882 7.7669C2.03225 7.43065 1.91014 6.92424 2.06816 6.46657C2.21994 6.02103 2.60578 5.69505 3.07228 5.62163L3.07984 5.62044L5.89924 5.21147L5.90785 5.21059L7.14364 2.67694L7.1474 2.66969C7.20598 2.55704 7.28405 2.4483 7.38331 2.35272L7.40747 2.32945L7.45162 2.29511C7.51184 2.23707 7.57727 2.18851 7.6456 2.14865L7.69411 2.12035L7.79678 2.08267L7.99756 2H8.39381Z"
              fill="#FCBE78"
            />
          </svg>
        </div>
        {/* Arrow Left Watchlist */}
        {/* {watchlistDisplayedCount > 3 && ( */}
        {watchlistTokenMints && watchlistTokenMints?.length > 3 && (
          <button
            className="mr-1 flex h-6 w-6 items-center justify-center rounded-lg bg-secondary hover:bg-primary"
            onClick={() => {
              if (!watchlistScrollerRef.current) return;
              handleScroll(watchlistScrollerRef.current, "left");
            }}
            aria-label="Scroll Watchlist Left"
            type="button"
          >
            <FaArrowLeft size={14} className="text-white" />
          </button>
        )}
        <div
          className="nova-scroller hide scrollbar-none relative flex h-[24px] flex-grow items-center justify-start overflow-x-auto"
          ref={watchlistScrollerRef}
        >
          {isLoading ? (
            <div className="absolute left-0 top-0 flex h-full w-full items-center gap-x-1">
              {Array.from({ length: 5 })
                ?.slice(0, 10)
                //.slice(0, watchlistItemLimit)
                ?.map((_, index) => (
                  <div
                    key={index}
                    className="group relative flex h-5 w-[180px] flex-shrink-0 animate-pulse items-center justify-center gap-x-1 rounded-[4px] bg-secondary px-2 py-[2.5px]"
                  />
                ))}
            </div>
          ) : (
            <>
              {watchlistTokenMints && watchlistTokenMints?.length > 0 ? (
                <div className="absolute left-0 top-0 flex h-full w-full items-center gap-x-1">
                  {renderWatchlistItems()}
                  {/* {dummyWatchlistItems?.map((item) => (
                    <WatchlistItem key={item.mint} {...item} />
                  ))} */}
                </div>
              ) : (
                <div className="absolute left-0 top-0 flex h-full w-full items-center justify-start gap-x-1">
                  <span className="font-geistMonoSemiBold text-[10px] leading-3 text-[#9191A4]">
                    No watch list at the moment...
                  </span>
                  {/* {dummyWatchlistItems?.map((item) => (
                    <WatchlistItem key={item.mint} {...item} />
                  ))} */}
                </div>
              )}
            </>
          )}
        </div>
        {/* Arrow Right Watchlist */}
        {/* {watchlistDisplayedCount > 3 && ( */}
        {watchlistTokenMints && watchlistTokenMints?.length > 3 && (
          <button
            className="flex h-6 w-6 items-center justify-center rounded-lg bg-secondary hover:bg-primary"
            onClick={() => {
              if (!watchlistScrollerRef.current) return;
              handleScroll(watchlistScrollerRef.current, "right");
            }}
            aria-label="Scroll Watchlist Right"
            type="button"
          >
            <FaArrowRight size={14} className="text-white" />
          </button>
        )}
      </div>

      {/* <span className="absolute right-0 top-0 z-50 block h-full w-[10%] bg-gradient-to-r from-black/0 to-secondary"></span> */}
    </div>
  );
}
