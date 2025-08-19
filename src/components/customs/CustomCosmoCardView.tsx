"use client";
import React, { useState, useEffect, useMemo } from "react";
import BaseButton from "./buttons/BaseButton";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  CosmoCardViewConfigItem,
  useCustomCosmoCardView,
} from "@/stores/setting/use-custom-cosmo-card-view.store";
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";
import { useCustomizeTheme } from "@/hooks/use-customize-theme";
import CustomCosmoStats from "./cards/partials/CustomCosmoStats";
import { useCustomizeSettingsStore } from "@/stores/setting/use-customize-settings.store";
import { DUMMY_MINT } from "./cards/partials/TokenTrackers";
import {
  ArrowUpCupseyIconSVG,
  CardViewConfigIconSVG,
  DisplayCupseyIconSVG,
} from "./ScalableVectorGraphics";

const defaultConfig: CosmoCardViewConfigItem[] = [
  {
    key: "top-10-holders",
    label: "Top 10 Holders",
    status: "active",
    type: "stat-badge",
    position: 1,
  },
  {
    key: "dev-holdings",
    label: "Dev Holdings",
    status: "active",
    type: "stat-badge",
    position: 2,
  },
  {
    key: "regular-users",
    label: "Regular Users",
    status: "active",
    type: "stat-badge",
    position: 3,
  },
  {
    key: "star",
    label: "Star",
    status: "active",
    type: "stat-badge",
    position: 4,
  },
  {
    key: "snipers",
    label: "Snipers",
    status: "active",
    type: "stat-badge",
    position: 5,
  },
  {
    key: "insiders",
    label: "Insiders",
    status: "active",
    type: "stat-badge",
    position: 6,
  },
  {
    key: "bundled",
    label: "Bundled",
    status: "active",
    type: "stat-badge",
    position: 7,
  },
  {
    key: "market-cap",
    label: "Market Cap",
    status: "active",
    type: "stat-text",
    position: 1,
  },
  {
    key: "volume",
    label: "Volume",
    status: "active",
    type: "stat-text",
    position: 2,
  },
  {
    key: "holders",
    label: "Holders",
    status: "active",
    type: "stat-text",
    position: 3,
  },
  {
    key: "discord",
    label: "Discord Group",
    status: "active",
    type: "stat-text",
    position: 4,
  },
  {
    key: "tracker",
    label: "Tracker",
    status: "active",
    type: "stat-text",
    position: 5,
  },
  {
    key: "bot-total-fee",
    label: "Total Fees Paid",
    status: "active",
    type: "stat-text",
    position: 6,
  },
];

const CustomCosmoCardView = () => {
  const theme = useCustomizeTheme();
  const [isOpen, setIsOpen] = useState(false);
  const { cardViewConfig, setCardViewConfig } = useCustomCosmoCardView();
  const [localConfig, setLocalConfig] = useState([...cardViewConfig]);

  // Reset local config when popover opens or when cardViewConfig changes
  useEffect(() => {
    setLocalConfig([...cardViewConfig]);
  }, [isOpen, cardViewConfig]);

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
  const getActiveItemsByType = (type: "stat-badge" | "stat-text") => {
    return localConfig
      ?.filter((item) => item.type === type && item.status === "active")
      .sort((a, b) => a.position - b.position);
  };

  // Get inactive items by type
  const getInactiveItemsByType = (type: "stat-badge" | "stat-text") => {
    return localConfig?.filter(
      (item) => item.type === type && item.status === "inactive",
    );
  };
  // Handle dropdown selection
  const handleDropdownSelect = (
    type: "stat-badge" | "stat-text",
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
  };

  // Get maximum positions for each type
  const maxPositions = {
    "stat-badge": 7,
    "stat-text": 7,
  };

  // Render dropdown for a position
  const renderPositionDropdown = (
    type: "stat-badge" | "stat-text",
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
        <SelectTrigger className="h-8 w-32 text-xs">
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
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <BaseButton
                  variant="gray"
                  className="relative hidden h-8 lg:flex"
                  onClick={() => setIsOpen((prev) => !prev)}
                >
                  <div className="relative aspect-square h-5 w-5 flex-shrink-0">
                    {currentColorPreset === "cupsey" ? (
                      <DisplayCupseyIconSVG />
                    ) : (
                      <CardViewConfigIconSVG />
                    )}
                    {/* <Image
                      src={
                        currentColorPreset === "cupsey"
                          ? "/icons/display-cupsey.svg"
                          : "/icons/card-view-config.svg"
                      }
                      alt="Card View Config Icon"
                      fill
                      quality={100}
                      className="object-contain"
                    /> */}
                  </div>
                  Display
                  <div className="relative flex size-4 rotate-180 items-center justify-center">
                    <ArrowUpCupseyIconSVG />
                    {/* <Image
                      src="/icons/arrow-up-cupsey.svg"
                      alt="Cupsey Icon"
                      fill
                      quality={100}
                      className="object-contain"
                    /> */}
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
        className="gb__white__popover relative z-[1000] hidden max-h-[650px] w-[600px] flex-col border border-border p-0 shadow-[0_10px_20px_0_rgba(0,0,0,1)] lg:flex"
        style={theme.background}
      >
        <div className="flex flex-row items-center justify-between border-b border-border p-4">
          <h4 className="font-geistSemiBold text-[18px] text-fontColorPrimary">
            Display
          </h4>
          <button
            title="Close"
            onClick={() => setIsOpen(false)}
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
        <div className="flex flex-col p-4">
          <h5 className="mb-3 text-sm font-medium text-fontColorPrimary">
            Customize Right Column Icons
          </h5>
          <div className="nova-scroller hide relative w-full flex-grow">
            {/* Dropdown Grid */}
            <div className="grid grid-cols-4 gap-1">
              {Array.from(
                { length: maxPositions["stat-badge"] },
                (_, index) => (
                  <div key={index} className="flex flex-col gap-1">
                    {renderPositionDropdown("stat-badge", index + 1)}
                  </div>
                ),
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-col p-4">
          <h5 className="mb-3 text-sm font-medium text-fontColorPrimary">
            Customize Left Column Icons
          </h5>
          <div className="nova-scroller hide relative w-full flex-grow">
            {/* Dropdown Grid */}
            <div className="grid grid-cols-4 gap-1">
              {Array.from({ length: maxPositions["stat-text"] }, (_, index) => (
                <div key={index} className="flex flex-col gap-1">
                  {renderPositionDropdown("stat-text", index + 1)}
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
          <div className="flex w-full justify-between gap-4 rounded-lg border border-border p-3">
            <CustomCosmoStats
              className="rounded-md bg-secondary p-2"
              customCardViewConfig={localConfig}
              regular_users={1000}
              bot_total_fees={5000}
              devHoldingPercentage={0.1}
              discord={{
                discord_details: {
                  address: "https://discord.gg/example",
                  channel: "example-channel",
                  channel_counts: {
                    members: { total: 1000 },
                  },
                  group: "Example Discord Group",
                  group_counts: [
                    {
                      name: "Nova Example",
                      count: 100,
                      image: "/icons/potion.jpg",
                      pinged_first: true,
                    },
                  ],
                  last_updated: "2023-10-01T12:00:00Z",
                  timestamp: "2023-10-01T12:00:00Z",
                  token_data: {
                    buys: 10,
                    sells: 5,
                    marketCap: 1000000,
                    token_dex: "Uniswap",
                    token_name: "Example Token",
                    token_image: "/path/to/image.png",
                    token_symbol: "EXM",
                    token_instagram: "https://instagram.com/example",
                    token_twitter: "https://twitter.com/example",
                    token_mint: "0x1234567890abcdef1234567890abcdef12345678",
                    token_website: "https://example.com",
                    token_telegram: "https://t.me/example",
                    token_tiktok: "https://tiktok.com/@example",
                    token_youtube: "https://youtube.com/example",
                    volume: 50000,
                  },
                  total_count: 5,
                },
                is_discord_monitored: true,
              }}
              holders={1000}
              insiderPercentage={0.05}
              isMigrating={false}
              isDevSold={false}
              dev_wallet_details={{
                developer: "ExampleDeveloperWalletAddress",
                funder: {
                  amount: 1000000000,
                  time: 1692300000,
                  wallet: "ExampleFunderWalletAddress",
                  exchange: "ExampleExchange",
                  tx_hash: "ExampleTxHash",
                },
                mint: DUMMY_MINT,
              }}
              marketCapUSD={1000000}
              mint={DUMMY_MINT}
              snipers={50}
              stars={5}
              top10Percentage={0.2}
              type="stat-badge"
              volumeUSD={50000}
              bundled_percentage={0.2}
              cardType="type2"
            />
            <CustomCosmoStats
              className="justify-end rounded-md bg-secondary p-2"
              customCardViewConfig={localConfig}
              regular_users={1000}
              bot_total_fees={5000}
              devHoldingPercentage={0.1}
              discord={{
                discord_details: {
                  address: "https://discord.gg/example",
                  channel: "example-channel",
                  channel_counts: {
                    members: { total: 1000 },
                  },
                  group: "Example Discord Group",
                  group_counts: [
                    {
                      name: "Nova Example",
                      count: 100,
                      image: "/icons/potion.jpg",
                      pinged_first: true,
                    },
                  ],
                  last_updated: "2023-10-01T12:00:00Z",
                  timestamp: "2023-10-01T12:00:00Z",
                  token_data: {
                    buys: 10,
                    sells: 5,
                    marketCap: 1000000,
                    token_dex: "Uniswap",
                    token_name: "Example Token",
                    token_image: "/path/to/image.png",
                    token_symbol: "EXM",
                    token_instagram: "https://instagram.com/example",
                    token_twitter: "https://twitter.com/example",
                    token_mint: "0x1234567890abcdef1234567890abcdef12345678",
                    token_website: "https://example.com",
                    token_telegram: "https://t.me/example",
                    token_tiktok: "https://tiktok.com/@example",
                    token_youtube: "https://youtube.com/example",
                    volume: 50000,
                  },
                  total_count: 5,
                },
                is_discord_monitored: true,
              }}
              holders={1000}
              insiderPercentage={0.05}
              isMigrating={false}
              isDevSold={false}
              dev_wallet_details={{
                developer: "ExampleDeveloperWalletAddress",
                funder: {
                  amount: 1000000000,
                  time: 1692300000,
                  wallet: "ExampleFunderWalletAddress",
                  exchange: "ExampleExchange",
                  tx_hash: "ExampleTxHash",
                },
                mint: DUMMY_MINT,
              }}
              marketCapUSD={1000000}
              mint={DUMMY_MINT}
              snipers={50}
              stars={5}
              top10Percentage={0.2}
              type="stat-text"
              volumeUSD={50000}
              bundled_percentage={0.2}
              cardType="type2"
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
      </PopoverContent>
    </Popover>
  );
};

export default CustomCosmoCardView;
