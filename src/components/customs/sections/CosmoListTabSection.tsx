"use client";

// ######## Libraries 📦 & Hooks 🪝 ########
import { useEffect, useCallback, useRef, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useBlacklistedDeveloperFilterStore } from "@/stores/cosmo/use-blacklisted-developer-filter.store";
import { useCosmoListsStore } from "@/stores/cosmo/use-cosmo-lists.store";
import { useHiddenTokensStore } from "@/stores/cosmo/use-hidden-tokens.store";
import { useWindowSizeStore } from "@/stores/use-window-size.store";
import { usePopupStore } from "@/stores/use-popup-state.store";
import { useWebSocket } from "@/hooks/useWebsocketNew";
import { useNewlyCreatedFilterStore } from "@/stores/cosmo/use-newly-created-filter.store";
import { useAboutToGraduateFilterStore } from "@/stores/cosmo/use-about-to-graduate-filter.store";
import { useGraduatedFilterStore } from "@/stores/cosmo/use-graduated-filter.store";
import { useTrackedWalletsOfToken } from "@/hooks/use-tracked-wallets-of-token";
import { useCosmoSoundStore } from "@/stores/cosmo/use-cosmo-sound.store";
import cookies from "js-cookie";
// ######## APIs 🛜 ########
import { getHiddenTokens } from "@/apis/rest/cosmo";
import { getBlacklistedDevelopers } from "@/apis/rest/cosmo";
// ######## Components 🧩 ########
import CosmoDesktop from "@/components/customs/sections/cosmo/CosmoDesktop";
import CosmoMobile from "@/components/customs/sections/cosmo/CosmoMobile";
import CosmoListSectionLoading from "@/components/customs/loadings/CosmoListSectionLoading";
// ######## Utils & Helpers 🤝 ########
import convertCosmoIntoWSFilterFormat from "@/utils/convertCosmoIntoWSFilterFormat";
// ######## Types 🗨️ ########
import {
  CosmoDataBatchUpdateMessageType,
  CosmoDataMessageType,
  CosmoDataNewlyMessageType,
  CosmoFilterSubscribeMessageType,
  DynamicCosmoFilterSubscriptionMessageType,
} from "@/types/ws-general";
import { useCupseySnap } from "@/stores/use-cupsey-snap.store";
import { isEqual } from "lodash";

export default function CosmoListTabSection() {
  // State ✨
  const setGlobalBlacklistedDevelopers = useBlacklistedDeveloperFilterStore(
    (state) => state.setBlacklistedDevelopers,
  );
  const setGlobalHiddenTokens = useHiddenTokensStore(
    (state) => state.setHiddenTokens,
  );
  const setNewlyCreatedList = useCosmoListsStore(
    (state) => state.setNewlyCreatedList,
  );
  const setAboutToGraduateList = useCosmoListsStore(
    (state) => state.setAboutToGraduateList,
  );
  const setGraduatedList = useCosmoListsStore(
    (state) => state.setGraduatedList,
  );
  const updateNewlyCreated = useCosmoListsStore(
    (state) => state.updateNewlyCreated,
  );
  const cleanup = useCosmoListsStore((state) => state.cleanup);
  const { walletsOfToken } = useTrackedWalletsOfToken();

  const isFirstLoadingRef = useRef<boolean>(true);
  const [isFirstLoading, setIsFirstLoading] = useState(true);

  // Sound state refs
  const newlyCreatedSoundRef = useRef(
    useCosmoSoundStore.getState().globalDefaults.newlyCreatedSound,
  );
  const aboutToGraduateSoundRef = useRef(
    useCosmoSoundStore.getState().globalDefaults.aboutToGraduateSound,
  );
  const graduatedSoundRef = useRef(
    useCosmoSoundStore.getState().globalDefaults.graduatedSound,
  );

  const playWalletSound = useCosmoSoundStore((state) => state.playWalletSound);
  const getSoundForWallet = useCosmoSoundStore(
    (state) => state.getSoundForWallet,
  );

  // Subscribe to sound state changes
  useEffect(() => {
    const unsubscribe = useCosmoSoundStore.subscribe((state) => {
      newlyCreatedSoundRef.current = state.globalDefaults.newlyCreatedSound;
      aboutToGraduateSoundRef.current =
        state.globalDefaults.aboutToGraduateSound;
      graduatedSoundRef.current = state.globalDefaults.graduatedSound;
    });

    return () => {
      unsubscribe();
      cleanup();
    };
  }, []);

  const playTokenSound = useCallback(
    async (
      tokenMint: string,
      listType: "newlyCreated" | "aboutToGraduate" | "graduated",
    ) => {
      const tokenWallets = walletsOfToken[tokenMint] || [];

      if (tokenWallets.length > 0) {
        // Play sound for the first tracked wallet (to avoid spam)
        await playWalletSound(tokenWallets[0], listType);
      } else {
        // Fall back to global default sound
        const globalDefaults = useCosmoSoundStore.getState().globalDefaults;
        const globalSound = globalDefaults[`${listType}Sound`];

        if (globalSound !== "none") {
          try {
            const audio = new Audio(`/sfx/cosmo/${globalSound}.mp3`);
            await audio.play();
          } catch (error) {
            console.warn(`Failed to play global sound for ${listType}:`, error);
          }
        }
      }
    },
    [walletsOfToken, playWalletSound],
  );

  const { data: hiddenTokensData, isLoading: isLoadingHiddenTokens } = useQuery(
    {
      queryKey: ["hidden-tokens"],
      queryFn: getHiddenTokens,
      retry: 3,
    },
  );

  const latestGenuineNewlyCreatedFilters =
    useNewlyCreatedFilterStore.getState()?.filters.genuine;
  const latestGenuineAboutToGraduateFilters =
    useAboutToGraduateFilterStore.getState()?.filters.genuine;
  const latestGenuineGraduatedFilters =
    useGraduatedFilterStore.getState()?.filters.genuine;
  const blacklistDevelopers =
    useBlacklistedDeveloperFilterStore.getState().blacklistedDevelopers;
  const hiddenTokens = useHiddenTokensStore((s) => s.hiddenTokens);
  const isNewlyShowHiddenTokens = useRef<boolean>(false);
  useEffect(() => {
    isNewlyShowHiddenTokens.current =
      latestGenuineNewlyCreatedFilters.checkBoxes.showHide;
  }, [latestGenuineNewlyCreatedFilters.checkBoxes.showHide]);

  const filterTokens = useCallback(
    (data: CosmoDataMessageType) => {
      // ### NEWLY CREATED
      if (data?.migration?.migrating) return false;

      // ### DEX FILTER
      const transformedDex = (data?.dex || "")
        ?.replace(/\./g, "")
        ?.replace(/ /g, "_")
        ?.toLowerCase();
      if (
        !latestGenuineNewlyCreatedFilters.checkBoxes[
          transformedDex as keyof typeof latestGenuineNewlyCreatedFilters.checkBoxes
        ]
      )
        return false;

      // ### KEYWORDS FILTER
      if (latestGenuineNewlyCreatedFilters?.showKeywords) {
        const keywords = latestGenuineNewlyCreatedFilters?.showKeywords
          .toLowerCase()
          .split(",")
          ?.map((k) => k.trim());
        const tokenText = `${data.name} ${data.symbol}`.toLowerCase();
        if (!keywords.some((keyword) => tokenText.includes(keyword)))
          return false;
      }

      if (latestGenuineNewlyCreatedFilters?.doNotShowKeywords) {
        const keywords = latestGenuineNewlyCreatedFilters?.doNotShowKeywords
          .toLowerCase()
          .split(",")
          ?.map((k) => k.trim());
        const tokenText = `${data.name} ${data.symbol}`.toLowerCase();
        if (keywords.some((keyword) => tokenText.includes(keyword)))
          return false;
      }

      // ### AMOUNT FILTER
      // 1. Holders Count Filter
      const holdersCount = Number(data.holders) || 0;
      if (
        latestGenuineNewlyCreatedFilters?.byHoldersCount.min &&
        holdersCount < latestGenuineNewlyCreatedFilters?.byHoldersCount.min
      )
        return false;
      if (
        latestGenuineNewlyCreatedFilters?.byHoldersCount.max &&
        holdersCount > latestGenuineNewlyCreatedFilters?.byHoldersCount.max
      )
        return false;

      // 2. Dev Holdings Filter
      const devHoldingsPercent = Number(data.dev_holding_percentage) || 0;
      if (
        latestGenuineNewlyCreatedFilters?.byDevHoldingPercentage.min &&
        devHoldingsPercent <
          latestGenuineNewlyCreatedFilters?.byDevHoldingPercentage.min
      )
        return false;
      if (
        latestGenuineNewlyCreatedFilters?.byDevHoldingPercentage.max &&
        devHoldingsPercent >
          latestGenuineNewlyCreatedFilters?.byDevHoldingPercentage.max
      )
        return false;

      // 3. Dev Migrated Filter
      const devMigrated = Number(data.snipers) || 0;
      if (
        latestGenuineNewlyCreatedFilters?.byDevMigrated.min &&
        devMigrated < latestGenuineNewlyCreatedFilters?.byDevMigrated.min
      )
        return false;
      if (
        latestGenuineNewlyCreatedFilters?.byDevMigrated.max &&
        devMigrated > latestGenuineNewlyCreatedFilters?.byDevMigrated.max
      )
        return false;

      // 4. Snipers Filter
      const snipers = Number(data.snipers) || 0;
      if (
        latestGenuineNewlyCreatedFilters?.bySnipers.min &&
        snipers < latestGenuineNewlyCreatedFilters?.bySnipers.min
      )
        return false;
      if (
        latestGenuineNewlyCreatedFilters?.bySnipers.max &&
        snipers > latestGenuineNewlyCreatedFilters?.bySnipers.max
      )
        return false;

      // 5. Insider Holding Filter
      const insiderHoldingsPercent = Number(data.insider_percentage) || 0;
      if (
        latestGenuineNewlyCreatedFilters?.byInsiderHoldingPercentage.min &&
        insiderHoldingsPercent <
          latestGenuineNewlyCreatedFilters?.byInsiderHoldingPercentage.min
      )
        return false;
      if (
        latestGenuineNewlyCreatedFilters?.byInsiderHoldingPercentage.max &&
        insiderHoldingsPercent >
          latestGenuineNewlyCreatedFilters?.byInsiderHoldingPercentage.max
      )
        return false;

      // 6. Bot Holders Filter
      const botHolders = Number(data.bot_holders) || 0;
      if (
        latestGenuineNewlyCreatedFilters?.byBotHolders.min &&
        botHolders < latestGenuineNewlyCreatedFilters?.byBotHolders.min
      )
        return false;
      if (
        latestGenuineNewlyCreatedFilters?.byBotHolders.max &&
        botHolders > latestGenuineNewlyCreatedFilters?.byBotHolders.max
      )
        return false;

      // 7. Age Filter (Mins)
      const now = Math.floor(Date.now() / 1000); // Current time in seconds
      const createdTime =
        data.created > 1e12 // Check if timestamp is in ms
          ? Math.floor(data.created / 1000) // Convert ms to s if needed
          : Number(data.created) || 0; // Keep as seconds

      const ageInMinutes = (now - createdTime) / 60;

      if (
        latestGenuineNewlyCreatedFilters?.byAge.min &&
        ageInMinutes < latestGenuineNewlyCreatedFilters?.byAge.min
      )
        return false;
      if (
        latestGenuineNewlyCreatedFilters?.byAge.max &&
        ageInMinutes > latestGenuineNewlyCreatedFilters?.byAge.max
      )
        return false;

      // 8. Current Liquidity Filter
      const currentLiquidity = Number(data.liquidity_usd) || 0;
      if (
        latestGenuineNewlyCreatedFilters?.byCurrentLiquidity.min &&
        currentLiquidity <
          latestGenuineNewlyCreatedFilters?.byCurrentLiquidity.min
      )
        return false;
      if (
        latestGenuineNewlyCreatedFilters?.byCurrentLiquidity.max &&
        currentLiquidity >
          latestGenuineNewlyCreatedFilters?.byCurrentLiquidity.max
      )
        return false;

      // 9. Volume Filter
      const volumeValue = Number(data.volume_usd) || 0;
      if (
        latestGenuineNewlyCreatedFilters?.byVolume.min &&
        volumeValue < latestGenuineNewlyCreatedFilters?.byVolume.min
      )
        return false;
      if (
        latestGenuineNewlyCreatedFilters?.byVolume.max &&
        volumeValue > latestGenuineNewlyCreatedFilters?.byVolume.max
      )
        return false;

      // 10. Market Cap Filter
      const marketCap = Number(data.market_cap_usd) || 0;
      if (
        latestGenuineNewlyCreatedFilters?.byMarketCap.min &&
        marketCap < latestGenuineNewlyCreatedFilters?.byMarketCap.min
      )
        return false;
      if (
        latestGenuineNewlyCreatedFilters?.byMarketCap.max &&
        marketCap > latestGenuineNewlyCreatedFilters?.byMarketCap.max
      )
        return false;

      // 11. TXNS Filter
      const TXNS = (Number(data.buys) || 0) + (Number(data.sells) || 0);
      if (
        latestGenuineNewlyCreatedFilters?.byTXNS.min &&
        TXNS < latestGenuineNewlyCreatedFilters?.byTXNS.min
      )
        return false;
      if (
        latestGenuineNewlyCreatedFilters?.byTXNS.max &&
        TXNS > latestGenuineNewlyCreatedFilters?.byTXNS.max
      )
        return false;

      // 12. Buys Filter
      const buys = Number(data.buys) || 0;
      if (
        latestGenuineNewlyCreatedFilters?.byBuys.min &&
        buys < latestGenuineNewlyCreatedFilters?.byBuys.min
      )
        return false;
      if (
        latestGenuineNewlyCreatedFilters?.byBuys.max &&
        buys > latestGenuineNewlyCreatedFilters?.byBuys.max
      )
        return false;

      // 13. Sells Filter
      const sells = Number(data.sells) || 0;
      if (
        latestGenuineNewlyCreatedFilters?.bySells.min &&
        sells < latestGenuineNewlyCreatedFilters?.bySells.min
      )
        return false;
      if (
        latestGenuineNewlyCreatedFilters?.bySells.max &&
        sells > latestGenuineNewlyCreatedFilters?.bySells.max
      )
        return false;

      return true;
    },
    [
      latestGenuineNewlyCreatedFilters?.checkBoxes,
      latestGenuineNewlyCreatedFilters?.showKeywords,
      latestGenuineNewlyCreatedFilters?.doNotShowKeywords,
      latestGenuineNewlyCreatedFilters?.byHoldersCount,
      latestGenuineNewlyCreatedFilters?.byDevHoldingPercentage,
      latestGenuineNewlyCreatedFilters?.byDevMigrated,
      latestGenuineNewlyCreatedFilters?.bySnipers,
      latestGenuineNewlyCreatedFilters?.byInsiderHoldingPercentage,
      latestGenuineNewlyCreatedFilters?.byBotHolders,
      latestGenuineNewlyCreatedFilters?.byAge,
      latestGenuineNewlyCreatedFilters?.byCurrentLiquidity,
      latestGenuineNewlyCreatedFilters?.byVolume,
      latestGenuineNewlyCreatedFilters?.byMarketCap,
      latestGenuineNewlyCreatedFilters?.byTXNS,
      latestGenuineNewlyCreatedFilters?.byBuys,
      latestGenuineNewlyCreatedFilters?.bySells,
    ],
  );

  const isPausedRef = useRef<boolean>(false);
  const isFirstPause = useRef<boolean>(true);
  const intervalPauseRef = useRef<NodeJS.Timeout | null>(null);
  const unpauseTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Add this ref for the timeout

  // Add this useEffect to handle the pause cycle
  useEffect(() => {
    if (isFirstLoadingRef.current) return;

    const startPauseCycle = () => {
      // Set to true for 3 seconds
      if (isFirstPause.current) {
        isFirstPause.current = false;
        return;
      }
      isPausedRef.current = true;

      // After 3 seconds, set back to false and wait 10 seconds before next cycle
      unpauseTimeoutRef.current = setTimeout(() => {
        isPausedRef.current = false;
      }, 3000);

      return unpauseTimeoutRef.current;
    };

    // Start the cycle every 13 seconds (10 seconds + 3 seconds pause)
    intervalPauseRef.current = setInterval(() => {
      startPauseCycle();
    }, 13000);

    // Initial cycle start
    startPauseCycle();

    // Cleanup on component unmount
    return () => {
      if (intervalPauseRef.current) {
        clearInterval(intervalPauseRef.current);
        intervalPauseRef.current = null;
      }
      if (unpauseTimeoutRef.current) {
        clearTimeout(unpauseTimeoutRef.current);
        unpauseTimeoutRef.current = null;
      }
      isPausedRef.current = false;
    };
  }, [isFirstLoadingRef.current]);
  // Add refs for previous lists
  const prevAboutToGraduateListRef = useRef<CosmoDataMessageType[]>([]);
  const prevGraduatedListRef = useRef<CosmoDataMessageType[]>([]);
  const prevNewlyCreatedListRef = useRef<CosmoDataMessageType[]>([]);
  const processNewTokenMessage = useCallback(
    (newDataMessage: CosmoDataMessageType) => {
      if ([newDataMessage]?.filter(filterTokens).length === 0) {
        /* console.log("COSMO WS ✨ | New Token 👌 | 🔴", newDataMessage) */
      } else {
        playTokenSound(newDataMessage.mint, "newlyCreated");
        updateNewlyCreated(newDataMessage);
      }
    },
    [filterTokens, updateNewlyCreated, newlyCreatedSoundRef.current],
  );

  const processBatchMessage = useCallback(
    (data: CosmoDataBatchUpdateMessageType) => {
      if (isFirstLoadingRef.current) {
        isFirstLoadingRef.current = false;
        setIsFirstLoading(false);
        // Initialize previous lists on first load
        prevAboutToGraduateListRef.current = data?.aboutToGraduate || [];
        prevGraduatedListRef.current = data?.graduated || [];
        prevNewlyCreatedListRef.current = data?.created || [];
        setNewlyCreatedList((prev) => {
          if (data?.created && !isEqual(prev, data.created)) {
            prevNewlyCreatedListRef.current = data.created;
            return data.created;
          }
          return prev;
        });
        setAboutToGraduateList((prev) =>
          data?.aboutToGraduate && !isEqual(prev, data.aboutToGraduate)
            ? data.aboutToGraduate
            : prev,
        );
        setGraduatedList((prev) =>
          data?.graduated && !isEqual(prev, data.graduated)
            ? data.graduated
            : prev,
        );
        return;
      }

      // Handle aboutToGraduate list
      if (data?.aboutToGraduate) {
        const newAboutToGraduateItems = (data.aboutToGraduate || []).filter(
          (newItem) =>
            !prevAboutToGraduateListRef.current.some(
              (prevItem) => prevItem.mint === newItem.mint,
            ),
        );

        if (newAboutToGraduateItems.length > 0) {
          // Play sound for the first new item
          const firstNewItem = newAboutToGraduateItems[0];
          playTokenSound(firstNewItem.mint, "aboutToGraduate");
        }

        setAboutToGraduateList((prev) => {
          if (data?.aboutToGraduate && !isEqual(prev, data.aboutToGraduate)) {
            prevAboutToGraduateListRef.current = data.aboutToGraduate;
            return data.aboutToGraduate;
          }
          return prev;
        });
      }

      // Handle graduated list
      if (data?.graduated) {
        const newGraduatedItems =
          data.graduated?.[0]?.mint !==
          prevGraduatedListRef?.current?.[0]?.mint;

        if (newGraduatedItems && data.graduated?.[0]) {
          playTokenSound(data.graduated[0].mint, "graduated");
        }

        setGraduatedList((prev) => {
          if (data?.graduated && !isEqual(prev, data.graduated)) {
            prevGraduatedListRef.current = data.graduated;
            return data.graduated;
          }
          return prev;
        });
      }

      // Handle newly created list (existing functionality)
      setNewlyCreatedList((prev) => {
        if (data?.created && !isEqual(prev, data.created)) {
          return data.created;
        }
        return prev;
      });
    },
    [
      isFirstLoadingRef.current,
      setNewlyCreatedList,
      setAboutToGraduateList,
      setGraduatedList,
      playTokenSound,
    ],
  );
  const prevSuccessMessage = useRef<boolean>(false);
  const timeout = useRef<NodeJS.Timeout | null>(null);

  const { sendMessage } = useWebSocket({
    channel: "cosmo2",
    initialMessage: {
      channel: "cosmo2",
      action: "join",
      created: convertCosmoIntoWSFilterFormat(
        latestGenuineNewlyCreatedFilters,
        cookies.get("cosmo-blacklisted-developers")
          ? JSON.parse(cookies.get("cosmo-blacklisted-developers") || "[]")
          : blacklistDevelopers,
        cookies.get("cosmo-hidden-tokens")
          ? JSON.parse(cookies.get("cosmo-hidden-tokens") || "[]").join(",")
          : hiddenTokens?.join(","),
        "created",
      ),
      aboutToGraduate: convertCosmoIntoWSFilterFormat(
        latestGenuineAboutToGraduateFilters,
        cookies.get("cosmo-blacklisted-developers")
          ? JSON.parse(cookies.get("cosmo-blacklisted-developers") || "[]")
          : blacklistDevelopers,
        cookies.get("cosmo-hidden-tokens")
          ? JSON.parse(cookies.get("cosmo-hidden-tokens") || "[]").join(",")
          : hiddenTokens?.join(","),
        "aboutToGraduate",
      ),
      graduated: convertCosmoIntoWSFilterFormat(
        latestGenuineGraduatedFilters,
        cookies.get("cosmo-blacklisted-developers")
          ? JSON.parse(cookies.get("cosmo-blacklisted-developers") || "[]")
          : blacklistDevelopers,
        cookies.get("cosmo-hidden-tokens")
          ? JSON.parse(cookies.get("cosmo-hidden-tokens") || "[]").join(",")
          : hiddenTokens?.join(","),
        "graduated",
      ),
    },
    onLeave: () => {
      if (timeout.current) {
        clearTimeout(timeout.current);
        timeout.current = null;
      }
    },
    onMessage: (event) => {
      try {
        const newDataMessage:
          | CosmoDataNewlyMessageType
          | CosmoDataBatchUpdateMessageType = event;

        if (!event?.channel?.includes("cosmo")) return;

        if (event.channel === "cosmo2" && event.success) {
          prevSuccessMessage.current = true;
        }

        if (event.channel === "cosmo" && !event.success) {
          processNewTokenMessage(
            (newDataMessage as CosmoDataNewlyMessageType)?.data,
          );
          return;
        }
        if (
          event.channel === "cosmo2" &&
          !event.success &&
          !isPausedRef.current
        ) {
          processBatchMessage(
            newDataMessage as CosmoDataBatchUpdateMessageType,
          );
          timeout.current = setTimeout(() => {
            if (prevSuccessMessage.current) {
              setCreatedLoading(false);
              setAboutToGraduateLoading(false);
              setGraduatedLoading(false);
            }
            prevSuccessMessage.current = false;
          }, 200);
          return;
        }
      } catch (error) {
        console.warn("WS HOOK 📺 - cosmo | ERROR ⛔:", error);
      }
    },
  });

  const {
    data: blacklistedDeveloperData,
    isLoading: isLoadingBlacklistedDeveloper,
  } = useQuery({
    queryKey: ["blacklisted-developers-cosmo"],
    queryFn: getBlacklistedDevelopers,
    retry: 3,
  });

  const setGraduatedLoading = useGraduatedFilterStore(
    (state) => state.setIsLoadingFilterFetch,
  );
  const setCreatedLoading = useNewlyCreatedFilterStore(
    (state) => state.setIsLoadingFilterFetch,
  );
  const setAboutToGraduateLoading = useAboutToGraduateFilterStore(
    (state) => state.setIsLoadingFilterFetch,
  );

  const handleSendFilterMessage = useCallback(
    (
      category: "created" | "aboutToGraduate" | "graduated",
      filterObject: CosmoFilterSubscribeMessageType,
      from?: "graduated" | "aboutToGraduate" | "created",
    ) => {
      const token = cookies.get("_nova_session");
      if (!token || token === "") return;

      try {
        const filterSubscriptionMessage: DynamicCosmoFilterSubscriptionMessageType =
          {
            action: "update",
            channel: "cosmo2",
            token,
            [category]: filterObject,
          };

        /* console.log("COSMO | FILTER LOG ✨", filterSubscriptionMessage) */
        sendMessage(filterSubscriptionMessage);
        switch (from) {
          case "graduated":
            setGraduatedLoading(true);
            break;
          case "aboutToGraduate":
            setAboutToGraduateLoading(true);
            break;
          case "created":
            setCreatedLoading(true);
            break;
          default:
            break;
        }
      } catch (error) {
        console.warn("Error sending filter cosmo message:", error);
      }
    },
    [sendMessage],
  );

  const canHideOrBlacklistRef = useRef<boolean>(false);

  useEffect(() => {
    if (!isFirstLoadingRef.current)
      if (!isLoadingBlacklistedDeveloper) {
        sendMessage({
          channel: "cosmo2",
          action: "join",
          created: convertCosmoIntoWSFilterFormat(
            latestGenuineNewlyCreatedFilters,
            blacklistedDeveloperData as string[],
            hiddenTokens?.join(","),
            "created",
          ),
          aboutToGraduate: convertCosmoIntoWSFilterFormat(
            latestGenuineAboutToGraduateFilters,
            blacklistedDeveloperData as string[],
            hiddenTokens?.join(","),
            "aboutToGraduate",
          ),
          graduated: convertCosmoIntoWSFilterFormat(
            latestGenuineGraduatedFilters,
            blacklistedDeveloperData as string[],
            hiddenTokens?.join(","),
            "graduated",
          ),
        });
      }
  }, [isLoadingBlacklistedDeveloper]);

  useEffect(() => {
    let timeout: NodeJS.Timeout | null = null;

    setTimeout(() => {
      canHideOrBlacklistRef.current = true;
      if (timeout) clearTimeout(timeout);
    }, 1000);

    return () => {
      if (timeout) clearTimeout(timeout);
      canHideOrBlacklistRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!canHideOrBlacklistRef.current) return;
    handleSendFilterMessage(
      "created",
      convertCosmoIntoWSFilterFormat(
        latestGenuineNewlyCreatedFilters,
        blacklistDevelopers,
        hiddenTokens?.join(","),
        "created",
      ),
    );
    handleSendFilterMessage(
      "aboutToGraduate",
      convertCosmoIntoWSFilterFormat(
        latestGenuineAboutToGraduateFilters,
        blacklistDevelopers,
        hiddenTokens?.join(","),
        "aboutToGraduate",
      ),
    );
    handleSendFilterMessage(
      "graduated",
      convertCosmoIntoWSFilterFormat(
        latestGenuineGraduatedFilters,
        blacklistDevelopers,
        hiddenTokens?.join(","),
        "graduated",
      ),
    );
  }, [hiddenTokens]);

  // const isShowHiddenToken = useHiddenTokensStore(
  //   (state) => state.isShowHiddenToken,
  // );

  // Handle hidden tokens
  // useEffect(() => {
  //   if (!canHideOrBlacklistRef.current) return;
  //   handleSendFilterMessage(
  //     "created",
  //     convertCosmoIntoWSFilterFormat(
  //       latestGenuineNewlyCreatedFilters,
  //       blacklistDevelopers,
  //       hiddenTokens?.join(","),
  //       "created",
  //     ),
  //   );
  //   handleSendFilterMessage(
  //     "aboutToGraduate",
  //     convertCosmoIntoWSFilterFormat(
  //       latestGenuineAboutToGraduateFilters,
  //       blacklistDevelopers,
  //       hiddenTokens?.join(","),
  //       "aboutToGraduate",
  //     ),
  //   );
  //   handleSendFilterMessage(
  //     "graduated",
  //     convertCosmoIntoWSFilterFormat(
  //       latestGenuineGraduatedFilters,
  //       blacklistDevelopers,
  //       hiddenTokens?.join(","),
  //       "graduated",
  //     ),
  //   );
  // }, [isShowHiddenToken]);

  useEffect(() => {
    if (blacklistedDeveloperData && !isLoadingBlacklistedDeveloper) {
      setGlobalBlacklistedDevelopers(blacklistedDeveloperData);

      console.warn("COSMO | Devs:", blacklistDevelopers);
    }
    if (hiddenTokensData && !isLoadingHiddenTokens) {
      setGlobalHiddenTokens(hiddenTokensData);

      console.warn("COSMO | Hidden Tokens :", hiddenTokensData);
    }
  }, [
    blacklistedDeveloperData,
    isLoadingBlacklistedDeveloper,
    setGlobalBlacklistedDevelopers,
    hiddenTokensData,
    isLoadingHiddenTokens,
    setGlobalHiddenTokens,
  ]);

  const width = useWindowSizeStore((state) => state.width);

  const remainingScreenWidth = usePopupStore(
    (state) => state.remainingScreenWidth,
  );

  const popups = usePopupStore((state) => state.popups);
  const cupseySnap = useCupseySnap((state) => state.snap);
  const isSnapOpen = useMemo(() => {
    return (
      popups.some((p) => p.isOpen && p.snappedSide !== "none") ||
      cupseySnap?.["left"]?.bottom ||
      cupseySnap?.["left"]?.top ||
      cupseySnap?.["right"]?.bottom ||
      cupseySnap?.["right"]?.top
    );
  }, [popups, cupseySnap]);

  if (remainingScreenWidth! < 1000 && isSnapOpen) {
    return (
      <>
        <CosmoMobile
          isLoading={isFirstLoading}
          trackedWalletsOfToken={walletsOfToken}
          handleSendFilterMessage={handleSendFilterMessage}
        />
      </>
    );
  }

  return (
    <>
      {!width ? (
        <>
          <div className="relative mb-14 hidden w-full flex-grow grid-cols-3 gap-x-5 xl:mb-12 xl:grid">
            <CosmoListSectionLoading column={1} variant="desktop" />
            <CosmoListSectionLoading column={2} variant="desktop" />
            <CosmoListSectionLoading column={3} variant="desktop" />
          </div>
          <div className="relative mb-14 h-full w-full flex-grow gap-x-5 xl:hidden">
            <CosmoListSectionLoading column={1} variant="mobile" />
          </div>
        </>
      ) : width! >= 1280 ? (
        <CosmoDesktop
          isLoading={isFirstLoading}
          trackedWalletsOfToken={walletsOfToken}
          handleSendFilterMessage={handleSendFilterMessage}
        />
      ) : (
        <CosmoMobile
          isLoading={isFirstLoading}
          trackedWalletsOfToken={walletsOfToken}
          handleSendFilterMessage={handleSendFilterMessage}
        />
      )}
    </>
  );
}
