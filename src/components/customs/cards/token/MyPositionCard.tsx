"use client";

// ######## Libraries 📦 & Hooks 🪝 ########
import { useSolPriceMessageStore } from "@/stores/use-solprice-message.store";
// ######## Components 🧩 ########
import Image from "next/image";
import Copy from "@/components/customs/Copy";
import AvatarWithBadges from "@/components/customs/AvatarWithBadges";
import MyPositionButtons from "@/components/customs/buttons/token/MyPositionButtons";
import SocialLinkButton from "@/components/customs/buttons/SocialLinkButton";
// ######## Utils & Helpers 🤝 ########
import { cn } from "@/libraries/utils";
import { truncateAddress } from "@/utils/truncateAddress";
import { truncateString } from "@/utils/truncateString";
import {
  formatAmount,
  formatAmountDollar,
  formatAmountWithoutLeadingZero,
} from "@/utils/formatAmount";
import { HoldingsTokenData } from "@/types/ws-general";
import { useUserWalletStore } from "@/stores/wallet/use-user-wallet.store";
import { useTokenMessageStore } from "@/stores/token/use-token-messages.store";
import PnLScreenshot from "../../token/PnL/PnLScreenshot";
import { useCurrentTokenChartPriceStore } from "@/stores/token/use-current-token-chart-price.store";
import { CachedImage } from "../../CachedImage";
import { usePopupStore } from "@/stores/use-popup-state.store";
import { useEffect, useMemo, useState } from "react";
import { getIsStrippedHoldingPreviewData } from "@/utils/getIsStrippedHoldingPreviewData";

interface MyPositionCardProps {
  wallet: string;
  tokenData: HoldingsTokenData;
}

export default function MyPositionCard({
  wallet,
  tokenData,
}: MyPositionCardProps) {
  const userWalletFullList = useUserWalletStore(
    (state) => state.userWalletFullList,
  );
  const finalWallet = (userWalletFullList || [])?.filter((w) => !w.archived);
  
  const isTokenUsd = useTokenMessageStore(
    (state) => state.tokenInfoMessage.is_usd,
  );

  const currentTokenSupply = useTokenMessageStore(
    (state) => state.priceMessage.supply,
  );

  const initialTokenPriceSol = useTokenMessageStore(
    (state) => state.priceMessage.price_sol || state?.priceMessage?.price_base,
  );
  const currentGlobalChartPrice = useCurrentTokenChartPriceStore(
    (state) => state.price,
  );
  const globalSolPrice = useSolPriceMessageStore(
    (state) => state.messages.price,
  );
  const finalPrice =
    currentGlobalChartPrice === "" ||
    isNaN(Number(initialTokenPriceSol)) ||
    !currentGlobalChartPrice
      ? initialTokenPriceSol
      : currentGlobalChartPrice;

  const displayedTokenData = useMemo(() => {
    return {
      ...tokenData,
      investedBase: isTokenUsd ? tokenData.invested_base / globalSolPrice : tokenData.invested_base,
      investedBaseStr: isTokenUsd ? (parseFloat(tokenData.invested_base?.toString()) / globalSolPrice).toString() : tokenData.invested_base?.toString(),
      soldBase: isTokenUsd ? tokenData.sold_base / globalSolPrice : tokenData.sold_base,
      balance: isTokenUsd ? tokenData.balance / globalSolPrice : tokenData.balance,
    }
  }, [tokenData, isTokenUsd, globalSolPrice]);

  const {
    token,
    investedBaseStr,
    investedBase,
    balance,
    price,
    invested_base: investedUsd,
    soldBase,
    sold_usd: soldUsd,
  } = displayedTokenData;

  // Remaining
  const [PnLData, setPnLData] = useState({
    remainingSol: 0,
    pnlSol: 0,
    pnlPercentage: 0,
  });
  const [finalSolPrice, setFinalSolPrice] = useState(0);

  const { remainingScreenWidth } = usePopupStore();
  useEffect(() => {
    const remainingSol = balance * Number(finalPrice);
    const prevCalc = soldBase + balance * Number(finalPrice);
    const pnlSol = prevCalc - investedBase;
    const pnlPercentage = (pnlSol / investedBase) * 100;

    setPnLData((w) => ({
      ...w,
      remainingSol,
      pnlSol,
      pnlPercentage,
    }));
    if (balance > 0 || finalSolPrice === 0) {
      setFinalSolPrice(Number(globalSolPrice));
    }
  }, [
    balance,
    finalPrice,
    price.price_usd,
    soldBase,
    investedBase,
    globalSolPrice,
  ]);

  return (
    <>
      <div
        className={cn(
          "flex-shrink-0 items-center overflow-hidden from-background to-background-1",
          "max-xl:rounded-[8px] max-xl:border max-xl:border-border max-xl:bg-card",
          "transition-colors duration-200 ease-out xl:flex xl:h-[70px] xl:min-w-max xl:py-4 xl:pl-[16px] xl:pr-[16px] xl:odd:bg-shadeTable xl:hover:bg-shadeTableHover",
          remainingScreenWidth <= 1280 &&
            "rounded-[8px] !border !border-border bg-card xl:flex xl:h-auto xl:min-w-fit xl:py-0 xl:pl-0 xl:pr-0",
        )}
      >
        <>
          {/* Token */}
          <div
            className={cn(
              "hidden h-full w-full min-w-[210px] flex-col justify-center xl:flex",
              remainingScreenWidth <= 1280 && "xl:hidden",
            )}
          >
            <div className="flex min-w-[210px] items-center gap-x-4">
              <AvatarWithBadges
                src={token.image}
                alt={`${token.name} Image`}
                size="lg"
              />

              <div className="flex flex-col gap-y-1">
                <div className="flex items-center gap-x-[4px]">
                  <h4 className="text-nowrap font-geistSemiBold text-xs text-fontColorPrimary">
                    {truncateString(token.name, 8)}
                  </h4>
                  <span className="text-nowrap text-xs text-fontColorSecondary">
                    {token?.symbol}
                  </span>
                </div>

                <div className="-mt-0.5 flex items-center gap-x-[4px]">
                  <span className="inline-block text-nowrap text-xs text-fontColorSecondary">
                    {truncateAddress(token.mint)}
                  </span>
                  <Copy value={token.mint} dataDetail={token} />
                </div>

                <div className="flex items-center gap-x-1">
                  {token.twitter && (
                    <SocialLinkButton
                      href={token.twitter}
                      icon="twitter"
                      label="Twitter"
                    />
                  )}
                  {token.telegram && (
                    <SocialLinkButton
                      href={token.telegram}
                      icon="telegram"
                      label="Telegram"
                    />
                  )}
                  {token.website && (
                    <SocialLinkButton
                      href={token.website}
                      icon="website"
                      label="Website"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Wallet Name */}
          <div
            className={cn(
              "hidden h-full w-full flex-col justify-center self-stretch xl:flex",
              remainingScreenWidth <= 1280 && "xl:hidden",
              remainingScreenWidth > 1650
                ? "min-w-[140px]"
                : remainingScreenWidth > 1480
                  ? "min-w-[130px]"
                  : "min-w-[110px]",
            )}
          >
            <div className="flex items-center gap-x-[4px]">
              <h4 className="text-nowrap font-geistSemiBold text-xs text-fontColorPrimary">
                {
                  (finalWallet || [])?.find((item) => item.address === wallet)
                    ?.name
                }
              </h4>
            </div>
            <div className="flex items-center gap-x-[4px]">
              <span className="inline-block text-nowrap text-xs text-fontColorSecondary">
                {truncateAddress(wallet)}
              </span>
              <Copy value={wallet} />
            </div>
          </div>

          {/* Market Cap */}
          <div
            className={cn(
              "hidden h-full w-full flex-col justify-center self-stretch xl:flex",
              remainingScreenWidth <= 1280 && "xl:hidden",
              remainingScreenWidth > 1650
                ? "min-w-[140px]"
                : remainingScreenWidth > 1480
                  ? "min-w-[130px]"
                  : "min-w-[102px]",
            )}
          >
            <span className="text-nowrap font-geistSemiBold text-sm text-fontColorPrimary">
              {formatAmountDollar(Number(price.price_usd * currentTokenSupply))}
            </span>
          </div>

          {/* Invested */}
          <div
            className={cn(
              "hidden h-full w-full flex-col justify-center self-stretch xl:flex",
              remainingScreenWidth <= 1280 && "xl:hidden",
              remainingScreenWidth > 1650
                ? "min-w-[140px]"
                : remainingScreenWidth > 1480
                  ? "min-w-[130px]"
                  : "min-w-[85px]",
            )}
          >
            <div className="flex items-center gap-x-1">
              <div className="relative aspect-auto size-4 flex-shrink-0">
                <CachedImage
                  src="/icons/solana-sq.svg"
                  alt={"Solana Icon"}
                  fill
                  quality={100}
                  className="object-contain"
                />
              </div>
              <span className="inline-block text-nowrap font-geistSemiBold text-xs text-fontColorPrimary">
                {getIsStrippedHoldingPreviewData(investedBase, balance)
                  ? "-"
                  : formatAmountWithoutLeadingZero(Number(investedBaseStr))}
              </span>
            </div>
            <span className="inline-block text-nowrap text-xs text-fontColorSecondary">
              {getIsStrippedHoldingPreviewData(investedBase, balance)
                ? "-"
                : investedUsd > 1
                  ? formatAmountDollar(investedUsd)
                  : `$${formatAmountWithoutLeadingZero(Number(investedUsd))}`}
            </span>
          </div>

          {/* Remaining */}
          <div
            className={cn(
              "hidden h-full w-full flex-col justify-center self-stretch xl:flex",
              remainingScreenWidth <= 1280 && "xl:hidden",
              remainingScreenWidth > 1650
                ? "min-w-[140px]"
                : remainingScreenWidth > 1480
                  ? "min-w-[115px]"
                  : "min-w-[95px]",
            )}
          >
            <div className="flex items-center gap-x-1">
              <div className="relative aspect-auto size-4 flex-shrink-0">
                <CachedImage
                  src="/icons/solana-sq.svg"
                  alt="Solana Icon"
                  fill
                  quality={100}
                  className="object-contain"
                />
              </div>
              <span className="inline-block text-nowrap font-geistSemiBold text-xs text-fontColorPrimary">
                {formatAmountWithoutLeadingZero(
                  Number(balance > 0 ? PnLData.remainingSol : balance),
                )}
              </span>
            </div>
            <span className="flex w-fit items-center justify-center text-nowrap text-xs text-fontColorSecondary">
              {balance > 0
                ? PnLData.remainingSol * finalSolPrice > 1
                  ? formatAmountDollar(
                      Number(PnLData.remainingSol * finalSolPrice),
                    )
                  : `$${formatAmountWithoutLeadingZero(Number(PnLData.remainingSol * finalSolPrice))}`
                : "$0"}
            </span>
          </div>

          {/* Sold */}
          <div
            className={cn(
              "hidden h-full w-full flex-col justify-center self-stretch xl:flex",
              remainingScreenWidth <= 1280 && "xl:hidden",
              remainingScreenWidth > 1650
                ? "min-w-[140px]"
                : remainingScreenWidth > 1480
                  ? "min-w-[115px]"
                  : "min-w-[90px]",
            )}
          >
            <div className="flex items-center gap-x-1">
              <div className="relative aspect-auto size-4 flex-shrink-0">
                <CachedImage
                  src="/icons/solana-sq.svg"
                  alt="Solana Icon"
                  fill
                  quality={100}
                  className="object-contain"
                />
              </div>
              <span className="inline-block text-nowrap font-geistSemiBold text-xs text-fontColorPrimary">
                {getIsStrippedHoldingPreviewData(investedBase, balance)
                  ? "-"
                  : formatAmountWithoutLeadingZero(Number(soldBase))}
              </span>
            </div>
            <span className="inline-block text-nowrap text-xs text-fontColorSecondary">
              {getIsStrippedHoldingPreviewData(
                Number(soldBase) + Number(investedBase),
                balance,
              )
                ? "-"
                : soldUsd && soldUsd > 1
                  ? formatAmountDollar(Number(soldUsd))
                  : `$${formatAmountWithoutLeadingZero(Number(soldUsd))}`}
            </span>
          </div>

          {/* P&L */}
          <div
            className={cn(
              "hidden h-full w-full flex-col justify-center self-stretch xl:flex",
              remainingScreenWidth <= 1280 && "xl:hidden",
              remainingScreenWidth > 1650
                ? "min-w-[140px]"
                : remainingScreenWidth > 1480
                  ? "min-w-[115px]"
                  : "min-w-[90px]",
            )}
          >
            <span
              className={cn(
                "inline-block text-nowrap font-geistSemiBold text-xs",
                PnLData.pnlSol >= 0 ? "text-success" : "text-destructive",
              )}
            >
              {getIsStrippedHoldingPreviewData(investedBase, balance)
                ? "-"
                : PnLData.pnlSol >= 0
                  ? "+"
                  : ""}
              {getIsStrippedHoldingPreviewData(investedBase, balance)
                ? ""
                : PnLData.pnlPercentage.toFixed(2) + "%"}
            </span>
            <span
              className={cn(
                "inline-block text-nowrap text-xs text-fontColorSecondary",
                PnLData.pnlSol * finalSolPrice >= 0
                  ? "text-success"
                  : "text-destructive",
              )}
            >
              {getIsStrippedHoldingPreviewData(investedBase, balance)
                ? "-"
                : PnLData.pnlSol * finalSolPrice > 0
                  ? "+"
                  : ""}

              {getIsStrippedHoldingPreviewData(investedBase, balance)
                ? ""
                : "$" +
                  formatAmountWithoutLeadingZero(
                    Number(PnLData.pnlSol * finalSolPrice),
                  ).replace("-", "")}
            </span>
          </div>

          {/* Action Buttons */}
          <div
            className={cn(
              "mr-auto hidden h-full w-full items-center justify-start gap-2 self-stretch xl:flex",
              remainingScreenWidth <= 1280 && "xl:hidden",
              remainingScreenWidth > 1650
                ? "min-w-[140px]"
                : remainingScreenWidth > 1480
                  ? "min-w-[130px]"
                  : "min-w-[110px]",
            )}
          >
            <div>
              <PnLScreenshot
                profitAndLossUsdRaw={PnLData.pnlSol * finalSolPrice}
                remainingDRaw={PnLData.remainingSol * finalSolPrice}
                soldDRaw={soldUsd}
                invevtedDRaw={investedUsd}
                title={"$" + token?.symbol}
                image={token?.image || ""}
                solPrice={Number(finalPrice)}
                invested={investedBase}
                sold={soldBase}
                profitAndLoss={PnLData.pnlSol}
                profitAndLossPercentage={PnLData.pnlPercentage}
                isWithDialog
                trigger={<MyPositionButtons />}
                remaining={PnLData.remainingSol}
              />
            </div>
          </div>
        </>
        {/* MOBILE */}
        <div
          className={cn(
            "flex w-full flex-col xl:hidden",
            remainingScreenWidth <= 1280 && "xl:flex",
          )}
        >
          {/* Header */}
          <div className="relative flex h-9 w-full items-center justify-between overflow-hidden bg-white/[4%] px-3 py-2">
            <div className="flex items-center gap-x-3">
              <AvatarWithBadges
                src={token.image}
                alt={`${token.name} Image`}
                size="sm"
              />
              <div className="flex items-center gap-x-2">
                <h4 className="text-nowrap font-geistSemiBold text-xs text-fontColorPrimary">
                  {token.name}
                </h4>
                {/* <Copy value={token.mint} /> */}
                <span className="text-xs leading-3 text-fontColorSecondary">
                  {token?.symbol}
                </span>
                <div className="flex items-center gap-x-1">
                  <span className="text-xs leading-3 text-fontColorSecondary">
                    {truncateAddress(wallet)}
                  </span>
                  <Copy value={wallet} />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-x-2">
              {token.twitter && (
                <SocialLinkButton
                  href={token.twitter}
                  icon="twitter"
                  label="Twitter"
                />
              )}
              {token.telegram && (
                <SocialLinkButton
                  href={token.telegram}
                  icon="telegram"
                  label="Telegram"
                />
              )}
              {token.website && (
                <SocialLinkButton
                  href={token.website}
                  icon="website"
                  label="Website"
                />
              )}
            </div>
          </div>

          {/* Market Data Grid */}
          <div className="flex gap-x-4 px-3 py-[6px]">
            {[
              {
                label: "Invested",
                value: getIsStrippedHoldingPreviewData(investedBase, balance)
                  ? "-"
                  : formatAmountWithoutLeadingZero(Number(investedBase)),
                icon: "/icons/solana.svg",
                subValue: getIsStrippedHoldingPreviewData(investedBase, balance)
                  ? "-"
                  : investedUsd > 1
                    ? formatAmountDollar(investedUsd)
                    : `$${formatAmountWithoutLeadingZero(investedUsd)}`,
              },
              {
                label: "Remaining",
                value: formatAmountWithoutLeadingZero(
                  Number(PnLData.remainingSol),
                ),
                icon: "/icons/solana.svg",
                subValue: (
                  <span className="flex w-fit items-center justify-center">
                    {PnLData.remainingSol * finalSolPrice > 1
                      ? formatAmountDollar(
                          Number(PnLData.remainingSol * finalSolPrice),
                        )
                      : `$${formatAmountWithoutLeadingZero(Number(PnLData.remainingSol * finalSolPrice))}`}
                  </span>
                ),
              },
              {
                label: "Sold",
                value: getIsStrippedHoldingPreviewData(
                  Number(soldBase) + Number(investedBase),
                  balance,
                )
                  ? "-"
                  : formatAmountWithoutLeadingZero(Number(soldBase)),
                subValue: getIsStrippedHoldingPreviewData(
                  Number(soldBase) + Number(investedBase),
                  balance,
                )
                  ? "-"
                  : soldUsd && soldUsd > 1
                    ? formatAmountDollar(Number(soldUsd))
                    : `$${formatAmountWithoutLeadingZero(Number(soldUsd))}`,
                valueClassName:
                  soldBase > 0 ? "text-success" : "text-destructive",
                icon: "/icons/solana.svg",
              },
              {
                label: "Market Cap",
                value: `${formatAmountDollar(Number(price.price_usd * currentTokenSupply))}`,
                labelClassName: "inline md:hidden lg:inline",
                shortLabelClassName: "hidden md:inline lg:hidden",
                shortLabel: "M Cap",
              },
              {
                label: "P&L",
                value: getIsStrippedHoldingPreviewData(investedBase, balance)
                  ? "-"
                  : `${PnLData.pnlPercentage > 0 ? "+" : ""}${PnLData.pnlPercentage.toFixed(2)}%`,
                subValue: getIsStrippedHoldingPreviewData(investedBase, balance)
                  ? "-"
                  : formatAmount(PnLData.pnlSol, 2),
                valueClassName:
                  PnLData.pnlSol > 0 ? "text-success" : "text-destructive",
              },
            ]?.map((item) => (
              <div key={item.label} className="flex flex-col gap-y-0.5">
                <span className="mb-0.5 text-nowrap text-xs text-fontColorSecondary">
                  {item.shortLabel && (
                    <>
                      <span className={item.labelClassName}>{item.label}</span>
                      <span className={item.shortLabelClassName}>
                        {item.shortLabel}
                      </span>
                    </>
                  )}
                  {!item.shortLabel && item.label}
                </span>
                <div className="flex items-center gap-x-1">
                  {item.icon && (
                    <div className="relative aspect-auto h-3 w-3">
                      <Image
                        src={item.icon}
                        alt="Icon"
                        fill
                        quality={100}
                        className="object-contain"
                      />
                    </div>
                  )}
                  <span
                    className={cn(
                      "font-geistSemiBold text-xs text-fontColorPrimary",
                      item.valueClassName,
                    )}
                  >
                    {item.value}
                  </span>
                </div>
                {item.subValue && (
                  <span className="text-xs text-fontColorSecondary">
                    {item.subValue}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Bottom Action Bar */}
          <div className="flex h-[44px] items-center justify-between border-t border-border px-3 py-[6px]">
            <div className="flex items-center gap-x-1">
              <span className="font-geistSemiBold text-xs text-fontColorPrimary">
                {
                  (finalWallet || [])?.find((item) => item.address === wallet)
                    ?.name
                }
              </span>
              <span className="text-xs text-fontColorSecondary">
                {truncateAddress(wallet)}
              </span>
              <Copy value={wallet} className="size-3" />
            </div>
            <div className="ml-auto flex gap-2">
              <PnLScreenshot
                profitAndLossUsdRaw={PnLData.pnlSol * finalSolPrice}
                remainingDRaw={PnLData.remainingSol * finalSolPrice}
                soldDRaw={soldUsd}
                invevtedDRaw={investedUsd?.toString()}
                title={"$" + token?.symbol}
                solPrice={Number(finalPrice)}
                invested={investedBase}
                sold={soldBase}
                profitAndLoss={PnLData.pnlSol}
                profitAndLossPercentage={PnLData.pnlPercentage}
                isWithDialog
                trigger={<MyPositionButtons />}
                remaining={PnLData.remainingSol}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
