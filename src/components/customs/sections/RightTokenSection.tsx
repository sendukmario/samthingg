"use client";

// ######## Libraries 📦 & Hooks 🪝 ########
import { useTokenMessageStore } from "@/stores/token/use-token-messages.store";
import { useRouter, useSearchParams } from "next/navigation";
// ######## Components 🧩 ########
import Image from "next/image";
// Dynamically import components
const TokenInformation = dynamic(
  () => import("@/components/customs/token/TokenInformation"),
  {
    ssr: false,
    loading: TokenInformationLoading,
  },
);
const TokenTrendingTime = dynamic(
  () => import("@/components/customs/token/TokenTrendingTime"),
  {
    ssr: false,
    loading: TokenTrendingTimeLoading,
  },
);
const TokenBuyAndSell = dynamic(
  () => import("@/components/customs/token/TokenBuyAndSell"),
  {
    ssr: false,
  },
);
const TokenDataAndSecurity = dynamic(
  () => import("@/components/customs/token/TokenDataAndSecurity"),
  {
    ssr: false,
  },
);
const SimilarTokens = dynamic(
  () => import("@/components/customs/token/SimilarTokens"),
  {
    ssr: false,
  },
);
const DeveloperAddress = dynamic(
  () => import("@/components/customs/DeveloperAddress"),
  {
    ssr: false,
  },
);
// import TokenBuyAndSell from "@/components/customs/token/TokenBuyAndSell";
// import TokenInformation from "@/components/customs/token/TokenInformation";
// import TokenTrendingTime from "@/components/customs/token/TokenTrendingTime";
// import TokenDataAndSecurity from "@/components/customs/token/TokenDataAndSecurity";
// import SimilarTokens from "@/components/customs/token/SimilarTokens";

// ######## Utils & Helpers 🤝 #######
import { cn } from "@/libraries/utils";
// ######## Types 🗨️ ########
import { PriceInfo, TokenDataMessageType, TokenInfo } from "@/types/ws-general";
import React, { useEffect, useMemo } from "react";
import { useIsClient } from "@/hooks/use-is-client";
import { usePopupStore } from "@/stores/use-popup-state.store";
import dynamic from "next/dynamic";
import {
  TokenInformationLoading,
  TokenTrendingTimeLoading,
} from "../loadings/TokenPageLoading";

export default React.memo(function RightTokenSection({
  initChartData,
}: {
  initChartData: TokenDataMessageType | null;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tempTokenData = {
    token: {
      mint: searchParams?.get("token") || "",
      symbol: searchParams?.get("symbol") || "",
      name: searchParams?.get("name") || "",
      image: searchParams?.get("image") || "",
      twitter: searchParams?.get("twitter") || "",
      website: searchParams?.get("website") || "",
      telegram: searchParams?.get("telegram") || "",
      dex: searchParams?.get("dex") as any,
      origin_dex: searchParams?.get("origin_dex") as any,
      pair: searchParams?.get("pair") || "",
    } as TokenInfo,
    price: {
      // liquidity_usd: Number(searchParams?.get("liquidity_usd")) || 0,
      price_usd: Number(searchParams?.get("price_usd")) || 0,
      // market_cap_usd: Number(searchParams?.get("market_cap_usd")) || 0,
      // migrating: searchParams?.get("migrating") === "true",
      migration: {
        market_cap_base: 0,
        market_cap_usd: 0,
        migrating: searchParams?.get("migrating") === "true",
        price_base: 0,
        price_usd: 0,
        progress: Number(searchParams?.get("progress")) || 0,
        timestamp: 0,
      },
      price_base: Number(searchParams?.get("price_base")) || 0,
      // price_base_str: searchParams?.get("price_base") || "0",
      // price_usd_str: searchParams?.get("price_usd") || "0",
      // progress: Number(searchParams?.get("progress")) || 0,
      // supply: Number(searchParams?.get("supply")) || 0,
      volume_base: Number(searchParams?.get("volume_base")) || 0,
      volume_usd: Number(searchParams?.get("volume_usd")) || 0,
    } as PriceInfo,
  };

  useEffect(() => {
    // Clear URL parameters after getting the data
    if (searchParams?.toString() && !!initChartData) {
      router.replace(window.location.pathname);
    }
  }, [initChartData?.token?.mint]);

  const tokenSymbolMessage = useTokenMessageStore(
    (state) => state.tokenInfoMessage.symbol,
  );
  const finalSymbolInfo =
    tokenSymbolMessage !== ""
      ? tokenSymbolMessage
      : initChartData?.token?.symbol || tempTokenData.token?.symbol;

  const currentMint = initChartData?.token?.mint || tempTokenData.token?.mint;

  const priceMessage = useTokenMessageStore((state) => state.priceMessage);
  const finalPrice =
    priceMessage?.price_sol || priceMessage?.price_base
      ? priceMessage
      : initChartData?.price;

  const { popups, remainingScreenWidth } = usePopupStore();
  const isSnapOpen = useMemo(
    () => popups.some((p) => p.isOpen && p.snappedSide !== "none"),
    [popups],
  );

  const isClient = useIsClient();

  return (
    <div
      className={cn(
        "relative z-0 row-span-2 flex h-full flex-col items-start gap-4 md:mb-2 md:min-w-[365px] md:max-w-[365px]",
        isSnapOpen && "min-w-[300px]",
        remainingScreenWidth <= 900 && "md:mb-0 md:max-w-full md:px-3",
      )}
    >
      {/* Migrating mobile */}
      {(finalPrice?.migration?.migrating ||
        tempTokenData?.price?.migration?.migrating) &&
        isClient && (
          <div className="flex h-[96px] w-full flex-col gap-y-[4px] bg-gradient-to-t from-[#2A1F09] to-background p-4 md:hidden">
            <h1 className="flex w-fit items-center justify-center gap-x-[8px] text-base text-[#FABF47]">
              <div className="relative inline-block size-[24px]">
                <Image
                  src="/icons/yellow-migrating.svg"
                  alt="Clock Migrating"
                  layout="fill"
                  objectFit="contain"
                />
              </div>
              {finalSymbolInfo?.toUpperCase()} is migrating...
            </h1>
            <p className="text-[13px] text-white/70">
              Bonding curve has reached 100% and the token LP is currently being
              migrated to Raydium (May take up to 30 min).
            </p>
          </div>
        )}

      <div className="flex w-full flex-shrink-0 flex-grow flex-col items-start px-4 md:gap-2 md:px-0">
        <>
          <TokenInformation
            initPrice={initChartData?.price || tempTokenData.price || null}
            initTokenInfo={initChartData?.token || tempTokenData.token || null}
          />
          <TokenTrendingTime initVolumeData={initChartData?.volume || null} />
          <TokenBuyAndSell
            module="token_page"
            isMigrating={
              finalPrice?.migration?.migrating ||
              tempTokenData?.price?.migration?.migrating
            }
            tokenSymbol={finalSymbolInfo || tempTokenData.token.symbol}
          />
          <DeveloperAddress />
          <TokenDataAndSecurity
            initTokenSecurityData={initChartData?.data_security || null}
          />
          <div
            className={cn(
              "hidden md:block md:w-full",
              remainingScreenWidth <= 768 && "md:hidden",
            )}
          >
            <SimilarTokens
              tokenSymbol={finalSymbolInfo || tempTokenData.token.symbol}
              currentMint={currentMint}
            />
          </div>
        </>
      </div>
    </div>
  );
});
