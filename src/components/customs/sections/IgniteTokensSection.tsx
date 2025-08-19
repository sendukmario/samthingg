"use client";

import { IgniteToken } from "@/apis/rest/igniteTokens";
import { Virtuoso } from "react-virtuoso";
import IgniteCard from "../cards/IgniteCardNew";
import IgniteCardMobile from "../cards/mobile/IgniteCardMobile";
import { useEffect, useState, useRef, useMemo } from "react";
import { useIgnitePaused } from "@/stores/trending/use-ignite-paused.store";

import { useHiddenTokensStore } from "@/stores/cosmo/use-hidden-tokens.store";
import { useIgniteSearchStore } from "@/stores/ignite/use-ignite-search.store";
import EmptyState from "../EmptyState";
import { useWindowSizeStore } from "@/stores/use-window-size.store";
import IgniteCardSkeleton from "../skeletons/IgniteCardSkeleton";
import IgniteCardMobileSkeleton from "../skeletons/IgniteCardMobileSkeleton";
import { usePopupStore } from "@/stores/use-popup-state.store";
import { useIgniteFilterPanelStore } from "@/stores/ignite/use-ignite-filter-panel.store";
import { useMoreFilterStore } from "@/stores/dex-setting/use-more-filter.store";

interface IgniteTokensSectionProps {
  tokens: IgniteToken[];
  isLoading: boolean;
  height?: number | "full"; // optional override ('full' makes it viewport-height minus header)
}

const ItemRenderer = (
  index: number,
  token: IgniteToken,
  isMobile: boolean,
  isLoading: boolean,
  hasTwoSnappedPopups: boolean,
  hasOneSnappedPopup: boolean,
  isFilterOpen: boolean,
) =>
  isMobile ? (
    isLoading ? (
      <IgniteCardMobileSkeleton index={index} />
    ) : (
      <IgniteCardMobile token={token} index={index} />
    )
  ) : hasTwoSnappedPopups && window.innerWidth < 1920 ? (
    <IgniteCardMobile token={token} index={index} />
  ) : hasTwoSnappedPopups &&
    isFilterOpen &&
    window.innerWidth >= 1920 &&
    window.innerWidth < 2300 ? (
    <IgniteCardMobile token={token} index={index} />
  ) : hasOneSnappedPopup &&
    isFilterOpen &&
    window.innerWidth >= 1280 &&
    window.innerWidth < 1920 ? (
    <IgniteCardMobile token={token} index={index} />
  ) : isLoading ? (
    <IgniteCardSkeleton index={index} />
  ) : (
    <IgniteCard token={token} index={index} />
  );

const IgniteTokensSection: React.FC<IgniteTokensSectionProps> = ({
  tokens,
  isLoading,
  // height = 600,
}) => {
  const hiddenTokens = useHiddenTokensStore((state) => state.hiddenTokens);
  const showHiddenTokens = useHiddenTokensStore(
    (state) => state.trendingShowHiddenTokens,
  );
  const searchQuery = useIgniteSearchStore((state) => state.searchQuery);
  const isFilterOpen = useIgniteFilterPanelStore((state) => state.isOpen);

  // Access the active (genuine) filter range for Total Volume so we can
  // apply an additional client-side guard. This ensures that even if the
  // backend does not (yet) respect the Total Volume constraints, the UI
  // will never display tokens that fall outside the requested range.
  const genuineMoreFilter = useMoreFilterStore(
    (state) => state.filters.genuine,
  );

  // Filter tokens based on search query and hidden tokens
  const filteredTokens = useMemo(() => {
    let filtered: IgniteToken[] | undefined;

    if (showHiddenTokens) {
      // Show only hidden tokens
      filtered = tokens?.filter((t) => hiddenTokens.includes(t.mint));
    } else {
      // Exclude hidden tokens
      filtered = tokens?.filter((t) => !hiddenTokens.includes(t.mint));
    }

    // --- Search query filter ----------------------------------------------
    if (searchQuery && searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered?.filter((token) => {
        return (
          token.name?.toLowerCase().includes(query) ||
          token.symbol?.toLowerCase().includes(query) ||
          token.mint?.toLowerCase().includes(query) ||
          token.dex?.toLowerCase().includes(query) ||
          token.launchpad?.toLowerCase().includes(query)
        );
      });
    }

    // --- Total Volume range guard -----------------------------------------
    const { min: minTotalVol, max: maxTotalVol } =
      genuineMoreFilter.totalVolume ?? {};

    if (minTotalVol !== undefined || maxTotalVol !== undefined) {
      filtered = filtered?.filter((token) => {
        const volume = token.volume_usd ?? 0;
        if (minTotalVol !== undefined && volume < minTotalVol) return false;
        if (maxTotalVol !== undefined && volume > maxTotalVol) return false;
        return true;
      });
    }

    return filtered;
  }, [
    tokens,
    hiddenTokens,
    searchQuery,
    showHiddenTokens,
    genuineMoreFilter.totalVolume,
  ]);

  // Manage visibility of loading indicator
  const [showLoading, setShowLoading] = useState(false);
  const [loadingDismissed, setLoadingDismissed] = useState(false);
  const hasMounted = useRef(false);

  const isMobile = useWindowSizeStore((s) => s.width)! < 1280;

  const currentSnappedPopup = usePopupStore(
    (state) => state.currentSnappedPopup,
  );

  const isLoadingFilter = useMoreFilterStore(
    (state) => state.isLoadingFilterFetch,
  );

  const hasTwoSnappedPopups =
    currentSnappedPopup.left.length > 0 && currentSnappedPopup.right.length > 0;

  const hasOneSnappedPopup =
    currentSnappedPopup.left.length > 0 || currentSnappedPopup.right.length > 0;

  useEffect(() => {
    if (isLoadingFilter) {
      return useIgnitePaused.getState().setIsIgniteHovered(false);
    }
  }, [isLoadingFilter]);

  // Reset paused state on unmount so that the next visit starts unpaused
  useEffect(() => {
    return () => {
      useIgnitePaused.getState().setIsIgniteHovered(false);
    };
  }, []);

  // Show loading text only after the first mount and hide it after 15 seconds
  useEffect(() => {
    if (!hasMounted.current) {
      // Skip showing loading text on first paint
      hasMounted.current = true;
      return;
    }

    if (loadingDismissed) return;

    if (isLoading) {
      setShowLoading(true);
      const timeoutId = setTimeout(() => {
        setShowLoading(false);
        setLoadingDismissed(true);
      }, 15_000);
      return () => clearTimeout(timeoutId);
    } else if (!isLoading) {
      // Data loaded before 15 seconds elapsed
      setShowLoading(false);
      setLoadingDismissed(true);
    }
  }, [isLoading]);

  if (showLoading) {
    return <p className="text-center">Loading Ignite tokens?...</p>;
  }

  if (!isLoading && (!filteredTokens || filteredTokens?.length === 0)) {
    const hasSearchQuery = searchQuery && searchQuery.trim() !== "";
    return (
      <div className="flex w-full justify-center py-8">
        <EmptyState state={hasSearchQuery ? "No Result" : "No Result"} />
      </div>
    );
  }

  // const resolvedHeight = height === "full" ? "calc(100% - 50px)" : height;

  return (
    <div
      // style={{ height: resolvedHeight }}
      className="mb-12 flex h-full w-full justify-center"
      onMouseEnter={() => {
        if (isLoadingFilter) {
          return useIgnitePaused.getState().setIsIgniteHovered(false);
        }

        // Pause real-time updates when user interacts with the list
        useIgnitePaused.getState().setIsIgniteHovered(true);
      }}
      onMouseLeave={() => {
        useIgnitePaused.getState().setIsIgniteHovered(false);
      }}
    >
      <Virtuoso
        totalCount={filteredTokens?.length}
        data={filteredTokens}
        /*
         * Use a stable key to prevent item reuse mismatching when list changes order.
         * react-virtuoso <v4 uses `computeItemKey` instead of `itemKey` and the
         * callback only receives the index. We therefore derive the token using
         * the current filteredTokens array.
         */
        computeItemKey={(index) => filteredTokens[index]?.mint ?? index}
        itemContent={(index, token) =>
          ItemRenderer(
            index,
            token,
            isMobile,
            isLoading,
            hasTwoSnappedPopups,
            hasOneSnappedPopup,
            isFilterOpen,
          )
        }
        style={{ height: "100%" }}
        className="w-full"
      />
    </div>
  );
};

export default IgniteTokensSection;
