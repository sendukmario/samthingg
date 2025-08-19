"use client";

import Image from "next/image";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { memo, useMemo } from "react";
import { formatAmountDollar } from "@/utils/formatAmount";
import { ReferralHistory, ReferralUserData } from "@/apis/rest/earn-new";
import { useSolPriceMessageStore } from "@/stores/use-solprice-message.store";
import { InfoIcon } from "lucide-react";

function EarnReferralHistory({
  isLoading,
  isError,
  refUserData,
}: {
  refUserData: ReferralUserData;
  isLoading: boolean;
  isError: boolean;
}) {
  const solPrice = useSolPriceMessageStore((state) => state.messages.price);
  const highestReferral = useMemo(() => {
    if (refUserData && refUserData.referralHistory.length > 0) {
      return getHighestRefferal(
        refUserData?.referralHistory as ReferralHistory[],
      ).referrals;
    }
    return 0;
  }, [refUserData]);

  const refStats = useMemo(() => {
    if (refUserData) {
      return extractReferralData(refUserData);
    }
    return {
      amountOfReferrals: 0,
      referredVolume: 0,
      totalEarnings: 0,
      totalUsersTier1: 0,
      totalUsersTier2: 0,
      totalUsersTier3: 0,
    };
  }, [refUserData]);

  const ListHistory = () => {
    if (isLoading) {
      return (
        <div className="nova-scroller max-h-[calc(100dvh_-_660px)] space-y-3 overflow-y-auto overflow-x-hidden py-3 max-lg:max-h-[280px]">
          {Array.from({ length: 5 })?.map((_, index) => (
            <ReferralHistoryItemSkeleton key={index} />
          ))}
        </div>
      );
    }

    if (isError) {
      return (
        <>
          <div className="flex h-[280px] flex-col items-center justify-center gap-y-2 rounded-[12px] bg-shadeTable p-8 text-fontColorSecondary">
            <div className="relative aspect-[60/60] h-auto w-full max-w-[60px] flex-shrink-0">
              <Image
                src="/icons/earn/earn-no-history.png"
                alt="No Result Image"
                fill
                quality={100}
                className="object-contain"
              />
            </div>
            <div className="flex flex-col items-center justify-center gap-y-2 text-center">
              <h2 className="font-geistSemiBold text-[14px] text-fontColorPrimary">
                No referral history found!
              </h2>
              <p className="text-xs text-[#9191A4]">Please try again later.</p>
            </div>
          </div>
        </>
      );
    }

    if (refUserData?.referralHistory.length === 0) {
      return (
        <div className="flex h-[280px] flex-col items-center justify-center gap-y-2 rounded-[12px] bg-shadeTable p-8 text-fontColorSecondary">
          <div className="relative aspect-[60/60] h-auto w-full max-w-[60px] flex-shrink-0">
            <Image
              src="/icons/earn/earn-no-history.png"
              alt="No Result Image"
              fill
              quality={100}
              className="object-contain"
            />
          </div>
          <div className="flex flex-col items-center justify-center gap-y-2 text-center">
            <h2 className="font-geistSemiBold text-[14px] text-fontColorPrimary">
              No Referral History
            </h2>
            <p className="text-xs text-[#9191A4]">
              Start referring your friends and earn rewards along the way. Your
              history will appear here once referrals roll in.
            </p>
          </div>
        </div>
      );
    }

    return (
      // <div className="nova-scroller max-h-[calc(100dvh_-_630px)] space-y-2 overflow-y-auto overflow-x-hidden py-2 max-lg:max-h-[260px]">
      //   {refUserData?.referralHistory?.map?.((item, index) => {
      //     const isHighest = item.referrals === highestReferral;
      //     return (
      //       <ReferralHistoryItem
      //         key={item.date + index}
      //         date={item.date}
      //         referrals={item.referrals}
      //         baseAmount={item.baseAmount * solPrice}
      //         isHighest={isHighest}
      //       />
      //     );
      //   })}
      // </div>
      <div className="flex h-[280px] flex-col items-center justify-center gap-y-2 rounded-[12px] bg-shadeTable p-8 text-fontColorSecondary">
        <div className="relative aspect-[60/60] h-auto w-full max-w-[60px] flex-shrink-0">
          <Image
            src="/icons/earn/earn-no-history.png"
            alt="No Result Image"
            fill
            quality={100}
            className="object-contain"
          />
        </div>
        <div className="flex flex-col items-center justify-center gap-y-2 text-center">
          <h2 className="animate-pulse font-geistSemiBold text-[14px] text-fontColorPrimary">
            Coming Soon
          </h2>
          {/* <p className="text-xs text-[#9191A4]">
            Start referring your friends and earn rewards along the way. Your
            history will appear here once referrals roll in.
          </p> */}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 overflow-visible">
      <div className="flex flex-col items-center gap-2 md:flex-row">
        <h3 className="text-nowrap font-geistSemiBold text-xl text-fontColorPrimary xl:text-2xl">
          Referral History
        </h3>
        <div className="flex w-full gap-2">
          {Array.from({ length: 3 })?.map((_, index) => (
            <EarnReferralTierCard
              key={index}
              id={`earn-referral-tier-${index + 1}`}
              amount={
                index + 1 === 1
                  ? refStats.totalUsersTier1
                  : index + 1 === 2
                    ? refStats.totalUsersTier2
                    : refStats.totalUsersTier3
              }
            />
          ))}
        </div>
      </div>

      <ReferralHistoryCard
        loading={isLoading}
        amount={refStats.amountOfReferrals || 0}
        volume={refStats.referredVolume || 0}
        earnings={refStats.totalEarnings * solPrice || 0}
      />

      <div className="relative h-fit">
        {refUserData?.referralHistory.length > 0 && (
          <>
            <div className="absolute left-0 top-0 z-10 h-8 w-full bg-gradient-to-b from-background to-[#08081100]" />
            <div className="absolute bottom-0 left-0 z-10 h-8 w-full bg-gradient-to-t from-background to-[#08081100]" />
          </>
        )}

        <ListHistory />
      </div>
    </div>
  );
}

interface ReferralHistoryCardProps {
  loading?: boolean;
  amount: number;
  volume: number;
  earnings: number;
}

function ReferralHistoryCard({
  loading,
  amount,
  volume,
  earnings,
}: ReferralHistoryCardProps) {
  return (
    <div className="flex h-[76px] w-full items-center justify-start gap-4 rounded-[14px] border border-border bg-secondary px-3 py-2 max-sm:h-fit max-sm:flex-col max-sm:items-start xl:px-4">
      <div className="flex flex-1 flex-col gap-1 p-2 xl:gap-1.5 xl:p-4">
        <span className="whitespace-nowrap font-geistRegular text-xs text-[#9191A4] xl:text-sm">
          Amount of Referrals
        </span>
        {loading ? (
          <span className="h-5 w-2/3 rounded-md bg-gradient-to-r from-[#FFFFFF05] to-[#FFFFFF14] lg:h-8" />
        ) : (
          <span className="bg-gradient-to-b from-white to-[#9191A4] to-80% bg-clip-text font-geistSemiBold text-[18px] font-[600] leading-6 text-transparent lg:text-[24px] lg:leading-8 xl:text-[28px]">
            {amount}
          </span>
        )}
      </div>
      <div className="h-0 w-full border-t border-[#242436] sm:h-[28px] sm:w-0 sm:border-r sm:border-t-0" />
      <div className="flex flex-1 flex-col gap-1 p-2 xl:gap-1.5 xl:p-4">
        <span className="whitespace-nowrap font-geistRegular text-xs text-[#9191A4] xl:text-sm">
          Referred Volume
        </span>
        {loading ? (
          <span className="h-5 w-2/3 rounded-md bg-gradient-to-r from-[#FFFFFF05] to-[#FFFFFF14] lg:h-8" />
        ) : (
          // <span className="bg-gradient-to-b from-white to-[#9191A4] to-80% bg-clip-text font-geistSemiBold text-[18px] font-[600] leading-6 text-transparent lg:text-[24px] lg:leading-8 xl:text-[28px]">
          //   {formatAmountDollar(volume)}
          // </span>
          <span className="animate-pulse bg-gradient-to-b from-white to-[#9191A4] to-80% bg-clip-text font-geistSemiBold text-[14px] font-[600] leading-6 text-transparent lg:text-[20px] lg:leading-8 xl:text-[24px]">
            Coming Soon
          </span>
        )}
      </div>
      <div className="h-0 w-full border-t border-[#242436] sm:h-[28px] sm:w-0 sm:border-r sm:border-t-0" />
      <div className="flex flex-1 flex-col gap-1 p-2 xl:gap-1.5 xl:p-4">
        <span className="whitespace-nowrap font-geistRegular text-xs text-[#9191A4] xl:text-sm">
          Earnings
        </span>
        {loading ? (
          <span className="h-5 w-2/3 rounded-md bg-gradient-to-r from-[#FFFFFF05] to-[#FFFFFF14] lg:h-8" />
        ) : (
          // <span className="bg-gradient-to-b from-[#8CD9B6] via-[#8CD9B6] via-[30%] to-[#4BAA7F] bg-clip-text font-geistSemiBold text-[18px] font-[600] leading-6 text-transparent lg:text-[28px] lg:leading-8">
          //   {formatCurrencyCompact(earnings)}
          // </span>
          <span className="animate-pulse bg-gradient-to-b from-white to-[#9191A4] to-80% bg-clip-text font-geistSemiBold text-[14px] font-[600] leading-6 text-transparent lg:text-[20px] lg:leading-8 xl:text-[24px]">
            Coming Soon
          </span>
        )}
      </div>
    </div>
  );
}

interface ReferralHistoryItemProps {
  date: string;
  referrals: number;
  baseAmount: number;
  isHighest?: boolean;
}

function ReferralHistoryItem({
  date,
  referrals,
  baseAmount,
  isHighest = false,
}: ReferralHistoryItemProps) {
  const time = useMemo(() => {
    const historyDate = new Date(Number(date) * 1000);
    const day = historyDate.getDate();
    const month = historyDate.toLocaleString("en-US", { month: "short" });
    const year = historyDate.getFullYear();

    return {
      day,
      month: month.toUpperCase(),
      year,
    };
  }, [date]);

  // const { baseAmount, usdAmount } = extractAmounts(earnings);
  return (
    <div className="group flex">
      <div className="flex w-fit gap-4 pr-4 sm:w-1/3">
        <div className="relative isolate h-[58px] w-full overflow-hidden max-sm:hidden lg:h-[68px] lg:w-[80%]">
          <div className="absolute left-5 top-0 z-10 h-1/5 w-[10px] bg-gradient-to-t from-[#35353D] via-[#282830] to-[#080810] group-hover:from-[#F4D2FF] group-hover:via-[#E284FE] group-hover:to-[#080810] lg:h-1/4" />
          <div className="absolute right-0 top-[20px] z-10 h-[10px] w-1/3 bg-gradient-to-r from-[#35353D] via-[#282830] to-[#080810] to-[90%] group-hover:from-[#F4D2FF] group-hover:via-[#E284FE] group-hover:to-[#080810] group-hover:to-[90%] lg:top-[30px]" />
          <div className="absolute -top-7 left-5 h-full w-full rounded-bl-[20px] border-[10px] border-[#35353D] group-hover:border-[#F4D2FF]" />
        </div>

        <div className="relative isolate h-[58px] w-[44px] rounded-[12px] bg-secondary p-2 lg:h-[72px] xl:w-[54px]">
          <div className="absolute -left-[1px] -top-[1px] h-[calc(100%_+_2px)] w-[calc(100%_+_2px)] rounded-[12px] bg-gradient-to-t from-white to-[#DF74FF] opacity-0 shadow-[0_0_5px_1px_#DF74FF] transition-opacity duration-300 group-hover:opacity-100" />

          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-[12px] bg-shadeTable">
            <span className="bg-gradient-to-b from-white to-[#9191A4] to-80% bg-clip-text font-geistRegular text-[24px] font-[300] leading-8 text-transparent xl:text-[28px]">
              {time?.day}
            </span>

            <span className="font-geistRegular text-xs font-[600] leading-[16px] text-[#9191A4] lg:leading-8 xl:text-sm">
              {time?.month}
            </span>
          </div>
        </div>
      </div>

      <div className="relative isolate h-[58px] w-full overflow-visible rounded-[12px] bg-secondary sm:w-2/3 md:group-hover:w-[calc(100%*2/3_-_4px)] lg:h-[72px]">
        <div className="absolute -left-[1px] -top-[1px] h-[calc(100%_+_2px)] w-[calc(100%_+_2px)] rounded-[12px] bg-gradient-to-t from-white to-[#DF74FF] opacity-0 shadow-[0_0_5px_1px_#DF74FF] transition-opacity duration-300 group-hover:opacity-100" />

        <div className="absolute inset-0 z-20 flex items-center justify-start rounded-[12px] bg-secondary px-6 py-2.5">
          <div className="absolute right-0 h-full w-[52%] bg-[url('/icons/strips.svg')] bg-cover bg-no-repeat opacity-0 transition-opacity duration-300 group-hover:opacity-[80%]" />

          <div className="flex min-w-[50%] flex-1 flex-col gap-1 lg:gap-2">
            <div className="flex items-center justify-start gap-1">
              <span className="font-geist text-nowrap text-xs text-[#9191A4] xl:text-sm">
                New Referees
              </span>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="relative aspect-square h-4 w-4 flex-shrink-0">
                      <Image
                        src="/icons/info-tooltip.png"
                        alt="Info Tooltip Icon"
                        fill
                        quality={100}
                        className="object-contain"
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>New Referees</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="relative flex items-center justify-start gap-1 xl:gap-2.5">
              <span className="bg-gradient-to-b from-white to-[#9191A4] to-80% bg-clip-text font-geistSemiBold text-base font-[600] leading-[22px] text-transparent lg:text-xl lg:leading-8 xl:text-2xl">
                {referrals}
              </span>
              {isHighest ? (
                <span className="text-nowrap rounded-full bg-[#2A2A32] px-2 py-1 font-geistSemiBold text-xs font-[600] leading-[18px] text-white xl:px-3 xl:text-base">
                  🔥 Highest
                </span>
              ) : null}
            </div>
          </div>
          <div className="flex flex-1 flex-col gap-1 lg:gap-2">
            <div className="flex items-center justify-start gap-1">
              <span className="font-geistRegular text-xs text-[#9191A4] xl:text-sm">
                Earnings
              </span>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="relative aspect-square h-4 w-4 flex-shrink-0">
                      <Image
                        src="/icons/info-tooltip.png"
                        alt="Info Tooltip Icon"
                        fill
                        quality={100}
                        className="object-contain"
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Earnings</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-nowrap bg-gradient-to-b from-[#8CD9B6] via-[#8CD9B6] via-[30%] to-[#4BAA7F] to-80% bg-clip-text font-geistSemiBold text-base font-[600] leading-[22px] text-transparent lg:text-xl lg:leading-8 xl:text-2xl">
                +{formatAmountDollar(baseAmount)}
              </span>
              {/* <span className="text-nowrap bg-gradient-to-b from-[#8CD9B6] via-[#8CD9B6] via-[30%] to-[#4BAA7F] to-80% bg-clip-text font-geistSemiBold text-xs font-[600] leading-[22px] text-transparent lg:text-sm lg:leading-8 xl:text-2xl"> */}
              {/*   (${usdAmount}) */}
              {/* </span> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReferralHistoryItemSkeleton() {
  return (
    <div className="group flex animate-pulse">
      <div className="flex w-fit gap-3 pr-3 sm:w-1/3">
        <div className="relative isolate h-[58px] w-full overflow-hidden max-sm:hidden lg:h-[68px]">
          <div className="lg:1/4 absolute left-5 top-0 z-10 h-1/5 w-[10px] bg-gradient-to-t from-[#35353D] via-[#282830] to-[#080810]" />
          <div className="absolute right-0 top-[20px] z-10 h-[10px] w-1/4 bg-gradient-to-r from-[#35353D] via-[#282830] to-[#080810] lg:top-[30px]" />
          <div className="absolute -top-7 left-5 h-full w-full rounded-bl-[20px] border-[10px] border-[#35353D]" />
        </div>

        <div className="relative isolate h-[58px] w-[44px] rounded-[12px] bg-secondary p-2 lg:h-[68px]"></div>
      </div>

      <div className="relative isolate h-[58px] w-full overflow-visible rounded-[12px] bg-secondary sm:w-2/3 lg:h-[68px]"></div>
    </div>
  );
}

function EarnReferralTierCard({ id, amount }: { id: string; amount: number }) {
  const extractedNumber = id.split("-").pop();
  return (
    <div className="flex items-center gap-2 rounded-[8px] border border-border bg-white/[4%] py-1.5 pl-2 pr-3 max-md:w-full md:w-[120px]">
      <div className="relative flex size-6 items-center justify-center overflow-hidden rounded-full md:size-7">
        {/* Layer 1: Linear Gradient */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#301D5A] to-[#673EC0] opacity-[20%]" />

        {/* Layer 2: Radial Gradient overlay */}
        <div className="absolute inset-0 rounded-full border border-white/[25%] bg-[radial-gradient(circle,_transparent_30%,_rgba(229,136,255,0.25)_120%)]" />

        <span className="relative z-10 text-xs md:text-sm">
          {Number(extractedNumber) === 1
            ? "👥"
            : Number(extractedNumber) === 2
              ? "🔁"
              : "🌐"}
        </span>
      </div>
      <div className="flex flex-col gap-0.5">
        <div className="flex gap-1">
          <span className="whitespace-nowrap font-geistRegular text-xs text-fontColorSecondary">
            Tier {extractedNumber}
          </span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <InfoIcon
                  className="text-xs text-fontColorSecondary"
                  size={12}
                />
              </TooltipTrigger>
              <TooltipContent>
                {Number(extractedNumber) === 1
                  ? "Direct Referrals"
                  : Number(extractedNumber) === 2
                    ? "Indirect Referrals"
                    : "Extended Referrals"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <span className="font-geistSemiBold text-sm text-fontColorPrimary">
          {new Intl.NumberFormat("us-US", {}).format(amount)}
        </span>
      </div>
    </div>
  );
}

export function formatCurrencyCompact(value: number): string {
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

  const formatted = new Intl.NumberFormat("us-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(shortValue);

  return `$${formatted}${suffix}`;
}

const extractReferralData = (data: ReferralUserData) => {
  // Calculate the total number of referrals across all tiers and versions
  const totalReferrals =
    data.referrals.v1.tier1Users +
    data.referrals.v2.tier1Users +
    data.referrals.v1.tier2Users +
    data.referrals.v2.tier2Users +
    data.referrals.v1.tier3Users +
    data.referrals.v2.tier3Users;

  // Calculate the total volume across all tiers and versions
  const totalVolume =
    data.referrals.v1.tier1Volume +
    data.referrals.v1.tier2Volume +
    data.referrals.v1.tier3Volume +
    data.referrals.v2.tier1Volume +
    data.referrals.v2.tier2Volume +
    data.referrals.v2.tier3Volume;

  const totalUsersTier1 =
    data.referrals.v1.tier1Users + data.referrals.v2.tier1Users;
  const totalUsersTier2 =
    data.referrals.v1.tier2Users + data.referrals.v2.tier2Users;
  const totalUsersTier3 =
    data.referrals.v1.tier3Users + data.referrals.v2.tier3Users;

  return {
    amountOfReferrals: totalReferrals,
    referredVolume: totalVolume,
    totalEarnings: data.totalEarnings, // Adding existing v1Earnings
    totalUsersTier1: totalUsersTier1,
    totalUsersTier2: totalUsersTier2,
    totalUsersTier3: totalUsersTier3,
  };
};

const getHighestRefferal = (data: ReferralHistory[]) => {
  return data.reduce((max, current) => {
    return current.referrals > max.referrals ? current : max;
  }, data[0]);
};

export default memo(EarnReferralHistory);
