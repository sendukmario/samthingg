import React, { useRef, useState, useEffect } from "react";
import { IgniteToken } from "@/apis/rest/igniteTokens";
import Image from "next/image";
import Link from "next/link";
import {
  EyeIcon,
  CopyIcon,
  SearchIcon,
  BundledWarnIcon,
  BundledCheckMarkIcon,
  PackageIcon,
  GlobeMarketCapIcon,
  PersonGroupIcon,
} from "@/components/customs/ignite-component/Icons";
import {
  TwitterIcon,
  PumpFunIcon,
  TelegramIcon,
} from "@/components/customs/ignite-component/Social";
import { cn } from "@/libraries/utils";
import { useHiddenTokensStore } from "@/stores/cosmo/use-hidden-tokens.store";
import { hideCosmoToken } from "@/apis/rest/cosmo";
import { useCustomToast } from "@/hooks/use-custom-toast";
import QuickBuyButton from "@/components/customs/buttons/QuickBuyButton";
import { formatNumber } from "@/utils/formatNumber";
// import TimeDifference from "../TimeDifference";
// import { DEX } from "@/types/ws-general";
import { lowerSection } from "../../ignite-component/IgniteLowerSection";
import { getDataItems } from "../../ignite-component/IgniteDataItems";
import { securityItems } from "../../ignite-component/IgniteSecurityItems";
import {
  CheckmarkIconSVG,
  PersonGroupIconSVG,
  WarningIconSVG,
} from "@/components/customs/ScalableVectorGraphics";
import CustomIgniteStats from "@/components/customs/cards/partials/CustomIgniteStats";
import { AvatarHighlightWrapper } from "@/components/customs/AvatarHighlightWrapper";
import AvatarWithBadgesIgnite from "@/components/customs/AvatarWithBadgesIgnite";
import GradientProgressBar from "@/components/customs/GradientProgressBar";
import TimeDifference from "@/components/customs/cards/TimeDifference";
import { DEX } from "@/types/ws-general";

interface IgniteCardMobileProps {
  token: IgniteToken;
  index: number;
}

const IgniteCardMobile: React.FC<IgniteCardMobileProps> = ({
  token,
  index,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [cardWidth, setCardWidth] = useState<number>(0);
  
  const { hiddenTokens, isTokenHidden, hideToken, unhideToken } =
    useHiddenTokensStore();
  const { success } = useCustomToast();

  useEffect(() => {
    const updateCardWidth = () => {
      if (cardRef.current) {
        setCardWidth(cardRef.current.offsetWidth);
      }
    };

    updateCardWidth();
    window.addEventListener('resize', updateCardWidth);

    return () => {
      window.removeEventListener('resize', updateCardWidth);
    };
  }, []);

  const handleCopyMint = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(token.mint).then(() => {
      success("Mint copied to clipboard");
    });
  };

  const handleToggleHidden = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (isTokenHidden(token.mint)) {
        unhideToken(token.mint);
        success("Successfully unhidden token");
        await hideCosmoToken(hiddenTokens.filter((t) => t !== token.mint));
      } else {
        hideToken(token.mint);
        success("Successfully hidden token");
        await hideCosmoToken([...hiddenTokens, token.mint]);
      }
    } catch (error) {
      console.warn("Error toggling token visibility:", error);
    }
  };

  const socialLinksButton = [
    {
      href: `https://x.com/${token.twitter}`,
      title: "Twitter",
      icon: <TwitterIcon />,
    },
    {
      href: `https://pump.fun/`, // Need to add token.pumpfun check
      title: "Pump.fun",
      icon: <PumpFunIcon />,
    },
    {
      href: `https://t.me/${token.telegram}`,
      title: "Telegram",
      icon: <TelegramIcon />,
    },
  ];

  const priceChange = token["1h"] ?? 0;
  const formattedChange = `${priceChange > 0 ? "+" : ""}${priceChange.toFixed(2)}%`;

  return (
    <div
      ref={cardRef}
      key={index}
      className="relative mb-3 flex flex-col overflow-hidden rounded-[9px] border-4 border-r-0 border-[#161621] bg-gradient-to-b from-[#1A1A23] to-[#12121F] py-2"
    >
      <div className="pointer-events-none absolute bottom-0 left-0 flex h-full w-full flex-col">
        <div className="relative h-[66px] w-full flex-shrink-0 bg-gradient-to-b from-[#080811] to-[#31313126]">
          <Image
            src="/stripe.svg"
            alt="Decorative Stripe"
            className="pointer-events-none absolute right-[-100px] top-0 z-[5] h-full w-auto object-cover opacity-[15%]"
            width={250}
            height={62}
          />
        </div>
        <div className="relative h-full w-full bg-[#161621]">
          <div className="absolute right-0 top-0 z-[10] -mx-3 h-0.5 w-full bg-gradient-to-r from-transparent to-[#8CD9B6]/[28%]" />
        </div>
      </div>

      <div className="relative z-[15] flex items-center gap-2 px-3 pb-3">
        <div className="z-[5] flex flex-col items-center justify-center">
          <AvatarHighlightWrapper size={40} walletHighlights={[]}>
            <AvatarWithBadgesIgnite
              isCosmo
              withImageHover
              classNameParent="border-1 relative z-[0] flex aspect-square size-[40px] flex-shrink-0 items-center justify-center rounded-full border border-[#DF74FF]/30 bg-border/0 backdrop-blur-lg"
              src={token?.image}
              alt={`${token.name} Image`}
              symbol={token?.symbol}
              size="md"
              rightClassName="bottom-[-2px] right-[-1px]"
              leftClassName="bottom-[-2px] left-[-1px]"
              sizeConstant={40}
            />
          </AvatarHighlightWrapper>
          <div className={`mt-1 flex items-center justify-center gap-1`}>
            <GradientProgressBar
              bondingCurveProgress={Math.round(
                Number(token?.migration?.progress),
              )}
              type="linear"
              className="w-[17px]"
            />

            <TimeDifference
              created={token?.created}
              migrated_time={token?.migration?.timestamp || 0}
              dex={token?.dex as DEX}
              className="font-geistRegular text-[8px]"
            />
          </div>
        </div>
        <div className="mb-2 flex w-full flex-col gap-2">
          <div className="flex items-center gap-1">
            <Link
              href={`/tokens/${token.mint}`}
              className="w-auto flex-shrink-0 overflow-hidden truncate whitespace-nowrap font-geistSemiBold text-sm text-fontColorPrimary"
            >
              {cardWidth <= 308 && token.name.length > 5
                ? token.name.slice(0, 5) + "..."
                : token.name.length > 10
                ? token.name.slice(0, 10) + "..."
                : token.name}
            </Link>

            <Link
              href={`/tokens/${token.mint}`}
              className="w-8 flex-shrink-0 overflow-hidden truncate whitespace-nowrap font-geistRegular text-xs text-fontColorSecondary"
            >
              {cardWidth <= 308 && token.symbol.length > 5
                ? token.symbol.slice(0, 5) + "..."
                : token.symbol.length > 8
                ? token.symbol.slice(0, 8) + "..."
                : token.symbol}
            </Link>

            <div className="flex w-full items-center justify-between">
              <div className="flex min-w-0 flex-grow items-center gap-1">
                {/* Eye Icon */}
                {/* Need to add hidden function through the filter component */}
                <button
                  onClick={handleToggleHidden}
                  title={
                    isTokenHidden(token.mint) ? "Show Token" : "Hide Token"
                  }
                  className="duration-300 hover:brightness-200"
                >
                  <EyeIcon />
                </button>

                {/* Copy Icon */}
                <button
                  onClick={handleCopyMint}
                  title="Copy Mint"
                  className="duration-300 hover:brightness-200"
                >
                  <CopyIcon />
                </button>

                {/* Search Icon */}
                <Link
                  href={`https://x.com/search?q=${token.mint}`}
                  target="_blank"
                  title="Search Token"
                  className="duration-300 hover:brightness-200"
                  onClick={(e) => e.stopPropagation()}
                >
                  <SearchIcon />
                </Link>
              </div>

              <div className="ml-auto flex items-center gap-1">
                {socialLinksButton.map((item) => (
                  <Link
                    key={item.title}
                    href={item.href}
                    target="_blank"
                    title={item.title}
                    className="flex size-[20px] items-center rounded-sm bg-[#29292F] p-[2px]"
                  >
                    {item.icon}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Bundled Status */}
            <div className="flex items-center gap-2">
              <div
                className="flex h-[16px] items-center gap-0.5 rounded-full px-2 text-[10px] text-fontColorPrimary bg-[#29292F]"
              >
                {token.bundled ? (
                  // Warning icon for Bundled
                  <WarningIconSVG className="scale-[0.8]" />
                ) : (
                  // Check mark icon for Not Bundled
                  <CheckmarkIconSVG className="scale-[0.8]" />
                )}

                <span className="mb-[-2px] text-[10px] leading-none text-fontColorPrimary">
                  {token.bundled ? "Bundled" : "Not Bundled"}
                </span>
              </div>
            </div>

            {/* Discord */}
            {token.discord_mentions && token.discord_mentions > 0 && (
              <div className="flex h-[16px] items-center gap-2">
                <div className="flex items-center gap-1 rounded-full bg-[#663CBD] px-2 py-[1px] text-xs text-fontColorPrimary">
                  {Array.from(
                    { length: token.discord_mentions },
                    (_, index) => (
                      <svg
                        key={index}
                        width="14"
                        height="15"
                        viewBox="0 0 14 15"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="size-[14px]"
                      >
                        <g clip-path="url(#clip0_48_3930)">
                          <path
                            d="M9.625 6.39995L4.375 3.37245"
                            stroke="white"
                            stroke-width="1.16667"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                          <path
                            d="M12.25 10.25V5.58329C12.2498 5.3787 12.1958 5.17776 12.0934 5.00064C11.991 4.82351 11.8438 4.67642 11.6667 4.57412L7.58333 2.24079C7.40598 2.1384 7.20479 2.08449 7 2.08449C6.79521 2.08449 6.59402 2.1384 6.41667 2.24079L2.33333 4.57412C2.15615 4.67642 2.00899 4.82351 1.9066 5.00064C1.80422 5.17776 1.75021 5.3787 1.75 5.58329V10.25C1.75021 10.4545 1.80422 10.6555 1.9066 10.8326C2.00899 11.0097 2.15615 11.1568 2.33333 11.2591L6.41667 13.5925C6.59402 13.6949 6.79521 13.7488 7 13.7488C7.20479 13.7488 7.40598 13.6949 7.58333 13.5925L11.6667 11.2591C11.8438 11.1568 11.991 11.0097 12.0934 10.8326C12.1958 10.6555 12.2498 10.4545 12.25 10.25Z"
                            stroke="white"
                            stroke-width="1.16667"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                          <path
                            d="M1.90747 4.97662L6.99997 7.92246L12.0925 4.97662"
                            stroke="white"
                            stroke-width="1.16667"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                          <path
                            d="M7 13.7966V7.91663"
                            stroke="white"
                            stroke-width="1.16667"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                        </g>
                        <defs>
                          <clipPath id="clip0_48_3930">
                            <rect
                              width="14"
                              height="14"
                              fill="white"
                              transform="translate(0 0.916626)"
                            />
                          </clipPath>
                        </defs>
                      </svg>
                    ),
                  )}
                </div>
              </div>
            )}

            {/* Groups */}
            <div className="flex items-center gap-2">
              <div className="flex h-[16px] items-center gap-1 rounded-full bg-[#29292F] px-2 text-[10px] text-fontColorPrimary">
                <PersonGroupIconSVG />

                <span className="text-xs text-fontColorPrimary">
                  {token.launchpad ?? token.dex ?? "-"}
                </span>
              </div>
            </div>
          </div>
        </div>
        i
      </div>

      <div className="z-[15] flex items-center justify-between px-3 py-2">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1">
            <GlobeMarketCapIcon />

            <span className="font-geistSemiBold text-xs text-fontColorPrimary">
              Market Cap
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="flex items-center font-geistSemiBold text-sm text-success">
              {formatNumber(token.market_cap_usd || 0)}
            </span>

            <span className="flex items-center font-geistSemiBold text-xs text-[#F65B93]">
              {formattedChange}
            </span>
          </div>
        </div>

        <QuickBuyButton
          module="ignite"
          variant="ignite"
          mintAddress={token.mint}
        />
      </div>

      <div className="z-[15] my-1 flex w-full flex-col gap-1 px-1">
        <CustomIgniteStats
          type="data"
          regular_traders={token.regular_traders ?? 0}
          volume_usd={token.volume_usd ?? 0}
          dev_migrated={token.dev_migrated ?? 0}
          sniper_percentage={token.sniper_percentage ?? 0}
          market_cap_usd={token.market_cap_usd ?? 0}
          liquidity_usd={token.liquidity_usd ?? 0}
          insider_percentage={token.insider_percentage ?? 0}
          holders={token.holders ?? 0}
          dev_holding_percentage={token.dev_holding_percentage ?? 0}
        />

        <CustomIgniteStats
          type="security"
          regular_traders={token.regular_traders ?? 0}
          volume_usd={token.volume_usd ?? 0}
          dev_migrated={token.dev_migrated ?? 0}
          sniper_percentage={token.sniper_percentage ?? 0}
          market_cap_usd={token.market_cap_usd ?? 0}
          liquidity_usd={token.liquidity_usd ?? 0}
          insider_percentage={token.insider_percentage ?? 0}
          holders={token.holders ?? 0}
          dev_holding_percentage={token.dev_holding_percentage ?? 0}
        />
      </div>
    </div>
  );
};

export default IgniteCardMobile;
