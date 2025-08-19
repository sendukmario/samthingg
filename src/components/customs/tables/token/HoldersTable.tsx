"use client";

// ######## Libraries 📦 & Hooks 🪝 ########
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useTokenMessageStore } from "@/stores/token/use-token-messages.store";
import { useTokenCardsFilter } from "@/stores/token/use-token-cards-filter.store";
import { useQuery } from "@tanstack/react-query";
import { useTokenHoldingStore } from "@/stores/token/use-token-holding.store";
import { useWindowSizeStore } from "@/stores/use-window-size.store";
import { useCurrentTokenChartPriceStore } from "@/stores/token/use-current-token-chart-price.store";
import { useCustomizeTheme } from "@/hooks/use-customize-theme";
import { usePopupStore } from "@/stores/use-popup-state.store";
import { useDeviceAndBrowserForScrollbarStore } from "@/stores/use-device-and-browser-for-scrollbar-state.store";
import { useBubbleMapsPanelStore } from "@/stores/use-bubblemaps-panel.store";
import { useCurrentTokenFollowedHoldersStore } from "@/stores/token/use-current-token-followed-holders.store";
// ######## APIs 🛜 ########
import { getHolders } from "@/apis/rest/holders";
// ######## Components 🧩 ########
import Image from "next/image";
import HoldersCard from "@/components/customs/cards/token/HoldersCard";
import HeadCol from "@/components/customs/tables/HeadCol";
import SortButton, { SortCoinButton } from "@/components/customs/SortButton";
import {
  TokenHeaderLoading,
  TokenCardLoading,
} from "@/components/customs/loadings/TokenCardLoading";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import MyPositionCard from "@/components/customs/cards/token/MyPositionCard";
import BadgeWithTooltip from "@/components/customs/BadgeWithTooltip";
import { FixedSizeList } from "react-window";
import { Resizable } from "re-resizable";
import { BubbleMaps } from "@/components/customs/token/BubbleMaps";
import AvatarWithBadges from "@/components/customs/AvatarWithBadges";
// ######## Utils & Helpers 🤝 ########
import { cn } from "@/libraries/utils";
import {
  formatAmount,
  formatAmountWithoutLeadingZero,
} from "@/utils/formatAmount";
import { useWalletTrackerMessageStore } from "@/stores/footer/use-wallet-tracker-message.store";
import { convertHoldersLamports } from "@/utils/lamportsConverter";
import { ChartHolderInfo } from "@/types/ws-general";

function HoldersTable() {
  const params = useParams();
  const tokenData = useTokenMessageStore((state) => state.tokenInfoMessage);
  const bondingCurveProgress = useTokenMessageStore(
    (state) => state.priceMessage?.migration?.progress,
  );
  const holdingsMessages = useTokenHoldingStore((state) => state.messages);
  const mintAddress = params?.["mint-address"];
  const calculateMyHoldings = () => {
    let total = 0;
    holdingsMessages?.forEach((message) => {
      const holdToken = (message?.tokens || [])?.find(
        (token) => token.token.mint === mintAddress,
      );
      if (holdToken) {
        total += (holdToken.balance / (holdToken?.token?.supply ?? 0)) * 100;
      }
    });
    return String(total);
  };

  const { remainingScreenWidth } = usePopupStore();
  const priceMessage = useTokenMessageStore((state) => state.priceMessage);
  const initialTokenPriceSol =
    priceMessage?.price_sol || priceMessage?.price_base || 0;

  const currentGlobalChartPrice = useCurrentTokenChartPriceStore(
    (state) => state.price,
  );

  const finalPrice =
    (currentGlobalChartPrice === "" || !currentGlobalChartPrice) &&
    !isNaN(Number(initialTokenPriceSol))
      ? initialTokenPriceSol
      : currentGlobalChartPrice;

  const calculateProfitAndLossPercentage = () => {
    let totalPnl = 0;
    let totalInvested = 0;

    holdingsMessages?.forEach((message) => {
      const holdToken = (message?.tokens || [])?.find(
        (token) => token.token.mint === mintAddress,
      );
      if (holdToken) {
        const prevCalc =
          holdToken?.sold_base + holdToken?.balance * Number(finalPrice);
        const pnlSol = prevCalc - holdToken?.invested_base;
        totalPnl += pnlSol ?? 0;
        totalInvested += holdToken?.invested_base ?? 0;
      }
    });

    return totalInvested ? String((totalPnl / totalInvested) * 100) : "0";
  };
  const profitAndLossPercentage = calculateProfitAndLossPercentage();

  // List height measurement
  const listRef = useRef<HTMLDivElement>(null);
  const flexContainerRef = useRef<HTMLDivElement>(null);
  const [listHeight, setListHeight] = useState(0);

  const isOldToken =
    useTokenMessageStore((state) => state.tokenInfoMessage?.isOld) || false;

  const {
    holdersBought,
    setHoldersBought,
    holdersSold,
    setHoldersSold,
    holdersRemaining,
    setHoldersRemaining,
  } = useTokenCardsFilter();
  const [selectedHoldersFilter, setSelectedHoldersFilter] = useState<
    | "All Holders"
    | "Insider Holding"
    | "Sniper Holding"
    | "Top 10 Holders"
    | "My Holdings"
    | "Following"
  >("All Holders");

  const securityMessages = useTokenMessageStore(
    (state) => state.dataSecurityMessage,
  );
  const followingPercentage = useTokenMessageStore(
    (state) => state.followingPercentage,
  );
  const totalHolder = useTokenMessageStore(
    (state) => state.totalHolderMessages,
  );

  const filterMap = {
    "All Holders": "all",
    "Insider Holding": "insiders",
    "Sniper Holding": "snipers",
    "Top 10 Holders": "top10",
    "My Holdings": "myHoldings",
    Following: "following",
  };

  const [offset, setOffset] = useState(0);
  const [allHolders, setAllHolders] = useState<ChartHolderInfo[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [savedScrollPosition, setSavedScrollPosition] = useState(0);
  const fixedListRef = useRef<FixedSizeList>(null);

  const { data: filteredHolders, isLoading } = useQuery({
    queryKey: ["chart_holders", selectedHoldersFilter, offset],
    queryFn: () =>
      getHolders({
        mint: (params?.["mint-address"] || params?.["pool-address"]) as string,
        filter: filterMap[selectedHoldersFilter] as
          | "all"
          | "top10"
          | "insiders"
          | "snipers"
          | "myHoldings"
          | "following",
        limit: selectedHoldersFilter === "All Holders" ? 50 : 50,
        offset: selectedHoldersFilter === "All Holders" ? offset : 0,
      }),
    enabled: selectedHoldersFilter !== "My Holdings",
  });

  console.warn("🔑 Holdings Messages", { filteredHolders })

  // Get total holders from the store
  const totalHolders = useTokenMessageStore((state) => state.totalHolderMessages) || 0;

  // Handle loading more holders for "All Holders" filter
  useEffect(() => {
    if (selectedHoldersFilter === "All Holders") {
      if (filteredHolders && filteredHolders.length > 0) {
        if (offset === 0) {
          // First load, replace all holders
          setAllHolders(filteredHolders);
        } else {
          // Append new holders
          setAllHolders(prev => [...prev, ...filteredHolders]);
        }
        
        // Check if we have more to load
        const currentTotal = offset + filteredHolders.length;
        setHasMore(currentTotal < totalHolders);
      } else {
        setHasMore(false);
      }
      setIsLoadingMore(false);
    } else {
      // Reset for other filters
      setAllHolders([]);
      setOffset(0);
      setHasMore(true);
      setSavedScrollPosition(0);
    }
  }, [filteredHolders, selectedHoldersFilter, offset, totalHolders]);

  // Separate effect to handle scroll restoration
  useEffect(() => {
    if (isLoadingMore && savedScrollPosition > 0 && selectedHoldersFilter === "All Holders") {
      const timer = setTimeout(() => {
        if (fixedListRef.current) {
          fixedListRef.current.scrollTo(savedScrollPosition);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isLoadingMore, savedScrollPosition, selectedHoldersFilter]);

  // Reset when filter changes
  useEffect(() => {
    setAllHolders([]);
    setOffset(0);
    setHasMore(true);
  }, [selectedHoldersFilter]);

  const loadMore = useCallback(() => {
    if (selectedHoldersFilter === "All Holders" && hasMore && !isLoadingMore) {
      setIsLoadingMore(true);
      setOffset(prev => prev + 50);
    }
  }, [selectedHoldersFilter, hasMore, isLoadingMore]);

  // Use allHolders for "All Holders" filter, otherwise use filteredHolders
  const displayHolders = selectedHoldersFilter === "All Holders" ? allHolders : (filteredHolders || []);
  const messageCount = useTokenHoldingStore((state) => state.messageCount);
  const filteredHoldings = useMemo(() => {
    return (holdingsMessages || [])?.flatMap((holding) =>
      (holding.tokens || [])
        ?.filter((t: any) => t.token.mint === mintAddress)
        ?.map((token) => ({
          wallet: holding.wallet,
          token,
        })),
    );
  }, [messageCount, mintAddress]);

  const followedHolders = useCurrentTokenFollowedHoldersStore(
    (state) => state.followedHolders,
  );
  const followingTotalCount = useCurrentTokenFollowedHoldersStore(
    (state) => state.totalCount,
  );
  const trackedWallets = useWalletTrackerMessageStore(
    (state) => state.trackedWallets,
  );

  const displayedHolders = useMemo(() => {
    if (!displayHolders || displayHolders?.length === 0) return [];

    if (selectedHoldersFilter === "Following") {
      const trackedAddresses = new Set(trackedWallets.map((tw) => tw.address));

      if (!followedHolders || followedHolders?.length === 0)
        return displayHolders.filter((holder) =>
          trackedAddresses.has(holder.maker),
        );
      return followedHolders.filter((holder) =>
        trackedAddresses.has(holder.maker),
      );
    }

    return displayHolders.map((holder) =>
      convertHoldersLamports({
        holder,
        decimals: {
          base_decimals: tokenData?.base_decimals,
          quote_decimals: tokenData?.quote_decimals,
        },
      }),
    );
  }, [filteredHolders, followedHolders, selectedHoldersFilter, tokenData]);

  const defaultHeaderData = useMemo(() => {
    return [
      {
        label: "Rank",
        tooltipContent: "The rank taking in account the amount of holdings",
        className: "w-[72px] flex-shrink-0 min-w-[72px] justify-center",
      },
      {
        label: "Wallet",
        tooltipContent: "The wallet of the holder",
        className: "min-w-[165px]",
      },
      {
        label: "Bought",
        sortButton: (
          <SortButton
            type="usdc-or-sol"
            value={holdersBought}
            setValue={setHoldersBought}
          />
        ),
        tooltipContent: "The value (SOL/USD) and amount of tokens bought",
        className:
          remainingScreenWidth > 1650
            ? "min-w-[180px]"
            : remainingScreenWidth > 1480
              ? "min-w-[140px]"
              : "min-w-[120px]",
      },
      {
        label: "Sold",
        tooltipContent: "The value (SOL/USD) and amount of tokens sold",
        className:
          remainingScreenWidth > 1650
            ? "min-w-[180px]"
            : remainingScreenWidth > 1480
              ? "min-w-[140px]"
              : "min-w-[120px]",
        sortButton: (
          <SortButton
            type="usdc-or-sol"
            value={holdersSold}
            setValue={setHoldersSold}
          />
        ),
      },
      {
        label: "% Owned",
        className:
          remainingScreenWidth > 1650
            ? "min-w-[180px]"
            : remainingScreenWidth > 1480
              ? "min-w-[140px]"
              : remainingScreenWidth > 1350
                ? "min-w-[130px]"
                : "min-w-[80px]",
      },
      {
        label: "Balance",
        tooltipContent: "Current token balance held",
        className:
          remainingScreenWidth > 1650
            ? "min-w-[180px]"
            : remainingScreenWidth > 1480
              ? "min-w-[140px]"
              : "min-w-[120px]",
      },
      {
        label: "Remaining",
        tooltipContent:
          "The amount of supply remaining, taking into account the purchase amount",
        className:
          remainingScreenWidth > 1650 ? "min-w-[150px]" : "min-w-[120px]",
        sortButton: (
          <SortCoinButton
            value={holdersRemaining}
            setValue={setHoldersRemaining}
            tokenImage={
              tokenData?.image ? (tokenData?.image as string) : "/logo.png"
            }
          />
        ),
      },
    ];
  }, [remainingScreenWidth]);

  const myHoldingsHeaderData = useMemo(() => {
    return [
      {
        label: "Token",
        tooltipContent: "The token name, ticker and address.",
        className: "min-w-[220px]",
      },
      {
        label: "Wallet name",
        tooltipContent:
          "The wallet which the position is under, including the wallet address.",
        className: "min-w-[145px]",
      },
      {
        label: "Invested",
        tooltipContent: "The amount of SOL/USD invested into the token.",
        className: "min-w-[170px]",
      },
      {
        label: "Remaining",
        tooltipContent: "The amount of SOL/USD remaining in the token.",
        className: "min-w-[145px]",
      },
      {
        label: "Sold",
        tooltipContent: "The amount of SOL/USD sold from the invested amount.",
        className: "min-w-[145px]",
      },
      {
        label: "P&L",
        tooltipContent: "The profit/loss percentage as well as the SOL value.",
        className: "min-w-[145px]",
      },
      {
        label: "Actions",
        tooltipContent: "Action buttons which include sharing the PNL image.",
        className: "min-w-[145px]",
      },
    ];
  }, [remainingScreenWidth]);

  const HeaderData =
    selectedHoldersFilter === "My Holdings"
      ? myHoldingsHeaderData
      : defaultHeaderData;

  // Effect to update list height
  useEffect(() => {
    const updateHeight = () => {
      if (listRef.current) {
        setListHeight(
          window.innerWidth >= 1280
            ? listRef.current.clientHeight - 40
            : window.innerHeight - 180,
        );
      }
    };
    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  const isAppleEnvirontment = useDeviceAndBrowserForScrollbarStore(
    (state) => state.isAppleEnvirontment,
  );
  const isBrowserWithoutScrollbar = useDeviceAndBrowserForScrollbarStore(
    (state) => state.isBrowserWithoutScrollbar,
  );

  const Row = useCallback(({ index, style, data }: any) => {
    const { items } = data;
    const trader = items[index];
    if (!trader) return null;

    return (
      <div style={style} key={trader.maker}>
        <HoldersCard
          key={trader.maker}
          rank={index + 1}
          holder={trader}
          tokenData={tokenData}
        />
      </div>
    );
  }, []);

  const width = useWindowSizeStore((state) => state.width);
  // Theme
  const theme = useCustomizeTheme();

  const selectedBubbleMapVariant = useBubbleMapsPanelStore(
    (state) => state.selectedVariant,
  );
  const setSelectedBubbleMapVariant = useBubbleMapsPanelStore(
    (state) => state.setSelectedVariant,
  );
  const bubbleMapsWidth = useBubbleMapsPanelStore((state) => state.width);
  const setBubbleMapsWidth = useBubbleMapsPanelStore((state) => state.setWidth);
  const showBubbleMaps = useBubbleMapsPanelStore((state) => state.isOpen);
  const setShowBubbleMaps = useBubbleMapsPanelStore((state) => state.setOpen);
  const handleResize = (_e: any, _direction: any, ref: HTMLElement) => {
    setBubbleMapsWidth(ref.offsetWidth);
  };

  return (
    <div className="relative flex h-full w-full flex-grow flex-row">
      {/* LEFT: Filters + List */}
      <div className="relative flex h-full min-w-0 flex-1 flex-col overflow-x-hidden">
        {/* BubbleMap Toggle Button at top right of left panel */}
        <div
          className={cn(
            "absolute right-0 top-12 z-50",
            remainingScreenWidth < 1280 ? "hidden" : "block",
          )}
        >
          <div className="group flex items-center">
            {showBubbleMaps ? (
              <button
                onClick={() => setShowBubbleMaps(false)}
                className="flex h-8 w-6 items-center justify-center rounded-l-md border border-r-0 border-border bg-shadeTable p-0 shadow transition hover:bg-shadeTableHover"
                aria-label="Hide bubble map"
                type="button"
              >
                <svg
                  width="20"
                  height="20"
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M7 4l6 6-6 6" />
                </svg>
              </button>
            ) : (
              <button
                onClick={() => setShowBubbleMaps(true)}
                className="flex items-center justify-center rounded-l-md border border-r-0 border-border bg-shadeTable px-1 py-1.5 shadow transition hover:bg-shadeTableHover"
                aria-label="Show bubble map"
                type="button"
              >
                <Image
                  src="/icons/token/tabs/active-bubblemaps.png"
                  alt="Show bubble map"
                  width={20}
                  height={20}
                  className="object-contain"
                />
              </button>
            )}
            <div className="pointer-events-none absolute left-full top-1/2 z-[9999] ml-2 -translate-y-1/2 whitespace-nowrap rounded bg-black px-2 py-1 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
              <div className="font-semibold">
                {showBubbleMaps ? "Hide bubble map" : "Show bubble map"}
              </div>
              <div className="opacity-70">
                {showBubbleMaps
                  ? "collapse bubble map panel"
                  : "expand bubble map panel"}
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        {width! < 1280 && (
          <TooltipProvider>
            <div
              className={cn(
                "grid w-full grid-cols-2 items-center gap-2 border-border px-4 py-3 xl:border-b",
                // isOldToken ? "xl:grid-cols-2" : "xl:grid-cols-5",
                // remainingScreenWidth > 1280 && "xl:grid-cols-2",
              )}
            >
              <BoxWithTooltip
                selectedHoldersFilter={selectedHoldersFilter}
                setSelectedHoldersFilter={setSelectedHoldersFilter}
                filterName="All Holders"
                badgeSrc="/icons/token/tabs/inactive-holders.png"
                tooltipText="All Holders"
                displayValue={selectedHoldersFilter === "All Holders" ? totalHolders : (filteredHolders ? filteredHolders.length : 0)}
              />
              <BoxWithTooltip
                selectedHoldersFilter={selectedHoldersFilter}
                setSelectedHoldersFilter={setSelectedHoldersFilter}
                filterName="Top 10 Holders"
                badgeSrc="/images/badges/top-10-holders.svg"
                tooltipText="Top 10 Holders"
                displayValue={`${formatAmount(securityMessages?.top10_holding)}%`}
              />
              {!isOldToken && (
                <>
                  <BoxWithTooltip
                    selectedHoldersFilter={selectedHoldersFilter}
                    setSelectedHoldersFilter={setSelectedHoldersFilter}
                    filterName="Sniper Holding"
                    badgeSrc="/images/badges/sniper-holding.svg"
                    tooltipText="Sniper Holding"
                    displayValue={`${formatAmount(securityMessages?.sniper_holding)}%`}
                  />
                  <BoxWithTooltip
                    selectedHoldersFilter={selectedHoldersFilter}
                    setSelectedHoldersFilter={setSelectedHoldersFilter}
                    filterName="Insider Holding"
                    badgeSrc="/images/badges/insider-holding.svg"
                    tooltipText="Insider Holding"
                    displayValue={`${formatAmount(securityMessages?.insider_holding)}%`}
                  />
                </>
              )}
              <BoxWithTooltip
                selectedHoldersFilter={selectedHoldersFilter}
                setSelectedHoldersFilter={setSelectedHoldersFilter}
                filterName="Following"
                badgeSrc="/images/badges/following.svg"
                tooltipText="Following"
                displayValue={"-"}
              />
              <BoxWithTooltip
                selectedHoldersFilter={selectedHoldersFilter}
                setSelectedHoldersFilter={setSelectedHoldersFilter}
                filterName="My Holdings"
                badgeSrc="/images/badges/my-holding.svg"
                tooltipText="My Holdings"
                displayValue={`${formatAmountWithoutLeadingZero(
                  Number(calculateMyHoldings()),
                  2,
                )}%`}
              />
            </div>
          </TooltipProvider>
        )}

        {/* List */}
        <div className="relative flex w-full flex-grow">
          {width! >= 1280 && (
            <div className="flex flex-shrink-0 flex-col gap-3 p-4 text-white">
              <BadgeWithTooltip
                badgeSrc="/icons/token/tabs/inactive-holders.png"
                alt="All holders"
                label="All Holders"
                value={selectedHoldersFilter === "All Holders" ? totalHolders : (filteredHolders ? filteredHolders.length : 0)}
                onClick={() => setSelectedHoldersFilter("All Holders")}
                isSelected={selectedHoldersFilter === "All Holders"}
              />
              <BadgeWithTooltip
                badgeSrc="/images/badges/top-10-holders.svg"
                alt="Top 10 holders"
                label="Top 10 Holders"
                value={`${formatAmount(securityMessages?.top10_holding)}%`}
                onClick={() => setSelectedHoldersFilter("Top 10 Holders")}
                isSelected={selectedHoldersFilter === "Top 10 Holders"}
              />
              {!isOldToken && (
                <>
                  <BadgeWithTooltip
                    badgeSrc="/images/badges/sniper-holding.svg"
                    alt="Sniper holding"
                    label="Sniper Holding"
                    value={`${formatAmount(securityMessages?.sniper_holding)}%`}
                    onClick={() => setSelectedHoldersFilter("Sniper Holding")}
                    isSelected={selectedHoldersFilter === "Sniper Holding"}
                  />
                  <BadgeWithTooltip
                    badgeSrc="/images/badges/insider-holding.svg"
                    alt="Insider holding"
                    label="Insider Holding"
                    value={`${formatAmount(securityMessages?.insider_holding)}%`}
                    onClick={() => setSelectedHoldersFilter("Insider Holding")}
                    isSelected={selectedHoldersFilter === "Insider Holding"}
                  />
                </>
              )}
              <BadgeWithTooltip
                badgeSrc="/images/badges/following.svg"
                alt="Following"
                label="Following"
                value={followedHolders ? followedHolders?.length : 0}
                onClick={() => setSelectedHoldersFilter("Following")}
                isSelected={selectedHoldersFilter === "Following"}
              />
              <BadgeWithTooltip
                badgeSrc="/images/badges/my-holding.svg"
                alt="My holdings"
                label="My Holdings"
                value={`${formatAmountWithoutLeadingZero(
                  Number(calculateMyHoldings()),
                  2,
                )}%`}
                onClick={() => setSelectedHoldersFilter("My Holdings")}
                isSelected={selectedHoldersFilter === "My Holdings"}
              />
            </div>
          )}
          <div
            className="relative flex h-full w-0 min-w-0 flex-1 flex-col"
            ref={listRef}
          >
            <div
              className={cn(
                "sticky top-0 z-[9] hidden h-[40px] w-full flex-shrink-0 items-center border-b border-border bg-background xl:flex",
                isLoading
                  ? "pr-0"
                  : selectedHoldersFilter === "Top 10 Holders"
                    ? "pr-6"
                    : displayedHolders && displayedHolders?.length > 15
                      ? isAppleEnvirontment || isBrowserWithoutScrollbar
                        ? "pr-6"
                        : "pr-9"
                      : "pr-6",
                remainingScreenWidth < 1280 && "xl:hidden",
                selectedHoldersFilter === "My Holdings" && "pl-4 pr-4",
              )}
              style={theme.background2}
            >
              {isLoading && selectedHoldersFilter !== "All Holders" && selectedHoldersFilter !== "Top 10 Holders" ? (
                <TokenHeaderLoading />
              ) : (
                (HeaderData || [])?.map((item, index) => (
                  <HeadCol isWithBorder={false} key={index} {...item} />
                ))
              )}
            </div>
            <div
              className={cn(
                "flex h-[calc(100dvh_-_320px)] w-full flex-grow flex-col max-md:p-3 sm:h-fit md:h-full",
                remainingScreenWidth <= 768 && "max-md:p-0 md:h-fit",
              )}
            >
              {selectedHoldersFilter === "My Holdings" ? (
                (filteredHoldings || [])?.length > 0 ? (
                  filteredHoldings?.map(({ wallet, token }) => (
                    <MyPositionCard
                      key={`${wallet}-${token.token.mint}`}
                      wallet={wallet}
                      tokenData={token}
                    />
                  ))
                ) : (
                  <div className="flex w-full items-center justify-center gap-x-2 p-10 px-3">
                    <span className="text-sm text-fontColorPrimary">
                      You have no holdings for this token.
                    </span>
                  </div>
                )
              ) : (
                <>
                  {isLoading && selectedHoldersFilter !== "All Holders" ? (
                    Array.from({ length: 30 })?.map((_, index) => (
                      <TokenCardLoading key={index} />
                    ))
                  ) : !displayedHolders ||
                    (displayedHolders || [])?.length === 0 ? (
                    <div className="flex w-full items-center justify-center gap-x-2 p-10 px-3">
                      {selectedHoldersFilter === "All Holders" && (
                        <span className="text-sm text-fontColorPrimary">
                          There are no holders for this token.
                        </span>
                      )}
                      {selectedHoldersFilter === "Top 10 Holders" && (
                        <span className="text-sm text-fontColorPrimary">
                          There are no Top 10 Holding this token.
                        </span>
                      )}
                      {selectedHoldersFilter === "Sniper Holding" && (
                        <span className="text-sm text-fontColorPrimary">
                          There are no Snipers Holding this token.
                        </span>
                      )}
                      {selectedHoldersFilter === "Insider Holding" && (
                        <span className="text-sm text-fontColorPrimary">
                          There are no Insider Holding this token.
                        </span>
                      )}
                      {selectedHoldersFilter === "Following" && (
                        <span className="text-sm text-fontColorPrimary">
                          There are no Following this token.
                        </span>
                      )}
                    </div>
                  ) : (
                    <>
                      <FixedSizeList
                        ref={fixedListRef}
                        style={{
                          overflowX: "hidden",
                        }}
                        className="nova-scroller"
                        height={listHeight || 400}
                        width="100%"
                        itemCount={(displayedHolders || [])?.length}
                        itemSize={remainingScreenWidth >= 1280 ? 46 : 156}
                        itemData={{
                          items: displayedHolders,
                        }}
                        onScroll={({ scrollOffset: currentScrollOffset, scrollUpdateWasRequested }) => {
                          // Save scroll position for "All Holders" filter
                          if (selectedHoldersFilter === "All Holders") {
                            setSavedScrollPosition(currentScrollOffset);
                          }
                          
                          if (!scrollUpdateWasRequested && selectedHoldersFilter === "All Holders") {
                            const maxScrollOffset = (displayedHolders?.length || 0) * (remainingScreenWidth >= 1280 ? 46 : 156) - (listHeight || 400);
                            if (currentScrollOffset >= maxScrollOffset - 100 && hasMore && !isLoadingMore) {
                              loadMore();
                            }
                          }
                        }}
                      >
                        {Row}
                      </FixedSizeList>
                      {selectedHoldersFilter === "All Holders" && !hasMore && displayedHolders?.length > 0 && (
                        <div className="flex w-full items-center justify-center p-4">
                          <div className="text-sm text-fontColorSecondary">All {totalHolders} holders loaded</div>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT: BubbleMaps */}
      {showBubbleMaps && (
        <Resizable
          size={{ width: bubbleMapsWidth, height: "100%" }}
          minWidth={250}
          maxWidth={600}
          enable={{
            top: false,
            right: true,
            bottom: false,
            left: true,
            topRight: false,
            bottomRight: false,
            bottomLeft: false,
            topLeft: false,
          }}
          onResize={handleResize}
          className={cn(
            "flex h-full flex-shrink-0 border-l border-border bg-background",
            remainingScreenWidth < 1280 ? "hidden" : "block",
          )}
        >
          <div className="flex h-10 w-full gap-x-1 border-b border-border bg-card px-4 py-2">
            <button
              onClick={() => setSelectedBubbleMapVariant("BubbleMapsIO")}
              className={cn(
                "rounded-full px-2 py-0.5 text-sm text-white/50 duration-300 hover:bg-white/10 hover:text-white/80",
                selectedBubbleMapVariant === "BubbleMapsIO" &&
                  "bg-white/5 hover:bg-white/[12.5%]",
              )}
            >
              Bubblemaps.io
            </button>
            <button
              onClick={() => setSelectedBubbleMapVariant("CabalSpy")}
              className={cn(
                "rounded-full px-2 py-0.5 text-sm text-white/50 duration-300 hover:bg-white/10 hover:text-white/80",
                selectedBubbleMapVariant === "CabalSpy" &&
                  "bg-white/5 hover:bg-white/[12.5%]",
              )}
            >
              CabalSpy
            </button>
            {/* <button
              onClick={() => setSelectedBubbleMapVariant("InsightX")}
              className={cn(
                "rounded-full px-2 py-0.5 text-sm text-white/50 duration-300 hover:bg-white/10 hover:text-white/80",
                selectedBubbleMapVariant === "InsightX" &&
                  "bg-white/5 hover:bg-white/[12.5%]",
              )}
            >
              InsightX
            </button> */}
          </div>
          <div className="relative h-[calc(100%_-_40px)] w-full flex-grow">
            <BubbleMaps variant={selectedBubbleMapVariant} />
            {/* {bondingCurveProgress >= 100 ? (
              <BubbleMaps variant={selectedBubbleMapVariant} />
            ) : (
              <div className="absolute flex h-full w-full items-center justify-center">
                <div className="flex w-full max-w-[230px] flex-col items-center gap-y-3.5">
                  <AvatarWithBadges
                    src={tokenData?.image}
                    alt={`${tokenData?.symbol} Image`}
                    size="lg"
                    className="size-20"
                  />
                  <div className="flex flex-col items-center justify-center gap-y-0 text-center">
                    <h2 className="font-geistSemiBold text-[20px] text-fontColorPrimary">
                      {tokenData?.symbol}
                    </h2>
                    <p className="text-sm leading-[18px] text-[#737384]">
                      Token progress is{" "}
                      <span className="text-primary">
                        {Math.min(
                          Math.max(bondingCurveProgress, 0),
                          100,
                        ).toFixed(0)}
                        %
                      </span>{" "}
                      which is still on prebond phase
                    </p>
                  </div>
                </div>
              </div>
            )} */}
          </div>
        </Resizable>
      )}
    </div>
  );
}
// Start of Selection
const BoxWithTooltip = ({
  selectedHoldersFilter,
  setSelectedHoldersFilter,
  filterName,
  badgeSrc,
  tooltipText,
  displayValue,
}: {
  selectedHoldersFilter:
    | "All Holders"
    | "Insider Holding"
    | "Sniper Holding"
    | "Top 10 Holders"
    | "My Holdings"
    | "Following";
  setSelectedHoldersFilter: (
    filter:
      | "All Holders"
      | "Insider Holding"
      | "Sniper Holding"
      | "Top 10 Holders"
      | "My Holdings"
      | "Following",
  ) => void;
  filterName:
    | "All Holders"
    | "Insider Holding"
    | "Sniper Holding"
    | "Top 10 Holders"
    | "My Holdings"
    | "Following";
  badgeSrc: string;
  tooltipText: string;
  displayValue: string | number;
}) => {
  return (
    <Tooltip>
      <TooltipTrigger className="flex-1">
        <div
          onClick={() => setSelectedHoldersFilter(filterName)}
          className={cn(
            "col-span-1 flex w-full cursor-pointer items-center justify-between gap-x-2 overflow-hidden rounded-[8px] border border-border bg-transparent px-3 py-2 duration-300",
            selectedHoldersFilter === filterName &&
              "border-[#DF74FF] bg-[#DF74FF]/[16%]",
          )}
        >
          <div className="flex w-full gap-2">
            <div className="relative aspect-square size-9 flex-shrink-0">
              <Image
                src={badgeSrc}
                alt={`${filterName} Badge`}
                fill
                quality={100}
                className="object-contain"
              />
            </div>
            <div className="grid text-left">
              <span className="inline-block text-nowrap text-xs leading-4 text-fontColorSecondary">
                {filterName}
              </span>
              <span className="inline-block text-nowrap font-geistBold text-sm text-fontColorPrimary">
                {typeof displayValue === "number"
                  ? displayValue.toLocaleString()
                  : displayValue}
              </span>
            </div>
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent align="start" sideOffset={5}>
        <span className="inline-block text-nowrap text-center text-xs leading-4 text-white">
          {tooltipText}
        </span>
      </TooltipContent>
    </Tooltip>
  );
};
export default memo(HoldersTable);
