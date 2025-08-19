"use client";

// ######## Libraries 📦 & Hooks 🪝 ########
import { memo, useMemo } from "react";
import { useParams } from "next/navigation";
import { useTokenHoldingStore } from "@/stores/token/use-token-holding.store";
// ######## Components 🧩 ########
import MyPositionCard from "@/components/customs/cards/token/MyPositionCard";
import HeadCol from "@/components/customs/tables/HeadCol";
import EmptyState from "@/components/customs/EmptyState";
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";
import { usePopupStore } from "@/stores/use-popup-state.store";
import { cn } from "@/libraries/utils";
import { useCustomizeTheme } from "@/hooks/use-customize-theme";

function MyPositionTable() {
  const params = useParams();
  const mint = (params?.["mint-address"] || params?.["pool-address"]) as string;
  const myHoldingsMessages = useTokenHoldingStore((state) => state.messages);
  const { remainingScreenWidth } = usePopupStore();

  const HeaderData = useMemo(() => {
    return [
      {
        label: "Token",
        tooltipContent: "The token name, ticker and address.",
        className: "min-w-[210px]",
      },
      {
        label: "Wallet name",
        tooltipContent:
          "The wallet which the position is under, including the wallet address.",
        className:
          remainingScreenWidth > 1650
            ? "min-w-[140px]"
            : remainingScreenWidth > 1480
              ? "min-w-[130px]"
              : "min-w-[110px]",
      },
      {
        label: "Market Cap",
        tooltipContent: "The market cap of the token.",
        className:
          remainingScreenWidth > 1650
            ? "min-w-[140px]"
            : remainingScreenWidth > 1480
              ? "min-w-[130px]"
              : "min-w-[102px]",
      },
      {
        label: "Invested",
        tooltipContent: "The amount of SOL/USD invested into the token.",
        className:
          remainingScreenWidth > 1650
            ? "min-w-[140px]"
            : remainingScreenWidth > 1480
              ? "min-w-[130px]"
              : "min-w-[85px]",
      },
      {
        label: "Remaining",
        tooltipContent: "The amount of SOL/USD remaining in the token.",
        className:
          remainingScreenWidth > 1650
            ? "min-w-[140px]"
            : remainingScreenWidth > 1480
              ? "min-w-[115px]"
              : "min-w-[95px]",
      },
      {
        label: "Sold",
        tooltipContent: "The amount of SOL/USD sold from the invested amount.",
        className:
          remainingScreenWidth > 1650
            ? "min-w-[140px]"
            : remainingScreenWidth > 1480
              ? "min-w-[115px]"
              : "min-w-[90px]",
      },
      {
        label: "P&L",
        tooltipContent: "The profit/loss percentage as well as the SOL value.",
        className:
          remainingScreenWidth > 1650
            ? "min-w-[140px]"
            : remainingScreenWidth > 1480
              ? "min-w-[115px]"
              : "min-w-[90px]",
      },
      {
        label: "Actions",
        tooltipContent: "Action buttons which include sharing the PNL image.",
        className:
          remainingScreenWidth > 1650
            ? "min-w-[140px]"
            : remainingScreenWidth > 1480
              ? "min-w-[130px]"
              : "min-w-[110px]",
      },
    ];
  }, [remainingScreenWidth]);

  const filteredHoldings = useMemo(() => {
    return (myHoldingsMessages || []).flatMap((holding) =>
      (holding.tokens || [])
        ?.filter((t: any) => t?.token?.mint === mint)
        ?.map((token) => ({
          wallet: holding?.wallet,
          token,
        })),
    );
  }, [JSON.stringify(myHoldingsMessages), mint]);

  // Theme
  const theme = useCustomizeTheme();

  if (filteredHoldings.length === 0) {
    return (
      <div className="mt-10 flex h-auto w-full justify-center">
        <EmptyState state="Holding" />
      </div>
    );
  }

  return (
    <div className="flex w-full flex-grow flex-col">
      <OverlayScrollbarsComponent
        defer
        element="div"
        className="table__overlayscrollbar relative w-full flex-grow overflow-y-scroll"
      >
        <div className="absolute left-0 top-0 flex w-full flex-grow flex-col">
          <div
            className={cn(
              "header__table__container !hidden xl:!flex",
              remainingScreenWidth <= 1280 && "xl:!hidden",
              "px-4",
            )}
            style={theme.background2}
          >
            {(HeaderData || [])?.map((item, index) => (
              <HeadCol isWithBorder={false} key={index} {...item} />
            ))}
          </div>

          <div
            className={cn(
              "flex h-auto w-full flex-col gap-y-2 p-4 md:gap-y-0 md:p-0",
              remainingScreenWidth < 768 && "md:gap-y-2 md:p-4",
            )}
          >
            {(filteredHoldings || [])?.map(({ wallet, token }) => (
              <MyPositionCard
                key={`${wallet}-${token.token.mint}`}
                wallet={wallet}
                tokenData={token}
              />
            ))}
          </div>
        </div>
      </OverlayScrollbarsComponent>
    </div>
  );
}

export default memo(MyPositionTable);
