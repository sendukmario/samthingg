"use client";

// ######## Libraries 📦 & Hooks 🪝 ########
import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import { useTradesTableSettingStore } from "@/stores/table/token/use-trades-table-setting.store";
import { useOpenInstantTrade } from "@/stores/token/use-open-instant-trade.store";
import { useTokenActiveTabStore } from "@/stores/use-token-active-tab.store";
import { useWalletFilterStore } from "@/stores/use-wallet-filter.store";
import { useTradesPanelStore } from "@/stores/token/use-trades-panel.store";
import { AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";

// ######## Components 🧩 ########
import BaseButton from "@/components/customs/buttons/BaseButton";
const PanelPopUp = dynamic(
  () => import("@/components/customs/popups/token/PanelPopup/PanelPopup"),
  {
    ssr: false,
  },
);
// import PanelPopUp from "@/components/customs/popups/token/PanelPopup/PanelPopup";
const DevTokensTable = dynamic(
  () => import("@/components/customs/tables/token/DevTokensTable"),
  {
    ssr: false,
  },
);
// import DevTokensTable from "@/components/customs/tables/token/DevTokensTable";
const HoldersTable = dynamic(
  () => import("@/components/customs/tables/token/HoldersTable"),
  {
    ssr: false,
  },
);
// import HoldersTable from "@/components/customs/tables/token/HoldersTable";
const MyPositionTable = dynamic(
  () => import("@/components/customs/tables/token/MyPositionTable"),
  {
    ssr: false,
  },
);
// import MyPositionTable from "@/components/customs/tables/token/MyPositionTable";
const TopTradersTable = dynamic(
  () => import("@/components/customs/tables/token/TopTradersTable"),
  {
    ssr: false,
  },
);
// import TopTradersTable from "@/components/customs/tables/token/TopTradersTable";
// const TradesTable = dynamic(
//   () => import("@/components/customs/tables/token/Trades/TradesTable"),
//   {
//     ssr: false,
//     loading: TokenTablesLoading,
//   },
// );
import TradesTable from "@/components/customs/tables/token/Trades/TradesTable";
const TokenBuyAndSell = dynamic(
  () => import("@/components/customs/token/TokenBuyAndSell"),
  {
    ssr: false,
  },
);
// import TokenBuyAndSell from "@/components/customs/token/TokenBuyAndSell";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Image from "next/image";
// ######## Utils & Helpers 🤝 ########
import { cn } from "@/libraries/utils";
// ######## Types 🗨️ ########
import { TokenDataMessageType } from "@/types/ws-general";

// ######## APIs 🛜 ########
import { getSimilarTokens } from "@/apis/rest/tokens";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useTokenMessageStore } from "@/stores/token/use-token-messages.store";
import Link from "next/link";
import { CachedImage } from "../CachedImage";
import CustomTablePopover from "../popovers/custom-table/CustomTablePopover";
import { TokenDataAndSecurityContent } from "./TokenDataAndSecurity";
import { useWindowSizeStore } from "@/stores/use-window-size.store";
import { usePopupStore } from "@/stores/use-popup-state.store";
import { getMarketCapColor } from "@/utils/getMarketCapColor";
import { formatRelativeTime } from "@/utils/formatTime";
import { MultiWalletPopover } from "./MultiWalletPopover";
import { useOpenAdvanceSettingsFormStore } from "@/stores/use-open-advance-settings-form.store";
import { useTokenHoldingStore } from "@/stores/token/use-token-holding.store";
import { useParams } from "next/navigation";
import { formatAmount, formatAmountDollar } from "@/utils/formatAmount";
import dynamic from "next/dynamic";
import { TokenTablesLoading } from "../loadings/TokenPageLoading";
// import { BubbleMaps, GhostBubbleMaps } from "./BubbleMaps";
import { useCustomizeTheme } from "@/hooks/use-customize-theme";
import { SimilarTokenImage } from "./SimilarTokens";

type TabLabel =
  | "Trades"
  | "Holders"
  | "Top Traders"
  | "Dev Tokens"
  | "My Position";

type Tab = {
  label: TabLabel;
  icons: {
    active: string;
    inactive: string;
  };
  tooltipContent?: string;
  table: React.ComponentType<any>;
};

const tabList: Tab[] = [
  {
    label: "Trades",
    icons: {
      active: "/icons/token/tabs/active-trades.png",
      inactive: "/icons/token/tabs/inactive-trades.png",
    },
    tooltipContent: "Latest Trades on this Token",
    table: TradesTable,
  },
  {
    label: "Holders",
    icons: {
      active: "/icons/token/tabs/active-holders.png",
      inactive: "/icons/token/tabs/inactive-holders.png",
    },
    tooltipContent: "Information on Holders of this Token",
    table: HoldersTable,
  },
  {
    label: "Top Traders",
    icons: {
      active: "/icons/token/tabs/active-top-traders.png",
      inactive: "/icons/token/tabs/inactive-top-traders.png",
    },
    tooltipContent: "Top Traders on this Token",
    table: TopTradersTable,
  },
  {
    label: "Dev Tokens",
    icons: {
      active: "/icons/token/tabs/active-dev-tokens.png",
      inactive: "/icons/token/tabs/inactive-dev-tokens.png",
    },
    tooltipContent: "Past Tokens from the Developer",
    table: DevTokensTable,
  },
  {
    label: "My Position",
    icons: {
      active: "/icons/token/tabs/active-my-position.png",
      inactive: "/icons/token/tabs/inactive-my-position.png",
    },
    tooltipContent: "Your Positions",
    table: MyPositionTable,
  },
];

const getMaxHeight = (activeTab: TabLabel): string => {
  switch (activeTab) {
    case "Trades":
      return "max-h-[1004px]";
    case "Holders":
      return "max-h-[946px]";
    case "Top Traders":
      return "max-h-[946px]";
    case "Dev Tokens":
      return "max-h-[946px]";
    case "My Position":
      return "max-h-[946px]";
    default:
      return "max-h-[1004px]";
  }
};

export default memo(function TokenTabs({
  initChartData,
}: {
  initChartData: TokenDataMessageType | null;
}) {
  // const [activeTab, setActiveTab] = useState<TabLabel>("Trades");
  const activeTab = useTokenActiveTabStore((state) => state.activeTab);
  const setActiveTab = useTokenActiveTabStore((state) => state.setActiveTab);
  const previousActiveTab = useRef<TabLabel>(activeTab);
  const isPaused = useTradesTableSettingStore((state) => state.isPaused);
  const setIsPaused = useTradesTableSettingStore((state) => state.setIsPaused);
  const [isOpenSimilarTokensDrawer, setIsOpenSimilarTokensDrawer] =
    useState<boolean>(false);
  const [isOpenSecurityDrawer, setIsOpenSecurityDrawer] =
    useState<boolean>(false);
  const [isOpenBuySellDrawer, setIsOpenBuySellDrawer] =
    useState<boolean>(false);
  const openAdvanceSettings = useOpenAdvanceSettingsFormStore(
    (state) => state.openAdvanceSettings,
  );
  const isOpenPanel = useOpenInstantTrade((state) => state.isOpen);
  const setIsOpenPanel = useOpenInstantTrade((state) => state.setIsOpen);
  const resetSize = useOpenInstantTrade((state) => state.resetSize);

  const setWalletFilter = useWalletFilterStore(
    (state) => state.setWalletFilter,
  );

  const [, setOpenAdvanceSettingsFinal] = useState(false);

  // Get current token symbol for similar tokens lookup
  const tokenSymbolMessage = useTokenMessageStore(
    (state) => state.tokenInfoMessage.symbol,
  );
  const tokenHoldersCount = useTokenMessageStore(
    (state) => state.totalHolderMessages,
  );
  const tokenSymbol = useMemo(() => {
    return tokenSymbolMessage || initChartData?.token?.symbol || "";
  }, [tokenSymbolMessage, initChartData?.token?.symbol]);

  // Fetch similar tokens
  const { data: similarTokens, isLoading: isSimilarTokensLoading } = useQuery({
    queryKey: ["similar-tokens", tokenSymbol],
    queryFn: () => getSimilarTokens(tokenSymbol),
    enabled: !!tokenSymbol && isOpenSimilarTokensDrawer,
  });

  const filteredTokens = useMemo(() => {
    if (isSimilarTokensLoading) return [];

    const seenTokens = new Set<string>();

    return (
      similarTokens &&
      similarTokens.filter((token) => {
        const key = `${token.mint}-${token.name}`;
        if (seenTokens.has(key)) return false;
        seenTokens.add(key);
        if (token.mint === initChartData?.token?.mint) return false;
        return true;
      })
    );
  }, [similarTokens, initChartData?.token?.mint, isSimilarTokensLoading]);

  const handleTradesPanelToggle = () => {
    const newState = !isTradesPanelOpen;
    setIsTradesPanelOpen(newState);
    localStorage.setItem("trades-panel-state", newState ? "open" : "closed");
    if (newState) {
      if (previousActiveTab.current === "Trades") {
        setActiveTab("Holders");
      }
    } else {
      if (previousActiveTab.current === "Trades") {
        setActiveTab("Trades");
      }
    }
  };

  useEffect(() => {
    const settingsOpenTimeout = setTimeout(
      () => {
        setOpenAdvanceSettingsFinal(openAdvanceSettings);
      },
      !openAdvanceSettings ? 300 : 0,
    );

    return () => {
      clearTimeout(settingsOpenTimeout);
    };
  }, [openAdvanceSettings]);

  const width = useWindowSizeStore((state) => state.width);
  const { remainingScreenWidth, popups } = usePopupStore();
  const walletTrackerSnap = (popups || [])?.find(
    (item) => item.name === "wallet_tracker",
  );
  const twitterSnap = (popups || [])?.find((item) => item.name === "twitter");

  const isTradesPanelOpen = useTradesPanelStore((state) => state.isOpen);
  const setIsTradesPanelOpen = useTradesPanelStore((state) => state.setIsOpen);
  const isTradesPanelHovered = useTradesPanelStore((state) => state.isHovered);
  const setIsTradesPanelHovered = useTradesPanelStore(
    (state) => state.setIsHovered,
  );

  // Set initial active tab based on trades panel state
  useEffect(() => {
    if (isTradesPanelOpen) {
      if (previousActiveTab.current === "Trades") {
        setActiveTab("Holders");
      }
    }
  }, []);

  // Add this near your other useEffect hooks
  useEffect(() => {
    // Check localStorage on component mount
    const savedTradesPanelState = localStorage.getItem("trades-panel-state");
    if (savedTradesPanelState === "open") {
      setIsTradesPanelOpen(true);
      setActiveTab("Holders");
    }

    return () => {
      if (savedTradesPanelState === "open") {
        setActiveTab("Holders");
      } else {
        setActiveTab("Trades");
      }
    };
  }, []);

  // Add effect to handle mobile view changes
  useEffect(() => {
    if (width && width < 768 && isTradesPanelOpen) {
      setIsTradesPanelOpen(false);
      localStorage.setItem("trades-panel-state", "closed");
      setActiveTab("Trades");
    }
  }, [width, isTradesPanelOpen]);

  // Add event listener for trades panel state changes
  useEffect(() => {
    const handleTradesPanelChange = (event: CustomEvent) => {
      if (event.detail.isOpen) {
        setActiveTab("Holders");
      } else {
        setActiveTab("Trades");
      }
    };

    window.addEventListener(
      "tradesPanelStateChange",
      handleTradesPanelChange as EventListener,
    );

    return () => {
      window.removeEventListener(
        "tradesPanelStateChange",
        handleTradesPanelChange as EventListener,
      );
    };
  }, []);

  const theme = useCustomizeTheme();
  const params = useParams();
  const mint = (params?.["mint-address"] || params?.["pool-address"]) as string;
  const myHoldingsMessages = useTokenHoldingStore((state) => state.messages);
  const tokenBalance = useMemo(() => {
    return (myHoldingsMessages || [])?.reduce((sum, holding) => {
      const matching = (holding.tokens || []).filter(
        (t: any) => t.token.mint === mint,
      );
      return sum + matching.reduce((innerSum, t) => innerSum + t.balance, 0);
    }, 0);
  }, [mint, myHoldingsMessages]);

  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Copy token name to clipboard
  const copyToClipboard = (text: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedToken(text);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => setCopiedToken(null), 2000);
  };

  return (
    <div
      className={cn(
        "rounded-t-0 relative z-10 mb-[-1.5rem] flex h-[95dvh] w-dvw flex-col overflow-hidden md:mb-0 md:h-[1237px] md:w-full md:rounded-[8px] md:border md:border-border",
        getMaxHeight(activeTab),
      )}
    >
      <ScrollArea
        style={{
          overflow: "unset",
        }}
        className="md:w-full"
      >
        <ScrollBar orientation="horizontal" className="hidden" />
        <div className="flex h-12 w-full items-center border-b border-border px-4 md:h-10 md:bg-white/[4%] md:px-0">
          <div id="tab-list" className={cn("flex h-full items-center")}>
            {(tabList || [])?.map((tab) => {
              const isActive = activeTab === tab?.label;
              if (tab?.label === "Trades" && isTradesPanelOpen) {
                return null;
              }

              return (
                <React.Fragment key={tab?.label}>
                  <button
                    onClick={() => {
                      if (tab?.label === "Trades") {
                        setWalletFilter("");
                      }
                      setActiveTab(tab?.label);
                      setIsPaused(false);
                      previousActiveTab.current = tab?.label;
                    }}
                    className={cn(
                      "relative flex h-12 items-center justify-center py-2 md:h-10 md:py-0",
                      remainingScreenWidth && remainingScreenWidth > 1550
                        ? "gap-x-2 px-4"
                        : remainingScreenWidth < 1350
                          ? "gap-x-1.5 px-2"
                          : "gap-x-2 px-2",
                    )}
                  >
                    <div className="relative aspect-square h-5 w-5 flex-shrink-0">
                      <Image
                        src={
                          isActive ? tab?.icons?.active : tab?.icons?.inactive
                        }
                        alt={`${tab.label} Icon`}
                        fill
                        quality={50}
                        className="object-contain"
                      />
                    </div>
                    <span
                      className={cn(
                        "whitespace-nowrap text-nowrap font-geistSemiBold text-sm",
                        isActive
                          ? "text-fontColorAction"
                          : "text-fontColorSecondary",
                      )}
                    >
                      {tab?.label}
                      {tab?.label === "Holders" && `(${tokenHoldersCount})`}
                      {tab?.label === "My Position" &&
                        `(${formatAmount(tokenBalance, 2)})`}
                    </span>

                    {isActive && (
                      <div className="absolute bottom-0 left-0 h-[3px] w-full rounded-t-[100px] bg-primary"></div>
                    )}
                    {Boolean(remainingScreenWidth) &&
                      remainingScreenWidth > 1650 && (
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
                              <p>{tab?.tooltipContent}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                  </button>
                </React.Fragment>
              );
            })}
          </div>

          <div
            className={cn(
              "relative ml-auto flex items-center justify-end pr-1.5",
              remainingScreenWidth > 2030
                ? "min-w-[380px] gap-x-2"
                : remainingScreenWidth < 1280
                  ? "min-w-[120px] gap-x-1"
                  : "min-w-[215px] gap-x-1",
            )}
          >
            <div
              className={cn(
                "mr-0.5 flex h-[24px] items-center gap-x-0.5 rounded-[4px] bg-success/20 px-1.5",
                activeTab === "Trades" && !isTradesPanelOpen && isPaused
                  ? "flex"
                  : "hidden",
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
                  remainingScreenWidth &&
                    remainingScreenWidth <= 2080 &&
                    "hidden",
                )}
              >
                Paused
              </span>
            </div>

            {remainingScreenWidth < 2030 ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleTradesPanelToggle}
                      className={cn(
                        "hidden h-8 items-center justify-center gap-x-2 xl:flex",
                        "rounded-[20px] border px-1.5",
                        isTradesPanelOpen
                          ? "border-[hsl(286_90%_73%/1)] bg-[hsl(286_90%_73%/0.1)] text-[hsl(286_90%_73%/1)]"
                          : "border-white/10 bg-black/20 text-white hover:border-white/20",
                        isTradesPanelOpen &&
                          "shadow-[0_0_10px_rgba(137,87,255,0.3)]",
                        "hover:border-primary hover:bg-black/20 hover:text-primary",
                      )}
                      onMouseEnter={() => setIsTradesPanelHovered(true)}
                      onMouseLeave={() => setIsTradesPanelHovered(false)}
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 16 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M12 2C12.5101 1.99997 13.001 2.19488 13.3722 2.54486C13.7433 2.89483 13.9667 3.3734 13.9967 3.88267L14 4V12C14 12.5101 13.8051 13.001 13.4551 13.3722C13.1052 13.7433 12.6266 13.9667 12.1173 13.9967L12 14H4C3.48986 14 2.99899 13.8051 2.62783 13.4551C2.25666 13.1052 2.03326 12.6266 2.00333 12.1173L2 12V4C1.99997 3.48986 2.19488 2.99899 2.54486 2.62783C2.89483 2.25666 3.3734 2.03326 3.88267 2.00333L4 2H12ZM10 3.33333H4C3.83671 3.33335 3.67911 3.3933 3.55709 3.50181C3.43506 3.61032 3.3571 3.75983 3.338 3.922L3.33333 4V12C3.33335 12.1633 3.3933 12.3209 3.50181 12.4429C3.61032 12.5649 3.75983 12.6429 3.922 12.662L4 12.6667H10V3.33333ZM6.40867 6.14L6.47133 6.19533L7.80467 7.52867C7.91945 7.64346 7.98841 7.7962 7.99859 7.95821C8.00878 8.12023 7.9595 8.2804 7.86 8.40867L7.80467 8.47133L6.47133 9.80467C6.35136 9.92423 6.19038 9.99365 6.02108 9.99882C5.85178 10.004 5.68686 9.94452 5.55981 9.8325C5.43277 9.72048 5.35313 9.5643 5.33707 9.39568C5.321 9.22707 5.36973 9.05866 5.47333 8.92467L5.52867 8.862L6.39 8L5.52867 7.138C5.41388 7.0232 5.34493 6.87047 5.33474 6.70845C5.32455 6.54644 5.37383 6.38627 5.47333 6.258L5.52867 6.19533C5.64346 6.08055 5.7962 6.0116 5.95821 6.00141C6.12023 5.99122 6.2804 6.0405 6.40867 6.14Z"
                          fill={
                            isTradesPanelOpen || isTradesPanelHovered
                              ? "#DF74FF"
                              : "white"
                          }
                        />
                      </svg>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Trades Panel</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <button
                onClick={handleTradesPanelToggle}
                className={cn(
                  "hidden h-8 items-center justify-center gap-x-1.5 xl:flex",
                  "rounded-[20px] border px-3",
                  isTradesPanelOpen
                    ? "border-[hsl(286_90%_73%/1)] bg-[hsl(286_90%_73%/0.1)] text-[hsl(286_90%_73%/1)]"
                    : "border-white/10 bg-black/20 text-white hover:border-white/20",
                  isTradesPanelOpen && "shadow-[0_0_10px_rgba(137,87,255,0.3)]",
                  "hover:border-primary hover:bg-black/20 hover:text-primary",
                )}
                onMouseEnter={() => setIsTradesPanelHovered(true)}
                onMouseLeave={() => setIsTradesPanelHovered(false)}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 2C12.5101 1.99997 13.001 2.19488 13.3722 2.54486C13.7433 2.89483 13.9667 3.3734 13.9967 3.88267L14 4V12C14 12.5101 13.8051 13.001 13.4551 13.3722C13.1052 13.7433 12.6266 13.9667 12.1173 13.9967L12 14H4C3.48986 14 2.99899 13.8051 2.62783 13.4551C2.25666 13.1052 2.03326 12.6266 2.00333 12.1173L2 12V4C1.99997 3.48986 2.19488 2.99899 2.54486 2.62783C2.89483 2.25666 3.3734 2.03326 3.88267 2.00333L4 2H12ZM10 3.33333H4C3.83671 3.33335 3.67911 3.3933 3.55709 3.50181C3.43506 3.61032 3.3571 3.75983 3.338 3.922L3.33333 4V12C3.33335 12.1633 3.3933 12.3209 3.50181 12.4429C3.61032 12.5649 3.75983 12.6429 3.922 12.662L4 12.6667H10V3.33333ZM6.40867 6.14L6.47133 6.19533L7.80467 7.52867C7.91945 7.64346 7.98841 7.7962 7.99859 7.95821C8.00878 8.12023 7.9595 8.2804 7.86 8.40867L7.80467 8.47133L6.47133 9.80467C6.35136 9.92423 6.19038 9.99365 6.02108 9.99882C5.85178 10.004 5.68686 9.94452 5.55981 9.8325C5.43277 9.72048 5.35313 9.5643 5.33707 9.39568C5.321 9.22707 5.36973 9.05866 5.47333 8.92467L5.52867 8.862L6.39 8L5.52867 7.138C5.41388 7.0232 5.34493 6.87047 5.33474 6.70845C5.32455 6.54644 5.37383 6.38627 5.47333 6.258L5.52867 6.19533C5.64346 6.08055 5.7962 6.0116 5.95821 6.00141C6.12023 5.99122 6.2804 6.0405 6.40867 6.14Z"
                    fill={
                      isTradesPanelOpen || isTradesPanelHovered
                        ? "#DF74FF"
                        : "white"
                    }
                  />
                </svg>
                <span className="whitespace-nowrap text-nowrap font-geistMedium text-sm">
                  Trades Panel
                </span>
              </button>
            )}

            <div className="mx-1 hidden h-5 w-[1px] bg-border/50 md:block" />

            <MultiWalletPopover />

            <div className="mx-1 hidden h-5 w-[1px] bg-border/50 md:block" />
            {activeTab === "Trades" && remainingScreenWidth > 1280 && (
              <CustomTablePopover remainingScreenWidth={remainingScreenWidth} />
            )}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <BaseButton
                    id="panel"
                    onClick={() => {
                      if (!isOpenPanel) {
                        resetSize();
                      }
                      setIsOpenPanel(!isOpenPanel);
                    }}
                    className={cn(
                      "h-[26px] rounded-[4px] bg-transparent font-geistSemiBold text-sm text-primary before:absolute before:!rounded-[4px]",
                      {
                        "bg-white/[16%]": isOpenPanel,
                      },
                      remainingScreenWidth &&
                        remainingScreenWidth < 2030 &&
                        "px-1.5",
                    )}
                  >
                    {remainingScreenWidth && remainingScreenWidth > 2030 ? (
                      "Instant Trade"
                    ) : (
                      <div className="relative aspect-square size-5 flex-shrink-0">
                        <Image
                          src="/icons/token/icon-instant-trade.svg"
                          alt="Instant Trade Icon"
                          fill
                          quality={50}
                          className="object-contain"
                        />
                      </div>
                    )}
                  </BaseButton>
                </TooltipTrigger>
                <TooltipContent
                  className={
                    remainingScreenWidth && remainingScreenWidth < 2030
                      ? "block"
                      : "hidden"
                  }
                >
                  <p>Instant Trade</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </ScrollArea>

      <div className="relative grid w-full flex-grow grid-cols-1">
        {(tabList || [])?.map((tab) => {
          const isActive = activeTab === tab?.label;
          const TableComponent = tab?.table;

          if (tab?.label === "Trades" && isTradesPanelOpen) {
            return null;
          }

          return isActive ? (
            <TableComponent key={tab?.label} initData={initChartData} />
          ) : null;
        })}

        {/* <div
          className="absolute left-0 top-0 h-full w-full"
          style={{
            display: activeTab === "Bubblemaps" ? "block" : "none",
            opacity: activeTab === "Bubblemaps" ? 1 : 0,
            visibility: activeTab === "Bubblemaps" ? "visible" : "hidden",
            zIndex: activeTab === "Bubblemaps" ? 10 : -1,
          }}
        >
          <BubbleMaps />
        </div> */}
      </div>

      {width && width! < 1280 && (
        <div
          className={cn(
            "fixed inset-x-0 bottom-[40px] z-40 flex w-full gap-x-4 border-t border-border p-4 md:hidden md:items-center md:justify-between",
            remainingScreenWidth <= 768 &&
              "inset-x-auto md:flex md:items-stretch md:justify-stretch",
            !walletTrackerSnap?.isOpen && !twitterSnap?.isOpen && "bottom-0",
          )}
          style={{
            backgroundColor: theme.background2.backgroundColor,
            width:
              width! < 768
                ? "100%"
                : remainingScreenWidth && remainingScreenWidth <= 1280
                  ? `${remainingScreenWidth - 40}px`
                  : undefined,
          }}
        >
          <Drawer
            open={isOpenSecurityDrawer}
            onOpenChange={setIsOpenSecurityDrawer}
          >
            <DrawerTrigger asChild>
              <BaseButton variant="gray" size="short">
                {/* Guard */}
                <div className="relative aspect-square size-5 flex-shrink-0">
                  <Image
                    src="/icons/shield.png"
                    alt="Shield Icon"
                    fill
                    quality={50}
                    className="object-contain"
                  />
                </div>
              </BaseButton>
            </DrawerTrigger>
            <DrawerContent>
              {isOpenSecurityDrawer && (
                <>
                  <DrawerHeader className="flex h-[62px] flex-row items-center justify-between rounded-t-[8px] border-b border-border p-4">
                    <DrawerTitle className="flex w-fit items-center justify-center gap-x-2 font-semibold">
                      Data & Security
                      <div className="flex h-[20px] w-fit items-center gap-x-0.5 rounded-[4px] bg-destructive/10 pl-1 pr-1.5">
                        <div className="relative aspect-square h-4 w-4 flex-shrink-0">
                          <Image
                            src="/icons/issues.png"
                            alt="Issues Icon"
                            fill
                            quality={50}
                            className="object-contain"
                          />
                        </div>
                        <span className="inline-block font-geistSemiBold text-xs text-destructive">
                          1 Issues
                        </span>
                      </div>
                    </DrawerTitle>

                    <DrawerClose className="relative aspect-square h-6 w-6 flex-shrink-0">
                      <Image
                        src="/icons/close.png"
                        alt="Close Icon"
                        fill
                        quality={50}
                        className="object-contain"
                      />
                    </DrawerClose>
                  </DrawerHeader>
                  <TokenDataAndSecurityContent
                    closeDrawer={() => setIsOpenSecurityDrawer(false)}
                    tokenSecurityData={initChartData?.data_security || null}
                  />
                </>
              )}
            </DrawerContent>
          </Drawer>

          <Drawer
            open={isOpenSimilarTokensDrawer}
            onOpenChange={setIsOpenSimilarTokensDrawer}
          >
            <DrawerTrigger asChild>
              <BaseButton variant="gray" size="short">
                {/* Similar Token */}
                <div className="relative aspect-square size-5 flex-shrink-0">
                  <Image
                    src="/icons/token-similar.png"
                    alt="Similar Token Icon"
                    fill
                    quality={50}
                    className="object-contain"
                  />
                </div>
              </BaseButton>
            </DrawerTrigger>
            <DrawerContent
              className={cn(
                "h-[430px] w-dvw max-w-none border-none bg-background p-0 md:hidden",
                remainingScreenWidth <= 1280 && "md:block",
              )}
            >
              <div className="flex h-full flex-col">
                <div className="flex flex-none items-center justify-between border-b border-border/50 p-4">
                  <span className="font-geistSemiBold text-xl text-fontColorPrimary">
                    Similar Token
                  </span>
                  <DrawerClose className="relative aspect-square h-6 w-6 flex-shrink-0">
                    <Image
                      src="/icons/close.png"
                      alt="Close Icon"
                      fill
                      quality={50}
                      className="object-contain"
                    />
                  </DrawerClose>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto">
                  {isSimilarTokensLoading ? (
                    <div className="flex h-[72px] w-full items-center justify-center p-4">
                      <span className="text-fontColorSecondary">
                        Loading similar tokens...
                      </span>
                    </div>
                  ) : filteredTokens && filteredTokens?.length > 0 ? (
                    (filteredTokens || [])?.map((token, index) => {
                      const generateTokenUrl = () => {
                        if (!token?.mint) return "#";

                        const params = new URLSearchParams({
                          symbol: token?.symbol || "",
                          name: token?.name || "",
                          image: token?.image || "",
                          twitter: "",
                          website: "",
                          telegram: "",
                          market_cap_usd: "",
                          liquidity_usd: "",
                          progress: "",
                          dex: token?.dex || "",
                          origin_dex: "",
                          liquidity_base: "",
                        });

                        return `/token/${token.mint}?${params.toString()}`;
                      };

                      return (
                        <Link key={token.mint} href={generateTokenUrl()}>
                          <div
                            className={cn(
                              "relative flex h-[58px] w-full cursor-pointer items-center justify-between px-4 py-2 hover:bg-white/[4%]",
                            )}
                          >
                            {index !== filteredTokens.length - 1 && (
                              <div className="absolute bottom-0 left-0 w-full px-4">
                                <div className="border-b border-border/50"></div>
                              </div>
                            )}

                            <div className="flex max-w-[70%] items-center gap-x-3">
                              <div className="flex w-full flex-col gap-y-0.5 overflow-hidden">
                                <div className="flex items-center gap-x-1">
                                  <SimilarTokenImage
                                    alt={`${token.name} Token Icon`}
                                    src={token.image as string}
                                  />
                                  <span className="flex-shrink-0 font-geistSemiBold text-sm text-fontColorPrimary">
                                    {token.symbol}
                                  </span>
                                  {token.name && (
                                    <div className="flex min-w-0 items-center">
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <span className="max-w-[80px] truncate font-geistRegular text-sm text-fontColorSecondary">
                                              {token.name}
                                            </span>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>
                                              {token.name} | {token.mint}
                                            </p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <button
                                              onClick={(e) =>
                                                copyToClipboard(token.name, e)
                                              }
                                              className="ml-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center"
                                            >
                                              <svg
                                                width="12"
                                                height="12"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="text-fontColorSecondary hover:text-fontColorPrimary"
                                              >
                                                <path
                                                  d="M16 12.9V17.1C16 20.6 14.6 22 11.1 22H6.9C3.4 22 2 20.6 2 17.1V12.9C2 9.4 3.4 8 6.9 8H11.1C14.6 8 16 9.4 16 12.9Z"
                                                  stroke="currentColor"
                                                  strokeWidth="1.5"
                                                  strokeLinecap="round"
                                                  strokeLinejoin="round"
                                                />
                                                <path
                                                  d="M22 6.9V11.1C22 14.6 20.6 16 17.1 16H16V12.9C16 9.4 14.6 8 11.1 8H8V6.9C8 3.4 9.4 2 12.9 2H17.1C20.6 2 22 3.4 22 6.9Z"
                                                  stroke="currentColor"
                                                  strokeWidth="1.5"
                                                  strokeLinecap="round"
                                                  strokeLinejoin="round"
                                                />
                                              </svg>
                                            </button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>
                                              {copiedToken === token.name
                                                ? "Copied!"
                                                : "Copy token name"}
                                            </p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    </div>
                                  )}
                                </div>
                                <span className="truncate font-geistRegular text-sm text-fontColorSecondary">
                                  Last TX: {formatRelativeTime(token.lastTrade)}
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-y-0.5">
                              <span className="font-geistSemiBold text-sm text-success">
                                {formatRelativeTime(token.createdAt)}
                              </span>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span
                                      className={`max-w-[100px] truncate text-right font-geistSemiBold text-sm ${getMarketCapColor(Number(token.marketCap))}`}
                                    >
                                      {formatAmountDollar(
                                        Number(token.marketCap),
                                      )}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>
                                      {formatAmountDollar(
                                        Number(token.marketCap),
                                      )}
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </div>
                        </Link>
                      );
                    })
                  ) : (
                    <div className="flex h-[72px] w-full items-center justify-center p-4">
                      <span className="text-fontColorSecondary">
                        No similar tokens found
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex-none border-t border-border p-4">
                  <DrawerClose className="w-full">
                    <BaseButton
                      variant="gray"
                      className="w-full font-geistSemiBold text-base"
                    >
                      Close
                    </BaseButton>
                  </DrawerClose>
                </div>
              </div>
            </DrawerContent>
          </Drawer>

          <Drawer
            open={isOpenBuySellDrawer}
            onOpenChange={setIsOpenBuySellDrawer}
          >
            <DrawerTrigger asChild>
              <BaseButton variant="primary" className="flex-grow">
                {initChartData?.price?.migration?.migrating && (
                  <div className="relative aspect-square h-[18px] w-[18px]">
                    <Image
                      src="/icons/black-snipe.png"
                      alt="Black Snipe Icon"
                      fill
                      quality={50}
                      className="object-contain"
                    />
                  </div>
                )}
                <span className="font-geistSemiBold text-base text-card">
                  {initChartData?.price?.migration?.migrating
                    ? "Snipe"
                    : "Buy/Sell"}
                </span>
              </BaseButton>
            </DrawerTrigger>
            <DrawerContent className={cn("h-fit transition-all duration-300")}>
              {isOpenBuySellDrawer && (
                <>
                  <DrawerHeader className="flex h-[62px] flex-row items-center justify-between rounded-t-[8px] border-b border-border p-4">
                    <DrawerTitle className="flex w-fit items-center justify-center gap-x-2">
                      {initChartData?.price?.migration?.migrating
                        ? "Snipe"
                        : "Buy/Sell"}
                    </DrawerTitle>

                    <DrawerClose className="relative aspect-square h-6 w-6 flex-shrink-0">
                      <Image
                        src="/icons/close.png"
                        alt="Close Icon"
                        fill
                        quality={50}
                        className="object-contain"
                      />
                    </DrawerClose>
                  </DrawerHeader>
                  <TokenBuyAndSell
                    isMobile
                    module="token_page"
                  />
                </>
              )}
            </DrawerContent>
          </Drawer>
        </div>
      )}

      <AnimatePresence>{isOpenPanel && <PanelPopUp />}</AnimatePresence>
    </div>
  );
});
