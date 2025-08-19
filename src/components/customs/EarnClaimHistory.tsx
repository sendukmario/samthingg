"use client";

import Image from "next/image";
import { useMemo, Fragment, memo } from "react";
import { useEarnStore } from "@/stores/earn/use-earn.store";

function EarnClaimHistory() {
  const { refUserData, isLoading, isError } = useEarnStore();
  const ListClaimHistory = () => {
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
              src="/icons/earn/earn-no-claim.png"
              alt="No Claim Image"
              fill
              quality={100}
              className="object-contain"
            />
          </div>
          <div className="flex flex-col items-center justify-center gap-y-2 text-center">
            <h2 className="font-geistSemiBold text-[14px] text-fontColorPrimary">
              No claim history found!
            </h2>
            <p className="text-xs text-[#9191A4]">Please try again later.</p>
          </div>
        </div>
      );
    }

    if (refUserData?.claimHistory?.length === 0) {
      return (
        <div className="mt-2 flex h-[280px] flex-col items-center justify-center gap-y-2 rounded-[12px] bg-shadeTableHover p-8 text-fontColorSecondary">
          <div className="relative aspect-[60/60] h-auto w-full max-w-[60px] flex-shrink-0">
            <Image
              src="/icons/earn/earn-no-claim.png"
              alt="No Claim Image"
              fill
              quality={100}
              className="object-contain"
            />
          </div>
          <div className="flex flex-col items-center justify-center gap-y-2 text-center">
            <h2 className="font-geistSemiBold text-[14px] text-fontColorPrimary">
              Nothing to Claim Yet
            </h2>
            <p className="text-xs text-[#9191A4]">
              After you click the claim button, your claims will appear here
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="nova-scroller max-h-[calc(100dvh_-_660px)] space-y-2 overflow-y-auto p-3 max-lg:max-h-[272px]">
        {(refUserData?.claimHistory || [])?.map((item) => (
          <ClaimHistoryItem
            key={item.date}
            date={item.date}
            volume={item.vol}
            multiplier={item.multiplier}
            earnings={item.earnings_usd}
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
              CLAIM
            </span>
            <span className="bg-gradient-to-r from-[#9191A400] to-[#9191A4] bg-clip-text text-transparent">
              HISTORY
            </span>
          </h3>
        </div>
        <Image
          className="absolute bottom-[1px] left-[50%] -translate-x-10"
          src="/images/decorations/clock.png"
          alt="Deposit Box Image"
          width={56.58}
          height={60}
        />
        <div className="h-[1px] bg-gradient-to-r from-[#24243600] via-[#242436] to-[#24243600]" />
      </div>
      <div className="relative h-fit">
        {refUserData?.claimHistory && refUserData?.claimHistory?.length > 0 && (
          <>
            <div className="absolute left-0 top-0 z-10 h-8 w-full bg-gradient-to-b from-background to-[#08081100]" />
            <div className="absolute bottom-0 left-0 z-10 h-8 w-full bg-gradient-to-t from-background to-[#08081100]" />
          </>
        )}
        <ListClaimHistory />
      </div>
    </Fragment>
  );
}

interface ClaimHistoryItemProps {
  date: string;
  volume: number;
  multiplier: number;
  earnings: string;
}

function ClaimHistoryItem({
  date,
  volume,
  multiplier,
  earnings,
}: ClaimHistoryItemProps) {
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

    const match = date.match(/^([A-Z]{3,}) (\d{2})/); // Matches "MAY 08"
    if (!match) {
      return { day: "--", month: "--", year: "--" };
    }

    const [_, monthStr, dayStr] = match;

    const monthIndex = months.findIndex(
      (m) => m.toUpperCase() === monthStr.toUpperCase(),
    );

    if (monthIndex === -1) {
      return { day: "--", month: "--", year: "--" };
    }

    const year = new Date().getFullYear();

    const dateObj = new Date(Date.UTC(year, monthIndex, parseInt(dayStr, 10)));

    return {
      day: dateObj.getUTCDate(),
      month: months[monthIndex].toUpperCase(),
      year: dateObj.getUTCFullYear(),
    };
  }, [date]);

  return (
    <div className="group flex gap-3">
      <div className="relative isolate h-[62px] w-[44px] rounded-[12px] bg-secondary p-2 lg:h-[72px] lg:w-[48px]">
        <div className="absolute -left-[1px] -top-[1px] h-[calc(100%_+_2px)] w-[calc(100%_+_2px)] rounded-[12px] bg-gradient-to-t from-white to-[#DF74FF] opacity-0 shadow-[0_0_5px_1px_#DF74FF] transition-opacity duration-300 group-hover:opacity-100" />

        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-[12px] bg-shadeTable">
          <span className="bg-gradient-to-b from-white to-[#9191A4] to-80% bg-clip-text font-geistMedium text-2xl font-[300] leading-8 text-transparent">
            {time.day}
          </span>

          <span className="font-geistMedium text-xs font-[600] leading-[16px] text-[#9191A4] lg:leading-8">
            {time.month}
          </span>
        </div>
      </div>

      <div className="flex w-full gap-3 pr-3">
        <div className="relative isolate h-[62px] w-full overflow-visible rounded-[12px] bg-secondary lg:h-[72px]">
          <div className="absolute -left-[1px] -top-[1px] h-[calc(100%_+_2px)] w-[calc(100%_+_2px)] rounded-[12px] bg-gradient-to-t from-white to-[#DF74FF] opacity-0 shadow-[0_0_5px_1px_#DF74FF] transition-opacity duration-300 group-hover:opacity-100" />

          <div className="absolute inset-0 z-20 flex items-center justify-start gap-2 rounded-[12px] bg-secondary px-4 py-3">
            <div className="flex flex-1 flex-col">
              <span className="text-nowrap font-geistRegular text-xs text-[#9191A4]">
                Vol.
              </span>
              <span className="bg-gradient-to-b from-white to-[#9191A4] to-80% bg-clip-text font-geistMedium text-base font-[600] leading-[22px] text-transparent">
                {formatCurrencyCompact(volume)}
              </span>
            </div>
            <div className="mr-1.5 h-[38px] w-0 border-r border-[#242436]" />
            <div className="flex flex-1 flex-col">
              <span className="font-geistRegular text-xs text-[#9191A4]">
                Multiplier
              </span>

              <span
                className="text-nowrap bg-gradient-to-b from-white to-[#FFF3B7] to-80% bg-clip-text font-geistMedium text-base font-[600] leading-[22px] text-transparent"
                style={{
                  textShadow:
                    "0px 4px 8px rgba(250, 132, 52, 0.2), 0px 0px 6px rgba(250, 132, 52, 0.4)",
                }}
              >
                {multiplier}X
              </span>
            </div>
            <div className="mr-1.5 h-[38px] w-0 border-r border-[#242436]" />
            <div className="flex flex-1 flex-col">
              <span className="font-geistRegular text-xs text-[#9191A4]">
                Earnings
              </span>

              <span className="text-nowrap bg-gradient-to-b from-[#8CD9B6] to-[#4BAA7F] to-80% bg-clip-text font-geistMedium text-base font-[600] leading-[22px] text-transparent">
                ${earnings}
              </span>
            </div>
          </div>
        </div>

        <div className="relative isolate h-[62px] w-10 overflow-hidden max-sm:hidden lg:h-[68px]">
          <div className="absolute right-0 top-0 z-10 h-1/4 w-[10px] bg-gradient-to-t from-[#35353D] via-[#282830] to-[#080810] group-hover:from-[#F4D2FF] group-hover:via-[#E284FE] group-hover:to-[#080810]" />
          <div className="absolute left-0 top-[28px] z-10 h-[10px] w-1/4 bg-gradient-to-l from-[#35353D] via-[#282830] to-[#080810] group-hover:from-[#F4D2FF] group-hover:via-[#E284FE] group-hover:to-[#080810] lg:top-[34px]" />
          <div className="absolute -top-6 right-0 h-full w-[150%] rounded-br-[20px] border-[10px] border-[#35353D] group-hover:border-[#F4D2FF]" />
        </div>
      </div>
    </div>
  );
}

function CashBackItemSkeleton() {
  return (
    <div className="group flex animate-pulse gap-3">
      <div className="relative isolate h-[62px] w-[44px] rounded-[12px] bg-secondary p-2 lg:h-[68px]">
        <div className="absolute -left-[1px] -top-[1px] h-[calc(100%_+_2px)] w-[calc(100%_+_2px)] rounded-[12px] bg-gradient-to-t from-white to-[#DF74FF] opacity-0 shadow-[0_0_5px_1px_#DF74FF] transition-opacity duration-300" />

        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-[12px] bg-shadeTable" />
      </div>

      <div className="flex w-full gap-3 pr-3">
        <div className="relative isolate h-[62px] w-full overflow-visible rounded-[12px] bg-secondary lg:h-[68px]" />

        <div className="relative isolate h-[62px] w-10 overflow-hidden max-sm:hidden lg:h-[68px]">
          <div className="absolute right-0 top-0 z-10 h-1/4 w-[10px] bg-gradient-to-t from-[#35353D] via-[#282830] to-[#080810]" />
          <div className="absolute left-0 top-[28px] z-10 h-[10px] w-1/4 bg-gradient-to-l from-[#35353D] via-[#282830] to-[#080810] lg:top-[34px]" />
          <div className="absolute -top-6 right-0 h-full w-[150%] rounded-br-[20px] border-[10px] border-[#35353D]" />
        </div>
      </div>
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

  const formatted = new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(shortValue);

  if (prefix) return `$${formatted}${suffix}`;

  return `${formatted}${suffix}`;
}

export default memo(EarnClaimHistory);
