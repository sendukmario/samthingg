"use client";

import { useState, useRef, useCallback, ChangeEvent, useEffect } from "react";
// import QuickBuyButton from "./buttons/QuickBuyButton";
import { CosmoSound } from "@/components/customs/popovers/CosmoSound";
import BaseButton from "@/components/customs/buttons/BaseButton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CachedImage } from "@/components/customs/CachedImage";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import Image from "next/image";
import clsx from "clsx";
import { cn } from "@/libraries/utils";
import { useWindowSize } from "@/hooks/use-window-size";
import { useIgniteSearchStore } from "@/stores/ignite/use-ignite-search.store";
import { debounce } from "lodash";

/**
 * IgniteSubHeader component with search functionality
 *
 * Features:
 * - Click search icon to open search input
 * - Real-time search with debouncing (300ms)
 * - Searches in: name, symbol, mint, dex, launchpad
 * - Responsive design (mobile/desktop)
 * - Custom event listener for programmatic search
 *
 * Usage:
 * - User can click search icon to open search
 * - Can be triggered programmatically:
 *   ```js
 *   import { openIgniteSearch } from "@/utils/ignite-search";
 *   openIgniteSearch("PEPE"); // Opens search with "PEPE" pre-filled
 *   ```
 */

export default function IgniteSubHeader() {
  const { width } = useWindowSize();
  const isMobile = width! <= 768; // Adjust this value based on your breakpoint
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  // const [isQuickAmountFocused, setIsQuickAmountFocused] = useState(false);

  const { searchQuery, setSearchQuery, clearSearchQuery } =
    useIgniteSearchStore();

  // Debounced search to avoid too many updates
  const debouncedSetSearchQuery = useCallback(
    debounce((query: string) => {
      setSearchQuery(query);
    }, 300),
    [setSearchQuery],
  );

  const handleSearchChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const query = e.target.value;
      debouncedSetSearchQuery(query);
    },
    [debouncedSetSearchQuery],
  );

  const handleSearchToggle = useCallback(() => {
    setIsSearchFocused(!isSearchFocused);
    if (!isSearchFocused) {
      // Focus the search input after it's rendered
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 100);
    }
  }, [isSearchFocused]);

  const handleCloseSearch = useCallback(() => {
    setIsSearchFocused(false);
    clearSearchQuery();
    if (searchInputRef.current) {
      searchInputRef.current.value = "";
    }
  }, [clearSearchQuery]);

  // Listen for custom event to open search (similar to other components)
  useEffect(() => {
    const handleOpenSearch = (
      e: CustomEvent<{ searchText: string; triggerSearch?: boolean }>,
    ) => {
      const { searchText } = e.detail;
      setIsSearchFocused(true);

      // Focus the search input after it's rendered
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
          searchInputRef.current.value = searchText;
          debouncedSetSearchQuery(searchText);
        }
      }, 100);
    };

    document.addEventListener(
      "openIgniteSearch",
      handleOpenSearch as EventListener,
    );

    return () => {
      document.removeEventListener(
        "openIgniteSearch",
        handleOpenSearch as EventListener,
      );
    };
  }, [debouncedSetSearchQuery]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      debouncedSetSearchQuery.cancel();
    };
  }, [debouncedSetSearchQuery]);

  return (
    <div className="flex flex-col items-center justify-center gap-2">
      {/* Card Layout */}
      <div
        className={clsx(
          "flex items-center justify-between",
          isMobile ? "w-full px-4" : "w-full",
        )}
      >
        {!isSearchFocused ? (
          <>
            <div className="flex items-center gap-1">
              <p className="font-geistSemiBold text-fontColorPrimary">Ignite</p>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="relative aspect-square h-4 w-4 flex-shrink-0">
                      <CachedImage
                        src="/icons/info-tooltip.png"
                        alt="Info Tooltip Icon"
                        fill
                        quality={50}
                        className="object-contain"
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Ignite Tokens</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <div className="flex flex-1 items-center justify-end gap-2">
              <BaseButton className="size-8" onClick={handleSearchToggle}>
                <div className="relative aspect-square size-4">
                  <Search
                    height={16}
                    width={16}
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                  />
                </div>
              </BaseButton>

              <CosmoSound listType="trending" />

              {/* <QuickBuyButton variant="ignite-sub" /> */}
            </div>
          </>
        ) : (
          <div className="flex w-full items-center justify-between gap-x-2">
            <div className={cn("relative z-10 h-7 w-full")}>
              <div
                className={cn(
                  "absolute left-3 top-1/2 z-10 aspect-square h-4 w-4 flex-shrink-0 -translate-y-1/2",
                  isMobile && "left-2",
                )}
              >
                <Image
                  src="/icons/search-input.png"
                  alt="Search Icon"
                  fill
                  quality={100}
                  className="object-contain"
                />
              </div>
              <Input
                ref={searchInputRef}
                placeholder={isMobile ? "Search" : "Search ignite tokens..."}
                className={cn("h-7 w-full pl-8", isMobile && "pl-7")}
                onChange={handleSearchChange}
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="text-white"
              onClick={handleCloseSearch}
            >
              <X height={16} width={16} />
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
}
