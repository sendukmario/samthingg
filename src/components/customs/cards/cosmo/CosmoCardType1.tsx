"use client";

import { cn } from "@/libraries/utils";
import React, { useMemo } from "react";
import { AvatarHighlightWrapper } from "../../AvatarHighlightWrapper";
import AvatarWithBadges, {
  BadgeType,
  getLeftBadgeType,
  getRightBadgeType,
} from "../../AvatarWithBadges";
import { handleGoogleLensSearch } from "@/utils/handleGoogleLensSearch";
import GradientProgressBar from "../../GradientProgressBar";
import TimeDifference from "../TimeDifference";
import StatBadges from "../partials/StatBadges";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Image from "next/image";
import StatTexts from "../partials/StatTexts";
import SnipeButton from "../../buttons/SnipeButton";
import CosmoQuickBuyButton, {
  TRANSPARENT_BUTTON_CLASS,
} from "../../buttons/CosmoQuickBuyButton";
import { CosmoDataMessageType, BagsRoyalty } from "@/types/ws-general";
import {
  AvatarBorderRadiusSetting,
  AvatarSetting,
  ButtonSetting,
  CosmoCardStyleSetting,
  FontSetting,
  SocialSetting,
  ThemeSetting,
} from "@/apis/rest/settings/settings";
import { hideCosmoToken } from "@/apis/rest/cosmo";
import { useHiddenTokensStore } from "@/stores/cosmo/use-hidden-tokens.store";
import toast from "react-hot-toast";
import { CachedImage } from "../../CachedImage";
import { TokenText } from "../partials/TokenText";
import { TokenName } from "../partials/TokenName";
import Copy from "../../Copy";
import Link from "next/link";
import Separator from "../../Separator";
import SocialLinks from "../partials/SocialLinks";
import { usePopupStore } from "@/stores/use-popup-state.store";
import { useWindowSizeStore } from "@/stores/use-window-size.store";
import { useTrackedWalletsOfToken } from "@/hooks/use-tracked-wallets-of-token";
import {
  useWalletHighlightStore,
  type WalletWithColor,
} from "@/stores/wallets/use-wallet-highlight-colors.store";
import { useCustomCosmoCardView } from "@/stores/setting/use-custom-cosmo-card-view.store";
import { useCustomizeTheme } from "@/hooks/use-customize-theme";
import CustomCosmoStats from "../partials/CustomCosmoStats";
import { useCustomToast } from "@/hooks/use-custom-toast";
import {
  CardDecorationSVG,
  MigratingIconSVG,
  SearchIconSVG,
} from "../../ScalableVectorGraphics";
import { useCosmoStyle } from "@/stores/cosmo/use-cosmo-style.store";
import { formatPercentage } from "@/utils/formatPercentage";
import { useCustomizeSettingsStore } from "@/stores/setting/use-customize-settings.store";
import { ModuleType } from "@/utils/turnkey/serverAuth";

const CustomToast = React.lazy(() => import("../../toasts/CustomToast"));

interface CosmoCardType1Props {
  amount: number;
  data: CosmoDataMessageType;
  column: 1 | 2 | 3;
  isFirst?: boolean;
  currentTheme: ThemeSetting;
  currentAvatarPreset: AvatarSetting;
  currentAvatarBorderRadiusPreset: AvatarBorderRadiusSetting;
  currentFontPreset: FontSetting;
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
  module: ModuleType
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
const CosmoCardType1: React.FC<CosmoCardType1Props> = ({
  amount,
  data,
  column,
  isFirst,
  currentTheme,
  currentAvatarPreset,
  currentAvatarBorderRadiusPreset,
  currentFontPreset,
  currentSocialPreset,
  currentButtonPreset,
  currentCardStyle,
  onClick = () => { }, // Default onClick handler
  isEven,
  discordDetails,
  module,
}) => {
  const theme = useCustomizeTheme();
  const cardWidth = useCosmoStyle((state) => state.currentCardWidth);
  const { success } = useCustomToast();

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

  const isCreator = useMemo(() => {
    return data?.bags_royalties?.some(royalty => royalty.is_creator) || false;
  }, [data?.bags_royalties]);

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
          backgroundImage: `linear-gradient(to bottom, ${theme.background.backgroundColor}, #42254B)`,
        }
        : data?.is_discord_monitored
          ? isEven
            ? theme.cosmoCardDiscord1.header
            : theme.cosmoCardDiscord2.header
          : isEven
            ? theme.cosmoCard1.header
            : theme.cosmoCard2.header,
      content: cn("w-full h-full gap-y-3 grid px-3", cardWidth < 485 && "pt-2"),
      contentCss: data?.migration?.migrating
        ? {
          backgroundImage: `linear-gradient(to bottom, #26112C 0%, ${isEven
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
      cardWidth,
    ],
  );

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

  const isSnapOpen = usePopupStore((state) =>
    state.popups.some((p) => p.isOpen && p.snappedSide !== "none"),
  );

  const isXlDown = useWindowSizeStore((state) => state.width! < 1280 || false);

  const hideToken = useHiddenTokensStore((state) => state.hideToken);
  const unhideToken = useHiddenTokensStore((state) => state.unhideToken);
  const isTokenHidden = useHiddenTokensStore((state) =>
    state.isTokenHidden(data.mint),
  );
  const hiddenTokens = useHiddenTokensStore((state) => state.hiddenTokens);

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

  const cardViewConfig = useCustomCosmoCardView(
    (state) => state.cardViewConfig,
  );
  const isCardViewActive = (key: string): boolean => {
    const configItem = cardViewConfig.find((item) => item.key === key);
    return configItem?.status === "active";
  };

  const getActiveStats = useCustomCosmoCardView((s) => s.getActiveItemsByType);
  const statBadgesWidth = getActiveStats("stat-badge").length * 30;

  return (
    <>
      {/* Header */}
      <div className={cn(cardStyles.header, "flex-shrink-0")}>
        <div className="absolute left-0 top-0 h-full w-full">
          <div className="h-full w-full" style={cardStyles.headerCss}></div>
        </div>

        {/* <Image
          src="/images/decorations/card-decoration.svg"
          alt="Card Decoration"
          height={152}
          width={240}
          className={cn(
            "absolute top-0 mix-blend-overlay",
            currentSocialPreset === "normal" && "-right-16",
            currentSocialPreset === "large" && "-right-12",
            currentSocialPreset === "extralarge" && "-right-10",
            currentSocialPreset === "doubleextralarge" && "-right-6",
          )}
          style={{ isolation: "isolate" }}
        /> */}
        <CardDecorationSVG
          className={cn(
            "absolute top-0 opacity-15",
            currentTheme === "cupsey" && "opacity-10",
            currentSocialPreset === "normal" && "-right-16",
            currentSocialPreset === "large" && "-right-12",
            currentSocialPreset === "extralarge" && "-right-10",
            currentSocialPreset === "doubleextralarge" && "-right-6",
          )}
        />

        <div
          className={cn(
            "relative items-center gap-x-1.5",
            currentSocialPreset !== "normal" && cardWidth < 440
              ? "flex w-[60%]"
              : "flex w-[75%]",
          )}
        >
          {data?.migration?.migrating && (
            <div className="flex w-fit items-center justify-center gap-x-1 font-geistSemiBold text-sm text-primary">
              <MigratingIconSVG
                className={cn(
                  "relative aspect-square size-[16px] flex-shrink-0 animate-spin",
                )}
              />
              Migrating...
            </div>
          )}
          <div className="flex w-full min-w-0 items-center gap-x-1.5">
            <button
              title="Hide Token"
              className="relative z-[50] hidden aspect-square size-4 flex-shrink-0 group-hover:visible group-hover:block group-hover:opacity-100"
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
                    ).then(() => { }); // API call (should be updated to unhide)
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
                    await hideCosmoToken([...hiddenTokens, data.mint]).then(
                      () => { },
                    ); // API call
                  }
                } catch (error) {
                  console.warn("Error toggling token visibility:", error);
                }
              }}
            >
              <CachedImage
                src={
                  isTokenHidden ? "/icons/eye-show.svg" : "/icons/eye-hide.svg"
                }
                alt={isTokenHidden ? "Show Token Icon" : "Hide Token Icon"}
                height={16}
                width={16}
                quality={100}
                className="object-contain"
              />
            </button>
            {data?.is_discord_monitored && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="relative h-5 w-5 flex-shrink-0 overflow-hidden rounded-full">
                      <Image
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
            {/* <h4 className="text-nowrap font-geistSemiBold text-sm leading-none text-fontColorPrimary">
                {isSnapOpen
                  ? isXlDown
                    ? truncateCA(data?.symbol || "", 5)
                    : data?.symbol || ""
                  : data?.symbol || ""}
              </h4> */}
            <TokenText
              text={data?.symbol}
              shouldTruncate={isSnapOpen && isXlDown}
              className="text-nowrap font-geistSemiBold text-fontColorPrimary"
              isSymbol
              cardWidth={cardWidth}
            />

            <div className="min-w-0 flex-shrink overflow-hidden">
              <TokenName
                // isSnapOpen={isSnapOpen}
                migrating={data?.migration?.migrating}
                name={data.name}
                mint={data.mint}
                cardWidth={cardWidth}
              />
            </div>
            <div className="z-[10] flex items-center gap-x-1">
              <Copy
                value={data?.mint}
                dataDetail={data}
                sizeConstant={16}
                withAnimation={false}
                isSVG
              />
              <Link
                href={`https://x.com/search?q=${data?.mint}`}
                target="_blank"
                title="Search Token"
                className="relative aspect-square h-4 w-4 flex-shrink-0 duration-300 hover:brightness-200"
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
              <Separator
                color="#202037"
                orientation="vertical"
                unit="fixed"
                fixedHeight={14}
                className="block flex-shrink-0 lg:hidden"
              />
            </div>
          </div>
        </div>

        <div onClick={(e) => e.stopPropagation()}>
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

      {/* Content */}
      <div className={cn(cardStyles.content)} style={cardStyles.contentCss}>
        {process.env.NODE_ENV === "development" && (
          <div className="absolute right-0 top-0 z-[100] bg-white/10 text-xs text-primary">
            {cardWidth}
          </div>
        )}
        <div
          // onClick={handleCardClick}
          // onMouseDown={(e) => {
          //   if (e.button === 1) {
          //     e.preventDefault();
          //     handleCardContextMenu(e);
          //   }
          // }}
          // onContextMenu={handleCardContextMenu}
          className={cn("z-[5] flex items-center justify-center")}
        >
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
                ? "items-center gap-x-1 lg:gap-x-3"
                : "gap-x-4",
            )}
          >
            <div
              className={`${progressGap[currentAvatarPreset]} relative flex flex-col items-center`}
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
              </AvatarHighlightWrapper>

              <div
                className={`flex ${progressWidthMap[currentAvatarPreset]} flex-col`}
              >
                <GradientProgressBar
                  bondingCurveProgress={Math.round(
                    Number(data?.migration?.progress),
                  )}
                  type="linear"
                />

                <TimeDifference
                  created={data?.created}
                  migrated_time={data?.migration?.timestamp}
                  dex={data?.dex}
                />
              </div>
            </div>

            <div
              className={cn(
                "flex w-full flex-col gap-y-1 pb-3.5",
                // !["normal", "large"].includes(currentAvatarPreset) && "pb-2",
              )}
            >
              {/* <StatBadges
                bundled={data?.bundled}
                isMigrating={data?.migrating}
                stars={data?.stars}
                snipers={data?.snipers}
                insiderPercentage={data?.insider_percentage}
                top10Percentage={data?.top10_percentage}
                devHoldingPercentage={data?.dev_holding_percentage}
                isSnapOpen={(() => {
                  // Different card width conditions for each button size
                  if (["normal", "large"].includes(currentButtonPreset)) {
                    return cardWidth < 485;
                  }
                  if (
                    ["extralarge", "doubleextralarge"].includes(
                      currentButtonPreset,
                    )
                  ) {
                    return cardWidth < 505;
                  }
                  if (
                    ["tripleextralarge", "quadripleextralarge"].includes(
                      currentButtonPreset,
                    )
                  ) {
                    return cardWidth < 525;
                  }
                  return cardWidth < 530; // default fallback
                })()}
                isLargePreset={["large"].includes(currentAvatarPreset)}
                isXLPreset={["extralarge", "doubleextralarge"].includes(
                  currentAvatarPreset,
                )}
              /> */}
              <CustomCosmoStats
                isFirst={isFirst && column === 1}
                regular_users={data?.bot_holders}
                bot_total_fees={data?.bot_total_fees}
                bags_royalties={data?.bags_royalties}
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
                snipers={data?.sniper_percentage}
                stars={data?.stars}
                top10Percentage={data?.top10_percentage}
                type="stat-badge"
                volumeUSD={data?.volume_usd}
                bundled_percentage={data?.bundled_percentage}
                cardType="type1"
                dev_wallet_details={data?.dev_wallet_details}
              />

              <div className="flex flex-col gap-y-[1px]">
                <div className="flex items-center gap-x-1.5">
                  {isCardViewActive("bundled") && (
                    <div className="mb-[2px] mt-[2px] flex items-center gap-x-0.5 font-geistSemiBold text-xs text-fontColorSecondary">
                      Bundled:
                      <span
                        className={cn(
                          "inline-block",
                          currentPresets.colorSetting === "cupsey"
                            ? (data?.bundled_percentage || 0) <= 10
                              ? "text-[#3ed6cc]"
                              : "text-[#FF4B92]"
                            : (data?.bundled_percentage || 0) <= 10
                              ? "text-success"
                              : "text-destructive",
                        )}
                      >
                        {data?.bundled_percentage?.toFixed(0) || 0}%
                      </span>
                      {/* <span
                          className={cn(
                            "inline-block",
                            (data?.bundled_percentage ?? 0) > 0
                              ? "text-destructive"
                              : "text-success",
                          )}
                        >
                          {(data?.bundled_percentage ?? 0) > 0
                            ? data?.bundled_percentage?.toFixed(1) + "%"
                            : "0%"}
                        </span> */}
                    </div>
                  )}
                  {data?.is_discord_monitored &&
                    data?.discord_details?.group_counts &&
                    data?.discord_details?.group_counts?.length > 0 && (
                      <div className="mb-[2px] mt-[2px] flex items-center gap-x-0.5 font-geistSemiBold text-xs text-fontColorSecondary">
                        Groups:
                        <TooltipProvider>
                          <span className="ml-1 flex gap-x-0.5">
                            {data?.discord_details?.group_counts?.map(
                              (group) => (
                                <Tooltip key={group.name} delayDuration={0}>
                                  <TooltipTrigger asChild>
                                    <div className="relative h-4 w-4 overflow-hidden rounded-full">
                                      <Image
                                        unoptimized={false}
                                        src={group.image}
                                        alt={group.name}
                                        fill
                                        sizes="16px"
                                        objectFit="contain"
                                      />
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>{group.name}</TooltipContent>
                                </Tooltip>
                              ),
                            )}
                          </span>
                        </TooltipProvider>
                      </div>
                    )}
                </div>

                <CustomCosmoStats
                  isFirst={isFirst && column === 1}
                  regular_users={data?.bot_holders}
                  bot_total_fees={data?.bot_total_fees}
                  bags_royalties={data?.bags_royalties}
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
                  cardType="type1"
                  className="justify-start"
                  dev_wallet_details={data?.dev_wallet_details}
                />
              </div>
            </div>
          </div>
        </div>

        {((["normal", "large"].includes(currentButtonPreset) &&
          cardWidth < 450) ||
          (["extralarge", "doubleextralarge"].includes(currentButtonPreset) &&
            (cardWidth < 450 || statBadgesWidth > cardWidth * 0.3)) ||
          (["tripleextralarge", "quadripleextralarge"].includes(
            currentButtonPreset,
          ) &&
            (cardWidth < 450 || statBadgesWidth > cardWidth * 0.3))) && (
            <div
              onClick={onClick}
              className="pointer-events-none invisible absolute right-0 top-0 z-[8] h-full w-[75%] bg-gradient-to-r from-[#1A1A2300] to-background/[85%] to-[90%] opacity-0 transition-all duration-200 ease-in-out group-hover:visible group-hover:opacity-100"
            />
          )}

        {data?.migration?.migrating ? (
          <SnipeButton
            data={data}
            className={cn(
              `absolute top-1/2 z-[10] flex w-auto flex-shrink-0 -translate-y-[30%] items-center justify-center`,
              "right-0 scale-[0.9]",

              // NORMAL & LARGE BUTTON PRESETS
              ["normal", "large"].includes(currentButtonPreset) &&
              cn(
                "-translate-y-[5%]",
                cardWidth < 450 && TRANSPARENT_BUTTON_CLASS,
                cardWidth < 500 && "-translate-y-[-2%]",
              ),

              // EXTRALARGE & DOUBLEEXTRALARGE BUTTON PRESETS
              ["extralarge", "doubleextralarge"].includes(
                currentButtonPreset,
              ) &&
              cn(
                //"top-[40%]",
                !["normal", "large"].includes(currentFontPreset)
                  ? "top-[52%]"
                  : "top-[50%]",
                (cardWidth < 450 || statBadgesWidth > cardWidth * 0.3) &&
                TRANSPARENT_BUTTON_CLASS,
              ),

              // TRIPLEEXTRALARGE & QUADRIPLEEXTRALARGE BUTTON PRESETS
              ["tripleextralarge", "quadripleextralarge"].includes(
                currentButtonPreset,
              ) &&
              cn(
                !["normal", "large"].includes(currentFontPreset)
                  ? "top-[45%]"
                  : "top-[50%]",
                (cardWidth < 450 || statBadgesWidth > cardWidth * 0.3) &&
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
              `absolute top-1/2 z-[10] flex w-auto flex-shrink-0 -translate-y-[30%] items-center justify-center`,
              "right-0 scale-[0.9]",

              // NORMAL & LARGE BUTTON PRESETS
              ["normal", "large"].includes(currentButtonPreset) &&
              cn(
                "-translate-y-[5%]",
                cardWidth < 450 && TRANSPARENT_BUTTON_CLASS,
                cardWidth < 500 && "-translate-y-[-2%]",
              ),

              // EXTRALARGE & DOUBLEEXTRALARGE BUTTON PRESETS
              ["extralarge", "doubleextralarge"].includes(
                currentButtonPreset,
              ) &&
              cn(
                //"top-[40%]",
                !["normal", "large"].includes(currentFontPreset)
                  ? "top-[52%]"
                  : "top-[50%]",
                (cardWidth < 450 || statBadgesWidth > cardWidth * 0.3) &&
                TRANSPARENT_BUTTON_CLASS,
              ),

              // TRIPLEEXTRALARGE & QUADRIPLEEXTRALARGE BUTTON PRESETS
              ["tripleextralarge", "quadripleextralarge"].includes(
                currentButtonPreset,
              ) &&
              cn(
                !["normal", "large"].includes(currentFontPreset)
                  ? "top-[45%]"
                  : "top-[50%]",
                (cardWidth < 450 || statBadgesWidth > cardWidth * 0.3) &&
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
              remaining_accounts: data?.swap_keys?.remaining_accounts
            }}
          />
        )}
      </div>

      {/* <div className="absolute right-1 top-1 z-[1000] flex flex-col bg-black/80 text-xs text-white">
          <span>Remaining {remainingScreenWidth}</span>
          <span>
            Less Than 1400: {remainingScreenWidth < 1400 ? "🟢" : "🔴"}
          </span>
          <span>Is Small Screen: {isSmallScreen ? "🟢" : "🔴"}</span>
        </div> */}
    </>
  );
};

export default CosmoCardType1;
