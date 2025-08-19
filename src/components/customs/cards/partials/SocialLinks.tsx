"use client";

// ######## Libraries 📦 & Hooks 🪝 ########
import React, { useMemo } from "react";
import { useCustomizeSettingsStore } from "@/stores/setting/use-customize-settings.store";
// ######## Components 🧩 ########
import TwitterHoverPopover from "@/components/customs/TwitterHoverPopover";
import TwitterCommentHoverPopover from "@/components/customs/TwitterCommentHoverPopover";
import InstagramPopover from "@/components/customs/InstagramPopover";
import TruthSocialHoverPopover from "@/components/customs/TruthSocialHoverPopover";
import SocialLinkButton from "@/components/customs/buttons/SocialLinkButton";
import TiktokHoverPopover from "@/components/customs/TiktokHoverPopover";
import WebsiteHoverPopover from "../../WebsiteHoverPopover";
import YoutubeHoverPopover from "../../YoutubeHoverPopover";
import { usePopupStore } from "@/stores/use-popup-state.store";
import { cn } from "@/libraries/utils";
import { DEX } from "@/types/ws-general";
import Image from "next/image";
import Link from "next/link";
import {
  TwitterIntentIconSVG,
  TwitterListIconSVG,
  TwitterSearchIconSVG,
} from "@/components/customs/ScalableVectorGraphics";

const iconSizeContainerMap = {
  normal: "!size-[20px]",
  large: "!size-[22px]",
  extralarge: "!size-[24px]",
  doubleextralarge: "!size-[28px]",
};

const iconSizeMap = {
  normal: "!size-[16px]",
  large: "!size-[18px]",
  extralarge: "!size-[20px]",
  doubleextralarge: "!size-[24px]",
};

const SocialLinks = React.memo(
  ({
    dex,
    isFirst,
    twitter,
    mint,
    telegram,
    website,
    youtube,
    tiktok,
    instagram,
    twitterStatusPopoverAlignment,
    isTokenPage = false,
    isCosmoCard = false,
  }: {
    dex: DEX;
    isFirst: boolean;
    twitter?: string;
    mint?: string;
    telegram?: string;
    website?: string;
    youtube?: string;
    tiktok?: string;
    instagram?: string;
    twitterStatusPopoverAlignment?: "center" | "end" | "start";
    isTokenPage?: boolean;
    isCosmoCard?: boolean;
  }) => {
    const customizedSettingPresets = useCustomizeSettingsStore(
      (state) => state.presets,
    );
    const customizedSettingActivePreset = useCustomizeSettingsStore(
      (state) => state.activePreset,
    );

    const isSnapOpen = usePopupStore((state) =>
      state.popups.some((p) => p.isOpen && p.snappedSide !== "none"),
    );

    const currentCardStylePreset = useMemo(
      () =>
        customizedSettingPresets[customizedSettingActivePreset]
          ?.cosmoCardStyleSetting || "type1",
      [customizedSettingPresets, customizedSettingActivePreset],
    );

    const remainingScreenWidth = usePopupStore(
      (state) => state.remainingScreenWidth,
    );

    const currentSocialPreset =
      customizedSettingPresets[customizedSettingActivePreset].socialSetting ||
      "normal";

    const isTruthSocial = website?.includes("truthsocial.com");
    const isTruthSocialPost =
      isTruthSocial &&
      (website?.includes("posts") || /\d+/.test(website ?? ""));
    const isValidWebsite = website && website !== "https://";

    const shouldExcludeTwitterLink = (twitterUrl: string): boolean => {
      const excludedPatterns = [
        "https://x.com/search?q=",
        "https://x.com/intent/",
        "https://x.com/i/lists/",
        "https://twitter.com/search?q=",
        "https://twitter.com/intent/",
        "https://twitter.com/i/lists/",
      ];

      return excludedPatterns.some((pattern) => twitterUrl.includes(pattern));
    };

    return (
      <div
        id={isFirst ? "social-links-first" : undefined}
        className="relative z-20 flex items-center gap-x-1"
      >
        {twitter && twitter.includes("search?") && (
          <Link
            href={twitter}
            target="_blank"
            className={cn(
              "relative hidden h-[20px] flex-shrink-0 items-center justify-center rounded-[4px] duration-300 xl:flex",
              isCosmoCard
                ? iconSizeContainerMap[currentSocialPreset]
                : iconSizeContainerMap.normal,
              currentCardStylePreset === "type4"
                ? ""
                : "gb__white__btn_xs bg-[#272734] hover:bg-white/[12%]",
            )}
          >
            <div
              className={cn(
                "relative aspect-square size-[16px] flex-shrink-0",
                isCosmoCard
                  ? iconSizeMap[currentSocialPreset]
                  : iconSizeMap.normal,
              )}
            >
              {/* <Image
                src="/icons/social/twitter-search.svg"
                alt="Twitter Social Icon"
                fill
                quality={100}
                loading="lazy"
                className="object-contain"
              /> */}
              <TwitterSearchIconSVG
                className={
                  isCosmoCard
                    ? iconSizeMap[currentSocialPreset]
                    : iconSizeMap.normal
                }
              />
            </div>
          </Link>
        )}

        {twitter && twitter.includes("intent") && (
          <Link
            href={twitter}
            target="_blank"
            className={cn(
              "relative hidden h-[20px] flex-shrink-0 items-center justify-center rounded-[4px] duration-300 xl:flex",
              isCosmoCard
                ? iconSizeContainerMap[currentSocialPreset]
                : iconSizeContainerMap.normal,
              currentCardStylePreset === "type4"
                ? ""
                : "gb__white__btn_xs bg-[#272734] hover:bg-white/[12%]",
            )}
          >
            <div
              className={cn(
                "relative aspect-square size-[16px] flex-shrink-0",
                isCosmoCard
                  ? iconSizeMap[currentSocialPreset]
                  : iconSizeMap.normal,
              )}
            >
              {/* <Image
                src="/icons/social/twitter-intent.svg"
                alt="Twitter Social Icon"
                fill
                quality={100}
                loading="lazy"
                className="object-contain"
              /> */}
              <TwitterIntentIconSVG
                className={
                  isCosmoCard
                    ? iconSizeMap[currentSocialPreset]
                    : iconSizeMap.normal
                }
              />
            </div>
          </Link>
        )}

        {twitter && twitter.includes("list") && (
          <Link
            href={twitter}
            target="_blank"
            className={cn(
              "relative hidden h-[20px] flex-shrink-0 items-center justify-center rounded-[4px] duration-300 xl:flex",
              isCosmoCard
                ? iconSizeContainerMap[currentSocialPreset]
                : iconSizeContainerMap.normal,
              currentCardStylePreset === "type4"
                ? ""
                : "gb__white__btn_xs bg-[#272734] hover:bg-white/[12%]",
            )}
          >
            <div
              className={cn(
                "relative aspect-square size-[16px] flex-shrink-0",
                isCosmoCard
                  ? iconSizeMap[currentSocialPreset]
                  : iconSizeMap.normal,
              )}
            >
              {/* <Image
                src="/icons/social/twitter-list.svg"
                alt="Twitter Social Icon"
                fill
                quality={100}
                loading="lazy"
                className="object-contain"
              /> */}
              <TwitterListIconSVG
                className={
                  isCosmoCard
                    ? iconSizeMap[currentSocialPreset]
                    : iconSizeMap.normal
                }
              />
            </div>
          </Link>
        )}

        {twitter &&
          (twitter.includes("x.com") || twitter.includes("twitter.com")) &&
          !twitter.includes("status") &&
          !twitter.includes("truthsocial.com") &&
          !shouldExcludeTwitterLink(twitter) && (
            <TwitterHoverPopover
              variant={
                currentCardStylePreset === "type4" ? "cupsey" : "primary"
              }
              href={twitter}
              containerSize={
                isCosmoCard
                  ? iconSizeContainerMap[currentSocialPreset]
                  : iconSizeContainerMap.normal
              }
              iconSize={
                isCosmoCard
                  ? iconSizeMap[currentSocialPreset]
                  : iconSizeMap.normal
              }
              isTokenPage={isTokenPage}
            />
          )}

        {twitter &&
          (twitter.includes("x.com") || twitter.includes("twitter.com")) &&
          twitter.includes("status") &&
          !twitter.includes("communities") &&
          !twitter.includes("truthsocial.com") && (
            <TwitterCommentHoverPopover
              align={twitterStatusPopoverAlignment}
              variant={
                currentCardStylePreset === "type4" ? "cupsey" : "primary"
              }
              href={twitter}
              containerSize={
                isCosmoCard
                  ? iconSizeContainerMap[currentSocialPreset]
                  : iconSizeContainerMap.normal
              }
              iconSize={
                isCosmoCard
                  ? iconSizeMap[currentSocialPreset]
                  : iconSizeMap.normal
              }
              isTokenPage={isTokenPage}
            />
          )}

        {telegram && (
          <SocialLinkButton
            containerSize={
              isCosmoCard
                ? iconSizeContainerMap[currentSocialPreset]
                : iconSizeContainerMap.normal
            }
            iconSize={
              isCosmoCard
                ? iconSizeMap[currentSocialPreset]
                : iconSizeMap.normal
            }
            variant={currentCardStylePreset === "type4" ? "cupsey" : "primary"}
            size="sm"
            href={telegram}
            icon={
              currentCardStylePreset === "type4"
                ? "telegram-cupsey"
                : "telegram-white"
            }
            label="Telegram"
          />
        )}

        {Boolean(website) &&
          (isTruthSocial ? (
            isTruthSocialPost ? (
              <TruthSocialHoverPopover
                url={website as string}
                containerSize={
                  isCosmoCard
                    ? iconSizeContainerMap[currentSocialPreset]
                    : iconSizeContainerMap.normal
                }
                iconSize={
                  isCosmoCard
                    ? iconSizeMap[currentSocialPreset]
                    : iconSizeMap.normal
                }
                variant={
                  currentCardStylePreset === "type4" ? "cupsey" : "primary"
                }
              />
            ) : (
              <SocialLinkButton
                containerSize={
                  isCosmoCard
                    ? iconSizeContainerMap[currentSocialPreset]
                    : iconSizeContainerMap.normal
                }
                iconSize={
                  isCosmoCard
                    ? iconSizeMap[currentSocialPreset]
                    : iconSizeMap.normal
                }
                variant={
                  currentCardStylePreset === "type4" ? "cupsey" : "primary"
                }
                size="sm"
                href={website as string}
                icon="truthsocial"
                label="Truth Social"
              />
            )
          ) : (
            isValidWebsite && (
              <WebsiteHoverPopover
                variant={
                  currentCardStylePreset === "type4" ? "cupsey" : "primary"
                }
                href={website as string}
                containerSize={
                  isCosmoCard
                    ? iconSizeContainerMap[currentSocialPreset]
                    : iconSizeContainerMap.normal
                }
                iconSize={
                  isCosmoCard
                    ? iconSizeMap[currentSocialPreset]
                    : iconSizeMap.normal
                }
              />
            )
          ))}

        {/* Special Case */}
        {twitter &&
          (twitter.includes("truthsocial.com") && twitter.includes("posts") ? (
            <TruthSocialHoverPopover
              url={twitter}
              containerSize={
                isCosmoCard
                  ? iconSizeContainerMap[currentSocialPreset]
                  : iconSizeContainerMap.normal
              }
              iconSize={
                isCosmoCard
                  ? iconSizeMap[currentSocialPreset]
                  : iconSizeMap.normal
              }
            />
          ) : (
            twitter.includes("truthsocial.com") && (
              <SocialLinkButton
                containerSize={
                  isCosmoCard
                    ? iconSizeContainerMap[currentSocialPreset]
                    : iconSizeContainerMap.normal
                }
                iconSize={
                  isCosmoCard
                    ? iconSizeMap[currentSocialPreset]
                    : iconSizeMap.normal
                }
                variant={
                  currentCardStylePreset === "type4" ? "cupsey" : "primary"
                }
                size="sm"
                href={twitter}
                icon="truthsocial"
                label="Truth Social"
              />
            )
          ))}

        {Boolean(youtube) && (
          <>
            {youtube?.includes("/watch?v=") ||
            youtube?.includes("/embed/") ||
            youtube?.includes("youtu.be/") ||
            youtube?.includes("/shorts/") ? (
              <YoutubeHoverPopover
                url={youtube}
                containerSize={
                  isCosmoCard
                    ? iconSizeContainerMap[currentSocialPreset]
                    : iconSizeContainerMap.normal
                }
                iconSize={
                  isCosmoCard
                    ? iconSizeMap[currentSocialPreset]
                    : iconSizeMap.normal
                }
              />
            ) : (
              <SocialLinkButton
                containerSize={
                  isCosmoCard
                    ? iconSizeContainerMap[currentSocialPreset]
                    : iconSizeContainerMap.normal
                }
                iconSize={
                  isCosmoCard
                    ? iconSizeMap[currentSocialPreset]
                    : iconSizeMap.normal
                }
                variant={
                  currentCardStylePreset === "type4" ? "cupsey" : "primary"
                }
                size="sm"
                href={youtube ?? ""}
                icon="youtube-white"
                label="YouTube"
              />
            )}
          </>
        )}

        {Boolean(instagram) && (
          <>
            {instagram?.includes("instagram.com/p/") ||
            instagram?.includes("instagram.com/reel/") ? (
              <InstagramPopover
                href={instagram}
                containerSize={
                  isCosmoCard
                    ? iconSizeContainerMap[currentSocialPreset]
                    : iconSizeContainerMap.normal
                }
                iconSize={
                  isCosmoCard
                    ? iconSizeMap[currentSocialPreset]
                    : iconSizeMap.normal
                }
              />
            ) : (
              <SocialLinkButton
                containerSize={
                  isCosmoCard
                    ? iconSizeContainerMap[currentSocialPreset]
                    : iconSizeContainerMap.normal
                }
                iconSize={
                  isCosmoCard
                    ? iconSizeMap[currentSocialPreset]
                    : iconSizeMap.normal
                }
                variant={
                  currentCardStylePreset === "type4" ? "cupsey" : "primary"
                }
                size="sm"
                href={instagram ?? ""}
                icon={
                  currentCardStylePreset === "type4"
                    ? "instagram-cupsey"
                    : "instagram-white"
                }
                label="Instagram"
              />
            )}
          </>
        )}

        {Boolean(tiktok) && (
          <>
            {tiktok?.includes("video") ||
            tiktok?.includes("vm.tiktok.com") ||
            tiktok?.includes("photo") ? (
              <TiktokHoverPopover
                variant={
                  currentCardStylePreset === "type4" ? "cupsey" : "primary"
                }
                url={tiktok as string}
                containerSize={
                  isCosmoCard
                    ? iconSizeContainerMap[currentSocialPreset]
                    : iconSizeContainerMap.normal
                }
                iconSize={
                  isCosmoCard
                    ? iconSizeMap[currentSocialPreset]
                    : iconSizeMap.normal
                }
              />
            ) : (
              <SocialLinkButton
                containerSize={
                  isCosmoCard
                    ? iconSizeContainerMap[currentSocialPreset]
                    : iconSizeContainerMap.normal
                }
                iconSize={
                  isCosmoCard
                    ? iconSizeMap[currentSocialPreset]
                    : iconSizeMap.normal
                }
                variant={
                  currentCardStylePreset === "type4" ? "cupsey" : "primary"
                }
                size="sm"
                href={tiktok ?? ""}
                icon="tiktok-white"
                label="TikTok"
              />
            )}
          </>
        )}

        {mint && (dex === "PumpFun" || dex === "PumpSwap") && (
          <SocialLinkButton
            containerSize={
              isCosmoCard
                ? iconSizeContainerMap[currentSocialPreset]
                : iconSizeContainerMap.normal
            }
            iconSize={
              isCosmoCard
                ? iconSizeMap[currentSocialPreset]
                : iconSizeMap.normal
            }
            variant={currentCardStylePreset === "type4" ? "cupsey" : "primary"}
            size="sm"
            href={`https://pump.fun/${mint}`}
            icon={
              currentCardStylePreset === "type4" ? "pumpfun-cupsey" : "pumpfun"
            }
            label="Pumpfun"
          />
        )}

        {mint && mint.includes("bonk") && (
          <SocialLinkButton
            containerSize={
              isCosmoCard
                ? iconSizeContainerMap[currentSocialPreset]
                : iconSizeContainerMap.normal
            }
            iconSize={
              isCosmoCard
                ? iconSizeMap[currentSocialPreset]
                : iconSizeMap.normal
            }
            variant={currentCardStylePreset === "type4" ? "cupsey" : "primary"}
            size="sm"
            href={`https://letsbonk.fun/token/${mint}`}
            icon="bonk"
            label="Bonk"
          />
        )}
      </div>
    );
  },
);
SocialLinks.displayName = "SocialLinks";
export default SocialLinks;
