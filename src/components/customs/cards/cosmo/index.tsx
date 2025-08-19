"use client";

// ######## Libraries 📦 & Hooks 🪝 ########
import React, {
  useCallback,
  useMemo,
  useRef,
  memo,
  useEffect,
  useState,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { usePopupStore } from "@/stores/use-popup-state.store";
import { useCustomizeSettingsStore } from "@/stores/setting/use-customize-settings.store";
import { useTrackUserEvent } from "@/hooks/use-track-event";
import { useTrackUserEventStore } from "@/stores/use-track-user-event.store";
// ######## APIs 🛜 ########
import { prefetchCandles, prefetchChart } from "@/apis/rest/charts";
// ######## Components 🧩 ########

// ######## Utils & Helpers 🤝 ########
import { cn } from "@/libraries/utils";
// ######## Types 🗨️ ########
import { CosmoDataMessageType } from "@/types/ws-general";
// import { useRouter } from "nextjs-toploader/app";
import CosmoCardType1 from "./CosmoCardType1";
import CosmoCardType2 from "./CosmoCardType2";
import CosmoCardType3 from "./CosmoCardType3";
import CosmoCardType4 from "./CosmoCardType4";
import { useCosmoStyle } from "@/stores/cosmo/use-cosmo-style.store";
import { getHistoricalFromInterval } from "@/components/TVChartContainer/NovaTradingView";
import { useTradingViewPreferencesStore } from "@/stores/token/use-tradingview-preferences.store";
import { useServerTimeStore } from "@/stores/use-server-time.store";
import { ModuleType } from "@/utils/turnkey/serverAuth";
import { useRouter } from "next/navigation";
import { debounce } from "lodash";

/**
 * Base props for all CosmoCard variants
 */
export interface CosmoCardBaseProps {
  data: CosmoDataMessageType;
  amount: number;
  column: 1 | 2 | 3;
  isFirst?: boolean;
  isEven: boolean;
  module: ModuleType
}

const gradientMap = {
  none: {
    icon: "",
    border: "",
    animation: "",
    count: "0",
  },
  gold: {
    icon: "/icons/coin-gold.svg",
    border: "border border-[#B56C00]",
    animation:
      "linear-gradient(95.58deg, rgba(181, 108, 0, 0) 26.88%, rgba(181, 108, 0, 0.05) 32.49%, rgba(181, 108, 0, 0.12) 38.1%, rgba(181, 108, 0, 0.15) 45.57%, rgba(181, 108, 0, 0.122212) 53.05%, rgba(181, 108, 0, 0.05) 58.66%, rgba(181, 108, 0, 0) 64.27%)",
    count: "8x",
  },
  silver: {
    icon: "/icons/coin-silver.svg",
    border: "border border-[#646464]",
    animation:
      "linear-gradient(95.58deg, rgba(100, 100, 100, 0) 26.88%, rgba(100, 100, 100, 0.05) 32.49%, rgba(100, 100, 100, 0.12) 38.1%, rgba(100, 100, 100, 0.15) 45.57%, rgba(100, 100, 100, 0.122212) 53.05%, rgba(100, 100, 100, 0.05) 58.66%, rgba(100, 100, 100, 0) 64.27%)",
    count: "3x",
  },
  bronze: {
    icon: "/icons/coin-bronze.svg",
    border: "border border-[#642000]",
    animation:
      "linear-gradient(95.58deg, rgba(100, 32, 0, 0) 26.88%, rgba(100, 32, 0, 0.05) 32.49%, rgba(100, 32, 0, 0.12) 38.1%, rgba(100, 32, 0, 0.15) 45.57%, rgba(100, 32, 0, 0.122212) 53.05%, rgba(100, 32, 0, 0.05) 58.66%, rgba(100, 32, 0, 0) 64.27%)",
    count: "1-2x",
  },
};

const CosmoCard = memo(
  ({ data, column, isFirst, amount, isEven, module }: CosmoCardBaseProps) => {
    const router = useRouter();
    const queryClientNormal = useQueryClient();

    const cardRef = useRef<HTMLDivElement>(null);
    const cardWidth = useCosmoStyle((s) => s.currentCardWidth);
    const setGlobalCardWidth = useCosmoStyle((s) => s.setCurrentCardWidth);
    const customizedSettingPresets = useCustomizeSettingsStore(
      (state) => state.presets,
    );
    const customizedSettingActivePreset = useCustomizeSettingsStore(
      (state) => state.activePreset,
    );

    const currentAvatarPreset =
      customizedSettingPresets[customizedSettingActivePreset].avatarSetting ||
      "normal";
    const currentAvatarBorderRadiusPreset =
      customizedSettingPresets[customizedSettingActivePreset]
        .avatarBorderRadiusSetting || "rounded";
    const currentFontPreset =
      customizedSettingPresets[customizedSettingActivePreset].fontSetting ||
      "normal";
    const currentSocialPreset =
      customizedSettingPresets[customizedSettingActivePreset].socialSetting ||
      "normal";
    const currentButtonPreset =
      customizedSettingPresets[customizedSettingActivePreset].buttonSetting ||
      "normal";
    const currentFontSizePreset =
      customizedSettingPresets[customizedSettingActivePreset]
        .tokenFontSizeSetting || "normal";
    const currentTheme = useMemo(
      () =>
        customizedSettingPresets[customizedSettingActivePreset].themeSetting ||
        "original",
      [customizedSettingPresets, customizedSettingActivePreset],
    );

    const currentCardStyle =
      customizedSettingPresets[customizedSettingActivePreset]
        .cosmoCardStyleSetting;

    const tokenUrlRef = useRef<string>("#");

    useEffect(() => {
      if (data?.mint) {
        const params = new URLSearchParams({
          symbol: data?.symbol || "",
          name: data?.name || "",
          // image: data?.image || "",
          // market_cap_usd: String(data?.market_cap_usd || ""),
          // liquidity_usd: String(data?.liquidity_usd || ""),
          dex: data?.dex || "",
        });
        tokenUrlRef.current = `/token/${data.mint}?${params.toString()}`;
      }

      return () => {
        tokenUrlRef.current = "#"; // Clear reference on unmount
      };
    }, [
      data?.mint,
      data?.symbol,
      data?.name,
      data?.image,
      data?.market_cap_usd,
      data?.liquidity_usd,
      data?.dex,
    ]);

    const getApiResolution = useTradingViewPreferencesStore(
      (state) => state.getApiResolution,
    );

    const getCurrentServerTime = useServerTimeStore(
      (state) => state.getCurrentServerTime,
    );

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
        content: cn("w-full h-full gap-y-3 grid px-3"),
      }),
      [currentSocialPreset],
    );

    const setIsExternal = useTrackUserEventStore(
      (state) => state.setIsExternal,
    );
    const { mutate: trackUserEvent } = useTrackUserEvent("cosmo");

    const handleCardClick = useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!data?.mint) return;

        if (e.metaKey || e.ctrlKey) {
          window.open(tokenUrlRef.current, "_blank");
          return;
        }

        setIsExternal(false);
        trackUserEvent({ mint: data?.mint });

        const interval = getApiResolution();
        const from: number = getHistoricalFromInterval[interval];
        prefetchChart(queryClientNormal, data.mint);
        prefetchCandles(queryClientNormal, {
          mint: data.mint,
          interval,
          from: getCurrentServerTime() - from,
          to: getCurrentServerTime() + 120,
          currency: (
            (localStorage.getItem("chart_currency") as string) || "SOL"
          ).toLowerCase() as "sol" | "usd",
          initial: true,
          countBack: 300,
        });

        // Prefetch the page route
        router.prefetch(tokenUrlRef.current);
        router.push(tokenUrlRef.current);
      },
      [router, queryClientNormal, data?.mint],
    );

    const handleCardContextMenu = useCallback((e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsExternal(false);
      trackUserEvent({ mint: data?.mint });
      window.open(tokenUrlRef.current, "_blank");
    }, []);

    const remainingScreenWidth = usePopupStore(
      (state) => state.remainingScreenWidth,
    );

    useEffect(() => {
      const updateCardWidth = () => {
        if (cardRef.current) {
          if (isFirst && column === 1) {
            setGlobalCardWidth(cardRef.current.offsetWidth);
          }
        }
      };

      updateCardWidth();
    }, [
      remainingScreenWidth,
      setGlobalCardWidth,
      customizedSettingPresets[customizedSettingActivePreset],
    ]);

    let gradient: "gold" | "silver" | "bronze" | "none" = "none";
    const totalCount = data.discord_details?.total_count ?? 0;
    if (totalCount < 1) {
      gradient = "none";
    } else if (totalCount >= 8) {
      gradient = "gold";
    } else if (totalCount >= 3) {
      gradient = "silver";
    } else if (totalCount >= 1) {
      gradient = "bronze";
    }

    const { border } = gradientMap[gradient];

    const renderCosmoCard = () => {
      switch (currentCardStyle) {
        case "type1":
          return (
            <CosmoCardType1
              module={module}
              data={data}
              amount={amount}
              column={column}
              isFirst={isFirst}
              currentTheme={currentTheme}
              currentAvatarPreset={currentAvatarPreset}
              currentAvatarBorderRadiusPreset={currentAvatarBorderRadiusPreset}
              currentFontPreset={currentFontPreset}
              currentSocialPreset={currentSocialPreset}
              currentButtonPreset={currentButtonPreset}
              currentCardStyle={currentCardStyle}
              onClick={handleCardClick}
              isEven={isEven}
              discordDetails={gradientMap[gradient]}
            />
          );

        case "type2":
          return (
            <CosmoCardType2
              module={module}
              data={data}
              amount={amount}
              column={column}
              isFirst={isFirst}
              currentAvatarPreset={currentAvatarPreset}
              currentAvatarBorderRadiusPreset={currentAvatarBorderRadiusPreset}
              currentFontPreset={currentFontPreset}
              currentSocialPreset={currentSocialPreset}
              currentButtonPreset={currentButtonPreset}
              currentCardStyle={currentCardStyle}
              onClick={handleCardClick}
              isEven={isEven}
              discordDetails={gradientMap[gradient]}
            />
          );

        case "type3":
          return (
            <CosmoCardType3
              module={module}
              data={data}
              amount={amount}
              column={column}
              isFirst={isFirst}
              currentAvatarPreset={currentAvatarPreset}
              currentAvatarBorderRadiusPreset={currentAvatarBorderRadiusPreset}
              currentFontPreset={currentFontPreset}
              currentSocialPreset={currentSocialPreset}
              currentButtonPreset={currentButtonPreset}
              currentFontSizePreset={currentFontSizePreset}
              currentCardStyle={currentCardStyle}
              onClick={handleCardClick}
              isEven={isEven}
              discordDetails={gradientMap[gradient]}
            />
          );

        case "type4":
          return (
            <CosmoCardType4
              module={module}
              data={data}
              amount={amount}
              column={column}
              isFirst={isFirst}
              currentAvatarPreset={currentAvatarPreset}
              currentAvatarBorderRadiusPreset={currentAvatarBorderRadiusPreset}
              currentFontPreset={currentFontPreset}
              currentSocialPreset={currentSocialPreset}
              currentButtonPreset={currentButtonPreset}
              currentCardStyle={currentCardStyle}
              onClick={handleCardClick}
              isEven={isEven}
              discordDetails={gradientMap[gradient]}
            />
          );

        default:
          return (
            <CosmoCardType1
              module={module}
              data={data}
              amount={amount}
              column={column}
              isFirst={isFirst}
              currentTheme={currentTheme}
              currentAvatarPreset={currentAvatarPreset}
              currentAvatarBorderRadiusPreset={currentAvatarBorderRadiusPreset}
              currentFontPreset={currentFontPreset}
              currentSocialPreset={currentSocialPreset}
              currentButtonPreset={currentButtonPreset}
              currentCardStyle={currentCardStyle}
              onClick={handleCardClick}
              isEven={isEven}
              discordDetails={gradientMap[gradient]}
            />
          );
      }
    };

    return (
      <div
        ref={isFirst ? cardRef : undefined}
        className={cn(
          cardStyles.wrapper,
          border,
          "group relative flex h-full flex-col items-center transition-[height] duration-300 ease-in-out",
        )}
        onClick={handleCardClick}
        onMouseDown={(e) => {
          if (e.button === 1) {
            e.preventDefault();
            handleCardContextMenu(e);
          }
        }}
        onContextMenu={handleCardContextMenu}
      >
        {renderCosmoCard()}
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Ultra-granular comparison for better memoization
    if (
      prevProps.column !== nextProps.column ||
      prevProps.isFirst !== nextProps.isFirst ||
      prevProps.amount !== nextProps.amount
    ) {
      return false;
    }

    const prevData = prevProps.data;
    const nextData = nextProps.data;

    // Only compare fields that affect rendering
    return (
      prevData.mint === nextData.mint &&
      prevData.last_update === nextData.last_update &&
      prevProps.amount === nextProps.amount
    );
  },
);
CosmoCard.displayName = "CosmoCard";
export default CosmoCard;
