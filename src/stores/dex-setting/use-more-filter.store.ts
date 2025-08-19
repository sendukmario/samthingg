import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import cookies from "js-cookie";

type FilterFields = {
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
    dexPaidProcessing: boolean; // dex paid
    dexpaid: boolean; // dex paid
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
    raydium_amm: boolean;
    raydium_cpmm: boolean;
    raydium_clmm: boolean;
    boop: boolean;
    orca: boolean;
    jupiter_studio: boolean;
    bags: boolean;
    believe: boolean;
    moonit: boolean;
    meteora: boolean;
    meteora_amm: boolean;
    meteora_amm_v2: boolean;
    meteora_dlmm: boolean;
    heaven: boolean;
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

  // security
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

export type MoreFilterState = {
  isLoadingFilterFetch: boolean;
  setIsLoadingFilterFetch: (newState: boolean) => void;
  filters: {
    preview: FilterFields;
    genuine: FilterFields;
  };
  toggleCheckbox: (
    filterKey: keyof MoreFilterState["filters"]["preview"]["checkBoxes"],
    filterType: keyof MoreFilterState["filters"],
  ) => void;
  setCheckbox: (
    filterKey: keyof MoreFilterState["filters"]["preview"]["checkBoxes"],
    filterType: keyof MoreFilterState["filters"],
    value: boolean,
  ) => void;
  toggleDexFilter: (
    dexName: string,
    filterType: keyof MoreFilterState["filters"],
  ) => void;
  setShowKeywords: (
    value: string,
    filterType: keyof MoreFilterState["filters"],
  ) => void;
  setRangeFilter: (
    filterKey: keyof Omit<
      MoreFilterState["filters"]["preview"],
      "showKeywords" | "doNotShowKeywords"
    >,
    value: number | undefined,
    rangeType: "min" | "max",
    filterType: keyof MoreFilterState["filters"],
  ) => void;
  resetMoreFilters: (filterType: keyof MoreFilterState["filters"]) => void;
  applyMoreFilters: () => void;
};

export const defaultIgniteFilterState: FilterFields = {
  showKeywords: "",
  checkBoxes: {
    mintAuth: false,
    freezeAuth: false,
    onlyLPBurned: false,
    hideBundled: false,
    top10Holders: false,
    withAtLeast1Social: false,
    showHide: false,
    devHolding: false,
    devSold: false,
    dexPaidProcessing: false, // dex paid
    dexpaid: false, // dex paid
    hasWebsite: false,
    hasTwitter: false,
    hasTelegram: false,
    hasAnySocials: false,
    // Lower-case dex identifiers
    moonshot: true,
    pumpfun: true,
    dynamic_bonding_curve: true,
    launch_a_coin: true,
    candle_tv: true,
    bonk: true,
    launchlab: true,
    raydium: true,
    raydium_amm: true,
    raydium_cpmm: true,
    raydium_clmm: true,
    boop: true,
    orca: true,
    jupiter_studio: true,
    bags: true,
    believe: true,
    moonit: true,
    meteora: true,
    meteora_amm: true,
    meteora_amm_v2: true,
    meteora_dlmm: true,
    heaven: true,
    // Capitalised dex identifiers (used by TrendingClient)
    Moonshot: true,
    PumpFun: true,
    "Dynamic Bonding Curve": true,
    "Launch a Coin": true,
    "Candle Tv": true,
    Bonk: true,
    LaunchLab: true,
    Raydium: true,
    "Raydium AMM": true,
    "Raydium CPMM": true,
    "Raydium CLMM": true,
    Boop: true,
    Orca: true,
    "Jupiter Studio": true,
    Bags: true,
    Believe: true,
    MoonIt: true,
    Meteora: true,
    "Meteora AMM": true,
    "Meteora AMM V2": true,
    "Meteora DLMM": true,
    Heaven: true,
  } as any,
  byCurrentLiquidity: {
    min: undefined,
    max: undefined,
  },
  byVolume: {
    min: 5000, // Default Total Volume >= $5k
    max: undefined,
  },
  byAge: {
    min: undefined,
    max: undefined,
  },
  byMarketCap: {
    min: 8000, // Default Market Cap >= $8k
    max: undefined,
  },
  byTXNS: {
    min: undefined,
    max: undefined,
  },
  byBuys: {
    min: undefined,
    max: undefined,
  },
  bondingCurve: {
    min: undefined,
    max: undefined,
  },
  bySells: {
    min: undefined,
    max: undefined,
  },
  trackedBuy: {
    min: undefined,
    max: undefined,
  },
  buyVolume: {
    min: undefined,
    max: undefined,
  },
  sellVolume: {
    min: undefined,
    max: undefined,
  },
  totalVolume: {
    min: undefined,
    max: undefined,
  },
  holders: {
    min: undefined,
    max: undefined,
  },
  // traders: {
  //   min: undefined,
  //   max: undefined,
  // },
  devFundedBefore: {
    min: undefined,
    max: undefined,
  },
  devFundedAfter: {
    min: undefined,
    max: undefined,
  },
  devTokens: {
    min: undefined,
    max: undefined,
  },
  devMigrated: {
    min: undefined,
    max: undefined,
  },

  // security
  dexPaid: {
    min: undefined,
    max: undefined,
  },
  insiderHolding: {
    min: undefined,
    max: undefined,
  },
  bundled: {
    min: undefined,
    max: undefined,
  },
  devHolding: {
    min: undefined,
    max: undefined,
  },
  regularTraders: {
    min: undefined,
    max: undefined,
  },
  snipers: {
    min: undefined,
    max: undefined,
  },
  globalFees: {
    min: undefined,
    max: undefined,
  },
  top10holdings: {
    min: undefined,
    max: undefined,
  },
};

export const useMoreFilterStore = create<MoreFilterState>()(
  persist(
    (set) => ({
      isLoadingFilterFetch: false,
      setIsLoadingFilterFetch: (newState) =>
        set(() => ({
          isLoadingFilterFetch: newState,
        })),
      filters: {
        preview: defaultIgniteFilterState,
        genuine: defaultIgniteFilterState,
      },
      toggleCheckbox: (filterKey, filterType) =>
        set((state) => ({
          filters: {
            ...state.filters,
            [filterType]: {
              ...state.filters[filterType],
              checkBoxes: {
                ...state.filters[filterType].checkBoxes,
                [filterKey]: !state.filters[filterType].checkBoxes[filterKey],
              },
            },
          },
        })),
      setCheckbox: (filterKey, filterType, value) =>
        set((state) => ({
          filters: {
            ...state.filters,
            [filterType]: {
              ...state.filters[filterType],
              checkBoxes: {
                ...state.filters[filterType].checkBoxes,
                [filterKey]:
                  value !== undefined
                    ? value
                    : !state.filters[filterType].checkBoxes[filterKey],
              },
            },
          },
        })),
      toggleDexFilter: (dexName, filterType) =>
        set((state) => {
          // Map UI DEX names to their snake_case equivalents
          const dexMappings: Record<string, string> = {
            Moonshot: "moonshot",
            PumpFun: "pumpfun",
            "Dynamic Bonding Curve": "dynamic_bonding_curve",
            "Launch a Coin": "launch_a_coin",
            "Candle Tv": "candle_tv",
            Bonk: "bonk",
            LaunchLab: "launchlab",
            "Raydium AMM": "raydium_amm",
            "Raydium CPMM": "raydium_cpmm",
            "Raydium CLMM": "raydium_clmm",
            Boop: "boop",
            Orca: "orca",
            "Jupiter Studio": "jupiter_studio",
            Bags: "bags",
            Believe: "believe",
            Moonit: "moonit",
            "Meteora AMM": "meteora_amm",
            "Meteora AMM V2": "meteora_amm_v2",
            "Meteora DLMM": "meteora_dlmm",
            Heaven: "heaven",
          };

          const snakeCaseKey = dexMappings[dexName];
          const currentValue = !!(state.filters[filterType].checkBoxes as any)[
            dexName
          ];
          const newValue = !currentValue;

          // Update both the UI name (capitalized) and backend name (snake_case)
          const updatedCheckBoxes = {
            ...state.filters[filterType].checkBoxes,
            [dexName]: newValue,
            ...(snakeCaseKey && { [snakeCaseKey]: newValue }),
          };

          return {
            filters: {
              ...state.filters,
              [filterType]: {
                ...state.filters[filterType],
                checkBoxes: updatedCheckBoxes,
              },
            },
          };
        }),
      setShowKeywords: (value, filterType) =>
        set((state) => ({
          filters: {
            ...state.filters,
            [filterType]: {
              ...state.filters[filterType],
              showKeywords: value,
            },
          },
        })),
      setRangeFilter: (filterKey, value, rangeType, filterType) =>
        set((state) => ({
          filters: {
            ...state.filters,
            [filterType]: {
              ...state.filters[filterType],
              [filterKey]: {
                ...state.filters[filterType][filterKey],
                [rangeType]: value,
              },
            },
          },
        })),
      resetMoreFilters: (filterType) =>
        set((state) => {
          const updatedFilters = {
            filters: {
              ...state.filters,
              [filterType]: defaultIgniteFilterState,
            },
          };

          cookies.remove("trending-more-filter");

          return updatedFilters;
        }),
      applyMoreFilters: () =>
        set((state) => {
          // Deep-clone the preview object.
          const clonedPreview = JSON.parse(
            JSON.stringify(state.filters.preview),
          );

          const encoded = btoa(JSON.stringify(clonedPreview));
          cookies.set("trending-more-filter", encoded);

          return {
            filters: { ...state.filters, genuine: clonedPreview },
          };
        }),
    }),
    {
      name: "trending-more-filter",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
