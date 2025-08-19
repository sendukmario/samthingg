"use client";

// ######## Libraries 📦 & Hooks 🪝 ########
import { useParams } from "next/navigation";
import { memo, useMemo } from "react";
// ######## Components 🧩 ########
import HeadCol from "@/components/customs/tables/HeadCol";
import { Skeleton } from "@/components/ui/skeleton";
// ######## Utils & Helpers 🤝 ########
import { cn } from "@/libraries/utils";
import { useTradesWalletModalStore } from "@/stores/token/use-trades-wallet-modal.store";
import { usePopupStore } from "@/stores/use-popup-state.store";
import { LoaderCircle } from "lucide-react";
import { CommonTableProps } from "./TradeHistoryTable";
import { FixedSizeList } from "react-window";
import VirtualizedDeployedTokenRow from "./VirtualizedDeployedTokenRow";
import { useAnnouncementStore } from "@/stores/use-announcement.store";
import { useWindowSizeStore } from "@/stores/use-window-size.store";
import { useQuery } from "@tanstack/react-query";
import { useCustomizeTheme } from "@/hooks/use-customize-theme";
import { NewDeveloperToken } from "@/types/ws-general";
import { getBaseURLBasedOnRegion } from "@/utils/getBaseURLBasedOnRegion";
import axios from "@/libraries/axios";
import { useTokenMessageStore } from "@/stores/token/use-token-messages.store";

interface Exchange {
  name: string;
  address: string;
}

interface DeployedToken {
  address: string;
  createdAt: number;
  dex: string;
  decimals: number;
  image: string | null;
  liquidity: string;
  name: string;
  networkId: number;
  launchpad: string;
  holders: number;
  priceUSD: string;
  symbol: string;
  progressPct: number;
  supply: number;
  pnlSol: string | null;
  origin_dex: string;
  marketCap: number;
  exchanges: Exchange[];
}

export interface TransformedDeployedTokenData {
  token: {
    symbol: string;
    name: string;
    image: string | null;
    mint: string;
  };
  createdAt: number;
  marketCap: number;
  holders: number;
  pnlSol: string | null;
  priceUSD: string;
  liquidity: string;
  progressPct: number;
}

// Transform API data to match DeployedTokensCard requirements
export const transformDeployedTokenData = (data: DeployedToken) => ({
  token: {
    symbol: data.symbol,
    name: data.name,
    image: data.image,
    mint: data.address,
  },
  createdAt: data.createdAt,
  marketCap: data.marketCap,
  holders: data.holders,
  pnlSol: data.pnlSol,
  priceUSD: data.priceUSD,
  liquidity: data.liquidity,
  progressPct: data.progressPct,
});

const LoadingSkeleton = () => (
  <div className="flex h-[56px] w-full items-center px-4">
    <div className="flex w-full min-w-[80px]">
      <Skeleton className="h-4 w-20" />
    </div>
    <div className="flex w-full min-w-[125px]">
      <Skeleton className="h-4 w-20" />
    </div>
    <div className="flex w-full min-w-[125px]">
      <Skeleton className="h-4 w-24" />
    </div>
    <div className="flex w-full min-w-[150px]">
      <Skeleton className="h-4 w-24" />
    </div>
    <div className="flex w-full min-w-[245px]">
      <Skeleton className="h-4 w-44" />
    </div>
  </div>
);

const EmptyState = () => (
  <div className="flex h-full w-full flex-grow items-center justify-center py-5">
    <p className="text-center font-geistRegular text-sm text-fontColorSecondary">
      No deployed tokens found for this wallet address.
    </p>
  </div>
);

function DeployedTokensTable({ isModalContent = true }: CommonTableProps) {
  const { remainingScreenWidth } = usePopupStore();
  const params = useParams();
  const theme = useCustomizeTheme();
  const { wallet: walletAddressState } = useTradesWalletModalStore();
  // const isAppleEnvirontment = useDeviceAndBrowserForScrollbarStore(
  //   (state) => state.isAppleEnvirontment,
  // );
  // const isBrowserWithoutScrollbar = useDeviceAndBrowserForScrollbarStore(
  //   (state) => state.isBrowserWithoutScrollbar,
  // );
  const isAnnouncementExist = useAnnouncementStore(
    (state) => state.isAnnouncementExist,
  );
  const width = useWindowSizeStore((state) => state.width);

  // Get wallet address from path params
  const walletAddress = useMemo(() => {
    if (!params) return null;
    if (isModalContent) return walletAddressState;
    return params["wallet-address"] as string;
  }, [params, isModalContent, walletAddressState]);

  // const {
  //   data: deployedTokensData,
  //   isLoading,
  //   isError,
  // } = useQuery({
  //   queryKey: ["wallet-deployed-tokens", walletAddress],
  //   queryFn: async () => {
  //     const res = await getDeployedTokens(walletAddress as string);
  //     return res.data.results;
  //   },
  // });

  const tokenDeveloperTokens = useTokenMessageStore(
    (state) => state.developerTokens,
  );

  const {
    data: deployedTokensData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["developer-tokens", walletAddress],
    queryFn: async () => {
      if (!walletAddress) return null;

      const { data } = await axios.get<NewDeveloperToken[]>(
        getBaseURLBasedOnRegion("/developer-tokens"),
        {
          params: {
            developer: walletAddress,
          },
        },
      );

      return data.filter((token) => token.mint !== "");
    },
    enabled: !!walletAddress,
  });

  const deduplicatedDeveloperTokens = useMemo(() => {
    if (!deployedTokensData || deployedTokensData.length === 0) return [];

    const devTokenMap = new Map(tokenDeveloperTokens.map((t) => [t.mint, t]));

    // Replace tokens from data with developerTokens (if available), then deduplicate
    const tokenMap = new Map<string, (typeof deployedTokensData)[number]>();

    for (const token of deployedTokensData) {
      if (!token.mint) continue;
      const replacement = devTokenMap.get(token.mint) ?? token;
      tokenMap.set(token.mint, replacement); // Overwrites duplicates
    }

    const developerTokens = Array.from(tokenMap.values());

    return developerTokens;
  }, [deployedTokensData, tokenDeveloperTokens]);

  const itemData = useMemo(
    () => ({
      items: deduplicatedDeveloperTokens!,
      column: 1,
      isModalContent: isModalContent,
    }),
    [deduplicatedDeveloperTokens],
  );

  const getItemKey = (index: number) => {
    return itemData?.items[index]?.mint || itemData?.items[index]?.created || index;
  };

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
      return width! < 768 ? 76 : 56;
    }

    if (width! < 768) {
      return remainingScreenWidth < 800 ? 76 : 56;
    }

    if (width! > 768 && remainingScreenWidth < 800) {
      return 76;
    }

    return 56;
  }, [isModalContent, width, remainingScreenWidth]);

  const HeaderData = [
    {
      label: "Token",
      tooltipContent: "The token name, ticker and address",
      className: "min-w-[180px]",
    },
    {
      label: "Created",
      tooltipContent: "Token Information",
      className: "min-w-[120px]",
    },
    {
      label: "Migrated",
      tooltipContent: "Whether token reached migration or not",
      className: "min-w-[120px]",
    },
    {
      label: "Txs",
      tooltipContent: "Total transaction in the token",
      className: "min-w-[80px]",
    },
    {
      label: "Volume",
      tooltipContent: "Volume of the token",
      className: "min-w-[120px]",
    },
    {
      label: "Liquidity",
      tooltipContent: "Amount of liquidity in the token",
      className: "min-w-[120px]",
    },
    {
      label: "Market Cap",
      tooltipContent: "Market Cap Information",
      className: "min-w-[120px]",
    },
  ];

  return (
    <div className="flex w-full flex-grow flex-col">
      {/* Table headers */}
      <div
        className={cn(
          "z-[9] hidden h-[40px] flex-shrink-0 items-center bg-card pl-4 md:flex",
          remainingScreenWidth < 880 && "md:hidden",
        )}
        style={theme.background}
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
          remainingScreenWidth < 880 && !isModalContent && "md:p-0 md:pt-3",
        )}
        style={theme.background}
      >
        {isLoading ? (
          <>
            {remainingScreenWidth < 880 && !isModalContent ? (
              <div
                className={cn(
                  "flex h-[calc(100vh_-_590px)] w-full flex-row items-center justify-center gap-2 md:hidden xl:h-[calc(100vh_-_560px)]",
                  isModalContent && "h-[286px] overflow-y-auto",
                  remainingScreenWidth < 880 && "md:flex",
                )}
              >
                <LoaderCircle
                  size={16}
                  className="animate-spin text-fontColorSecondary"
                />
                <span className="text-sm text-fontColorSecondary">
                  Loading deployed tokens..
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
        ) : !deduplicatedDeveloperTokens?.length && !isLoading ? (
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
                itemCount={deduplicatedDeveloperTokens.length}
                itemSize={fixedSizeListHeight}
                overscanCount={3}
                itemKey={getItemKey}
                itemData={itemData}
                style={theme.background}
              >
                {VirtualizedDeployedTokenRow}
              </FixedSizeList>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default memo(DeployedTokensTable);
