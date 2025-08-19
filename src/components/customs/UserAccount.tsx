"use client";

// ######## Libraries 📦 & Hooks 🪝 ########
import React, { useState, useRef, useEffect } from "react";
import { useUserInfoStore } from "@/stores/user/use-user-info.store";
import cookies from "js-cookie";
import { usePnlSettings } from "@/stores/use-pnl-settings.store";

// ######## Components 🧩 ########
import Image from "next/image";
import BaseButton from "@/components/customs/buttons/BaseButton";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import Link from "next/link";

// ######## Utils & Helpers 🤝 ########
import { cn } from "@/libraries/utils";
import { useCustomizeTheme } from "@/hooks/use-customize-theme";
import { useSettingStore } from "@/stores/footer/use-setting.store";
import { useCustomizeSettingsStore } from "@/stores/setting/use-customize-settings.store";
import { useAPIEndpointBasedOnRegionStore } from "@/stores/setting/use-api-endpoint-based-on-region.store";
import useAuth from "@/hooks/use-auth";

const UserAccount = () => {
  const theme = useCustomizeTheme();
  const { userName, profilePicture } = usePnlSettings();
  const [openMenuPopover, setOpenMenuPopover] = useState<boolean>(false);
  const { logOut } = useAuth();

  const { isOpen: isOpenSettings, setIsOpen: setIsOpenSettings } =
    useSettingStore();

  const [isOpenRegion, setIsOpenRegion] = useState(false);

  const region = useAPIEndpointBasedOnRegionStore(
    (state) => state.selectedRegion,
  );
  const setRegion = useAPIEndpointBasedOnRegionStore(
    (state) => state.setRegion,
  );

  const handleRegionChange = (newRegion: "EU" | "US" | "ASIA") => {
    /* console.log("REGION CHANGED 🌍") */ setRegion(newRegion);
    cookies.set("_api_region", newRegion);

    window.location.reload();
  };

  const customizedSettingPresets = useCustomizeSettingsStore(
    (state) => state.presets,
  );
  const customizedSettingActivePreset = useCustomizeSettingsStore(
    (state) => state.activePreset,
  );
  const currentThemeStyle =
    customizedSettingPresets[customizedSettingActivePreset].themeSetting ||
    "original";

  return (
    <Popover open={openMenuPopover} onOpenChange={setOpenMenuPopover}>
      <PopoverTrigger asChild>
        <BaseButton
          variant="gray"
          className="my-account hidden h-8 gap-x-2 p-1 xl:flex"
        >
          <div className="relative aspect-square h-6 w-6 flex-shrink-0">
            {profilePicture ? (
              <Image
                src={profilePicture}
                alt="User Profile Picture"
                fill
                quality={100}
                className="rounded-full object-contain"
              />
            ) : (
              <Image
                src="/icons/user-circle.png"
                alt="User Circle Icon"
                fill
                quality={100}
                className="object-contain"
              />
            )}
          </div>
          <span className="hidden text-nowrap font-geistSemiBold text-sm font-semibold text-fontColorPrimary 2xl:inline-block">
            {userName ? userName : "My Account"}
          </span>
          <div className="relative aspect-square h-6 w-6">
            <Image
              src="/icons/white-dropdown-arrow.png"
              alt="White Dropdown Arrow Icon"
              fill
              quality={100}
              className={cn(
                "object-contain duration-300",
                openMenuPopover ? "rotate-180" : "rotate-0",
              )}
            />
          </div>
        </BaseButton>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={12}
        className="gb__white__popover w-[240px] rounded-[8px] border border-border p-0 shadow-[0_0_20px_0_#000000]"
        style={theme.background2}
      >
        <div className="flex w-full flex-col gap-y-1.5 p-2">
          <Link
            href="/wallets"
            onClick={() => setOpenMenuPopover(false)}
            prefetch
            className="group flex h-[40px] w-full items-center gap-x-2 rounded-[8px] bg-secondary px-4 py-3 transition-all duration-300 ease-out hover:bg-white/10"
          >
            <div className="relative aspect-square h-4 w-4 flex-shrink-0">
              <Image
                src="/icons/profile/wallet.png"
                alt="Wallet Icon"
                fill
                quality={100}
                className="object-contain duration-300 group-hover:scale-125"
              />
            </div>
            <span className="inline-block text-nowrap font-geistSemiBold text-sm text-fontColorPrimary">
              Wallet Manager
            </span>
          </Link>

          <Link
            href="/verify-2fa"
            onClick={() => setOpenMenuPopover(false)}
            prefetch
            className="group flex h-[40px] w-full items-center gap-x-2 rounded-[8px] bg-white/[4%] px-4 py-3 transition-all duration-300 ease-out hover:bg-white/10"
          >
            <div className="relative aspect-square h-4 w-4 flex-shrink-0">
              <Image
                src="/icons/profile/two-factor-authentication.png"
                alt="2FA Icon"
                fill
                quality={100}
                className="object-contain duration-300 group-hover:scale-125"
              />
            </div>
            <span className="inline-block text-nowrap font-geistSemiBold text-sm text-fontColorPrimary">
              2FA
            </span>
          </Link>

          <Link
            href="https://documentation.nova.trade/"
            onClick={() => setOpenMenuPopover(false)}
            target="_blank"
            className="group flex h-[40px] w-full items-center gap-x-2 rounded-[8px] bg-white/[4%] px-4 py-3 transition-all duration-300 ease-out hover:bg-white/10"
          >
            <div className="relative aspect-square h-4 w-4 flex-shrink-0">
              <Image
                src="/icons/profile/documentation.png"
                alt="Documentation Icon"
                fill
                quality={100}
                className="object-contain duration-300 group-hover:scale-125"
              />
            </div>
            <span className="inline-block text-nowrap font-geistSemiBold text-sm text-fontColorPrimary">
              Documentation
            </span>
          </Link>

          {currentThemeStyle === "cupsey" && (
            <>
              <button
                onClick={() => setIsOpenSettings(!isOpenSettings)}
                className="group flex h-[40px] w-full items-center gap-x-2 rounded-[8px] bg-white/[4%] py-3 pl-[18px] pr-4 transition-all duration-300 ease-out hover:bg-white/10"
              >
                <div className="relative aspect-square h-4 w-4 flex-shrink-0">
                  <Image
                    src="/icons/gear-cupsey.svg"
                    alt="Logout Icon"
                    fill
                    quality={100}
                    className="object-contain duration-300 group-hover:scale-125"
                  />
                </div>
                <span className="inline-block text-nowrap font-geistSemiBold text-sm text-fontColorPrimary">
                  Settings
                </span>
              </button>
              <button
                onClick={() => setIsOpenRegion((prev) => !prev)}
                className="group flex h-[40px] w-full items-center gap-x-2 rounded-[8px] bg-white/[4%] py-3 pl-[18px] pr-4 transition-all duration-300 ease-out hover:bg-white/10"
              >
                <div className="relative aspect-square h-4 w-4 flex-shrink-0">
                  <Image
                    src={
                      region === "US"
                        ? "/icons/globe-purple.svg"
                        : "/icons/globe.svg"
                    }
                    alt="Globe"
                    fill
                    quality={100}
                    className="object-contain duration-300 group-hover:scale-125"
                  />
                </div>
                <span className="inline-block text-nowrap font-geistSemiBold text-sm text-fontColorPrimary">
                  <span>{region === "ASIA" ? "Asia" : region}</span>
                </span>
              </button>
              <div
                className={cn(
                  "-mt-1 flex h-0 w-full flex-col items-start gap-y-1.5 pl-4 transition-all duration-200 ease-out",
                  isOpenRegion ? "h-[6.65rem]" : "h-0 overflow-hidden",
                )}
              >
                <button
                  onClick={() => handleRegionChange("US")}
                  className="group mt-1 flex h-[30px] w-full items-center gap-x-2 rounded-[8px] bg-white/[4%] py-3 pl-[18px] pr-4 transition-all duration-300 ease-out hover:bg-white/10"
                >
                  <div className="flex items-center gap-1">
                    <Image
                      src={
                        region === "US"
                          ? "/icons/globe-purple.svg"
                          : "/icons/globe.svg"
                      }
                      alt="Globe"
                      width={16}
                      height={16}
                      draggable="false"
                      quality={100}
                      className={cn(
                        "object-contain",
                        region !== "US" && "grayscale",
                      )}
                    />
                    <span>USA</span>
                  </div>
                </button>
                <button
                  onClick={() => handleRegionChange("EU")}
                  className="group flex h-[30px] w-full items-center gap-x-2 rounded-[8px] bg-white/[4%] py-3 pl-[18px] pr-4 transition-all duration-300 ease-out hover:bg-white/10"
                >
                  <div className="flex items-center gap-1">
                    <Image
                      src={
                        region === "EU"
                          ? "/icons/globe-purple.svg"
                          : "/icons/globe.svg"
                      }
                      alt="Globe"
                      width={16}
                      height={16}
                      draggable="false"
                      quality={100}
                      className={cn(
                        "object-contain",
                        region !== "EU" && "grayscale",
                      )}
                    />
                    <span>EU</span>
                  </div>
                </button>
                <button
                  onClick={() => handleRegionChange("ASIA")}
                  className="group flex h-[30px] w-full items-center gap-x-2 rounded-[8px] bg-white/[4%] py-3 pl-[18px] pr-4 transition-all duration-300 ease-out hover:bg-white/10"
                >
                  <div className="flex items-center gap-1">
                    <Image
                      src={
                        region === "ASIA"
                          ? "/icons/globe-purple.svg"
                          : "/icons/globe.svg"
                      }
                      alt="Globe"
                      width={16}
                      height={16}
                      draggable="false"
                      quality={100}
                      className={cn(
                        "object-contain",
                        region !== "ASIA" && "grayscale",
                      )}
                    />
                    <span>Asia </span>
                  </div>
                </button>
              </div>
            </>
          )}

          <button
            onClick={logOut}
            className="group flex h-[40px] w-full items-center gap-x-2 rounded-[8px] bg-white/[4%] py-3 pl-[18px] pr-4 transition-all duration-300 ease-out hover:bg-white/10"
          >
            <div className="relative aspect-square h-4 w-4 flex-shrink-0">
              <Image
                src="/icons/profile/logout.png"
                alt="Logout Icon"
                fill
                quality={100}
                className="object-contain duration-300 group-hover:scale-125"
              />
            </div>
            <span className="inline-block text-nowrap font-geistSemiBold text-sm text-destructive">
              Logout
            </span>
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default UserAccount;
