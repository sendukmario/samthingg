/* eslint-disable react/no-unescaped-entities */
"use client";

// ######## Libraries 📦 & Hooks 🪝 ########
import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useWhatsNewStore } from "@/stores/use-whats-new.store";
// ######## Components 🧩 ########
import dynamic from "next/dynamic";
import Preloader from "@/components/customs/Preloader";
import NoScrollLayout from "../layouts/NoScrollLayout";
import PageHeading from "./headings/PageHeading";
import BlacklistedModal from "./modals/BlacklistedModal";
import CustomCosmoCardView from "./CustomCosmoCardView";
import CosmoBuySettings from "./CosmoBuySettings";
import Separator from "./Separator";
import CosmoListTabSection from "./sections/CosmoListTabSection";
import { cn } from "@/libraries/utils";
import { usePopupStore } from "@/stores/use-popup-state.store";
import { useCustomizeSettingsStore } from "@/stores/setting/use-customize-settings.store";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import CosmoHideToken from "./CosmoHideToken";

interface CosmoClientProps {
  initialIsNewUser: boolean;
}

const CosmoClient = ({ initialIsNewUser }: CosmoClientProps) => {
  const customizedSettingPresets = useCustomizeSettingsStore(
    (state) => state.presets,
  );
  const customizedSettingActivePreset = useCustomizeSettingsStore(
    (state) => state.activePreset,
  );

  const currentTheme = useMemo(
    () =>
      customizedSettingPresets[customizedSettingActivePreset].themeSetting ||
      "original",
    [customizedSettingPresets, customizedSettingActivePreset],
  );
  const [isPageLoading, setIsPageLoading] = useState<boolean>(true);
  const [isInitialFetchFinished] = useState<boolean>(true);

  useEffect(() => {
    setIsPageLoading(false);
  }, [isInitialFetchFinished]);

  const remainingScreenWidth = usePopupStore(
    (state) => state.remainingScreenWidth,
  );

  return (
    <>
      <NoScrollLayout>
        <div
          className={cn(
            "flex w-full flex-col justify-between gap-y-2 px-4 pb-4 pt-4 lg:px-0 xl:flex-row xl:gap-y-4",
            currentTheme === "cupsey" && "xl:flex-col",
            currentTheme !== "cupsey" &&
              (remainingScreenWidth >= 1314.9 || isPageLoading)
              ? "xl:flex-row"
              : "xl:flex-col",
            currentTheme === "cupsey" && "gap-x-2 pb-2 pt-2 xl:gap-y-2",
          )}
        >
          <div
            className={cn(
              "flex items-center gap-x-2",
              currentTheme === "cupsey" && "items-end pb-2",
            )}
          >
            <PageHeading
              title="The Cosmo"
              description="Real-time feed of tokens throughout their lifespan."
              line={currentTheme === "cupsey" ? 2 : 1}
            />
            {currentTheme !== "cupsey" && <BlacklistedModal />}
          </div>

          <div
            className={cn(
              "flex items-center gap-x-2",
              currentTheme === "cupsey" && "w-full flex-row-reverse",
            )}
          >
            {currentTheme === "cupsey" && <BlacklistedModal />}
            <CosmoHideToken />
            <CustomCosmoCardView />
            <CosmoBuySettings />
          </div>
        </div>

        <Separator className="hidden bg-secondary xl:block" />

        <CosmoListTabSection />
      </NoScrollLayout>
      {/* {initialIsNewUser && (
        <Preloader vanillaCSSAnimation vanillaLoadingState={isPageLoading} />
      )} */}
    </>
  );
};

export default React.memo(CosmoClient);
