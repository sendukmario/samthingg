"use client";

import { cn } from "@/libraries/utils";
import { usePopupStore } from "@/stores/use-popup-state.store";
import {
  formatAmountDollar,
  formatAmountWithoutLeadingZero,
} from "@/utils/formatAmount";
import { truncateAddress } from "@/utils/truncateAddress";
import { truncateString } from "@/utils/truncateString";
import { useMemo } from "react";
import AddressWithEmojis from "../../AddressWithEmojis";
import AvatarWithBadges, { BadgeType } from "../../AvatarWithBadges";
import { CachedImage } from "../../CachedImage";
import Copy from "../../Copy";
import SellBuyBadge from "../../SellBuyBadge";
import { useTradeHistoryTableSettingStore } from "@/stores/table/wallet-trade/use-trade-history-table-setting.store";
import { useSolPriceMessageStore } from "@/stores/use-solprice-message.store";
import { useCustomizeTheme } from "@/hooks/use-customize-theme";
import { Transactions } from "@/apis/rest/wallet-trade-new";

type TradeHistoryCardCommonProps = {
  isModalContent?: boolean;
  data: Transactions;
  walletAddress: string;
};

type TradeHistoryCardContentProps = TradeHistoryCardCommonProps & {
  valueCurrency: "USDC" | "SOL";
  totalCurrency: "USDC" | "SOL";
  remainingScreenWidth: number;
  timeAgo: string;
  badgeType?: BadgeType;
  truncatedPairName: string;
  formattedTokenAmount: string;
  formattedValue: string;
  formattedTotal: string;
  style?: React.CSSProperties;
};

const TradeHistoryCardDesktopContent = ({
  isModalContent,
  data,
  formattedValue,
  formattedTotal,
  timeAgo,
  remainingScreenWidth,
  badgeType,
  truncatedPairName,
  valueCurrency,
  totalCurrency,
  formattedTokenAmount,
}: TradeHistoryCardContentProps) => (
  <>
    <div
      className={`${!isModalContent && "lg:min-w-[168px]"} ${remainingScreenWidth < 1280 && !isModalContent && "lg:min-w-[72px]"} w-auto min-w-[72px] px-0`}
    >
      <span className="inline-block text-nowrap font-geistSemiBold text-sm text-fontColorPrimary">
        {timeAgo}
      </span>
    </div>
    <div
      className={cn(
        "hidden h-full w-full min-w-[260px] items-center md:flex",
        !isModalContent && "min-w-[240px] lg:min-w-[260px]",
      )}
    >
      <div className="flex items-center gap-x-2">
        <SellBuyBadge type={data?.method} size="sm" />
        <AvatarWithBadges
          classNameParent={`size-8`}
          symbol={data?.symbol}
          src={data?.image || undefined}
          alt={`${data?.name} Image`}
          rightType={badgeType}
        />
        <div className="flex-col">
          <div className="flex gap-2">
            <h1 className="text-nowrap font-geistBold text-xs text-fontColorPrimary">
              {truncatedPairName}
            </h1>
            <h2 className="text-nowrap font-geistLight text-xs text-fontColorSecondary">
              {data?.symbol}
            </h2>
          </div>
          <div className="scrollbar scrollbar-w-[5px] scrollbar-track-[#1a1b1e]/40 scrollbar-thumb-[#4a4b50] hover:scrollbar-thumb-[#5a5b60] active:scrollbar-thumb-[#6a6b70] flex gap-x-2 overflow-x-auto rounded-[10px]">
            <p className="font-geistRegular text-xs text-fontColorSecondary">
              {data?.pool.mint
                ? `${data?.pool.mint.slice(0, 8)}...${data?.pool.mint.slice(-4)}`
                : "N/A"}
            </p>
            <Copy value={data?.pool.mint} withAnimation={false} />
          </div>
        </div>
      </div>
    </div>
    <div className="hidden h-full w-full min-w-[115px] items-center md:flex lg:min-w-[125px]">
      <div className="flex items-center gap-x-[4px]">
        <div className="relative aspect-auto h-[16px] w-[16px] flex-shrink-0">
          <CachedImage
            src={
              valueCurrency === "SOL"
                ? "/icons/solana-sq.svg"
                : "/icons/usdc-colored.svg"
            }
            alt={`${valueCurrency} Icon`}
            fill
            quality={50}
            className="object-contain"
          />
        </div>
        <span
          className={cn(
            "inline-block text-nowrap font-geistSemiBold text-sm",
            data?.method === "sell"
              ? "text-[#F65B93]"
              : data?.method === "buy"
                ? "text-[#8CD9B6]"
                : "text-fontColorPrimary",
          )}
        >
          {formattedValue}
        </span>
      </div>
    </div>
    <div
      className={cn(
        "hidden h-full w-full min-w-[70px] items-center md:flex lg:min-w-[155px]",
        remainingScreenWidth < 1280 && "lg:min-w-[70px]",
      )}
    >
      <span
        className={cn(
          "text-nowrap font-geistSemiBold text-sm",
          data?.method === "sell"
            ? "text-[#F65B93]"
            : data?.method === "buy"
              ? "text-[#8CD9B6]"
              : "text-fontColorPrimary",
        )}
      >
        {formatAmountWithoutLeadingZero(formattedTokenAmount)}
      </span>
    </div>
    <div className="hidden h-full w-full min-w-[125px] items-center md:flex lg:min-w-[135px]">
      <div className="flex items-center gap-x-[4px]">
        <div className="relative aspect-auto h-[16px] w-[16px] flex-shrink-0">
          <CachedImage
            src={
              totalCurrency === "SOL"
                ? "/icons/solana-sq.svg"
                : "/icons/usdc-colored.svg"
            }
            alt={`${totalCurrency} Icon`}
            fill
            quality={50}
            className="object-contain"
          />
        </div>
        <span
          className={cn(
            "inline-block text-nowrap font-geistSemiBold text-sm",
            data?.method === "sell"
              ? "text-[#F65B93]"
              : data?.method === "buy"
                ? "text-[#8CD9B6]"
                : "text-fontColorPrimary",
          )}
        >
          {formattedTotal}
        </span>
      </div>
    </div>
  </>
);

const TradeHistoryCardMobileContent = ({
  isModalContent,
  data,
  walletAddress,
  formattedValue,
  formattedTotal,
  timeAgo,
  remainingScreenWidth,
  badgeType,
  truncatedPairName,
  valueCurrency,
  totalCurrency,
  formattedTokenAmount,
  style,
}: TradeHistoryCardContentProps) => (
  <div
    className={cn(
      "flex w-full flex-col md:hidden",
      remainingScreenWidth < 768 && !isModalContent && "md:flex",
    )}
    style={style}
  >
    {/* Header */}
    <div className="relative flex h-12 w-full items-center justify-between overflow-hidden bg-white/[4%] px-3 py-3">
      <div className="flex items-center gap-x-3">
        <SellBuyBadge isExpanded type={data?.method} size="sm" />
        <div className="flex items-center gap-x-2">
          <AvatarWithBadges
            classNameParent={`size-8`}
            symbol={data?.symbol}
            src={data?.image || undefined}
            alt={`${data?.name} Image`}
            rightType={badgeType}
          />
          <div className="flex-col">
            <div className="flex gap-2">
              <h1 className="text-nowrap font-geistBold text-xs text-fontColorPrimary">
                {truncatedPairName}
              </h1>
              <h2 className="text-nowrap font-geistLight text-xs text-fontColorSecondary">
                {data?.symbol}
              </h2>
            </div>
            <div className="scrollbar scrollbar-w-[5px] scrollbar-track-[#1a1b1e]/40 scrollbar-thumb-[#4a4b50] hover:scrollbar-thumb-[#5a5b60] active:scrollbar-thumb-[#6a6b70] flex gap-x-2 overflow-x-auto rounded-[10px]">
              <p className="font-geistRegular text-xs text-fontColorSecondary">
                {data?.pool.mint ? truncateAddress(data?.pool.mint) : "N/A"}
              </p>
              {data?.pool.mint && (
                <Copy value={data?.pool.mint} withAnimation={false} />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-x-2">
        <span className="text-xs text-fontColorSecondary">
          {timeAgo}
          <span className="ml-1 font-geistSemiBold text-fontColorPrimary">
            Age
          </span>
        </span>
      </div>
    </div>

    {/* Market Data? Grid */}
    <div className="flex justify-between gap-2.5 p-3">
      <div className="flex flex-col gap-y-1">
        <span className="text-nowrap text-xs text-fontColorSecondary">
          Value
        </span>
        <div className="flex items-center gap-x-1">
          <div className="relative aspect-auto h-[16px] w-[16px]">
            <CachedImage
              src={
                valueCurrency === "SOL"
                  ? "/icons/solana-sq.svg"
                  : "/icons/usdc-colored.svg"
              }
              alt={`${valueCurrency} Icon`}
              fill
              quality={50}
              className="object-contain"
            />
          </div>
          <span
            className={cn(
              "font-geistSemiBold text-sm",
              data?.method === "buy" ? "text-success" : "text-destructive",
            )}
          >
            {formattedValue}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-y-1">
        <span className="text-nowrap text-xs text-fontColorSecondary">
          Tokens
        </span>
        <span
          className={cn(
            "font-geistSemiBold text-sm",
            data?.method === "buy" ? "text-success" : "text-destructive",
          )}
        >
          {formatAmountWithoutLeadingZero(formattedTokenAmount)}
        </span>
      </div>

      <div className="flex flex-col gap-y-1">
        <span className="text-nowrap text-xs text-fontColorSecondary">SOL</span>
        <div className="flex items-center gap-x-1">
          <div className="relative aspect-auto h-[16px] w-[16px]">
            <CachedImage
              src={"/icons/solana-sq.svg"}
              alt={`${totalCurrency} Icon`}
              fill
              quality={50}
              className="object-contain"
            />
          </div>
          <span
            className={cn(
              "font-geistSemiBold text-sm",
              data?.method === "buy" ? "text-success" : "text-destructive",
            )}
          >
            {formattedTotal}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-y-1">
        <span className="text-nowrap text-xs text-fontColorSecondary">
          USDC
        </span>
        <div className="flex items-center gap-x-1">
          <div className="relative aspect-auto h-[16px] w-[16px]">
            <CachedImage
              src={"/icons/usdc-colored.svg"}
              alt={`${totalCurrency} Icon`}
              fill
              quality={50}
              className="object-contain"
            />
          </div>
          <span
            className={cn(
              "font-geistSemiBold text-sm",
              data?.method === "buy" ? "text-success" : "text-destructive",
            )}
          >
            {formatAmountDollar(data?.price_usd)}
          </span>
        </div>
      </div>
    </div>

    <div className="flex items-center justify-end gap-x-1 border-t border-border p-3">
      <AddressWithEmojis
        color="success"
        address={walletAddress ? truncateAddress(walletAddress) : "N/A"}
      />
    </div>
  </div>
);

function TradeHistoryCard({
  isModalContent = true,
  data,
  walletAddress,
}: TradeHistoryCardCommonProps) {
  const { remainingScreenWidth } = usePopupStore();
  const theme = useCustomizeTheme();
  const { valueCurrency, totalCurrency } = useTradeHistoryTableSettingStore();
  const solPrice = useSolPriceMessageStore((state) => state.messages.price);

  // Calculate time ago
  const timeAgo = useMemo(() => {
    const now = Date.now(); // current time in milliseconds

    let rawTimestamp = data?.timestamp || 0;

    // Normalize: if it's in seconds (≤10 digits), convert to ms
    if (typeof rawTimestamp === "number" && String(rawTimestamp).length <= 10) {
      rawTimestamp *= 1000;
    }

    const timestamp = new Date(rawTimestamp).getTime();
    const diff = Math.floor((now - timestamp) / 1000); // in seconds

    if (diff < 60) return `${diff}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
  }, [data?.timestamp]);

  // Get token amount and format it
  const formattedTokenAmount = useMemo(() => {
    return data?.token_amount;
  }, [data?.token_amount]);

  // Memoize the badge type based on dex and launchpad
  // const badgeType = useMemo(() => {
  //   if (!data?.dex && !data) return "";
  //
  //   if (data?.launchpad) return "launchlab";
  //   if (data?.dex?.toLowerCase()?.includes("pump")) return "pumpswap";
  //   if (data?.dex?.toLowerCase()?.includes("raydium")) return "raydium";
  //   if (data?.dex?.toLowerCase()?.includes("meteora")) return "meteora_amm";
  //   if (data?.dex?.toLowerCase()?.includes("orca")) return "moonshot";
  //   return "";
  // }, [data?.dex, data?.launchpad]);

  // Memoize the truncated pair name
  const truncatedPairName = useMemo(() => {
    return truncateString(data?.name, 10); // Adjust maxLength as needed
  }, [data?.pool.mint]);

  // Memoize the formatted value to prevent unnecessary recalculations
  const formattedValue = useMemo(() => {
    // if (isNaN(data.tokenAmount)) return "0";
    //
    // if (valueCurrency === "SOL") {
    //   if (solPrice === 0) return "0";
    //   const solValue = data.tokenAmount / data.price_base;
    //   return formatAmountWithoutLeadingZero(solValue, 4);
    // }
    // // Keep as USD
    // return formatAmountDollar(data.price_usd.toString());
    if (isNaN(data.base_amount)) return "0";
    if (valueCurrency === "USDC") {
      return formatAmountDollar(data.base_amount * data.price_usd);
    }
    return formatAmountWithoutLeadingZero(data.base_amount  * data.price_base);
  }, [valueCurrency, data]);

  const formattedTotal = useMemo(() => {
    // if (isNaN(data.tokenAmount)) return "0";
    //
    // if (valueCurrency === "SOL") {
    //   if (solPrice === 0) return "0";
    //   const solValue = data.tokenAmount / data.price_base;
    //   return formatAmountWithoutLeadingZero(solValue, 4);
    // }
    // // Keep as USD
    // return formatAmountDollar(data.price_usd.toString());
    if (isNaN(data.base_amount)) return "0";
    if (totalCurrency === "USDC") {
      return formatAmountDollar(data.base_amount * data.price_usd);
    }
    return formatAmountWithoutLeadingZero(data.base_amount  * data.price_base);
  }, [totalCurrency, data]);

  return (
    <div
      className={cn(
        "items-center overflow-hidden",
        "max-md:mr-1 max-md:rounded-[8px] max-md:border max-md:border-border",
        "md:flex md:h-[56px] md:min-w-max md:rounded-none md:pl-4 md:hover:bg-white/[4%]",
        remainingScreenWidth < 768 &&
          !isModalContent &&
          "mb-2 border border-border md:h-fit md:pl-0 xl:rounded-[8px]",
        "scrollbar scrollbar-w-[5px] scrollbar-track-[#1a1b1e]/40 scrollbar-thumb-[#4a4b50] hover:scrollbar-thumb-[#5a5b60] active:scrollbar-thumb-[#6a6b70] rounded-[10px]",
      )}
    >
      {remainingScreenWidth < 768 && !isModalContent ? null : (
        <TradeHistoryCardDesktopContent
          isModalContent={isModalContent}
          data={data}
          formattedValue={formattedValue}
          formattedTotal={formattedTotal}
          walletAddress={walletAddress}
          timeAgo={timeAgo}
          truncatedPairName={truncatedPairName}
          valueCurrency={valueCurrency}
          totalCurrency={totalCurrency}
          remainingScreenWidth={remainingScreenWidth}
          formattedTokenAmount={formattedTokenAmount.toString()}
          // badgeType={badgeType}
        />
      )}
      <TradeHistoryCardMobileContent
        isModalContent={isModalContent}
        data={data}
        formattedValue={formattedValue}
        formattedTotal={formattedTotal}
        walletAddress={walletAddress}
        timeAgo={timeAgo}
        truncatedPairName={truncatedPairName}
        valueCurrency={valueCurrency}
        totalCurrency={totalCurrency}
        remainingScreenWidth={remainingScreenWidth}
        formattedTokenAmount={formattedTokenAmount.toString()}
        // badgeType={badgeType}
        style={theme.background}
      />
    </div>
  );
}

//TradeHistoryCardComponent.displayName = "TradeHistoryCard";
export default TradeHistoryCard;
