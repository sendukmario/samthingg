// @ts-nocheck
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { Preset } from "../dex-setting/use-active-preset.store";

// Define the filter state structure that matches MoreFilterState preview structure
export type PresetFilterState = {
  checkBoxes: {
    mintAuth: boolean;
    freezeAuth: boolean;
    onlyLPBurned: boolean;
    top10Holders: boolean;
    hideBundled: boolean;
    withAtLeast1Social: boolean;
    showHide: boolean;
    devHolding: boolean;
    devSold: boolean;
    dexPaidProcessing: boolean;
    dexpaid: boolean;
    hasWebsite: boolean;
    hasTwitter: boolean;
    hasTelegram: boolean;
    hasAnySocials: boolean;
    // Dexes
    moonshot: boolean;
    pumpfun: boolean;
    dynamic_bonding_curve: boolean;
    launch_a_coin: boolean;
    candle_tv: boolean;
    bonk: boolean;
    launchlab: boolean;
    raydium: boolean;
    boop: boolean;
    orca: boolean;
    jupiter_studio: boolean;
    bags: boolean;
    believe: boolean;
    moonit: boolean;
    meteora: boolean;
  };
  showKeywords: string;
  byCurrentLiquidity: {
    min: number | undefined;
    max: number | undefined;
  };
  byVolume: {
    min: number | undefined;
    max: number | undefined;
  };
  byAge: {
    min: number | undefined;
    max: number | undefined;
  };
  byMarketCap: {
    min: number | undefined;
    max: number | undefined;
  };
  byTXNS: {
    min: number | undefined;
    max: number | undefined;
  };
  byBuys: {
    min: number | undefined;
    max: number | undefined;
  };
  bondingCurve: {
    min: number | undefined;
    max: number | undefined;
  };
  bySells: {
    min: number | undefined;
    max: number | undefined;
  };
  trackedBuy: {
    min: number | undefined;
    max: number | undefined;
  };
  buyVolume: {
    min: number | undefined;
    max: number | undefined;
  };
  sellVolume: {
    min: number | undefined;
    max: number | undefined;
  };
  totalVolume: {
    min: number | undefined;
    max: number | undefined;
  };
  holders: {
    min: number | undefined;
    max: number | undefined;
  };
  // traders: {
  //   min: number | undefined;
  //   max: number | undefined;
  // };
  devFundedBefore: {
    min: number | undefined;
    max: number | undefined;
  };
  devFundedAfter: {
    min: number | undefined;
    max: number | undefined;
  };
  devTokens: {
    min: number | undefined;
    max: number | undefined;
  };
  devMigrated: {
    min: number | undefined;
    max: number | undefined;
  };
  dexPaid: {
    min: number | undefined;
    max: number | undefined;
  };
  insiderHolding: {
    min: number | undefined;
    max: number | undefined;
  };
  bundled: {
    min: number | undefined;
    max: number | undefined;
  };
  devHolding: {
    min: number | undefined;
    max: number | undefined;
  };
  regularTraders: {
    min: number | undefined;
    max: number | undefined;
  };
  snipers: {
    min: number | undefined;
    max: number | undefined;
  };
  globalFees: {
    min: number | undefined;
    max: number | undefined;
  };
  top10holdings: {
    min: number | undefined;
    max: number | undefined;
  };
};

// Default empty filter state
const createEmptyFilterState = (): PresetFilterState => ({
  checkBoxes: {
    mintAuth: false,
    freezeAuth: false,
    onlyLPBurned: false,
    top10Holders: false,
    hideBundled: false,
    withAtLeast1Social: false,
    showHide: false,
    devHolding: false,
    devSold: false,
    dexPaidProcessing: false,
    dexpaid: false,
    hasWebsite: false,
    hasTwitter: false,
    hasTelegram: false,
    hasAnySocials: false,
    // Dexes
    moonshot: true,
    pumpfun: true,
    dynamic_bonding_curve: true,
    launch_a_coin: true,
    candle_tv: true,
    bonk: true,
    launchlab: true,
    raydium: true,
    boop: true,
    orca: true,
    jupiter_studio: true,
    bags: true,
    believe: true,
    moonit: true,
    meteora: true,
  },
  showKeywords: "",
  byCurrentLiquidity: { min: undefined, max: undefined },
  byVolume: { min: undefined, max: undefined },
  byAge: { min: undefined, max: undefined },
  byMarketCap: { min: undefined, max: undefined },
  byTXNS: { min: undefined, max: undefined },
  byBuys: { min: undefined, max: undefined },
  bondingCurve: { min: undefined, max: undefined },
  bySells: { min: undefined, max: undefined },
  trackedBuy: { min: undefined, max: undefined },
  buyVolume: { min: undefined, max: undefined },
  sellVolume: { min: undefined, max: undefined },
  totalVolume: { min: undefined, max: undefined },
  holders: { min: undefined, max: undefined },
  // traders: { min: undefined, max: undefined },
  devFundedBefore: { min: undefined, max: undefined },
  devFundedAfter: { min: undefined, max: undefined },
  devTokens: { min: undefined, max: undefined },
  devMigrated: { min: undefined, max: undefined },
  dexPaid: { min: undefined, max: undefined },
  insiderHolding: { min: undefined, max: undefined },
  bundled: { min: undefined, max: undefined },
  devHolding: { min: undefined, max: undefined },
  regularTraders: { min: undefined, max: undefined },
  snipers: { min: undefined, max: undefined },
  globalFees: { min: undefined, max: undefined },
  top10holdings: { min: undefined, max: undefined },
});

type IgnitePresetFiltersState = {
  presetFilters: Record<Preset, PresetFilterState>;

  // Actions
  saveFiltersToPreset: (preset: Preset, filters: PresetFilterState) => void;
  getFiltersForPreset: (preset: Preset) => PresetFilterState;
  clearPresetFilters: (preset: Preset) => void;
  hasFiltersInPreset: (preset: Preset) => boolean;
};

export const useIgnitePresetFiltersStore = create<IgnitePresetFiltersState>()(
  persist(
    (set, get) => ({
      presetFilters: {
        preset1: createEmptyFilterState(),
        preset2: createEmptyFilterState(),
        preset3: createEmptyFilterState(),
      },

      saveFiltersToPreset: (preset: Preset, filters: PresetFilterState) => {
        set((state) => ({
          presetFilters: {
            ...state.presetFilters,
            [preset]: { ...filters },
          },
        }));
      },

      getFiltersForPreset: (preset: Preset) => {
        const state = get();
        return state.presetFilters[preset] || createEmptyFilterState();
      },

      clearPresetFilters: (preset: Preset) => {
        set((state) => ({
          presetFilters: {
            ...state.presetFilters,
            [preset]: createEmptyFilterState(),
          },
        }));
      },

      hasFiltersInPreset: (preset: Preset) => {
        const state = get();
        const filters = state.presetFilters[preset];
        if (!filters) return false;

        // Check if any checkbox is true
        const hasCheckboxes = Object.values(filters.checkBoxes).some(Boolean);

        // Check if keywords exist
        const hasKeywords = filters.showKeywords.trim().length > 0;

        // Check if any range filter has values
        const hasRangeFilters = Object.entries(filters)
          .filter(([key]) => key !== "checkBoxes" && key !== "showKeywords")
          .some(([, value]) => {
            if (
              typeof value === "object" &&
              value !== null &&
              "min" in value &&
              "max" in value
            ) {
              return value.min !== undefined || value.max !== undefined;
            }
            return false;
          });

        return hasCheckboxes || hasKeywords || hasRangeFilters;
      },
    }),
    {
      name: "ignite-preset-filters",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
