"use client";

import Image from "next/image";
import { useMemo, Fragment, memo } from "react";
import { useEarnStore } from "@/stores/earn/use-earn.store";
import { useSolPriceMessageStore } from "@/stores/use-solprice-message.store";
import { formatAmountDollar } from "@/utils/formatAmount";
import { useCustomizeTheme } from "@/hooks/use-customize-theme";

function EarnCashBack() {
  const theme = useCustomizeTheme();
  const { refUserData, isLoading, isError } = useEarnStore();
  const solPrice = useSolPriceMessageStore((state) => state.messages.price);
  const ListCashback = () => {
    if (isLoading) {
      return (
        <div className="nova-scroller max-h-[calc(100dvh_-_660px)] space-y-2 overflow-y-auto p-3 max-lg:max-h-[272px]">
          {Array.from({ length: 5 })?.map((_, index) => (
            <CashBackItemSkeleton key={index} />
          ))}
        </div>
      );
    }

    if (isError) {
      return (
        <div className="mt-2 flex h-[280px] flex-col items-center justify-center gap-y-2 rounded-[12px] bg-shadeTableHover p-8 text-fontColorSecondary">
          <div className="relative aspect-[60/60] h-auto w-full max-w-[60px] flex-shrink-0">
            <Image
              src="/icons/earn/earn-no-cashback.png"
              alt="No Cashback Image"
              fill
              quality={100}
              className="object-contain"
            />
          </div>
          <div className="flex flex-col items-center justify-center gap-y-2 text-center">
            <h2 className="font-geistSemiBold text-[14px] text-fontColorPrimary">
              No cashback found!
            </h2>
            <p className="text-xs text-[#9191A4]">Please try again later.</p>
          </div>
        </div>
      );
    }

    if (refUserData?.cashbackHistory?.length === 0) {
      return (
        <div className="mt-2 flex h-[280px] flex-col items-center justify-center gap-y-2 rounded-[12px] bg-shadeTableHover p-8 text-fontColorSecondary">
          <div className="relative aspect-[60/60] h-auto w-full max-w-[60px] flex-shrink-0">
            <Image
              src="/icons/earn/earn-no-cashback.png"
              alt="No Cashback Image"
              fill
              quality={100}
              className="object-contain"
            />
          </div>
          <div className="flex flex-col items-center justify-center gap-y-2 text-center">
            <h2 className="font-geistSemiBold text-[14px] text-fontColorPrimary">
              No Cashback Yet
            </h2>
            <p className="text-xs text-[#9191A4]">
              You haven’t earned any cashback yet. Make a transaction and enjoy
              real-time rewards for every eligible purchase.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="nova-scroller max-h-[280px] space-y-2 overflow-y-auto p-3 max-lg:max-h-[272px]">
        {(refUserData?.cashbackHistory || [])?.map((item, index) => (
          <CashBackItem
            key={item.date + index}
            date={item.date}
            volume={item.volume * solPrice}
            multiplier={item.multiplier}
            earnings={item.cashback * solPrice}
          />
        ))}
      </div>
    );
  };

  return (
    <Fragment>
      <div className="relative rounded-t-xl bg-gradient-to-b from-[#242436] to-[#24243600] to-80% p-[1px]">
        <div className="rounded-t-xl bg-shadeTableHover pt-4">
          <h3 className="item-center flex w-full justify-center gap-[56.58px] font-geistBlack text-2xl font-[800] leading-8">
            <span className="bg-gradient-to-r from-[#9191A4] to-[#9191A400] bg-clip-text text-transparent">
              CASH
            </span>
            <span className="bg-gradient-to-r from-[#9191A400] to-[#9191A4] bg-clip-text text-transparent">
              BACK
            </span>
          </h3>
        </div>
        <Image
          className="absolute bottom-[1px] left-[50%] -translate-x-1/2"
          src="/images/decorations/deposit-box.png"
          alt="Deposit Box Image"
          width={56.58}
          height={60}
        />
        <div className="h-[1px] bg-gradient-to-r from-[#24243600] via-[#242436] to-[#24243600]" />
      </div>
      <div className="relative h-fit">
        {refUserData?.cashbackHistory &&
          refUserData?.cashbackHistory?.length > 0 && (
            <>
              <div className="absolute left-0 top-0 z-10 h-8 w-full bg-gradient-to-b from-background to-[#08081100]" />
              <div className="absolute bottom-0 left-0 z-10 h-8 w-full bg-gradient-to-t from-background to-[#08081100]" />
            </>
          )}
        <ListCashback />
      </div>
    </Fragment>
  );
}

interface CashBackItemProps {
  date: string;
  volume: number;
  multiplier: number;
  earnings: number;
}

function CashBackItem({
  date,
  volume,
  multiplier,
  earnings,
}: CashBackItemProps) {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const time = useMemo(() => {
    if (typeof date !== "string") {
      return { day: "--", month: "--", year: "--" };
    }

    // Update the regex to match "31 MAY 2025"
    const match = date.match(/^(\d{2}) ([A-Z]{3,}) (\d{4})/); // Matches "31 MAY 2025"

    if (!match) {
      return { day: "--", month: "--", year: "--" };
    }

    const [_, dayStr, monthStr, yearStr] = match;

    // Find the month index
    const monthIndex = months.findIndex(
      (m) => m.toUpperCase() === monthStr.toUpperCase(),
    );

    if (monthIndex === -1) {
      return { day: "--", month: "--", year: "--" };
    }

    return {
      day: dayStr,
      month: months[monthIndex].toUpperCase(),
      year: yearStr,
    };
  }, [date]);

  return (
    <div className="group flex">
      <div className="flex w-fit gap-3 pr-3">
        <div className="relative isolate h-[62px] w-10 overflow-hidden max-sm:hidden lg:h-[68px]">
          <div className="absolute left-0 top-0 z-10 h-1/4 w-[10px] bg-gradient-to-t from-[#35353D] via-[#282830] to-[#080810] group-hover:from-[#F4D2FF] group-hover:via-[#E284FE] group-hover:to-[#080810]" />
          <div className="absolute right-0 top-[28px] z-10 h-[10px] w-1/4 bg-gradient-to-r from-[#35353D] via-[#282830] to-[#080810] group-hover:from-[#F4D2FF] group-hover:via-[#E284FE] group-hover:to-[#080810] lg:top-[34px]" />
          <div className="absolute -top-6 left-0 h-full w-[150%] rounded-bl-[20px] border-[10px] border-[#35353D] group-hover:border-[#F4D2FF]" />
        </div>

        <div className="relative isolate h-[62px] w-[44px] rounded-[12px] bg-secondary p-2 lg:h-[72px] lg:w-[48px]">
          <div className="absolute -left-[1px] -top-[1px] h-[calc(100%_+_2px)] w-[calc(100%_+_2px)] rounded-[12px] bg-gradient-to-t from-white to-[#DF74FF] opacity-0 shadow-[0_0_5px_1px_#DF74FF] transition-opacity duration-300 group-hover:opacity-100" />

          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-[12px] bg-shadeTable">
            <span className="bg-gradient-to-b from-white to-[#9191A4] to-80% bg-clip-text font-geistMedium text-xl font-[300] leading-8 text-transparent 2xl:text-2xl">
              {time.day}
            </span>

            <span className="font-geistMedium text-xs font-[600] leading-[16px] text-[#9191A4] lg:leading-8 2xl:text-sm">
              {time.month}
            </span>
          </div>
        </div>
      </div>

      <div className="relative isolate h-[62px] w-full overflow-visible rounded-[12px] bg-secondary lg:h-[72px]">
        <div className="absolute -left-[1px] -top-[1px] h-[calc(100%_+_2px)] w-[calc(100%_+_2px)] rounded-[12px] bg-gradient-to-t from-white to-[#DF74FF] opacity-0 shadow-[0_0_5px_1px_#DF74FF] transition-opacity duration-300 group-hover:opacity-100" />

        <div className="absolute inset-0 z-20 flex items-center justify-start gap-2 rounded-[12px] bg-secondary px-4 py-3">
          <div className="flex flex-1 flex-col gap-1">
            <span className="text-nowrap font-geistRegular text-xs text-[#9191A4] 2xl:text-sm">
              Volume
            </span>
            <span className="bg-gradient-to-b from-white to-[#9191A4] to-80% bg-clip-text font-geistRegular text-sm font-[600] leading-[22px] text-transparent 2xl:text-base">
              {formatCurrencyCompact(volume)}
            </span>
          </div>
          <div className="mr-1.5 h-[38px] w-0 border-r border-[#242436]" />
          {/* <div className="flex flex-1 flex-col gap-1"> */}
          {/*   <span className="font-GeistRegular text-xs text-[#9191A4] 2xl:text-sm"> */}
          {/*     Multiplier */}
          {/*   </span> */}
          {/**/}
          {/*   <span */}
          {/*     className="text-nowrap bg-gradient-to-b from-white to-[#FFF3B7] to-80% bg-clip-text font-geistMedium text-sm font-[600] leading-[22px] text-transparent 2xl:text-base" */}
          {/*     style={{ */}
          {/*       textShadow: */}
          {/*         "0px 4px 8px rgba(250, 132, 52, 0.2), 0px 0px 6px rgba(250, 132, 52, 0.4)", */}
          {/*     }} */}
          {/*   > */}
          {/*     {multiplier}X */}
          {/*   </span> */}
          {/* </div> */}
          <div className="mr-1.5 h-[38px] w-0 border-r border-[#242436]" />
          <div className="flex flex-1 flex-col gap-1">
            <span className="font-geistRegular text-xs text-[#9191A4] 2xl:text-sm">
              Earnings
            </span>

            <span className="text-nowrap bg-gradient-to-b from-[#8CD9B6] to-[#4BAA7F] to-80% bg-clip-text font-geistMedium text-sm font-[600] leading-[22px] text-transparent 2xl:text-base">
              {formatAmountDollar(earnings)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function CashBackItemSkeleton() {
  return (
    <div className="group flex animate-pulse">
      <div className="flex w-fit gap-3 pr-3">
        <div className="relative isolate h-[62px] w-10 overflow-hidden max-sm:hidden lg:h-[68px]">
          <div className="absolute left-0 top-0 z-10 h-1/4 w-[10px] bg-gradient-to-t from-[#35353D] via-[#282830] to-[#080810]" />
          <div className="absolute right-0 top-[28px] z-10 h-[10px] w-1/4 bg-gradient-to-r from-[#35353D] via-[#282830] to-[#080810] lg:top-[34px]" />
          <div className="absolute -top-6 left-0 h-full w-[150%] rounded-bl-[20px] border-[10px] border-[#35353D]" />
        </div>

        <div className="relative isolate h-[62px] w-[44px] rounded-[12px] bg-secondary p-2 lg:h-[68px]">
          <div className="absolute -left-[1px] -top-[1px] h-[calc(100%_+_2px)] w-[calc(100%_+_2px)] rounded-[12px] bg-gradient-to-t from-white to-[#DF74FF] opacity-0 shadow-[0_0_5px_1px_#DF74FF] transition-opacity duration-300" />

          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-[12px] bg-shadeTable" />
        </div>
      </div>

      <div className="relative isolate h-[62px] w-full overflow-visible rounded-[12px] bg-secondary lg:h-[68px]" />
    </div>
  );
}

export function formatCurrencyCompact(value: number, prefix = true): string {
  const absValue = Math.abs(value);
  let suffix = "";
  let shortValue = value;

  if (absValue >= 1_000_000_000) {
    shortValue = value / 1_000_000_000;
    suffix = "B";
  } else if (absValue >= 1_000_000) {
    shortValue = value / 1_000_000;
    suffix = "M";
  } else if (absValue >= 1_000) {
    shortValue = value / 1_000;
    suffix = "K";
  }

  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(shortValue);

  if (prefix) return `$${formatted}${suffix}`;

  return `${formatted}${suffix}`;
}

export default memo(EarnCashBack);
