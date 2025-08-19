"use client";

// ######## Libraries 📦 & Hooks 🪝 ########
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useWalletTrackerMessageStore } from "@/stores/footer/use-wallet-tracker-message.store";
import { usePathname } from "next/navigation";
import { useCustomizeTheme } from "@/hooks/use-customize-theme";
import { useCupseySnap } from "@/stores/use-cupsey-snap.store";
import { useCustomizeSettingsStore } from "@/stores/setting/use-customize-settings.store";
import { useAnnouncementStore } from "@/stores/use-announcement.store";
import { useWindowSizeStore } from "@/stores/use-window-size.store";
import { useSelectedWalletTrackerTradeAddressesFilterStore } from "@/stores/footer/use-selected-wallet-tracker-trade-filter.store";
import { useTrackedWalletsOfToken } from "@/hooks/use-tracked-wallets-of-token";
import { useQuery } from "@tanstack/react-query";
import {
  PopupState,
  usePopupStore,
  WindowName,
  WindowSize,
} from "@/stores/use-popup-state.store";
import { useQuickAmountStore } from "@/stores/dex-setting/use-quick-amount.store";
import { useWalletTrackerPaused } from "@/stores/footer/use-wallet-tracker-paused.store";
import { useWalletTrackerFilterStore } from "@/stores/dex-setting/use-wallet-tracker-filter.store";
import { useWindowSize } from "@/hooks/use-window-size";
import { useDeviceAndBrowserForScrollbarStore } from "@/stores/use-device-and-browser-for-scrollbar-state.store";
// ######## APIs 🛜 ########
import {
  getSelectedWalletTrackerTransactions,
  WalletTracker,
} from "@/apis/rest/wallet-tracker";
import { ThemeSetting } from "@/apis/rest/settings/settings";
// ######## Components 🧩 ########
import Image from "next/image";
import { FixedSizeList } from "react-window";
import HeadCol from "@/components/customs/tables/HeadCol";
import EmptyState from "@/components/customs/EmptyState";
import WallerTrackerCardRow from "@/components/customs/cards/footer/VirtualizedWalletTrackerCard";
import SortButton, { SortCoinButton } from "@/components/customs/SortButton";
import { LoadingState } from "@/components/customs/tables/footer/LoadingState";
import WalletTrackerTotalFilter from "@/components/customs/tables/wallet-tracker/WalletTrackerTotalFilter";
// ######## Utils & Helpers 🤝 ########
import { cn } from "@/libraries/utils";
import {
  formatAmountWithoutLeadingZero,
  parseFormattedNumber,
} from "@/utils/formatAmount";

export type IVariant = "normal" | "pop-out" | "cupsey-snap" | "snap";
type ISortType = "DESC" | "ASC" | "NONE";
type ISortRow = "" | "TXNS";

type IHeader = {
  label: string;
  tooltipContent: string;
  className: string;
  sortButton?: React.JSX.Element;
  icon?: string;
};

type HeaderPopupProps = {
  header: IHeader;
  size: WindowSize;
  popUpResponsive: boolean;
  snappedSide: "none" | "left" | "right";
};

type TableBodyProps = {
  filteredFinalData: WalletTracker[];
  isSnapOpen: boolean;
  variant: IVariant;
  popUpResponsive: boolean;
  popupState?: PopupState;
  currentTheme: ThemeSetting;
  listHeight: number;
  setListHeight: (height: number) => void;
  onMouseEnter: VoidFunction;
  onMouseLeave: VoidFunction;
};

export default function WalletTrackerTable({
  variant = "normal",
}: {
  variant?: IVariant;
}) {
  const theme = useCustomizeTheme();
  const pathname = usePathname();
  const messages = useWalletTrackerMessageStore((state) => state.messages);
  const messagesPaused = useWalletTrackerMessageStore(
    (state) => state.messagesPaused,
  );
  const isLoadingWalletTracker = useWalletTrackerPaused(
    (state) => state.isLoadingWalletTracker,
  );
  const setMessages = useWalletTrackerMessageStore(
    (state) => state.setMessages,
  );
  const setMessagesPaused = useWalletTrackerMessageStore(
    (state) => state.setMessagesPaused,
  );
  const [sortRow, setSortRow] = useState<ISortRow>("");
  const [sortType, setSortType] = useState<ISortType>("NONE");
  const calculateHeightTrigger = useCupseySnap(
    (state) => state.calculateHeightTrigger,
  );

  const { minSol, excludeSells, excludeBuys, totalFilter } =
    useWalletTrackerFilterStore();

  // const isWalletTrackerTutorial = useUserInfoStore(
  //   (state) => state.isWalletTrackerTutorial,
  // );

  const trackedWalletsList = useWalletTrackerMessageStore(
    (state) => state.trackedWallets,
  );

  const currentSelectedAddresses =
    useSelectedWalletTrackerTradeAddressesFilterStore(
      (state) => state.selectedWalletAddresses,
    );
  // const currentSingleSelectedAddress = useWalletTrackerMessageStore(
  //   (state) => state.currentSingleSelectedAddress,
  // );

  const { data, isLoading: isSelectedTrackedWalletTransactionDataLoading } =
    useQuery({
      queryKey: [`single-wallet-tracker`, currentSelectedAddresses],
      queryFn: async () => {
        const res = await getSelectedWalletTrackerTransactions(
          currentSelectedAddresses.join(","),
        );

        console.warn("WALLET TRACKER - TABLE ✨", res);

        if (currentSelectedAddresses.length === 0) {
          if (Array.isArray(res)) {
            setMessages(res, "add");
          } else {
            setMessages(res.alerts, "add");
          }
        } else {
          if (Array.isArray(res)) {
            setMessages(
              (res || [])?.filter((item) =>
                currentSelectedAddresses.includes(item.walletAddress),
              ),
              "replace",
            );
          } else {
            setMessages(
              (res?.alerts || [])?.filter((item) =>
                currentSelectedAddresses.includes(item.walletAddress),
              ),
              "replace",
            );
          }
        }

        return res;
      },
      gcTime: 0,
      staleTime: 0,
      enabled:
        pathname === "/wallet-tracker" &&
        variant === "normal" &&
        currentSelectedAddresses.length > 0,
    });

  const filteredFinalData = useMemo(() => {
    // First filter by addresses
    let filteredMessages =
      currentSelectedAddresses.length > 0
        ? (messages || [])?.filter((item) =>
            pathname !== "/wallet-tracker"
              ? true
              : (currentSelectedAddresses || [])?.includes(item?.walletAddress),
          )
        : messages;

    // Apply the wallet tracker filters
    if (filteredMessages) {
      // should have mint and walletAddress
      filteredMessages = filteredMessages.filter(
        (item) => item?.mint && item?.walletAddress,
      );

      // Filter by minimum SOL amount
      if (minSol > 0) {
        filteredMessages = (filteredMessages || [])?.filter(
          (item) => item.baseAmount >= minSol,
        );
      }

      // Filter by transaction type
      if (excludeSells) {
        filteredMessages = (filteredMessages || [])?.filter(
          (item) => item.type.toLowerCase() !== "sell",
        );
      }

      if (excludeBuys) {
        filteredMessages = (filteredMessages || [])?.filter(
          (item) => item.type.toLowerCase() !== "buy",
        );
      }

      // Filter by total amount range
      if (totalFilter.min > 0 || totalFilter.max > 0) {
        filteredMessages = (filteredMessages || [])?.filter((item) => {
          const formattedTotal = formatAmountWithoutLeadingZero(
            Number(item.baseAmount),
            2,
            2,
          );
          const total = parseFormattedNumber(formattedTotal);
          if (totalFilter.min && !totalFilter.max) {
            return total >= totalFilter.min;
          }
          return total >= totalFilter.min && total <= totalFilter.max;
        });
      }
    }

    // Apply sorting logic
    if (sortType === "NONE" || !filteredMessages) {
      return (filteredMessages || []).sort((a, b) => {
        return b.timestamp - a.timestamp;
      }); // Return unsorted data
    }

    const sortedMessages = (filteredMessages || []).sort((a, b) => {
      if (sortRow === "TXNS") {
        return sortType === "ASC"
          ? a.buys + a.sells - (b.buys + b.sells)
          : b.buys + b.sells - (a.buys + a.sells);
      } else {
        return 0;
      }
    });

    // Remove duplicates by `mint`, keeping the last one
    const deduped = Array.from(
      new Map(
        (sortedMessages || [])?.map((item) => [item?.mint, item]),
      )?.values(),
    );

    return deduped;
  }, [
    messages,
    // listBasedOnSelectedAddresses,
    currentSelectedAddresses,
    sortType,
    sortRow,
    pathname,
    minSol,
    excludeSells,
    excludeBuys,
    totalFilter,
  ]);

  const quickBuyAmount = useQuickAmountStore(
    (state) => state.cosmoQuickBuyAmount,
  );
  const { amountType, setAmountType, remainingType, setRemainingType } =
    useWalletTrackerFilterStore();

  const [headerType, setHeaderType] = useState<
    "normal" | "popup" | "small-popup"
  >("normal");

  // const { twitterMonitorModalMode } = useTwitterMonitorLockedStore()
  // const { walletTrackerModalMode, walletTrackerSize } = useWalletTrackerLockedStore()

  // const popUpResponsive = walletTrackerSize.width < 770 && walletTrackerModalMode === "locked"
  const { popups } = usePopupStore();
  const windowName: WindowName = "wallet_tracker";
  const walletTracker = (popups || []).find(
    (value) => value.name === windowName,
  )!;
  const { size, mode, snappedSide } = walletTracker;
  const popUpResponsive =
    (size.width < 770 && mode !== "footer") || variant === "cupsey-snap";
  const quickBuyLength = quickBuyAmount.toString().length;
  const dynamicWidth = 120 + quickBuyLength * 5;
  const smallerPopupResponsive =
    (size.width < 600 && mode !== "footer") || variant === "cupsey-snap";
  const isSnapOpen = usePopupStore((state) =>
    state.popups.some((p) => p.isOpen && p.snappedSide !== "none"),
  );

  const customizedSettingPresets = useCustomizeSettingsStore(
    (state) => state.presets,
  );
  const customizedSettingActivePreset = useCustomizeSettingsStore(
    (state) => state.activePreset,
  );

  const currentTheme = useMemo(
    () =>
      customizedSettingPresets[customizedSettingActivePreset].themeSetting ||
      "original",
    [customizedSettingPresets, customizedSettingActivePreset],
  );

  // const currentTheme = useCustomizeSettingsStore(
  //   (state) => state.presets.preset1.themeSetting,
  // );
  // const isSnapOpen = popups.some((p) => p.isOpen && p.snappedSide !== "none");
  // const cupseySnap = useCupseySnap((state) => state.snap);
  // const isCupseySnapOpen =
  //   cupseySnap?.right?.top ||
  //   cupseySnap?.right?.bottom ||
  //   cupseySnap?.left?.top ||
  //   cupseySnap?.left?.bottom;

  const remainingScreenWidth = usePopupStore(
    (state) => state.remainingScreenWidth,
  );
  const isMobileLayout = remainingScreenWidth <= 1280;

  const HeaderDataNormal: IHeader[] = useMemo(
    () => [
      {
        label: "Token",
        tooltipContent: "Token Name",
        className: "min-w-[180px] w-[18%]",
      },
      {
        label: "Type",
        tooltipContent: "Type of transaction",
        className: "min-w-[55px] w-[6%]",
      },
      {
        label: "Amount",
        tooltipContent:
          "Amount of SOL put in by the tracked wallet and the amount of tokens bought",
        className: "xlplus:min-w-[165px] min-w-[140px] w-[13%]",
        sortButton: (
          <>
            <WalletTrackerTotalFilter />
            <SortButton
              type="usdc-or-sol"
              value={amountType}
              setValue={setAmountType}
            />
          </>
        ),
      },
      {
        label: "Market Cap",
        tooltipContent: "Indicates token value",
        className: "xlplus:w-[12%] w-[12%] min-w-fit",
      },
      // {
      //   label: "TXNS",
      //   tooltipContent: "The total number of coins traded in a specific period",
      //   className: "min-w-[60px] w-[9%]",
      //   sortButton: (
      //     <button
      //       onClick={() => {
      //         setSortRow("TXNS");
      //         setSortType(
      //           sortType === "ASC"
      //             ? "DESC"
      //             : sortType === "DESC"
      //               ? "NONE"
      //               : "ASC",
      //         );
      //       }}
      //       className="flex cursor-pointer items-center -space-x-[7.5px]"
      //       title="Sort by Transactions"
      //     >
      //       <HiArrowNarrowUp
      //         className={cn(
      //           "text-sm duration-300",
      //           sortRow === "TXNS" && sortType === "ASC"
      //             ? "text-[#DF74FF]"
      //             : "text-fontColorSecondary",
      //         )}
      //       />
      //       <HiArrowNarrowDown
      //         className={cn(
      //           "text-sm duration-300",
      //           sortRow === "TXNS" && sortType === "DESC"
      //             ? "text-[#DF74FF]"
      //             : "text-fontColorSecondary",
      //         )}
      //       />
      //     </button>
      //   ),
      // },
      {
        label: "Wallet Name",
        tooltipContent: "The name provided for the wallet",
        className: "xlplus:w-[17%] w-[10%]",
      },
      {
        label: "Remaining",
        tooltipContent: "The amount of tokens left in the tracked wallet",
        className: "xlplus:w-[21%] w-[18%]",
        sortButton: (
          <SortCoinButton
            value={remainingType}
            setValue={setRemainingType}
            isTokenAmount
          />
        ),
      },
      {
        label: "Actions",
        tooltipContent: "Action button which includes quick buy",
        className: "min-w-[90px] w-[9%]",
      },
    ],
    [amountType, setAmountType, remainingType, setRemainingType],
  );

  const HeaderDataPopup: IHeader[] = useMemo(
    () => [
      {
        label: "Token",
        tooltipContent: "Token Name",
        className: cn(
          snappedSide === "none" && "min-w-[340px]",
          popUpResponsive ? "min-w-[115px]" : "min-w-[250px]",
          size.width > 800 && "min-w-[340px]",
          size.width < 500 && snappedSide !== "none" && "min-w-[130px]",
        ),
        icon: "/icons/wallet-tracker/token.svg",
      },
      {
        label: "Wallet Name",
        tooltipContent: "The name provided for the wallet",
        className: cn(
          size.width < 400 && "min-w-[85px]",
          size.width >= 400 && size.width < 500 && "min-w-[100px]",
          size.width >= 500 && "min-w-[125px]",
        ),
        icon: "/icons/wallet-tracker/wallet.svg",
      },
      {
        label: "Amount",
        tooltipContent:
          "Amount of SOL put in by the tracked wallet and the amount of tokens bought",
        className: cn(
          "flex h-full w-full items-center",
          size.width <= 400 && "min-w-[95px]",
          size.width >= 472 && size.width < 530 && "min-w-[100px]",
          size.width >= 530 && "min-w-[140px]",
          variant === "cupsey-snap" && "min-w-[55px]",
        ),
        icon: "/icons/wallet-tracker/chart.svg",
        sortButton: (
          <>
            <WalletTrackerTotalFilter />
            <SortButton
              type="usdc-or-sol"
              value={amountType}
              setValue={setAmountType}
            />
          </>
        ),
      },
      {
        label: "Market Cap",
        tooltipContent: "Indicates token value",
        className: cn(
          "min-w-[65px]",
          mode === "footer" ? "max-w-[135px]" : "max-w-[90px]",
        ),
        icon: "/icons/wallet-tracker/database.svg",
      },
      {
        label: "Actions",
        tooltipContent: "Action button which includes quick buy",
        className: cn(
          "w-full min-w-[120px] max-w-[120px]",
          quickBuyLength > 1
            ? `min-w-[${dynamicWidth}ch] max-w-[${dynamicWidth}ch]`
            : "min-w-[120px] max-w-[120px]",
          smallerPopupResponsive &&
            "absolute right-2 top-0 min-w-0 max-w-0 justify-end",
          variant === "cupsey-snap" && "right-[30%]",
          smallerPopupResponsive && "hidden",
        ),
      },
    ],
    [amountType, setAmountType, size, mode],
  );

  useEffect(() => {
    switch (variant) {
      case "normal":
        setHeaderType("normal");
        break;
      case "cupsey-snap":
        if (smallerPopupResponsive) {
          setHeaderType("small-popup");
          break;
        }
        setHeaderType("popup");
        break;
      case "pop-out":
        if (smallerPopupResponsive) {
          setHeaderType("small-popup");
          break;
        }
        setHeaderType("popup");
        break;
      default:
        setHeaderType("normal");
        break;
    }
  }, [variant, smallerPopupResponsive, setHeaderType]);

  const setIsWalletTrackerHovered = useWalletTrackerPaused(
    (state) => state.setIsWalletTrackerHovered,
  );

  const handleOnMouseLeaveTracker = useCallback(() => {
    setIsWalletTrackerHovered(false);
    if (messagesPaused?.length) {
      setMessages(messagesPaused);
      setMessagesPaused([]);
    }
  }, [messagesPaused]);

  const [listHeight, setListHeight] = useState<number>(0);

  const isAppleEnvirontment = useDeviceAndBrowserForScrollbarStore(
    (state) => state.isAppleEnvirontment,
  );
  const isBrowserWithoutScrollbar = useDeviceAndBrowserForScrollbarStore(
    (state) => state.isBrowserWithoutScrollbar,
  );

  // Tutorial mode rendering
  // if (isWalletTrackerTutorial) {
  //   return (
  //     <div className="relative flex h-full w-full flex-grow flex-col">
  //       <div className="absolute left-0 top-0 flex h-full w-full flex-grow flex-col">
  //         {dummyWalletTrackerData && dummyWalletTrackerData.length ? (
  //           <div className="sticky top-0 z-[9] hidden h-[40px] w-full flex-shrink-0 border-b border-border bg-background pl-4 xl:block">
  //             <div className="flex items-center">
  //               {HeaderDataNormal?.map((item, index) => (
  //                 <HeadCol key={index} {...item} />
  //               ))}
  //             </div>
  //           </div>
  //         ) : null}

  //         <div className="nova-scroller relative flex w-full flex-grow max-xl:p-3">
  //           {!!dummyWalletTrackerData && dummyWalletTrackerData.length > 0 && (
  //             <Virtuoso
  //               style={{
  //                 overflow: "hidden",
  //               }}
  //               className="w-full"
  //               totalCount={dummyWalletTrackerData.length}
  //               itemContent={(index: number) =>
  //                 dummyWalletTrackerData[index] && (
  //                   <WalletTrackerCard
  //                     index={index}
  //                     isFirst={index === 0}
  //                     key={`${dummyWalletTrackerData[index].timestamp}-${dummyWalletTrackerData[index].maker}-${dummyWalletTrackerData[index].signature}`}
  //                     tracker={dummyWalletTrackerData[index]}
  //                     wallets={[]}
  //                     type={
  //                       dummyWalletTrackerData[index].type.toLowerCase() as
  //                         | "buy"
  //                         | "sell"
  //                     }
  //                     responsiveBreakpoint={1280}
  //                   />
  //                 )
  //               }
  //             />
  //           )}
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="relative flex h-full w-full flex-grow flex-col">
      {/* <div className="fixed right-3 top-3 z-[200000] flex flex-col border border-white/30 bg-black/80 p-2 text-white backdrop-blur-md">
        <h3 className="font-geistSemiBold text-sm">Wallet Tracker Debug 🖖</h3>

        <div className="flex flex-col text-xs text-white">
          <span>LE: {messages.length}</span>
          <span>Load WT: {isLoadingWalletTracker ? "🟢" : "🔴"}</span>
          <span>
            Load Fetch More:{" "}
            {isSelectedTrackedWalletTransactionDataLoading ? "🟢" : "🔴"}
          </span>
        </div>

        <div className="h-[1px] w-full bg-white"></div>

        <div className="nova-scroller flex h-[350px] flex-col text-xs text-white">
          {currentSelectedAddresses?.map((item) => (
            <div key={item}>
              • {item.slice(0, 10)}
              {" | "}
              <span
                className={cn(
                  "font-geistSemiBold",
                  messages?.filter((wt) => wt?.walletAddress === item).length > 0
                    ? "text-success"
                    : "text-destructive",
                )}
              >
                {messages?.filter((wt) => wt?.walletAddress === item).length}
              </span>
            </div>
          ))}
        </div>
      </div> */}
      <div className="absolute left-0 top-0 flex h-full w-full flex-grow flex-col">
        {/* Normal view with grid layout */}
        {filteredFinalData && variant === "normal" && !isMobileLayout ? (
          <div
            className={cn(
              "sticky top-0 z-[9] hidden h-[40px] w-full flex-shrink-0 border-b border-border pl-4 xl:block",
              isAppleEnvirontment || isBrowserWithoutScrollbar
                ? "pr-2"
                : filteredFinalData.length * 88 < listHeight
                  ? "pr-2"
                  : "pr-5",
            )}
            style={theme.background2}
          >
            <div className="relative flex h-full items-center">
              {(headerType === "normal"
                ? HeaderDataNormal
                : headerType === "small-popup"
                  ? (HeaderDataPopup || [])?.filter(
                      (item) => item.label !== "Action",
                    )
                  : HeaderDataPopup || []
              )?.map((item, index) => <HeadCol key={index} {...item} />)}
            </div>
          </div>
        ) : null}
        {/* Pop-out view with regular layout */}
        {(variant === "pop-out" || variant === "cupsey-snap") && (
          <div
            className={cn(
              "sticky top-0 z-[9] hidden h-[40px] flex-shrink-0 items-center overflow-x-hidden border-b border-border bg-transparent pl-2 xl:flex",
              isAppleEnvirontment || isBrowserWithoutScrollbar
                ? "pr-2"
                : filteredFinalData?.length * 40 <= listHeight
                  ? "pr-2"
                  : "pr-5",
            )}
          >
            {(headerType === "normal"
              ? HeaderDataNormal
              : headerType === "small-popup"
                ? (HeaderDataPopup || [])?.filter(
                    (item) => item.label !== "Action",
                  )
                : HeaderDataPopup || []
            )?.length > 0 &&
              (headerType === "normal"
                ? HeaderDataNormal
                : headerType === "small-popup"
                  ? (HeaderDataPopup || [])?.filter(
                      (item) => item.label !== "Action",
                    )
                  : HeaderDataPopup || []
              )?.map((item, index) => {
                if (item.label === "Actions" && popUpResponsive) {
                  return (
                    <HeadCol
                      key={index}
                      {...item}
                      className={cn(
                        "flex h-full w-full items-center justify-start",
                        quickBuyLength > 1 &&
                          `min-w-[${dynamicWidth}ch] max-w-[${dynamicWidth}ch]`,
                        smallerPopupResponsive && "hidden",
                      )}
                    />
                  );
                }

                return (
                  <HeaderPopupOut
                    key={index}
                    size={
                      variant === "cupsey-snap"
                        ? {
                            width: 200,
                            height: size.height,
                          }
                        : size
                    }
                    header={item}
                    popUpResponsive={popUpResponsive}
                    snappedSide={snappedSide}
                  />
                );
              })}
          </div>
        )}
        {isLoadingWalletTracker ||
        isSelectedTrackedWalletTransactionDataLoading ? (
          <LoadingState
            isFetchingBasedOnFilter={
              isSelectedTrackedWalletTransactionDataLoading &&
              pathname === "/wallet-tracker"
            }
          />
        ) : trackedWalletsList.length === 0 ? (
          <div
            className={cn(
              "relative left-0 flex w-full flex-grow items-center justify-center",
              (variant === "pop-out" || variant === "cupsey-snap")
                ? "h-full"
                : "top-0",
            )}
          >
            <EmptyState
              windowSize={size}
              state={
                walletTracker.mode === "popup" && variant === "pop-out"
                  ? "Wallet Popout"
                  : "Wallet"
              }
              className={cn(
                "-mt-5 xl:mt-0",
                variant === "cupsey-snap" ? "scale-[0.8]" : "",
                variant === "pop-out" && "max-w-[360px]",
              )}
            />
          </div>
        ) : filteredFinalData?.length === 0 ? (
          <div
            className={cn(
              "relative left-0 flex w-full flex-grow items-center justify-center",
              (variant === "pop-out" || variant === "cupsey-snap")
                ? "h-full"
                : "top-0",
            )}
          >
            <EmptyState
              windowSize={size}
               state={
                walletTracker.mode === "popup" && variant === "pop-out"
                  ? "No Result Popout"
                  : "No Result"
              }
              className={cn(
                "-mt-5 xl:mt-0",
                variant === "cupsey-snap" ? "scale-[0.8]" : "",
                variant === "pop-out" && "max-w-[360px]",
              )}
            />
          </div>
        ) : (
          <TableBody
            filteredFinalData={filteredFinalData}
            isSnapOpen={isMobileLayout}
            variant={variant}
            popUpResponsive={popUpResponsive}
            popupState={walletTracker}
            currentTheme={currentTheme}
            listHeight={listHeight}
            setListHeight={setListHeight}
            onMouseEnter={() => setIsWalletTrackerHovered(true)}
            onMouseLeave={handleOnMouseLeaveTracker}
          />
        )}
      </div>
    </div>
  );
}

const HeaderPopupOut = ({
  size,
  popUpResponsive,
  header,
  snappedSide,
}: HeaderPopupProps) => {
  const label = useMemo(() => {
    if (header.label === "Wallet Name") {
      if (popUpResponsive) {
        return "Wallet";
      }
    }

    if (header.label === "Market Cap") {
      if (popUpResponsive) {
        return "MC";
      }
    }

    return header.label;
  }, [header.label, popUpResponsive, size.width]);

  const widthClass = useMemo(() => {
    if (header.label === "Token") {
      return cn(
        snappedSide === "none" && "min-w-[340px]",
        popUpResponsive ? "min-w-[115px]" : "min-w-[250px]",
        size.width > 800 && "min-w-[340px]",
        size.width < 500 && snappedSide !== "none" && "min-w-[130px]",
      );
    }

    if (header.label === "Amount") {
      if (popUpResponsive) {
        // return size.width < 400
        //   ? "min-w-[95px]"
        //   : size.width >= 470 && size.width < 530
        //     ? "w-full min-w-[135px]"
        //     : "min-w-[140px]";
        return cn(
          "flex h-full w-full items-center",
          size.width <= 400 && "min-w-[95px]",
          size.width >= 470 && size.width < 530 && "min-w-[135px]",
          size.width >= 530 ? "min-w-[140px]" : "min-w-[85px]",
        );
      }
    }

    return header.className;
  }, [popUpResponsive, size.width, header.label, header.className]);

  if (popUpResponsive) {
    if (header.label === "Amount") {
      if (size.width < 500) {
        return (
          <div
            className={cn(
              "flex items-center justify-start gap-x-1",
              widthClass,
            )}
          >
            <div className="relative h-6 w-6">
              <Image
                src={header?.icon ? header?.icon : "/logo.png"}
                alt={header?.label}
                fill
              />
            </div>

            {header.sortButton}
          </div>
        );
      }
    }
    if (size.width < 400) {
      return (
        <div
          className={cn("flex items-center justify-start gap-x-1", widthClass)}
        >
          <div className="relative h-6 w-6">
            <Image
              src={header?.icon ? header?.icon : "/logo.png"}
              alt={header?.label}
              fill
            />
          </div>

          {header?.sortButton}
        </div>
      );
    }

    return (
      <HeadCol
        {...header}
        label={label}
        className={cn(widthClass)}
        isWithBorder={true}
      />
    );
  }

  return (
    <HeadCol
      {...header}
      className={cn(widthClass)}
      label={label}
      style={{
        minWidth: size.width < 500 ? `size ${size.width / 3 + 10}px` : "",
      }}
      isWithBorder={true}
    />
  );
};

const TableBody = ({
  filteredFinalData,
  isSnapOpen,
  variant,
  popUpResponsive,
  popupState,
  currentTheme,
  listHeight,
  setListHeight,
  onMouseEnter,
  onMouseLeave,
}: TableBodyProps) => {
  const { walletsOfToken } = useTrackedWalletsOfToken();

  const isAnnouncementExist = useAnnouncementStore(
    (state) => state.isAnnouncementExist,
  );
  const height = useWindowSizeStore((state) => state.height);

  const listRef = useRef<HTMLDivElement>(null);
  const calculateHeightTrigger = useCupseySnap(
    (state) => state.calculateHeightTrigger,
  );

  const { width } = useWindowSize();
  // Memoize the items data to prevent unnecessary re-renders
  const itemData = useMemo(
    () => ({
      items: filteredFinalData,
      walletsOfToken,
      isSnapOpen,
      variant,
    }),
    [filteredFinalData, isSnapOpen],
  );

  // Memoize the getItemKey function
  const getItemKey = (index: number) => {
    return `${filteredFinalData[index]?.mint}-${index}` || index;
  };

  const itemSize = useMemo(() => {
    if (variant === "normal") {
      // if there is snap window and mobile
      return isSnapOpen || width! < 1280 ? 165 : 88;
    } else {
      return width! >= 1280 ? 40 : 180;
    }
  }, [width, isSnapOpen]);

  const updateHeight = useCallback(() => {
    if (listRef.current) {
      const style = window.getComputedStyle(listRef.current);
      const paddingTop = parseFloat(style.paddingTop);
      const paddingBottom = parseFloat(style.paddingBottom);
      const heightWithoutPadding =
        listRef.current.clientHeight - paddingTop - paddingBottom;
      setListHeight(heightWithoutPadding);
    }
  }, [calculateHeightTrigger]);

  useEffect(() => {
    if (listHeight !== listRef.current?.clientHeight) {
      updateHeight();
    }
  }, [listRef.current, listHeight]);

  useEffect(() => {
    updateHeight();
  }, [
    currentTheme,
    isAnnouncementExist,
    isSnapOpen,
    popUpResponsive,
    popupState,
    height,
    updateHeight,
    calculateHeightTrigger,
  ]);

  return (
    <div
      ref={listRef}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={cn(
        "nova-scroller relative flex h-full w-full flex-grow flex-col max-xl:p-4",
        variant === "normal" && isSnapOpen && "p-2",
      )}
    >
      <FixedSizeList
        height={listHeight!}
        width="100%"
        itemCount={filteredFinalData.length}
        itemSize={itemSize}
        overscanCount={3}
        itemKey={getItemKey}
        itemData={itemData}
      >
        {WallerTrackerCardRow}
      </FixedSizeList>
    </div>
  );
};
