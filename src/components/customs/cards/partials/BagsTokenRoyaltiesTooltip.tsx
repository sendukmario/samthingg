import React from "react";
import { BagsRoyalty } from "@/types/ws-general";
import Image from "next/image";

interface BagsTokenRoyaltiesTooltipProps {
  bags_royalties: BagsRoyalty[];
  isCreator?: boolean;
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
}

const formatWalletAddress = (address: string) => {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const formatPercentage = (value: number) => {
  // Handle edge cases
  if (value >= 1) return "100%";
  if (value <= 0) return "0%";
  
  // Convert to percentage
  const percentage = value * 100;
  
  // Format with appropriate decimal places
  if (percentage % 1 === 0) {
    // If it's a whole number, show no decimals
    return `${percentage.toFixed(0)}%`;
  } else if (percentage >= 10) {
    // For values >= 10%, show 1 decimal place
    return `${percentage.toFixed(1)}%`;
  } else {
    // For values < 10%, show 1 decimal place
    return `${percentage.toFixed(1)}%`;
  }
};

const BagsTokenRoyaltiesTooltip: React.FC<BagsTokenRoyaltiesTooltipProps> = ({
  bags_royalties,
  isCreator = false,
  dev_wallet_details,
}) => {
  const { developer, funder } = dev_wallet_details;
  return (
    <div className="flex min-w-[250px] flex-col gap-2 p-2">
      <p className="font-geistMedium text-xs text-fontColorPrimary">
        Bags Token Royalties
      </p>

      <div className="flex flex-col gap-2">
        {bags_royalties.map((bags_royalties, index) => (
          <div
            key={index}
            className="flex items-center gap-2 border-t-2 border-white/10 pt-2"
          >
            <Image
              src={bags_royalties.profile_picture}
              alt={bags_royalties.username}
              width={50}
              height={50}
              className="aspect-square rounded-full object-cover"
            />
            <div className="flex w-full items-center justify-between gap-1">
              <div className="flex flex-col gap-0">
                <span className="text-[10px] text-fontColorSecondary">
                  created by
                </span>
                <span className="font-geistMedium text-xs text-fontColorPrimary">
                  {bags_royalties.username}
                </span>
                <span className="text-xs text-fontColorSecondary">
                  {formatWalletAddress(dev_wallet_details.funder.wallet)}
                </span>
              </div>

              <p className="rounded-full bg-white/20 px-2 py-1 font-geistSemiBold text-sm text-fontColorPrimary">
                {formatPercentage(bags_royalties.percentage)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BagsTokenRoyaltiesTooltip;
