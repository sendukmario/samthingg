"use client";

// ######## Libraries 📦 & Hooks 🪝 ########
import { useEffect, useRef, useMemo, useState, useCallback } from "react";
import { useActiveTrendingTimeStore } from "@/stores/dex-setting/use-active-trending-time-preset.store";
import { useUserInfoStore } from "@/stores/user/use-user-info.store";
import { usePopupStore } from "@/stores/use-popup-state.store";
// ######## APIs 🛜 ########
// ######## Components 🧩 ########
import NoScrollLayout from "@/components/layouts/NoScrollLayout";
import PageHeading from "@/components/customs/headings/PageHeading";
import DexBuySettings from "@/components/customs/DexBuySettings";
import IgniteTokensSection from "@/components/customs/sections/IgniteTokensSection";
import IgniteSubHeader from "@/components/customs/IgniteSubHeader";
import IgniteFilterPanel from "@/components/customs/ignite-component/IgniteFilterPanel";

// ######## Utils & Helpers 🤝 ########
// ######## Types 🗨️ ########
import type { WSMessage } from "@/types/ws-general";
import { useMoreFilterStore } from "@/stores/dex-setting/use-more-filter.store";
import { useWebSocket } from "@/hooks/useWebsocketNew";
import { IgniteToken, IgniteTokensQueryParams } from "@/apis/rest/igniteTokens";
import { isRelevantMessage } from "@/utils/websocket/isRelevantMessage";
import { useIgnitePaused } from "@/stores/trending/use-ignite-paused.store";
import { useIgniteFilterPanelStore } from "@/stores/ignite/use-ignite-filter-panel.store";
import { useHiddenTokensStore } from "@/stores/cosmo/use-hidden-tokens.store";
import { convertIgniteLamports } from "@/utils/lamportsConverter";
import { isEqual } from "lodash";

// ######## Constants 📝 ########
const PING_PRICE_STORAGE_KEY = "ignitePingPrices";

// Simple responsive margin calculation for Ignite content
const useIgniteMargins = () => {
  const [margins, setMargins] = useState({ left: 0, right: 0 });
  const currentSnappedPopup = usePopupStore(
    (state) => state.currentSnappedPopup,
  );

  const updateMargins = useCallback(() => {
    const width = window.innerWidth;
    const hasSnappedPopup =
      currentSnappedPopup.left.length > 0 ||
      currentSnappedPopup.right.length > 0;

    if (hasSnappedPopup) {
      // When popup sections are active, use minimal margins
      setMargins({ left: 0, right: 0 });
    } else if (width >= 1280 && width < 1440) {
      // When no popup sections, use responsive margins (75% content width)
      const contentWidth = width * 0.75;
      const totalMargin = width - contentWidth;
      const sideMargin = Math.floor(totalMargin / 2);
      setMargins({ left: sideMargin, right: sideMargin });
    } else if (width >= 1440 && width < 1920) {
      // Extra large screens
      const contentWidth = width * 0.7;
      const totalMargin = width - contentWidth;
      const sideMargin = Math.floor(totalMargin / 2);
      setMargins({ left: sideMargin, right: sideMargin });
    } else if (width >= 1920) {
      // Extra extra large screens
      const contentWidth = width * 0.6;
      const totalMargin = width - contentWidth;
      const sideMargin = Math.floor(totalMargin / 2);
      setMargins({ left: sideMargin, right: sideMargin });
    } else {
      // Small screens
      setMargins({ left: 0, right: 0 });
    }
  }, [currentSnappedPopup]);

  useEffect(() => {
    updateMargins();
    window.addEventListener("resize", updateMargins);
    return () => window.removeEventListener("resize", updateMargins);
  }, [updateMargins]);

  useEffect(() => {
    // Ensure margins are updated when currentSnappedPopup changes
    updateMargins();
  }, [currentSnappedPopup, updateMargins]);

  return margins;
};

// Align with ids defined in discordMentionsData in IgniteFilterPanel
const allowedDiscordKeys = [
  "Potion",
  "Vanquish",
  "Champs Only",
  "Minted",
  "Shocked Trading",
  "Technical Alpha Group",
]; // Discord mentions

// Align with ids defined in kolData in IgniteFilterPanel
const allowedKol = ["goodTrader7", "cooker", "euris", "waddles1"]; // Key Opinion Leaders

// Comprehensive list of supported DEX identifiers used by the Ignite filter panel.
// KEEP THIS IN-SYNC with `dexData` inside `IgniteFilterPanel`.
const allowedDexes = [
  // Existing entries
  "Moonshot",
  "PumpFun",
  "Dynamic Bonding Curve",
  "Launch a Coin",
  "Candle Tv",
  "Bonk",
  "LaunchLab",
  // Raydium variants
  "Raydium AMM",
  "Raydium CPMM",
  "Raydium CLMM",
  // Other DEXes
  "Boop",
  "Orca",
  "Jupiter Studio",
  "Bags",
  "Believe",
  "MoonIt",
  // Meteora variants
  "Meteora AMM",
  "Meteora AMM V2",
  "Meteora DLMM",
  "Heaven",
]; // Dex identifiers recognised by backend & client

const launchPadList = [
  "Bonk",
  "Launch a Coin",
  "Moonshot",
  "Jupiter Studio",
  "Bags",
];

const isLaunchpad = (dex?: string | null) => Boolean(dex && launchPadList.includes(dex));


// Mapping from UI DEX names to backend identifiers
// const dexNameToBackendMap: Record<string, string> = {
//   Moonshot: "moonshot",
//   PumpFun: "pumpfun",
//   "Dynamic Bonding Curve": "dynamic_bonding_curve",
//   "Launch a Coin": "launch_a_coin",
//   "Candle Tv": "candle_tv",
//   Bonk: "bonk",
//   LaunchLab: "launchlab",
//   "Raydium AMM": "raydium_amm",
//   "Raydium CPMM": "raydium_cpmm",
//   "Raydium CLMM": "raydium_clmm",
//   Boop: "boop",
//   Orca: "orca",
//   "Jupiter Studio": "jupiter_studio",
//   Bags: "bags",
//   Believe: "believe",
//   Moonit: "moonit",
//   "Meteora AMM": "meteora_amm",
//   "Meteora AMM V2": "meteora_amm_v2",
//   "Meteora DLMM": "meteora_dlmm",
// };
const TrendingClient = (
  {
    // initTrendingTime,
    // moreFilterCookie,
    // dexesFilterCookie,
  }: {
    initTrendingTime: "1m" | "5m" | "30m" | "1h";
    moreFilterCookie: string;
    dexesFilterCookie: string;
  },
) => {
  // Check filter panel open state
  const isFilterOpen = useIgniteFilterPanelStore((state) => state.isOpen);
  // Get margins based on popup state
  const igniteMargins = useIgniteMargins();
  const currentSnappedPopup = usePopupStore(
    (state) => state.currentSnappedPopup,
  );
  const hasSnappedPopup =
    currentSnappedPopup.left.length > 0 || currentSnappedPopup.right.length > 0;

  const isTrendingTutorial = useUserInfoStore(
    (state) => state.isTrendingTutorial,
  );
  const isTrendingTutorialRef = useRef(isTrendingTutorial);
  useEffect(() => {
    isTrendingTutorialRef.current = isTrendingTutorial;
  }, [isTrendingTutorial]);

  const isClient = useRef<boolean>(false);
  useEffect(() => {
    isClient.current = true;
  }, [isClient]);

  useEffect(() => {
    // Ensure the Ignite feed is active when (re)entering the page
    useIgnitePaused.getState().setIsIgniteHovered(false);
  }, []);

  // ### Ignite Tokens Fetch
  const genuineMoreFilter = useMoreFilterStore(
    (state) => state.filters.genuine,
  );

  const discord_mentions = Object.entries(genuineMoreFilter.checkBoxes)
    .filter(
      ([key, value]) => value === true && allowedDiscordKeys.includes(key),
    )
    .map(([key]) => key);

  const dexes = Object.entries(genuineMoreFilter.checkBoxes)
    .filter(([key, value]) => value === true && allowedDexes.includes(key))
    .map(([key]) => key);

  const kol = Object.entries(genuineMoreFilter.checkBoxes)
    .filter(([key, value]) => value === true && allowedKol.includes(key))
    .map(([key]) => key)
    .join(",");

  // --- Dexes filter --------------------------------------------------------
  // Build a list of *selected* Dex names (UI labels). If the user has selected
  // **all** Dex options we treat this as “no Dex filter" and therefore avoid
  // sending the `dexes` parameter to the backend. This mirrors the behaviour
  // of the About-To-Graduate filter popover and prevents the backend from
  // interpreting the request as an *intersection* of every Dex – which would
  // otherwise return an empty set.

  // Step 1: collect the UI-label keys that are checked
  // const selectedDexes = Object.entries(genuineMoreFilter.checkBoxes)
  //   .filter(([key, value]) => value === true && allwedDexes.includes(key))
  //   .map(([key]) => key);

  // Step 2: determine whether NONE or ALL dexes are selected
  // const allDexesSelected = selectedDexes.length === allwedDexes.length;
  // const noDexSelected = selectedDexes.length === 0;

  // If backend expects exact UI labels (e.g. "Boop", "Meteora AMM V2") we
  // can send the labels directly.  Mapping is kept for future use but no
  // longer applied to avoid mismatches.

  // const mappedDexes = selectedDexes.map((key) => dexNameToBackendMap[key] ?? key);

  // const dexes = selectedDexes; // UI labels

  // "dex_paid" status mapping sent to backend. According to the backend
  // contract, the status flag for fully-paid dex fees is "paid" (not
  // "approved"). Using the correct literal guarantees that the backend
  // recognises the filter and therefore returns **only** paid tokens when the
  // corresponding checkbox is enabled.
  const dexPaid = [
    ...(genuineMoreFilter.checkBoxes.dexpaid ? ["approved"] : []),
    ...(genuineMoreFilter.checkBoxes.dexPaidProcessing ? ["processing"] : []),
  ];

  const hiddenTokens = useHiddenTokensStore((state) => state.hiddenTokens);
  const trendingShowHiddenTokens = useHiddenTokensStore(
    (state) => state.trendingShowHiddenTokens,
  );

  const igniteQueryParams: IgniteTokensQueryParams = useMemo(() => {
    const pct = (v?: number) => (v !== undefined ? v / 100 : undefined);

    return {
      mint:
        // -- Hidden Tokens --
        trendingShowHiddenTokens && hiddenTokens.length > 0
          ? hiddenTokens
          : undefined,

      // -- by Age --
      ...(genuineMoreFilter.byAge?.min !== undefined &&
        genuineMoreFilter.byAge?.min >= 0 && {
          min_age: genuineMoreFilter.byAge?.min,
        }),
      ...(genuineMoreFilter.byAge?.max !== undefined &&
        genuineMoreFilter.byAge?.max >= 0 && {
          max_age: genuineMoreFilter.byAge?.max,
        }),

      // -- by Market Cap --
      ...(genuineMoreFilter.byMarketCap?.min &&
        genuineMoreFilter.byMarketCap?.min > 0 && {
          min_market_cap: genuineMoreFilter.byMarketCap?.min,
        }),
      ...(genuineMoreFilter.byMarketCap?.max &&
        genuineMoreFilter.byMarketCap?.max > 0 && {
          max_market_cap: genuineMoreFilter.byMarketCap?.max,
        }),

      // -- by TXNS --
      ...(genuineMoreFilter.byTXNS?.min &&
        genuineMoreFilter.byTXNS?.min > 0 && {
          min_transactions: genuineMoreFilter.byTXNS?.min,
        }),
      ...(genuineMoreFilter.byTXNS?.max &&
        genuineMoreFilter.byTXNS?.max > 0 && {
          max_transactions: genuineMoreFilter.byTXNS?.max,
        }),

      // -- by Buys --
      ...(genuineMoreFilter.byBuys?.min &&
        genuineMoreFilter.byBuys?.min > 0 && {
          min_buys: genuineMoreFilter.byBuys?.min,
        }),
      ...(genuineMoreFilter.byBuys?.max &&
        genuineMoreFilter.byBuys?.max > 0 && {
          max_buys: genuineMoreFilter.byBuys?.max,
        }),

      // -- by Sells --
      ...(genuineMoreFilter.bySells?.min &&
        genuineMoreFilter.bySells?.min > 0 && {
          min_sells: genuineMoreFilter.bySells?.min,
        }),
      ...(genuineMoreFilter.bySells?.max &&
        genuineMoreFilter.bySells?.max > 0 && {
          max_sells: genuineMoreFilter.bySells?.max,
        }),

      // -- by Bonding Curve --
      // Percentage-based bonding curve values
      ...(genuineMoreFilter.bondingCurve?.min &&
        genuineMoreFilter.bondingCurve?.min > 0 && {
          min_bonding_curve: pct(genuineMoreFilter.bondingCurve?.min),
        }),
      ...(genuineMoreFilter.bondingCurve?.max &&
        genuineMoreFilter.bondingCurve?.max > 0 && {
          max_bonding_curve: pct(genuineMoreFilter.bondingCurve?.max),
        }),
      // Dexes filter parameter logic:
      // 1. No dex selected → send empty list to explicitly request *no* tokens.
      // 2. Some dexes selected → send mapped identifiers array.
      // 3. All dexes selected → omit parameter (equivalent to no filter).
      // ...(noDexSelected && { dexes: [] }),
      // ...(!noDexSelected && !allDexesSelected && { dexes }),

      // -- Dexes --
      ...(dexes.length > 0 && {
        dexes,
      }),

      // -- Discord Mentions --
      ...(discord_mentions.length > 0 && {
        discord_mentions: discord_mentions,
      }),

      // -- KOLs --
      ...(kol !== "" && {
        kol: kol,
      }),

      // -- Dev Sold --
      ...(genuineMoreFilter.checkBoxes.devSold && {
        max_dev_holdings: pct(genuineMoreFilter.devHolding?.max),
      }),

      // -- Dev Holding --
      // ...(genuineMoreFilter.checkBoxes.devHolding && {
      //   dev_holding: genuineMoreFilter.checkBoxes.devHolding,
      // }),

      // -- tracked Buy --
      ...(genuineMoreFilter.trackedBuy?.min &&
        genuineMoreFilter.trackedBuy?.min > 0 && {
          min_tracked_buys: genuineMoreFilter.trackedBuy?.min,
        }),
      ...(genuineMoreFilter.trackedBuy?.max &&
        genuineMoreFilter.trackedBuy?.max > 0 && {
          max_tracked_buys: genuineMoreFilter.trackedBuy?.max,
        }),

      // -- Buy Volume --
      ...(genuineMoreFilter.buyVolume?.min &&
        genuineMoreFilter.buyVolume?.min > 0 && {
          min_buy_volume: genuineMoreFilter.buyVolume?.min,
        }),
      ...(genuineMoreFilter.buyVolume?.max &&
        genuineMoreFilter.buyVolume?.max > 0 && {
          max_buy_volume: genuineMoreFilter.buyVolume?.max,
        }),

      // -- Sell Volume --
      ...(genuineMoreFilter.sellVolume?.min &&
        genuineMoreFilter.sellVolume?.min > 0 && {
          min_sell_volume: genuineMoreFilter.sellVolume?.min,
        }),
      ...(genuineMoreFilter.sellVolume?.max &&
        genuineMoreFilter.sellVolume?.max > 0 && {
          max_sell_volume: genuineMoreFilter.sellVolume?.max,
        }),

      // -- Total Volume --
      ...(genuineMoreFilter.totalVolume?.min &&
        genuineMoreFilter.totalVolume?.min > 0 && {
          min_total_vol: genuineMoreFilter.totalVolume?.min,
        }),
      ...(genuineMoreFilter.totalVolume?.max &&
        genuineMoreFilter.totalVolume?.max > 0 && {
          max_total_vol: genuineMoreFilter.totalVolume?.max,
        }),

      // -- Holders --
      ...(genuineMoreFilter.holders?.min &&
        genuineMoreFilter.holders?.min > 0 && {
          min_holders: genuineMoreFilter.holders?.min,
        }),
      ...(genuineMoreFilter.holders?.max &&
        genuineMoreFilter.holders?.max > 0 && {
          max_holders: genuineMoreFilter.holders?.max,
        }),

      // -- devFundedBefore --
      ...(genuineMoreFilter.devFundedBefore?.min &&
        genuineMoreFilter.devFundedBefore?.min > 0 && {
          min_dev_funded_before: genuineMoreFilter.devFundedBefore?.min,
        }),
      ...(genuineMoreFilter.devFundedBefore?.max &&
        genuineMoreFilter.devFundedBefore?.max > 0 && {
          max_dev_funded_before: genuineMoreFilter.devFundedBefore?.max,
        }),

      // -- devFundedAfter --
      ...(genuineMoreFilter.devFundedAfter?.min &&
        genuineMoreFilter.devFundedAfter?.min > 0 && {
          min_dev_funded_after: genuineMoreFilter.devFundedAfter?.min,
        }),
      ...(genuineMoreFilter.devFundedAfter?.max &&
        genuineMoreFilter.devFundedAfter?.max > 0 && {
          max_dev_funded_after: genuineMoreFilter.devFundedAfter?.max,
        }),

      // -- devTokens --
      ...(genuineMoreFilter.devTokens?.min &&
        genuineMoreFilter.devTokens?.min > 0 && {
          min_dev_tokens: genuineMoreFilter.devTokens?.min,
        }),
      ...(genuineMoreFilter.devTokens?.max &&
        genuineMoreFilter.devTokens?.max > 0 && {
          max_dev_tokens: genuineMoreFilter.devTokens?.max,
        }),

      // -- devMigrated --
      ...(genuineMoreFilter.devMigrated?.min &&
        genuineMoreFilter.devMigrated?.min > 0 && {
          min_dev_migrated: genuineMoreFilter.devMigrated?.min,
        }),
      ...(genuineMoreFilter.devMigrated?.max &&
        genuineMoreFilter.devMigrated?.max > 0 && {
          max_dev_migrated: genuineMoreFilter.devMigrated?.max,
        }),

      // -- dexPaid --
      ...(genuineMoreFilter.dexPaid?.min &&
        genuineMoreFilter.dexPaid?.min > 0 && {
          min_dex_paid: genuineMoreFilter.dexPaid?.min,
        }),
      ...(genuineMoreFilter.dexPaid?.max &&
        genuineMoreFilter.dexPaid?.max > 0 && {
          max_dex_paid: genuineMoreFilter.dexPaid?.max,
        }),

      // Percentage-based security metrics
      // -- Insider Holding --
      ...(genuineMoreFilter.insiderHolding?.min &&
        genuineMoreFilter.insiderHolding?.min > 0 && {
          min_insider_holding: pct(genuineMoreFilter.insiderHolding?.min),
        }),
      ...(genuineMoreFilter.insiderHolding?.max &&
        genuineMoreFilter.insiderHolding?.max > 0 && {
          max_insider_holding: pct(genuineMoreFilter.insiderHolding?.max),
        }),

      // -- Bundled --
      ...(genuineMoreFilter.bundled?.min &&
        genuineMoreFilter.bundled?.min > 0 && {
          min_bundled: pct(genuineMoreFilter.bundled?.min),
        }),
      ...(genuineMoreFilter.bundled?.max &&
        genuineMoreFilter.bundled?.max > 0 && {
          max_bundled: pct(genuineMoreFilter.bundled?.max),
        }),

      // -- Dev Holding --
      ...(genuineMoreFilter.devHolding?.min &&
        genuineMoreFilter.devHolding?.min > 0 && {
          min_dev_holdings: pct(genuineMoreFilter.devHolding?.min),
        }),
      ...(genuineMoreFilter.devHolding?.max &&
        genuineMoreFilter.devHolding?.max > 0 && {
          max_dev_holdings: pct(genuineMoreFilter.devHolding?.max),
        }),

      // -- Top 10 Holdings --
      ...(genuineMoreFilter.top10holdings?.min &&
        genuineMoreFilter.top10holdings?.min > 0 && {
          min_top_10_holders: pct(genuineMoreFilter.top10holdings?.min),
        }),
      ...(genuineMoreFilter.top10holdings?.max &&
        genuineMoreFilter.top10holdings?.max > 0 && {
          max_top_10_holders: pct(genuineMoreFilter.top10holdings?.max),
        }),

      // -- Regular Traders --
      ...(genuineMoreFilter.regularTraders?.min &&
        genuineMoreFilter.regularTraders?.min > 0 && {
          min_regular_traders: genuineMoreFilter.regularTraders?.min,
        }),
      ...(genuineMoreFilter.regularTraders?.max &&
        genuineMoreFilter.regularTraders?.max > 0 && {
          max_regular_traders: genuineMoreFilter.regularTraders?.max,
        }),

      // -- Snipers --
      ...(genuineMoreFilter.snipers?.min &&
        genuineMoreFilter.snipers?.min > 0 && {
          min_snipers: pct(genuineMoreFilter.snipers?.min),
        }),
      ...(genuineMoreFilter.snipers?.max &&
        genuineMoreFilter.snipers?.max > 0 && {
          max_snipers: pct(genuineMoreFilter.snipers?.max),
        }),

      // Convert SOL to lamports (1 SOL = 1_000_000_000 lamports) to match backend expectations
      // This prevents sending fractional SOL values that the backend interprets incorrectly.
      // -- Global Fees --
      ...(genuineMoreFilter.globalFees?.min !== undefined && {
        min_global_fees: Math.round(
          genuineMoreFilter.globalFees!.min * 1_000_000_000,
        ),
      }),
      ...(genuineMoreFilter.globalFees?.max !== undefined && {
        max_global_fees: Math.round(
          genuineMoreFilter.globalFees!.max * 1_000_000_000,
        ),
      }),

      // -- hasWebsite --
      ...(genuineMoreFilter.checkBoxes.hasWebsite && {
        has_website: genuineMoreFilter.checkBoxes.hasWebsite,
      }),

      // -- hasTwitter --
      ...(genuineMoreFilter.checkBoxes.hasTwitter && {
        has_twitter: genuineMoreFilter.checkBoxes.hasTwitter,
      }),

      // -- hasTelegram --
      ...(genuineMoreFilter.checkBoxes.hasTelegram && {
        has_telegram: genuineMoreFilter.checkBoxes.hasTelegram,
      }),

      // -- hasAnySocials --
      ...(genuineMoreFilter.checkBoxes.hasAnySocials && {
        has_any_social: genuineMoreFilter.checkBoxes.hasAnySocials,
      }),

      // -- dexPaid --
      ...(dexPaid.length > 0 && { dex_paid: dexPaid }),
      // TODO: map other filters (discord_mentions, kol, dev_sold, etc.) as UI supports
    };
  }, [genuineMoreFilter, hiddenTokens, trendingShowHiddenTokens]);

  // const {
  //   tokens,
  //   isLoading: isLoadingIgnite,
  //   refetch: refetchIgnite,
  // } = useIgniteTokens({
  //   params: igniteQueryParams,
  // });

  const [igniteTokens, setIgniteTokens] = useState<IgniteToken[]>([]);
  const setIsLoadingFilterFetch = useMoreFilterStore(
    (state) => state.setIsLoadingFilterFetch,
  );
  const isLoadingFilterFetch = useMoreFilterStore(
    (state) => state.isLoadingFilterFetch,
  );

  const prevFilter = useRef(igniteQueryParams);

  // Whenever the active filter / query params change, explicitly unsubscribe
  // from the previous `ignite` subscription before subscribing again. This
  // guarantees that the socket will no longer push token updates that match
  // the *old* filter set – a common cause for the UI showing tokens that do
  // not respect the newly-selected Dex filters.
  useEffect(() => {
    if (isEqual(prevFilter.current, igniteQueryParams)) return;

    // Show loading spinner but keep the current token snapshot so that
    // entries that are still valid under the **new** filter remain visible
    // until the backend streams the fresh dataset. `displayedTokens` will
    // immediately hide any token that no longer matches the updated filter,
    // avoiding the brief “all-clear” flash reported by QA when adjusting
    // the Market-Cap range.
    setIsLoadingFilterFetch(true);

    // Clear any existing fallback timer
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }

    // Tell the backend we are no longer interested in the previous filter set.
    // sendMessage({ channel: "ignite", action: "leave" });
    sendTokenUpdateMessage({ channel: "tokenUpdates", action: "leave" });

    // Log the payload sent to the websocket for Ignite filter
    // console.log("WebSocket Ignite Join Payload:", {
    //   channel: "ignite",
    //   action: "join",
    //   ignite: igniteQueryParams,
    // });

    // Subscribe with the fresh query parameters.
    sendMessage({
      channel: "ignite",
      action: "join",
      ignite: igniteQueryParams,
    });

    // If the backend does not reply within 10 seconds, stop showing the loader so
    // that the user sees an empty state instead of an infinite spinner.
    loadingTimeoutRef.current = setTimeout(() => {
      setIsLoadingFilterFetch(false);
    }, 10_000);

    prevFilter.current = igniteQueryParams;
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    };
  }, [igniteQueryParams, prevFilter.current]);

  // Helper to normalize dex identifiers (e.g. "pumpfun" vs "PumpFun" vs "Pump Fun")
  const normalizeDex = (str?: string | null) =>
    (str || "")
      .toLowerCase()
      .replace(/[_\s]/g, "") // remove underscores & spaces
      .replace(/[^a-z0-9]/g, "");

  const displayedTokens: IgniteToken[] = useMemo(() => {
    // When the user explicitly unchecks *all* Dex options we should not display
    // any token (regardless of what the backend might stream). This guarantees
    // UX consistency: the Dex filter acts as a whitelist. If the whitelist is
    // empty → zero tokens.

    // if (noDexSelected) return [];

    if (isLoadingFilterFetch && igniteTokens.length === 0) return [];

    const selectedDexesArr = dexes.map((d) => normalizeDex(d)).filter(Boolean);

    const filteredTokens = igniteTokens.filter((token) => {
      if (token.mint === "" || token.mint === null) return false;

      // --- Market-cap filtering -------------------------------------------------
      const { min: minMarketCap, max: maxMarketCap } =
        genuineMoreFilter.byMarketCap ?? {};
      const marketCap = token.market_cap_usd ?? 0;
      if (minMarketCap !== undefined && marketCap < minMarketCap) return false;
      if (maxMarketCap !== undefined && marketCap > maxMarketCap) return false;

      // --- Bonding-curve filtering --------------------------------------------
      // `migration.progress` as well as the top-level `progress` field can
      // represent the bonding-curve migration progress. The backend may send
      // either of them depending on the code-path (e.g. initial `ignite` feed
      // vs. follow-up `tokenUpdates`).

      // These fields arrive either as a fraction (0-1) or already scaled to a
      // whole percentage (0-100).  We therefore normalise the raw value to a
      // 0-100 range before comparing it against the user-selected min / max.

      // --- bonding-curve filtering -------------------------------------------------
      const { min: minBondCurve, max: maxBondCurve } =
        genuineMoreFilter.bondingCurve ?? {};

      if (minBondCurve !== undefined || maxBondCurve !== undefined) {
        // Prefer the nested migration.progress, fall back to the top-level
        // progress when the nested field is missing.
        const rawProgress =
          token.migration?.progress ??
          (typeof (token as any).progress === "number"
            ? (token as any).progress
            : 0);

        const progressPct = rawProgress <= 1 ? rawProgress * 100 : rawProgress;

        if (minBondCurve !== undefined && progressPct < minBondCurve) {
          return false;
        }
        if (maxBondCurve !== undefined && progressPct > maxBondCurve) {
          return false;
        }
      }

      // Apply Sniper percentage filter client-side as a final safety-net in
      // case the backend returns tokens that do not satisfy the filter. The
      // backend SHOULD already enforce this, but we perform the check here to
      // guarantee the UI never shows tokens outside the requested range.
      const { min: minSnipers, max: maxSnipers } =
        genuineMoreFilter.snipers ?? {};

      // `sniper_percentage` is provided as a fraction (e.g. 0.25 === 25%).
      // The UI, however, captures whole percentage values (e.g. 25).  For an
      // apples-to-apples comparison we convert the min/max values from the UI
      // into their fractional form by dividing by 100.
      const minSniperFrac =
        minSnipers !== undefined ? minSnipers / 100 : undefined;
      const maxSniperFrac =
        maxSnipers !== undefined ? maxSnipers / 100 : undefined;

      if (
        minSniperFrac !== undefined &&
        (token.sniper_percentage ?? 0) < minSniperFrac
      )
        return false;

      if (
        maxSniperFrac !== undefined &&
        (token.sniper_percentage ?? 0) > maxSniperFrac
      )
        return false;

      // --- Insider-Holding guard ------------------------------------------------
      const { min: minInsider, max: maxInsider } =
        genuineMoreFilter.insiderHolding ?? {};

      if (minInsider !== undefined || maxInsider !== undefined) {
        // `insider_percentage` is provided as a fraction (0-1). Convert UI whole-number
        // percentages (e.g. 25) to fractional form for comparison.
        const insiderFrac = token.insider_percentage;

        if (insiderFrac === undefined) {
          // Be conservative: exclude tokens when percentage is unknown but user
          // requested a bound.
          return false;
        }

        if (minInsider !== undefined && insiderFrac < minInsider / 100) {
          return false;
        }
        if (maxInsider !== undefined && insiderFrac > maxInsider / 100) {
          return false;
        }
      }

      // --- Dev-Holding guard (additional client-side safety) -----------------
      const { min: minDevHolding, max: maxDevHolding } =
        genuineMoreFilter.devHolding ?? {};
      // Backend delivers dev_holding_percentage as a fraction (0-1).
      const devPct = token.dev_holding_percentage;
      // If the field exists, apply the same bounds on the fraction values.
      if (devPct !== undefined) {
        if (
          minDevHolding !== undefined &&
          devPct < minDevHolding / 100 // convert user input (0-100) → fraction
        )
          return false;
        if (maxDevHolding !== undefined && devPct > maxDevHolding / 100)
          return false;
      } else if (minDevHolding !== undefined || maxDevHolding !== undefined) {
        // If percentage is missing, be conservative: exclude token when user set any bound.
        return false;
      }

      // --- Dev Migrated guard ----------------------------------------------
      // Ensure the token satisfies the Dev Migrated range filters specified
      // by the user. The backend value `dev_migrated` is an integer (count)
      // so we simply compare against the integer min/max provided by the
      // filter state. We treat an undefined field as 0 to be defensive.

      const { min: minDevMigrated, max: maxDevMigrated } =
        genuineMoreFilter.devMigrated ?? {};

      const devMigratedCount = token.dev_migrated ?? 0;

      if (minDevMigrated !== undefined && devMigratedCount < minDevMigrated)
        return false;

      if (maxDevMigrated !== undefined && devMigratedCount > maxDevMigrated)
        return false;

      // --- Holders range guard ----------------------------------------------
      // Ensure token holders count lies within the user-specified bounds. This
      // provides a client-side safety-net in case the backend returns tokens
      // outside the requested holders window.
      const { min: minHolders, max: maxHolders } =
        genuineMoreFilter.holders ?? {};
      const holdersCnt = token.holders ?? 0;
      if (minHolders !== undefined && holdersCnt < minHolders) return false;
      if (maxHolders !== undefined && holdersCnt > maxHolders) return false;
      // --- Regular Traders guard ---------------------------------------------
      // Ensure the token respects the Regular Traders range requested via the
      // filter panel. `regular_traders` arrives as a simple integer count.
      const { min: minRegularTraders, max: maxRegularTraders } =
        genuineMoreFilter.regularTraders ?? {};

      const regTraderCount = token.regular_traders ?? 0;

      if (minRegularTraders !== undefined && regTraderCount < minRegularTraders)
        return false;

      if (maxRegularTraders !== undefined && regTraderCount > maxRegularTraders)
        return false;

      // --- Bundled filter ----------------------------------------------------------
      const { min: minBundled, max: maxBundled } =
        genuineMoreFilter.bundled ?? {};
      const bundled = token.bundled_percentage ?? 0;
      if (minBundled !== undefined && bundled < Number(minBundled / 100))
        return false;
      if (maxBundled !== undefined && bundled > Number(maxBundled / 100))
        return false;

      // -- volume filter ------------------------------------------------------------
      const { min: minVolume, max: maxVolume } =
        genuineMoreFilter.byVolume ?? {};
      const volume = token.volume_usd ?? 0;
      if (minVolume !== undefined && volume < minVolume) return false;
      if (maxVolume !== undefined && volume > maxVolume) return false;

      // -- liquidity filter ---------------------------------------------------------
      const { min: minLiquidity, max: maxLiquidity } =
        genuineMoreFilter.byCurrentLiquidity ?? {};
      const liquidity = token.liquidity_usd ?? 0;
      if (minLiquidity !== undefined && liquidity < minLiquidity) return false;
      if (maxLiquidity !== undefined && liquidity > maxLiquidity) return false;

      // -- global fees filter -------------------------------------------------------
      const { min: minGlobalFees, max: maxGlobalFees } =
        genuineMoreFilter.globalFees ?? {};
      const globalFees = token.bot_total_fees ?? 0;
      if (minGlobalFees !== undefined && globalFees < minGlobalFees)
        return false;
      if (maxGlobalFees !== undefined && globalFees > maxGlobalFees)
        return false;

      if (selectedDexesArr.length === 0) return true;

      const tokenDexNorm = normalizeDex(token.dex || token.origin_dex);
      const launchpadNorm = normalizeDex(token.launchpad);

      return isLaunchpad(token.launchpad) ? selectedDexesArr.includes(launchpadNorm) :  selectedDexesArr.includes(tokenDexNorm);
    });

    const dedupedByMint = Array.from(
      new Map(filteredTokens.map((t) => [t.mint, t])).values(),
    );

    // Apply built-in sorting by timestamp (newest first)
    // Sort by created timestamp in descending order (newest tokens first)
    const sortedTokens = dedupedByMint.sort((a, b) => b.created - a.created);

    // Sort by created timestamp in ascending order (oldest tokens first)
    // const sortedTokens = dedupedByMint.sort((a, b) => a.created - b.created);

    // If needed**
    // const sortedTokens = dedupedByMint.sort((a, b) => {
    //   const aTimestamp = a.migration?.timestamp ?? 0;
    //   const bTimestamp = b.migration?.timestamp ?? 0;
    //   return bTimestamp - aTimestamp;
    // });

    // If needed**
    // const sortedTokens = dedupedByMint.sort((a, b) => {
    //   const aTimestamp = b.migration?.timestamp ?? 0;
    //   const bTimestamp = a.migration?.timestamp ?? 0;
    //   return bTimestamp - aTimestamp;
    // });

    return sortedTokens.map(convertIgniteLamports);
  }, [
    igniteTokens,
    isLoadingFilterFetch,
    dexes,
    genuineMoreFilter.bundled,
    // noDexSelected,
    genuineMoreFilter.byMarketCap,
    genuineMoreFilter.bondingCurve,
    genuineMoreFilter.holders,
    genuineMoreFilter.insiderHolding,
  ]);

  // ### Initial Trending Fetch
  const activeTrendingTime = useActiveTrendingTimeStore(
    (state) => state.activeTrendingTime,
  );
  const activeTrendingTimeRef = useRef(activeTrendingTime);
  useEffect(() => {
    activeTrendingTimeRef.current = activeTrendingTime;
  }, [activeTrendingTime]);

  // ### Local storage cache for initial ping prices
  const pingPriceMapRef = useRef<Map<string, number>>(new Map());
  const athPercentMapRef = useRef<Map<string, number>>(new Map());
  const athSincePingMapRef = useRef<Map<string, number>>(new Map());

  // Fallback timer when waiting for `ignite` join acknowledgement.
  // If the server does not respond (e.g. zero-result query) within the timeout,
  // we manually clear the loading state so that the UI can show an empty state
  // instead of being stuck in an indefinite spinner.
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load cached ping prices on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(PING_PRICE_STORAGE_KEY);
    if (stored) {
      try {
        const parsed: [string, number][] = JSON.parse(stored);
        pingPriceMapRef.current = new Map(parsed);
      } catch {
        // ignore malformed cache
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persistPingPrices = () => {
    if (typeof window === "undefined") return;
    try {
      const arr = Array.from(pingPriceMapRef.current.entries());
      localStorage.setItem(PING_PRICE_STORAGE_KEY, JSON.stringify(arr));
    } catch {
      // ignore storage errors
    }
  };

  const MAX_TOKENS = 50;
  const { sendMessage } = useWebSocket<WSMessage<IgniteToken[]>>({
    channel: "ignite",
    initialMessage: {
      channel: "ignite",
      action: "join",
      ignite: igniteQueryParams,
    },
    onMessage: (event) => {
      // Ignore incoming updates when list is hovered/paused
      if (useIgnitePaused.getState().isIgniteHovered) return;
      try {
        if (event.channel === "ignite" && event.success) {
          // Any response from the ignite channel clears the fallback timer
          if (loadingTimeoutRef.current) {
            clearTimeout(loadingTimeoutRef.current);
            loadingTimeoutRef.current = null;
          }

          setTimeout(() => {
            setIsLoadingFilterFetch(false);
          }, 200);

          return;
        }

        if (!isRelevantMessage(event, "ignite")) return;

        // if (isTrendingTutorialRef.current) {
        //   return;
        // }

        const tokens = event.data;

        if (isLoadingFilterFetch) {
          setTimeout(() => {
            setIsLoadingFilterFetch(false);
          }, 200);
        }

        if (!tokens) return [];

        setIgniteTokens((prev) => {
          const map = new Map(prev.map((t) => [t.mint, t]));

          tokens.forEach((token) => {
            if (token.mint) {
              map.set(token.mint, token);
              // cache initial ping price if not already cached
              if (!pingPriceMapRef.current.has(token.mint)) {
                // Prefer explicit price_usd if present, otherwise derive from market_cap / supply
                const explicitPrice = (token as any).price_usd as
                  | number
                  | undefined;
                const derivedPrice =
                  explicitPrice ??
                  (token.market_cap_usd && token.supply
                    ? token.market_cap_usd / token.supply
                    : undefined);
                if (derivedPrice && Number.isFinite(derivedPrice)) {
                  pingPriceMapRef.current.set(token.mint, derivedPrice);
                }
              }
            }
          });

          // Persist ping prices after processing batch
          persistPingPrices();

          const deduped = Array.from(map.values());

          const sliced = deduped.slice(-MAX_TOKENS);

          return sliced;
        });
      } catch (error) {
        console.warn("Error parsing message:", error);
      }
    },
  });

  const { sendMessage: sendTokenUpdateMessage } = useWebSocket<
    WSMessage<IgniteToken[]>
  >({
    channel: "tokenUpdates",
    onMessage: (event) => {
      if (!isRelevantMessage(event, "tokenUpdates")) return;

      const message: IgniteToken[] = event.data;

      if (!message) return;

      // Merge incoming updates with the existing list **and** append any
      // tokens that are completely new. This guarantees that we never drop
      // a token simply because it wasn t part of the initial ignite feed.
      setIgniteTokens((prev) => {
        // Map of current tokens for O(1) lookups
        const map = new Map(prev.map((t) => [t.mint, t]));

        message.forEach((incoming) => {
          if (map.has(incoming.mint)) {
            // ✅ Only update if the token already exists
            const existing = map.get(incoming.mint)!;
            map.set(incoming.mint, { ...existing, ...incoming });
          }
          // 🚫 else: ignore completely new tokens
        });

        return Array.from(map.values()).slice(-MAX_TOKENS);
        // // Create a mutable map of current tokens keyed by mint for O(1) lookups.
        // const map = new Map(prev.map((t) => [t.mint, t]));
        //
        // message.forEach((incoming) => {
        //   const existing = map.get(incoming.mint);
        //   // If the token already exists, merge the latest payload; otherwise add it.
        //   map.set(
        //     incoming.mint,
        //     existing ? { ...existing, ...incoming } : incoming,
        //   );
        // });
        //
        // // Convert the map back to an array and enforce the MAX_TOKENS ceiling
        // // to keep memory usage predictable.
        // return Array.from(map.values()).slice(-MAX_TOKENS);
      });
    },
  });

  // Maintain a stable subscription to `tokenUpdates`. Re-join only when the
  // set of mints changes (compare via sorted key) to avoid infinite re-render
  // loops due to new array references on each render.
  const prevMintsRef = useRef<string[]>([]);

  useEffect(() => {
    const mintsSorted = displayedTokens
      .map((t) => t.mint)
      .filter(Boolean)
      .sort();
    const prevMints = prevMintsRef.current;

    // Only care about new ones
    const toJoin = mintsSorted.filter((mint) => !prevMints.includes(mint));

    if (toJoin.length > 0) {
      sendTokenUpdateMessage({
        channel: "tokenUpdates",
        action: "join",
        mints: toJoin,
      });
    }

    // Always update the full list (so we know what we already joined)
    prevMintsRef.current = mintsSorted;
  }, [displayedTokens, sendTokenUpdateMessage]);

  // ### WebSocket listener for igniteATH (no outgoing messages)
  useWebSocket<WSMessage<{ mint: string; ath_since_ping: number }[]>>({
    channel: "igniteATH",
    // No initialMessage ensures we don't send anything to igniteATH channel
    onMessage: (event) => {
      if (!isRelevantMessage(event, "igniteATH")) return;
      const athData = event.data;
      if (!Array.isArray(athData)) return;

      // Potential future use: compute ATH percentage based on cached ping price
      athData.forEach(({ mint, ath_since_ping }) => {
        if (typeof ath_since_ping !== "number" || ath_since_ping === 0) return;
        athSincePingMapRef.current.set(mint, ath_since_ping);
      });

      // Compute ATH percentage since ping: (athSincePing / pingPrice - 1) * 100
      setIgniteTokens((prev) =>
        prev.map((t) => {
          const athSincePing = athSincePingMapRef.current.get(t.mint);
          if (!athSincePing) return t;
          const pingPrice = pingPriceMapRef.current.get(t.mint);
          const percent =
            pingPrice && athSincePing !== undefined
              ? (athSincePing / pingPrice - 1) * 100
              : undefined;
          if (percent !== undefined) {
            // Debug: log values used in percentage formula for this token
            // Remove or comment out in production if noisy
            // console.log("Percent formula debug", {
            //   mint: t.mint,
            //   athSincePing,
            //   market_cap_usd: t.market_cap_usd,
            //   pingPrice,
            //   percent,
            // });
          }
          if (percent === undefined) return t;
          athPercentMapRef.current.set(t.mint, percent);
          return {
            ...(t as IgniteToken),
            athPercentSincePing: percent,
            athSincePing,
          } as IgniteToken & {
            athPercentSincePing: number;
            athSincePing: number;
          };
        }),
      );

      // Inject ATH % into existing igniteTokens state to trigger UI updates
    },
  });

  // React state to trigger rerender of settings when paused changes (for eye icon etc.)
  // const isIgniteHovered = useIgnitePaused((s) => s.isIgniteHovered);

  // When unpaused (transition from paused -> active), request latest snapshot once
  // const prevHoverRef = useRef(isIgniteHovered);

  // useEffect(() => {
  //   const wasPaused = prevHoverRef.current;
  //   if (wasPaused && !isIgniteHovered) {
  //     // Just switched from paused to active, fetch latest tokens
  //     sendMessage({
  //       channel: "ignite",
  //       action: "join",
  //       ignite: igniteQueryParams,
  //     });
  //   }
  //   prevHoverRef.current = isIgniteHovered;
  // }, [isIgniteHovered, igniteQueryParams]);

  return (
    <>
      <NoScrollLayout>
        <div className="flex w-full flex-col flex-wrap justify-between gap-4 gap-y-2 px-4 pb-3 pt-4 lg:px-0 xl:flex-row xl:items-center xl:pb-1.5 xl:pt-3">
          <div className="flex flex-col items-start gap-x-2 gap-y-1 xl:flex-row xl:items-center">
            <PageHeading
              title="Ignite"
              description="Real-time feed of tokens throughout their lifespan."
              line={1}
              showDescriptionOnMobile
            />
            {/* <TrendingTimeOption
              handleSendTrendingMessage={handleSendMessage}
              initTrendingTime={initTrendingTime}
            /> */}
            {/* <BlacklistedModal /> */}
          </div>
          <DexBuySettings variant="Trending" />
        </div>
        {/* Ignite */}
        <div
          className="flex h-full grow gap-2"
          style={{
            marginLeft:
              hasSnappedPopup && isFilterOpen
                ? 0 // No margin when both popup and filter are active
                : isFilterOpen
                  ? window.innerWidth <= 1280
                    ? 0
                    : window.innerWidth <= 1440
                      ? 0
                      : window.innerWidth <= 1600
                        ? 64
                        : window.innerWidth <= 1750
                          ? 128
                          : window.innerWidth <= 1920
                            ? 180
                            : window.innerWidth <= 2200
                              ? 270
                              : window.innerWidth <= 2560
                                ? 480
                                : window.innerWidth > 2560
                                  ? 640
                                  : 640
                  : igniteMargins.left, // Use calculated margins from useIgniteMargins hook
            marginRight:
              hasSnappedPopup && isFilterOpen
                ? 0 // No margin when both popup and filter are active
                : isFilterOpen
                  ? window.innerWidth <= 1280
                    ? 0
                    : window.innerWidth <= 1440
                      ? 0
                      : window.innerWidth <= 1600
                        ? 64
                        : window.innerWidth <= 1750
                          ? 128
                          : window.innerWidth <= 1920
                            ? 180
                            : window.innerWidth <= 2200
                              ? 270
                              : window.innerWidth <= 2560
                                ? 480
                                : window.innerWidth > 2560
                                  ? 640
                                  : 640
                  : igniteMargins.right, // Use calculated margins from useIgniteMargins hook
            // Add minimal padding only when popup sections are active (not when on small screens)
            // paddingLeft:
            //   hasSnappedPopup && displayedTokens.length > 0
            //     ? "16px"
            //     : undefined,
            // paddingRight:
            //   hasSnappedPopup && displayedTokens.length > 0
            //     ? "16px"
            //     : undefined,
          }}
        >
          <div
            className="flex min-w-0 flex-1 flex-col gap-2"
            style={{ paddingRight: 0 }}
          >
            <IgniteSubHeader />
            <IgniteTokensSection
              tokens={displayedTokens}
              isLoading={isLoadingFilterFetch}
              height="full"
            />
          </div>
          <IgniteFilterPanel />
        </div>
      </NoScrollLayout>
    </>
  );
};

export default TrendingClient;
