import {
  CosmoCardStyleSetting,
  CustomizePresetData,
  TokenFontSizeSetting,
} from "@/apis/rest/settings/settings";
import { presetPriority } from "@/components/customs/lists/NewlyCreatedList";
import { useCosmoStyle } from "@/stores/cosmo/use-cosmo-style.store";
import { useCustomCosmoCardView } from "@/stores/setting/use-custom-cosmo-card-view.store";
import { useCustomizeSettingsStore } from "@/stores/setting/use-customize-settings.store";
import { usePopupStore } from "@/stores/use-popup-state.store";
import { useWindowSizeStore } from "@/stores/use-window-size.store";

const getCosmoHeight = ({
  type,
  width,
  remainingScreenWidth,
  customizedSettingPresets,
  customizedSettingActivePreset,
  isSnapOpen,
  cardWidth = 300,
  statsCount,
  customStatHeight,
}: {
  type: CosmoCardStyleSetting;
  width: number;
  remainingScreenWidth: number;
  customizedSettingPresets: Record<
    "preset1" | "preset2" | "preset3",
    CustomizePresetData
  >;
  customizedSettingActivePreset: "preset1" | "preset2" | "preset3";
  isSnapOpen: boolean;
  cardWidth?: number;
  statsCount: {
    statTexts: number;
    statBadges: number;
    total: number;
  };
  customStatHeight: number;
}): number => {
  const currentAvatarPreset =
    customizedSettingPresets[customizedSettingActivePreset].avatarSetting ||
    "normal";
  const currentFontPreset =
    customizedSettingPresets[customizedSettingActivePreset].fontSetting ||
    "normal";
  const currentTokenFontPreset = (customizedSettingPresets[
    customizedSettingActivePreset
  ].tokenFontSizeSetting || "normal") as TokenFontSizeSetting;
  const currentCardStyle =
    customizedSettingPresets[customizedSettingActivePreset]
      .cosmoCardStyleSetting || "type1";
  const currentSocialLinkPreset =
    customizedSettingPresets[customizedSettingActivePreset].socialSetting ||
    "normal";
  const combined = [currentAvatarPreset, currentFontPreset];

  const avatarSetting = presetPriority.find((p) => combined.includes(p));

  const currentButtonPreset =
    customizedSettingPresets[customizedSettingActivePreset].buttonSetting ||
    "normal";

  const isBigMobileRemaining =
    remainingScreenWidth < 810 && remainingScreenWidth >= 550;
  const isSmallMobileRemaining = remainingScreenWidth < 550;

  let height = 100;

  switch (type) {
    // ########## TYPE1️⃣ ##########
    case "type1":
      height += 35;

      if (!["normal", "large"].includes(currentAvatarPreset)) {
        height += 10;
      } else if (cardWidth > 550) height += -10;

      // currentFontPreset
      if (["normal", "large"].includes(currentFontPreset) && cardWidth < 300)
        height += 20;
      if (!["normal", "large"].includes(currentFontPreset)) height += 20;

      if (cardWidth < 485) {
        if (["normal", "large"].includes(currentFontPreset)) height += 10;
        if (!["normal", "large"].includes(currentFontPreset)) height += 20;
      }

      // currentTokenFontPreset & currentSocialLinkPreset
      if (
        !["normal", "large"].includes(currentTokenFontPreset) ||
        !["normal", "large"].includes(currentSocialLinkPreset)
      )
        height += 20;

      // SnapOpen adjustments
      if (currentFontPreset === "normal" || currentFontPreset === "large") {
        if (cardWidth < 270) height += 40;
        if (cardWidth < 225) height += 20;
        if (cardWidth < 380) height += 20;
      } else {
        if (cardWidth < 300) height += 55;
        if (cardWidth < 270) height += 20;
        if (cardWidth < 250) height += 35;
        if (cardWidth < 380) height += 30;
      }

      return height;
    // ########## TYPE2️⃣ ##########
    case "type2":
      height += 20;
      if (customStatHeight < 30) height += -10;

      if (remainingScreenWidth >= 1280) height += 20;

      if (
        !["tripleextralarge", "quadripleextralarge"].includes(
          currentFontPreset,
        ) &&
        cardWidth < 240
      )
        height += 10;

      if (
        ["normal", "large"].includes(currentSocialLinkPreset) &&
        ["normal", "large"].includes(currentFontPreset)
      )
        height += -20;

      if (currentButtonPreset === "doubleextralarge") height += 5;
      if (
        ["tripleextralarge", "quadripleextralarge"].includes(
          currentButtonPreset,
        )
      )
        height += 15;

      if (["extralarge", "doubleextralarge"].includes(currentFontPreset)) {
        if (cardWidth > 540) height += -30;
        height += 20;
        if (cardWidth < 340) height += 40;
        if (currentFontPreset === "extralarge" && cardWidth < 435) height += 10;
        if (currentFontPreset === "doubleextralarge" && cardWidth < 445)
          height += 30;
      } else {
        if (currentFontPreset === "normal" && cardWidth < 375) height += 20;
        if (currentFontPreset === "normal" && cardWidth < 300) height += 20;
        if (currentFontPreset === "large" && cardWidth < 432) height += 20;
        if (currentFontPreset === "large" && cardWidth < 330) height += 20;
        if (cardWidth < 260) height += 10;
      }

      if (currentButtonPreset === "tripleextralarge" && cardWidth < 435)
        height += 20;

      if (
        currentTokenFontPreset === "extralarge" ||
        currentTokenFontPreset === "doubleextralarge"
      )
        height += 10;
      if (
        currentFontPreset === "extralarge" ||
        currentFontPreset === "doubleextralarge"
      )
        height += 10;

      return height;
    // ########## TYPE3️⃣ ##########
    case "type3":
      height += 10;

      // Font size adjustments
      if (!["normal", "large"].includes(currentFontPreset)) {
        height += 25;
        if (cardWidth < 440) height += 10;
        if (currentFontPreset === "doubleextralarge" && cardWidth < 640) height += 20;
      }

      if (["extralarge", "doubleextralarge"].includes(currentFontPreset)) {
        height += 10;
      }

      // Mobile font size adjustments
      if (isSmallMobileRemaining) {
        if (["large"].includes(currentFontPreset)) {
          height += 30;
        } else if (["extralarge"].includes(currentFontPreset)) {
          height += 40;
        }

        // Mobile button size adjustments
        if (
          ["large", "extralarge", "doubleextralarge"].includes(
            currentButtonPreset,
          ) &&
          ["doubleextralarge"].includes(currentFontPreset)
        ) {
          height += 30;
        }
        height += 20;
      }

      // Large button adjustments
      if (["large", "doubleextralarge"].includes(currentButtonPreset)) {
        height += 10;
      }

      if (
        ["tripleextralarge", "quadripleextralarge"].includes(
          currentButtonPreset,
        )
      ) {
        height += 15;
      }

      // SnapOpen adjustments
      if (["extralarge", "doubleextralarge"].includes(currentFontPreset)) {
        // if (cardWidth < 540) height += 25;
        if (cardWidth > 380 && cardWidth < 400) height += 20;
      }

      if (currentFontPreset === "normal" || currentFontPreset === "large") {
        if (cardWidth < 270) height += 40;
        if (cardWidth < 225) height += 20;
      } else {
        if (cardWidth < 300) height += 55;
        if (cardWidth < 270) height += 20;
        if (cardWidth < 250) height += 35;
      }
      if (cardWidth < 380) height += 30;

      return height;
    // ########## TYPE4️⃣ ##########
    case "type4":
      height += 11.5;

      if (cardWidth < 375) height += 10;

      if (!["normal", "large"].includes(currentAvatarPreset)) height += 20;

      if (currentFontPreset === "normal") {
        if (cardWidth < 319) height += 20;
        if (cardWidth <= 280) height += 20;
        if (cardWidth <= 245) height += 40;
      }
      if (currentFontPreset === "large") {
        if (cardWidth < 319) height += 25;
        if (cardWidth <= 280) height += 20;
        if (cardWidth <= 245) height += 40;
      }
      if (currentFontPreset === "extralarge") {
        if (customStatHeight < 30) height += -20;
        if (cardWidth < 575) height += 10;
        if (cardWidth < 500) height += 20;
        if (cardWidth < 415) height += 20;
        if (cardWidth < 319) height += 45;
        if (cardWidth <= 280) height += 20;
        if (cardWidth <= 245) height += 40;
      }
      if (currentFontPreset === "doubleextralarge") {
        if (customStatHeight < 30) height += -40;
        if (customStatHeight < 60) height += -30;
        height += 10;
        if (cardWidth > 490) height += 30;
        if (cardWidth < 500) height += 40;
        if (cardWidth <= 380) height += 20;
        if (cardWidth <= 360) height += 10;
        if (cardWidth <= 265) height += 50;
      }
      if (cardWidth < 435) height += 25;

      if (
        ["tripleextralarge", "quadripleextralarge"].includes(
          currentButtonPreset,
        )
      ) {
        height += 15;
        if (currentFontPreset !== "normal") height += 20;
      }

      if (["normal", "large"].includes(currentButtonPreset)) {
        if (cardWidth < 480) height += 20;
        if (cardWidth < 400) height += 20;
      }

      return height;
    default:
      return 100;
  }
};

export const useCosmoHeight = (
  currentCardStyle: CosmoCardStyleSetting,
): number => {
  const customizedSettingPresets = useCustomizeSettingsStore(
    (state) => state.presets,
  );
  const customizedSettingActivePreset = useCustomizeSettingsStore(
    (state) => state.activePreset,
  );
  const isSnapOpen = usePopupStore((state) =>
    state.popups.some((p) => p.isOpen && p.snappedSide !== "none"),
  );
  const globalCardWidth = useCosmoStyle((s) => s.currentCardWidth);
  const currentCustomStatsHeight = useCosmoStyle(
    (s) => s.currentCustomStatsHeight,
  );
  const getActiveStats = useCustomCosmoCardView((s) => s.getActiveItemsByType);
  const remainingScreenWidth = usePopupStore((s) => s.remainingScreenWidth);
  const width = useWindowSizeStore((s) => s.width);
  const height = getCosmoHeight({
    type: currentCardStyle,
    width: width!,
    remainingScreenWidth,
    customizedSettingPresets,
    customizedSettingActivePreset,
    isSnapOpen,
    cardWidth: globalCardWidth,
    customStatHeight: !(
      currentCustomStatsHeight?.["stat-badge"] &&
      currentCustomStatsHeight?.["stat-text"]
    )
      ? 28
      : currentCustomStatsHeight?.["stat-badge"] >
          currentCustomStatsHeight?.["stat-text"]
        ? currentCustomStatsHeight["stat-badge"]
        : currentCustomStatsHeight["stat-text"],
    statsCount: {
      statTexts: getActiveStats("stat-text").length,
      statBadges: getActiveStats("stat-badge").length,
      total:
        getActiveStats("stat-text").length +
        getActiveStats("stat-badge").length,
    },
  });
  return height;
};
