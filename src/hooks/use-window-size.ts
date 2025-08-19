"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import debounce from "lodash/debounce";
import { usePopupStore } from "@/stores/use-popup-state.store";
import { useWindowSizeStore } from "@/stores/use-window-size.store";
import { useCupseySnap } from "@/stores/use-cupsey-snap.store";
import { useCustomizeSettingsStore } from "@/stores/setting/use-customize-settings.store";

export function useWindowSize(): {
  width: number | undefined;
  height: number | undefined;
} {
  const [windowSize, setWindowSize] = useState<{
    width: number | undefined;
    height: number | undefined;
  }>({
    width: undefined,
    height: undefined,
  });

  const setWindowSizeStore = useWindowSizeStore((state) => state.setSize);
  const setRemainingScreenWidth = usePopupStore(
    (state) => state.setRemainingScreenWidth,
  );
  const customizedSettingPresets = useCustomizeSettingsStore(
    (state) => state.presets,
  );
  const customizedSettingActivePreset = useCustomizeSettingsStore(
    (state) => state.activePreset,
  );

  const currentTheme = useMemo(
    () =>
      customizedSettingPresets[customizedSettingActivePreset].themeSetting ||
      "original",
    [customizedSettingPresets, customizedSettingActivePreset],
  );
  const cupseySnap = useCupseySnap((state) => state.snap);
  const isCupseySnapEnabled =
    cupseySnap?.left?.bottom ||
    cupseySnap?.left?.top ||
    cupseySnap?.right?.bottom ||
    cupseySnap?.right?.top;
  const isCupseyDoubleSnapEnabled =
    (cupseySnap?.left?.bottom || cupseySnap?.left?.top) &&
    (cupseySnap?.right?.bottom || cupseySnap?.right?.top);
  const width = useWindowSizeStore((state) => state.width);
  const popups = usePopupStore((state) => state.popups);

  useEffect(() => {
    const updateSize = debounce(() => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
      setWindowSizeStore({
        width: window.innerWidth,
        height: window.innerHeight,
      });

      // const snapWidth = (popupsRef.current as typeof popups).reduce(
      //   (acc, p) => {
      //     if (p.isOpen && p.snappedSide !== "none") {
      //       return acc + p.size.width;
      //     }
      //     return acc;
      //   },
      //   0,
      // );
    }, 100);

    updateSize();

    window.addEventListener("resize", updateSize);

    return () => {
      // setRemainingScreenWidth(() => window.innerWidth);
      window.removeEventListener("resize", updateSize);
      updateSize.cancel();
    };
  }, []);

  useEffect(() => {
    const updateSize = debounce(() => {
      const totalSnappedWidth = popups
        ?.filter((p) => p.snappedSide !== "none" && p.isOpen)
        .reduce((acc, p) => acc + p.size.width, 0);

      setRemainingScreenWidth(
        () =>
          (width || window.innerWidth) -
          (currentTheme === "cupsey"
            ? isCupseyDoubleSnapEnabled
              ? 800
              : isCupseySnapEnabled
                ? 400
                : 0
            : totalSnappedWidth),
      );
    }, 100);

    updateSize();
  }, [
    popups
      ?.map((p) => `${p.name}-${p.snappedSide}-${p.isOpen}-${p.size.width}`)
      .join("|"),
    isCupseySnapEnabled,
    width,
  ]);

  return windowSize;
}
