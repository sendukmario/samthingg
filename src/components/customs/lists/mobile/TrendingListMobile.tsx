"use client";
// ######## Libraries 📦 & Hooks 🪝 ########
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useUserInfoStore } from "@/stores/user/use-user-info.store";
import { useCustomizeSettingsStore } from "@/stores/setting/use-customize-settings.store";
import { useAnnouncementStore } from "@/stores/use-announcement.store";
import { usePopupStore } from "@/stores/use-popup-state.store";
// ######## Components 🧩 ########
import TrendingCardMobileRow from "../../cards/VirtualizedTrendingCardMobile";
import TrendingCardMobile from "../../cards/mobile/TrendingCardMobile";
// ######## Types 🗨️ ########
import { TrendingDataMessageType } from "@/types/ws-general";
import { FixedSizeList } from "react-window";

export default function TrendingListMobile({
  list,
  trackedWalletsOfToken,
}: {
  list: TrendingDataMessageType[];
  trackedWalletsOfToken: Record<string, string[]>;
}) {
  const remainingScreenWidth = usePopupStore(
    (state) => state.remainingScreenWidth,
  );
  const popups = usePopupStore((state) => state.popups);
  const isTrendingTutorial = useUserInfoStore(
    (state) => state.isTrendingTutorial,
  );

  const isAnnouncementExist = useAnnouncementStore(
    (state) => state.isAnnouncementExist,
  );

  const customizedSettingPresets = useCustomizeSettingsStore(
    (state) => state.presets,
  );
  const customizedSettingActivePreset = useCustomizeSettingsStore(
    (state) => state.activePreset,
  );
  const currentThemeStyle = useMemo(
    () =>
      customizedSettingPresets[customizedSettingActivePreset].themeSetting ||
      "original",
    [customizedSettingPresets, customizedSettingActivePreset],
  );

  // Memoize the items data to prevent unnecessary re-renders
  const itemData = useMemo(
    () => ({
      items: list,
      trackedWalletsOfToken: trackedWalletsOfToken,
      column: 1,
    }),
    [list],
  );

  // Memoize the getItemKey function
  const getItemKey = (index: number) => {
    return list[index]?.mint || index;
  };

  // Dynamic Calculation of list Height 📏
  const listRef = useRef<HTMLDivElement>(null);
  const [listHeight, setListHeight] = useState(0);

  const updateHeight = useCallback(() => {
    if (listRef.current) {
      setListHeight(listRef.current.clientHeight);
    }
  }, []);

  useEffect(() => {
    updateHeight();
  }, [
    remainingScreenWidth,
    popups,
    isAnnouncementExist,
    currentThemeStyle,
    updateHeight,
  ]);

  return (
    <div className="flex w-full flex-grow flex-col px-4 pb-[44px] lg:px-0 xl:pb-8">
      <div
        ref={listRef}
        className="nova-scroller relative flex w-full flex-grow !overflow-y-hidden"
      >
        {Boolean(list?.length) && (
          <div className="absolute left-0 top-0 h-full w-full">
            <FixedSizeList
              style={
                isTrendingTutorial
                  ? {
                      overflow: "hidden",
                    }
                  : {
                      overflowY: "scroll",
                    }
              }
              height={listHeight}
              width="100%"
              itemCount={list.length}
              itemSize={
                remainingScreenWidth < 400
                  ? 237.3
                  : remainingScreenWidth > 420
                    ? 195.3
                    : 220.3
              }
              overscanCount={3}
              itemKey={getItemKey}
              itemData={itemData}
            >
              {TrendingCardMobileRow}
            </FixedSizeList>
          </div>
        )}
      </div>
    </div>
  );
}
