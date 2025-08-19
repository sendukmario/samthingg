"use client";

import React, { useState, useEffect, useMemo } from "react";
import { usePopupStore, WindowName } from "@/stores/use-popup-state.store";
import { cn } from "@/libraries/utils";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { PopupWindowHighlight } from "@/components/customs/PopupWindow";
import { useCustomizeTheme } from "@/hooks/use-customize-theme";
import { useCustomizeSettingsStore } from "@/stores/setting/use-customize-settings.store";
import { useAnnouncementStore } from "@/stores/use-announcement.store";
import CupseySnap from "../customs/CupseySnap";
import { useWindowSizeStore } from "@/stores/use-window-size.store";
import { useDeviceAndBrowserForScrollbarStore } from "@/stores/use-device-and-browser-for-scrollbar-state.store";
const TwitterPopup = dynamic(
  () => import("@/components/customs/TwitterPopup"),
  {
    ssr: false,
  },
);
const WalletTrackerPopup = dynamic(
  () => import("@/components/customs/WalletTrackerPopup"),
  {
    ssr: false,
  },
);

const mainLayout: Layout = {
  name: "main",
  component: "",
};

const twitterMonitorLayout: Layout = {
  name: "twitter",
  component: <TwitterPopup key="twitter" />,
};

const walletTrackerLayout: Layout = {
  name: "wallet_tracker",
  component: <WalletTrackerPopup key="wallet_tracker" />,
};

const layout = [mainLayout, twitterMonitorLayout, walletTrackerLayout];

interface Props {
  children: React.ReactNode;
  scrollable?: boolean;
}

interface Layout {
  name: "main" | WindowName;
  component: React.ReactNode;
}

const FOOTER_HEIGHT = 42;
const HEADER_HEIGHT = 48;
const ANNOUNCEMENT_HEIGHT = 40;
const HOLDINGS_AND_WATCHLIST_HEIGHT = 40;
const SCROLLED_PAGES = ["referral", "token"];

export default function GlobalSnapLayout({ children }: Props) {
  const pathname = usePathname();
  const scrollable = useMemo(() => {
    return SCROLLED_PAGES.some((page) => pathname.includes(page));
  }, [pathname]);
  const {
    setPopupState,
    popups,
    currentSnappedPopup,
    prevSnappedLeft,
    prevSnappedRight,
  } = usePopupStore();

  const theme = useCustomizeTheme();
  const customizedSettingPresets = useCustomizeSettingsStore(
    (state) => state.presets,
  );
  const customizedSettingActivePreset = useCustomizeSettingsStore(
    (state) => state.activePreset,
  );

  const currentCosmoType = useMemo(
    () =>
      customizedSettingPresets[customizedSettingActivePreset]
        .cosmoCardStyleSetting || "type1",
    [customizedSettingPresets, customizedSettingActivePreset],
  );

  const sortByPriority = <T extends { name: string }>(
    originalArray: T[],
    priorityArray: string[],
  ): T[] => {
    // Create a Map to store priority indices
    const priorityMap = new Map(
      (priorityArray || [])?.map((item, index) => [item, index]),
    );

    // Sort the original array by name property
    return [...originalArray].sort((a, b) => {
      const priorityA = priorityMap.has(a.name)
        ? priorityMap.get(a.name)!
        : Infinity;
      const priorityB = priorityMap.has(b.name)
        ? priorityMap.get(b.name)!
        : Infinity;
      return priorityA - priorityB;
    });
  };

  const width = useWindowSizeStore((state) => state.width);

  const isOSEnvirontmentAlreadySet = useDeviceAndBrowserForScrollbarStore(
    (state) => state.isOSEnvirontmentAlreadySet,
  );
  const setIsAppleEnvirontment = useDeviceAndBrowserForScrollbarStore(
    (state) => state.setIsAppleEnvirontment,
  );
  const isBrowserAlreadySet = useDeviceAndBrowserForScrollbarStore(
    (state) => state.isBrowserAlreadySet,
  );
  const setIsBrowserWithoutScrollbar = useDeviceAndBrowserForScrollbarStore(
    (state) => state.setIsBrowserWithoutScrollbar,
  );

  useEffect(() => {
    if (!isOSEnvirontmentAlreadySet) {
      if (/macintosh|mac os x|iPad|iPhone|iPod/i.test(navigator.userAgent)) {
        setIsAppleEnvirontment(true);
      } else {
        setIsAppleEnvirontment(false);
      }
    }

    if (!isBrowserAlreadySet) {
      const ua = navigator.userAgent?.toLowerCase() || "";

      const isFirefox = ua.includes("firefox");
      const isEdge = ua.includes("edg");

      const isBrowserWithoutScrollbar = isFirefox || isEdge;

      setIsBrowserWithoutScrollbar(isBrowserWithoutScrollbar);
    }

    const handleError = (event: ErrorEvent) => {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      // alert(`Error 🔴: ${event.error.message}`);
      return true;
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      // alert(
      //   `Promise error 🔴: ${event.reason?.message || String(event.reason)}`,
      // );
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);

  // ==== THEME ====
  const currentThemeStyle =
    customizedSettingPresets[customizedSettingActivePreset].themeSetting ||
    "original";

  const isAnnouncementExist = useAnnouncementStore(
    (state) => state.isAnnouncementExist,
  );

  const height = useWindowSizeStore((state) => state.height);
  const remainingScreenWidth = usePopupStore(
    (state) => state.remainingScreenWidth,
  );

  const [mainComponentHeight, setMainComponentHeight] = useState("100%");
  useEffect(() => {
    if (typeof window === "undefined") return;

    let heightValue = window.innerHeight;

    if (pathname.includes("token") || pathname.includes("earn")) {
      if (currentThemeStyle !== "cupsey") {
        heightValue -=
          HEADER_HEIGHT + FOOTER_HEIGHT + HOLDINGS_AND_WATCHLIST_HEIGHT;
      } else {
        heightValue -= HEADER_HEIGHT + HOLDINGS_AND_WATCHLIST_HEIGHT;
      }

      if (isAnnouncementExist) {
        heightValue -= ANNOUNCEMENT_HEIGHT;
      }

      setMainComponentHeight(`${heightValue}px`);
    } else {
      setMainComponentHeight("100%");
    }
  }, [
    pathname,
    currentThemeStyle,
    isAnnouncementExist,
    height,
    remainingScreenWidth,
  ]);

  return (
    <>
      <div
        className={cn(
          "relative flex h-full w-full max-w-full grow flex-col overflow-hidden xl:flex-row",
          scrollable && "h-[calc(100dvh-88.8px)]",
        )}
        style={pathname === "/" ? theme.backgroundCosmo : theme.background}
      >
        {width! > 1280 && currentThemeStyle === "cupsey" && (
          <CupseySnap position="left" />
        )}
        {currentThemeStyle !== "cupsey" &&
          (sortByPriority(layout, currentSnappedPopup.left) || [])?.map(
            ({ name, component }, i) => {
              const popup = (popups || [])?.find((p) => p.name === name);
              if (
                currentSnappedPopup.left.includes(name as WindowName) ||
                (prevSnappedLeft === (name as WindowName) &&
                  popup?.mode === "popup") ||
                (prevSnappedLeft !== (name as WindowName) &&
                  prevSnappedRight !== (name as WindowName) &&
                  popup?.mode === "popup")
              )
                return (
                  <div
                    key={name}
                    id={`${name}-popup-side`}
                    style={{
                      marginLeft:
                        popup?.snappedSide === "left" && popup?.isOpen
                          ? 16
                          : undefined,

                      marginRight:
                        popup?.snappedSide === "right" && popup?.isOpen
                          ? 16
                          : undefined,
                    }}
                  >
                    {component}
                  </div>
                );
            },
          )}

        <PopupWindowHighlight type="left" />
        <div
          id={"main-component"}
          className={cn(
            "flex h-full w-full min-w-0 max-w-[100vw] flex-1 grow flex-col",
            scrollable &&
              "nova-scroller flex-1 overflow-y-auto overflow-x-hidden",
          )}
          style={{
            height: mainComponentHeight,
          }}
          suppressHydrationWarning
        >
          {children}
        </div>
        <PopupWindowHighlight type="right" />
        {currentThemeStyle !== "cupsey" &&
          (sortByPriority(layout, currentSnappedPopup.right) || [])
            ?.reverse()
            ?.map(({ name, component }, i) => {
              const popup = (popups || [])?.find((p) => p.name === name);
              if (
                currentSnappedPopup.right.includes(name as WindowName) ||
                (prevSnappedRight === (name as WindowName) &&
                  popup?.mode === "popup")
              )
                return (
                  <div
                    key={name}
                    id={`${name}-popup-side`}
                    style={{
                      marginLeft:
                        popup?.snappedSide === "left" && popup?.isOpen
                          ? 16
                          : undefined,

                      marginRight:
                        popup?.snappedSide === "right" && popup?.isOpen
                          ? 16
                          : undefined,
                    }}
                  >
                    {component}
                  </div>
                );
            })}
        {width! > 1280 && currentThemeStyle === "cupsey" && (
          <CupseySnap position="right" />
        )}
      </div>
    </>
  );
}
