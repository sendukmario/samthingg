"use client";
import React, { useState, useEffect, useMemo } from "react";
import BaseButton from "./buttons/BaseButton";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from "next/image";
import { cn } from "@/libraries/utils";
import {
  IgniteCardViewConfigItem,
  useCustomIgniteCardView,
} from "@/stores/setting/use-custom-ignite-card-view.store";
import { useCustomizeTheme } from "@/hooks/use-customize-theme";
import CustomCosmoStats from "./cards/partials/CustomCosmoStats";
import { useCustomizeSettingsStore } from "@/stores/setting/use-customize-settings.store";
import { DUMMY_MINT } from "./cards/partials/TokenTrackers";
import CustomIgniteStats from "./cards/partials/CustomIgniteStats";

const defaultConfig: IgniteCardViewConfigItem[] = [
  // #== Data Items ==#
  {
    key: "volume",
    label: "Volume",
    status: "active",
    type: "data",
    position: 1,
  },
  {
    key: "liquidity",
    label: "Liquidity",
    status: "active",
    type: "data",
    position: 2,
  },
  {
    key: "holders",
    label: "Holders",
    status: "active",
    type: "data",
    position: 3,
  },
  {
    key: "real-users",
    label: "Real Users",
    status: "active",
    type: "data",
    position: 4,
  },

  // #== Security Items ==#
  {
    key: "snipe",
    label: "Snipe",
    status: "active",
    type: "security",
    position: 1,
  },
  {
    key: "insiders",
    label: "Insiders",
    status: "active",
    type: "security",
    position: 2,
  },
  {
    key: "dev-holdings",
    label: "Dev Holdings",
    status: "active",
    type: "security",
    position: 3,
  },
  {
    key: "dev-token-migrated",
    label: "Dev Tokens Migrated",
    status: "active",
    type: "security",
    position: 4,
  },
  {
    key: "total-fees",
    label: "Total Fees Paid",
    status: "active",
    type: "security",
    position: 5,
  },
];

interface DisplayContentProps {
  localConfig: IgniteCardViewConfigItem[];
  handleClose: () => void;
  handleReset: () => void;
  handleSave: () => void;
  renderPositionDropdown: (type: "data" | "security", position: number) => React.ReactNode;
  maxPositions: {
    "data": number;
    "security": number;
  };
}

const DisplayContent: React.FC<DisplayContentProps> = ({
  localConfig,
  handleClose,
  handleReset,
  handleSave,
  renderPositionDropdown,
  maxPositions,
}) => (
  <>
    <div className="flex flex-row items-center justify-between border-b border-border p-4">
      <h4 className="font-geistSemiBold text-[18px] text-fontColorPrimary">
        Display
      </h4>
      <button
        title="Close"
        onClick={handleClose}
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

    <div className="flex max-md:overflow-y-scroll h-full flex-col overflow-x-hidden">
      <div className="flex flex-col p-4">
        <h5 className="mb-3 text-sm font-medium text-fontColorPrimary">
          Customize Data Items
        </h5>
        <div className="nova-scroller hide relative w-full flex-grow">
          {/* Dropdown Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-1">
            {Array.from(
              { length: maxPositions["data"] },
              (_, index) => (
                <div key={index} className="flex flex-col gap-1">
                  {renderPositionDropdown("data", index + 1)}
                </div>
              ),
            )}
          </div>
        </div>
      </div>
      <div className="flex flex-col p-4">
        <h5 className="mb-3 text-sm font-medium text-fontColorPrimary">
          Customize Security Items
        </h5>
        <div className="nova-scroller hide relative w-full flex-grow">
          {/* Dropdown Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-1">
            {Array.from({ length: maxPositions["security"] }, (_, index) => (
              <div key={index} className="flex flex-col gap-1">
                {renderPositionDropdown("security", index + 1)}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Preview Section */}
      <div className="border-t border-border p-4">
        <h5 className="mb-3 text-sm font-medium text-fontColorPrimary">
          Preview:
        </h5>

        {/* StatBadges Preview */}
        <div className="flex flex-col w-full justify-between gap-4 rounded-lg border border-border p-3">
          <CustomIgniteStats
            type="data"
            regular_traders={12}
            volume_usd={120232}
            dev_migrated={3}
            sniper_percentage={50}
            liquidity_usd={122323}
            insider_percentage={10}
            holders={2}
            dev_holding_percentage={5}
            bot_total_fees={1000000}
            customCardViewConfig={localConfig}
          />
          <CustomIgniteStats
            type="security"
            regular_traders={12}
            volume_usd={120232}
            dev_migrated={3}
            sniper_percentage={50}
            liquidity_usd={122323}
            insider_percentage={10}
            holders={2}
            dev_holding_percentage={5}
            bot_total_fees={1000000}
            customCardViewConfig={localConfig}
          />
        </div>
      </div>
      <div className="mt-auto flex w-full items-center justify-between gap-x-3 rounded-b-[8px] border-t border-border p-4">
        <button
          onClick={handleReset}
          className="font-geistSemiBold text-sm text-primary duration-300 hover:text-[#be7ad2]"
        >
          Reset
        </button>
        <BaseButton
          type="button"
          onClick={handleSave}
          variant="primary"
          className="px-3 py-2"
        >
          <span className="text-sm">Apply</span>
        </BaseButton>
      </div>
    </div>
  </>
);

const CustomIgniteCardView = ({ isMobile }: {
  isMobile?: boolean;
}) => {
  const theme = useCustomizeTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { cardViewConfig, setCardViewConfig } = useCustomIgniteCardView();
  const [localConfig, setLocalConfig] = useState([...cardViewConfig]);

  // Reset local config when popover/drawer opens or when cardViewConfig changes
  useEffect(() => {
    setLocalConfig([...cardViewConfig]);
  }, [isOpen, isDrawerOpen, cardViewConfig]);

  // Get available items for each type
  const getAvailableItems = () => {
    return cardViewConfig?.map((item) => ({
      key: item.key,
      label: item.label,
    }));
  };

  const customizedSettingPresets = useCustomizeSettingsStore(
    (state) => state.presets,
  );
  const customizedSettingActivePreset = useCustomizeSettingsStore(
    (state) => state.activePreset,
  );
  const currentColorPreset = useMemo(
    () =>
      customizedSettingPresets[customizedSettingActivePreset].colorSetting ||
      "normal",
    [customizedSettingPresets, customizedSettingActivePreset],
  );

  // Get active items by type and sorted by position
  const getActiveItemsByType = (type: "data" | "security") => {
    return localConfig
      ?.filter((item) => item.type === type && item.status === "active")
      .sort((a, b) => a.position - b.position);
  };

  // Get inactive items by type
  const getInactiveItemsByType = (type: "data" | "security") => {
    return localConfig?.filter(
      (item) => item.type === type && item.status === "inactive",
    );
  };
  // Handle dropdown selection
  const handleDropdownSelect = (
    type: "data" | "security",
    position: number,
    selectedKey: string,
  ) => {
    const newConfig = [...localConfig];

    // Find current item at this position
    const currentItemIndex = newConfig.findIndex(
      (item) =>
        item.type === type &&
        item.status === "active" &&
        item.position === position,
    );

    if (currentItemIndex !== -1) {
      // Deactivate current item at this position
      newConfig[currentItemIndex] = {
        ...newConfig[currentItemIndex],
        status: "inactive",
      };
    }

    // If "None" is selected, just deactivate the current item and return
    if (selectedKey === "None" || selectedKey === "") {
      setLocalConfig(newConfig);
      return;
    }

    // Find the selected item
    const selectedItemIndex = newConfig.findIndex(
      (item) => item.key === selectedKey,
    );
    if (selectedItemIndex === -1) return;

    // Activate and position the selected item
    newConfig[selectedItemIndex] = {
      ...newConfig[selectedItemIndex],
      status: "active",
      type: type,
      position: position,
    };

    setLocalConfig(newConfig);
  };
  // Handle reset
  const handleReset = () => {
    setLocalConfig(defaultConfig);
  };

  // Handle save
  const handleSave = () => {
    setCardViewConfig(localConfig);
    setIsOpen(false);
    setIsDrawerOpen(false);
  };

  // Handle close
  const handleClose = () => {
    setIsOpen(false);
    setIsDrawerOpen(false);
  };

  // Get maximum positions for each type
  const maxPositions = {
    "data": 4,
    "security": 5,
  };

  // Render dropdown for a position
  const renderPositionDropdown = (
    type: "data" | "security",
    position: number,
  ) => {
    const activeItems = getActiveItemsByType(type);
    const availableItems = getAvailableItems();
    const currentItem = (activeItems || [])?.find(
      (item) => item.position === position,
    );

    return (
      <Select
        key={`${type}-${position}`}
        value={currentItem?.key || "None"}
        onValueChange={(value) => handleDropdownSelect(type, position, value)}
      >
        <SelectTrigger className="h-8 w-full md:w-32 text-xs">
          <SelectValue placeholder="Select..." />
        </SelectTrigger>
        <SelectContent
          className="gb__white__popover z-[1000] max-h-[200px] overflow-y-auto shadow-[0_5px_15px_0_rgba(0,0,0,05)]"
          style={theme.background}
        >
          <SelectItem
            value="None"
            className={cn(
              "h-7 rounded-sm border border-transparent transition-colors duration-100 hover:border-primary hover:bg-primary/[10%]",
            )}
          >
            None
          </SelectItem>
          {availableItems?.map((item) => {
            return (
              <SelectItem
                key={item?.key}
                value={item?.key}
                className={cn(
                  "h-7 rounded-sm border border-transparent transition-colors duration-100 hover:border-primary hover:bg-primary/[10%]",
                  currentItem?.key === item?.key &&
                  "border-primary bg-primary/[15%]",
                )}
              >
                {item?.label}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    );
  };

  return (
    <>
      {/* Desktop Version - Popover */}
      {!isMobile && (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <BaseButton
                      variant="gray"
                      className="relative h-8 hidden lg:flex"
                      onClick={() => setIsOpen((prev) => !prev)}
                    >
                      <div className="relative aspect-square h-5 w-5 flex-shrink-0">
                        <Image
                          src={
                            currentColorPreset === "cupsey"
                              ? "/icons/display-cupsey.svg"
                              : "/icons/card-view-config.svg"
                          }
                          alt="Card View Config Icon"
                          fill
                          quality={100}
                          className="object-contain"
                        />
                      </div>
                      <span className="max-md:hidden">
                        Display
                      </span>
                      <div className="relative flex size-4 rotate-180 items-center justify-center max-md:hidden">
                        <Image
                          src="/icons/arrow-up-cupsey.svg"
                          alt="Cupsey Icon"
                          fill
                          quality={100}
                          className="object-contain"
                        />
                      </div>
                    </BaseButton>
                  </TooltipTrigger>
                  <TooltipContent isWithAnimation={false} side="top">
                    Display
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            sideOffset={8}
            className="gb__white__popover relative z-[1000] max-h-[650px] w-[600px] flex-col border border-border p-0 shadow-[0_10px_20px_0_rgba(0,0,0,1)]"
            style={theme.background}
          >
            <DisplayContent
              localConfig={localConfig}
              handleClose={handleClose}
              handleReset={handleReset}
              handleSave={handleSave}
              renderPositionDropdown={renderPositionDropdown}
              maxPositions={maxPositions}
            />
          </PopoverContent>
        </Popover>
      )}

      {/* Mobile Version - Drawer */}
      {isMobile && (
        <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
          <DrawerTrigger asChild>
            <div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <BaseButton
                      variant="gray"
                      className="relative h-8 flex lg:hidden"
                      onClick={() => setIsDrawerOpen(true)}
                    >
                      <div className="relative aspect-square h-5 w-5 flex-shrink-0">
                        <Image
                          src={
                            currentColorPreset === "cupsey"
                              ? "/icons/display-cupsey.svg"
                              : "/icons/card-view-config.svg"
                          }
                          alt="Card View Config Icon"
                          fill
                          quality={100}
                          className="object-contain"
                        />
                      </div>
                      <span className="max-md:hidden">
                        Display
                      </span>
                      <div className="relative flex size-4 rotate-180 items-center justify-center max-md:hidden">
                        <Image
                          src="/icons/arrow-up-cupsey.svg"
                          alt="Cupsey Icon"
                          fill
                          quality={100}
                          className="object-contain"
                        />
                      </div>
                    </BaseButton>
                  </TooltipTrigger>
                  <TooltipContent isWithAnimation={false} side="top">
                    Display
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </DrawerTrigger>
          <DrawerContent
            className="h-[90%] flex flex-col"
            style={theme.background}
          >
            <DisplayContent
              localConfig={localConfig}
              handleClose={handleClose}
              handleReset={handleReset}
              handleSave={handleSave}
              renderPositionDropdown={renderPositionDropdown}
              maxPositions={maxPositions}
            />
          </DrawerContent>
        </Drawer>
      )}
    </>
  );
};

export default CustomIgniteCardView;
