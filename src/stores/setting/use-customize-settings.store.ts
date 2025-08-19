import { CustomizePresetData } from "@/apis/rest/settings/settings";
import { create } from "zustand";
import { PresetKey } from "@/types/preset";
import { createJSONStorage, persist } from "zustand/middleware";
import { mergeDeepLeft } from "ramda";

type CustomizeSettingsState = {
  activePreset: PresetKey;
  presets: Record<PresetKey, CustomizePresetData>;
  setPresets: (presets: Record<PresetKey, CustomizePresetData>) => void;
  setActivePreset: (preset: PresetKey) => void;
  updatePreset: (preset: PresetKey, data: Partial<CustomizePresetData>) => void;
};

export const useCustomizeSettingsStore = create<CustomizeSettingsState>()(
  persist(
    (set) => ({
      activePreset: "preset1",
      presets: {
        preset1: {
          tokenFontSizeSetting: "normal",
          buttonSetting: "normal",
          fontSetting: "normal",
          colorSetting: "normal",
          avatarSetting: "normal",
          avatarBorderRadiusSetting: "rounded",
          socialSetting: "normal",
          themeSetting: "original",
          cosmoCardStyleSetting: "type1",
        },
        preset2: {
          tokenInformationSetting: "normal",
        },
        preset3: {
          alertSizeSetting: "normal",
          alertTimeInterval: 2.5,
        },
      } as Record<PresetKey, CustomizePresetData>,
      setPresets: (presets) => set({ presets }),
      setActivePreset: (preset) => set({ activePreset: preset }),
      updatePreset: (preset, data) =>
        set((state) => ({
          presets: {
            ...state.presets,
            [preset]: { ...state.presets[preset], ...data },
          },
        })),
    }),
    {
      name: "customize-settings",
      storage: createJSONStorage(() => localStorage),
      merge: (persistedState, currentState) =>
        mergeDeepLeft(persistedState as CustomizeSettingsState, currentState),
    },
  ),
);
