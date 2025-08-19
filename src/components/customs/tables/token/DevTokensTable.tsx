"use client";

// ######## Libraries 📦 & Hooks 🪝 ########
import { memo, useMemo } from "react";
import { useTokenMessageStore } from "@/stores/token/use-token-messages.store";
// ######## Components 🧩 ########
import DevTokensCard from "@/components/customs/cards/token/DevTokensCard";
import HeadCol from "@/components/customs/tables/HeadCol";
import EmptyState from "@/components/customs/EmptyState";
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";
import { usePopupStore } from "@/stores/use-popup-state.store";
import { cn } from "@/libraries/utils";
import { useCustomizeTheme } from "@/hooks/use-customize-theme";

function DevTokensTable() {
  const devTokens = useTokenMessageStore((state) => state.developerTokens);
  const remainingScreenWidth = usePopupStore((s) => s.remainingScreenWidth);
  // const [sort, setSort] = useState<"ASC" | "DESC">("ASC");

  // const handleSortOrderChange = () => {
  //   setSort((prevSort) => (prevSort === "ASC" ? "DESC" : "ASC"));
  // };

  const HeaderData = useMemo(
    () => [
      {
        label: "Token",
        tooltipContent: "The token name, ticker and address",
        className: "min-w-[205px]",
      },
      {
        label: "Created",
        tooltipContent: "Time passed since the token was created",
        className:
          "w-[70%] " +
          (remainingScreenWidth > 1650 ? "min-w-[73px]" : "min-w-[63px]"),
        // sortButtonAfterTooltip: (
        //   <button
        //     onClick={handleSortOrderChange}
        //     className="flex cursor-pointer items-center -space-x-[7.5px]"
        //     title="Toggle sort order (Time)"
        //   >
        //     <HiArrowNarrowUp
        //       className={cn(
        //         "text-sm duration-300",
        //         sort === "ASC" ? "text-[#DF74FF]" : "text-fontColorSecondary",
        //       )}
        //     />
        //     <HiArrowNarrowDown
        //       className={cn(
        //         "text-sm duration-300",
        //         sort === "DESC" ? "text-[#DF74FF]" : "text-fontColorSecondary",
        //       )}
        //     />
        //   </button>
        // ),
      },
      {
        label: "Migrated",
        tooltipContent: "Whether the token reached migration or not",
        className:
          "w-[60%] " +
          (remainingScreenWidth > 1650 ? "min-w-[73px]" : "min-w-[63px]"),
      },
      {
        label: "Transactions",
        tooltipContent: "Total buy in the token",
        className:
          "w-[60%] " +
          (remainingScreenWidth > 1650 ? "min-w-[73px]" : "min-w-[63px]"),
      },
      {
        label: "Volume",
        tooltipContent: "Volume of the token",
        className:
          "w-[75%] " +
          (remainingScreenWidth > 1650 ? "min-w-[53px]" : "min-w-[49px]"),
      },
      {
        label: "Liquidity",
        tooltipContent: "Amount of liquidity in the token",
        className:
          "w-[75%] " +
          (remainingScreenWidth > 1650 ? "min-w-[53px]" : "min-w-[49px]"),
      },
      {
        label: "Market cap",
        tooltipContent: "The market cap of the token",
        className:
          "w-[75%] " +
          (remainingScreenWidth > 1650 ? "min-w-[53px]" : "min-w-[49px]"),
      },
    ],
    [remainingScreenWidth],
  );

  // Theme
  const theme = useCustomizeTheme();

  if (devTokens?.length === 0) {
    return (
      <div className="mt-10 flex h-auto w-full justify-center">
        <EmptyState state="No Result" />
      </div>
    );
  }

  // const sortedDevTokens = [...devTokens].sort((a, b) => {
  //   const createdA = new Date(a.created).getTime();
  //   const createdB = new Date(b.created).getTime();
  //   return sort === "ASC" ? createdA - createdB : createdB - createdA;
  // });

  return (
    <div className="flex w-full flex-grow flex-col max-md:pb-[70px]">
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
              remainingScreenWidth <= 768 && "md:gap-y-2 md:p-4",
            )}
          >
            {(devTokens || [])?.map((tokenData) => (
              <DevTokensCard key={tokenData.mint} tokenData={tokenData} />
            ))}
          </div>
        </div>
      </OverlayScrollbarsComponent>
    </div>
  );
}

export default memo(DevTokensTable);
