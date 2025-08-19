"use client";

import Separator from "@/components/customs/Separator";
import { cn } from "@/libraries/utils";
import { usePopupStore } from "@/stores/use-popup-state.store";
import {
  formatAmountDollar,
  formatAmountWithoutLeadingZero,
} from "@/utils/formatAmount";
import { truncateString } from "@/utils/truncateString";
import Image from "next/image";
import { useMostProfitableTableSettingStore } from "@/stores/table/wallet-trade/use-most-profitable-table-setting.store";
import { useSolPriceMessageStore } from "@/stores/use-solprice-message.store";
import { useMemo } from "react";
import AvatarWithBadges, { BadgeType } from "../../AvatarWithBadges";
import { CachedImage } from "../../CachedImage";
import Copy from "../../Copy";
import PnLScreenshot from "../../token/PnL/PnLScreenshot";
import { useCustomizeTheme } from "@/hooks/use-customize-theme";
import { TokenPnL } from "@/apis/rest/wallet-trade-new";

interface MostProfitableCardProps {
  isModalContent?: boolean;
  data: TokenPnL;
}

type MostProfitableCardContentProps = MostProfitableCardProps & {
  style?: React.CSSProperties;
  remainingScreenWidth: number;
  badgeType?: BadgeType;
  pnlCurrency: string;
  solPrice: number;
  formattedValues: {
    boughtUsd: string;
    soldUsd: string;
    pnl: string;
    pnlSol: string;
    truncatedName: string;
  };
  pnlData: {
    profitAndLoss: number;
    profitAndLossRaw: number;
    profitAndLossPercentage: string;
    sold: number;
    soldDRaw: number;
    invested: number;
    investedDRaw: number;
    remaining: number;
    remainingDRaw: number;
  };
};

const MostProfitableCardDesktopContent = ({
  data,
  badgeType,
  pnlCurrency,
  formattedValues,
  pnlData,
  solPrice,
}: MostProfitableCardContentProps) => {
  const pnlUsd = useMemo(() => {
    return data.sold_usd - data.invested_usd;
  }, [data.invested_usd, data.sold_usd]);

  return (
    <>
      <div className="hidden h-full w-full min-w-[220px] items-center md:flex">
        <div className="flex items-center gap-x-2">
          <AvatarWithBadges
            classNameParent={`size-8`}
            symbol={data.symbol}
            src={data.image || undefined}
            alt={`${data.name} Image`}
            rightType={badgeType}
          />
          <div className="flex-col">
            <div className="flex max-w-full gap-2">
              <h1 className="text-nowrap font-geistBold text-xs text-fontColorPrimary">
                {formattedValues.truncatedName}
              </h1>
              <h2 className="line-clamp-1 truncate text-nowrap font-geistLight text-xs text-fontColorSecondary">
                {data.symbol}
              </h2>
            </div>
            <div className="flex gap-x-2 overflow-hidden">
              <p className="font-geistRegular text-xs text-fontColorSecondary">
                {data?.pool?.mint.slice(0, 6)}...
                {data?.pool?.mint.slice(-4)}
              </p>
              <Copy value={data?.pool?.mint} withAnimation={false} />
            </div>
          </div>
        </div>
      </div>
      <div className="hidden h-full w-full min-w-[95px] items-center md:flex">
        <span className="inline-block text-nowrap font-geistSemiBold text-sm text-success">
          {formattedValues.boughtUsd}
        </span>
      </div>
      <div className="hidden h-full w-full min-w-[95px] items-center md:flex">
        <span className="inline-block text-nowrap font-geistSemiBold text-sm text-destructive">
          {formattedValues.soldUsd}
        </span>
      </div>
      <div className="hidden h-full w-full min-w-[115px] items-center md:flex">
        <div className="flex items-center gap-x-[4px]">
          <div className="relative aspect-auto h-[16px] w-[16px] flex-shrink-0">
            <CachedImage
              src={
                pnlCurrency === "SOL"
                  ? "/icons/solana-sq.svg"
                  : "/icons/usdc-colored.svg"
              }
              alt={`${pnlCurrency} Icon`}
              fill
              quality={50}
              className="object-contain"
            />
          </div>
          <span
            className={cn(
              "inline-block text-nowrap font-geistSemiBold text-sm",
              pnlUsd >= 0 ? "text-success" : "text-destructive",
            )}
          >
            {formattedValues.pnlSol}
          </span>
        </div>
      </div>
      <div className="hidden h-full w-full min-w-[104px] items-center md:flex">
        <span
          className={cn(
            "inline-block text-nowrap font-geistSemiBold text-sm",
            pnlUsd >= 0 ? "text-success" : "text-destructive",
          )}
        >
          {pnlData.profitAndLossPercentage}
        </span>
      </div>
      <div className="hidden h-full w-full min-w-[140px] items-center md:flex">
        <div className="flex items-center">
          <PnLScreenshot
            title={data.name}
            image={data.image || undefined}
            isWithDialog
            profitAndLoss={pnlData.profitAndLoss}
            profitAndLossUsdRaw={pnlData.profitAndLossRaw}
            profitAndLossPercentage={pnlData.profitAndLossPercentage}
            invested={pnlData.invested}
            soldDRaw={pnlData.soldDRaw}
            invevtedDRaw={pnlData.investedDRaw}
            sold={pnlData.sold}
            remaining={pnlData.remaining}
            solPrice={solPrice}
            trigger={
              <button
                //onClick={handlePnLButtonClick}
                className={cn(
                  "flex h-[28px] items-center gap-x-1.5 rounded-[4px] px-2 py-1",
                  pnlUsd >= 0 ? "bg-success" : "bg-destructive",
                )}
              >
                <span className="inline-block text-nowrap font-geistSemiBold text-sm text-[#10101E]">
                  P&L
                </span>
                <Separator
                  color="#202037"
                  orientation="vertical"
                  unit="fixed"
                  fixedHeight={20}
                  className="opacity-30"
                />
                <div className="relative aspect-square h-5 w-5 flex-shrink-0">
                  <Image
                    src="/icons/chevron-black.png"
                    alt="Chevron Black"
                    fill
                    quality={100}
                    className="object-contain"
                  />
                </div>
              </button>
            }
          />
        </div>
      </div>
    </>
  );
};

const MostProfitableCardMobileContent = ({
  remainingScreenWidth,
  data,
  badgeType,
  pnlCurrency,
  formattedValues,
  pnlData,
  solPrice,
  isModalContent,
}: MostProfitableCardContentProps) => {
  const pnlUsd = useMemo(() => {
    return data.sold_usd - data.invested_usd;
  }, [data.invested_usd, data.sold_usd]);

  return (
    <div
      className={cn(
        "flex w-full flex-col md:hidden",
        remainingScreenWidth < 800 && !isModalContent && "md:flex",
      )}
    >
      {/* Header */}
      <div className="relative flex h-12 w-full items-center justify-between overflow-hidden bg-white/[4%] px-3 py-3">
        <div className="flex items-center gap-x-2">
          <AvatarWithBadges
            classNameParent={`size-8`}
            symbol={data.symbol}
            src={data.image || undefined}
            alt={`${data.name} Image`}
            rightType={badgeType}
          />
          <div className="flex-col">
            <div className="flex gap-2">
              <h1 className="text-nowrap font-geistBold text-xs text-fontColorPrimary">
                {formattedValues.truncatedName}
              </h1>
              <h2 className="text-nowrap font-geistLight text-xs text-fontColorSecondary">
                {data.symbol}
              </h2>
            </div>
            <div className="flex gap-x-2 overflow-hidden">
              <p className="font-geistRegular text-xs text-fontColorSecondary">
                {data?.pool?.mint.slice(0, 6)}...
                {data?.pool?.mint.slice(-4)}
              </p>
              <Copy value={data?.pool?.mint} withAnimation={false} />
            </div>
          </div>
        </div>
      </div>

      {/* Market Data Grid */}
      <div className="flex justify-around gap-2.5 p-3">
        <div className="flex flex-col gap-y-1">
          <span className="text-nowrap text-xs text-fontColorSecondary">
            Bought
          </span>
          <span className="font-geistSemiBold text-sm text-success">
            {formattedValues.boughtUsd}
          </span>
        </div>

        <div className="flex flex-col gap-y-1">
          <span className="text-nowrap text-xs text-fontColorSecondary">
            Sold
          </span>
          <span className="font-geistSemiBold text-sm text-destructive">
            {formattedValues.soldUsd}
          </span>
        </div>

        <div className="flex flex-col gap-y-1">
          <span className="text-nowrap text-xs text-fontColorSecondary">
            P&L
          </span>
          <div className="flex items-center gap-x-1">
            <div className="relative aspect-auto h-[16px] w-[16px]">
              <CachedImage
                src={
                  pnlCurrency === "SOL"
                    ? "/icons/solana-sq.svg"
                    : "/icons/usdc-colored.svg"
                }
                alt={`${pnlCurrency} Icon`}
                fill
                quality={50}
                className="object-contain"
              />
            </div>
            <span
              className={cn(
                "font-geistSemiBold text-sm",
                pnlUsd >= 0 ? "text-success" : "text-destructive",
              )}
            >
              {formattedValues.pnlSol}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-y-1">
          <span className="text-nowrap text-xs text-fontColorSecondary">
            P&L %
          </span>
          <span
            className={cn(
              "font-geistSemiBold text-sm",
              pnlUsd >= 0 ? "text-success" : "text-destructive",
            )}
          >
            {pnlData.profitAndLossPercentage}
          </span>
        </div>

        <div className="flex items-end">
          <PnLScreenshot
            title={data.name}
            image={data.image || undefined}
            isWithDialog
            profitAndLoss={pnlData.profitAndLoss}
            profitAndLossUsdRaw={pnlData.profitAndLossRaw}
            profitAndLossPercentage={pnlData.profitAndLossPercentage}
            invested={pnlData.invested}
            soldDRaw={pnlData.soldDRaw}
            invevtedDRaw={pnlData.investedDRaw}
            sold={pnlData.sold}
            remaining={pnlData.remaining}
            solPrice={solPrice}
            trigger={
              <button
                //onClick={handlePnLButtonClick}
                className={cn(
                  "flex h-[28px] items-center gap-x-1.5 rounded-[4px] px-2 py-1",
                  pnlUsd >= 0 ? "bg-success" : "bg-destructive",
                )}
              >
                <span className="inline-block text-nowrap font-geistSemiBold text-sm text-[#10101E]">
                  P&L
                </span>
                <Separator
                  color="#202037"
                  orientation="vertical"
                  unit="fixed"
                  fixedHeight={20}
                  className="opacity-30"
                />
                <div className="relative aspect-square h-5 w-5 flex-shrink-0">
                  <Image
                    src="/icons/chevron-black.png"
                    alt="Chevron Black"
                    fill
                    quality={100}
                    className="object-contain"
                  />
                </div>
              </button>
            }
          />
        </div>
      </div>
    </div>
  );
};

export default function MostProfitableCard({
  isModalContent = true,
  data,
}: MostProfitableCardProps) {
  const { remainingScreenWidth } = usePopupStore();
  const { pnlCurrency } = useMostProfitableTableSettingStore();
  const theme = useCustomizeTheme();
  const solPrice = useSolPriceMessageStore((state) => state.messages.price);
  // const pnlUsd = useMemo(() => {
  //   return data.realized_pnl_base * solPrice;
  // }, [data.realized_pnl_base, solPrice]);
  // const [showPnLContent, setShowPnLContent] = useState(false);

  // Memoize the badge type based on dex and launchpad
  // const badgeType = useMemo(() => {
  //   if (data.launchpad) return "launchlab";
  //   if (data.dex?.toLowerCase().includes("pump")) return "pumpswap";
  //   if (data.dex?.toLowerCase().includes("raydium")) return "raydium";
  //   if (data.dex?.toLowerCase().includes("meteora")) return "meteora_amm";
  //   if (data.dex?.toLowerCase().includes("orca")) return "moonshot";
  //   return "";
  // }, [data.dex, data.launchpad]);

  // Memoize formatted values and calculations
  const formattedValues = useMemo(() => {
    const pnlValue =
      pnlCurrency === "SOL" ? data.realized_pnl_base : data.realized_pnl_usd;

    return {
      boughtUsd: formatAmountDollar(data.invested_usd),
      soldUsd: formatAmountDollar(data.sold_usd),
      pnl:
        pnlCurrency === "SOL"
          ? formatAmountWithoutLeadingZero(pnlValue, 3, 2)
          : formatAmountDollar(pnlValue),
      pnlSol:
        pnlCurrency === "SOL"
          ? formatAmountWithoutLeadingZero(pnlValue, 3, 2)
          : formatAmountDollar(pnlValue),
      truncatedName: truncateString(data.name, 10),
    };
  }, [data.invested_usd, data.realized_pnl_base, data.name, pnlCurrency]);

  // Memoize PnL data for the modal
  const pnlData = useMemo(() => {
    const soldInSol = data.sold_base;
    const investedInSol = data.invested_base || 0;
    const remainingInSol = data.balance * data.current_price.price_base;
    const remainingInUsd =  data.balance * data.current_price.price_usd

    const pnlPercentage = data.realized_pnl_percentage * 100 || 0;
    const pnlInSol = data.realized_pnl_base;

    return {
      profitAndLoss: pnlInSol,
      profitAndLossRaw: data.realized_pnl_usd,
      profitAndLossPercentage: `${pnlPercentage?.toFixed(2)}%`,
      sold: soldInSol,
      soldDRaw: data.sold_usd,
      invested: investedInSol,
      investedDRaw: data.invested_usd,
      remaining: remainingInSol,
      remainingDRaw: remainingInUsd,
    };
  }, [data]);

  // const handlePnLButtonClick = useCallback(() => {
  //   setShowPnLContent(true);
  // }, []);

  // const handleClosePnLContent = useCallback(() => {
  //   setShowPnLContent(false);
  // }, []);

  return (
    <>
      <div
        className={cn(
          "items-center overflow-hidden",
          "max-md:rounded-[8px] max-md:border max-md:border-border",
          "md:flex md:h-[56px] md:min-w-max md:rounded-none md:pl-4 md:hover:bg-white/[4%]",
          remainingScreenWidth < 800 &&
            !isModalContent &&
            "mb-2 border border-border md:h-fit md:pl-0 xl:rounded-[8px]",
        )}
      >
        {remainingScreenWidth < 800 && !isModalContent ? null : (
          <MostProfitableCardDesktopContent
            data={data}
            pnlData={pnlData}
            isModalContent={isModalContent}
            remainingScreenWidth={remainingScreenWidth}
            solPrice={solPrice}
            formattedValues={formattedValues}
            pnlCurrency={pnlCurrency}
            // badgeType={badgeType}
          />
        )}
        <MostProfitableCardMobileContent
          data={data}
          pnlData={pnlData}
          isModalContent={isModalContent}
          remainingScreenWidth={remainingScreenWidth}
          solPrice={solPrice}
          formattedValues={formattedValues}
          pnlCurrency={pnlCurrency}
          // badgeType={badgeType}
          style={theme.background}
        />
      </div>
    </>
  );
}
