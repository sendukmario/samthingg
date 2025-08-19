"use client";

// ######## Libraries 📦 & Hooks 🪝 ########
import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
// ######## APIs 🛜 ########
import { getTraderOverview } from "@/apis/rest/trades";
// ######## Components 🧩 ########
import Image from "next/image";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import {
  FishIconSVG,
  DolphinIconSVG,
  WhaleIconSVG,
  WhiteAnonymousSVG,
  DBSVG,
  DSSVG,
  SniperSVG,
  FreshWalletIconSVG,
} from "@/components/customs/ScalableVectorGraphics";
// ######## Utils & Helpers 🤝 ########
import { cn } from "@/libraries/utils";
import { useTradesWalletModalStore } from "@/stores/token/use-trades-wallet-modal.store";
import {
  ColorType,
  defaultColors,
  useWalletTrackerColor,
} from "@/stores/wallet/use-wallet-tracker-color.store";

const getFormattedTimeDiff = (timestamp: number, threshold = 0.5) => {
  const now = Math.floor(Date.now() / 1000);
  const normalizedTimestamp =
    String(timestamp).length > 10
      ? Math.floor(timestamp / 1000)
      : Math.floor(timestamp);

  const difference = now - normalizedTimestamp;

  if (difference < 0 || difference < threshold) return "Just Now";
  if (difference < 60) return `${difference?.toFixed(0)} Seconds ago`;
  if (difference < 3600) return `${Math.floor(difference / 60)} Minutes ago`;
  if (difference < 86400) {
    const hours = Math.floor(difference / 3600);
    const minutes = Math.floor((difference % 3600) / 60);
    return `${hours} Hours ${minutes} Minutes ago`;
  }
  const days = Math.floor(difference / 86400);
  const hours = Math.floor((difference % 86400) / 3600);
  return `${days} Days ${hours} Hours ago`;
};

const getFundedBy = (address: string) => {
  const exchangeWallets: Record<string, string> = {
    "7FfB2zQRYUQwpPzkRxAeg2mCBGeCRKp4PCEeULJA9xTo": "deBridge",
    H8sMJSCQxfKiFTCfDR3DUMLPwcRbM61LGFJ8N4dK3WjS: "Coinbase",
    GJRs4FwHtemZ5ZE9x3FNvJ8TMwitKTh21yxdRPqn7npE: "Coinbase",
    F37Wb3pqcaYSBGXP7W699XZBqiEwkqVQpkreU9v6Ntkk: "Alex Fund",
    "5tzFkiKscXHK5ZXCGbXZxdw7gTjjD1mBwuoFbhUvuAi9": "Binance",
    FWznbcNXWQuHTawe9RxvQ2LdCENssh12dsznf4RiouN5: "Kraken",
    AC5RDfQFmDS1deWZos921JfqscXdByf8BKHs5ACWjtW2: "Bybit",
    A77HErqtfN1hLLpvZ9pCtu66FEtM8BveoaKbbMoZ4RiR: "Bitget",
    AeBwztwXScyNNuQCEdhS54wttRQrw3Nj1UtqddzB4C7b: "Robinhood",
    "5VCwKtCXgCJ6kit5FybXjvriW3xELsFDhYrPSqtJNmcD": "OKX",
    G2YxRa6wt1qePMwfJzdXZG62ej4qaTC7YURzuh2Lwd3t: "ChangeNow",
    BmFdpraQhkiDQE6SnfG5omcA1VwzqfXrwtNYBwWTymy6: "Kucoin",
  };

  const match = exchangeWallets[address];

  if (match) {
    return match;
  } else {
    return "Coinbase";
  }
};

const WalletTooltipContent = ({
  children,
  address,
  isWithOverview,
  isOpen,
}: {
  children: React.ReactNode;
  address: string;
  isWithOverview?: boolean;
  isOpen?: boolean;
}) => {
  const params = useParams();
  const { data: traderData, isLoading } = useQuery({
    queryKey: ["trader-overview", address],
    queryFn: () =>
      getTraderOverview(
        address,
        (params?.["mint-address"] || params?.["pool-address"]) as string,
      ),
    enabled: isWithOverview && isOpen,
    retry: 0,
  });

  if (!isWithOverview) {
    return children;
  }

  return (
    <>
      {children}
      <TooltipContent
        align="end"
        side="bottom"
        className="gb__white__popover z-[500] w-[240px] rounded-[8px] border border-border bg-card p-0 text-fontColorSecondary"
      >
        {isLoading ? (
          <div className="flex h-[200px] items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : traderData ? (
          <div className="flex flex-col text-xs">
            <div className="flex w-full justify-between border-b border-border px-3 py-2">
              <span>Invested</span>
              <span className="text-primary">
                ${traderData.invested_usd?.toFixed(2)}
              </span>
            </div>
            <div className="flex w-full justify-between border-b border-border px-3 py-2">
              <span>Sold</span>
              <span className="text-success">
                ${traderData.sold_usd?.toFixed(2)}
              </span>
            </div>
            <div className="flex w-full justify-between border-b border-border px-3 py-2">
              <span>Remaining</span>
              <span className="text-fontColorPrimary">
                ${traderData.remaining_usd?.toFixed(2)}
              </span>
            </div>
            <div className="flex w-full justify-between border-b border-border px-3 py-2">
              <span>PnL</span>
              <span
                className={
                  traderData.profit_usd >= 0
                    ? "text-success"
                    : "text-destructive"
                }
              >
                ${traderData.profit_usd?.toFixed(2)} (
                {traderData.profit_percentage?.toFixed(2)}%)
              </span>
            </div>
            <div className="flex w-full justify-between border-b border-border px-3 py-2">
              <span>Type</span>
              <span className="capitalize text-primary">
                {traderData.animal}
              </span>
            </div>
            <div className="flex w-full justify-between border-b border-border px-3 py-2">
              <span>Trades</span>
              <span className="text-fontColorPrimary">
                {traderData.buys} buys, {traderData.sells} sells
              </span>
            </div>
            <div className="flex w-full justify-between px-3 py-2">
              <span>Holder Since</span>
              <span className="text-fontColorPrimary">
                {new Date(
                  String(traderData.holder_since).length <= 10
                    ? traderData.holder_since * 1000
                    : traderData.holder_since,
                ).toLocaleDateString()}
              </span>
            </div>
          </div>
        ) : (
          <div className="p-3 text-center text-xs text-destructive">
            Failed to load trader data
          </div>
        )}
      </TooltipContent>
    </>
  );
};

const WalletAddress = ({
  href,
  className,
  classNameSpan,
  address,
  fullAddress,
  color,
  underlineColor = color,
}: {
  href?: string;
  className: string;
  classNameSpan: string;
  address: string;
  fullAddress: string;
  color: string;
  underlineColor?: string;
}) => {
  const setWalletModalAddress = useTradesWalletModalStore(
    (state) => state.setWallet,
  );
  const handleAddressClick = (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => {
    e.stopPropagation();
    setWalletModalAddress(fullAddress);
  };

  return (
    <>
      {href ? (
        <>
          {/* <Link */}
          {/*   href={href} */}
          {/*   target="_blank" */}
          {/*   className={className} */}
          {/*   onClick={(e) => e.stopPropagation()} */}
          {/* > */}
          {/*   <span>{address}</span> */}
          {/*   <span className={classNameSpan} /> */}
          {/* </Link> */}
          <button
            className={className}
            style={{ color }}
            onClick={handleAddressClick}
          >
            <span>{address}</span>
            <span
              style={{ borderColor: underlineColor }}
              className={classNameSpan}
            />
          </button>
          {/* <Link */}
          {/*   href={href} */}
          {/*   target="_blank" */}
          {/*   className={className} */}
          {/*   onClick={(e) => e.stopPropagation()} */}
          {/*   style={{ color }} */}
          {/* > */}
          {/*   <span>{address}</span> */}
          {/*   <span style={{ borderColor: color }} className={classNameSpan} /> */}
          {/* </Link> */}
        </>
      ) : (
        <div className={className} style={{ color }}>
          <span>{address}</span>
          <span
            style={{ borderColor: underlineColor }}
            className={classNameSpan}
          />
        </div>
      )}
    </>
  );
};

const AddressWithEmojis = ({
  address,
  fullAddress,
  // href,
  emojis,
  color = "primary",
  isFirst = false,
  buy,
  walletDefault,
  isWithOverview = false,
  trackedWalletIcon,
  freshWalletFundedInfo,
  className,
  onOpenChange,
  isWithLink,
  stripClassname,
  isUserWallet = false,
}: {
  address: string;
  fullAddress?: string;
  // href: string;
  buy?: boolean;
  isFirst?: boolean;
  walletDefault?: boolean;
  emojis?: string[];
  color?: "primary" | "success" | "destructive";
  isWithOverview?: boolean;
  trackedWalletIcon?: string;
  freshWalletFundedInfo?: {
    wallet: string;
    fundedAmount: string;
    fundedBy: string;
    timestamp: number;
  };
  className?: string;
  onOpenChange?: (isOpen: boolean) => void;
  isWithLink?: boolean;
  stripClassname?: string;
  isUserWallet?: boolean;
}) => {
  const { colors } = useWalletTrackerColor();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  useEffect(() => {
    if (onOpenChange) {
      onOpenChange(isOpen);
    }
  }, [isOpen]);

  return (
    <div className="flex w-fit items-center gap-x-1">
      {freshWalletFundedInfo && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              {/* <div className="relative size-4">
                <Image
                  fill
                  src="/icons/token/fresh-wallet.svg"
                  alt="Fresh Wallet"
                />
              </div> */}
              <FreshWalletIconSVG />
            </TooltipTrigger>
            <TooltipContent
              isWithAnimation={false}
              side="top"
              className="bg-[#202037] px-2"
            >
              <div className="flex items-center gap-x-1">
                Fresh Wallet Funded by:{" "}
                <div className="flex items-center gap-x-1">
                  <div className="relative size-4">
                    <Image
                      fill
                      src={`/icons/token/fresh-wallets/${getFundedBy(freshWalletFundedInfo.fundedBy)?.toLowerCase().replaceAll(" ", "-")}.svg`}
                      alt="Exchange Icon"
                    />
                  </div>
                  {getFundedBy(freshWalletFundedInfo.fundedBy)}
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      <TooltipProvider>
        <Tooltip delayDuration={0} open={isOpen} onOpenChange={setIsOpen}>
          <WalletTooltipContent
            address={fullAddress as string}
            isWithOverview={isWithOverview}
            isOpen={isOpen}
          >
            <TooltipTrigger asChild>
              <div className="relative flex items-center gap-x-1">
                <WalletAddress
                  fullAddress={fullAddress as string}
                  address={address}
                  href={
                    isWithLink
                      ? `https://solscan.io/account/${fullAddress}`
                      : undefined
                  }
                  color={
                    (trackedWalletIcon && colors[ColorType.WALLET_NAME]) ||
                    defaultColors[ColorType.WALLET_NAME]
                  }
                  underlineColor={
                    trackedWalletIcon &&
                    (buy
                      ? colors[ColorType.AMOUNT_BUY]
                      : colors[ColorType.AMOUNT_SELL])
                  }
                  className={cn(
                    "relative flex w-fit items-center justify-center text-nowrap font-geistSemiBold text-xs",
                    isFirst || isUserWallet
                      ? "text-[#66B0FF]"
                      : buy
                        ? "text-success"
                        : walletDefault
                          ? "text-primary"
                          : "text-destructive",
                    className,
                  )}
                  classNameSpan={cn(
                    "absolute bottom-[-2px] w-full border-b border-dashed",
                    stripClassname,
                    isFirst || isUserWallet
                      ? "border-[#66B0FF]"
                      : buy
                        ? "border-success"
                        : walletDefault
                          ? "border-primary"
                          : "border-destructive",
                  )}
                />

                {emojis &&
                  emojis.length > 0 &&
                  !trackedWalletIcon &&
                  !isUserWallet &&
                  (emojis || [])?.map((emoji, index) => {
                    const widthHeight = "h-4 w-4";

                    return (
                      <div
                        key={index}
                        className={cn(
                          "relative aspect-auto flex-shrink-0",
                          widthHeight,
                        )}
                      >
                        {["fish.svg", "dolphin.svg", "whale.svg"].includes(
                          emoji,
                        ) ? (
                          <div className="relative">
                            {emoji === "fish.svg" && <FishIconSVG />}
                            {emoji === "dolphin.svg" && <DolphinIconSVG />}
                            {emoji === "whale.svg" && <WhaleIconSVG />}
                          </div>
                        ) : (
                          <>
                            {emoji === "white-anonymous.svg" && (
                              <WhiteAnonymousSVG />
                            )}
                            {emoji === "db.svg" && <DBSVG />}
                            {emoji === "ds.svg" && <DSSVG />}
                            {emoji === "sniper.svg" && <SniperSVG />}
                          </>
                        )}
                      </div>
                    );
                  })}

                {trackedWalletIcon && (
                  <span className="text-sm">{trackedWalletIcon}</span>
                )}
              </div>
            </TooltipTrigger>
          </WalletTooltipContent>
        </Tooltip>
      </TooltipProvider>
      {/* {freshWalletFundedInfo && ( */}
      {/*   <TooltipProvider> */}
      {/*     <Tooltip> */}
      {/*       <TooltipTrigger asChild> */}
      {/*         <div className="relative size-4"> */}
      {/*           <Image */}
      {/*             fill */}
      {/*             src="/icons/token/fresh-wallet.svg" */}
      {/*             alt="Fresh Wallet" */}
      {/*           /> */}
      {/*         </div> */}
      {/*       </TooltipTrigger> */}
      {/*       <TooltipContent */}
      {/*         isWithAnimation={false} */}
      {/*         side="top" */}
      {/*         className="bg-[#202037] px-2" */}
      {/*       > */}
      {/*         <div className="flex items-center gap-x-1"> */}
      {/*           Fresh Wallet Funded by:{" "} */}
      {/*           <div className="flex items-center gap-x-1"> */}
      {/*             <div className="relative size-4"> */}
      {/*               <Image */}
      {/*                 fill */}
      {/*                 src={`/icons/token/fresh-wallets/${getFundedBy(freshWalletFundedInfo.fundedBy).toLowerCase().replaceAll(" ", "-")}.svg`} */}
      {/*                 alt="Exchange Icon" */}
      {/*               /> */}
      {/*             </div> */}
      {/*             {getFundedBy(freshWalletFundedInfo.fundedBy)} */}
      {/*           </div> */}
      {/*         </div> */}
      {/*       </TooltipContent> */}
      {/*     </Tooltip> */}
      {/*   </TooltipProvider> */}
      {/* )} */}
      {/**/}
      {/* {trackedWalletIcon && ( */}
      {/*   <span className="text-sm">{trackedWalletIcon}</span> */}
      {/* )} */}
      {/**/}
      {/* <WalletAddress */}
      {/*   address={address} */}
      {/*   fullAddress={fullAddress as string} */}
      {/*   href={ */}
      {/*     isWithLink ? `https://solscan.io/account/${fullAddress}` : undefined */}
      {/*   } */}
      {/*   className={cn( */}
      {/*     "relative flex w-fit items-center justify-center text-nowrap font-geistSemiBold text-xs", */}
      {/*     isFirst || isUserWallet */}
      {/*       ? "text-[#66B0FF]" */}
      {/*       : buy */}
      {/*         ? "text-success" */}
      {/*         : walletDefault */}
      {/*           ? "text-primary" */}
      {/*           : "text-destructive", */}
      {/*     trackedWalletIcon && "text-warning", */}
      {/*     className, */}
      {/*   )} */}
      {/*   classNameSpan={cn( */}
      {/*     "absolute bottom-[-2px] w-full border-b border-dashed", */}
      {/*     stripClassname, */}
      {/*     isFirst || isUserWallet */}
      {/*       ? "border-[#66B0FF]" */}
      {/*       : buy */}
      {/*         ? "border-success" */}
      {/*         : walletDefault */}
      {/*           ? "border-primary" */}
      {/*           : "border-destructive", */}
      {/*     trackedWalletIcon && "border-warning", */}
      {/*   )} */}
      {/* /> */}
    </div>
  );
};

export default React.memo(AddressWithEmojis);
