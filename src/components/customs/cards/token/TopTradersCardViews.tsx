"use client";

import React, { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import AddressWithEmojis from "@/components/customs/AddressWithEmojis";
import GradientProgressBar from "@/components/customs/GradientProgressBar";
import BaseButton from "../../buttons/BaseButton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ChartTraderInfo } from "@/types/ws-general";
import { cn } from "@/libraries/utils";
import {
  formatAmount,
  formatAmountDollar,
  formatAmountWithoutLeadingZero,
} from "@/utils/formatAmount";
import { CachedImage } from "../../CachedImage";
import { truncateString } from "@/utils/truncateString";
import WalletTrackerPopover from "../../tables/token/Trades/WalletTrackerPopover";
import {
  FilterIconSVG,
  SolScanIconSVG,
  WhiteUSDCIconSVG,
  BlueUSDCIconSVG,
  FirstRankIconSVG,
  SecondRankIconSVG,
  ThirdRankIconSVG,
  SolanaIconSVG,
} from "@/components/customs/ScalableVectorGraphics";

interface ViewProps {
  rank: number;
  trader: ChartTraderInfo;
  topTradersBought: string;
  topTradersSold: string;
  topTradersRemaining?: string;
  handleOpenPnL: () => void;
  isTradeMatchWithExistingTrackedWallet:
    | { address: string; name?: string; emoji?: string }
    | undefined;
  remainingScreenWidth?: number;
  remainingSol: number;
  tokenImage?: string;
  handleFilter?: () => void;
}

export const DesktopView = React.memo(
  ({
    rank,
    trader,
    topTradersBought,
    topTradersSold,
    topTradersRemaining,
    handleOpenPnL,
    isTradeMatchWithExistingTrackedWallet,
    remainingSol,
    tokenImage,
    handleFilter,
  }: ViewProps) => {
    const renderImage = useMemo(() => {
      return (
        <>
          {tokenImage && topTradersRemaining === "COIN" ? (
            <div className="relative aspect-auto size-4 flex-shrink-0">
              <CachedImage
                src={tokenImage}
                alt="Token Icon"
                fill
                quality={100}
                className="rounded-full object-contain"
              />
            </div>
          ) : !tokenImage && topTradersRemaining === "COIN" ? (
            <WhiteUSDCIconSVG />
          ) : (
            <SolanaIconSVG />
          )}
        </>
      );
    }, [tokenImage, topTradersRemaining]);

    return (
      <div className="flex h-[46px] w-full">
        <div className="flex h-full w-[72px] flex-shrink-0 items-center justify-center">
          <div>
            {rank <= 3 ? (
              // <div className="relative aspect-square h-9 w-9 flex-shrink-0">
              //   <Image
              //     src={`/icons/token/rank-${rank}.png`}
              //     alt="Rank Icon"
              //     fill
              //     quality={100}
              //     className="object-contain"
              //   />
              // </div>
              <>
                {rank === 1 && <FirstRankIconSVG className="size-9" />}
                {rank === 2 && <SecondRankIconSVG className="size-9" />}
                {rank === 3 && <ThirdRankIconSVG className="size-9" />}
              </>
            ) : (
              <span className="inline-block text-nowrap font-geistSemiBold text-xs text-fontColorSecondary">
                {rank}
              </span>
            )}
          </div>
        </div>

        {isTradeMatchWithExistingTrackedWallet ? (
          <button
            //href={"https://solscan.io/account/" + trader.maker}
            className="flex h-full w-full min-w-[155px] items-center min-[1500px]:min-w-[160px]"
            // target="_blank"
          >
            <div className="flex gap-x-1">
              <AddressWithEmojis
                walletDefault
                address={truncateString(
                  isTradeMatchWithExistingTrackedWallet?.name || "",
                  12,
                )}
                trackedWalletIcon={isTradeMatchWithExistingTrackedWallet?.emoji}
                fullAddress={isTradeMatchWithExistingTrackedWallet.address}
                isWithLink
              />
            </div>
          </button>
        ) : (
          <div className="hidden h-full w-full min-w-[155px] items-center xl:flex min-[1500px]:min-w-[160px]">
            <WalletTrackerPopover
              walletDefault
              circleCount={trader?.buys + trader?.sells}
              isDeveloper={trader.is_developer}
              isFirst={false}
              makerAddress={trader?.maker}
              emojis={[
                ...(trader.animal.length > 0 ? [trader.animal + ".svg"] : []),
                ...(trader.is_insider ? ["white-anonymous.svg"] : []),
                ...(trader.is_sniper ? ["sniper.svg"] : []),
              ]}
            />
          </div>
        )}

        <div className="hidden h-full w-full min-w-[120px] flex-col items-start justify-center xl:flex min-[1500px]:min-w-[155px]">
          <div className="flex items-center gap-x-1">
            {/* <div className="relative aspect-auto size-4 flex-shrink-0">
            <CachedImage
              src={
                topTradersBought === "USDC"
                  ? "/icons/usdc-colored.svg"
                  : "/icons/solana-sq.svg"
              }
              alt={topTradersBought === "USDC" ? "USDC Icon" : "Solana Icon"}
              fill
              quality={100}
              className="object-contain"
            />
          </div> */}
            {topTradersBought === "USDC" ? (
              <BlueUSDCIconSVG />
            ) : (
              <SolanaIconSVG />
            )}
            <span className="inline-block text-nowrap font-geistSemiBold text-xs text-fontColorPrimary">
              {topTradersBought === "USDC"
                ? formatAmountDollar(trader?.bought_usd)
                : formatAmountWithoutLeadingZero(trader?.bought_base)}
            </span>
          </div>
          <span className="inline-block text-nowrap text-xs text-fontColorSecondary">
            {formatAmount(trader?.bought_tokens, 2)} / {trader?.buys} txn
          </span>
        </div>
        <div className="hidden h-full w-full min-w-[120px] flex-col items-start justify-center xl:flex min-[1500px]:min-w-[140px]">
          <div className="flex items-center gap-x-1">
            {/* <div className="relative aspect-auto size-4 flex-shrink-0">
            <CachedImage
              src={
                topTradersSold === "USDC"
                  ? "/icons/usdc-colored.svg"
                  : "/icons/solana-sq.svg"
              }
              alt={topTradersSold === "USDC" ? "USDC Icon" : "Solana Icon"}
              fill
              quality={100}
              className="object-contain"
            />
          </div> */}
            {topTradersSold === "USDC" ? (
              <BlueUSDCIconSVG />
            ) : (
              <SolanaIconSVG />
            )}
            <span className="inline-block text-nowrap font-geistSemiBold text-xs text-fontColorPrimary">
              {topTradersSold === "USDC"
                ? formatAmountDollar(trader?.sold_usd)
                : formatAmountWithoutLeadingZero(trader?.sold_base)}
            </span>
          </div>
          <span className="inline-block text-nowrap text-xs text-fontColorSecondary">
            {formatAmount(trader?.sold_tokens, 2)} / {trader?.sells} txn
          </span>
        </div>
        <div className="hidden h-full w-full min-w-[150px] flex-col justify-center xl:flex min-[1500px]:min-w-[170px]">
          <div className="flex items-center gap-x-1">
            <span
              className={cn(
                "inline-block text-nowrap font-geistSemiBold text-xs text-fontColorPrimary",
                trader?.profit_percentage > 0
                  ? "text-success"
                  : "text-destructive",
              )}
            >
              {trader?.profit_percentage > 0 ? "+" : ""}
              {trader?.profit_percentage.toFixed(2)}%
            </span>
          </div>
          <span className="flex w-fit items-center justify-center gap-x-1 text-nowrap text-xs text-fontColorSecondary">
            <span className="flex w-fit items-center justify-center gap-x-1">
              {/* <div className="relative aspect-auto size-3 flex-shrink-0">
              <CachedImage
                src={"/icons/solana-sq.svg"}
                alt={"Solana Icon"}
                fill
                quality={100}
                className="object-contain"
              />
            </div> */}
              <SolanaIconSVG className="size-3" />
              {formatAmountWithoutLeadingZero(trader?.profit_base)}
            </span>
            <span>/</span>
            <span className="flex w-fit items-center justify-center gap-x-0.5">
              {/* <div className="relative aspect-auto size-3 flex-shrink-0">
              <CachedImage
                src={"/icons/usdc-colored.svg"}
                alt={"USDC Icon"}
                fill
                quality={100}
                className="object-contain"
              />
            </div> */}
              <BlueUSDCIconSVG className="size-3" />
              {formatAmountDollar(trader?.profit_usd)}
            </span>
          </span>
        </div>
        <div className="hidden h-full w-full min-w-[80px] items-center xl:flex min-[1500px]:min-w-[120px]">
          <span className="inline-block text-nowrap font-geistSemiBold text-xs text-fontColorPrimary">
            {trader?.percentage_owned?.toFixed(2)}%
          </span>
        </div>
        <div className="hidden h-full w-full min-w-[120px] flex-col items-start justify-center gap-y-1 xl:flex min-[1500px]:min-w-[145px]">
          <div className="flex items-center gap-x-1">
            <div className="flex items-center gap-x-1">
              <div className="flex items-center justify-center gap-x-1 text-nowrap font-geistSemiBold text-xs text-fontColorPrimary">
                {/* <div className="relative aspect-auto size-4 flex-shrink-0">
                  <CachedImage
                    src={
                      tokenImage && topTradersRemaining === "COIN"
                        ? tokenImage
                        : !tokenImage && topTradersRemaining === "COIN"
                          ? "/icons/usdc.svg"
                          : "/icons/solana-sq.svg"
                    }
                    alt={"Solana Icon"}
                    fill
                    quality={100}
                    className="rounded-full object-contain"
                  />
                </div> */}
                {renderImage}
                {topTradersRemaining === "COIN"
                  ? formatAmount(trader?.token_balance, 2)
                  : formatAmountWithoutLeadingZero(remainingSol, 2)}
              </div>
            </div>
            <span className="flex h-[16px] items-center justify-center text-nowrap rounded-full bg-white/[8%] px-1 py-0.5 font-geistRegular text-xs text-fontColorSecondary">
              {(
                (trader?.token_balance /
                  Math.max(trader?.token_balance, trader?.bought_tokens)) *
                100
              ).toFixed(2)}
              %
            </span>
          </div>

          <GradientProgressBar
            bondingCurveProgress={
              (trader?.token_balance /
                Math.max(trader?.token_balance, trader?.bought_tokens)) *
              100
            }
            className="h-[4px]"
          />
        </div>
        <div className="ml-4 mr-auto flex h-full w-full min-w-[80px] items-center justify-start gap-x-2">
          <div className="flex items-center gap-x-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <BaseButton
                    onClick={handleFilter}
                    size="short"
                    variant="gray"
                    className="size-[32px] rounded-[8px]"
                  >
                    {/* <div className="relative z-30 aspect-square h-4 w-4 flex-shrink-0">
                      <Image
                        src="/icons/token/actions/filter.png"
                        alt="Filter Icon"
                        fill
                        quality={30}
                        className="object-contain"
                      />
                    </div> */}
                    <FilterIconSVG className="z-30" />
                  </BaseButton>
                </TooltipTrigger>
                <TooltipContent side="top" className="px-2 py-1">
                  <span className="inline-block text-nowrap text-xs">
                    Filter
                  </span>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <BaseButton
              variant="primary"
              className="bg-[#DF74FF]/[8%] px-3 py-[7px] text-xs font-semibold leading-[18px] text-[#DF74FF] hover:bg-[#DF74FF]/[20%]"
              onClick={handleOpenPnL}
            >
              P&L ✨
            </BaseButton>
          </div>
        </div>
      </div>
    );
  },
);

DesktopView.displayName = "DesktopView";

export const MobileView = React.memo(
  ({
    rank,
    trader,
    topTradersBought,
    topTradersSold,
    handleOpenPnL,
    isTradeMatchWithExistingTrackedWallet,
    remainingScreenWidth,
    remainingSol,
    handleFilter,
  }: ViewProps) => (
    <div className="flex w-full flex-col rounded-[8px] border border-border">
      <div className="relative flex h-8 w-full items-center justify-between bg-white/[4%] px-3 py-4">
        <div className="flex items-center gap-x-2">
          {rank <= 3 ? (
            // <div className="relative aspect-square h-6 w-6 flex-shrink-0">
            //   <Image
            //     src={`/icons/token/rank-${rank}.png`}
            //     alt="Rank Icon"
            //     fill
            //     quality={100}
            //     className="object-contain"
            //   />
            // </div>
            <>
              {rank === 1 && <FirstRankIconSVG className="size-6" />}
              {rank === 2 && <SecondRankIconSVG className="size-6" />}
              {rank === 3 && <ThirdRankIconSVG className="size-6" />}
            </>
          ) : (
            <span className="font-geistSemiBold text-xs text-fontColorSecondary">
              {rank}
            </span>
          )}
          <span className="text-nowrap font-geistSemiBold text-xs text-border">
            |
          </span>

          {isTradeMatchWithExistingTrackedWallet ? (
            <button
              // href={"https://solscan.io/account/" + trader.maker}
              className="flex items-center gap-x-1"
              // target="_blank"
            >
              <div className="flex gap-x-1">
                <AddressWithEmojis
                  walletDefault
                  address={truncateString(
                    isTradeMatchWithExistingTrackedWallet?.name || "",
                    10,
                  )}
                  fullAddress={isTradeMatchWithExistingTrackedWallet.address}
                  trackedWalletIcon={
                    isTradeMatchWithExistingTrackedWallet.emoji
                  }
                  isWithLink
                />
              </div>
            </button>
          ) : (
            <WalletTrackerPopover
              walletDefault
              circleCount={trader?.buys + trader?.sells}
              isDeveloper={trader.is_developer}
              isFirst={false}
              makerAddress={trader?.maker}
              emojis={[
                ...(trader.animal.length > 0 ? [trader.animal + ".svg"] : []),
                ...(trader.is_insider ? ["white-anonymous.svg"] : []),
                ...(trader.is_sniper ? ["sniper.svg"] : []),
              ]}
            />
          )}
        </div>
        <h4 className="flex w-fit items-center gap-x-1 text-xs">
          <span className="text-success">
            {trader?.percentage_owned?.toFixed(2)}%
          </span>
          <span className="text-foreground">owned</span>
        </h4>
      </div>

      <div className="grid grid-cols-7 gap-3 px-3 py-[6px]">
        <div className="col-span-3 flex flex-col gap-y-1">
          <span className="text-nowrap text-xs text-fontColorSecondary">
            PnL
          </span>
          <div className="flex flex-col items-start gap-x-[5px] @container">
            <div className="flex items-center gap-x-1">
              {/* <div className="relative aspect-auto size-4 flex-shrink-0">
                <CachedImage
                  src="/icons/usdc-colored.svg"
                  alt="USDC Icon"
                  fill
                  quality={100}
                  className="object-contain"
                />
              </div> */}
              <BlueUSDCIconSVG />
              <span
                className={cn(
                  "inline-block text-nowrap font-geistSemiBold text-xs text-fontColorPrimary",
                  trader?.profit_percentage > 0
                    ? "text-success"
                    : "text-destructive",
                )}
              >
                {trader?.profit_percentage > 0 ? "+" : ""}
                {trader?.profit_percentage.toFixed(2)}%
              </span>
            </div>
            <span className="flex w-fit flex-col items-start justify-start text-nowrap text-xs text-fontColorSecondary @[150px]:flex-row @[150px]:items-center @[150px]:justify-center">
              <span className="flex w-fit items-center justify-center gap-x-1">
                {/* <div className="relative aspect-auto size-3 flex-shrink-0">
                  <CachedImage
                    src={"/icons/solana-sq.svg"}
                    alt={"Solana Icon"}
                    fill
                    quality={100}
                    className="object-contain"
                  />
                </div> */}
                <SolanaIconSVG className="size-3" />
                {formatAmountWithoutLeadingZero(trader?.profit_base)}
              </span>
              <span className="hidden @[150px]:inline-block">/</span>
              <span className="test-xs flex w-fit items-center justify-center gap-x-1">
                {/* <div className="relative aspect-auto size-3 flex-shrink-0">
                  <CachedImage
                    src={"/icons/usdc-colored.svg"}
                    alt={"USDC Icon"}
                    fill
                    quality={100}
                    className="object-contain"
                  />
                </div> */}
                <BlueUSDCIconSVG className="size-3" />
                {formatAmountDollar(trader?.profit_usd)}
              </span>
            </span>
          </div>
        </div>
        <div className="col-span-2 flex flex-col gap-y-1">
          <span className="text-nowrap text-xs text-fontColorSecondary">
            Bought
          </span>
          <div className="flex flex-col items-start gap-x-[5px]">
            <div className="flex items-center gap-x-1">
              {/* <div className="relative aspect-auto size-4 flex-shrink-0">
                <CachedImage
                  src={
                    topTradersBought === "USDC"
                      ? "/icons/usdc-colored.svg"
                      : "/icons/solana-sq.svg"
                  }
                  alt="USDC Icon"
                  fill
                  quality={100}
                  className="object-contain"
                />
              </div> */}
              {topTradersBought === "USDC" ? (
                <BlueUSDCIconSVG />
              ) : (
                <SolanaIconSVG />
              )}
              <span className="inline-block text-nowrap font-geistSemiBold text-xs text-fontColorPrimary">
                {topTradersBought === "USDC"
                  ? formatAmountDollar(trader?.bought_usd)
                  : formatAmountWithoutLeadingZero(trader?.bought_base)}
              </span>
            </div>
            <span className="inline-block text-nowrap text-xs text-fontColorSecondary">
              {formatAmount(trader?.bought_tokens, 2)} / {trader?.buys}
            </span>
          </div>
        </div>

        <div className="col-span-2 flex flex-col gap-y-1">
          <span className="text-nowrap text-xs text-fontColorSecondary">
            Sold
          </span>
          <div className="flex flex-col items-start gap-x-1">
            <div className="flex items-center gap-x-1">
              {/* <div className="relative aspect-auto size-4 flex-shrink-0">
                <CachedImage
                  src={
                    topTradersSold === "USDC"
                      ? "/icons/usdc-colored.svg"
                      : "/icons/solana-sq.svg"
                  }
                  alt="Amount Icon"
                  fill
                  quality={100}
                  className="object-contain"
                />
              </div> */}
              {topTradersSold === "USDC" ? (
                <BlueUSDCIconSVG />
              ) : (
                <SolanaIconSVG />
              )}
              <span className="inline-block text-nowrap font-geistSemiBold text-xs text-fontColorPrimary">
                {topTradersSold === "USDC"
                  ? formatAmountDollar(trader?.sold_usd)
                  : formatAmountWithoutLeadingZero(trader?.sold_base)}
              </span>
            </div>
            <span className="inline-block text-nowrap text-xs text-fontColorSecondary">
              {formatAmountDollar(trader.sold_tokens)} / {trader.sells}
            </span>
          </div>
        </div>
      </div>
      <div className="flex w-full justify-between border-t border-border px-3 py-2">
        <div className="flex h-full w-40 flex-col items-start justify-center gap-y-1">
          <div className="flex items-center gap-x-1">
            <div className="flex items-center gap-x-1">
              <span className="flex items-center gap-1 text-nowrap font-geistSemiBold text-xs text-fontColorPrimary">
                {/* <div className="relative aspect-auto size-4 flex-shrink-0">
                  <CachedImage
                    src={"/icons/solana-sq.svg"}
                    alt="Amount Icon"
                    fill
                    quality={100}
                    className="object-contain"
                  />
                </div> */}
                <SolanaIconSVG />
                {formatAmountWithoutLeadingZero(remainingSol, 2)}
              </span>
              {/* <span className="inline-block text-nowrap font-geistSemiBold text-xs text-foreground"> */}
              {/*   of */}
              {/* </span> */}
              {/* <span className="inline-block text-nowrap font-geistSemiBold text-xs text-fontColorPrimary"> */}
              {/*   {formatAmount( */}
              {/*     Math.max(trader?.token_balance, trader?.bought_tokens), */}
              {/*     2, */}
              {/*   )} */}
              {/* </span> */}
            </div>
            <span className="flex h-[16px] items-center justify-center text-nowrap rounded-full bg-white/[8%] px-1 py-0.5 font-geistRegular text-xs text-fontColorSecondary">
              {(
                (trader?.token_balance /
                  Math.max(trader?.token_balance, trader?.bought_tokens)) *
                100
              ).toFixed(2)}
              %
            </span>
          </div>

          <GradientProgressBar
            bondingCurveProgress={
              (trader?.token_balance /
                Math.max(trader?.token_balance, trader?.bought_tokens)) *
              100
            }
            className="h-[4px]"
          />
        </div>
        <div className="flex items-center">
          <div className="flex items-center gap-x-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <BaseButton
                    onClick={handleFilter}
                    size="short"
                    variant="gray"
                    className="size-[32px] rounded-[8px]"
                  >
                    {/* <div className="relative z-30 aspect-square h-4 w-4 flex-shrink-0">
                      <Image
                        src="/icons/token/actions/filter.png"
                        alt="Filter Icon"
                        fill
                        quality={30}
                        className="object-contain"
                      />
                    </div> */}
                    <FilterIconSVG className="z-30" />
                  </BaseButton>
                </TooltipTrigger>
                <TooltipContent side="top" className="px-2 py-1">
                  <span className="inline-block text-nowrap text-xs">
                    Filter
                  </span>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <BaseButton
              variant="primary"
              className="bg-[#DF74FF]/[8%] px-3 py-[7px] text-xs font-semibold leading-[18px] text-[#DF74FF] hover:bg-[#DF74FF]/[20%]"
              onClick={handleOpenPnL}
            >
              P&L ✨
            </BaseButton>
          </div>
        </div>
      </div>
    </div>
  ),
);

MobileView.displayName = "MobileView";
