"use client";

// ######## Libraries 📦 & Hooks 🪝 ########
import { useTokenMessageStore } from "@/stores/token/use-token-messages.store";
// ######## Components 🧩 ########
import TopTradersCard from "@/components/customs/cards/token/TopTradersCard";
import HeadCol from "@/components/customs/tables/HeadCol";
import SortButton, { SortCoinButton } from "@/components/customs/SortButton";
import EmptyState from "@/components/customs/EmptyState";
import { useTokenCardsFilter } from "@/stores/token/use-token-cards-filter.store";
import { TokenDataMessageType, TokenInfo } from "@/types/ws-general";
import DialogPnLWrapper from "../../modals/DialogPnLWrapper";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { FixedSizeList } from "react-window";
import { usePopupStore } from "@/stores/use-popup-state.store";
import { cn } from "@/libraries/utils";
import { useQuery } from "@tanstack/react-query";
import { fetchResolveSymbol } from "@/apis/rest/candles";
import { useParams } from "next/navigation";
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";
import { useCustomizeTheme } from "@/hooks/use-customize-theme";
import { convertTopTradersLamports } from "@/utils/lamportsConverter";

function TopTradersTable({
  initData,
}: {
  initData?: TokenDataMessageType | null;
}) {
  const finalInitData = {
    ...initData, chart_traders: convertTopTradersLamports({
      trades: initData?.chart_traders || [],
      decimals: {
        base_decimals: initData?.token?.base_decimals || 0,
        quote_decimals: initData?.token?.quote_decimals || 0,
      },
    })
  } as TokenDataMessageType;
  // List height measurement
  const listRef = useRef<HTMLDivElement>(null);
  const [listHeight, setListHeight] = useState(0);
  const {
    topTradersBought,
    topTradersSold,
    topTradersRemaining,
    setTopTradersBought,
    setTopTradersSold,
    setTopTradersRemaining,
  } = useTokenCardsFilter();
  const topTradersMessages = useTokenMessageStore(
    (state) => state.chartTraderMessages,
  );
  const params = useParams();
  const tokenMint = (params?.["mint-address"] as string) || "";

  const HeaderData = [
    {
      label: "Rank",
      tooltipContent: "The rank taking in account the amount of holdings",
      className: "flex-shrink-0 min-w-0 max-w-[72px] justify-center",
    },
    {
      label: "Wallet",
      tooltipContent: "The wallet of the holder",
      className: "w-full min-w-[155px] xl:flex min-[1500px]:min-w-[160px]",
    },
    {
      label: "Bought",
      sortButton: (
        <SortButton
          type="usdc-or-sol"
          value={topTradersBought}
          setValue={setTopTradersBought}
        />
      ),
      tooltipContent:
        "The value (SOL/USD) and amount of tokens bought and transactions made",
      className: "w-full min-w-[120px] xl:flex min-[1500px]:min-w-[155px]",
    },
    {
      label: "Sold",
      tooltipContent:
        "The value (SOL/USD) and amount of tokens sold and transactions made",
      className: "w-full min-w-[120px] min-[1500px]:min-w-[140px] xl:flex",
      sortButton: (
        <SortButton
          type="usdc-or-sol"
          value={topTradersSold}
          setValue={setTopTradersSold}
        />
      ),
    },
    {
      label: "PnL",
      tooltipContent: "The profit/loss percentage as well as the SOL/USD value",
      className: "w-full min-w-[150px] min-[1500px]:min-w-[170px] xl:flex",
    },
    {
      label: "% Owned",
      tooltipContent: "Percentage of the supply held",
      className: "w-full min-w-[80px] xl:flex min-[1500px]:min-w-[120px]",
    },
    {
      label: "Remaining",
      tooltipContent:
        "The amount of supply remaining, taking into account the purchase amount",
      className: "w-full min-w-[120px] xl:flex min-[1500px]:min-w-[145px]",
      sortButton: (
        <SortCoinButton
          value={topTradersRemaining}
          setValue={setTopTradersRemaining}
          tokenImage={
            finalInitData?.token?.image
              ? (finalInitData?.token?.image as string)
              : "/logo.png"
          }
        />
      ),
    },
    {
      label: "Actions",
      tooltipContent: "Action buttons which include sharing the PNL image.",
      className:
        "ml-4 mr-auto flex h-full w-full min-w-[80px] items-center justify-start gap-x-2",
    },
  ];

  // if no initData?.token then fetch metadata
  const resolve = useQuery({
    queryKey: ["resolve", finalInitData?.token?.mint ?? tokenMint],
    queryFn: async () =>
      await fetchResolveSymbol((finalInitData?.token?.mint as string) ?? tokenMint),
    enabled: !finalInitData?.token?.symbol,
  });

  const { remainingScreenWidth } = usePopupStore();

  // Effect to update list height
  useEffect(() => {
    const updateHeight = () => {
      if (listRef.current) {
        setListHeight(
          window.innerWidth > 768
            ? listRef.current.clientHeight
            : window.innerHeight - 180,
        );
      }
    };
    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, [listRef.current]);

  const Row = useCallback(
    ({ index, style, data }: any) => {
      const { items } = data;
      const trader = items[index];
      if (!trader) return null;

      return (
        <div style={style} key={trader.maker}>
          <TopTradersCard
            rank={index + 1}
            trader={trader}
            tokenData={finalInitData?.token || (resolve.data as TokenInfo)}
          />
        </div>
      );
    },
    [finalInitData, resolve.data],
  );

  // Theme
  const theme = useCustomizeTheme();

  if (topTradersMessages?.length === 0) {
    return (
      <div className="mt-10 flex h-auto w-full justify-center">
        <EmptyState state="No Result" />
      </div>
    );
  }

  return (
    <div className="flex w-full flex-grow flex-col">
      <DialogPnLWrapper />
      <OverlayScrollbarsComponent
        defer
        element="div"
        className="table__overlayscrollbar relative w-full flex-grow overflow-y-scroll"
      >
        <div className="absolute left-0 top-0 flex w-full flex-grow flex-col">
          <div
            className={cn(
              "header__table__container !hidden !pl-0 pr-4 xl:!flex",
              remainingScreenWidth < 1280 && "xl:!hidden",
            )}
            style={theme.background2}
          >
            {(HeaderData || [])?.map((item, index) => (
              <HeadCol isWithBorder={false} key={index} {...item} />
            ))}
          </div>

          <div
            ref={listRef}
            className={cn(
              "flex h-fit w-full flex-grow flex-col max-md:p-3 md:h-[72rem]",
              remainingScreenWidth < 768 && "max-md:p-0 md:h-fit",
            )}
          >
            {listHeight > 0 && (
              <FixedSizeList
                className="nova-scroller darker"
                height={listHeight}
                width="100%"
                itemCount={topTradersMessages.length}
                itemSize={remainingScreenWidth >= 1280 ? 46 : 164}
                itemData={{
                  items: topTradersMessages,
                }}
              >
                {Row}
              </FixedSizeList>
            )}
          </div>
        </div>
      </OverlayScrollbarsComponent>
    </div>
  );
}

export default memo(TopTradersTable);
