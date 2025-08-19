"use client";

import { IgniteToken } from "@/apis/rest/igniteTokens";
import { IgniteTokensQueryParams } from "@/apis/rest/igniteTokens";
import { useCustomToast } from "@/hooks/use-custom-toast";
import Image from "next/image";
import { AvatarHighlightWrapper } from "@/components/customs/AvatarHighlightWrapper";
import { formatAmountDollar } from "@/utils/formatAmount";
import {
  getRightBadgeType,
  getLeftBadgeType,
} from "@/components/customs/AvatarWithBadges";
import { DEX, LAUNCHPAD } from "@/types/ws-general";
import Link from "next/link";
import QuickBuyButton from "@/components/customs/buttons/QuickBuyButton";
import SocialLinks from "@/components/customs/cards/partials/SocialLinks";
import {
  CheckmarkIconSVG,
  CopyIconSVG,
  EyeIconSVG,
  SearchIconSVG,
  WarningIconSVG,
  WebsitegreenIconSVG,
  PersonGroupIconSVG,
} from "@/components/customs/ScalableVectorGraphics";
import { cn } from "@/libraries/utils";
import GradientProgressBar from "@/components/customs/GradientProgressBar";
import TimeDifference from "@/components/customs/cards/TimeDifference";
import { hideCosmoToken } from "@/apis/rest/cosmo";
import { useHiddenTokensStore } from "@/stores/cosmo/use-hidden-tokens.store";
import { useCallback, useMemo } from "react";
import { useCustomizeSettingsStore } from "@/stores/setting/use-customize-settings.store";
import AvatarWithBadgesIgnite from "@/components/customs/AvatarWithBadgesIgnite";
import CustomIgniteStats from "@/components/customs/cards/partials/CustomIgniteStats";
import { formatPercentage } from "@/utils/formatPercentage";
import { useTrackedWalletsOfToken } from "@/hooks/use-tracked-wallets-of-token";
import { useCachedKols } from "@/hooks/useCachedKols";
import { useCustomizeTheme } from "@/hooks/use-customize-theme";
import React from "react";
import { useRouter } from "nextjs-toploader/app";
import { truncateString } from "@/utils/truncateString";
// Added: react-query & Discord pings API to fetch discord mention counts when not provided by the Ignite feed
import { useQuery } from "@tanstack/react-query";
import { fetchTokenPings } from "@/apis/rest/discord-monitor";
import type { PingResponseDiscord } from "@/types/monitor";
import type { PingDiscord } from "@/types/monitor";

// Mapping for Discord group → avatar image (same as Monitor page)
const discordGroupImages: Record<string, string> = {
  Vanquish: "/icons/vanquish.jpg",
  Potion: "/icons/potion.jpg",
  Minted: "/icons/minted.jpg",
  "Champs Only": "/icons/champs-only.jpg",
  "Shocked Trading": "/icons/shocked-trading.png",
  "Technical Alpha Group": "/icons/alpha-group.jpg",
  "Nova Playground": "/logo.png",
};

interface IgniteCardProps {
  token: IgniteToken;
  tokenQueryParams?: IgniteTokensQueryParams;
  index?: number;
}

// const IgniteTooltip: React.FC<SecurityTooltipProps> = ({
//   label,
//   children,
//   icon,
// }) => (
//   <TooltipProvider>
//     <Tooltip delayDuration={0}>
//       <TooltipTrigger asChild>{children}</TooltipTrigger>
//       <TooltipContent
//         side="bottom"
//         align="center"
//         showTriangle={false}
//         sideOffset={10}
//         className="!border-none !bg-transparent !p-0 !shadow-none"
//       >
//         <div className="gb__white__tooltip flex min-w-[116px] flex-col items-center justify-center gap-1 rounded-[8px] border border-[#242436] bg-[#272730] p-3 text-center shadow-[0_10px_20px_0_#000]">
//           <div className="flex w-full items-center justify-start gap-1">
//             {icon}
//             <span className="font-geist text-nowrap text-center text-[12px] font-semibold leading-4 text-fontColorPrimary">
//               {label}
//             </span>
//           </div>
//         </div>
//       </TooltipContent>
//     </Tooltip>
//   </TooltipProvider>
// );

const IgniteCard: React.FC<IgniteCardProps> = ({ token, index }) => {
  // Derived display values from token data
  const priceChange = token["1h"] ?? 0;
  // ATH percentage (ath/ping - 1) stored as decimal, convert to percent *100
  const athPercent = (token as any).athPercentSincePing as number | undefined;
  const displayPercent = athPercent !== undefined ? athPercent : priceChange;
  // ---------------------------------------------------------------------------
  // Discord Mentions ----------------------------------------------------------
  // Fetch discord mention count on-demand (when the Ignite feed hasn’t provided
  // it).  We reuse the same REST endpoint utilised by the Monitor page to
  // guarantee data parity across the application.  Results are cached by
  // react-query for 5 minutes to avoid redundant requests when the same token
  // appears multiple times.
  // ---------------------------------------------------------------------------

  const { data: discordPingData } = useQuery<PingResponseDiscord | undefined>({
    queryKey: ["discordMentions", token.mint],
    queryFn: () => fetchTokenPings(token.mint),
    enabled:
      !!token.mint &&
      (token.discord_mentions === undefined || token.discord_mentions === null),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const discordMentions = React.useMemo(() => {
    const raw = token.discord_mentions ?? discordPingData?.total_count;
    return typeof raw === "number" && raw > 0 ? raw : 0;
  }, [token.discord_mentions, discordPingData]);

  // Derive a list of profile images to display (unique groups, max 10)
  const discordProfileImages = React.useMemo(() => {
    if (!discordMentions || !discordPingData?.pings?.length) return [];

    const imgs: string[] = [];
    (discordPingData.pings as PingDiscord[]).forEach((ping) => {
      const src =
        discordGroupImages[ping.group] || "/images/groups/default.png";
      if (!imgs.includes(src)) imgs.push(src);
    });
    return imgs.slice(0, 10); // cap to 10 images for performance / layout
  }, [discordMentions, discordPingData]);
  // const formattedChange = `${priceChange > 0 ? "+" : ""}${priceChange.toFixed(2)}%`;

  // Memoized color class for percentage display
  const percentageColorClass = useMemo(() => {
    return displayPercent >= 0 ? "text-success" : "text-[#F65B93]";
  }, [displayPercent]);
  const customizedSettingPresets = useCustomizeSettingsStore(
    (state) => state.presets,
  );
  const customizedSettingActivePreset = useCustomizeSettingsStore(
    (state) => state.activePreset,
  );
  const currentPresets = useMemo(
    () => ({
      fontSetting:
        customizedSettingPresets[customizedSettingActivePreset].fontSetting ||
        "normal",
      avatarSetting:
        customizedSettingPresets[customizedSettingActivePreset].avatarSetting ||
        "normal",
      colorSetting:
        customizedSettingPresets[customizedSettingActivePreset].colorSetting ||
        "normal",
      buttonSetting:
        customizedSettingPresets[customizedSettingActivePreset].buttonSetting ||
        "normal",
      cosmoCardStyleSetting:
        customizedSettingPresets[customizedSettingActivePreset]
          .cosmoCardStyleSetting || "type1",
    }),
    [customizedSettingPresets, customizedSettingActivePreset],
  );
  const formattedStats = useMemo(
    () => ({
      marketCap: token.market_cap_usd
        ? formatAmountDollar(token.market_cap_usd)
        : "0",
    }),
    [token.market_cap_usd],
  );

  const market_cap_usd = token.market_cap_usd;

  // Wallet tracker count for this token
  const { walletsOfToken } = useTrackedWalletsOfToken();
  const { getKolsDisplayForToken } = useCachedKols();

  const trackedWalletDisplay = useMemo(() => {
    const wallets = walletsOfToken[token.mint] ?? [];
    if (wallets.length === 0) return null; // Return null to hide UI

    // Get KOLs display with emojis from cached data
    // Only show if we have actual KOLs data, never show wallet count fallback
    return getKolsDisplayForToken(token.mint, wallets);
  }, [walletsOfToken, getKolsDisplayForToken, token.mint]);
  const marketCapValueColor = useMemo(() => {
    if (!market_cap_usd) return "text-destructive";

    if (market_cap_usd > 100000)
      return currentPresets.colorSetting === "cupsey"
        ? "text-[#50D7B0]"
        : "text-success";
    if (market_cap_usd > 30000)
      return currentPresets.colorSetting === "cupsey"
        ? "text-[#E7B587]"
        : "text-warning";
    if (market_cap_usd > 15000)
      return currentPresets.colorSetting === "cupsey"
        ? "text-[#73D5F8]"
        : "text-[#6ac0ed]";
    return currentPresets.colorSetting === "cupsey"
      ? "text-[#FF4B92]"
      : "text-destructive";
  }, [market_cap_usd, currentPresets.colorSetting]);

  // const percentageColor = priceChange >= 0 ? "#49C78E" : "#F65B93";

  const rightBadgeType = getRightBadgeType(
    (token.dex || "") as DEX,
    (token.launchpad || "") as LAUNCHPAD,
  );
  const leftBadgeType = getLeftBadgeType(
    (token.dex || "") as DEX,
    (token.origin_dex || "") as DEX,
    (token.launchpad || "") as LAUNCHPAD,
  );

  const { success: successToast } = useCustomToast();

  // Hidden tokens store
  const { hideToken, unhideToken, isTokenHidden, hiddenTokens } =
    useHiddenTokensStore();

  const handleToggleHidden = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (isTokenHidden(token.mint)) {
        unhideToken(token.mint);
        successToast("Successfully unhidden token");
        await hideCosmoToken(hiddenTokens.filter((t) => t !== token.mint));
      } else {
        hideToken(token.mint);
        successToast("Successfully hidden token");
        await hideCosmoToken([...hiddenTokens, token.mint]);
      }
    } catch (error) {
      console.warn("Error toggling token visibility:", error);
    }
  };

  const handleCopyMint = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(token.mint).then(() => {
      successToast("Mint copied to clipboard");
    });
  };

  const handleGoogleLensSearch = (e: React.MouseEvent, image: string) => {
    e.stopPropagation();
    e.preventDefault();
    const googleLensUrl = `https://lens.google.com/uploadbyurl?url=${encodeURIComponent(image)}`;
    window.open(googleLensUrl, "_blank");
  };

  const theme = useCustomizeTheme();

  const cardRef = React.useRef<HTMLDivElement>(null);
  const [cardHeight, setCardHeight] = React.useState(0);

  React.useEffect(() => {
    const updateHeight = () => {
      if (cardRef.current) {
        setCardHeight(cardRef.current.offsetHeight);
      }
    };

    // Initial height measurement
    updateHeight();

    // Create ResizeObserver to watch for height changes
    const resizeObserver = new ResizeObserver(() => {
      updateHeight();
    });

    if (cardRef.current) {
      resizeObserver.observe(cardRef.current);
    }

    // Also listen for window resize
    window.addEventListener("resize", updateHeight);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateHeight);
    };
  }, [token]);
  const router = useRouter();

  const handleCardClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      console.warn("CLICK 👀👀👀", {
        e,
      });

      const url = `/token/${token.mint}`;

      if (e.metaKey || e.ctrlKey) {
        window.open(url, "_blank");
        return;
      }

      router.push(url);
    },
    [router, token.mint],
  );

  const handleCardContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      window.open(`/token/${token.mint}`, "_blank");
    },
    [token.mint],
  );

  return (
    <div className={cn("mb-1 text-fontColorPrimary", index === 0 && "mt-1.5")}>
      <div
        ref={cardRef}
        onClick={handleCardClick}
        onContextMenu={handleCardContextMenu}
        onMouseDown={(e) => {
          if (e.button === 1) {
            e.preventDefault();
            handleCardContextMenu(e);
          }
        }}
        className="group relative flex min-h-[110px] w-full cursor-pointer items-center gap-4 overflow-hidden rounded-[9px] border-4 border-r-0 px-3 py-2"
        style={{
          backgroundColor: theme.cosmoCard1.header.backgroundColor,
          borderColor: theme.cosmoCard1.header.backgroundColor,
        }}
      >
        <div className="pointer-events-none absolute bottom-0 left-0 flex h-full w-full flex-col">
          <div
            className="relative h-full w-full"
            style={{
              backgroundImage: `linear-gradient(to bottom, ${theme.background.backgroundColor}, #31313126)`,
            }}
          >
            <Image
              src="/stripe.svg"
              alt="Decorative Stripe"
              className="pointer-events-none absolute right-[13px] top-0 z-[5] h-full w-auto object-cover opacity-20"
              width={250}
              height={62}
            />
          </div>
          <div
            className={cn(
              "relative w-full flex-shrink-0",
              cardHeight > 110 ? "h-[70px]" : "h-[42px]",
            )}
            style={{
              backgroundColor: theme.cosmoCardDiscord2.content.backgroundColor,
            }}
          >
            <div className="absolute right-0 top-0 z-[10] -mx-3 h-0.5 w-full bg-gradient-to-r from-transparent to-[#8CD9B6]/[28%]" />
          </div>
        </div>

        {/* Avatar */}
        <div className="z-[5] flex flex-col items-center justify-center">
          <AvatarHighlightWrapper size={50} walletHighlights={[]}>
            <AvatarWithBadgesIgnite
              isCosmo
              withImageHover
              classNameParent="border-1 relative z-[0] flex aspect-square h-[50px] w-[50px] flex-shrink-0 items-center justify-center rounded-full border border-[#DF74FF]/30 bg-border/0 backdrop-blur-lg"
              src={token?.image}
              alt={`${token.name} Image`}
              symbol={token?.symbol}
              leftType={leftBadgeType}
              rightType={rightBadgeType}
              size="lg"
              rightClassName="bottom-[-2px] right-[-1px]"
              leftClassName="bottom-[-2px] left-[-1px]"
              sizeConstant={50}
              handleGoogleLensSearch={handleGoogleLensSearch}
            />
          </AvatarHighlightWrapper>
          <div className={`mt-1 flex items-center justify-center gap-1`}>
            <GradientProgressBar
              bondingCurveProgress={(() => {
                // Convert decimal progress (0-1) to percentage (0-100)
                const progressDecimal = (token?.migration?.progress ??
                  (token as any)?.progress ??
                  0) as number | undefined;
                return Math.round((progressDecimal ?? 0) * 100);
              })()}
              type="linear"
              className="w-[27px]"
            />

            <TimeDifference
              created={token?.created}
              migrated_time={token?.migration?.timestamp || 0}
              dex={token?.dex as DEX}
              className="overflow-visible font-geistRegular text-[8px]"
            />
          </div>
        </div>

        {/* Content */}
        <div className="z-[5] flex w-full flex-col gap-y-4">
          {/* Upper Section */}
          <div className="flex w-full items-center justify-between">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1">
                <Link
                  href={`token/${token.mint}`}
                  onClick={(e) => e.stopPropagation()}
                  className="font-geistSemiBold text-base text-fontColorPrimary"
                >
                  {truncateString(token.name ?? "-", 30)}
                </Link>

                <Link
                  href={`token/${token.mint}`}
                  onClick={(e) => e.stopPropagation()}
                  className="font-geistRegular text-xs text-fontColorSecondary"
                >
                  {token.symbol ?? "-"}
                </Link>

                {/* Eye Icon */}
                <button
                  onClick={handleToggleHidden}
                  title={
                    isTokenHidden(token.mint) ? "Show Token" : "Hide Token"
                  }
                  className="opacity-0 transition-opacity hover:brightness-125 group-hover:opacity-100"
                >
                  <EyeIconSVG />
                </button>

                {/* Copy Icon */}
                <button
                  onClick={handleCopyMint}
                  title="Copy Mint"
                  className="duration-300 hover:brightness-200"
                >
                  <CopyIconSVG />
                </button>

                {/* Search Icon */}
                <Link
                  href={`https://x.com/search?q=${token.mint}`}
                  target="_blank"
                  title="Search Token"
                  className="duration-300 hover:brightness-200"
                  onClick={(e) => e.stopPropagation()}
                >
                  <SearchIconSVG />
                </Link>

                <div onClick={(e) => e.stopPropagation()}>
                  <SocialLinks
                    dex={(token.dex as any) ?? ""}
                    isFirst={false}
                    twitter={token.twitter ?? undefined}
                    telegram={token.telegram ?? undefined}
                    website={token.website ?? undefined}
                    mint={token.mint}
                  />
                </div>
              </div>

              <div className="flex items-center gap-1 text-xs">
                <div className="flex items-center gap-2">
                  <div className="flex h-[16px] items-center gap-0.5 rounded-full bg-[#29292F] px-2 text-[10px] text-fontColorPrimary">
                    {token.bundled ? (
                      // Warning icon for Bundled
                      <WarningIconSVG className="scale-[0.8]" />
                    ) : (
                      // Check mark icon for Not Bundled
                      <CheckmarkIconSVG className="scale-[0.8]" />
                    )}
                    <span className="mb-[-2px] text-[10px] leading-none text-fontColorPrimary">
                      {token.bundled ? (
                        <>
                          Bundled:{" "}
                          <span
                            className={cn(
                              currentPresets.colorSetting === "cupsey"
                                ? Number(token?.bundled_percentage) <= 0.1
                                  ? "text-[#3ed6cc]"
                                  : "text-[#FF4B92]"
                                : Number(token?.bundled_percentage) <= 0.1
                                  ? "text-success"
                                  : "text-destructive",
                            )}
                          >
                            {formatPercentage(
                              Number(token?.bundled_percentage) * 100,
                              6,
                              false,
                            )}
                          </span>
                        </>
                      ) : (
                        <>
                          Not Bundled:{" "}
                          <span
                            className={cn(
                              currentPresets.colorSetting === "cupsey"
                                ? Number(token?.bundled_percentage) <= 0.1
                                  ? "text-[#3ed6cc]"
                                  : "text-[#FF4B92]"
                                : Number(token?.bundled_percentage) <= 0.1
                                  ? "text-success"
                                  : "text-destructive",
                            )}
                          >
                            {formatPercentage(
                              Number(token?.bundled_percentage) * 100,
                              6,
                              false,
                            )}
                          </span>
                        </>
                      )}
                    </span>
                  </div>
                </div>

                {/* Discord Mentions */}
                {discordProfileImages.length > 0 && (
                  <div className="flex h-[16px] items-center gap-2">
                    <div className="flex items-center gap-1 rounded-full bg-[#663CBD] px-2 py-[1px] text-xs text-fontColorPrimary">
                      {discordProfileImages.map((src, idx) => (
                        <Image
                          key={idx}
                          src={src}
                          alt="Discord profile"
                          width={14}
                          height={14}
                          className="size-[14px] rounded-full object-cover"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Group - Only show if there's valid KOLs data */}
                {trackedWalletDisplay && (
                  <div className="flex items-center gap-2 rounded-[40px] border border-[#E077FF] bg-[rgba(223,116,255,0.20)] shadow-[0_-1px_6.8px_0_#A65AE1]">
                    <div className="flex h-[16px] items-center gap-1 rounded-full bg-[#29292F] px-2 text-[10px] text-fontColorPrimary">
                      <PersonGroupIconSVG />

                      <span className="text-xs text-fontColorPrimary">
                        {trackedWalletDisplay}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex min-w-[150px] flex-col items-center justify-center gap-1">
                <div className="flex items-center gap-1">
                  <WebsitegreenIconSVG />
                  <span className="font-geistSemiBold text-xs text-fontColorPrimary">
                    Market Cap
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <span
                    className={cn(
                      "font-geistBold text-sm",
                      marketCapValueColor,
                    )}
                  >
                    {formattedStats.marketCap}
                  </span>

                  <span
                    className={cn(
                      "font-geistSemiBold text-xs",
                      percentageColorClass,
                    )}
                  >
                    {formatPercentage(displayPercent, 5, true, true)}
                  </span>
                </div>
              </div>

              <QuickBuyButton
                module="ignite"
                variant="ignite"
                mintAddress={token.mint}
                className="z-50 opacity-100"
              />
            </div>
          </div>

          {/* Lower Section */}
          <div
            className={cn(
              "flex items-center text-sm",
              // window.innerWidth <= 1280
              //   ? "gap-2"
              //   : window.innerWidth <= 1440 && "gap-2"
              //     ? "gap-2"
              //     : window.innerWidth <= 1600 && "gap-2"
              //       ? "gap-2"
              //       : window.innerWidth < 1920 && "gap-2"
              //         ? "gap-2"
              //         : window.innerWidth >= 1920 && "gap-2"
              //           ? "gap-2"
              //           : window.innerWidth >= 2560 && "gap-2",
              "gap-2",
            )}
          >
            <CustomIgniteStats
              type="data"
              regular_traders={token.regular_traders ?? 0}
              volume_usd={token.volume_usd ?? 0}
              dev_migrated={token.dev_migrated ?? 0}
              sniper_percentage={token.sniper_percentage ?? 0}
              liquidity_usd={token.liquidity_usd ?? 0}
              insider_percentage={token.insider_percentage ?? 0}
              holders={token.holders ?? 0}
              dev_holding_percentage={token.dev_holding_percentage ?? 0}
              bot_total_fees={token.bot_total_fees ?? 0}
            />

            <CustomIgniteStats
              type="security"
              regular_traders={token.regular_traders ?? 0}
              volume_usd={token.volume_usd ?? 0}
              dev_migrated={token.dev_migrated ?? 0}
              sniper_percentage={token.sniper_percentage ?? 0}
              liquidity_usd={token.liquidity_usd ?? 0}
              insider_percentage={token.insider_percentage ?? 0}
              holders={token.holders ?? 0}
              dev_holding_percentage={token.dev_holding_percentage ?? 0}
              bot_total_fees={token.bot_total_fees ?? 0}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default IgniteCard;
