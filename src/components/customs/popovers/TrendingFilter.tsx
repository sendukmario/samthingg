"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import BaseButton from "@/components/customs/buttons/BaseButton";
import FilterButton from "@/components/customs/buttons/FilterButton";
import Image from "next/image";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { Slider } from "@/components/ui/slider";
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";
import { useWindowSizeStore } from "@/stores/use-window-size.store";
// import { useCustomizeTheme } from "@/hooks/use-customize-theme";
import {
  useMoreFilterStore,
  MoreFilterState,
} from "@/stores/dex-setting/use-more-filter.store";
import { useIgniteFilterPanelStore } from "@/stores/ignite/use-ignite-filter-panel.store";
import Separator from "../Separator";

const discordMentionsData = [
  { id: "potion", icon: "🍵", label: "Potion" },
  { id: "vanquish", icon: "⚔️", label: "Vanquish" },
  { id: "champsOnly", icon: "🏆", label: "Champs Only" },
  { id: "minted", icon: "✨", label: "Minted" },
  // { id: "champsOnly2", icon: "🏆", label: "Champs Only" },
  // { id: "minted2", icon: "✨", label: "Minted" },
];

const kolData = [
  { id: "goodTrader7", icon: "👍", label: "good trader 7" },
  { id: "cooker", icon: "👨‍🍳", label: "cooker" },
  { id: "euris", icon: "💰", label: "Euris" },
  { id: "waddles1", icon: "🐧", label: "waddles1" },
  // { id: "waddles2", icon: "🐧", label: "waddles1" },
  // { id: "waddles3", icon: "🐧", label: "waddles1" },
];

interface CheckboxItemData {
  id: string;
  icon: string;
  label: string;
}

const CheckboxItem: React.FC<{
  item: CheckboxItemData;
  isChecked: boolean;
  onToggle: () => void;
}> = ({ item, isChecked, onToggle }) => (
  <div className="flex items-center gap-x-2">
    <span className="text-lg">{item.icon}</span>
    <Label
      htmlFor={item.id}
      className="flex-grow font-geistRegular text-fontColorPrimary"
    >
      {item.label}
    </Label>
    <Checkbox
      id={item.id}
      checked={isChecked}
      onCheckedChange={onToggle}
      className="h-4 w-4 rounded border-gray-600 data-[state=checked]:border-purple-600 data-[state=checked]:bg-purple-600"
    />
  </div>
);

interface FilterContentProps {
  previewFilters: MoreFilterState["filters"]["preview"];
  setRangeFilter: (
    key: keyof Omit<
      MoreFilterState["filters"]["preview"],
      "checkBoxes" | "showKeywords" | "doNotShowKeywords"
    >,
    value: number | undefined,
    range: "min" | "max",
    filterType: "preview"
  ) => void;
  toggleCheckbox: (
    key: 
      | "mintAuth"
      | "freezeAuth"
      | "onlyLPBurned"
      | "top10Holders"
      | "hideBundled"
      | "withAtLeast1Social"
      | "showHide"
      | "devHolding"
      | "devSold",
    filterType: "preview"
  ) => void;
  handleNumericInput: (
    key: keyof Omit<
      MoreFilterState["filters"]["preview"],
      "checkBoxes" | "showKeywords" | "doNotShowKeywords"
    >,
    e: React.ChangeEvent<HTMLInputElement>,
    range: "min" | "max"
  ) => void;
  handleReset: () => void;
  handleApply: () => void;
  formatCurrency: (value: number) => string;
  setOpenPopover: (open: boolean) => void;
  setOpenDrawer: (open: boolean) => void;
}

const FilterContent: React.FC<FilterContentProps> = ({
  previewFilters,
  setRangeFilter,
  toggleCheckbox,
  handleNumericInput,
  handleReset,
  handleApply,
  formatCurrency,
  setOpenPopover,
  setOpenDrawer,
}) => (
  <div className="flex h-full flex-col bg-secondary text-fontColorSecondary">
    {/* HEADER */}
    <div className="flex items-center justify-between border-b border-border px-4 py-3">
      <div className="flex items-center gap-x-3">
        <button
          title="Close"
          onClick={() => {
            setOpenPopover(false);
            setOpenDrawer(false);
          }}
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
        <h2 className="text-lg font-bold text-fontColorPrimary">Filter</h2>
      </div>
      <div className="flex items-center gap-x-4">
        <button
          onClick={handleReset}
          className="text-sm font-semibold text-primary hover:text-white"
        >
          Reset
        </button>
        <BaseButton
          onClick={handleApply}
          variant="primary"
          className="h-9 rounded-lg bg-primary px-5 text-sm font-semibold text-black"
        >
          Apply
        </BaseButton>
      </div>
    </div>

    {/* BODY */}
    <OverlayScrollbarsComponent
      defer
      element="div"
      className="flex-grow overflow-y-auto p-4"
      options={{ scrollbars: { autoHide: "scroll" } }}
    >
      <div className="space-y-6">
        {/* Min Market Cap */}
        <div className="space-y-3">
          <Label className="text-sm text-fontColorSecondary">
            Min Market Cap
          </Label>
          <div className="flex items-center gap-x-3">
            {/* Minus Button */}
            <button
              className="text-2xl text-fontColorSecondary hover:text-white"
              onClick={() => {
                const newValue = Math.max(
                  (previewFilters.byMarketCap.min || 0) - 5000,
                  0,
                );
                setRangeFilter("byMarketCap", newValue, "min", "preview");
              }}
            >
              -
            </button>

            {/* Slider */}
            <div className="relative flex-1">
              <Slider
                value={[previewFilters.byMarketCap.min || 0]}
                onValueChange={(v) =>
                  setRangeFilter("byMarketCap", v[0], "min", "preview")
                }
                max={100_000_000}
                step={1000}
                customValue={Number(
                  Math.round(
                    ((previewFilters.byMarketCap.min || 0) / 100_000_000) *
                    100,
                  ),
                )}
              />

              {/* Label */}
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 transform rounded-md bg-purple-600 px-2 py-0.5 text-xs font-semibold text-white">
                {formatCurrency(previewFilters.byMarketCap.min || 0)}
              </div>
            </div>

            {/* Plus Button */}
            <button
              className="text-xl text-fontColorSecondary hover:text-white"
              onClick={() => {
                const newValue = Math.min(
                  (previewFilters.byMarketCap.min || 0) + 5000,
                  100_000_000,
                );
                setRangeFilter("byMarketCap", newValue, "min", "preview");
              }}
            >
              +
            </button>
          </div>
        </div>

        <Separator />

        {/* Bonding Curve */}
        {/* <div className="space-y-3"> */}
        {/*   <Label className="text-sm text-fontColorSecondary"> */}
        {/*     Bonding Curve */}
        {/*   </Label> */}
        {/*   <div className="relative flex-1 pt-2"> */}
        {/*     <Slider */}
        {/*       value={[previewFilters.byBuys.min || 0]} */}
        {/*       onValueChange={(v) => */}
        {/*         setRangeFilter("byBuys", v[0], "min", "preview") */}
        {/*       } */}
        {/*       max={100} */}
        {/*       step={1} */}
        {/*     /> */}
        {/*     <div className="absolute -top-5 left-1/2 -translate-x-1/2 transform rounded-md bg-gray-600 px-2 py-0.5 text-xs font-semibold text-white"> */}
        {/*       {previewFilters.byBuys.min || 0}% */}
        {/*     </div> */}
        {/*     <div className="mt-1 flex justify-between text-xs text-fontColorSecondary"> */}
        {/*       <span>0%</span> */}
        {/*       <span>100%</span> */}
        {/*     </div> */}
        {/*   </div> */}
        {/* </div> */}

        {/* Input Ranges */}
        {[
          { label: "Age Coin", key: "byAge", values: previewFilters.byAge },
          {
            label: "Volume",
            key: "byVolume",
            values: previewFilters.byVolume,
          },
          {
            label: "Transactions",
            key: "byTXNS",
            values: previewFilters.byTXNS,
          },
        ].map((field) => (
          <div key={field.key} className="space-y-2">
            <Label className="text-sm text-fontColorSecondary">
              {field.label}
            </Label>
            <div className="flex gap-x-3">
              <Input
                type="text"
                placeholder="Min"
                value={field.values.min ?? ""}
                onChange={(e) =>
                  handleNumericInput(field.key as any, e, "min")
                }
                className="h-10 border-gray-700 bg-background text-fontColorSecondary placeholder-gray-500"
              />
              <Input
                type="text"
                placeholder="Max"
                value={field.values.max ?? ""}
                onChange={(e) =>
                  handleNumericInput(field.key as any, e, "max")
                }
                className="h-10 border-gray-700 bg-background text-fontColorSecondary placeholder-gray-500"
              />
            </div>
          </div>
        ))}

        <Separator />

        {/* Discord Mentions */}
        <div className="space-y-3">
          <Label className="text-sm text-fontColorSecondary">
            Discord Mentions
          </Label>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            {discordMentionsData.map((item) => (
              <CheckboxItem
                key={item.id}
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
        </div>

        <Separator />

        {/* KOL */}
        <div className="space-y-3">
          <Label className="text-sm text-fontColorSecondary">KOL</Label>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            {kolData.map((item) => (
              <CheckboxItem
                key={item.id}
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
        </div>

        <Separator className="mb-0" />

        {/* Dev Holding / Sold */}
        <div className="flex flex-row justify-between">
          <CheckboxItem
            item={{ id: "devHolding", label: "Dev holding", icon: "💰" }}
            isChecked={!!previewFilters.checkBoxes.devHolding}
            onToggle={() => toggleCheckbox("devHolding", "preview")}
          />
          <CheckboxItem
            item={{ id: "devSold", label: "Dev Sold", icon: "💸" }}
            isChecked={!!previewFilters.checkBoxes.devSold}
            onToggle={() => toggleCheckbox("devSold", "preview")}
          />
        </div>
      </div>
    </OverlayScrollbarsComponent>
  </div>
);

const TrendingFilterPopover = React.memo((
  { isMobile }: { isMobile?: boolean }
) => {
  // const theme = useCustomizeTheme();
  const width = useWindowSizeStore((state) => state.width);

  const {
    filters,
    setRangeFilter,
    toggleCheckbox,
    resetMoreFilters,
    applyMoreFilters,
    setIsLoadingFilterFetch,
  } = useMoreFilterStore();
  const { preview: previewFilters } = filters;

  const { togglePanel } = useIgniteFilterPanelStore();

  const [openPopover, setOpenPopover] = useState(false);
  const [openDrawer, setOpenDrawer] = useState(false);

  // useEffect(() => {
  //   if (width !== null && width !== undefined) {
  //     if (width >= 1024) setOpenDrawer(false);
  //     else setOpenPopover(false);
  //   }
  // }, [width]);

  const handleNumericInput = (
    key: keyof Omit<
      MoreFilterState["filters"]["preview"],
      "checkBoxes" | "showKeywords" | "doNotShowKeywords"
    >,
    e: React.ChangeEvent<HTMLInputElement>,
    range: "min" | "max",
  ) => {
    const v = e.target.value;
    if (v === "" || /^\d+$/.test(v)) {
      setRangeFilter(key, v === "" ? undefined : Number(v), range, "preview");
    }
  };

  const handleReset = () => {
    setIsLoadingFilterFetch(true);
    resetMoreFilters("preview");
    setIsLoadingFilterFetch(false);
  };

  const handleApply = () => {
    setIsLoadingFilterFetch(true);
    applyMoreFilters();
    setIsLoadingFilterFetch(false);
    setOpenPopover(false);
    setOpenDrawer(false);
  };

  function formatCurrency(value: number) {
    if (value >= 1_000_000) {
      return `$${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 2)}M`;
    } else if (value >= 1_000) {
      return `$${(value / 1_000).toFixed(value % 1_000 === 0 ? 0 : 2)}K`;
    } else {
      return `$${value}`;
    }
  }

  return (
    <>
      {/* TODO: this is no longer popover on desktop */}
      {/* Desktop */}
      {!isMobile && (
        <Popover modal open={openPopover} onOpenChange={setOpenPopover}>
          <PopoverTrigger asChild>
            <div className="hidden lg:flex">
              <FilterButton
                handleOpen={() => {
                  // Toggle the Ignite Filter Panel instead of opening popover
                  togglePanel();
                }}
                isActive={false} // Always false since we're not controlling popover state
                text="Filter"
                className="h-8 rounded-lg hidden lg:flex"
              />
            </div>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            sideOffset={8}
            className="nova-scroller hidden max-h-[75vh] w-[462px] flex-col overflow-y-auto rounded-lg border-border p-0 shadow-lg lg:flex"
          >
            <FilterContent
              previewFilters={previewFilters}
              setRangeFilter={setRangeFilter}
              toggleCheckbox={toggleCheckbox}
              handleNumericInput={handleNumericInput}
              handleReset={handleReset}
              handleApply={handleApply}
              formatCurrency={formatCurrency}
              setOpenPopover={setOpenPopover}
              setOpenDrawer={setOpenDrawer}
            />
          </PopoverContent>
        </Popover>
      )}

      {/* Mobile */}
      {isMobile && (
        <Drawer open={openDrawer} onOpenChange={setOpenDrawer}>
          <DrawerTrigger asChild>
            <div className="flex lg:hidden">
              <FilterButton
                handleOpen={() => {
                  setOpenDrawer(true);
                }}
                isActive={openDrawer} // Show active state when drawer is open
                text="Filter"
                className="h-8 rounded-lg flex lg:hidden"
              />
            </div>
          </DrawerTrigger>
          <DrawerContent className="h-[90%]">
            <FilterContent
              previewFilters={previewFilters}
              setRangeFilter={setRangeFilter}
              toggleCheckbox={toggleCheckbox}
              handleNumericInput={handleNumericInput}
              handleReset={handleReset}
              handleApply={handleApply}
              formatCurrency={formatCurrency}
              setOpenPopover={setOpenPopover}
              setOpenDrawer={setOpenDrawer}
            />
          </DrawerContent>
        </Drawer>
      )}
    </>
  );
});
TrendingFilterPopover.displayName = "TrendingFilterPopover";

export default TrendingFilterPopover;
