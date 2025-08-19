"use client";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/libraries/utils";
import { formatAmount } from "@/utils/formatAmount";
import Image from "next/image";
import Link from "next/link";
import React, { useMemo } from "react";
import {
  SVGComponent,
  SVGProps,
  InstagramCupseyIconSVG,
  InstagramEyeIconSVG,
  InstagramIconSVG,
  InstagramWhiteIconSVG,
  PumpfunIconSVG,
  SupportIconSVG,
  TelegramCupseyIconSVG,
  TelegramIconSVG,
  TelegramWhiteIconSVG,
  TiktokIconSVG,
  TiktokWhiteIconSVG,
  TruthSocialEyeIconSVG,
  TruthSocialIconSVG,
  TwitterCupseyIconSVG,
  TwitterIconSVG,
  WebsiteCupseyIconSVG,
  WebsiteIconSVG,
  XIconSVG,
  YoutubeEyeIconSVG,
  YoutubeIconSVG,
  YoutubeWhiteIconSVG,
  TwitterCommunityCupseyIconSVG,
  TwitterCommunityIconSVG,
} from "@/components/customs/ScalableVectorGraphics";

export type SocialLinkIconType =
  | "x"
  | "twitter"
  | "twitter-cupsey"
  | "website"
  | "website-cupsey"
  | "youtube"
  | "youtube-white"
  | "youtube-eye"
  | "instagram"
  | "instagram-white"
  | "instagram-cupsey"
  | "instagram-eye"
  | "tiktok"
  | "tiktok-white"
  | "telegram"
  | "telegram-white"
  | "telegram-cupsey"
  | "truthsocial"
  | "truthsocial-eye"
  | "pumpfun"
  | "pumpfun-cupsey"
  | "bonk"
  | "support";

const ICON_SVG_MAP: Record<SocialLinkIconType, SVGComponent | null> = {
  x: XIconSVG,
  twitter: TwitterIconSVG,
  "twitter-cupsey": TwitterCupseyIconSVG,
  website: WebsiteIconSVG,
  "website-cupsey": WebsiteCupseyIconSVG,
  youtube: YoutubeIconSVG,
  "youtube-white": YoutubeWhiteIconSVG,
  "youtube-eye": YoutubeEyeIconSVG,
  instagram: InstagramIconSVG,
  "instagram-white": InstagramWhiteIconSVG,
  "instagram-cupsey": InstagramCupseyIconSVG,
  "instagram-eye": InstagramEyeIconSVG,
  tiktok: TiktokIconSVG,
  "tiktok-white": TiktokWhiteIconSVG,
  telegram: TelegramIconSVG,
  "telegram-white": TelegramWhiteIconSVG,
  "telegram-cupsey": TelegramCupseyIconSVG,
  truthsocial: TruthSocialIconSVG,
  "truthsocial-eye": TruthSocialEyeIconSVG,
  pumpfun: PumpfunIconSVG,
  "pumpfun-cupsey": null,
  bonk: null,
  support: SupportIconSVG,
};

const SocialLinkButton = React.memo(
  ({
    href,
    icon,
    label,
    variant = "secondary",
    size = "md",
    withTooltip = true,
    containerSize,
    iconSize,
    isTwitterCommunity = false,
    communityMemberCount,
  }: {
    href: string;
    icon: SocialLinkIconType;
    label: string;
    variant?: "primary" | "secondary" | "cupsey";
    size?: "sm" | "md";
    withTooltip?: boolean;
    containerSize?: string;
    iconSize?: string;
    isTwitterCommunity?: boolean;
    communityMemberCount?: number;
  }) => {
    const IconComponent = icon ? ICON_SVG_MAP[icon] : null;

    // Memoize the button content to prevent unnecessary re-renders
    const buttonContent = useMemo(
      () => (
        <div
          className={cn(
            "relative aspect-square size-[18px] flex-shrink-0",
            size === "sm" ? "size-[16px]" : "",
            containerSize ? containerSize : "",
          )}
        >
          {variant === "cupsey" && icon === "pumpfun-cupsey" ? (
            <Image
              src="/icons/social/pumpfun-cupsey.png"
              alt="Pumpfun Cupsey Icon"
              height={size === "sm" ? 16 : 18}
              width={size === "sm" ? 16 : 18}
              quality={100}
              loading="lazy"
              className={cn(
                "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 object-contain",
                iconSize,
              )}
            />
          ) : icon === "bonk" ? (
            <Image
              src="/icons/asset/bonk_gray.svg"
              alt="Bonk Gray Icon"
              height={size === "sm" ? 16 : 18}
              width={size === "sm" ? 16 : 18}
              quality={100}
              loading="lazy"
              className={cn(
                "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 object-contain",
                iconSize,
              )}
            />
          ) : IconComponent ? (
            <IconComponent
              className={cn(
                "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 object-contain",
                iconSize,
              )}
            />
          ) : null}
        </div>
      ),
      [icon, size, containerSize, iconSize, label, variant],
    );

    // Memoize the community button content
    const communityButtonContent = useMemo(
      () => (
        <div className="flex items-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              window.open(href, "_blank");
            }}
            className="flex items-center gap-0.5 rounded-[4px] border border-transparent bg-white/[16%] px-[6px] py-0.5"
          >
            {/* <div className="relative aspect-square size-4">
              <Image
                src={
                  variant === "cupsey"
                    ? "/icons/community-cupsey.svg"
                    : "/icons/social/twitter-communities-people.svg"
                }
                alt="Twitter Communities"
                fill
                className="object-contain"
              />
            </div> */}
            {variant === "cupsey" ? (
              <TwitterCommunityCupseyIconSVG />
            ) : (
              <TwitterCommunityIconSVG />
            )}
            <span className="font-geistMedium text-xs font-medium leading-none text-fontColorPrimary">
              {formatAmount(communityMemberCount || 0, 0)}
            </span>
          </button>
        </div>
      ),
      [href, communityMemberCount, variant],
    );

    if (!href) return null;

    if (isTwitterCommunity) {
      return communityButtonContent;
    }

    if (!withTooltip) {
      return (
        <Link
          href={href}
          target="_blank"
          prefetch={false}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "relative flex aspect-square h-[24px] w-[24px] flex-shrink-0 items-center justify-center rounded-[4px] duration-300 before:!absolute before:!rounded-[4px] hover:bg-white/[12%]",
            variant === "cupsey"
              ? "bg-transparent hover:bg-transparent"
              : variant == "primary"
                ? "gb__white__btn bg-white/[6%]"
                : "gb__white__btn bg-[#272734]",
            size === "sm" ? "size-[20px]" : "",
          )}
        >
          {buttonContent}
        </Link>
      );
    }

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href={href}
              prefetch={false}
              target="_blank"
              onClick={(e) => e.stopPropagation()}
              className={cn(
                "relative flex aspect-square h-[24px] w-[24px] flex-shrink-0 items-center justify-center rounded-[4px] duration-300 before:!absolute before:!rounded-[4px] hover:bg-white/[12%]",
                variant === "cupsey"
                  ? "bg-transparent hover:bg-transparent"
                  : variant == "primary"
                    ? "gb__white__btn bg-white/[6%]"
                    : "gb__white__btn bg-[#272734]",
                size === "sm" ? "size-[20px]" : "",
                containerSize ? containerSize : "",
              )}
            >
              {buttonContent}
            </Link>
          </TooltipTrigger>
          <TooltipContent isWithAnimation={false}>
            <p>{label}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  },
);

SocialLinkButton.displayName = "SocialLink";

export default SocialLinkButton;
