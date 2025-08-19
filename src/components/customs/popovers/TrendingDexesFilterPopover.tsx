"use client";

// ######## Libraries 📦 & Hooks 🪝 ########
import { useState, useEffect } from "react";
import {
  DexesFilterState,
  useDexesFilterStore,
} from "@/stores/dex-setting/use-dexes-filter.store";
import { useMoreFilterStore } from "@/stores/dex-setting/use-more-filter.store";
import { useWindowSizeStore } from "@/stores/use-window-size.store";
import toast from "react-hot-toast";
// ######## Components 🧩 ########
import Image from "next/image";
import BaseButton from "@/components/customs/buttons/BaseButton";
import FilterButton from "@/components/customs/buttons/FilterButton";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import CustomToast from "@/components/customs/toasts/CustomToast";
import { useCustomizeTheme } from "@/hooks/use-customize-theme";
import { useCustomToast } from "@/hooks/use-custom-toast";

export default function TrendingDexesFilterPopover() {
  const theme = useCustomizeTheme();
  const { setIsLoadingFilterFetch } = useMoreFilterStore();
  const { warning } = useCustomToast();

  const width = useWindowSizeStore((state) => state.width);

  // Dex Buy Setting State ✨
  const checkBoxesPreview = useDexesFilterStore(
    (state) => state.filters.preview.checkBoxes,
  );
  const checkBoxesGenuine = useDexesFilterStore(
    (state) => state.filters.genuine.checkBoxes,
  );
  const { toggleDexesFilter, resetDexesFilters, applyDexesFilters } =
    useDexesFilterStore();
  const dexesCount = Object.values(checkBoxesGenuine)?.filter(Boolean).length;
  const previewSelectedDexesCount =
    Object.values(checkBoxesPreview)?.filter(Boolean).length;

  const toggleDexesFilterFilterWithValidation = (
    filterKey: keyof DexesFilterState["filters"]["preview"]["checkBoxes"],
    filterType: keyof DexesFilterState["filters"],
  ) => {
    if (previewSelectedDexesCount === 1 && checkBoxesPreview[filterKey]) {
      // toast.custom((t) => (
      //   <CustomToast
      //     tVisibleState={t.visible}
      //     message="Please select at least one Dex"
      //     state="WARNING"
      //   />
      // ));
      warning("Please select at least one Dex");
    } else {
      toggleDexesFilter(filterKey, filterType);
    }
  };

  // Modal & Drawer State ✨
  const [openFilterPopover, setOpenFilterPopover] = useState<boolean>(false);
  const [openFilterDrawer, setOpenFilterDrawer] = useState<boolean>(false);
  const customSetOpenFilterPopover = (isOpen: boolean) => {
    setOpenFilterPopover(isOpen);
    if (
      JSON.stringify(checkBoxesPreview) !== JSON.stringify(checkBoxesGenuine)
    ) {
      handleApplyFilter();
    }
  };
  const customSetOpenFilterDrawer = (isOpen: boolean) => {
    setOpenFilterDrawer(isOpen);
    if (
      JSON.stringify(checkBoxesPreview) !== JSON.stringify(checkBoxesGenuine)
    ) {
      handleApplyFilter();
    }
  };

  useEffect(() => {
    if (width! >= 1280 && openFilterDrawer) {
      setOpenFilterDrawer(false);
    } else if (width! < 1280 && openFilterPopover) {
      setOpenFilterPopover(false);
    }
  }, [width]);

  const handleResetFilter = () => {
    setIsLoadingFilterFetch(true);

    resetDexesFilters("genuine");
    resetDexesFilters("preview");
    setOpenFilterPopover(false);
    setOpenFilterDrawer(false);
  };
  const handleApplyFilter = () => {
    setIsLoadingFilterFetch(true);

    setOpenFilterPopover(false);
    setOpenFilterDrawer(false);

    applyDexesFilters();
  };

  return (
    <>
      {/* Desktop */}
      <Popover
        modal
        open={openFilterPopover}
        onOpenChange={customSetOpenFilterPopover}
      >
        <PopoverTrigger asChild>
          <div id="trending-dexes-filter" className="hidden lg:flex">
            <FilterButton
              handleOpen={() => setOpenFilterPopover((prev) => !prev)}
              isActive={openFilterPopover}
              text="Dexes"
              className="hidden h-8 pl-2.5 pr-3 text-sm lg:flex"
              suffixEl={
                <div className="flex h-[17px] w-[16px] items-center justify-center rounded-[5px] bg-success px-1">
                  <span className="font-geistSemiBold text-xs text-background">
                    {dexesCount}
                  </span>
                </div>
              }
            />
          </div>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          sideOffset={8}
          className="gb__white__popover relative hidden h-auto w-[360px] flex-col border border-border p-0 shadow-[0_10px_20px_0_rgba(0,0,0,1)] lg:flex"
          style={theme.background2}
        >
          <div className="flex h-[52px] flex-row items-center justify-between border-b border-border p-4">
            <h4 className="font-geistSemiBold text-base text-fontColorPrimary">
              Dexes
            </h4>
            <button
              title="Close"
              onClick={() => setOpenFilterPopover((prev) => !prev)}
              className="relative aspect-square h-6 w-6 flex-shrink-0"
            >
              <Image
                src="/icons/close.png"
                alt="Close Icon"
                fill
                quality={100}
                className="object-contain"
              />
            </button>
          </div>

          {/* Fields */}
          <div className="flex w-full flex-col gap-y-2 p-4">
            <button
              onClick={() =>
                toggleDexesFilterFilterWithValidation("pumpfun", "preview")
              }
              className="flex h-8 w-full cursor-pointer items-center justify-between gap-x-2 rounded-[8px] border border-border bg-white/[3%] py-1 pl-2 pr-1 duration-300 hover:bg-white/[6%]"
            >
              <div className="flex items-center gap-x-2">
                <div className="relative aspect-square h-5 w-5 flex-shrink-0">
                  <Image
                    src="/icons/asset/pumpfun.png"
                    alt="Pumpfun Icon"
                    fill
                    quality={100}
                    className="object-contain"
                  />
                </div>
                <span className="inline-block text-nowrap text-sm text-fontColorPrimary">
                  PumpFun
                </span>
              </div>
              <div className="relative aspect-square h-6 w-6 flex-shrink-0">
                <Image
                  src={
                    checkBoxesPreview?.pumpfun
                      ? "/icons/footer/checked.png"
                      : "/icons/footer/unchecked.png"
                  }
                  alt="Check / Unchecked Icon"
                  fill
                  quality={100}
                  className="object-contain"
                />
              </div>
            </button>
            <button
              onClick={() =>
                toggleDexesFilterFilterWithValidation("moonshot", "preview")
              }
              className="flex h-8 w-full cursor-pointer items-center justify-between gap-x-2 rounded-[8px] border border-border bg-white/[3%] py-1 pl-2 pr-1 duration-300 hover:bg-white/[6%]"
            >
              <div className="flex items-center gap-x-2">
                <div className="relative aspect-square h-5 w-5 flex-shrink-0">
                  <Image
                    src="/icons/asset/yellow-moonshot.png"
                    alt="Moonshot Icon"
                    fill
                    quality={100}
                    className="object-contain"
                  />
                </div>
                <span className="inline-block text-nowrap text-sm text-fontColorPrimary">
                  Moonshot
                </span>
              </div>
              <div className="relative aspect-square h-6 w-6 flex-shrink-0">
                <Image
                  src={
                    checkBoxesPreview?.moonshot
                      ? "/icons/footer/checked.png"
                      : "/icons/footer/unchecked.png"
                  }
                  alt="Check / Unchecked Icon"
                  fill
                  quality={100}
                  className="object-contain"
                />
              </div>
            </button>
            <button
              onClick={() =>
                toggleDexesFilterFilterWithValidation(
                  "dynamic_bonding_curve",
                  "preview",
                )
              }
              className="flex h-8 w-full cursor-pointer items-center justify-between gap-x-2 rounded-[8px] border border-border bg-white/[3%] py-1 pl-2 pr-1 duration-300 hover:bg-white/[6%]"
            >
              <div className="flex items-center gap-x-2">
                <div className="relative aspect-square h-5 w-5 flex-shrink-0 brightness-150 hue-rotate-[80deg] saturate-150">
                  <Image
                    src="/icons/asset/dynamic_bonding_curve.svg"
                    alt="Dynamic Bonding Curve Icon"
                    fill
                    quality={100}
                    className="object-contain"
                  />
                </div>
                <span className="inline-block text-nowrap text-sm text-fontColorPrimary">
                  Dynamic Bonding Curve
                </span>
              </div>
              <div className="relative aspect-square h-6 w-6 flex-shrink-0">
                <Image
                  src={
                    checkBoxesPreview?.dynamic_bonding_curve
                      ? "/icons/footer/checked.png"
                      : "/icons/footer/unchecked.png"
                  }
                  alt="Check / Unchecked Icon"
                  fill
                  quality={100}
                  className="object-contain"
                />
              </div>
            </button>
            <button
              onClick={() =>
                toggleDexesFilterFilterWithValidation("bonk", "preview")
              }
              className="flex h-8 w-full cursor-pointer items-center justify-between gap-x-2 rounded-[8px] border border-border bg-white/[3%] py-1 pl-2 pr-1 duration-300 hover:bg-white/[6%]"
            >
              <div className="flex items-center gap-x-2">
                <div className="relative aspect-square h-5 w-5 flex-shrink-0">
                  <Image
                    src="/icons/asset/bonk.svg"
                    alt="Bonk Icon"
                    fill
                    quality={100}
                    className="object-contain"
                  />
                </div>
                <span className="inline-block text-nowrap text-sm text-fontColorPrimary">
                  Bonk
                </span>
              </div>
              <div className="relative aspect-square h-6 w-6 flex-shrink-0">
                <Image
                  src={
                    checkBoxesPreview?.bonk
                      ? "/icons/footer/checked.png"
                      : "/icons/footer/unchecked.png"
                  }
                  alt="Check / Unchecked Icon"
                  fill
                  quality={100}
                  className="object-contain"
                />
              </div>
            </button>
            <button
              onClick={() =>
                toggleDexesFilterFilterWithValidation(
                  "launch_a_coin",
                  "preview",
                )
              }
              className="flex h-8 w-full cursor-pointer items-center justify-between gap-x-2 rounded-[8px] border border-border bg-white/[3%] py-1 pl-2 pr-1 duration-300 hover:bg-white/[6%]"
            >
              <div className="flex items-center gap-x-2">
                <div className="relative aspect-square h-5 w-5 flex-shrink-0">
                  <Image
                    src="/icons/asset/launch_a_coin.png"
                    alt="Launch a Coin Icon"
                    fill
                    quality={100}
                    className="object-contain"
                  />
                </div>
                <span className="inline-block text-nowrap text-sm text-fontColorPrimary">
                  Launch a Coin
                </span>
              </div>
              <div className="relative aspect-square h-6 w-6 flex-shrink-0">
                <Image
                  src={
                    checkBoxesPreview?.launch_a_coin
                      ? "/icons/footer/checked.png"
                      : "/icons/footer/unchecked.png"
                  }
                  alt="Check / Unchecked Icon"
                  fill
                  quality={100}
                  className="object-contain"
                />
              </div>
            </button>
            <button
              onClick={() =>
                toggleDexesFilterFilterWithValidation("candle_tv", "preview")
              }
              className="flex h-8 w-full cursor-pointer items-center justify-between gap-x-2 rounded-[8px] border border-border bg-white/[3%] py-1 pl-2 pr-1 duration-300 hover:bg-white/[6%]"
            >
              <div className="flex items-center gap-x-2">
                <div className="relative aspect-square h-5 w-5 flex-shrink-0">
                  <Image
                    src="/icons/asset/candle_tv.png"
                    alt="candle TV Icon"
                    fill
                    quality={100}
                    className="object-contain"
                  />
                </div>
                <span className="inline-block text-nowrap text-sm text-fontColorPrimary">
                  Candle TV
                </span>
              </div>
              <div className="relative aspect-square h-6 w-6 flex-shrink-0">
                <Image
                  src={
                    checkBoxesPreview?.candle_tv
                      ? "/icons/footer/checked.png"
                      : "/icons/footer/unchecked.png"
                  }
                  alt="Check / Unchecked Icon"
                  fill
                  quality={100}
                  className="object-contain"
                />
              </div>
            </button>
            <button
              onClick={() =>
                toggleDexesFilterFilterWithValidation("launchlab", "preview")
              }
              className="flex h-8 w-full cursor-pointer items-center justify-between gap-x-2 rounded-[8px] border border-border bg-white/[3%] py-1 pl-2 pr-1 duration-300 hover:bg-white/[6%]"
            >
              <div className="flex items-center gap-x-2">
                <div className="relative aspect-square h-5 w-5 flex-shrink-0 hue-rotate-[150deg] saturate-200">
                  <Image
                    src="/icons/asset/launch_lab.svg"
                    alt="LaunchLab Icon"
                    fill
                    quality={100}
                    className="object-contain"
                  />
                </div>
                <span className="inline-block text-nowrap text-sm text-fontColorPrimary">
                  LaunchLab
                </span>
              </div>
              <div className="relative aspect-square h-6 w-6 flex-shrink-0">
                <Image
                  src={
                    checkBoxesPreview?.launchlab
                      ? "/icons/footer/checked.png"
                      : "/icons/footer/unchecked.png"
                  }
                  alt="Check / Unchecked Icon"
                  fill
                  quality={100}
                  className="object-contain"
                />
              </div>
            </button>
            {/* <button
              onClick={() => toggleDexesFilterFilterWithValidation("boop", "preview")}
              className="flex h-8 w-full cursor-pointer items-center justify-between gap-x-2 rounded-[8px] border border-border bg-white/[3%] py-1 pl-2 pr-1 duration-300 hover:bg-white/[6%]"
            >
              <div className="flex items-center gap-x-2">
                <div className="relative aspect-square h-5 w-5 flex-shrink-0 overflow-hidden rounded-full">
                  <Image
                    src="/icons/asset/boop.png"
                    alt="Boop Icon"
                    fill
                    quality={100}
                    className="object-contain"
                  />
                </div>
                <span className="inline-block text-nowrap text-sm text-fontColorPrimary">
                  Boop
                </span>
              </div>
              <div className="relative aspect-square h-6 w-6 flex-shrink-0">
                <Image
                  src={
                    checkBoxesPreview?.boop
                      ? "/icons/footer/checked.png"
                      : "/icons/footer/unchecked.png"
                  }
                  alt="Check / Unchecked Icon"
                  fill
                  quality={100}
                  className="object-contain"
                />
              </div>
            </button> */}
            <button
              onClick={() =>
                toggleDexesFilterFilterWithValidation("raydium", "preview")
              }
              className="flex h-8 w-full cursor-pointer items-center justify-between gap-x-2 rounded-[8px] border border-border bg-white/[3%] py-1 pl-2 pr-1 duration-300 hover:bg-white/[6%]"
            >
              <div className="flex items-center gap-x-2">
                <div className="relative aspect-square h-5 w-5 flex-shrink-0">
                  <Image
                    src="/icons/asset/raydium.png"
                    alt="Raydium Icon"
                    fill
                    quality={100}
                    className="object-contain"
                  />
                </div>
                <span className="inline-block text-nowrap text-sm text-fontColorPrimary">
                  Raydium
                </span>
              </div>
              <div className="relative aspect-square h-6 w-6 flex-shrink-0">
                <Image
                  src={
                    checkBoxesPreview?.raydium
                      ? "/icons/footer/checked.png"
                      : "/icons/footer/unchecked.png"
                  }
                  alt="Check / Unchecked Icon"
                  fill
                  quality={100}
                  className="object-contain"
                />
              </div>
            </button>
            <button
              onClick={() =>
                toggleDexesFilterFilterWithValidation("pumpswap", "preview")
              }
              className="flex h-8 w-full cursor-pointer items-center justify-between gap-x-2 rounded-[8px] border border-border bg-white/[3%] py-1 pl-2 pr-1 duration-300 hover:bg-white/[6%]"
            >
              <div className="flex items-center gap-x-2">
                <div className="relative aspect-square h-5 w-5 flex-shrink-0 hue-rotate-[120deg] saturate-150">
                  <Image
                    src="/icons/asset/pumpfun.png"
                    alt="Pump Swap Icon"
                    fill
                    quality={100}
                    className="object-contain"
                  />
                </div>
                <span className="inline-block text-nowrap text-sm text-fontColorPrimary">
                  PumpSwap
                </span>
              </div>
              <div className="relative aspect-square h-6 w-6 flex-shrink-0">
                <Image
                  src={
                    checkBoxesPreview?.pumpswap
                      ? "/icons/footer/checked.png"
                      : "/icons/footer/unchecked.png"
                  }
                  alt="Check / Unchecked Icon"
                  fill
                  quality={100}
                  className="object-contain"
                />
              </div>
            </button>
            <button
              onClick={() =>
                toggleDexesFilterFilterWithValidation("meteora_amm", "preview")
              }
              className="flex h-8 w-full cursor-pointer items-center justify-between gap-x-2 rounded-[8px] border border-border bg-white/[3%] py-1 pl-2 pr-1 duration-300 hover:bg-white/[6%]"
            >
              <div className="flex items-center gap-x-2">
                <div className="relative aspect-square h-5 w-5 flex-shrink-0">
                  <Image
                    src="/icons/asset/meteora_amm.svg"
                    alt="Meteora AMM Icon"
                    fill
                    quality={100}
                    className="object-contain"
                  />
                </div>
                <span className="inline-block text-nowrap text-sm text-fontColorPrimary">
                  Meteora AMM
                </span>
              </div>
              <div className="relative aspect-square h-6 w-6 flex-shrink-0">
                <Image
                  src={
                    checkBoxesPreview?.meteora_amm
                      ? "/icons/footer/checked.png"
                      : "/icons/footer/unchecked.png"
                  }
                  alt="Check / Unchecked Icon"
                  fill
                  quality={100}
                  className="object-contain"
                />
              </div>
            </button>
            <button
              onClick={() =>
                toggleDexesFilterFilterWithValidation(
                  "meteora_amm_v2",
                  "preview",
                )
              }
              className="flex h-8 w-full cursor-pointer items-center justify-between gap-x-2 rounded-[8px] border border-border bg-white/[3%] py-1 pl-2 pr-1 duration-300 hover:bg-white/[6%]"
            >
              <div className="flex items-center gap-x-2">
                <div className="relative aspect-square h-5 w-5 flex-shrink-0 brightness-125 hue-rotate-[15deg] saturate-150">
                  <Image
                    src="/icons/asset/meteora_amm.svg"
                    alt="Meteora Icon"
                    fill
                    quality={100}
                    className="object-contain"
                  />
                </div>
                <span className="inline-block text-nowrap text-sm text-fontColorPrimary">
                  Meteora AMM V2
                </span>
              </div>
              <div className="relative aspect-square h-6 w-6 flex-shrink-0">
                <Image
                  src={
                    checkBoxesPreview?.meteora_amm_v2
                      ? "/icons/footer/checked.png"
                      : "/icons/footer/unchecked.png"
                  }
                  alt="Check / Unchecked Icon"
                  fill
                  quality={100}
                  className="object-contain"
                />
              </div>
            </button>
          </div>

          {/* CTA */}
          <div
            className="flex h-[64px] w-full items-center justify-between gap-x-3 rounded-b-[8px] border-t border-border p-4"
            style={theme.background2}
          >
            <button
              onClick={handleResetFilter}
              className="font-geistSemiBold text-sm text-primary duration-300 hover:text-[#be7ad2]"
            >
              Reset
            </button>
            <BaseButton
              type="button"
              onClick={handleApplyFilter}
              variant="primary"
              className="h-8 px-10"
            >
              <span className="text-sm">Apply</span>
            </BaseButton>
          </div>
        </PopoverContent>
      </Popover>

      {/* Mobile */}
      <Drawer open={openFilterDrawer} onOpenChange={customSetOpenFilterDrawer}>
        <DrawerTrigger asChild>
          <div id="trending-dexes-filter-mobile" className="flex lg:hidden">
            <FilterButton
              handleOpen={() => setOpenFilterDrawer((prev) => !prev)}
              isActive={openFilterDrawer}
              text="Dexes"
              className="flex h-8 pl-2.5 pr-3 text-sm lg:hidden"
              suffixEl={
                <div className="flex h-[17px] w-[16px] items-center justify-center rounded-[5px] bg-success px-1">
                  <span className="font-geistSemiBold text-xs text-background">
                    {dexesCount}
                  </span>
                </div>
              }
            />
          </div>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader className="flex h-[62px] flex-row items-center justify-between border-b border-border p-4">
            <DrawerTitle>Filter</DrawerTitle>
            <button
              title="Close"
              onClick={() => setOpenFilterDrawer((prev) => !prev)}
              className="relative aspect-square h-6 w-6 flex-shrink-0"
            >
              <Image
                src="/icons/close.png"
                alt="Close Icon"
                fill
                quality={100}
                className="object-contain"
              />
            </button>
          </DrawerHeader>

          {/* Fields */}
          <div className="flex w-full flex-col gap-y-2 p-4">
            <button
              onClick={() =>
                toggleDexesFilterFilterWithValidation("pumpfun", "preview")
              }
              className="flex h-8 w-full cursor-pointer items-center justify-between gap-x-2 rounded-[8px] border border-border bg-white/[3%] py-1 pl-2 pr-1 duration-300 hover:bg-white/[6%]"
            >
              <div className="flex items-center gap-x-2">
                <div className="relative aspect-square h-5 w-5 flex-shrink-0">
                  <Image
                    src="/icons/asset/pumpfun.png"
                    alt="Pumpfun Icon"
                    fill
                    quality={100}
                    className="object-contain"
                  />
                </div>
                <span className="inline-block text-nowrap text-sm text-fontColorPrimary">
                  PumpFun
                </span>
              </div>
              <div className="relative aspect-square h-6 w-6 flex-shrink-0">
                <Image
                  src={
                    checkBoxesPreview?.pumpfun
                      ? "/icons/footer/checked.png"
                      : "/icons/footer/unchecked.png"
                  }
                  alt="Check / Unchecked Icon"
                  fill
                  quality={100}
                  className="object-contain"
                />
              </div>
            </button>
            <button
              onClick={() =>
                toggleDexesFilterFilterWithValidation("moonshot", "preview")
              }
              className="flex h-8 w-full cursor-pointer items-center justify-between gap-x-2 rounded-[8px] border border-border bg-white/[3%] py-1 pl-2 pr-1 duration-300 hover:bg-white/[6%]"
            >
              <div className="flex items-center gap-x-2">
                <div className="relative aspect-square h-5 w-5 flex-shrink-0">
                  <Image
                    src="/icons/asset/yellow-moonshot.png"
                    alt="Moonshot Icon"
                    fill
                    quality={100}
                    className="object-contain"
                  />
                </div>
                <span className="inline-block text-nowrap text-sm text-fontColorPrimary">
                  Moonshot
                </span>
              </div>
              <div className="relative aspect-square h-6 w-6 flex-shrink-0">
                <Image
                  src={
                    checkBoxesPreview?.moonshot
                      ? "/icons/footer/checked.png"
                      : "/icons/footer/unchecked.png"
                  }
                  alt="Check / Unchecked Icon"
                  fill
                  quality={100}
                  className="object-contain"
                />
              </div>
            </button>
            <button
              onClick={() =>
                toggleDexesFilterFilterWithValidation(
                  "dynamic_bonding_curve",
                  "preview",
                )
              }
              className="flex h-8 w-full cursor-pointer items-center justify-between gap-x-2 rounded-[8px] border border-border bg-white/[3%] py-1 pl-2 pr-1 duration-300 hover:bg-white/[6%]"
            >
              <div className="flex items-center gap-x-2">
                <div className="relative aspect-square h-5 w-5 flex-shrink-0 brightness-150 hue-rotate-[80deg] saturate-150">
                  <Image
                    src="/icons/asset/dynamic_bonding_curve.svg"
                    alt="Dynamic Bonding Curve Icon"
                    fill
                    quality={100}
                    className="object-contain"
                  />
                </div>
                <span className="inline-block text-nowrap text-sm text-fontColorPrimary">
                  Dynamic Bonding Curve
                </span>
              </div>
              <div className="relative aspect-square h-6 w-6 flex-shrink-0">
                <Image
                  src={
                    checkBoxesPreview?.dynamic_bonding_curve
                      ? "/icons/footer/checked.png"
                      : "/icons/footer/unchecked.png"
                  }
                  alt="Check / Unchecked Icon"
                  fill
                  quality={100}
                  className="object-contain"
                />
              </div>
            </button>
            <button
              onClick={() =>
                toggleDexesFilterFilterWithValidation("bonk", "preview")
              }
              className="flex h-8 w-full cursor-pointer items-center justify-between gap-x-2 rounded-[8px] border border-border bg-white/[3%] py-1 pl-2 pr-1 duration-300 hover:bg-white/[6%]"
            >
              <div className="flex items-center gap-x-2">
                <div className="relative aspect-square h-5 w-5 flex-shrink-0">
                  <Image
                    src="/icons/asset/bonk.svg"
                    alt="Bonk Icon"
                    fill
                    quality={100}
                    className="object-contain"
                  />
                </div>
                <span className="inline-block text-nowrap text-sm text-fontColorPrimary">
                  Bonk
                </span>
              </div>
              <div className="relative aspect-square h-6 w-6 flex-shrink-0">
                <Image
                  src={
                    checkBoxesPreview?.bonk
                      ? "/icons/footer/checked.png"
                      : "/icons/footer/unchecked.png"
                  }
                  alt="Check / Unchecked Icon"
                  fill
                  quality={100}
                  className="object-contain"
                />
              </div>
            </button>
            <button
              onClick={() =>
                toggleDexesFilterFilterWithValidation(
                  "launch_a_coin",
                  "preview",
                )
              }
              className="flex h-8 w-full cursor-pointer items-center justify-between gap-x-2 rounded-[8px] border border-border bg-white/[3%] py-1 pl-2 pr-1 duration-300 hover:bg-white/[6%]"
            >
              <div className="flex items-center gap-x-2">
                <div className="relative aspect-square h-5 w-5 flex-shrink-0">
                  <Image
                    src="/icons/asset/launch_a_coin.png"
                    alt="Launch a Coin Icon"
                    fill
                    quality={100}
                    className="object-contain"
                  />
                </div>
                <span className="inline-block text-nowrap text-sm text-fontColorPrimary">
                  Launch a Coin
                </span>
              </div>
              <div className="relative aspect-square h-6 w-6 flex-shrink-0">
                <Image
                  src={
                    checkBoxesPreview?.launch_a_coin
                      ? "/icons/footer/checked.png"
                      : "/icons/footer/unchecked.png"
                  }
                  alt="Check / Unchecked Icon"
                  fill
                  quality={100}
                  className="object-contain"
                />
              </div>
            </button>
            <button
              onClick={() =>
                toggleDexesFilterFilterWithValidation("candle_tv", "preview")
              }
              className="flex h-8 w-full cursor-pointer items-center justify-between gap-x-2 rounded-[8px] border border-border bg-white/[3%] py-1 pl-2 pr-1 duration-300 hover:bg-white/[6%]"
            >
              <div className="flex items-center gap-x-2">
                <div className="relative aspect-square h-5 w-5 flex-shrink-0">
                  <Image
                    src="/icons/asset/candle_tv.png"
                    alt="Candle TV Icon"
                    fill
                    quality={100}
                    className="object-contain"
                  />
                </div>
                <span className="inline-block text-nowrap text-sm text-fontColorPrimary">
                  Candle TV
                </span>
              </div>
              <div className="relative aspect-square h-6 w-6 flex-shrink-0">
                <Image
                  src={
                    checkBoxesPreview?.candle_tv
                      ? "/icons/footer/checked.png"
                      : "/icons/footer/unchecked.png"
                  }
                  alt="Check / Unchecked Icon"
                  fill
                  quality={100}
                  className="object-contain"
                />
              </div>
            </button>
            <button
              onClick={() =>
                toggleDexesFilterFilterWithValidation("launchlab", "preview")
              }
              className="flex h-8 w-full cursor-pointer items-center justify-between gap-x-2 rounded-[8px] border border-border bg-white/[3%] py-1 pl-2 pr-1 duration-300 hover:bg-white/[6%]"
            >
              <div className="flex items-center gap-x-2">
                <div className="relative aspect-square h-5 w-5 flex-shrink-0 hue-rotate-[150deg] saturate-200">
                  <Image
                    src="/icons/asset/launch_lab.svg"
                    alt="LaunchLab Icon"
                    fill
                    quality={100}
                    className="object-contain"
                  />
                </div>
                <span className="inline-block text-nowrap text-sm text-fontColorPrimary">
                  LaunchLab
                </span>
              </div>
              <div className="relative aspect-square h-6 w-6 flex-shrink-0">
                <Image
                  src={
                    checkBoxesPreview?.launchlab
                      ? "/icons/footer/checked.png"
                      : "/icons/footer/unchecked.png"
                  }
                  alt="Check / Unchecked Icon"
                  fill
                  quality={100}
                  className="object-contain"
                />
              </div>
            </button>
            {/* <button
              onClick={() => toggleDexesFilterFilterWithValidation("boop", "preview")}
              className="flex h-8 w-full cursor-pointer items-center justify-between gap-x-2 rounded-[8px] border border-border bg-white/[3%] py-1 pl-2 pr-1 duration-300 hover:bg-white/[6%]"
            >
              <div className="flex items-center gap-x-2">
                <div className="relative aspect-square h-5 w-5 flex-shrink-0 overflow-hidden rounded-full">
                  <Image
                    src="/icons/asset/boop.png"
                    alt="Boop Icon"
                    fill
                    quality={100}
                    className="object-contain"
                  />
                </div>
                <span className="inline-block text-nowrap text-sm text-fontColorPrimary">
                  Boop
                </span>
              </div>
              <div className="relative aspect-square h-6 w-6 flex-shrink-0">
                <Image
                  src={
                    checkBoxesPreview?.boop
                      ? "/icons/footer/checked.png"
                      : "/icons/footer/unchecked.png"
                  }
                  alt="Check / Unchecked Icon"
                  fill
                  quality={100}
                  className="object-contain"
                />
              </div>
            </button> */}
            <button
              onClick={() =>
                toggleDexesFilterFilterWithValidation("raydium", "preview")
              }
              className="flex h-8 w-full cursor-pointer items-center justify-between gap-x-2 rounded-[8px] border border-border bg-white/[3%] py-1 pl-2 pr-1 duration-300 hover:bg-white/[6%]"
            >
              <div className="flex items-center gap-x-2">
                <div className="relative aspect-square h-5 w-5 flex-shrink-0">
                  <Image
                    src="/icons/asset/raydium.png"
                    alt="Raydium Icon"
                    fill
                    quality={100}
                    className="object-contain"
                  />
                </div>
                <span className="inline-block text-nowrap text-sm text-fontColorPrimary">
                  Raydium
                </span>
              </div>
              <div className="relative aspect-square h-6 w-6 flex-shrink-0">
                <Image
                  src={
                    checkBoxesPreview?.raydium
                      ? "/icons/footer/checked.png"
                      : "/icons/footer/unchecked.png"
                  }
                  alt="Check / Unchecked Icon"
                  fill
                  quality={100}
                  className="object-contain"
                />
              </div>
            </button>
            <button
              onClick={() =>
                toggleDexesFilterFilterWithValidation("pumpswap", "preview")
              }
              className="flex h-8 w-full cursor-pointer items-center justify-between gap-x-2 rounded-[8px] border border-border bg-white/[3%] py-1 pl-2 pr-1 duration-300 hover:bg-white/[6%]"
            >
              <div className="flex items-center gap-x-2">
                <div className="relative aspect-square h-5 w-5 flex-shrink-0 hue-rotate-[120deg] saturate-150">
                  <Image
                    src="/icons/asset/pumpfun.png"
                    alt="Pump Swap Icon"
                    fill
                    quality={100}
                    className="object-contain"
                  />
                </div>
                <span className="inline-block text-nowrap text-sm text-fontColorPrimary">
                  PumpSwap
                </span>
              </div>
              <div className="relative aspect-square h-6 w-6 flex-shrink-0">
                <Image
                  src={
                    checkBoxesPreview?.pumpswap
                      ? "/icons/footer/checked.png"
                      : "/icons/footer/unchecked.png"
                  }
                  alt="Check / Unchecked Icon"
                  fill
                  quality={100}
                  className="object-contain"
                />
              </div>
            </button>
            <button
              onClick={() =>
                toggleDexesFilterFilterWithValidation("meteora_amm", "preview")
              }
              className="flex h-8 w-full cursor-pointer items-center justify-between gap-x-2 rounded-[8px] border border-border bg-white/[3%] py-1 pl-2 pr-1 duration-300 hover:bg-white/[6%]"
            >
              <div className="flex items-center gap-x-2">
                <div className="relative aspect-square h-5 w-5 flex-shrink-0">
                  <Image
                    src="/icons/asset/meteora_amm.svg"
                    alt="Meteora AMM Icon"
                    fill
                    quality={100}
                    className="object-contain"
                  />
                </div>
                <span className="inline-block text-nowrap text-sm text-fontColorPrimary">
                  Meteora AMM
                </span>
              </div>
              <div className="relative aspect-square h-6 w-6 flex-shrink-0">
                <Image
                  src={
                    checkBoxesPreview?.meteora_amm
                      ? "/icons/footer/checked.png"
                      : "/icons/footer/unchecked.png"
                  }
                  alt="Check / Unchecked Icon"
                  fill
                  quality={100}
                  className="object-contain"
                />
              </div>
            </button>
            <button
              onClick={() =>
                toggleDexesFilterFilterWithValidation(
                  "meteora_amm_v2",
                  "preview",
                )
              }
              className="flex h-8 w-full cursor-pointer items-center justify-between gap-x-2 rounded-[8px] border border-border bg-white/[3%] py-1 pl-2 pr-1 duration-300 hover:bg-white/[6%]"
            >
              <div className="flex items-center gap-x-2">
                <div className="relative aspect-square h-5 w-5 flex-shrink-0 brightness-125 hue-rotate-[15deg] saturate-150">
                  <Image
                    src="/icons/asset/meteora_amm.svg"
                    alt="Meteora Icon"
                    fill
                    quality={100}
                    className="object-contain"
                  />
                </div>
                <span className="inline-block text-nowrap text-sm text-fontColorPrimary">
                  Meteora AMM V2
                </span>
              </div>
              <div className="relative aspect-square h-6 w-6 flex-shrink-0">
                <Image
                  src={
                    checkBoxesPreview?.meteora_amm_v2
                      ? "/icons/footer/checked.png"
                      : "/icons/footer/unchecked.png"
                  }
                  alt="Check / Unchecked Icon"
                  fill
                  quality={100}
                  className="object-contain"
                />
              </div>
            </button>
          </div>

          {/* CTA */}
          <div className="flex h-[64px] w-full items-center justify-between gap-x-3 border-t border-border bg-background p-4">
            <button
              onClick={handleResetFilter}
              className="font-geistSemiBold text-sm text-primary duration-300 hover:text-[#be7ad2]"
            >
              Reset
            </button>
            <button
              onClick={handleApplyFilter}
              className="flex items-center justify-center text-nowrap rounded-[8px] bg-primary px-10 py-2 font-geistSemiBold text-sm text-background duration-300 hover:bg-[#be7ad2]"
            >
              Apply
            </button>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
