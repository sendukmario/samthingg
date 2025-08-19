"use client";

import React from "react";
import { CosmoFilterSubscribeMessageType } from "@/types/ws-general";
import { cn } from "@/libraries/utils";
import { useCustomizeSettingsStore } from "@/stores/setting/use-customize-settings.store";
import dynamic from "next/dynamic";
import CosmoListSectionLoading from "../../loadings/CosmoListSectionLoading";

const NewlyCreatedList = dynamic(
  () => import("@/components/customs/lists/NewlyCreatedList"),
  {
    loading: () => <CosmoListSectionLoading column={1} variant="desktop" />,
    ssr: false,
  },
);

const AboutToGraduateList = dynamic(
  () => import("@/components/customs/lists/AboutToGraduateList"),
  {
    loading: () => <CosmoListSectionLoading column={2} variant="desktop" />,
    ssr: false,
  },
);

const GraduatedList = dynamic(
  () => import("@/components/customs/lists/GraduatedList"),
  {
    loading: () => <CosmoListSectionLoading column={3} variant="desktop" />,
    ssr: false,
  },
);

export interface CosmoProps {
  isLoading: boolean;
  trackedWalletsOfToken: Record<string, string[]>;
  handleSendFilterMessage: (
    category: "created" | "aboutToGraduate" | "graduated",
    filterObject: CosmoFilterSubscribeMessageType,
  ) => void;
  isBoarding?: boolean;
}
const CosmoDesktop = ({
  isLoading,
  trackedWalletsOfToken,
  handleSendFilterMessage,
  isBoarding,
}: CosmoProps) => {
  // const theme = useCustomizeTheme();
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
    <div
      className={cn(
        "relative h-full w-full flex-grow grid-cols-3 gap-x-3 xl:mb-12 xl:grid",
        currentThemeStyle === "cupsey" && "xl:mb-0",
        isBoarding && "pointer-events-none w-[68.8%]",
      )}
      // style={theme.background}
    >
      <NewlyCreatedList
        sizeVariant="desktop"
        isLoading={isLoading}
        trackedWalletsOfToken={trackedWalletsOfToken}
        handleSendFilterMessage={handleSendFilterMessage!}
        isBoarding={isBoarding}
      />
      <AboutToGraduateList
        sizeVariant="desktop"
        isLoading={isLoading}
        trackedWalletsOfToken={trackedWalletsOfToken}
        handleSendFilterMessage={handleSendFilterMessage!}
      />
      {isBoarding ? (
        <div
          className={cn("relative col-span-1 flex w-full flex-grow flex-col")}
        ></div>
      ) : (
        <GraduatedList
          sizeVariant="desktop"
          isLoading={isLoading}
          trackedWalletsOfToken={trackedWalletsOfToken}
          handleSendFilterMessage={handleSendFilterMessage!}
        />
      )}
    </div>
  );
};

export default React.memo(CosmoDesktop);
