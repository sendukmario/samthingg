"use client";

import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { getProxyUrl } from "@/utils/getProxyUrl";
import { cn } from "@/libraries/utils";
import { getSimilarTokens } from "@/apis/rest/tokens";
import { formatAmountDollar } from "@/utils/formatAmount";
import { formatRelativeTime } from "@/utils/formatTime";
import Link from "next/link";
import { SimilarTokenImage } from "@/components/customs/token/SimilarTokens";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getMarketCapColor } from "@/utils/getMarketCapColor";

interface TokenImageHoverProps {
  src: string;
  symbol: string;
  isCosmo?: boolean;
  handleGoogleLensSearch?: (e: React.MouseEvent, image: string) => void;
}

const TokenImageHover = ({
  src,
  symbol,
  isCosmo = false,
  handleGoogleLensSearch,
}: TokenImageHoverProps) => {
  const imageSrc = useMemo(() => {
    const base = getProxyUrl(src as string, symbol?.[0] || "");
    return `${base}`;
  }, [src, symbol]);
  const showFallback = !imageSrc;

  // Fetch similar tokens
  const { data: similarTokens, isLoading } = useQuery({
    queryKey: ["similar-tokens", symbol, isCosmo],
    queryFn: () => getSimilarTokens(symbol),
    enabled: Boolean(symbol && isCosmo),
  });

  // Filter out current token and deduplicate
  const filteredTokens = useMemo(() => {
    if (isLoading) return [];
    const seenTokens = new Set();
    return (
      similarTokens &&
      similarTokens.filter((token) => {
        const key = `${token.mint}-${token.name}`;
        if (seenTokens.has(key)) return false;
        seenTokens.add(key);
        // No currentMint prop, so skip this check
        return true;
      })
    );
  }, [similarTokens, isLoading]);

  return (
    <>
      {isCosmo ? (
        <div className="z-[1000] flex flex-col items-center justify-center rounded-[8px] bg-[#2B2B3B]">
          <div className="relative p-1.5">
            <Image
              key={imageSrc}
              src={imageSrc as string}
              alt="token image"
              width={236}
              height={236}
              className="cursor-pointer rounded-[3px]"
              priority
              quality={50}
            />

            {handleGoogleLensSearch && imageSrc && !showFallback && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  handleGoogleLensSearch(e, imageSrc || "");
                }}
                className={cn(
                  "absolute bottom-[8px] right-[8px] flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-[#000000]/70 opacity-100",
                )}
                aria-label="Search with Google Lens"
              >
                <Image
                  src="/icons/token/google-lens-icon.svg"
                  alt="Google Lens Icon"
                  width={20}
                  height={20}
                />
              </button>
            )}
          </div>

          <div className="flex w-full items-center justify-start p-1.5">
            <p className="text-[12px] font-normal leading-[16px] text-fontColorSecondary">
              Similar Token
            </p>
          </div>

          <div className="flex w-full flex-col">
            {isLoading ? (
              <div className="flex h-[56px] w-full items-center justify-center">
                <span className="text-xs text-fontColorSecondary">
                  Loading similar tokenssss...
                </span>
              </div>
            ) : filteredTokens && filteredTokens.length > 0 ? (
              filteredTokens.slice(0, 2).map((token, index) => {
                const generateTokenUrl = () => {
                  if (!token?.mint) return "#";

                  const params = new URLSearchParams({
                    symbol: token?.symbol || "",
                    name: token?.name || "",
                    image: token?.image || "",
                    twitter: "",
                    website: "",
                    telegram: "",
                    market_cap_usd: "",
                    liquidity_usd: "",
                    progress: "",
                    dex: token?.dex || "",
                    origin_dex: "",
                    liquidity_base: "",
                  });

                  return `/token/${token.mint}?${params.toString()}`;
                };

                return (
                  <Link key={token.mint} href={generateTokenUrl()}>
                    <div
                      className={cn(
                        "flex h-auto w-full cursor-pointer items-center justify-between px-4 py-2.5 hover:bg-white/[4%]",
                        index !== filteredTokens.length - 1 &&
                          "border-b border-border",
                      )}
                    >
                      <div className="flex max-w-[70%] items-center gap-x-3">
                        <div className="flex w-full flex-col overflow-hidden">
                          <div className="flex items-center gap-x-2">
                            <SimilarTokenImage
                              alt={`${token.name} Token Icon`}
                              src={token.image as string}
                            />
                            <span className="flex-shrink-0 font-geistSemiBold text-[14px] text-fontColorPrimary">
                              {token.symbol}
                            </span>
                            {token.name && (
                              <div className="flex min-w-0 items-center">
                                <span className="max-w-[80px] truncate text-[14px] text-fontColorSecondary">
                                  {token.name}
                                </span>
                              </div>
                            )}
                          </div>
                          <span className="truncate text-[14px] text-fontColorSecondary">
                            Last TX: {formatRelativeTime(token.lastTrade)}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end">
                        <span className="text-[14px] text-success">
                          {formatRelativeTime(token.createdAt)}
                        </span>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span
                                className={`max-w-[100px] truncate text-right font-geistSemiBold text-[14px] ${getMarketCapColor(Number(token.marketCap))}`}
                              >
                                {formatAmountDollar(Number(token.marketCap))}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent className="z-[1000]">
                              <p>
                                {formatAmountDollar(Number(token.marketCap))}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="flex h-[56px] w-full items-center justify-center">
                <span className="text-xs text-fontColorSecondary">
                  No similar tokens found
                </span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          <Image
            key={imageSrc}
            src={imageSrc as string}
            alt="token image"
            fill
            className="rounded-[8px] object-cover"
            priority
            quality={50}
          />

          {handleGoogleLensSearch && imageSrc && !showFallback && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                handleGoogleLensSearch(e, imageSrc || "");
              }}
              className={cn(
                "absolute bottom-[8px] right-[8px] flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-[#000000]/70 opacity-100",
              )}
              aria-label="Search with Google Lens"
            >
              <Image
                src="/icons/token/google-lens-icon.svg"
                alt="Google Lens Icon"
                width={20}
                height={20}
              />
            </button>
          )}
        </>
      )}
    </>
  );
};

export default React.memo(TokenImageHover);
