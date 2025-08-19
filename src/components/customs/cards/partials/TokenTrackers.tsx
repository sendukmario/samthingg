"use client";

// ######## Libraries 📦 & Hooks 🪝 ########
import React, { useCallback, useMemo, useState } from "react";
// ######## Components 🧩 ########
import Image from "next/image";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
// ######## Utils & Helpers 🤝 ########
import { TrackedWallet } from "@/apis/rest/wallet-tracker";
import { truncateString } from "@/utils/truncateString";
import AddressWithEmojis from "@/components/customs/AddressWithEmojis";
import { useWalletTrackerStore } from "@/stores/footer/use-wallet-tracker.store";
import { useWalletTrackerMessageStore } from "@/stores/footer/use-wallet-tracker-message.store";
import { cn } from "@/libraries/utils";

export const DUMMY_MINT = "0x1234567890abcdef1234567890abcdef12345678";

const TokenTrackers = React.memo(
  ({
    mint,
    valueColor,
    customClassName,
    customClassIcon,
  }: {
    mint: string;
    valueColor: string;
    customClassName?: string;
    customClassIcon?: string;
  }) => {
    const tracker = useWalletTrackerMessageStore((state) => state.messages);
    const trackedWallets = useWalletTrackerStore(
      (state) => state.trackedWallets,
    );

    const uniqueTrackers = useMemo(() => {
      if (!mint || !tracker || !trackedWallets?.length) return [];

      const buyers = new Set(
        (tracker || [])
          ?.filter((tx) => tx.mint === mint && tx.type === "buy")
          ?.map((tx) => tx.walletAddress),
      );

      const map = new Map<string, TrackedWallet>();
      for (const wallet of trackedWallets) {
        if (buyers.has(wallet.address)) {
          map.set(wallet.address, wallet);
        }
      }

      return Array.from(map.values());
    }, [tracker, trackedWallets]);

    if (mint === DUMMY_MINT)
      return (
        <div
          className={cn(
            "group/tracker ml-1 flex items-center justify-center gap-x-[2px]",
            customClassIcon,
          )}
        >
          <div
            className={cn(
              "relative aspect-square size-4 flex-shrink-0",
              customClassIcon,
            )}
          >
            <Image
              src="/icons/wallet.svg"
              alt={`Wallet Icon`}
              fill
              quality={100}
              className="absolute object-contain opacity-100 hover:text-primary group-hover/tracker:opacity-0"
            />
            <Image
              src="/icons/wallet.png"
              alt={`Wallet pink Icon`}
              fill
              quality={100}
              className="absolute object-contain opacity-0 hover:text-primary group-hover/tracker:opacity-100"
            />
          </div>
          <span
            className={cn(
              "font-geistSemiBold text-xs text-fontColorPrimary",
              customClassName,
              valueColor,
            )}
          >
            1
          </span>
        </div>
      );

    if (uniqueTrackers.length === 0) return null;
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                "group/tracker ml-1 flex items-center justify-center gap-x-[2px]",
                customClassIcon,
              )}
            >
              <div
                className={cn(
                  "relative aspect-square size-4 flex-shrink-0",
                  customClassIcon,
                )}
              >
                <Image
                  src="/icons/wallet.svg"
                  alt={`Wallet Icon`}
                  fill
                  quality={100}
                  className="absolute object-contain opacity-100 hover:text-primary group-hover/tracker:opacity-0"
                />
                <Image
                  src="/icons/wallet.png"
                  alt={`Wallet pink Icon`}
                  fill
                  quality={100}
                  className="absolute object-contain opacity-0 hover:text-primary group-hover/tracker:opacity-100"
                />
              </div>
              <span
                className={cn(
                  "font-geistSemiBold text-xs text-fontColorPrimary",
                  customClassName,
                  valueColor,
                )}
              >
                {uniqueTrackers.length}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent
            className="relative flex min-w-[120px] flex-col gap-y-1 rounded-[8px] border border-[#242436] bg-background p-3"
            side="bottom"
            showTriangle={false}
          >
            <div className="absolute -top-px left-2 z-10 h-px w-1/2 bg-gradient-to-r from-[#FFFFFF00] via-[#FFFFFF]/50 to-[#FFFFFF00]"></div>
            <div className="absolute -bottom-px right-2 z-10 h-px w-1/2 bg-gradient-to-r from-[#FFFFFF00] via-[#FFFFFF]/50 to-[#FFFFFF00]"></div>

            {(uniqueTrackers || [])?.map((item) => (
              <div className="flex" key={item.address}>
                <AddressWithEmojis
                  address={truncateString(item.name || "", 14)}
                  fullAddress={item.address}
                  className="!font-geistRegular text-sm text-[#DF74FF]"
                  emojis={[]}
                  trackedWalletIcon={item.emoji}
                  stripClassname="hidden"
                  isWithLink
                />
              </div>
            ))}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  },
);

TokenTrackers.displayName = "TokenTrackers";
export default TokenTrackers;
