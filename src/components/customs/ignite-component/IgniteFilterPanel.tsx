"use client";

import React, {
  useState,
  useEffect,
  HTMLAttributes,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import BaseButton from "@/components/customs/buttons/BaseButton";
import Image from "next/image";
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";
import {
  useMoreFilterStore,
  defaultIgniteFilterState,
  MoreFilterState,
} from "@/stores/dex-setting/use-more-filter.store";
import { useIgniteFilterPanelStore } from "@/stores/ignite/use-ignite-filter-panel.store";
import Separator from "@/components/customs/Separator";
import { cn } from "@/libraries/utils";
import { Settings2Icon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import IgnitePresetSelectionButton from "@/components/customs/IgnitePresetSelectionButton";
import { useActivePresetStore } from "@/stores/dex-setting/use-active-preset.store";
import {
  useIgnitePresetFiltersStore,
  PresetFilterState,
} from "@/stores/ignite/use-ignite-preset-filters.store";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import * as SelectPrimitive from "@radix-ui/react-select";
import { ChevronDown } from "lucide-react";

// Local trigger with white chevron icon for unit select
const WhiteSelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-9 w-full items-center rounded-[8px] border border-border bg-transparent px-3 text-sm text-fontColorPrimary shadow-sm ring-offset-white focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
  >
    <span className="flex-1 truncate text-left">{children}</span>
    <div className="chevron relative ml-auto aspect-square h-5 w-5 flex-shrink-0 transition-transform duration-200">
      <ChevronDown className="h-full w-full text-white" />
    </div>
  </SelectPrimitive.Trigger>
));
WhiteSelectTrigger.displayName = "WhiteSelectTrigger";
import { debounce, isEqual } from "lodash";

const dexData = [
  {
    id: "moonshot",
    label: "Moonshot",
    value: "Moonshot",
    image: "/icons/asset/yellow-moonshot.png",
    customClass: "",
  },
  {
    id: "pumpfun",
    label: "PumpFun",
    value: "PumpFun",
    image: "/icons/asset/pumpfun.png",
    customClass: "",
  },
  {
    id: "dynamic_bonding_curve",
    label: "Dynamic Bonding Curve",
    value: "Dynamic Bonding Curve",
    image: "/icons/asset/dynamic_bonding_curve.svg",
    customClass: "",
  },
  {
    id: "launch_a_coin",
    label: "Launch a Coin",
    value: "Launch a Coin",
    image: "/icons/asset/launch_a_coin.png",
    customClass: "",
  },
  {
    id: "candle_tv",
    label: "Candle Tv",
    value: "Candle Tv",
    image: "/icons/asset/candle_tv.png",
    customClass: "",
  },
  {
    id: "bonk",
    label: "Letsbonk",
    value: "Bonk",
    image: "/icons/asset/bonk.svg",
    customClass: "",
  },
  {
    id: "launchlab",
    label: "LaunchLab",
    value: "LaunchLab",
    image: "/icons/asset/launch_lab.svg",
    customClass: "",
  },
  {
    id: "raydium_amm",
    label: "Raydium AMM",
    value: "Raydium AMM",
    image: "/icons/asset/raydium.png",
    customClass: "",
  },
  {
    id: "raydium_cpmm",
    label: "Raydium CPMM",
    value: "Raydium CPMM",
    image: "/icons/asset/raydium_cpmm.svg",
    customClass: "",
  },
  {
    id: "raydium_clmm",
    label: "Raydium CLMM",
    value: "Raydium CLMM",
    image: "/icons/asset/raydium_clmm.svg",
    customClass: "",
  },
  {
    id: "boop",
    label: "Boop",
    value: "Boop",
    image: "/icons/asset/boop.png",
    customClass: "",
  },
  {
    id: "orca",
    label: "Orca",
    value: "Orca",
    image: "/icons/asset/orca.svg",
    customClass: "",
  },
  {
    id: "jupiter_studio",
    label: "Jupiter Studio",
    value: "Jupiter Studio",
    image: "/icons/asset/jupiter_studio.svg",
    customClass: "",
  },
  {
    id: "bags",
    label: "Bags",
    value: "Bags",
    image: "/icons/asset/bags.svg",
    customClass: "",
  },
  {
    id: "believe",
    label: "Believe",
    value: "Believe",
    image: "/icons/asset/believe.png",
    customClass: "",
  },
  {
    id: "moonit",
    label: "MoonIt",
    value: "MoonIt",
    image: "/icons/asset/moonit.svg",
    customClass: "",
  },
  {
    id: "meteora_amm",
    label: "Meteora AMM",
    value: "Meteora AMM",
    image: "/icons/asset/meteora_amm.svg",
    customClass: "",
  },
  {
    id: "meteora_amm_v2",
    label: "Meteora AMM V2",
    value: "Meteora AMM V2",
    image: "/icons/asset/meteora_amm.svg",
    customClass: "",
  },
  {
    id: "meteora_dlmm",
    label: "Meteora DLMM",
    value: "Meteora DLMM",
    image: "/icons/asset/meteora_dlmm.svg",
    customClass: "",
  },
  {
    id: "heaven",
    label: "Heaven",
    value: "Heaven",
    image: "/icons/asset/heaven.png",
    customClass: "",
  },
];

const discordMentionsData = [
  {
    id: "Potion",
    label: "Potion",
    image: "/icons/potion.jpg",
  },
  {
    id: "Vanquish",
    label: "Vanquish",
    image: "/icons/vanquish.jpg",
  },
  {
    id: "Champs Only",
    label: "Champs Only",
    image: "/icons/champs-only.jpg",
  },
  {
    id: "Minted",
    label: "Minted",
    image: "/icons/minted.jpg",
  },
  {
    id: "Shocked Trading",
    label: "Shocked Trading",
    image: "/icons/shocked-trading.png",
  },
  {
    id: "Technical Alpha Group",
    label: "Technical Alpha Group",
    image: "/icons/alpha-group.jpg",
  },
];

// const walletTrackedData = [
//   { id: "goodTrader7", icon: "🤑", label: "good trader 7" },
//   { id: "cooker", icon: "🐬", label: "cooker" },
//   { id: "euris", icon: "💰", label: "Euris" },
//   { id: "waddles1", icon: "😀", label: "waddles1" },
// ];

const socialsData = [
  {
    id: "hasWebsite",
    icon: "🌐",
    label: "Website",
    type: "text",
  },
  {
    id: "hasTwitter",
    image: "/icons/social/x.svg",
    label: "Twitter",
  },
  {
    id: "hasTelegram",
    image: "/icons/social/rounded-telegram.svg",
    label: "Telegram",
  },
  {
    id: "hasAnySocials",
    icon: "😀",
    label: "Any Socials",
    type: "text",
  },
];

interface CheckboxItemData {
  id: string;
  icon?: string;
  label: string;
}

const CheckboxItem: React.FC<{
  item: CheckboxItemData;
  isChecked: boolean;
  onToggle: () => void;
  type?: "image" | "text" | undefined;
  image?: string;
  imageStyle?: HTMLAttributes<HTMLDivElement>["className"];
}> = ({ item, isChecked, onToggle, type = "text", image, imageStyle }) => (
  <div
    className={cn(
      "flex cursor-pointer items-center rounded-[8px] border border-[#242436] bg-white/[4%] px-2",
      type === "image" && "h-[40px]",
      type === "text" && "h-[40px]",
    )}
  >
    {type === "image" ? (
      <div
        className={cn(
          "relative mr-1.5 flex size-6 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-none",
          imageStyle,
        )}
      >
        <Image
          src={image || `/icons/image-placeholder.svg`}
          alt={`${item.label} Icon`}
          fill
          quality={100}
          className="object-cover" // changed from object-fill to object-cover
        />
      </div>
    ) : (
      item.icon && (
        <div className="mr-1.5 cursor-pointer text-lg">{item.icon || "🔘"}</div>
      )
    )}
    <Label
      htmlFor={item.id}
      className="mr-1 flex-grow cursor-pointer font-geistRegular text-sm text-fontColorPrimary"
    >
      {item.label}
    </Label>
    <Checkbox
      id={item.id}
      checked={isChecked}
      onCheckedChange={onToggle}
      className="ml-auto size-[18.5px] border-[#9090A3]"
    />
  </div>
);

const useDynamicHeight = () => {
  const calculateHeight = () => {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    // Configuration based on your specifications
    const config = {
      // Width-based base heights for 600px screen height
      baseHeights: {
        medium: { width: 1280, baseAt600: 330 }, // 1280px-1440px → 330px at 600px height
        large: { width: 1440, baseAt600: 410 }, // >1440px → 370px at 600px height
      },

      // Linear scaling: 1px screen height = 1px component height
      heightScaleFactor: 1.0,

      // Reference point for calculations
      referenceHeight: 600,

      // Safety constraints
      maxHeightPercent: 0.85, // Maximum 85% of screen height
      minHeight: 280, // Absolute minimum
    };

    // Determine which base configuration to use based on screen width
    let baseHeight;
    if (screenWidth > config.baseHeights.large.width) {
      // Width > 1440px
      baseHeight = config.baseHeights.large.baseAt600;
    } else {
      // Width 1280px-1440px (and below, using medium as fallback)
      baseHeight = config.baseHeights.medium.baseAt600;
    }

    // Calculate height using linear scaling from reference point
    // Formula: baseHeight + (heightDifference * scaleFactor)
    const heightDifference = screenHeight - config.referenceHeight;
    const calculatedHeight =
      baseHeight + heightDifference * config.heightScaleFactor;

    // Apply constraints
    const maxHeight = screenHeight * config.maxHeightPercent;
    const finalHeight = Math.max(
      config.minHeight,
      Math.min(calculatedHeight, maxHeight),
    );

    return `${Math.round(finalHeight)}px`;
  };

  const [height, setHeight] = useState(calculateHeight);

  useEffect(() => {
    const updateHeight = () => setHeight(calculateHeight());
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  return height;
};

const IgniteFilterPanel = React.memo(() => {
  const { isOpen, setIsOpen } = useIgniteFilterPanelStore();
  const dynamicHeight = useDynamicHeight();

  const [resetKey, setResetKey] = useState(0);

  const [openDexFilter, setOpenDexFilter] = useState(true);
  const [openGeneralFilter, setOpenGeneralFilter] = useState(true);
  const [openSecurityFilter, setOpenSecurityFilter] = useState(true);
  const [openDiscordFilter, setOpenDiscordFilter] = useState(true);
  // const [openWalletTrackedFilter, setOpenWalletTrackedFilter] = useState(true);
  const [openSocialsFilter, setOpenSocialsFilter] = useState(true);

  const {
    filters,
    setRangeFilter,
    toggleCheckbox,
    setCheckbox,
    toggleDexFilter,
    resetMoreFilters,
    applyMoreFilters,
    setIsLoadingFilterFetch,
    setShowKeywords,
  } = useMoreFilterStore();
  const { preview: previewFilters } = filters;

  // Custom handler for Dex Paid checkboxes with interdependency logic
  const handleDexPaidToggle = useCallback(
    (checkboxType: "processing" | "approved") => {
      const currentProcessing = previewFilters.checkBoxes.dexPaidProcessing;
      const currentPaid = previewFilters.checkBoxes.dexpaid;

      if (checkboxType === "processing") {
        // If toggling Processing checkbox
        if (!currentProcessing) {
          // Checking Processing should also check Paid
          toggleCheckbox("dexPaidProcessing", "preview");
          if (!currentPaid) {
            toggleCheckbox("dexpaid", "preview");
          }
        } else {
          // Unchecking Processing should only uncheck Processing
          toggleCheckbox("dexPaidProcessing", "preview");
        }
      } else if (checkboxType === "approved") {
        // If toggling Paid checkbox
        if (!currentPaid) {
          // Checking Paid should only check Paid
          toggleCheckbox("dexpaid", "preview");
        } else {
          // Unchecking Paid should also uncheck Processing
          toggleCheckbox("dexpaid", "preview");
          if (currentProcessing) {
            toggleCheckbox("dexPaidProcessing", "preview");
          }
        }
      }
    },
    [
      previewFilters.checkBoxes.dexPaidProcessing,
      previewFilters.checkBoxes.dexpaid,
      toggleCheckbox,
    ],
  );

  const [generalSearchQuery, setGeneralSearchQuery] = useState("");
  const handleGeneralSearch = useMemo(
    () =>
      debounce((value) => {
        setGeneralSearchQuery(value);
      }, 300),
    [],
  );
  const [securitySearchQuery, setSecuritySearchQuery] = useState("");
  const handleSecuritySearch = useMemo(
    () =>
      debounce((value) => {
        setSecuritySearchQuery(value);
      }, 300),
    [],
  );

  // Cancel debounce on unmount
  useEffect(() => {
    return () => {
      handleGeneralSearch.cancel();
      handleSecuritySearch.cancel();
    };
  }, [handleGeneralSearch, handleSecuritySearch]);

  const generalFilters = [
    {
      label: "Buys",
      key: "byBuys",
      values: previewFilters.byBuys ?? {
        min: undefined,
        max: undefined,
      },
      minPlaceHolder: "0",
      // maxPlaceholder: "10,000",
    },
    {
      label: "Sells",
      key: "bySells",
      values: previewFilters.bySells ?? {
        min: undefined,
        max: undefined,
      },
      minPlaceHolder: "0",
      // maxPlaceholder: "10,000",
    },
    {
      label: "Tracked Buys",
      key: "trackedBuy",
      values: previewFilters.trackedBuy ?? {
        min: undefined,
        max: undefined,
      },
      minPlaceHolder: "0",
      // maxPlaceholder: "10,000",
    },
    {
      label: "Buy Volume",
      key: "buyVolume",
      values: previewFilters.buyVolume ?? {
        min: undefined,
        max: undefined,
      },
      minPlaceHolder: "0",
      // maxPlaceholder: "10,000",
    },
    {
      label: "Sell Volume",
      key: "sellVolume",
      values: previewFilters.sellVolume ?? {
        min: undefined,
        max: undefined,
      },
      minPlaceHolder: "0",
      // maxPlaceholder: "10,000",
    },
    {
      label: "Total Volume",
      key: "totalVolume",
      values: previewFilters.totalVolume ?? {
        min: undefined,
        max: undefined,
      },
      minPlaceHolder: "0",
      maxPlaceholder: "10,000",
    },
    {
      label: "Holders",
      key: "holders",
      values: previewFilters.holders ?? {
        min: undefined,
        max: undefined,
      },
      minPlaceHolder: "0",
      // maxPlaceholder: "10,000",
    },
    // {
    //   label: "Traders",
    //   key: "traders",
    //   values: previewFilters.traders ?? {
    //     min: undefined,
    //     max: undefined,
    //   },
    //   minPlaceHolder: "0",
    //   maxPlaceholder: "10,000",
    // },
    {
      label: "Regular Traders",
      key: "regularTraders",
      values: previewFilters.regularTraders ?? {
        min: undefined,
        max: undefined,
      },
      minPlaceHolder: "0",
      // maxPlaceholder: "10,000",
    },
    {
      label: "Dev Funded Before",
      key: "devFundedBefore",
      values: previewFilters.devFundedBefore ?? {
        min: undefined,
        max: undefined,
      },
      minPlaceHolder: "0",
      // maxPlaceholder: "10,000",
    },
    {
      label: "Dev Funded After",
      key: "devFundedAfter",
      values: previewFilters.devFundedAfter ?? {
        min: undefined,
        max: undefined,
      },
      minPlaceHolder: "0",
      // maxPlaceholder: "10,000",
    },
    {
      label: "Dev Tokens",
      key: "devTokens",
      values: previewFilters.devTokens ?? {
        min: undefined,
        max: undefined,
      },
      minPlaceHolder: "0",
      // maxPlaceholder: "10,000",
    },
    {
      label: "Dev Migrated",
      key: "devMigrated",
      values: previewFilters.devMigrated ?? {
        min: undefined,
        max: undefined,
      },
      minPlaceHolder: "0",
      // maxPlaceholder: "10,000",
    },
    {
      label: "Coin Age (minutes)",
      key: "byAge",
      values: previewFilters.byAge ?? {
        min: undefined,
        max: undefined,
      },
      max: 60,
      minPlaceHolder: "0",
      maxPlaceholder: "60",
    },
  ];

  const securityFilters = [
    {
      label: "Insider Holding",
      key: "insiderHolding",
      values: previewFilters.insiderHolding ?? {
        min: undefined,
        max: undefined,
      },
      minPlaceHolder: "0",
      maxPlaceholder: "100",
    },
    {
      label: "Bundled",
      key: "bundled",
      values: previewFilters.bundled ?? {
        min: undefined,
        max: undefined,
      },
      minPlaceHolder: "0",
      maxPlaceholder: "100",
    },
    {
      label: "Dev Holdings",
      key: "devHolding",
      values: previewFilters.devHolding ?? {
        min: undefined,
        max: undefined,
      },
      minPlaceHolder: "0",
      maxPlaceholder: "100",
    },
    {
      label: "Top 10 Holdings",
      key: "top10holdings",
      values: previewFilters.top10holdings ?? {
        min: undefined,
        max: undefined,
      },
      minPlaceHolder: "0",
      maxPlaceholder: "100",
    },
    // {
    //   label: "Regular Traders",
    //   key: "regularTraders",
    //   values: previewFilters.regularTraders ?? {
    //     min: undefined,
    //     max: undefined,
    //   },
    //   minPlaceHolder: "0",
    //   maxPlaceholder: "10,000",
    // },
    {
      label: "Snipers",
      key: "snipers",
      values: previewFilters.snipers ?? {
        min: undefined,
        max: undefined,
      },
      minPlaceHolder: "0",
      maxPlaceholder: "100",
    },
    {
      label: "Global Fees",
      key: "globalFees",
      values: previewFilters.globalFees ?? {
        min: undefined,
        max: undefined,
      },
      minPlaceHolder: "0",
      // maxPlaceholder: "0",
    },
  ];

  const filteredGeneralFilters = generalFilters.filter((f) =>
    f.label.toLowerCase().includes(generalSearchQuery.toLowerCase()),
  );

  const filteredSecurityFilters = securityFilters.filter((f) =>
    f.label.toLowerCase().includes(securitySearchQuery.toLowerCase()),
  );

  // Preset integration
  const { cosmoActivePreset } = useActivePresetStore();
  const { saveFiltersToPreset, getFiltersForPreset } =
    useIgnitePresetFiltersStore();

  // Check if a field is percentage-based (should not support decimals)
  const isPercentageField = (key: string): boolean => {
    const percentageFields = [
      "insiderHolding",
      "bundled",
      "devHolding",
      "top10holdings",
      "snipers",
      "bondingCurve",
    ];
    return percentageFields.includes(key);
  };

  // Handler for numeric value change using the Input component's isNumeric feature
  const handleNumericValueChange = (
    key: keyof Omit<
      MoreFilterState["filters"]["preview"],
      "checkBoxes" | "showKeywords" | "doNotShowKeywords"
    >,
    range: "min" | "max",
    values: { floatValue: number | undefined },
  ) => {
    const isPercentage = isPercentageField(key as string);
    let numeric = values.floatValue;

    if (numeric !== undefined) {
      // For percentage fields, round to integer
      if (isPercentage) {
        numeric = Math.round(numeric);
        // Clamp percentage values to 0-100
        if (numeric < 0) numeric = 0;
        if (numeric > 100) numeric = 100;
      } else {
        // For non-percentage fields, apply field-specific limits
        const LIMITS: Record<string, { min: number; max: number }> = {
          byAge: { min: 0, max: 60 },
          byVolume: { min: 0, max: 1_000_000_000 },
          byCurrentLiquidity: { min: 0, max: 1_000_000_000 },
          byMarketCap: { min: 0, max: 100_000_000_000 },
          byTXNS: { min: 0, max: 1_000_000_000 },
          byBuys: { min: 0, max: 1_000_000_000 },
          bySells: { min: 0, max: 1_000_000_000 },
          trackedBuy: { min: 0, max: 1_000_000_000 },
          buyVolume: { min: 0, max: 1_000_000_000 },
          sellVolume: { min: 0, max: 1_000_000_000 },
          totalVolume: { min: 0, max: 1_000_000_000 },
          holders: { min: 0, max: 1_000_000_000 },
          // traders: { min: 0, max: 1_000_000_000 },
          devFundedBefore: { min: 0, max: 1_000_000_000 },
          devFundedAfter: { min: 0, max: 1_000_000_000 },
          devTokens: { min: 0, max: 1_000_000_000 },
          devMigrated: { min: 0, max: 1_000_000_000 },
          regularTraders: { min: 0, max: 1_000_000_000 },
          globalFees: { min: 0, max: 1_000_000_000 },
        };

        const { min: minLimit = 0, max: maxLimit = Number.MAX_SAFE_INTEGER } =
          LIMITS[key as keyof typeof LIMITS] ?? {};

        // Clamp to field-specific range
        if (numeric < minLimit) numeric = minLimit;
        if (numeric > maxLimit) numeric = maxLimit;
      }
    }

    setRangeFilter(key, numeric, range, "preview");
  };

  const handleNumericBlur = (
    key: keyof Omit<
      MoreFilterState["filters"]["preview"],
      "checkBoxes" | "showKeywords" | "doNotShowKeywords"
    >,
    range: "min" | "max",
  ) => {
    const currentRange = previewFilters[key];
    let value = currentRange?.[range];
    if (value === undefined) return;

    if (
      range === "min" &&
      currentRange.max !== undefined &&
      value > currentRange.max
    ) {
      value = currentRange.max;
    }
    if (
      range === "max" &&
      currentRange.min !== undefined &&
      value < currentRange.min
    ) {
      value = currentRange.min;
    }

    setRangeFilter(key, value, range, "preview");
  };

  // Automatically enforce devHolding maximum to 0 when "Dev Sold" checkbox is active
  useEffect(() => {
    const devSoldActive = previewFilters.checkBoxes.devSold;
    const currentMax = previewFilters.devHolding?.max;

    if (devSoldActive) {
      // If Dev Sold is checked, ensure max dev holdings is 0 (and min is not > 0)
      if (currentMax !== 0) {
        setRangeFilter("devHolding", 0, "max", "preview");
      }

      const currentMin = previewFilters.devHolding?.min;
      if (currentMin !== undefined && currentMin > 0) {
        setRangeFilter("devHolding", 0, "min", "preview");
      }
    } else {
      // When Dev Sold is unchecked, reset the forced max constraint if it was applied
      if (currentMax === 0) {
        setRangeFilter("devHolding", undefined, "max", "preview");
      }
    }
  }, [
    previewFilters.checkBoxes.devSold,
    previewFilters.devHolding?.max,
    previewFilters.devHolding?.min,
    setRangeFilter,
  ]);

  // Convert MoreFilterState preview to PresetFilterState format
  const convertToPresetFilterState = useCallback(
    (preview: typeof previewFilters): PresetFilterState => {
      return {
        checkBoxes: { ...preview.checkBoxes },
        showKeywords: preview.showKeywords,
        byCurrentLiquidity: { ...preview.byCurrentLiquidity },
        byVolume: { ...preview.byVolume },
        byAge: { ...preview.byAge },
        byMarketCap: { ...preview.byMarketCap },
        byTXNS: { ...preview.byTXNS },
        byBuys: { ...preview.byBuys },
        bondingCurve: { ...preview.bondingCurve },
        bySells: { ...preview.bySells },
        trackedBuy: { ...preview.trackedBuy },
        buyVolume: { ...preview.buyVolume },
        sellVolume: { ...preview.sellVolume },
        totalVolume: { ...preview.totalVolume },
        holders: { ...preview.holders },
        // traders: { ...preview.traders },
        devFundedBefore: { ...preview.devFundedBefore },
        devFundedAfter: { ...preview.devFundedAfter },
        devTokens: { ...preview.devTokens },
        devMigrated: { ...preview.devMigrated },
        dexPaid: { ...preview.dexPaid },
        insiderHolding: { ...preview.insiderHolding },
        bundled: { ...preview.bundled },
        devHolding: { ...preview.devHolding },
        regularTraders: { ...preview.regularTraders },
        snipers: { ...preview.snipers },
        globalFees: { ...preview.globalFees },
        top10holdings: { ...preview.top10holdings },
      };
    },
    [],
  );

  // Load preset filters when active preset changes
  useEffect(() => {
    if (!cosmoActivePreset) return;

    const presetFilters = getFiltersForPreset(cosmoActivePreset);

    // Apply preset filters to preview state
    setIsLoadingFilterFetch(true);

    // Reset first to clear any existing filters
    resetMoreFilters("preview");

    // Apply preset filters
    Object.entries(presetFilters.checkBoxes).forEach(([key, value]) => {
      setCheckbox(
        key as keyof typeof presetFilters.checkBoxes,
        "preview",
        value,
      );
    });

    // Apply keywords
    if (presetFilters.showKeywords) {
      setShowKeywords(presetFilters.showKeywords, "preview");
    }

    // Apply range filters
    Object.entries(presetFilters).forEach(([key, value]) => {
      if (
        key !== "checkBoxes" &&
        key !== "showKeywords" &&
        value &&
        typeof value === "object"
      ) {
        const rangeValue = value as { min?: number; max?: number };
        if (rangeValue.min !== undefined) {
          setRangeFilter(key as any, rangeValue.min, "min", "preview");
        }
        if (rangeValue.max !== undefined) {
          setRangeFilter(key as any, rangeValue.max, "max", "preview");
        }
      }
    });

    setIsLoadingFilterFetch(false);
  }, [
    cosmoActivePreset,
    getFiltersForPreset,
    resetMoreFilters,
    toggleCheckbox,
    setShowKeywords,
    setRangeFilter,
    setIsLoadingFilterFetch,
  ]);

  /**
   * Reset all filters to their initial state **and** apply the default Dex
   * selections required by product (PumpFun, Bonk, Bags, Moonshot, Believe,
   * Jupiter Studio, Moonit, Boop, LaunchLab, Dynamic Bonding Curve).
   */
  // Default Dex IDs that should be enabled after a reset
  // const DEFAULT_DEXES = [
  //   "PumpFun",
  //   "Bonk",
  //   "Bags",
  //   "Moonshot",
  //   "Believe",
  //   "Jupiter Studio",
  //   "Moonit",
  //   "Boop",
  //   "LaunchLab",
  //   "Dynamic Bonding Curve",
  // ] as const;

  const hasActiveFilters = useMemo(() => {
    const isActiveFilter = !isEqual(defaultIgniteFilterState, previewFilters);
    return isActiveFilter;
  }, [defaultIgniteFilterState, previewFilters]);

  const handleReset = () => {
    // 1. Clear all filters first
    resetMoreFilters("preview");

    // 1.5 Ensure Dev Funded unit selections & dropdowns are reset as well
    setDevFundedBeforeUnit("Minutes");
    setDevFundedAfterUnit("Minutes");
    setIsUnitOpen(false);
    setIsUnitAfterOpen(false);

    // 2. Re-apply default Dexes in a microtask so that the reset state is
    //    fully committed before we toggle. This avoids race conditions with
    //    Zustand internal batching.

    Promise.resolve().then(() => {
      // DEFAULT_DEXES.forEach((dexId) => {
      //   toggleDexFilter(dexId, "preview");
      // });

      // 3. Bump the resetKey to refresh controlled inputs
      setResetKey((k) => k + 1);
    });
  };

  const handleApply = () => {
    // Log the filter state being applied from IgniteFilterPanel
    // console.log("Ignite FilterPanel - Filter applied:", previewFilters);

    // Save current preview filters to active preset
    if (cosmoActivePreset) {
      const currentPresetFilters = convertToPresetFilterState(previewFilters);
      saveFiltersToPreset(cosmoActivePreset, currentPresetFilters);
    }

    applyMoreFilters();
    // setIsLoadingFilterFetch(false);
    setIsOpen(false);

    // Trigger refresh event for ignite data
    window.dispatchEvent(new CustomEvent("refreshTrendingData"));
  };

  // function formatCurrency(value: number) {
  //   if (value >= 1_000_000) {
  //     return `$${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 2)}M`;
  //   } else if (value >= 1_000) {
  //     return `$${(value / 1_000).toFixed(value % 1_000 === 0 ? 0 : 2)}K`;
  //   } else {
  //     return `$${value}`;
  //   }
  // }

  const [devFundedBeforeUnit, setDevFundedBeforeUnit] = useState<
    "Minutes" | "Hours" | "Days" | "Month"
  >("Minutes");

  const [devFundedAfterUnit, setDevFundedAfterUnit] = useState<
    "Minutes" | "Hours" | "Days" | "Month"
  >("Minutes");

  const unitMultipliers = {
    Minutes: 1,
    Hours: 60,
    Days: 1440,
    Month: 43200,
  } as const;

  // --- Seconds per unit mapping (for backend which expects *seconds*) -------
  const secondsMultipliers = {
    Minutes: 60, // 1 min = 60 sec
    Hours: 60 * 60,
    Days: 60 * 1440,
    Month: 60 * 43200,
  } as const;

  // Add at top after other useState declarations
  const [isUnitOpen, setIsUnitOpen] = useState(false);
  const unitRef = React.useRef<HTMLDivElement | null>(null);

  // Independent open state & ref for "Dev Funded After" unit dropdown
  const [isUnitAfterOpen, setIsUnitAfterOpen] = useState(false);
  const unitAfterRef = React.useRef<HTMLDivElement | null>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (unitRef.current && !unitRef.current.contains(e.target as Node)) {
        setIsUnitOpen(false);
      }
      if (
        unitAfterRef.current &&
        !unitAfterRef.current.contains(e.target as Node)
      ) {
        setIsUnitAfterOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  //  ---------------------------------------------------------------------------
  //  Bonding Curve range sanitiser – keeps values in 0-100 and enforces min ≤ max
  //  This protects against edge-cases where an out-of-range or inconsistent
  //  percentage (e.g. min > max) blocks the backend from returning any token and
  //  forces the user to *Reset* the entire filter panel.
  //
  //  The check runs whenever the Bonding Curve inputs change and silently fixes
  //  the preview state so the user can continue adjusting other filters without
  //  encountering the "empty result until reset" issue reported by QA.
  //  ---------------------------------------------------------------------------
  useEffect(() => {
    const { min: bcMin, max: bcMax } = previewFilters.bondingCurve ?? {};

    // Clamp to 0-100 boundaries
    if (bcMin !== undefined && bcMin < 0) {
      setRangeFilter("bondingCurve" as any, 0, "min", "preview");
    }
    if (bcMax !== undefined && bcMax > 100) {
      setRangeFilter("bondingCurve" as any, 100, "max", "preview");
    }

    // Ensure logical ordering (min ≤ max). If the user entered min > max we
    // auto-correct the offending bound instead of blocking further filtering.
    if (bcMin !== undefined && bcMax !== undefined && bcMin > bcMax) {
      // Keep the most recently edited field intact by aligning the *other* one.
      // We infer the latest change via the `range` that violates the condition.
      // When bcMin > bcMax we move *min* down to bcMax (preferred UX behaviour).
      setRangeFilter("bondingCurve" as any, bcMax, "min", "preview");
    }
  }, [
    previewFilters.bondingCurve?.min,
    previewFilters.bondingCurve?.max,
    setRangeFilter,
  ]);

  if (!isOpen) return null;

  return (
    <div
      className="z-50 min-w-[462px] rounded-[12px] border border-border bg-background shadow-lg 2xl:min-w-[512px]"
      style={{ height: dynamicHeight }}
    >
      <div className="flex h-full flex-col text-fontColorSecondary">
        {/* HEADER */}
        <div className="flex h-[48px] flex-shrink-0 items-center justify-between border-b border-border px-4">
          <div className="flex items-center gap-x-2">
            <button
              title="Close"
              onClick={() => setIsOpen(false)}
              className="relative aspect-square size-[24px] flex-shrink-0"
            >
              <Image
                src="/icons/close.png"
                alt="Close Icon"
                fill
                quality={100}
                className="object-contain"
              />
            </button>
            <h2 className="font-geistBold text-lg text-fontColorPrimary">
              Filter
            </h2>
          </div>
          <div className="flex items-center gap-x-4">
            <button
              onClick={handleReset}
              disabled={!hasActiveFilters}
              className={cn(
                "font-geistSemiBold text-sm",
                hasActiveFilters
                  ? "text-primary hover:text-white"
                  : "cursor-not-allowed text-fontColorSecondary opacity-50",
              )}
            >
              Reset
            </button>
            <BaseButton
              onClick={handleApply}
              variant="primary"
              fullWidth
              className="h-[32px] w-[119px] rounded-[8px] bg-primary font-geistSemiBold text-sm text-black"
            >
              Apply
            </BaseButton>
          </div>
        </div>

        {/* BODY */}
        <OverlayScrollbarsComponent
          defer
          element="div"
          className="flex-grow overflow-y-auto"
          options={{ scrollbars: { autoHide: "scroll" } }}
        >
          <div className="flex flex-col">
            {/* Min Market Cap */}
            <div className="flex flex-col gap-y-1 px-4 py-2">
              <div className="flex flex-col justify-center gap-y-2">
                <Label className="text-sm text-fontColorSecondary">
                  Min Market Cap
                </Label>
                <div className="flex gap-x-2">
                  <div className="relative w-full">
                    <Input
                      key={`byMarketCap-min-${resetKey}`}
                      type="text"
                      placeholder={
                        defaultIgniteFilterState.byMarketCap.min !== undefined
                          ? defaultIgniteFilterState.byMarketCap.min.toLocaleString()
                          : "0"
                      }
                      value={previewFilters?.byMarketCap?.min ?? ""}
                      isNumeric
                      decimalScale={6}
                      onNumericValueChange={(values) =>
                        handleNumericValueChange("byMarketCap", "min", values)
                      }
                      onBlur={() => handleNumericBlur("byMarketCap", "min")}
                      className="border border-[#242436] bg-background text-end placeholder-fontColorSecondary"
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 transform text-sm text-fontColorSecondary">
                      Min
                    </span>
                  </div>
                  <div className="relative w-full">
                    <Input
                      key={`byMarketCap-max-${resetKey}`}
                      type="text"
                      placeholder="0"
                      value={previewFilters?.byMarketCap?.max ?? ""}
                      isNumeric
                      decimalScale={6}
                      onNumericValueChange={(values) =>
                        handleNumericValueChange("byMarketCap", "max", values)
                      }
                      onBlur={() => handleNumericBlur("byMarketCap", "max")}
                      className="border border-[#242436] bg-background text-end placeholder-fontColorSecondary"
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 transform text-sm text-fontColorSecondary">
                      Max
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bonding Curve */}
            <div className="flex flex-col gap-y-1 px-4 py-2">
              <div className="flex flex-col justify-center gap-y-2">
                <Label className="text-sm text-fontColorSecondary">
                  Bonding Curve
                </Label>
                <div className="flex gap-x-2">
                  <div className="relative w-full">
                    <Input
                      key={`bondingCurve-min-${resetKey}`}
                      type="text"
                      placeholder="0"
                      value={previewFilters?.bondingCurve?.min ?? ""}
                      isNumeric
                      decimalScale={0}
                      onKeyDown={(e) => {
                        if (!isPercentageField("bondingCurve")) return;
                        // Use the current *max* value of the bonding curve field when
                        // determining whether to block additional key presses. Referencing
                        // the min value here prevented users from entering numbers correctly
                        // and led to inconsistent filtering behaviour.
                        const current = Number(
                          previewFilters?.bondingCurve?.max ?? 0,
                        );
                        const isNumberKey = /^[0-9]$/.test(e.key);

                        if (isNumberKey && current >= 100) {
                          e.preventDefault();
                        }
                      }}
                      onNumericValueChange={(values) => {
                        const clampedValues =
                          isPercentageField("bondingCurve") &&
                          values.floatValue !== undefined
                            ? {
                                ...values,
                                floatValue: Math.min(values.floatValue, 100),
                              }
                            : values;

                        handleNumericValueChange(
                          "bondingCurve" as any,
                          "min",
                          clampedValues,
                        );
                      }}
                      onBlur={() => handleNumericBlur("bondingCurve", "min")}
                      className="border border-[#242436] bg-background pr-8 text-end placeholder-fontColorSecondary"
                    />
                    {/* Percentage suffix */}
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 transform text-sm text-fontColorSecondary">
                      %
                    </span>
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 transform text-sm text-fontColorSecondary">
                      Min
                    </span>
                  </div>
                  <div className="relative w-full">
                    <Input
                      key={`bondingCurve-max-${resetKey}`}
                      type="text"
                      placeholder="0"
                      value={previewFilters?.bondingCurve?.max ?? ""}
                      isNumeric
                      decimalScale={0}
                      onKeyDown={(e) => {
                        if (!isPercentageField("bondingCurve")) return;
                        // Use the current *max* value of the bonding curve field when
                        // determining whether to block additional key presses. Referencing
                        // the min value here prevented users from entering numbers correctly
                        // and led to inconsistent filtering behaviour.
                        const current = Number(
                          previewFilters?.bondingCurve?.max ?? 0,
                        );
                        const isNumberKey = /^[0-9]$/.test(e.key);

                        if (isNumberKey && current >= 100) {
                          e.preventDefault();
                        }
                      }}
                      onNumericValueChange={(values) => {
                        const clampedValues =
                          isPercentageField("bondingCurve") &&
                          values.floatValue !== undefined
                            ? {
                                ...values,
                                floatValue: Math.min(values.floatValue, 100),
                              }
                            : values;

                        handleNumericValueChange(
                          "bondingCurve" as any,
                          "max",
                          clampedValues,
                        );
                      }}
                      onBlur={() => handleNumericBlur("bondingCurve", "max")}
                      className="border border-[#242436] bg-background pr-8 text-end placeholder-fontColorSecondary"
                    />
                    {/* Percentage suffix */}
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 transform text-sm text-fontColorSecondary">
                      %
                    </span>
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 transform text-sm text-fontColorSecondary">
                      Max
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Dev Holding / Sold */}
            <div className="flex flex-col gap-y-1 px-4 py-2 pt-2">
              <div className="grid grid-cols-1 justify-between gap-2">
                {/* <CheckboxItem
                  item={{ id: "devHolding", label: "Dev holding" }}
                  isChecked={!!previewFilters.checkBoxes.devHolding}
                  onToggle={() => toggleCheckbox("devHolding", "preview")}
                /> */}
                <CheckboxItem
                  item={{ id: "devSold", label: "Dev Sold" }}
                  isChecked={!!previewFilters.checkBoxes.devSold}
                  onToggle={() => toggleCheckbox("devSold", "preview")}
                />
              </div>

              {/* Dex Paid */}
              <div className="w-full rounded-[8px] border border-[#242436] bg-white/[4%] px-2">
                <div className={cn("flex h-[40px] items-center")}>
                  <Label
                    htmlFor="dexPaid"
                    className="flex-grow font-geistRegular text-fontColorPrimary"
                  >
                    Dex Paid
                  </Label>

                  <div className="flex items-center gap-x-8">
                    <div className="flex items-center gap-x-2">
                      <Label
                        htmlFor="dexPaidProcessing"
                        className="flex-grow cursor-pointer font-geistRegular text-fontColorPrimary"
                      >
                        Processing
                      </Label>
                      <Checkbox
                        id="dexPaidProcessing"
                        checked={filters.preview.checkBoxes.dexPaidProcessing}
                        onCheckedChange={() =>
                          handleDexPaidToggle("processing")
                        }
                        className="ml-auto size-[18.5px] border-[#9090A3]"
                      />
                    </div>

                    {/* Paid */}
                    <div className="flex items-center gap-x-2">
                      <Label
                        htmlFor="dexpaid"
                        className="flex-grow cursor-pointer font-geistRegular text-fontColorPrimary"
                      >
                        Paid
                      </Label>
                      <Checkbox
                        id="dexpaid"
                        checked={filters.preview.checkBoxes.dexpaid}
                        onCheckedChange={() => handleDexPaidToggle("approved")}
                        className="ml-auto size-[18.5px] border-[#9090A3]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <div className="flex w-full flex-col bg-background px-4 py-2 pb-4">
              <div className="mt-1 flex items-center justify-between gap-y-2">
                <div className="flex items-center gap-2 text-fontColorPrimary">
                  <Settings2Icon className="mr-1 h-4 w-4" />
                  <p className="font-geistRegular text-sm">Presets</p>
                </div>
                <div className="w-[210px]">
                  <IgnitePresetSelectionButton isWithLabel />
                </div>
              </div>
            </div>

            <Separator />

            {/* Dex Filters */}
            <motion.div
              animate={openDexFilter ? "open" : "closed"}
              className="flex h-auto w-full flex-col items-center self-stretch"
            >
              <div
                className="flex w-full items-center justify-center gap-[5px] px-4 py-1"
                onClick={() => setOpenDexFilter((prev) => !prev)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                >
                  <path
                    d="M15.9375 2.87499C15.4126 2.87499 14.9092 3.08351 14.538 3.45467C14.1669 3.82584 13.9583 4.32925 13.9583 4.85416C13.9583 5.13678 14.0201 5.40516 14.1278 5.64978L12.58 7.39066C12.0538 7.02878 11.4304 6.8345 10.7917 6.83332C10.2058 6.83332 9.66433 7.00432 9.19329 7.2814L7.39304 5.48195L7.37483 5.50016C7.53 5.18507 7.625 4.83436 7.625 4.45832C7.625 3.98859 7.48571 3.52941 7.22474 3.13884C6.96377 2.74828 6.59285 2.44387 6.15887 2.26411C5.7249 2.08435 5.24737 2.03732 4.78666 2.12896C4.32596 2.2206 3.90277 2.44679 3.57062 2.77894C3.23847 3.11109 3.01228 3.53428 2.92064 3.99498C2.829 4.45569 2.87603 4.93322 3.05579 5.36719C3.23555 5.80117 3.53995 6.17209 3.93052 6.43306C4.32109 6.69403 4.78027 6.83332 5.25 6.83332C5.62604 6.83332 5.97596 6.73832 6.29183 6.58316L6.27363 6.60136L8.07388 8.40082C7.78319 8.88382 7.62813 9.43627 7.625 9.99999C7.625 10.7893 7.92583 11.5034 8.40479 12.0591L6.36467 14.0984C6.13586 14.0074 5.89208 13.9599 5.64583 13.9583C4.55492 13.9583 3.66667 14.8458 3.66667 15.9375C3.66667 17.0292 4.55492 17.9167 5.64583 17.9167C6.73675 17.9167 7.625 17.0292 7.625 15.9375C7.625 15.6834 7.57275 15.4419 7.48488 15.2179L9.73163 12.9711C10.0649 13.0899 10.418 13.1667 10.7917 13.1667C12.5381 13.1667 13.9583 11.7464 13.9583 9.99999C13.9583 9.49649 13.8293 9.02703 13.6195 8.60349L15.2955 6.71695C15.4981 6.78661 15.7119 6.83332 15.9375 6.83332C17.0292 6.83332 17.9167 5.94586 17.9167 4.85416C17.9167 3.76245 17.0292 2.87499 15.9375 2.87499ZM10.7917 11.5833C9.91846 11.5833 9.20833 10.8732 9.20833 9.99999C9.20833 9.12678 9.91846 8.41666 10.7917 8.41666C11.6649 8.41666 12.375 9.12678 12.375 9.99999C12.375 10.8732 11.6649 11.5833 10.7917 11.5833Z"
                    fill="#00FFA3"
                  />
                </svg>
                <div className="flex h-[34px] flex-1 flex-col justify-center font-geistRegular text-sm leading-[18px] text-white">
                  Dexes
                </div>
                <div className="flex items-center gap-[10px] rounded-[27px] bg-[rgba(255,255,255,0.09)] p-[2px]">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="19"
                    height="18"
                    viewBox="0 0 19 18"
                    fill="none"
                    className={`transition-transform duration-300 ${
                      openDexFilter ? "rotate-180" : "rotate-0"
                    }`}
                  >
                    <path
                      d="M5 6.75L9.5 11.25L14 6.75"
                      stroke="white"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
              <AnimatePresence>
                {openDexFilter && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mb-4 overflow-hidden px-4"
                  >
                    <div className="grid grid-cols-2 gap-2">
                      {dexData.map((item) => (
                        <CheckboxItem
                          key={item.id}
                          type="image"
                          item={item}
                          image={item.image}
                          imageStyle={item.customClass}
                          isChecked={
                            !!previewFilters.checkBoxes[
                              item.value as keyof typeof previewFilters.checkBoxes
                            ]
                          }
                          onToggle={() =>
                            toggleDexFilter(item.value, "preview")
                          }
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            <Separator />

            {/* General Filters */}
            <motion.div
              animate={openGeneralFilter ? "open" : "closed"}
              className="flex h-auto w-full flex-col items-center self-stretch"
            >
              <div
                className="flex w-full items-center justify-center gap-[5px] px-4 py-1"
                onClick={() => setOpenGeneralFilter((prev) => !prev)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="19"
                  height="18"
                  viewBox="0 0 19 18"
                  fill="none"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M11.8577 16.5H6.71499C5.86245 16.5 5.04483 16.1613 4.44199 15.5585C3.83916 14.9556 3.50049 14.138 3.50049 13.2855V4.71447C3.50049 3.86193 3.83916 3.04431 4.44199 2.44147C5.04483 1.83864 5.86245 1.49997 6.71499 1.49997H9.72099C10.3566 1.50011 10.9706 1.73089 11.449 2.14947L14.1752 4.53447C14.457 4.78088 14.6828 5.0847 14.8375 5.42555C14.9923 5.7664 15.0723 6.1364 15.0722 6.51072V13.2855C15.0722 13.7076 14.9891 14.1256 14.8275 14.5156C14.666 14.9056 14.4292 15.26 14.1307 15.5585C13.8322 15.857 13.4779 16.0937 13.0879 16.2553C12.6979 16.4168 12.2799 16.5 11.8577 16.5ZM11.8577 15H6.71499C6.48984 15 6.26689 14.9556 6.05888 14.8695C5.85087 14.7833 5.66186 14.657 5.50265 14.4978C5.34345 14.3386 5.21716 14.1496 5.131 13.9416C5.04484 13.7336 5.00049 13.5106 5.00049 13.2855V4.71447C5.00049 4.25976 5.18112 3.82367 5.50265 3.50213C5.82418 3.1806 6.26027 2.99997 6.71499 2.99997H9.72099C9.99328 3.00008 10.2563 3.09894 10.4612 3.27822L13.1875 5.66322C13.3084 5.76885 13.4053 5.89914 13.4716 6.04531C13.538 6.19149 13.5723 6.35018 13.5722 6.51072V13.2855C13.5722 13.5106 13.5279 13.7336 13.4417 13.9416C13.3556 14.1496 13.2293 14.3386 13.0701 14.4978C12.9109 14.657 12.7219 14.7833 12.5139 14.8695C12.3058 14.9556 12.0829 15 11.8577 15Z"
                    fill="#2D7AEC"
                  />
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M5.75049 8.99999C5.75049 8.80107 5.82951 8.61031 5.97016 8.46966C6.11081 8.329 6.30158 8.24999 6.50049 8.24999H10.2505C10.4494 8.24999 10.6402 8.329 10.7808 8.46966C10.9215 8.61031 11.0005 8.80107 11.0005 8.99999C11.0005 9.1989 10.9215 9.38966 10.7808 9.53032C10.6402 9.67097 10.4494 9.74999 10.2505 9.74999H6.50049C6.30158 9.74999 6.11081 9.67097 5.97016 9.53032C5.82951 9.38966 5.75049 9.1989 5.75049 8.99999ZM5.75049 12C5.75049 11.8011 5.82951 11.6103 5.97016 11.4697C6.11081 11.329 6.30158 11.25 6.50049 11.25H8.84424C9.04315 11.25 9.23392 11.329 9.37457 11.4697C9.51522 11.6103 9.59424 11.8011 9.59424 12C9.59424 12.1989 9.51522 12.3897 9.37457 12.5303C9.23392 12.671 9.04315 12.75 8.84424 12.75H6.50049C6.30158 12.75 6.11081 12.671 5.97016 12.5303C5.82951 12.3897 5.75049 12.1989 5.75049 12ZM10.2505 2.24998C10.4494 2.24998 10.6402 2.329 10.7808 2.46965C10.9215 2.61031 11.0005 2.80107 11.0005 2.99998V5.24998C11.0005 5.4489 11.0795 5.63966 11.2202 5.78031C11.3608 5.92097 11.5516 5.99998 11.7505 5.99998H13.6255C13.8244 5.99998 14.0152 6.079 14.1558 6.21966C14.2965 6.36031 14.3755 6.55107 14.3755 6.74999C14.3755 6.9489 14.2965 7.13966 14.1558 7.28031C14.0152 7.42097 13.8244 7.49999 13.6255 7.49999H11.7505C11.1538 7.49999 10.5815 7.26293 10.1595 6.84098C9.73754 6.41902 9.50049 5.84672 9.50049 5.24998V2.99998C9.50049 2.80107 9.57951 2.61031 9.72016 2.46965C9.86081 2.329 10.0516 2.24998 10.2505 2.24998Z"
                    fill="#2D7AEC"
                  />
                </svg>
                <div className="flex h-[34px] flex-1 flex-col justify-center font-geistRegular text-sm leading-[18px] text-white">
                  General
                </div>
                <div className="relative flex flex-1 flex-col justify-center font-geistRegular text-sm leading-[18px] text-white">
                  <div className="absolute left-3 top-1/2 z-10 aspect-square h-4 w-4 flex-shrink-0 -translate-y-1/2">
                    <Image
                      src="/icons/search-input.png"
                      alt="Search Icon"
                      fill
                      quality={100}
                      className="object-contain"
                    />
                  </div>
                  <Input
                    id="global-search"
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => handleGeneralSearch(e.target.value)}
                    placeholder="Search Filters"
                    className="relative -bottom-[0.5px] z-20 flex h-full w-full border border-transparent bg-transparent py-1 pl-9 pr-3 text-sm text-fontColorPrimary shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-neutral-950 placeholder:text-fontColorSecondary focus:border-primary focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                    autoComplete="off"
                  />
                </div>
                <div className="flex items-center gap-[10px] rounded-[27px] bg-[rgba(255,255,255,0.09)] p-[2px]">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="19"
                    height="18"
                    viewBox="0 0 19 18"
                    fill="none"
                    className={`transition-transform duration-300 ${
                      openGeneralFilter ? "rotate-180" : "rotate-0"
                    }`}
                  >
                    <path
                      d="M5 6.75L9.5 11.25L14 6.75"
                      stroke="white"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
              <AnimatePresence>
                {openGeneralFilter && (
                  <div className="flex flex-col bg-background px-4 pb-4">
                    <div className="flex flex-col">
                      {/* Input Ranges */}
                      {filteredGeneralFilters.length > 0 ? (
                        filteredGeneralFilters.map((field) =>
                          field.key === "devFundedBefore" ? (
                            // --- Custom UI for Dev Funded Before (numeric + unit select) ---
                            <div
                              key={field.key}
                              className="flex h-[70px] flex-col justify-center gap-y-2"
                            >
                              <Label className="text-sm text-fontColorSecondary">
                                {field.label}
                              </Label>
                              <div className="flex gap-x-2">
                                {/* Amount input */}
                                <div className="relative w-full">
                                  <Input
                                    key={`devFundedBefore-min-${resetKey}`}
                                    type="text"
                                    placeholder={field.minPlaceHolder || "0"}
                                    value={
                                      field.values.min !== undefined
                                        ? field.values.min /
                                          secondsMultipliers[
                                            devFundedBeforeUnit
                                          ]
                                        : ""
                                    }
                                    isNumeric
                                    decimalScale={0}
                                    onNumericValueChange={(values) => {
                                      const seconds =
                                        values.floatValue !== undefined
                                          ? values.floatValue *
                                            secondsMultipliers[
                                              devFundedBeforeUnit
                                            ]
                                          : undefined;
                                      setRangeFilter(
                                        "devFundedBefore" as any,
                                        seconds,
                                        "min",
                                        "preview",
                                      );
                                    }}
                                    onBlur={() =>
                                      handleNumericBlur(
                                        "devFundedBefore" as any,
                                        "min",
                                      )
                                    }
                                    className="border border-[#242436] bg-background text-end placeholder-fontColorSecondary"
                                  />
                                  <span className="absolute left-4 top-1/2 -translate-y-1/2 transform text-sm text-white">
                                    Value
                                  </span>
                                </div>
                                {/* Unit select */}
                                <div ref={unitRef} className="relative w-full">
                                  <button
                                    type="button"
                                    onClick={() => setIsUnitOpen((p) => !p)}
                                    className="flex h-9 w-full items-center rounded-[8px] border border-[#242436] bg-background px-3 text-sm text-fontColorPrimary focus:outline-none"
                                  >
                                    <span className="flex-1 truncate text-left">
                                      {devFundedBeforeUnit}
                                    </span>
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      width="18"
                                      height="18"
                                      viewBox="0 0 18 18"
                                      fill="none"
                                      className={`transition-transform duration-200 ${isUnitOpen ? "rotate-180" : "rotate-0"}`}
                                    >
                                      <path
                                        d="M4.5 6.75L9 11.25L13.5 6.75"
                                        stroke="white"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />
                                    </svg>
                                  </button>

                                  {isUnitOpen && (
                                    <div className="absolute z-50 mt-1 w-full rounded-[8px] border border-[#242436] bg-[#272730] p-2 shadow-md">
                                      <div className="flex flex-col space-y-2">
                                        {Object.keys(secondsMultipliers).map(
                                          (opt) => {
                                            const isSelected =
                                              devFundedBeforeUnit === opt;
                                            return (
                                              <div
                                                key={opt}
                                                className="group relative flex cursor-pointer select-none items-center rounded-[8px] px-3.5 py-2 text-sm hover:bg-white/[8%]"
                                                onClick={() => {
                                                  // Preserve the displayed numeric value while converting the
                                                  // underlying seconds to match the newly-selected unit.
                                                  const prevUnit =
                                                    devFundedBeforeUnit;
                                                  const prevMultiplier =
                                                    secondsMultipliers[
                                                      prevUnit as keyof typeof secondsMultipliers
                                                    ];
                                                  const nextMultiplier =
                                                    secondsMultipliers[
                                                      opt as keyof typeof secondsMultipliers
                                                    ];

                                                  const currentSeconds =
                                                    previewFilters
                                                      .devFundedBefore?.min;

                                                  // Calculate the numeric value currently shown to the user
                                                  // (in the *previous* unit) so that we can re-encode it using
                                                  // the multiplier of the *new* unit.
                                                  const displayedValue =
                                                    currentSeconds !== undefined
                                                      ? currentSeconds /
                                                        prevMultiplier
                                                      : undefined;

                                                  const newSeconds =
                                                    displayedValue !== undefined
                                                      ? displayedValue *
                                                        nextMultiplier
                                                      : undefined;

                                                  setDevFundedBeforeUnit(
                                                    opt as any,
                                                  );

                                                  if (
                                                    newSeconds !== undefined
                                                  ) {
                                                    setRangeFilter(
                                                      "devFundedBefore" as any,
                                                      newSeconds,
                                                      "min",
                                                      "preview",
                                                    );
                                                  }

                                                  setIsUnitOpen(false);
                                                }}
                                              >
                                                <span className="flex-1 text-left">
                                                  {opt}
                                                </span>
                                                <Checkbox
                                                  checked={isSelected}
                                                  onCheckedChange={() => {}}
                                                  className="ml-auto size-[18.5px] border-[#9090A3]"
                                                />
                                              </div>
                                            );
                                          },
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ) : field.key === "devFundedAfter" ? (
                            // --- Custom UI for Dev Funded After (numeric + unit select) ---
                            <div
                              key={field.key}
                              className="flex h-[70px] flex-col justify-center gap-y-2"
                            >
                              <Label className="text-sm text-fontColorSecondary">
                                {field.label}
                              </Label>
                              <div className="flex gap-x-2">
                                {/* Amount input */}
                                <div className="relative w-full">
                                  <Input
                                    key={`devFundedAfter-min-${resetKey}`}
                                    type="text"
                                    placeholder={field.minPlaceHolder || "0"}
                                    value={
                                      field.values.min !== undefined
                                        ? field.values.min /
                                          secondsMultipliers[devFundedAfterUnit]
                                        : ""
                                    }
                                    isNumeric
                                    decimalScale={0}
                                    onNumericValueChange={(values) => {
                                      const seconds =
                                        values.floatValue !== undefined
                                          ? values.floatValue *
                                            secondsMultipliers[
                                              devFundedAfterUnit
                                            ]
                                          : undefined;
                                      setRangeFilter(
                                        "devFundedAfter" as any,
                                        seconds,
                                        "min",
                                        "preview",
                                      );
                                    }}
                                    onBlur={() =>
                                      handleNumericBlur(
                                        "devFundedAfter" as any,
                                        "min",
                                      )
                                    }
                                    className="border border-[#242436] bg-background text-end placeholder-fontColorSecondary"
                                  />
                                  <span className="absolute left-4 top-1/2 -translate-y-1/2 transform text-sm text-white">
                                    Value
                                  </span>
                                </div>
                                {/* Unit select */}
                                <div
                                  ref={unitAfterRef}
                                  className="relative w-full"
                                >
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setIsUnitAfterOpen((p) => !p)
                                    }
                                    className="flex h-9 w-full items-center rounded-[8px] border border-[#242436] bg-background px-3 text-sm text-fontColorPrimary focus:outline-none"
                                  >
                                    <span className="flex-1 truncate text-left">
                                      {devFundedAfterUnit}
                                    </span>
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      width="18"
                                      height="18"
                                      viewBox="0 0 18 18"
                                      fill="none"
                                      className={`transition-transform duration-200 ${isUnitAfterOpen ? "rotate-180" : "rotate-0"}`}
                                    >
                                      <path
                                        d="M4.5 6.75L9 11.25L13.5 6.75"
                                        stroke="white"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />
                                    </svg>
                                  </button>

                                  {isUnitAfterOpen && (
                                    <div className="absolute z-50 mt-1 w-full rounded-[8px] border border-[#242436] bg-[#272730] p-2 shadow-md">
                                      <div className="flex flex-col space-y-2">
                                        {Object.keys(secondsMultipliers).map(
                                          (opt) => {
                                            const isSelected =
                                              devFundedAfterUnit === opt;
                                            return (
                                              <div
                                                key={opt}
                                                className="group relative flex cursor-pointer select-none items-center rounded-[8px] px-3.5 py-2 text-sm hover:bg-white/[8%]"
                                                onClick={() => {
                                                  const prevUnit =
                                                    devFundedAfterUnit;
                                                  const prevMultiplier =
                                                    secondsMultipliers[
                                                      prevUnit as keyof typeof secondsMultipliers
                                                    ];
                                                  const nextMultiplier =
                                                    secondsMultipliers[
                                                      opt as keyof typeof secondsMultipliers
                                                    ];

                                                  const currentSeconds =
                                                    previewFilters
                                                      .devFundedAfter?.min;

                                                  const displayedValue =
                                                    currentSeconds !== undefined
                                                      ? currentSeconds /
                                                        prevMultiplier
                                                      : undefined;

                                                  const newSeconds =
                                                    displayedValue !== undefined
                                                      ? displayedValue *
                                                        nextMultiplier
                                                      : undefined;

                                                  setDevFundedAfterUnit(
                                                    opt as any,
                                                  );

                                                  if (
                                                    newSeconds !== undefined
                                                  ) {
                                                    setRangeFilter(
                                                      "devFundedAfter" as any,
                                                      newSeconds,
                                                      "min",
                                                      "preview",
                                                    );
                                                  }

                                                  setIsUnitAfterOpen(false);
                                                }}
                                              >
                                                <span className="flex-1 text-left">
                                                  {opt}
                                                </span>
                                                <Checkbox
                                                  checked={isSelected}
                                                  onCheckedChange={() => {}}
                                                  className="ml-auto size-[18.5px] border-[#9090A3]"
                                                />
                                              </div>
                                            );
                                          },
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ) : (
                            // --- Default numeric min/max inputs for other filters ---
                            <div
                              key={field.key}
                              className="flex h-[70px] flex-col justify-center gap-y-2"
                            >
                              <Label className="text-sm text-fontColorSecondary">
                                {field.label}
                              </Label>
                              <div className="flex gap-x-2">
                                {/* Min input */}
                                <div className="relative w-full">
                                  <Input
                                    key={`general-${field.key}-min-${resetKey}`}
                                    type="text"
                                    placeholder={
                                      field.minPlaceHolder || undefined
                                    }
                                    value={field.values.min ?? ""}
                                    isNumeric
                                    decimalScale={6}
                                    onKeyDown={(e) => {
                                      if (!isPercentageField(field.key)) return;
                                      const current = Number(
                                        field.values.min ?? 0,
                                      );
                                      const isNumberKey = /^[0-9]$/.test(e.key);
                                      if (isNumberKey && current >= 100) {
                                        e.preventDefault();
                                      }
                                    }}
                                    onNumericValueChange={(values) => {
                                      const clampedValues =
                                        isPercentageField(
                                          field.key as string,
                                        ) && values.floatValue !== undefined
                                          ? {
                                              ...values,
                                              floatValue: Math.min(
                                                values.floatValue,
                                                100,
                                              ),
                                            }
                                          : values;
                                      handleNumericValueChange(
                                        field.key as any,
                                        "min",
                                        clampedValues,
                                      );
                                    }}
                                    onBlur={() =>
                                      handleNumericBlur(field.key as any, "min")
                                    }
                                    className="border border-[#242436] bg-background text-end placeholder-fontColorSecondary"
                                  />
                                  <span className="absolute left-4 top-1/2 -translate-y-1/2 transform text-sm text-fontColorSecondary">
                                    Min
                                  </span>
                                </div>
                                {/* Max input */}
                                <div className="relative w-full">
                                  <Input
                                    key={`general-${field.key}-max-${resetKey}`}
                                    type="text"
                                    placeholder={field?.maxPlaceholder || "-"}
                                    value={field.values.max ?? ""}
                                    isNumeric
                                    decimalScale={6}
                                    onKeyDown={(e) => {
                                      if (!isPercentageField(field.key)) return;
                                      const current = Number(
                                        field.values.max ?? 0,
                                      );
                                      const isNumberKey = /^[0-9]$/.test(e.key);
                                      if (isNumberKey && current >= 100) {
                                        e.preventDefault();
                                      }
                                    }}
                                    onNumericValueChange={(values) => {
                                      const clampedValues =
                                        isPercentageField(
                                          field.key as string,
                                        ) && values.floatValue !== undefined
                                          ? {
                                              ...values,
                                              floatValue: Math.min(
                                                values.floatValue,
                                                100,
                                              ),
                                            }
                                          : values;
                                      handleNumericValueChange(
                                        field.key as any,
                                        "max",
                                        clampedValues,
                                      );
                                    }}
                                    onBlur={() =>
                                      handleNumericBlur(field.key as any, "max")
                                    }
                                    className="border border-[#242436] bg-background text-end placeholder-fontColorSecondary"
                                  />
                                  <span className="absolute left-4 top-1/2 -translate-y-1/2 transform text-sm text-fontColorSecondary">
                                    Max
                                  </span>
                                </div>
                              </div>
                            </div>
                          ),
                        )
                      ) : (
                        <div className="flex h-[70px] flex-col justify-center gap-y-2">
                          <Label className="text-sm text-fontColorSecondary">
                            No matching filters found
                          </Label>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </AnimatePresence>
            </motion.div>

            <Separator />

            {/* Security Filters */}
            <motion.div
              animate={openSecurityFilter ? "open" : "closed"}
              className="flex h-auto w-full flex-col items-center self-stretch"
            >
              <div
                className="flex w-full items-center justify-center gap-[5px] px-4 py-1"
                onClick={() => setOpenSecurityFilter((prev) => !prev)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="15"
                  height="14"
                  viewBox="0 0 15 14"
                  fill="none"
                >
                  <path
                    d="M7.49999 12.8333C7.49999 12.8333 12.1667 10.5 12.1667 7.00001V2.91667L7.49999 1.16667L2.83333 2.91667V7.00001C2.83333 10.5 7.49999 12.8333 7.49999 12.8333Z"
                    stroke="#49C78E"
                    strokeWidth="1.16667"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="flex h-[34px] flex-1 flex-col justify-center font-geistRegular text-sm leading-[18px] text-white">
                  Security
                </div>
                <div className="relative flex flex-1 flex-col justify-center font-geistRegular text-sm leading-[18px] text-white">
                  <div className="absolute left-3 top-1/2 z-10 aspect-square h-4 w-4 flex-shrink-0 -translate-y-1/2">
                    <Image
                      src="/icons/search-input.png"
                      alt="Search Icon"
                      fill
                      quality={100}
                      className="object-contain"
                    />
                  </div>
                  <Input
                    id="security-search"
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => handleSecuritySearch(e.target.value)}
                    placeholder="Search Filters"
                    className="relative -bottom-[0.5px] z-20 flex h-full w-full border border-transparent bg-transparent py-1 pl-9 pr-3 text-sm text-fontColorPrimary shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-neutral-950 placeholder:text-fontColorSecondary focus:border-primary focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                    autoComplete="off"
                  />
                </div>
                <div className="flex items-center gap-[10px] rounded-[27px] bg-[rgba(255,255,255,0.09)] p-[2px]">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="19"
                    height="18"
                    viewBox="0 0 19 18"
                    fill="none"
                    className={`transition-transform duration-300 ${
                      openSecurityFilter ? "rotate-180" : "rotate-0"
                    }`}
                  >
                    <path
                      d="M5 6.75L9.5 11.25L14 6.75"
                      stroke="white"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>

              <AnimatePresence>
                {openSecurityFilter && (
                  <div className="flex flex-col bg-background px-4 pb-4">
                    <div className="flex flex-col">
                      {/* Input Ranges */}
                      {filteredSecurityFilters.length > 0 ? (
                        filteredSecurityFilters.map((field) => (
                          <div
                            key={field.key}
                            className="flex h-[70px] flex-col justify-center gap-y-2"
                          >
                            <Label className="text-sm text-fontColorSecondary">
                              {field.label}
                            </Label>
                            <div className="flex gap-x-2">
                              <div className="relative w-full">
                                <Input
                                  key={`security-${field.key}-min-${resetKey}`}
                                  type="text"
                                  placeholder={field.minPlaceHolder || "0"}
                                  value={field.values.min ?? ""}
                                  isNumeric
                                  decimalScale={
                                    isPercentageField(field.key as string)
                                      ? 0
                                      : 6
                                  }
                                  onKeyDown={(e) => {
                                    if (!isPercentageField(field.key)) return;
                                    const current = Number(
                                      field.values.min ?? 0,
                                    );
                                    const isNumberKey = /^[0-9]$/.test(e.key);

                                    if (isNumberKey && current >= 100) {
                                      e.preventDefault();
                                    }
                                  }}
                                  onNumericValueChange={(values) => {
                                    const clampedValues =
                                      isPercentageField(field.key as string) &&
                                      values.floatValue !== undefined
                                        ? {
                                            ...values,
                                            floatValue: Math.min(
                                              values.floatValue,
                                              100,
                                            ),
                                          }
                                        : values;

                                    handleNumericValueChange(
                                      field.key as any,
                                      "min",
                                      clampedValues,
                                    );
                                  }}
                                  onBlur={() =>
                                    handleNumericBlur(field.key as any, "min")
                                  }
                                  className={cn(
                                    "border border-[#242436] bg-background text-end placeholder-fontColorSecondary",
                                    isPercentageField(field.key as string) &&
                                      "pr-8",
                                  )}
                                />
                                {isPercentageField(field.key as string) && (
                                  <span className="absolute right-4 top-1/2 -translate-y-1/2 transform text-sm text-fontColorSecondary">
                                    %
                                  </span>
                                )}
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 transform text-sm text-fontColorSecondary">
                                  Min
                                </span>
                              </div>
                              <div className="relative w-full">
                                <Input
                                  key={`security-${field.key}-max-${resetKey}`}
                                  type="text"
                                  placeholder={field.maxPlaceholder || "0"}
                                  value={field.values.max ?? ""}
                                  isNumeric
                                  decimalScale={
                                    isPercentageField(field.key as string)
                                      ? 0
                                      : 6
                                  }
                                  onKeyDown={(e) => {
                                    if (!isPercentageField(field.key)) return;
                                    const current = Number(
                                      field.values.max ?? 0,
                                    );
                                    const isNumberKey = /^[0-9]$/.test(e.key);

                                    if (isNumberKey && current >= 100) {
                                      e.preventDefault();
                                    }
                                  }}
                                  onNumericValueChange={(values) => {
                                    const clampedValues =
                                      isPercentageField(field.key as string) &&
                                      values.floatValue !== undefined
                                        ? {
                                            ...values,
                                            floatValue: Math.min(
                                              values.floatValue,
                                              100,
                                            ),
                                          }
                                        : values;

                                    handleNumericValueChange(
                                      field.key as any,
                                      "max",
                                      clampedValues,
                                    );
                                  }}
                                  onBlur={() =>
                                    handleNumericBlur(field.key as any, "max")
                                  }
                                  className={cn(
                                    "border border-[#242436] bg-background text-end placeholder-fontColorSecondary",
                                    isPercentageField(field.key as string) &&
                                      "pr-8",
                                  )}
                                />
                                {isPercentageField(field.key as string) && (
                                  <span className="absolute right-4 top-1/2 -translate-y-1/2 transform text-sm text-fontColorSecondary">
                                    %
                                  </span>
                                )}
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 transform text-sm text-fontColorSecondary">
                                  Max
                                </span>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="flex h-[70px] flex-col justify-center gap-y-2">
                          <Label className="text-sm text-fontColorSecondary">
                            No matching filters found
                          </Label>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </AnimatePresence>
            </motion.div>

            <Separator />

            {/* Discord Mentions */}
            {/* <motion.div
              animate={openDiscordFilter ? "open" : "closed"}
              className="flex h-auto w-full flex-col"
            >
              <button
                type="button"
                onClick={() => setOpenDiscordFilter((prev) => !prev)}
                className="mb-3 flex h-[40px] w-full items-center justify-between border-y border-border bg-secondary px-4"
              >
                <div className="flex items-center gap-x-2">
                  <div className="relative aspect-square h-[18px] w-[18px] focus:border-none focus:outline-none focus:ring-0">
                    <Image
                      src="/icons/blue-discord.svg"
                      alt="Gray Setting Icon"
                      fill
                      quality={50}
                      className="object-contain"
                    />
                  </div>
                  <span className="inline-block text-nowrap font-geistSemiBold text-sm text-fontColorPrimary">
                    Discord Mentions
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="relative aspect-square h-3 w-3 flex-shrink-0 cursor-pointer">
                    <Image
                      src="/icons/dropdown-arrow.png"
                      alt="Accordion Icon"
                      fill
                      quality={50}
                      className={`object-contain transition-transform duration-300 ${
                        openDiscordFilter ? "rotate-180" : "rotate-0"
                      }`}
                    />
                  </div>
                </div>
              </button> */}

            <motion.div
              animate={openDiscordFilter ? "open" : "closed"}
              className="flex h-auto w-full flex-col items-center self-stretch"
            >
              <div
                className="flex w-full items-center justify-center gap-[5px] px-4 py-1"
                onClick={() => setOpenDiscordFilter((prev) => !prev)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="15"
                  height="14"
                  viewBox="0 0 15 14"
                  fill="none"
                >
                  <g clip-path="url(#clip0_2001_474)">
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M9.69799 1.66C9.54544 1.64978 9.39443 1.69583 9.27354 1.78945C9.15265 1.88306 9.07027 2.01774 9.04199 2.168L8.94199 2.698H6.05799L5.95799 2.168C5.92971 2.01774 5.84733 1.88306 5.72645 1.78945C5.60556 1.69583 5.45455 1.64978 5.30199 1.66C4.34399 1.725 3.71199 1.826 3.30799 1.916C3.15573 1.94821 3.00547 1.98928 2.85799 2.039C2.80243 2.05759 2.74771 2.07861 2.69399 2.102L2.67899 2.109L2.67299 2.112L2.66999 2.114H2.66799L2.94699 2.674L2.66699 2.115C2.56914 2.16289 2.48617 2.23653 2.42699 2.328C1.91299 3.098 1.43699 4.363 1.08899 5.718C0.736993 7.087 0.498993 8.62 0.498993 9.961C0.498993 10.084 0.535993 10.205 0.603993 10.307C1.00099 10.904 2.20799 11.999 4.18899 12.395C4.41899 12.441 4.65399 12.355 4.79899 12.173L6.16299 10.469C7.04718 10.6248 7.95181 10.6248 8.83599 10.469L10.2 12.173C10.2719 12.2619 10.3667 12.3295 10.4742 12.3686C10.5817 12.4077 10.6977 12.4168 10.81 12.395C12.791 11.999 13.998 10.904 14.396 10.307C14.4635 10.2046 14.4997 10.0847 14.5 9.962C14.5 8.622 14.263 7.088 13.912 5.719C13.564 4.364 13.088 3.099 12.574 2.329C12.5148 2.23753 12.4318 2.16389 12.334 2.116L12.331 2.115L12.328 2.113L12.321 2.11L12.306 2.103C12.2536 2.07728 12.1991 2.0562 12.143 2.04C11.9955 1.99028 11.8453 1.94921 11.693 1.917C11.288 1.827 10.656 1.726 9.69799 1.661M2.29799 6.03C2.60399 4.837 2.99199 3.815 3.35899 3.193C3.41499 3.177 3.48899 3.15833 3.58099 3.137C3.99402 3.0493 4.41219 2.98784 4.83299 2.953L4.92299 3.439C4.97899 3.734 5.23699 3.949 5.53799 3.949H9.46199C9.76199 3.949 10.02 3.734 10.076 3.439L10.166 2.953C10.762 3.01 11.163 3.08 11.419 3.137C11.5117 3.15767 11.5857 3.17633 11.641 3.193C12.007 3.815 12.395 4.837 12.701 6.03C13.014 7.252 13.225 8.59 13.248 9.753C12.942 10.107 12.175 10.753 10.93 11.086L10.142 10.101C10.547 9.934 10.894 9.729 11.13 9.493C11.188 9.43495 11.2341 9.36605 11.2655 9.29021C11.2969 9.21437 11.3131 9.13309 11.3131 9.051C11.3131 8.96891 11.2969 8.88763 11.2655 8.81179C11.2341 8.73595 11.188 8.66704 11.13 8.609C11.0719 8.55095 11.003 8.50491 10.9272 8.4735C10.8514 8.44208 10.7701 8.42592 10.688 8.42592C10.6059 8.42592 10.5246 8.44208 10.4488 8.4735C10.3729 8.50491 10.304 8.55095 10.246 8.609C10.091 8.764 9.64399 9.007 8.94299 9.172C7.99354 9.39173 7.00645 9.39173 6.05699 9.172C5.35499 9.007 4.90899 8.764 4.75399 8.609C4.63677 8.49177 4.47778 8.42592 4.31199 8.42592C4.14621 8.42592 3.98722 8.49177 3.86999 8.609C3.75277 8.72622 3.68691 8.88522 3.68691 9.051C3.68691 9.13309 3.70308 9.21437 3.73449 9.29021C3.76591 9.36605 3.81195 9.43495 3.86999 9.493C4.10599 9.729 4.45299 9.934 4.85799 10.101L4.06999 11.086C2.82399 10.754 2.05799 10.107 1.75099 9.753C1.77399 8.59 1.98499 7.252 2.29899 6.03M5.15799 5.32C4.86214 5.32 4.57841 5.43752 4.36922 5.64672C4.16002 5.85592 4.04249 6.13965 4.04249 6.4355C4.04249 6.73135 4.16002 7.01508 4.36922 7.22428C4.57841 7.43347 4.86214 7.551 5.15799 7.551C5.45371 7.551 5.73731 7.43353 5.94642 7.22442C6.15552 7.01532 6.27299 6.73172 6.27299 6.436C6.27299 6.14028 6.15552 5.85668 5.94642 5.64757C5.73731 5.43847 5.45371 5.32 5.15799 5.32ZM9.57199 5.321C9.27614 5.321 8.99241 5.43852 8.78322 5.64772C8.57402 5.85692 8.45649 6.14065 8.45649 6.4365C8.45649 6.73235 8.57402 7.01608 8.78322 7.22528C8.99241 7.43447 9.27614 7.552 9.57199 7.552C9.86771 7.552 10.1513 7.43453 10.3604 7.22542C10.5695 7.01632 10.687 6.73272 10.687 6.437C10.687 6.14128 10.5695 5.85768 10.3604 5.64857C10.1513 5.43947 9.86771 5.321 9.57199 5.321Z"
                      fill="#5764F0"
                    />
                  </g>
                  <defs>
                    <clipPath id="clip0_2001_474">
                      <rect
                        width="14"
                        height="14"
                        fill="white"
                        transform="translate(0.5)"
                      />
                    </clipPath>
                  </defs>
                </svg>
                <div className="flex h-[34px] flex-1 flex-col justify-center font-geistRegular text-sm leading-[18px] text-white">
                  Discord Mentions
                </div>
                <div className="flex items-center gap-[10px] rounded-[27px] bg-[rgba(255,255,255,0.09)] p-[2px]">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="19"
                    height="18"
                    viewBox="0 0 19 18"
                    fill="none"
                    className={`transition-transform duration-300 ${
                      openDiscordFilter ? "rotate-180" : "rotate-0"
                    }`}
                  >
                    <path
                      d="M5 6.75L9.5 11.25L14 6.75"
                      stroke="white"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>

              <AnimatePresence>
                {openDiscordFilter && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mb-4 w-full overflow-hidden px-4"
                  >
                    <div className="grid grid-cols-2 gap-2">
                      {discordMentionsData.map((item) => (
                        <CheckboxItem
                          key={item.id}
                          type="image"
                          item={item}
                          image={item.image}
                          isChecked={
                            !!previewFilters.checkBoxes[
                              item.id as keyof typeof previewFilters.checkBoxes
                            ]
                          }
                          onToggle={() =>
                            toggleCheckbox(
                              item.id as keyof typeof previewFilters.checkBoxes,
                              "preview",
                            )
                          }
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            <Separator />

            {/* Wallet Tracked */}
            {/* <motion.div
              animate={openWalletTrackedFilter ? "open" : "closed"}
              className="flex h-auto w-full flex-col"
            >
              <button
                type="button"
                onClick={() => setOpenWalletTrackedFilter((prev) => !prev)}
                className="mb-3 flex h-[40px] w-full items-center justify-between border-y border-border bg-secondary px-4"
              >
                <div className="flex items-center gap-x-2">
                  <div className="relative aspect-square h-[18px] w-[18px] focus:border-none focus:outline-none focus:ring-0">
                    <Image
                      src="/icons/orange-wallet.svg"
                      alt="Gray Setting Icon"
                      fill
                      quality={50}
                      className="object-contain"
                    />
                  </div>
                  <span className="inline-block text-nowrap font-geistSemiBold text-sm text-fontColorPrimary">
                    Wallet Tracked
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="relative aspect-square h-3 w-3 flex-shrink-0 cursor-pointer">
                    <Image
                      src="/icons/dropdown-arrow.png"
                      alt="Accordion Icon"
                      fill
                      quality={50}
                      className={`object-contain transition-transform duration-300 ${
                        openWalletTrackedFilter ? "rotate-180" : "rotate-0"
                      }`}
                    />
                  </div>
                </div>
              </button>

              <AnimatePresence>
                {openWalletTrackedFilter && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mb-4 overflow-hidden px-4"
                  >
                    <div className="grid grid-cols-2 gap-2">
                      {walletTrackedData.map((item) => (
                        <CheckboxItem
                          key={item.id}
                          type="text"
                          item={item}
                          isChecked={
                            !!previewFilters.checkBoxes[
                              item.id as keyof typeof previewFilters.checkBoxes
                            ]
                          }
                          onToggle={() =>
                            toggleCheckbox(
                              item.id as
                                | "mintAuth"
                                | "freezeAuth"
                                | "onlyLPBurned"
                                | "top10Holders"
                                | "hideBundled"
                                | "withAtLeast1Social"
                                | "showHide",
                              "preview",
                            )
                          }
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div> */}

            {/* Socials */}
            {/* <motion.div
              animate={openSocialsFilter ? "open" : "closed"}
              className="flex h-auto w-full flex-col"
            >
              <button
                type="button"
                onClick={() => setOpenSocialsFilter((prev) => !prev)}
                className="mb-3 flex h-[40px] w-full items-center justify-between border-y border-border bg-secondary px-4"
              >
                <div className="flex items-center gap-x-2">
                  <div className="relative aspect-square h-[18px] w-[18px] focus:border-none focus:outline-none focus:ring-0">
                    <Image
                      src="/icons/tabler_social.svg"
                      alt="Gray Setting Icon"
                      fill
                      quality={50}
                      className="object-contain"
                    />
                  </div>
                  <span className="inline-block text-nowrap font-geistSemiBold text-sm text-fontColorPrimary">
                    Socials
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="relative aspect-square h-3 w-3 flex-shrink-0 cursor-pointer">
                    <Image
                      src="/icons/dropdown-arrow.png"
                      alt="Accordion Icon"
                      fill
                      quality={50}
                      className={`object-contain transition-transform duration-300 ${
                        openSocialsFilter ? "rotate-180" : "rotate-0"
                      }`}
                    />
                  </div>
                </div>
              </button> */}

            <motion.div
              animate={openSocialsFilter ? "open" : "closed"}
              className="flex h-auto w-full flex-col items-center self-stretch"
            >
              <div
                className="flex w-full items-center justify-center gap-[5px] px-4 py-1"
                onClick={() => setOpenSocialsFilter((prev) => !prev)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="15"
                  height="14"
                  viewBox="0 0 15 14"
                  fill="none"
                >
                  <path
                    d="M7.5 4.08333C7.19058 4.08333 6.89383 3.96042 6.67504 3.74162C6.45625 3.52283 6.33333 3.22609 6.33333 2.91667C6.33333 2.60725 6.45625 2.3105 6.67504 2.09171C6.89383 1.87292 7.19058 1.75 7.5 1.75C7.80942 1.75 8.10617 1.87292 8.32496 2.09171C8.54375 2.3105 8.66667 2.60725 8.66667 2.91667C8.66667 3.22609 8.54375 3.52283 8.32496 3.74162C8.10617 3.96042 7.80942 4.08333 7.5 4.08333ZM7.5 4.08333V6.41667M7.5 6.41667C7.96413 6.41667 8.40925 6.60104 8.73744 6.92923C9.06563 7.25742 9.25 7.70254 9.25 8.16667C9.25 8.6308 9.06563 9.07591 8.73744 9.4041C8.40925 9.73229 7.96413 9.91667 7.5 9.91667C7.03587 9.91667 6.59075 9.73229 6.26256 9.4041C5.93437 9.07591 5.75 8.6308 5.75 8.16667C5.75 7.70254 5.93437 7.25742 6.26256 6.92923C6.59075 6.60104 7.03587 6.41667 7.5 6.41667ZM4.40833 10.3833L6.04167 9.21667M10.5917 10.3833L8.95833 9.21667M2.25 11.0833C2.25 11.3928 2.37292 11.6895 2.59171 11.9083C2.8105 12.1271 3.10725 12.25 3.41667 12.25C3.72609 12.25 4.02283 12.1271 4.24162 11.9083C4.46042 11.6895 4.58333 11.3928 4.58333 11.0833C4.58333 10.7739 4.46042 10.4772 4.24162 10.2584C4.02283 10.0396 3.72609 9.91667 3.41667 9.91667C3.10725 9.91667 2.8105 10.0396 2.59171 10.2584C2.37292 10.4772 2.25 10.7739 2.25 11.0833ZM10.4167 11.0833C10.4167 11.3928 10.5396 11.6895 10.7584 11.9083C10.9772 12.1271 11.2739 12.25 11.5833 12.25C11.8928 12.25 12.1895 12.1271 12.4083 11.9083C12.6271 11.6895 12.75 11.3928 12.75 11.0833C12.75 10.7739 12.6271 10.4772 12.4083 10.2584C12.1895 10.0396 11.8928 9.91667 11.5833 9.91667C11.2739 9.91667 10.9772 10.0396 10.7584 10.2584C10.5396 10.4772 10.4167 10.7739 10.4167 11.0833Z"
                    stroke="#F34C4C"
                    strokeWidth="1.16667"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="flex h-[34px] flex-1 flex-col justify-center font-geistRegular text-sm leading-[18px] text-white">
                  Socials
                </div>
                <div className="flex items-center gap-[10px] rounded-[27px] bg-[rgba(255,255,255,0.09)] p-[2px]">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="19"
                    height="18"
                    viewBox="0 0 19 18"
                    fill="none"
                    className={`transition-transform duration-300 ${
                      openSocialsFilter ? "rotate-180" : "rotate-0"
                    }`}
                  >
                    <path
                      d="M5 6.75L9.5 11.25L14 6.75"
                      stroke="white"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
              <AnimatePresence>
                {openSocialsFilter && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mb-4 w-full overflow-hidden px-4"
                  >
                    <div className="grid grid-cols-2 gap-2">
                      {socialsData.map((item) => (
                        <CheckboxItem
                          key={item.id}
                          type={(item?.type as any) || "image"}
                          item={item}
                          image={item.image}
                          imageStyle="size-5"
                          isChecked={
                            !!previewFilters.checkBoxes[
                              item.id as keyof typeof previewFilters.checkBoxes
                            ]
                          }
                          onToggle={() =>
                            toggleCheckbox(
                              item.id as keyof typeof previewFilters.checkBoxes,
                              "preview",
                            )
                          }
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </OverlayScrollbarsComponent>
      </div>
    </div>
  );
});

IgniteFilterPanel.displayName = "IgniteFilterPanel";

export default IgniteFilterPanel;
