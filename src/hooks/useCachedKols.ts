import { useCallback, useEffect, useState, useMemo } from "react";
import { getKols, KolsResponse } from "@/apis/rest/kols";
import { useWalletTrackerMessageStore } from "@/stores/footer/use-wallet-tracker-message.store";

const KOLS_CACHE_KEY = "nova_kols_cache";
const KOLS_CACHE_TIMESTAMP_KEY = "nova_kols_cache_timestamp";
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds
const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes in milliseconds

interface CachedKolsData {
  data: KolsResponse;
  timestamp: number;
}

interface KolWithEmoji {
  name: string;
  emoji: string;
  url: string;
}

/**
 * Hook that manages KOLs data with local storage caching and periodic refresh.
 * Provides optimized access to KOLs data with wallet emojis for better performance.
 */
export const useCachedKols = () => {
  const [kolsData, setKolsData] = useState<KolsResponse>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Get tracked wallets for emoji lookup
  const trackedWallets = useWalletTrackerMessageStore((state) => state.trackedWallets);

  // Create emoji lookup map for performance
  const walletEmojiMap = useMemo(() => {
    const map: Record<string, string> = {};
    trackedWallets.forEach(wallet => {
      if (wallet.address && wallet.emoji) {
        map[wallet.address] = wallet.emoji;
      }
    });
    return map;
  }, [trackedWallets]);

  // Load data from cache
  const loadFromCache = useCallback((): CachedKolsData | null => {
    try {
      const cached = localStorage.getItem(KOLS_CACHE_KEY);
      const timestamp = localStorage.getItem(KOLS_CACHE_TIMESTAMP_KEY);
      
      if (cached && timestamp) {
        const parsedData = JSON.parse(cached);
        const parsedTimestamp = parseInt(timestamp, 10);
        
        // Check if cache is still valid
        if (Date.now() - parsedTimestamp < CACHE_DURATION) {
          return { data: parsedData, timestamp: parsedTimestamp };
        }
      }
    } catch (error) {
      console.warn("Failed to load KOLs data from cache:", error);
    }
    return null;
  }, []);

  // Save data to cache
  const saveToCache = useCallback((data: KolsResponse) => {
    try {
      const timestamp = Date.now();
      localStorage.setItem(KOLS_CACHE_KEY, JSON.stringify(data));
      localStorage.setItem(KOLS_CACHE_TIMESTAMP_KEY, timestamp.toString());
    } catch (error) {
      console.warn("Failed to save KOLs data to cache:", error);
    }
  }, []);

  // Fetch fresh data from API
  const fetchKolsData = useCallback(async (force = false) => {
    // Don't fetch if already loading and not forced
    if (isLoading && !force) return;

    // Check cache first if not forced
    if (!force) {
      const cached = loadFromCache();
      if (cached) {
        setKolsData(cached.data);
        return;
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await getKols();
      setKolsData(data);
      saveToCache(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to fetch KOLs data");
      setError(error);
      console.error("Failed to fetch KOLs data:", error);
      
      // Try to use cached data even if expired as fallback
      const cached = loadFromCache();
      if (cached) {
        setKolsData(cached.data);
      }
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, loadFromCache, saveToCache]);

  // Initialize data on mount
  useEffect(() => {
    fetchKolsData();
  }, [fetchKolsData]);

  // Set up periodic refresh
  useEffect(() => {
    const interval = setInterval(() => {
      fetchKolsData(true); // Force refresh
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [fetchKolsData]);

  // Get KOLs data for a specific token with emojis
  const getKolsForToken = useCallback((tokenMint: string, walletAddresses: string[]) => {
    if (!walletAddresses || walletAddresses.length === 0) {
      return [];
    }

    const kolsWithEmojis: KolWithEmoji[] = [];

    walletAddresses.forEach(address => {
      const kol = kolsData[address];
      if (kol && kol.name && kol.name !== "-") {
        const emoji = walletEmojiMap[address] || "👤"; // Default emoji if not found
        kolsWithEmojis.push({
          name: kol.name,
          emoji,
          url: kol.url
        });
      }
    });

    return kolsWithEmojis;
  }, [kolsData, walletEmojiMap]);

  // Get display string for KOLs of a token
  const getKolsDisplayForToken = useCallback((tokenMint: string, walletAddresses: string[]) => {
    const kols = getKolsForToken(tokenMint, walletAddresses);
    
    // Only return display if we have actual KOLs data, never show wallet count
    if (kols.length === 0) {
      return null; // Return null to hide UI completely
    }

    // Format as "{emoji} {name}"
    const formattedKols = kols.map(kol => `${kol.emoji} ${kol.name}`);
    
    // Show up to 2 KOLs for brevity, then add +N suffix
    if (formattedKols.length <= 2) {
      return formattedKols.join(", ");
    } else {
      const visibleKols = formattedKols.slice(0, 2).join(", ");
      const remainder = formattedKols.length - 2;
      return `${visibleKols} +${remainder}`;
    }
  }, [getKolsForToken]);

  // Manual refresh function
  const refresh = useCallback(() => {
    fetchKolsData(true);
  }, [fetchKolsData]);

  // Clear cache function
  const clearCache = useCallback(() => {
    try {
      localStorage.removeItem(KOLS_CACHE_KEY);
      localStorage.removeItem(KOLS_CACHE_TIMESTAMP_KEY);
    } catch (error) {
      console.warn("Failed to clear KOLs cache:", error);
    }
  }, []);

  return {
    kolsData,
    isLoading,
    error,
    getKolsForToken,
    getKolsDisplayForToken,
    refresh,
    clearCache,
    // Legacy compatibility with existing useKols hook
    kols: kolsData
  };
};
