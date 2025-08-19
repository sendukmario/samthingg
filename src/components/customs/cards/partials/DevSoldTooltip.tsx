import React from "react";
import Image from "next/image";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useSolPriceMessageStore } from "@/stores/use-solprice-message.store";
import { formatAmountDollar } from "@/utils/formatAmount";

interface DevSoldTooltipProps {
  dev_wallet_details: {
    developer: string;
    funder: {
      amount: number;
      time: number;
      wallet: string;
      exchange: string;
      tx_hash: string;
    };
    mint: string;
  };
  colorSetting?: "normal" | "cupsey";
}

const DevSoldTooltip: React.FC<DevSoldTooltipProps> = ({
  dev_wallet_details,
  colorSetting = "normal",
}) => {
  const { developer, funder } = dev_wallet_details;
  const solanaPrice = useSolPriceMessageStore((state) => state.messages.price);

  const formatWalletAddress = (address: string) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60),
    );

    if (diffInHours < 24) {
      return `${diffInHours}h`;
    }
    return `${Math.floor(diffInHours / 24)}d`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const FUNDING_LOGOS = dev_wallet_details?.funder?.exchange;

  const FUNDING_LOGOS_PATH =
    !FUNDING_LOGOS || FUNDING_LOGOS === "Unknown" || FUNDING_LOGOS === ""
      ? "/icons/solana.svg"
      : FUNDING_LOGOS === "Binance 2"
        ? "/icons/funding-logos/binance.webp"
        : `/icons/funding-logos/${FUNDING_LOGOS.toLowerCase()}.webp`;

  const FUNDING_LOGOS_ALT =
    !FUNDING_LOGOS || FUNDING_LOGOS === "Unknown" || FUNDING_LOGOS === ""
      ? "Unknown Logo"
      : FUNDING_LOGOS;

  return (
    <div className="flex min-w-[200px] flex-col gap-2 p-2">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-fontColorSecondary">
            Wallet Address
          </span>
          {/* Wallet Address */}
          <div className="flex items-center gap-1">
            <span className="font-geistMedium text-sm text-fontColorPrimary">
              {formatWalletAddress(developer)}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                copyToClipboard(developer);
              }}
            >
              <Image
                src="icons/copy-devsold.svg"
                alt="Copy Icon"
                width={16}
                height={16}
              />
            </button>
          </div>
        </div>

        <div className="relative">
          <Image
            src={FUNDING_LOGOS_PATH}
            alt={FUNDING_LOGOS_ALT}
            width={32}
            height={32}
            className="aspect-square rounded-full"
          />

          <button
            onClick={(e) => {
              e.stopPropagation();
              window.open(FUNDING_LOGOS_PATH, "_blank");
            }}
            className="absolute inset-0 top-[80%] m-auto h-fit w-fit cursor-pointer"
          >
            <Image
              src="/icons/maximize-funding.svg"
              alt="Maximize Funding Icon"
              width={12}
              height={12}
              className="aspect-square rounded-full"
            />
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-x-0.5">
        {/* Amount */}
        <div className="relative flex flex-col items-center justify-center gap-1 overflow-hidden rounded-l-md px-1 py-2">
          {/* White overlay layer with 25% opacity above the gradient background */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(255,255,255,0.075)",
              pointerEvents: "none",
              zIndex: 1,
            }}
          />
          <Image
            src="icons/wallet-04.svg"
            alt="Wallet Icon"
            width={14}
            height={14}
          />
          <div className="flex flex-col items-center justify-center gap-0.5">
            <div className="flex items-center gap-0.5">
              <Image
                src={"/icons/solana.svg"}
                alt="Solana Icon"
                width={14}
                height={14}
                className="aspect-square"
              />
              <span className="font-geistSemiBold text-sm text-fontColorPrimary">
                {(funder.amount / LAMPORTS_PER_SOL).toFixed(3)}
              </span>
            </div>
            <span className="text-xs text-fontColorSecondary">
              {formatAmountDollar(
                (funder.amount / LAMPORTS_PER_SOL) * solanaPrice,
              )}
            </span>
          </div>
        </div>

        {/* Time */}
        <div className="relative flex flex-col items-center justify-center gap-1 overflow-hidden rounded-r-md px-1 py-2">
          {/* White overlay layer with 25% opacity above the gradient background */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(255,255,255,0.075)",
              pointerEvents: "none",
              zIndex: 1,
            }}
          />
          <Image
            src="/icons/clock.svg"
            alt="Clock Icon"
            width={14}
            height={14}
          />
          <div className="flex flex-col items-center justify-center gap-0.5">
            <span className="font-geistMedium text-sm text-fontColorPrimary">
              {formatTime(funder.time)}
            </span>
            <span className="text-xs text-fontColorSecondary">Funded</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DevSoldTooltip;
