"use client";

// ######## Libraries 📦 & Hooks 🪝 ########
import React, { useState, useMemo, useEffect } from "react";
import { useCustomizeSettingsStore } from "@/stores/setting/use-customize-settings.store";

// ######## Components 🧩 ########
import Image from "next/image";
import { HiCamera } from "react-icons/hi2";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import TokenImageHover from "@/components/customs/TokenImageHover";
// ######## Utils & Helpers 🤝 ########
import { cn } from "@/libraries/utils";
import { getProxyUrl } from "@/utils/getProxyUrl";
import { DEX, LAUNCHPAD } from "@/types/ws-general";

export type BadgeType =
  | "moonshot"
  | "launch_a_coin"
  | "candle_tv"
  | "bonk"
  | "pumpfun"
  | "launchlab"
  | "raydium"
  | "boop"
  | "dynamic_bonding_curve"
  | "meteora_amm_v2"
  | "meteora_amm"
  | "pumpswap"
  | "moonit"
  | "orca"
  | "jupiter_studio"
  | "bags"
  | ""
  | "raydium_cpmm"
  | "raydium_amm"
  | "heaven";
export type AvatarSize = "xs" | "sm" | "md" | "lg";

interface AvatarWithBadgesProps {
  withImageHover?: boolean;
  symbol?: string;
  src?: string;
  alt: string;
  leftType?: BadgeType;
  rightType?: BadgeType;
  className?: string;
  classNameParent?: string;
  leftClassName?: string;
  rightClassName?: string;
  handleGoogleLensSearch?: (e: React.MouseEvent, image: string) => void;
  cameraIconClassname?: string;
  size?: AvatarSize;
  sizeConstant?: number;
  badgeSizeConstant?: number;
  isSquared?: boolean;
  isCosmo?: boolean;
}

interface BadgeProps {
  type: BadgeType;
  position: "left" | "right";
  additionalClassName?: string;
  badgeSizeConstant?: number;
  size?: AvatarSize;
}

// Cache badge image paths to avoid repeated calculations
const BADGE_IMAGE_PATHS: Record<BadgeType, { src: string; alt: string }> = {
  moonshot: { 
    src: "/icons/asset/yellow-moonshot.png", 
    alt: "Moonshot Icon" 
  },
  pumpfun: { 
    src: "/icons/asset/pumpfun.png", 
    alt: "Pumpfun Icon" 
  },
  launch_a_coin: {
    src: "/icons/asset/launch_a_coin.png",
    alt: "Launch A Coin Icon",
  },
  candle_tv: {
    src: "/icons/asset/candle_tv.png",
    alt: "Candle TV Icon",
  },
  bonk: { 
    src: "/icons/asset/bonk.svg", 
    alt: "Bonk Icon" 
  },
  launchlab: { 
    src: "/icons/asset/launch_lab.svg", 
    alt: "LaunchLab Icon" 
  },
  raydium: {
    src: "/icons/asset/raydium.png",
    alt: "Raydium Icon",
  },
  boop: {
    src: "/icons/asset/boop.png",
    alt: "Boop Icon",
  },
  dynamic_bonding_curve: {
    src: "/icons/asset/dynamic_bonding_curve.svg",
    alt: "Dynamic Bonding Curve Icon",
  },
  meteora_amm_v2: {
    src: "/icons/asset/meteora_amm.svg",
    alt: "Meteora AMM V2 Icon",
  },
  meteora_amm: { 
    src: "/icons/asset/meteora_amm.svg", 
    alt: "Meteora AMM Icon" 
  },
  pumpswap: { 
    src: "/icons/asset/pumpfun.png", 
    alt: "Pumpswap Icon" 
  },
  moonit: { 
    src: "/icons/asset/moonit.svg", 
    alt: "Moonit Icon" 
  },
  orca: { 
    src: "/icons/asset/orca.svg", 
    alt: "Orca Icon" 
  },
  jupiter_studio: {
    src: "/icons/asset/jupiter_studio.svg",
    alt: "Jupiter Studio Icon",
  },
  bags: { 
    src: "/icons/asset/bags.svg", 
    alt: "Bags Icon" 
  },
  "": { src: "", alt: "" },
  // Others
  raydium_cpmm: {
    src: "/icons/asset/raydium_cpmm.svg",
    alt: "Raydium CPMM Icon",
  },
  raydium_amm: {
    src: "/icons/asset/raydium.png",
    alt: "Raydium AMM Icon",
  },
  heaven: {
    src: "/icons/asset/heaven.png",
    alt: "Heaven Icon",
  },
};

// Size mapping constants to avoid repetitive ternary operations
const SIZE_MAPPINGS = {
  xs: {
    avatar: "size-6 md:size-7",
    badge: "size-[10px]",
  },
  sm: {
    avatar: "size-7 md:size-8",
    badge: "size-[12px]",
  },
  md: {
    avatar: "size-10 md:size-10",
    badge: "size-[14px]",
  },
  lg: {
    avatar: "size-12 md:size-[56px]",
    badge: "-bottom-3 size-[17px]",
  },
};

export const getRightBadgeType = (dex: DEX, launchpad?: LAUNCHPAD) => {
  if (dex === "LaunchLab" && launchpad === "Bonk") {
    return "bonk" as BadgeType;
  }
  if (dex === "Dynamic Bonding Curve" && launchpad === "Bags") {
    return "bags" as BadgeType;
  }

  if (dex === "Dynamic Bonding Curve") {
    if (launchpad === "Launch a Coin") return "launch_a_coin" as BadgeType;
    if (launchpad === "Candle TV") return "candle_tv" as BadgeType;
    if (launchpad === "Jupiter Studio") return "jupiter_studio" as BadgeType;
  }

  return (dex || "")
    ?.replace(/\./g, "")
    ?.replace(/ /g, "_")
    ?.toLowerCase() as BadgeType;
};

export const getLeftBadgeType = (
  dex: DEX,
  origin_dex: DEX,
  launchpad?: LAUNCHPAD,
): BadgeType | undefined => {
  const graduatedDexList = [
    "Raydium",
    "Raydium CPMM",
    "Raydium AMM",
    "Meteora AMM V2",
    "Meteora AMM",
    "PumpSwap",
  ];

  if (graduatedDexList.includes(dex)) {
    if (origin_dex === "LaunchLab" && launchpad === "Bonk") {
      return "bonk" as BadgeType;
    }

    if (origin_dex === "Dynamic Bonding Curve") {
      if (launchpad === "Launch a Coin") return "launch_a_coin" as BadgeType;
      if (launchpad === "Candle TV") return "candle_tv" as BadgeType;
      if (launchpad === "Jupiter Studio") return "jupiter_studio" as BadgeType;
    }

    return (origin_dex || "")
      ?.replace(/\./g, "")
      ?.replace(/ /g, "_")
      ?.toLowerCase() as BadgeType;
  }

  return undefined;
};

const Badge = React.memo(function Badge({
  type,
  position,
  additionalClassName,
  badgeSizeConstant,
  size = "sm",
}: BadgeProps) {
  const sizeClasses = SIZE_MAPPINGS[size];
  const badge = BADGE_IMAGE_PATHS[type];

  const positionClass =
    position === "left"
      ? `${window.location.pathname.includes("/token/") ? "-bottom-0.5 -left-0.5" : "bottom-0.5 left-0.5"} ${additionalClassName}`
      : `${window.location.pathname.includes("/token/") ? "-bottom-0.5 -right-0.5" : "bottom-0.5 right-0.5"} ${additionalClassName}`;

  const tooltipLabel = useMemo(() => {
    if (type === "pumpfun") {
      return "PumpFun";
    }
    if (type === "pumpswap") {
      return "PumpSwap";
    }
    if (type === "launch_a_coin") {
      return "Launch a Coin";
    }
    if (type === "candle_tv") {
      return "Candle TV";
    }
    if (type === "launchlab") {
      return "LaunchLab";
    }
    if (type === "dynamic_bonding_curve") {
      return "Dynamic Bonding Curve";
    }
    if (type === "meteora_amm_v2") {
      return "Meteora AMM V2";
    }
    if (type === "meteora_amm") {
      return "Meteora AMM";
    }
    if (type === "raydium_cpmm") {
      return "Raydium CPMM";
    }
    if (type === "raydium_amm") {
      return "Raydium AMM";
    }
    if (type === "jupiter_studio") {
      return "Jupiter Studio";
    }
    return type
      .split(" ")
      ?.map((word) => word?.charAt(0)?.toUpperCase() + word?.slice(1))
      .join("");
  }, [type]);

  return (
    <TooltipProvider>
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <div
            className={cn(
              `absolute z-50 rounded-full bg-black ${sizeClasses.badge}`,
              positionClass,
              type === "pumpswap" && "hue-rotate-[120deg] saturate-150",
              type === "launchlab" && "hue-rotate-[150deg] saturate-200",
              type === "dynamic_bonding_curve" &&
                "brightness-150 hue-rotate-[80deg] saturate-150",
              type === "meteora_amm_v2" &&
                "brightness-125 hue-rotate-[15deg] saturate-150",
            )}
            aria-label={badge?.alt || "Badge"}
          >
            {Boolean(badge?.src) && (
              <Image
                loading="lazy"
                src={badge?.src}
                alt={badge?.alt || "Badge"}
                {...(badgeSizeConstant
                  ? {
                      height: badgeSizeConstant,
                      width: badgeSizeConstant,
                    }
                  : { fill: true })}
                quality={100}
                className="object-contain rounded-full"
              />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          isWithAnimation={false}
          className="px-2 py-0.5"
        >
          <span className="text-[10px]">{tooltipLabel}</span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});

const AvatarWithBadges = ({
  withImageHover = false,
  symbol,
  src,
  alt,
  leftType,
  rightType,
  className,
  classNameParent,
  leftClassName,
  rightClassName,
  handleGoogleLensSearch,
  cameraIconClassname,
  size = "sm",
  sizeConstant,
  badgeSizeConstant,
  isSquared = false,
  isCosmo = false,
}: AvatarWithBadgesProps) => {
  const [isLoading, setIsLoading] = useState(true);

  const sizeClasses = SIZE_MAPPINGS[size];
  const imageSrc = useMemo(() => {
    const base = getProxyUrl(src as string, symbol?.[0] || alt?.[1] || "");

    return `${base}`;
  }, [src, alt, symbol]);

  // Memoize the image source to prevent unnecessary re-renders
  // const imageSrc = useMemo(
  //   () => getProxyUrl(src as string, symbol?.[0] || alt?.[1] || ""),
  //   [src, alt, symbol],
  // );
  // useMemo(() => {
  //   if (!src) return undefined;

  //   if (src && src.startsWith("/images/")) return src;

  //   // If both direct and proxy approaches failed, use the first character as fallback
  //   if (src?.toLowerCase()?.includes("base64"))
  //     return src;

  //   // Try proxy if direct image failed
  //   return `${getRandomProxyUrl()}/proxy?url=${encodeURIComponent(src)}&fallback=${symbol?.[0] || alt?.[1]}`.trimEnd();
  // }, [src]);

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const [isAvatarHovered, setIsAvatarHovered] = useState(false);

  const showFallback = !imageSrc;

  const customizedSettingPresets = useCustomizeSettingsStore(
    (state) => state.presets,
  );
  const customizedSettingActivePreset = useCustomizeSettingsStore(
    (state) => state.activePreset,
  );

  const currentAvatarPreset =
    customizedSettingPresets[customizedSettingActivePreset].avatarSetting ||
    "normal";

  const sideOffsetMap = useMemo(() => {
    if (currentAvatarPreset === "normal") return -50;
    if (currentAvatarPreset === "large") return -58;
    if (currentAvatarPreset === "extralarge") return -65;
    if (currentAvatarPreset === "doubleextralarge") return -74;
    return -50;
  }, [currentAvatarPreset]);

  return (
    <div className="relative !aspect-square">
      {withImageHover ? (
        <div className="relative h-auto w-auto">
          <Popover open={isAvatarHovered}>
            <PopoverTrigger asChild className="relative !z-40">
              <div>
                <div
                  className={cn(
                    "group/avatar avatar-with-badges relative flex aspect-square flex-shrink-0 items-center justify-center rounded-full",
                    sizeClasses.avatar,
                    classNameParent,
                    isSquared && isCosmo ? "rounded-[4px]" : "rounded-full",
                  )}
                >
                  <div
                    className={cn(
                      "relative aspect-square size-full rounded-full",
                      className,
                      isSquared && isCosmo ? "rounded-[4px]" : "rounded-full",
                      !showFallback &&
                        handleGoogleLensSearch &&
                        "cursor-pointer transition-opacity duration-300 ease-out hover:opacity-0",
                    )}
                  >
                    {/* <div className="fixed inset-0 z-[50] bg-black text-white">
                      {imageSrc}
                    </div> */}
                    {Boolean(imageSrc) ? (
                      <Image
                        unoptimized={false}
                        key={imageSrc + symbol?.[0]}
                        src={imageSrc as string}
                        alt={alt}
                        {...(sizeConstant
                          ? {
                              height: sizeConstant,
                              width: sizeConstant,
                            }
                          : { fill: true })}
                        className={cn(
                          "size-full rounded-full object-cover",
                          isSquared && isCosmo
                            ? "rounded-[4px]"
                            : "rounded-full",
                        )}
                      />
                    ) : (
                      <div
                        className={cn(
                          "flex size-full items-center justify-center rounded-full",
                          isSquared && isCosmo
                            ? "rounded-[4px]"
                            : "rounded-full",
                        )}
                      >
                        {symbol ? (
                          <span className="inline-block text-lg font-medium uppercase leading-none text-white md:text-xl">
                            {symbol?.[0]}
                          </span>
                        ) : (
                          <span className="inline-block text-lg font-medium uppercase leading-none text-white md:text-xl">
                            {alt?.[1]}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {handleGoogleLensSearch && imageSrc && !showFallback && (
                    <button
                      onClick={(e) => handleGoogleLensSearch(e, src || "")}
                      className={cn(
                        "invisible absolute left-1/2 top-1/2 flex h-full w-full -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-[#360146]/50 opacity-0 duration-100 group-hover/avatar:visible group-hover/avatar:opacity-100",
                        isSquared && isCosmo ? "rounded-[4px]" : "rounded-full",
                      )}
                      aria-label="Search with Google Lens"
                    >
                      <HiCamera
                        className={cn(
                          "text-[28px] text-fontColorPrimary",
                          cameraIconClassname,
                        )}
                      />
                    </button>
                  )}
                </div>
              </div>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              side="bottom"
              sideOffset={sideOffsetMap}
              onMouseEnter={() => setIsAvatarHovered(true)}
              onMouseLeave={() => setIsAvatarHovered(false)}
              className="relative z-[1000] w-auto overflow-hidden rounded-[8px] border-none p-0"
            >
              <TokenImageHover
                src={src!}
                symbol={symbol || ""}
                handleGoogleLensSearch={
                  src ? (e) => handleGoogleLensSearch!(e, src || "") : undefined
                }
                isCosmo={isCosmo}
              />
            </PopoverContent>
          </Popover>

          <div
            onMouseEnter={() => setIsAvatarHovered(true)}
            onMouseLeave={() => setIsAvatarHovered(false)}
            className="absolute left-1/2 top-1/2 !z-40 size-[80%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-transparent opacity-0"
          ></div>
        </div>
      ) : (
        <div
          className={cn(
            "group/avatar avatar-with-badges relative flex aspect-square flex-shrink-0 items-center justify-center rounded-full",
            sizeClasses.avatar,
            classNameParent,

            isSquared && isCosmo ? "rounded-[4px]" : "rounded-full",
          )}
        >
          <div
            className={cn(
              "relative aspect-square size-full rounded-full",
              className,
              isSquared && isCosmo ? "rounded-[4px]" : "rounded-full",
              !showFallback &&
                handleGoogleLensSearch &&
                "cursor-pointer transition-opacity duration-300 ease-out hover:opacity-0",
            )}
          >
            {Boolean(imageSrc) ? (
              <Image
                unoptimized={false}
                key={imageSrc}
                src={imageSrc as string}
                alt={alt}
                {...(sizeConstant
                  ? {
                      height: sizeConstant,
                      width: sizeConstant,
                    }
                  : { fill: true })}
                className={cn(
                  "size-full rounded-full object-cover",
                  // isLoading && "animate-pulse",
                  isSquared && isCosmo ? "rounded-[4px]" : "rounded-full",
                )}
                //  onError={handleImageError}
                onLoad={handleImageLoad}
              />
            ) : (
              <div
                className={cn(
                  "flex size-full items-center justify-center rounded-full",
                  isSquared && isCosmo ? "rounded-[4px]" : "rounded-full",
                )}
              >
                {symbol ? (
                  <span className="inline-block text-lg font-medium uppercase leading-none text-white md:text-xl">
                    {symbol?.[0]}
                  </span>
                ) : (
                  <span className="inline-block text-lg font-medium uppercase leading-none text-white md:text-xl">
                    {alt?.[1]}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Google Lens Search Overlay */}
          {handleGoogleLensSearch && imageSrc && !showFallback && (
            <button
              onClick={(e) => handleGoogleLensSearch(e, src || "")}
              className={cn(
                "invisible absolute left-1/2 top-1/2 flex h-full w-full -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-[#360146]/50 opacity-0 duration-100 group-hover/avatar:visible group-hover/avatar:opacity-100",
                isSquared && isCosmo ? "rounded-[4px]" : "rounded-full",
              )}
              aria-label="Search with Google Lens"
            >
              <HiCamera
                className={cn(
                  "text-[28px] text-fontColorPrimary",
                  cameraIconClassname,
                )}
              />
            </button>
          )}
        </div>
      )}

      {/* Left Badge */}
      {leftType && (
        <Badge
          type={leftType}
          position="left"
          additionalClassName={leftClassName}
          badgeSizeConstant={badgeSizeConstant}
          size={size}
        />
      )}

      {/* Right Badge */}
      {rightType && (
        <Badge
          type={rightType}
          position="right"
          additionalClassName={rightClassName}
          badgeSizeConstant={badgeSizeConstant}
          size={size}
        />
      )}
    </div>
  );
};

// Only re-render if props actually change
export default React.memo(AvatarWithBadges);
