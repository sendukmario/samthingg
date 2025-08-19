import {
  AvatarBorderRadiusSetting,
  AvatarSetting,
  ButtonSetting,
  CosmoCardStyleSetting,
  FontSetting,
  SocialSetting,
} from "@/apis/rest/settings/settings";
import { cn } from "@/libraries/utils";
import { usePopupStore } from "@/stores/use-popup-state.store";
import { BagsRoyalty, CosmoDataMessageType } from "@/types/ws-general";
import Image from "next/image";
import React, { useMemo } from "react";
import { AvatarHighlightWrapper } from "../../AvatarHighlightWrapper";
import AvatarWithBadges, {
  BadgeType,
  getLeftBadgeType,
  getRightBadgeType,
} from "../../AvatarWithBadges";
import { handleGoogleLensSearch } from "@/utils/handleGoogleLensSearch";
import { useTrackedWalletsOfToken } from "@/hooks/use-tracked-wallets-of-token";
import {
  useWalletHighlightStore,
  type WalletWithColor,
} from "@/stores/wallets/use-wallet-highlight-colors.store";
import GradientProgressBar from "../../GradientProgressBar";
import TimeDifference from "../TimeDifference";
import { useHiddenTokensStore } from "@/stores/cosmo/use-hidden-tokens.store";
import toast from "react-hot-toast";
import { hideCosmoToken } from "@/apis/rest/cosmo";
import { CachedImage } from "../../CachedImage";
import { TokenText } from "../partials/TokenText";
import { TokenName } from "../partials/TokenName";
import Copy from "../../Copy";
import Link from "next/link";
import Separator from "../../Separator";
import { useWindowSizeStore } from "@/stores/use-window-size.store";
import StatBadges from "../partials/StatBadges";
import SnipeButton from "../../buttons/SnipeButton";
import CosmoQuickBuyButton, {
  TRANSPARENT_BUTTON_CLASS,
} from "../../buttons/CosmoQuickBuyButton";
import SocialLinks from "../partials/SocialLinks";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import StatTexts from "../partials/StatTexts";
import { presetPriority } from "../../lists/NewlyCreatedList";
import { useCosmoHeight } from "@/utils/getCosmoHeight";
import { useCustomizeTheme } from "@/hooks/use-customize-theme";
import { useCustomCosmoCardView } from "@/stores/setting/use-custom-cosmo-card-view.store";
import CustomCosmoStats from "../partials/CustomCosmoStats";
import { useCustomToast } from "@/hooks/use-custom-toast";
import { MigratingIconSVG, SearchIconSVG } from "../../ScalableVectorGraphics";
import { useCosmoStyle } from "@/stores/cosmo/use-cosmo-style.store";
import { ModuleType } from "@/utils/turnkey/serverAuth";

const CustomToast = React.lazy(() => import("../../toasts/CustomToast"));

interface CosmoCardType3Props {
  amount: number;
  data: CosmoDataMessageType;
  column: 1 | 2 | 3;
  isFirst?: boolean;
  currentAvatarPreset: AvatarSetting;
  currentAvatarBorderRadiusPreset: AvatarBorderRadiusSetting;
  currentFontPreset: FontSetting;
  currentFontSizePreset: FontSetting;
  currentSocialPreset: SocialSetting;
  currentButtonPreset: ButtonSetting;
  currentCardStyle: CosmoCardStyleSetting;
  onClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  isEven: boolean;
  discordDetails: {
    icon: string;
    border: string;
    animation: string;
    count: string;
  };
  module: ModuleType;
}

const imageDecorationSize = {
  normal: 150,
  large: 150,
  extralarge: 175,
  doubleextralarge: 200,
};

const twitterStatusPopoverAlignment = {
  1: "start",
  2: "center",
  3: "end",
};

const progressWidthMap = {
  normal: "!w-[48px]",
  large: "!w-[56px]",
  extralarge: "!w-[64px]",
  doubleextralarge: "!w-[72px]",
};

const progressGap = {
  normal: "!gap-y-2",
  large: "!gap-y-2",
  extralarge: "!gap-y-2",
  doubleextralarge: "!gap-y-2.5",
};

const largePresets = [
  "large",
  "extralarge",
  "doubleextralarge",
  "tripleextralarge",
  "quadripleextralarge",
];

const extraLargePresets = [
  "doubleextralarge",
  "tripleextralarge",
  "quadripleextralarge",
];

const avatarSizeMap = {
  normal: "!size-[48px]",
  large: "!size-[56px]",
  extralarge: "!size-[64px]",
  doubleextralarge: "!size-[72px]",
};

const getAvatarSizeNumber = (preset: keyof typeof avatarSizeMap): number => {
  // Extract number from string like "!size-[48px]"
  const sizeString = avatarSizeMap[preset];
  const match = sizeString.match(/\[(\d+)px\]/);
  return match ? parseInt(match[1], 10) : 48; // Default to 48 if no match
};

const CosmoCardType3: React.FC<CosmoCardType3Props> = ({
  amount,
  data,
  column,
  isFirst,
  currentAvatarPreset,
  currentAvatarBorderRadiusPreset,
  currentFontPreset,
  currentFontSizePreset,
  currentSocialPreset,
  currentButtonPreset,
  currentCardStyle,
  onClick = () => {}, // Default onClick handler
  isEven,
  discordDetails,
  module,
}) => {
  const theme = useCustomizeTheme();
  const cardWidth = useCosmoStyle((state) => state.currentCardWidth);
  const { success } = useCustomToast();

  const cardStyles = useMemo(
    () => ({
      wrapper: cn(
        "block group w-full flex-shrink-0 cursor-pointer overflow-hidden",
      ),
      header: cn(
        "relative flex py-1 w-full items-center justify-between overflow-hidden px-3",
        currentSocialPreset === "extralarge" && "py-1.5",
        currentSocialPreset === "doubleextralarge" && "py-2",
      ),
      headerCss: data?.migration?.migrating
        ? {
            backgroundImage: `linear-gradient(to bottom, ${theme.background2.backgroundColor}, #42254B)`,
          }
        : data?.is_discord_monitored
          ? isEven
            ? theme.cosmoCardDiscord1.header
            : theme.cosmoCardDiscord2.header
          : isEven
            ? theme.cosmoCard1.header
            : theme.cosmoCard2.header,
      content: cn("w-full h-full gap-3 flex px-3 py-2"),
      contentCss: data?.migration?.migrating
        ? {
            backgroundImage: `linear-gradient(to bottom, #26112C 0%, ${
              isEven
                ? theme.cosmoCard1.content.backgroundColor
                : theme.cosmoCard2.content.backgroundColor
            } 70%)`,
          }
        : data?.is_discord_monitored
          ? isEven
            ? theme.cosmoCardDiscord1.content
            : theme.cosmoCardDiscord2.content
          : isEven
            ? theme.cosmoCard1.content
            : theme.cosmoCard2.content,
    }),
    [
      theme,
      isEven,
      data?.migration?.migrating,
      data.is_discord_monitored,
      currentSocialPreset,
    ],
  );

  const cardHeight = useCosmoHeight("type3");

  const remainingScreenWidth = usePopupStore(
    (state) => state.remainingScreenWidth,
  );
  const { width } = useWindowSizeStore();
  const isSmallScreen =
    largePresets.includes(currentAvatarPreset) ||
    largePresets.includes(currentFontPreset)
      ? extraLargePresets.includes(currentButtonPreset)
        ? remainingScreenWidth < 1800
        : remainingScreenWidth < 1400
      : extraLargePresets.includes(currentButtonPreset)
        ? remainingScreenWidth < 1700
        : remainingScreenWidth < 1000;

  const isMediumScreen =
    remainingScreenWidth > 810 && remainingScreenWidth < 1200;

  const isBigMobileRemaining =
    remainingScreenWidth < 810 && remainingScreenWidth >= 550;
  const isSmallMobileRemaining = remainingScreenWidth < 550;

  const isSnapOpen = usePopupStore((state) =>
    state.popups.some((p) => p.isOpen && p.snappedSide !== "none"),
  );

  const isXlDown = useWindowSizeStore((state) => state.width! < 1280 || false);

  const trackedWalletsOfToken = useTrackedWalletsOfToken().walletsOfToken;
  const walletColors = useWalletHighlightStore((state) => state.wallets);

  const walletHighlights = useMemo(() => {
    const trackedWallets = trackedWalletsOfToken?.[data?.mint];
    if (!trackedWallets?.length) return [];

    const highlights: WalletWithColor[] = [];
    const seenAddresses = new Set<string>();

    // Direct loop is more efficient than reduce for this case
    for (const address of trackedWallets) {
      const wallet = walletColors?.[address];
      if (wallet && !seenAddresses?.has(wallet?.address)) {
        seenAddresses?.add(wallet?.address);
        highlights?.push(wallet);
      }
    }

    return highlights;
  }, [data?.mint, trackedWalletsOfToken, walletColors]);

  const hideToken = useHiddenTokensStore((state) => state.hideToken);
  const unhideToken = useHiddenTokensStore((state) => state.unhideToken);
  const isTokenHidden = useHiddenTokensStore((state) =>
    state.isTokenHidden(data.mint),
  );
  const hiddenTokens = useHiddenTokensStore((state) => state.hiddenTokens);

  const getActiveStats = useCustomCosmoCardView((s) => s.getActiveItemsByType);
  const statBadgesWidth =
    getActiveStats("stat-badge").length *
    (currentFontPreset === "normal"
      ? 30
      : currentFontPreset === "large"
        ? 35
        : currentFontPreset === "extralarge"
          ? 40
          : 45);

  return (
    <>
      {/* Header Migrating */}
      {/* {data?.migration?.migrating && (
        <div className={cn(cardStyles.header)}>
          <div className="absolute bottom-0 left-0 top-0 w-full bg-background">
            <div className="h-full w-full bg-gradient-to-b from-[#150619] to-[#42254B]"></div>
          </div>

          <Image
            src="/images/decorations/card-decoration.svg"
            alt="Card Decoration"
            height={130}
            width={imageDecorationSize[currentSocialPreset]}
            className="absolute right-0 top-0 mix-blend-overlay"
            style={{ isolation: "isolate" }}
          />

          <div className="relative flex w-[75%] items-center gap-x-1.5">
            <div className="flex w-fit items-center justify-center gap-x-1 font-geistSemiBold text-sm text-primary">
              <Image
                src="/icons/migrating-loading.svg"
                alt="Migrating Loading Icon"
                height={16}
                width={16}
                quality={80}
                className={cn(
                  "relative aspect-square size-[16px] flex-shrink-0 animate-spin",
                )}
              />
              Migrating...
            </div>
          </div>
        </div>
      )} */}

      {/* Content */}
      <div className={cn(cardStyles.content)} style={cardStyles.contentCss}>
        {data?.migration?.migrating && (
          <div className="absolute left-0 top-0 flex w-fit items-center gap-x-1.5 p-1">
            <div className="flex w-fit items-center justify-center gap-x-1 font-geistSemiBold text-sm text-primary">
              <MigratingIconSVG
                className={cn(
                  "relative aspect-square size-[16px] flex-shrink-0 animate-spin",
                )}
              />
              Migrating...
            </div>
          </div>
        )}
        {process.env.NODE_ENV === "development" && (
          <div className="absolute right-0 top-0 z-[100] bg-white/10 text-xs text-primary">
            {cardWidth}
          </div>
        )}
        <div className="z-[5] flex items-center justify-center">
          <div
            className={cn(
              "relative flex w-full items-center",
              isSnapOpen &&
                (["extralarge", "doubleextralarge"].includes(
                  currentAvatarPreset,
                ) ||
                  ["extralarge", "doubleextralarge"].includes(
                    currentFontPreset,
                  ))
                ? "items-start gap-x-1 lg:gap-x-3"
                : "gap-x-4",
            )}
          >
            <div
              className={cn(
                `${progressGap[currentAvatarPreset]} relative flex flex-col items-center`,
                data?.migration?.migrating && "mt-3",
              )}
            >
              <AvatarHighlightWrapper
                size={(() => {
                  const sizes = {
                    normal: { squared: 54, rounded: 56 },
                    large: { squared: 64, rounded: 66 },
                    extralarge: { squared: 72, rounded: 74 },
                    doubleextralarge: { squared: 76, rounded: 82 },
                  };

                  if (!walletHighlights?.length) {
                    return getAvatarSizeNumber(
                      currentAvatarPreset as keyof typeof avatarSizeMap,
                    );
                  }

                  const borderRadius =
                    currentAvatarBorderRadiusPreset === "squared"
                      ? "squared"
                      : "rounded";
                  return (
                    sizes[currentAvatarPreset]?.[borderRadius] ??
                    sizes.normal[borderRadius]
                  );
                })()}
                walletHighlights={walletHighlights}
                avatarBorderRadius={currentAvatarBorderRadiusPreset}
              >
                <div className="relative">
                  <button
                    title="Hide Token"
                    className="absolute -top-1 left-0 z-[50] hidden aspect-square size-4 flex-shrink-0 rounded-[2px] bg-black p-0.5 group-hover:visible group-hover:block group-hover:opacity-100"
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        if (isTokenHidden) {
                          unhideToken(data.mint); // Store update
                          // toast.custom((t: any) => (
                          //   <CustomToast
                          //     tVisibleState={t.visible}
                          //     message="Successfully unhidden token"
                          //     state="SUCCESS"
                          //   />
                          // ));
                          success("Successfully unhidden token");
                          await hideCosmoToken(
                            (hiddenTokens || [])?.filter(
                              (hiddenToken) => hiddenToken !== data.mint,
                            ),
                          ).then(() => {}); // API call (should be updated to unhide)
                        } else {
                          hideToken(data.mint); // Store update
                          // toast.custom((t: any) => (
                          //   <CustomToast
                          //     tVisibleState={t.visible}
                          //     message="Successfully hidden token"
                          //     state="SUCCESS"
                          //   />
                          // ));
                          success("Successfully hidden token");
                          await hideCosmoToken([
                            ...hiddenTokens,
                            data.mint,
                          ]).then(() => {}); // API call
                        }
                      } catch (error) {
                        console.warn("Error toggling token visibility:", error);
                      }
                    }}
                  >
                    <CachedImage
                      src={
                        isTokenHidden
                          ? "/icons/eye-show-gray.svg"
                          : "/icons/eye-hide-gray.svg"
                      }
                      alt={
                        isTokenHidden ? "Show Token Icon" : "Hide Token Icon"
                      }
                      height={14}
                      width={14}
                      quality={100}
                      className="object-contain"
                    />
                  </button>
                  <AvatarWithBadges
                    withImageHover
                    classNameParent={`border-1 relative z-[0] flex aspect-square h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border border-[#DF74FF]/30 bg-border/0 lg:size-[48px] ${avatarSizeMap[currentAvatarPreset]}`}
                    symbol={data?.symbol}
                    src={data?.image}
                    alt="Token Image"
                    leftType={getLeftBadgeType(
                      data?.dex,
                      data?.origin_dex,
                      data?.launchpad,
                    )}
                    rightType={getRightBadgeType(data?.dex, data?.launchpad)}
                    handleGoogleLensSearch={
                      data?.image
                        ? (e) => handleGoogleLensSearch(e, data.image!)
                        : undefined
                    }
                    badgeSizeConstant={16}
                    sizeConstant={getAvatarSizeNumber(
                      (currentAvatarPreset ||
                        "normal") as keyof typeof avatarSizeMap,
                    )}
                    rightClassName={`size-[16px] ${currentAvatarPreset === "normal" && currentAvatarBorderRadiusPreset === "rounded" && "-right-[3px] -bottom-[3px]"} ${currentAvatarBorderRadiusPreset === "squared" && "-right-[4.5px] -bottom-[4.5px]"}`}
                    leftClassName={`size-[16px] ${currentAvatarPreset === "normal" && currentAvatarBorderRadiusPreset === "rounded" && "-left-[3px] -bottom-[3px]"} ${currentAvatarBorderRadiusPreset === "squared" && "-left-[4.5px] -bottom-[4.5px]"}`}
                    size={
                      ["normal", "large"].includes(currentAvatarPreset)
                        ? "sm"
                        : "lg"
                    }
                    isCosmo
                    isSquared={currentAvatarBorderRadiusPreset === "squared"}
                  />
                </div>
              </AvatarHighlightWrapper>
            </div>
          </div>
        </div>
        <div
          className={cn(
            "flex h-full w-full flex-col items-center justify-center gap-y-3",
            ["tripleextralarge", "quadripleextralarge"].includes(
              currentButtonPreset,
            ) && "gap-y-2",
            cardWidth < 300 && "gap-y-2",
          )}
        >
          <div
            className={cn(
              "grid w-full grid-cols-1 items-start justify-between lg:grid-cols-2",
              currentFontPreset.includes("extra") && "items-center",
              isSnapOpen && cardHeight >= 300 && "justify-start gap-y-4",
              ["tripleextralarge", "quadripleextralarge"].includes(
                currentButtonPreset,
              ) &&
                ["extralarge", "doubleextralarge"].includes(
                  currentFontPreset,
                ) &&
                !(cardWidth <= 450 || statBadgesWidth >= cardWidth / 3) &&
                "mb-5",
            )}
          >
            <div
              className={cn(
                "flex flex-col gap-y-1",
                cardWidth < 300 && "w-fit",
              )}
            >
              <div
                className={cn(
                  "flex flex-row items-center gap-x-1",
                  cardWidth >= 300 &&
                    cardWidth < 380 &&
                    "flex-col items-start justify-start pt-1",

                  // (isBigMobileRemaining &&
                  //   remainingScreenWidth < 1080 &&
                  //   (currentFontPreset + currentFontSizePreset).includes(
                  //     "extra",
                  //   )) ||
                  //   (!(remainingScreenWidth < 550) &&
                  //     "flex-col items-start justify-start"),
                )}
              >
                {data?.is_discord_monitored && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="relative h-5 w-5 flex-shrink-0 overflow-hidden rounded-full">
                          <Image
                            unoptimized={false}
                            src={discordDetails.icon}
                            alt="Token Medal"
                            fill
                            className="object-contain"
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        Token mentioned {discordDetails.count}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                <TokenText
                  text={data?.symbol}
                  shouldTruncate={remainingScreenWidth < 1200}
                  className="text-nowrap font-geistSemiBold text-fontColorPrimary"
                  isSymbol
                  cardWidth={cardWidth}
                />

                <div className="mt-[-3px] flex items-center gap-x-1">
                  <div className="min-w-0 flex-shrink overflow-hidden">
                    <TokenName
                      // isSnapOpen={isSnapOpen}
                      migrating={data?.migration?.migrating}
                      name={data.name}
                      mint={data.mint}
                      cardWidth={
                        cardWidth < 300
                          ? cardWidth * 30 - data?.symbol?.length * 100
                          : cardWidth *
                              (cardWidth < 230
                                ? 5.5
                                : cardWidth < 315
                                  ? 5.8
                                  : cardWidth < 200
                                    ? 6.5
                                    : 7.5) -
                              (!["normal", "large"].includes(
                                currentFontSizePreset,
                              ) && cardWidth < 520
                                ? cardWidth * 1.4
                                : 0) || cardWidth
                      }
                    />
                  </div>
                  {(isSmallMobileRemaining ||
                    (currentFontPreset + currentFontSizePreset).includes(
                      "extra",
                    )) && (
                    <div className="z-[20] flex items-center gap-x-1">
                      <Copy
                        value={data?.mint}
                        dataDetail={data}
                        sizeConstant={16}
                        withAnimation={false}
                        isSVG
                      />
                    </div>
                  )}
                </div>
                {!(
                  isSmallMobileRemaining ||
                  (currentFontPreset + currentFontSizePreset).includes("extra")
                ) && (
                  <div className="z-[20] flex items-center gap-x-1">
                    <Copy
                      value={data?.mint}
                      dataDetail={data}
                      sizeConstant={16}
                      withAnimation={false}
                      isSVG
                    />
                    <Separator
                      color="#202037"
                      orientation="vertical"
                      unit="fixed"
                      fixedHeight={14}
                      className="block flex-shrink-0 lg:hidden"
                    />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-x-0.5">
                <TimeDifference
                  created={data?.created}
                  migrated_time={data?.migration?.timestamp}
                  dex={data?.dex}
                  className="leading-0 flex h-[16px] items-center font-geistRegular text-[10px] text-destructive"
                />
                <Link
                  href={`https://x.com/search?q=${data?.mint}`}
                  target="_blank"
                  title="Search Token"
                  className="relative ml-1 aspect-square h-4 w-4 flex-shrink-0 duration-300 hover:brightness-200"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  {/* <CachedImage
                    src="/icons/search.svg"
                    alt="Search Icon"
                    height={16}
                    width={16}
                    quality={80}
                    className="object-contain"
                  /> */}
                  <SearchIconSVG />
                </Link>
                <div
                  onClick={(e) => e.stopPropagation()}
                  className={cn(
                    currentSocialPreset === "doubleextralarge" &&
                      isSnapOpen &&
                      "flex flex-wrap",
                  )}
                >
                  <SocialLinks
                    dex={data?.dex}
                    twitterStatusPopoverAlignment={
                      twitterStatusPopoverAlignment[column] as
                        | "start"
                        | "center"
                        | "end"
                    }
                    isFirst={isFirst!}
                    twitter={data?.twitter}
                    mint={data?.mint}
                    telegram={data?.telegram}
                    website={data?.website}
                    instagram={data?.instagram}
                    tiktok={data?.tiktok}
                    youtube={data?.youtube}
                    isCosmoCard
                  />
                </div>
              </div>
            </div>
            {cardWidth >= 300 && (
              <div
                className={cn(
                  "flex h-full w-[100%] flex-wrap items-start justify-end",
                )}
              >
                {/* <StatTexts
                  col={1}
                  isSnapOpen={isSnapOpen}
                  mint={data?.mint}
                  bundled={data?.bundled}
                  bundled_percentage={data?.bundled_percentage}
                  marketCapUSD={data?.market_cap_usd}
                  volumeUSD={data?.volume_usd}
                  holders={data?.holders}
                  data={{
                    discord_details: data?.discord_details,
                    is_discord_monitored: data?.is_discord_monitored,
                  }}
                  justify="end"
                  className="mb-auto w-[120%]"
                  cardType="type2"
                /> */}
                <CustomCosmoStats
                  isFirst={isFirst && column === 1}
                  regular_users={data?.bot_holders}
                  bot_total_fees={data?.bot_total_fees}
                  devHoldingPercentage={data?.dev_holding_percentage}
                  discord={{
                    discord_details: data?.discord_details,
                    is_discord_monitored: data?.is_discord_monitored,
                  }}
                  holders={data?.holders}
                  insiderPercentage={data?.insider_percentage}
                  isMigrating={data?.migration?.migrating}
                  isDevSold={data?.dev_sold}
                  marketCapUSD={data?.market_cap_usd}
                  mint={data?.mint}
                  snipers={data?.snipers}
                  stars={data?.stars}
                  top10Percentage={data?.top10_percentage}
                  type="stat-text"
                  volumeUSD={data?.volume_usd}
                  bundled_percentage={data?.bundled_percentage}
                  cardType="type2"
                  className="justify-end"
                  dev_wallet_details={data?.dev_wallet_details}
                  bags_royalties={data?.bags_royalties}
                />
              </div>
            )}
          </div>
          {cardWidth < 300 && (
            <div
              className={cn(
                "flex w-[100%] flex-wrap items-start justify-start",
              )}
            >
              {/* <StatTexts
                col={1}
                isSnapOpen={isSnapOpen}
                mint={data?.mint}
                bundled={data?.bundled}
                bundled_percentage={data?.bundled_percentage}
                marketCapUSD={data?.market_cap_usd}
                volumeUSD={data?.volume_usd}
                holders={data?.holders}
                data={{
                  discord_details: data?.discord_details,
                  is_discord_monitored: data?.is_discord_monitored,
                }}
                justify="start"
                className={cn("mb-auto", cardWidth < 255 && "mr-auto w-[80%]")}
                cardType="type2"
              /> */}
              <CustomCosmoStats
                isFirst={isFirst && column === 1}
                regular_users={data?.bot_holders}
                bot_total_fees={data?.bot_total_fees}
                devHoldingPercentage={data?.dev_holding_percentage}
                discord={{
                  discord_details: data?.discord_details,
                  is_discord_monitored: data?.is_discord_monitored,
                }}
                holders={data?.holders}
                insiderPercentage={data?.insider_percentage}
                isMigrating={data?.migration?.migrating}
                isDevSold={data?.dev_sold}
                marketCapUSD={data?.market_cap_usd}
                mint={data?.mint}
                snipers={data?.snipers}
                stars={data?.stars}
                top10Percentage={data?.top10_percentage}
                type="stat-text"
                volumeUSD={data?.volume_usd}
                bundled_percentage={data?.bundled_percentage}
                cardType="type2"
                className="justify-start"
                dev_wallet_details={data?.dev_wallet_details}
                bags_royalties={data?.bags_royalties}
              />
            </div>
          )}
          <div
            className={cn(
              "mr-auto flex w-[90%] items-center justify-between",
              cardWidth < 400 && "w-[100%]",
            )}
          >
            <div>
              {/* <StatBadges
                bundled={data?.bundled}
                isMigrating={data?.migration?.migrating}
                stars={data?.stars}
                snipers={data?.snipers}
                insiderPercentage={data?.insider_percentage}
                top10Percentage={data?.top10_percentage}
                devHoldingPercentage={data?.dev_holding_percentage}
                isSnapOpen={isSnapOpen}
                isLargePreset={["large"].includes(currentAvatarPreset)}
                isXLPreset={["extralarge", "doubleextralarge"].includes(
                  currentAvatarPreset,
                )}
                cardType={currentCardStyle}
                isWrap={
                  (cardWidth < 430 &&
                    ["normal", "large"].includes(currentButtonPreset)) ||
                  (cardWidth < 710 &&
                    !["normal", "large"].includes(currentButtonPreset)) ||
                  cardWidth < 300
                }
                className={cn(
                  "flex flex-row flex-nowrap !gap-0",
                  ((cardWidth < 430 &&
                    ["normal", "large"].includes(currentButtonPreset)) ||
                    (cardWidth < 710 &&
                      !["normal", "large"].includes(currentButtonPreset))) &&
                    "flex-wrap",
                  cardWidth < 710 &&
                    !["normal", "large"].includes(currentButtonPreset) &&
                    "w-[100%]",
                  cardWidth < 300 && "w-[100%] !flex-wrap",
                )}
              /> */}
              <CustomCosmoStats
                isFirst={isFirst && column === 1}
                regular_users={data?.bot_holders}
                bot_total_fees={data?.bot_total_fees}
                devHoldingPercentage={data?.dev_holding_percentage}
                discord={{
                  discord_details: data?.discord_details,
                  is_discord_monitored: data?.is_discord_monitored,
                }}
                holders={data?.holders}
                insiderPercentage={data?.insider_percentage}
                isMigrating={data?.migration?.migrating}
                isDevSold={data?.dev_sold}
                marketCapUSD={data?.market_cap_usd}
                mint={data?.mint}
                snipers={data?.snipers}
                stars={data?.stars}
                top10Percentage={data?.top10_percentage}
                type="stat-badge"
                volumeUSD={data?.volume_usd}
                bundled_percentage={data?.bundled_percentage}
                cardType="type2"
                dev_wallet_details={data?.dev_wallet_details}
                bags_royalties={data?.bags_royalties}
              />
            </div>

            {((["normal", "large"].includes(currentButtonPreset) &&
              (cardWidth < 440 || statBadgesWidth >= cardWidth * 0.47)) ||
              (["extralarge", "doubleextralarge"].includes(
                currentButtonPreset,
              ) &&
                (cardWidth <= 450 || statBadgesWidth >= cardWidth * 0.45)) ||
              (["tripleextralarge", "quadripleextralarge"].includes(
                currentButtonPreset,
              ) &&
                (cardWidth <= 450 || statBadgesWidth >= cardWidth * 0.3))) && (
              <div
                onClick={onClick}
                className="pointer-events-none invisible absolute right-0 top-0 z-[8] h-full w-[75%] bg-gradient-to-r from-[#1A1A2300] to-background/[85%] to-[90%] opacity-0 transition-all duration-200 ease-in-out group-hover:visible group-hover:opacity-100"
              />
            )}

            {data?.migration?.migrating ? (
              <SnipeButton
                data={data}
                className={cn(
                  "absolute right-0 z-[10] flex w-auto flex-shrink-0 -translate-y-1/2 scale-[0.9] items-center justify-center",
                  // TOP POSITION
                  [
                    "normal",
                    "large",
                    "extralarge",
                    "doubleextralarge",
                  ].includes(currentButtonPreset)
                    ? "top-[50%]"
                    : "top-[45%]",
                  // NORMAL & LARGE BUTTON PRESETS
                  ["normal", "large"].includes(currentButtonPreset) &&
                    cn(
                      currentButtonPreset === "normal" && "translate-y-[45%]",
                      currentButtonPreset === "large" && "translate-y-[20%]",
                      !["normal", "large"].includes(currentFontPreset) &&
                        "translate-y-[55%]",

                      (cardWidth < 440 ||
                        statBadgesWidth >= cardWidth * 0.47) &&
                        TRANSPARENT_BUTTON_CLASS,
                    ),

                  // ########################################
                  // EXTRALARGE & DOUBLEEXTRALARGE BUTTON PRESETS
                  // ########################################
                  ["extralarge", "doubleextralarge"].includes(
                    currentButtonPreset,
                  ) &&
                    cn(
                      "translate-y-[5%]",
                      currentButtonPreset === "doubleextralarge" &&
                        "translate-y-[-10%]",
                      (cardWidth < 470 || statBadgesWidth > cardWidth * 0.45) &&
                        TRANSPARENT_BUTTON_CLASS,
                    ),

                  // EXTRALARGE, DOUBLEEXTRALARGE, TRIPLEEXTRALARGE, AND QUADRIPLEEXTRALARGE BUTTON PRESETS
                  [
                    // "extralarge",
                    // "doubleextralarge",
                    "tripleextralarge",
                    "quadripleextralarge",
                  ].includes(currentButtonPreset) &&
                    cn(
                      // currentButtonPreset === "extralarge" &&
                      //   "translate-y-[5%]",
                      // currentButtonPreset === "doubleextralarge" &&
                      //   "translate-y-[-10%]",
                      currentButtonPreset === "tripleextralarge" &&
                        "translate-y-[-10%]",
                      currentButtonPreset === "quadripleextralarge" &&
                        "translate-y-[-10%]",
                      !["normal", "large"].includes(currentFontPreset) &&
                        "translate-y-[10%]",
                      cardWidth < 530 &&
                        !["normal", "large"].includes(currentFontPreset) &&
                        "-translate-x-8",
                      cardWidth < 490 &&
                        !["normal", "large"].includes(currentFontPreset) &&
                        "translate-y-[10%]",

                      (cardWidth <= 450 ||
                        statBadgesWidth >= cardWidth * 0.3) &&
                        TRANSPARENT_BUTTON_CLASS,
                    ),
                )}
              />
            ) : (
              <CosmoQuickBuyButton
                module={module}
                mintAddress={data?.mint}
                amount={amount}
                className={cn(
                  "absolute right-0 z-[10] flex w-auto flex-shrink-0 -translate-y-1/2 scale-[0.9] items-center justify-center",
                  // TOP POSITION
                  [
                    "normal",
                    "large",
                    "extralarge",
                    "doubleextralarge",
                  ].includes(currentButtonPreset)
                    ? "top-[50%]"
                    : "top-[45%]",
                  // NORMAL & LARGE BUTTON PRESETS
                  ["normal", "large"].includes(currentButtonPreset) &&
                    cn(
                      currentButtonPreset === "normal" && "translate-y-[45%]",
                      currentButtonPreset === "large" && "translate-y-[20%]",
                      !["normal", "large"].includes(currentFontPreset) &&
                        "translate-y-[55%]",

                      (cardWidth < 440 ||
                        statBadgesWidth >= cardWidth * 0.47) &&
                        TRANSPARENT_BUTTON_CLASS,
                    ),

                  // ########################################
                  // EXTRALARGE & DOUBLEEXTRALARGE BUTTON PRESETS
                  // ########################################
                  ["extralarge", "doubleextralarge"].includes(
                    currentButtonPreset,
                  ) &&
                    cn(
                      "translate-y-[5%]",
                      currentButtonPreset === "doubleextralarge" &&
                        "translate-y-[-8%]",
                      (cardWidth < 470 || statBadgesWidth > cardWidth * 0.45) &&
                        TRANSPARENT_BUTTON_CLASS,
                    ),

                  // EXTRALARGE, DOUBLEEXTRALARGE, TRIPLEEXTRALARGE, AND QUADRIPLEEXTRALARGE BUTTON PRESETS
                  [
                    // "extralarge",
                    // "doubleextralarge",
                    "tripleextralarge",
                    "quadripleextralarge",
                  ].includes(currentButtonPreset) &&
                    cn(
                      // currentButtonPreset === "extralarge" &&
                      //   "translate-y-[5%]",
                      // currentButtonPreset === "doubleextralarge" &&
                      //   "translate-y-[-10%]",
                      currentButtonPreset === "tripleextralarge" &&
                        "translate-y-[-10%]",
                      currentButtonPreset === "quadripleextralarge" &&
                        "translate-y-[-10%]",
                      !["normal", "large"].includes(currentFontPreset) &&
                        "translate-y-[10%]",
                      cardWidth < 530 &&
                        !["normal", "large"].includes(currentFontPreset) &&
                        "-translate-x-8",
                      cardWidth < 490 &&
                        !["normal", "large"].includes(currentFontPreset) &&
                        "translate-y-[10%]",

                      (cardWidth <= 450 ||
                        statBadgesWidth >= cardWidth * 0.3) &&
                        TRANSPARENT_BUTTON_CLASS,
                    ),
                )}
                txsKeys={{
                  base_mint: data?.swap_keys?.base_mint,
                  decimals: data?.swap_keys?.decimals,
                  mint: data?.swap_keys?.mint,
                  dex: data?.swap_keys?.dex,
                  is_2022: data?.swap_keys?.is_2022,
                  is_usdc: data?.swap_keys?.is_usdc,
                  is_wrapped_sol: data?.swap_keys?.is_wrapped_sol,
                  swap_keys: data?.swap_keys?.swap_keys as any,
                  remaining_accounts: data?.swap_keys?.remaining_accounts,
                }}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default CosmoCardType3;
