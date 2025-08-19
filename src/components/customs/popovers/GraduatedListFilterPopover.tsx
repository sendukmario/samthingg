"use client";

// ######## Libraries 📦 & Hooks 🪝 ########
import React, { useState, useEffect, useMemo } from "react";
import {
  useGraduatedFilterStore,
  GraduatedFilterState,
} from "@/stores/cosmo/use-graduated-filter.store";
import { useBlacklistedDeveloperFilterStore } from "@/stores/cosmo/use-blacklisted-developer-filter.store";
import { useWindowSizeStore } from "@/stores/use-window-size.store";
import { usePopupStore } from "@/stores/use-popup-state.store";
import toast from "react-hot-toast";
// ######## Components 🧩 ########
import Image from "next/image";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import BaseButton from "@/components/customs/buttons/BaseButton";
import Separator from "@/components/customs/Separator";
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
// ######## Utils & Helpers 🤝 ########
import { cn } from "@/libraries/utils";
import convertCosmoIntoWSFilterFormat from "@/utils/convertCosmoIntoWSFilterFormat";
// ######## Types 🗨️ ########.
import { CosmoFilterSubscribeMessageType, DEX } from "@/types/ws-general";
import { useHiddenTokensStore } from "@/stores/cosmo/use-hidden-tokens.store";
import { useCustomizeTheme } from "@/hooks/use-customize-theme";
import { useCustomToast } from "@/hooks/use-custom-toast";
import {
  GeneralTabIconSVG,
  GeneralHoverTabIconSVG,
  GeneralIncativeTabIconSVG,
  AuditTabIconSVG,
  AuditHoverTabIconSVG,
  AuditInactiveTabIconSVG,
  SocialsTabIconSVG,
  SocialsHoverTabIconSVG,
  SocialsInactiveTabIconSVG,
} from "../ScalableVectorGraphics";

// Function to get appropriate tab icon based on state
const getTabIcon = (
  tabType: "general" | "audit" | "socials",
  isActive: boolean,
  isHovered: boolean,
) => {
  if (tabType === "general") {
    if (isActive) return <GeneralTabIconSVG />;
    if (isHovered) return <GeneralHoverTabIconSVG />;
    return <GeneralIncativeTabIconSVG />;
  }

  if (tabType === "audit") {
    if (isActive) return <AuditTabIconSVG />;
    if (isHovered) return <AuditHoverTabIconSVG />;
    return <AuditInactiveTabIconSVG />;
  }

  if (tabType === "socials") {
    if (isActive) return <SocialsTabIconSVG />;
    if (isHovered) return <SocialsHoverTabIconSVG />;
    return <SocialsInactiveTabIconSVG />;
  }

  return null;
};

// Function to count active filters for each tab
const countActiveFilters = (
  tabType: "general" | "audit" | "socials",
  filters: any,
) => {
  let count = 0;

  if (tabType === "general") {
    // Check range filters (min/max values)
    const rangeFilters = [
      filters.byMarketCap,
      filters.byVolume,
      filters.byCurrentLiquidity,
      filters.byHoldersCount,
      filters.byBotHolders,
      filters.byTXNS,
      filters.byBuys,
      filters.bySells,
    ];

    rangeFilters.forEach((filter) => {
      if (filter?.min !== undefined || filter?.max !== undefined) {
        count++;
      }
    });
  }

  if (tabType === "audit") {
    // Check audit specific range filters
    const auditRangeFilters = [
      filters.byTop10Holders,
      filters.byAge,
      filters.byDevHoldingPercentage,
      filters.byDevMigrated,
      filters.bySnipers,
      filters.byInsiderHoldingPercentage,
    ];

    auditRangeFilters.forEach((filter) => {
      if (filter?.min !== undefined || filter?.max !== undefined) {
        count++;
      }
    });
  }

  if (tabType === "socials") {
    // Count how many social platforms are mentioned in keywords
    const socialKeywords = socialList.map((s) => s.socialValue.toLowerCase());
    const showKeywordsLower = filters.showKeywords?.toLowerCase() || "";
    const hideKeywordsLower = filters.doNotShowKeywords?.toLowerCase() || "";

    socialKeywords.forEach((social) => {
      if (
        showKeywordsLower.includes(social) ||
        hideKeywordsLower.includes(social)
      ) {
        count++;
      }
    });
  }

  return count;
};

const socialList: {
  name: string;
  iconURL: string;
  customClass: string;
  socialValue: string;
}[] = [
  {
    name: "Twitter",
    iconURL: "/icons/asset/_Twitter.svg",
    customClass: "",
    socialValue: "twitter",
  },
  {
    name: "Website",
    iconURL: "/icons/asset/website_15665589 1.svg",
    customClass: "",
    socialValue: "website",
  },
  {
    name: "Telegram",
    iconURL: "/icons/asset/_Telegram.svg",
    customClass: "",
    socialValue: "telegram",
  },
  {
    name: "YouTube",
    iconURL: "/icons/asset/_YouTube.svg",
    customClass: "",
    socialValue: "youtube",
  },
  {
    name: "TikTok",
    iconURL: "/icons/asset/_TikTok.svg",
    customClass: "",
    socialValue: "tiktok",
  },
  {
    name: "Instagram",
    iconURL: "/icons/asset/_Instagram.svg",
    customClass: "",
    socialValue: "instagram",
  },
];

const dexList: {
  name: DEX;
  iconURL: string;
  dexValue: keyof GraduatedFilterState["filters"]["preview"]["checkBoxes"];
  customClass: string;
}[] = [
  {
    name: "Moonshot",
    iconURL: "/icons/asset/yellow-moonshot.png",
    dexValue: "moonshot",
    customClass: "",
  },
  {
    name: "PumpFun",
    iconURL: "/icons/asset/pumpfun.png",
    dexValue: "pumpfun",
    customClass: "",
  },
  {
    name: "Dynamic Bonding Curve",
    iconURL: "/icons/asset/dynamic_bonding_curve.svg",
    dexValue: "dynamic_bonding_curve",
    customClass: "",
  },
  {
    name: "Launch a Coin",
    iconURL: "/icons/asset/launch_a_coin.png",
    dexValue: "launch_a_coin",
    customClass: "",
  },
  {
    name: "Candle TV",
    iconURL: "/icons/asset/candle_tv.png",
    dexValue: "candle_tv",
    customClass: "",
  },
  {
    name: "Bonk",
    iconURL: "/icons/asset/bonk.svg",
    dexValue: "bonk",
    customClass: "",
  },
  {
    name: "LaunchLab",
    iconURL: "/icons/asset/launch_lab.svg",
    dexValue: "launchlab",
    customClass: "",
  },
  {
    name: "Raydium",
    iconURL: "/icons/asset/raydium.png",
    dexValue: "raydium",
    customClass: "",
  },
  {
    name: "Boop",
    iconURL: "/icons/asset/boop.png",
    dexValue: "boop",
    customClass: "",
  },
  {
    name: "MoonIt",
    iconURL: "/icons/asset/moonit.svg",
    dexValue: "moonit",
    customClass: "",
  },
  {
    name: "Orca",
    iconURL: "/icons/asset/orca.svg",
    dexValue: "orca",
    customClass: "",
  },
  {
    name: "Jupiter Studio",
    iconURL: "/icons/asset/jupiter_studio.svg",
    dexValue: "jupiter_studio",
    customClass: "",
  },
  {
    name: "Bags",
    iconURL: "/icons/asset/bags.svg",
    dexValue: "bags",
    customClass: "",
  },
  {
    name: "Heaven",
    iconURL: "/icons/asset/heaven.png",
    dexValue: "heaven",
    customClass: "",
  },
];

const GraduatedListFilterPopover = React.memo(
  ({
    handleSendFilterMessage,
  }: {
    handleSendFilterMessage?: (
      category: "created" | "aboutToGraduate" | "graduated",
      filterObject: CosmoFilterSubscribeMessageType,
    ) => void;
  }) => {
    const theme = useCustomizeTheme();
    const { warning } = useCustomToast();
    // Filter & Hovered Configuration ✨
    const {
      checkBoxes,
      showKeywords,
      doNotShowKeywords,
      byHoldersCount,
      byTop10Holders,
      byDevHoldingPercentage,
      byDevMigrated,
      bySnipers,
      byInsiderHoldingPercentage,
      byBotHolders,
      byAge,
      byCurrentLiquidity,
      byVolume,
      byMarketCap,
      byTXNS,
      byBuys,
      bySells,
    } = useGraduatedFilterStore((state) => state.filters.preview);
    const {
      checkBoxes: GcheckBoxes,
      showKeywords: GshowKeywords,
      doNotShowKeywords: GdoNotShowKeywords,
      byHoldersCount: GbyHoldersCount,
      byTop10Holders: GbyTop10Holders,
      byDevHoldingPercentage: GbyDevHoldingPercentage,
      byDevMigrated: GbyDevMigrated,
      bySnipers: GbySnipers,
      byInsiderHoldingPercentage: GbyInsiderHoldingPercentage,
      byBotHolders: GbyBotHolders,
      byAge: GbyAge,
      byCurrentLiquidity: GbyCurrentLiquidity,
      byVolume: GbyVolume,
      byMarketCap: GbyMarketCap,
      byTXNS: GbyTXNS,
      byBuys: GbyBuys,
      bySells: GbySells,
    } = useGraduatedFilterStore((state) => state.filters.genuine);
    const {
      setIsLoadingFilterFetch,
      toggleGraduatedFilter,
      setShowKeywords,
      setDoNotShowKeywords,
      setRangeFilter,
      resetGraduatedFilters,
      applyGraduatedFilters,
      updateGraduatedFiltersCount,
    } = useGraduatedFilterStore();

    // Calculate active filter counts for each tab using preview filters
    const generalFilterCount = countActiveFilters("general", {
      byMarketCap,
      byVolume,
      byCurrentLiquidity,
      byHoldersCount,
      byBotHolders,
      byTXNS,
      byBuys,
      bySells,
    });

    const auditFilterCount = countActiveFilters("audit", {
      byTop10Holders,
      byAge,
      byDevHoldingPercentage,
      byDevMigrated,
      bySnipers,
      byInsiderHoldingPercentage,
    });

    const socialsFilterCount = countActiveFilters("socials", {
      showKeywords,
      doNotShowKeywords,
    });

    const previewSelectedDexesCount = Object.entries(checkBoxes)?.filter(
      ([key, value]) => key !== "showHide" && value === true,
    ).length;

    const toggleGraduatedFilterWithValidation = (
      filterKey: keyof GraduatedFilterState["filters"]["preview"]["checkBoxes"],
      filterType: keyof GraduatedFilterState["filters"],
    ) => {
      if (filterKey === "showHide") {
        toggleGraduatedFilter(filterKey, filterType);
      } else {
        if (previewSelectedDexesCount === 1 && checkBoxes[filterKey]) {
          // toast.custom((t) => (
          //   <CustomToast
          //     tVisibleState={t.visible}
          //     message="Please select at least one Dex"
          //     state="WARNING"
          //   />
          // ));
          warning("Please select at least one Dex");
        } else {
          toggleGraduatedFilter(filterKey, filterType);
        }
      }
    };

    const isFilterApplied = useMemo(() => {
      const hasMinMaxFilter = (filter: {
        min: number | undefined;
        max: number | undefined;
      }) => filter?.min !== undefined || filter?.max !== undefined;

      return (
        GcheckBoxes.moonshot === false ||
        GcheckBoxes.pumpfun === false ||
        GcheckBoxes.dynamic_bonding_curve === false ||
        GcheckBoxes.launch_a_coin === false ||
        GcheckBoxes.candle_tv === false ||
        GcheckBoxes.bonk === false ||
        GcheckBoxes.launchlab === false ||
        GcheckBoxes.raydium === false ||
        GcheckBoxes.moonit === false ||
        GcheckBoxes.orca === false ||
        GcheckBoxes.jupiter_studio === false ||
        GcheckBoxes.bags === false ||
        GcheckBoxes.boop === false ||
        GcheckBoxes.showHide === true ||
        GshowKeywords !== "" ||
        GdoNotShowKeywords !== "" ||
        hasMinMaxFilter(GbyHoldersCount) ||
        hasMinMaxFilter(GbyTop10Holders) ||
        hasMinMaxFilter(GbyDevHoldingPercentage) ||
        hasMinMaxFilter(GbyDevMigrated) ||
        hasMinMaxFilter(GbySnipers) ||
        hasMinMaxFilter(GbyInsiderHoldingPercentage) ||
        hasMinMaxFilter(GbyBotHolders) ||
        hasMinMaxFilter(GbyAge) ||
        hasMinMaxFilter(GbyCurrentLiquidity) ||
        hasMinMaxFilter(GbyVolume) ||
        hasMinMaxFilter(GbyMarketCap) ||
        hasMinMaxFilter(GbyTXNS) ||
        hasMinMaxFilter(GbyBuys) ||
        hasMinMaxFilter(GbySells)
      );
    }, [
      GcheckBoxes.moonshot,
      GcheckBoxes.pumpfun,
      GcheckBoxes.dynamic_bonding_curve,
      GcheckBoxes.launch_a_coin,
      GcheckBoxes.candle_tv,
      GcheckBoxes.bonk,
      GcheckBoxes.launchlab,
      GcheckBoxes.raydium,
      GcheckBoxes.moonit,
      GcheckBoxes.orca,
      GcheckBoxes.jupiter_studio,
      GcheckBoxes.bags,
      GcheckBoxes.boop,
      GcheckBoxes.showHide,
      GshowKeywords,
      GdoNotShowKeywords,
      GbyHoldersCount,
      GbyTop10Holders,
      GbyDevHoldingPercentage,
      GbyDevMigrated,
      GbySnipers,
      GbyInsiderHoldingPercentage,
      GbyBotHolders,
      GbyAge,
      GbyCurrentLiquidity,
      GbyVolume,
      GbyMarketCap,
      GbyTXNS,
      GbyBuys,
      GbySells,
    ]);

    const hiddenTokens = useHiddenTokensStore((s) => s.hiddenTokens);

    const { remainingScreenWidth } = usePopupStore();

    const [openFilterPopover, setOpenFilterPopover] = useState<boolean>(false);
    const [openFilterDrawer, setOpenFilterDrawer] = useState<boolean>(false);
    const [activeFilterTab, setActiveFilterTab] = useState<
      "general" | "audit" | "socials"
    >("general");
    const [hoveredTab, setHoveredTab] = useState<
      "general" | "audit" | "socials" | null
    >(null);
    const customSetOpenFilterPopover = (isOpen: boolean) => {
      setOpenFilterPopover(isOpen);

      // Apply filters only when the popover is closing to avoid unnecessary reloads
      if (!isOpen) {
        handleApplyFilter();
      }
    };
    const customSetOpenFilterDrawer = (isOpen: boolean) => {
      setOpenFilterDrawer(isOpen);

      // Apply filters only when the drawer is closing to avoid unnecessary reloads
      if (!isOpen) {
        handleApplyFilter();
      }
    };

    const width = useWindowSizeStore((state) => state.width);

    useEffect(() => {
      if (width! >= 1024 && openFilterDrawer) {
        setOpenFilterDrawer(false);
      } else if (width! < 1024 && openFilterPopover) {
        setOpenFilterPopover(false);
      }
    }, [width]);

    const handleNormalValue = (
      filterKey: keyof Omit<
        GraduatedFilterState["filters"]["preview"],
        "checkBoxes" | "showKeywords" | "doNotShowKeywords"
      >,
      e: React.ChangeEvent<HTMLInputElement>,
      rangeType: "min" | "max",
    ) => {
      const value = e.target.value;
      const isValid =
        value === "" || /^[1-9]\d*(\.\d+)?$|^0(\.\d+)?$/.test(value);

      if (isValid) {
        setRangeFilter(
          filterKey,
          value === "" ? undefined : parseFloat(value),
          rangeType,
          "preview",
        );
      }
    };

    const handlePercentageValue = (
      filterKey: keyof Omit<
        GraduatedFilterState["filters"]["preview"],
        "checkBoxes" | "showKeywords" | "doNotShowKeywords"
      >,
      e: React.ChangeEvent<HTMLInputElement>,
      rangeType: "min" | "max",
    ) => {
      const value = e.target.value;
      const isValid = value === "" || /^(0|[1-9]\d?|100)$/.test(value);

      if (isValid) {
        setRangeFilter(
          filterKey,
          value === "" ? undefined : parseInt(value),
          rangeType,
          "preview",
        );
      }
    };

    const handleResetFilter = () => {
      setIsLoadingFilterFetch(true);

      resetGraduatedFilters("genuine");
      resetGraduatedFilters("preview");

      setOpenFilterPopover(false);
      setOpenFilterDrawer(false);

      applyGraduatedFilters();

      handleApplyFilterAndSendMessage();
    };
    const handleApplyFilter = () => {
      // Trigger loading only if filters actually changed
      const { filters } = useGraduatedFilterStore.getState();
      const hasChanged =
        JSON.stringify(filters.preview) !== JSON.stringify(filters.genuine);
      if (hasChanged) {
        setIsLoadingFilterFetch(true);
      }

      setOpenFilterPopover(false);
      setOpenFilterDrawer(false);

      applyGraduatedFilters();

      handleApplyFilterAndSendMessage();
    };

    const handleApplyFilterAndSendMessage = () => {
      const latestGenuineFilters =
        useGraduatedFilterStore.getState()?.filters.genuine;
      const blacklistDevelopers =
        useBlacklistedDeveloperFilterStore.getState().blacklistedDevelopers;

      const filterObject = convertCosmoIntoWSFilterFormat(
        latestGenuineFilters,
        blacklistDevelopers,
        hiddenTokens?.join(","),
        "graduated",
      );

      handleSendFilterMessage?.("graduated", filterObject);
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
            <div className="relative hidden lg:block">
              <FilterButton
                handleOpen={() => setOpenFilterPopover((prev) => !prev)}
                isActive={openFilterPopover}
                text="Filter"
                size="icon"
              />
              <span
                className={cn(
                  "absolute right-0 top-[1px] block size-1.5 rounded-full bg-primary duration-300",
                  isFilterApplied ? "opacity-100" : "opacity-0",
                )}
              />
            </div>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            sideOffset={8}
            className="gb__white__popover relative hidden h-[65vh] max-h-[1380px] min-h-[320px] w-[520px] flex-col border border-border px-0 pb-[70px] pt-0 shadow-[0_10px_20px_0_rgba(0,0,0,1)] lg:flex"
            style={theme.background2}
          >
            <div className="flex h-[52px] flex-row items-center justify-between border-b border-border p-4">
              <h4 className="font-geistSemiBold text-base text-fontColorPrimary">
                Filter
              </h4>
              <button
                title="Close"
                onClick={() => setOpenFilterPopover((prev) => !prev)}
                className="relative aspect-square h-6 w-6 flex-shrink-0"
              >
                <Image
                  loading="lazy"
                  src="/icons/close.png"
                  alt="Close Icon"
                  fill
                  quality={100}
                  className="object-contain"
                />
              </button>
            </div>

            {/* Fields */}
            <div className="nova-scroller relative w-full flex-grow">
              <div className="absolute left-0 top-0 w-full flex-grow">
                <div className="flex h-auto w-full flex-col">
                  {/* A. Dexes */}
                  <div className="flex flex-col gap-1 p-4">
                    <Label className="text-sm text-fontColorSecondary">
                      Dex
                    </Label>

                    <div className="grid w-full grid-cols-4 gap-y-2">
                      {(dexList || [])?.map((dex) => {
                        const isChecked = checkBoxes?.[dex?.dexValue];

                        return (
                          <button
                            key={`ncl-d-${dex.dexValue}`}
                            onClick={() =>
                              toggleGraduatedFilterWithValidation(
                                dex?.dexValue,
                                "preview",
                              )
                            }
                            className="flex h-8 w-full cursor-pointer items-center justify-between gap-x-2 rounded-[8px] py-1 pr-1 duration-300"
                          >
                            <div className="flex items-center gap-x-1">
                              <div className="relative aspect-square h-5 w-5 flex-shrink-0">
                                <Image
                                  loading="lazy"
                                  src={
                                    isChecked
                                      ? "/icons/footer/checked.png"
                                      : "/icons/footer/unchecked.png"
                                  }
                                  alt="Check / Unchecked Icon"
                                  fill
                                  quality={100}
                                  className="object-contain"
                                />
                              </div>
                              <div
                                className={cn(
                                  "relative aspect-square h-4 w-4 flex-shrink-0",
                                  dex?.customClass,
                                )}
                              >
                                <Image
                                  src={dex?.iconURL}
                                  alt={`${dex?.name} Icon`}
                                  fill
                                  quality={100}
                                  className="object-contain rounded-full"
                                  loading="lazy"
                                />
                              </div>
                              <span className="inline-block text-nowrap text-sm text-fontColorPrimary">
                                {dex?.name && dex.name.length > 7
                                  ? `${dex.name.substring(0, 6)}...`
                                  : dex?.name}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <Separator />

                  {/* Show Hidden */}
                  {/* <div className="flex w-full p-4">
                    <div className="flex w-full flex-col gap-y-1">
                      <Label
                        htmlFor="showhiddencoinsfilter"
                        className="justify-between text-nowrap text-sm text-fontColorSecondary"
                      >
                        Show Hidden Coins Filter
                      </Label>
                      <button
                        onClick={() =>
                          toggleNewlyCreatedFilterWithValidation(
                            "showHide",
                            "preview",
                          )
                        }
                        className="flex h-8 w-full cursor-pointer items-center justify-between gap-x-2 rounded-[8px] border border-border bg-white/[3%] py-1 pl-2 pr-1 duration-300 hover:bg-white/[6%]"
                      >
                        <div className="flex items-center">
                          <span className="inline-block text-nowrap text-sm text-fontColorPrimary">
                            Show Hidden Coins
                          </span>
                        </div>
                        <div className="relative aspect-square h-6 w-6 flex-shrink-0">
                          <Image
                            src={
                              checkBoxes?.showHide
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
                  </div>*/}

                  <Separator />

                  {/* B. Symbol / Name */}
                  <div className="flex w-full justify-between gap-x-2 p-4">
                    <div className="flex flex-col gap-y-1">
                      <Label
                        htmlFor="showsymbolorname"
                        className="justify-between text-nowrap text-sm text-fontColorSecondary"
                      >
                        Symbol/Name
                      </Label>
                      <Input
                        id="showsymbolorname"
                        type="text"
                        value={showKeywords}
                        onChange={(e) =>
                          setShowKeywords(e.target.value, "preview")
                        }
                        placeholder="Enter Max 3 Keywords"
                        className="block h-8 w-full text-nowrap border-border bg-transparent text-sm text-fontColorPrimary placeholder:text-fontColorSecondary focus:outline-none focus:ring-0"
                      />
                    </div>

                    <div className="flex flex-col gap-y-1">
                      <Label
                        htmlFor="notshowsymbolorname"
                        className="ustify-between text-nowrap text-sm text-fontColorSecondary"
                      >
                        Do not show Symbol/Name
                      </Label>
                      <Input
                        id="notshowsymbolorname"
                        type="text"
                        value={doNotShowKeywords}
                        onChange={(e) =>
                          setDoNotShowKeywords(e.target.value, "preview")
                        }
                        placeholder="Enter Max 3 Keywords"
                        className="block h-8 w-full text-nowrap border-border bg-transparent text-sm text-fontColorPrimary placeholder:text-fontColorSecondary focus:outline-none focus:ring-0"
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Filter Tabs */}
                  <div className="flex w-full flex-col px-4 pb-4">
                    {/* Tab Headers */}
                    <div className="mb-4 flex w-full">
                      <button
                        onClick={() => setActiveFilterTab("general")}
                        onMouseEnter={() => setHoveredTab("general")}
                        onMouseLeave={() => setHoveredTab(null)}
                        className={cn(
                          "flex h-[50px] flex-1 items-center justify-center gap-1 font-geistSemiBold text-sm transition-all duration-300",
                          activeFilterTab === "general"
                            ? "border-b-2 border-fontColorPrimary text-fontColorPrimary"
                            : "border-b-2 border-secondary text-fontColorSecondary hover:border-primary hover:text-primary",
                        )}
                      >
                        {getTabIcon(
                          "general",
                          activeFilterTab === "general",
                          hoveredTab === "general",
                        )}
                        <p>General</p>
                        <span
                          className={cn(
                            generalFilterCount > 0 ? "text-primary" : "",
                          )}
                        >
                          ({generalFilterCount})
                        </span>
                      </button>
                      <button
                        onClick={() => setActiveFilterTab("audit")}
                        onMouseEnter={() => setHoveredTab("audit")}
                        onMouseLeave={() => setHoveredTab(null)}
                        className={cn(
                          "flex h-[50px] flex-1 items-center justify-center gap-1 font-geistSemiBold text-sm transition-all duration-300",
                          activeFilterTab === "audit"
                            ? "border-b-2 border-fontColorPrimary text-fontColorPrimary"
                            : "border-b-2 border-secondary text-fontColorSecondary hover:border-primary hover:text-primary",
                        )}
                      >
                        {getTabIcon(
                          "audit",
                          activeFilterTab === "audit",
                          hoveredTab === "audit",
                        )}
                        <p>Audit</p>
                        <span
                          className={cn(
                            auditFilterCount > 0 ? "text-primary" : "",
                          )}
                        >
                          ({auditFilterCount})
                        </span>
                      </button>
                      <button
                        onClick={() => setActiveFilterTab("socials")}
                        onMouseEnter={() => setHoveredTab("socials")}
                        onMouseLeave={() => setHoveredTab(null)}
                        className={cn(
                          "flex h-[50px] flex-1 items-center justify-center gap-1 font-geistSemiBold text-sm transition-all duration-300",
                          activeFilterTab === "socials"
                            ? "border-b-2 border-fontColorPrimary text-fontColorPrimary"
                            : "border-b-2 border-secondary text-fontColorSecondary hover:border-primary hover:text-primary",
                        )}
                      >
                        {getTabIcon(
                          "socials",
                          activeFilterTab === "socials",
                          hoveredTab === "socials",
                        )}
                        <p>Socials</p>
                        <span
                          className={cn(
                            socialsFilterCount > 0 ? "text-primary" : "",
                          )}
                        >
                          ({socialsFilterCount})
                        </span>
                      </button>
                    </div>

                    {/* Tab Content */}
                    {activeFilterTab === "general" && (
                      <div className="flex w-full flex-col gap-y-4">
                        {/* Market Cap */}
                        <div className="flex items-center gap-x-2">
                          <Label className="w-[50%] justify-between text-nowrap text-sm text-fontColorSecondary">
                            Market Cap
                          </Label>
                          <div className="flex w-full items-center gap-x-2">
                            <Input
                              type="number"
                              value={byMarketCap?.min}
                              onChange={(e) =>
                                handleNormalValue("byMarketCap", e, "min")
                              }
                              placeholder="-"
                              className="block h-8 w-full text-nowrap border-border bg-transparent text-sm text-fontColorPrimary placeholder:text-fontColorSecondary focus:outline-none focus:ring-0"
                            />
                            <div className="flex-shrink-0 text-sm text-fontColorSecondary">
                              to
                            </div>
                            <Input
                              type="number"
                              value={byMarketCap?.max}
                              onChange={(e) =>
                                handleNormalValue("byMarketCap", e, "max")
                              }
                              placeholder="-"
                              className="block h-8 w-full text-nowrap border-border bg-transparent text-sm text-fontColorPrimary placeholder:text-fontColorSecondary focus:outline-none focus:ring-0"
                            />
                          </div>
                        </div>

                        {/* Volume */}
                        <div className="flex items-center gap-x-2">
                          <Label className="w-[50%] justify-between text-nowrap text-sm text-fontColorSecondary">
                            Volume
                          </Label>
                          <div className="flex w-full items-center gap-x-2">
                            <Input
                              type="number"
                              value={byVolume?.min}
                              onChange={(e) =>
                                handleNormalValue("byVolume", e, "min")
                              }
                              placeholder="-"
                              className="block h-8 w-full text-nowrap border-border bg-transparent text-sm text-fontColorPrimary placeholder:text-fontColorSecondary focus:outline-none focus:ring-0"
                            />
                            <div className="flex-shrink-0 text-sm text-fontColorSecondary">
                              to
                            </div>
                            <Input
                              type="number"
                              value={byVolume?.max}
                              onChange={(e) =>
                                handleNormalValue("byVolume", e, "max")
                              }
                              placeholder="-"
                              className="block h-8 w-full text-nowrap border-border bg-transparent text-sm text-fontColorPrimary placeholder:text-fontColorSecondary focus:outline-none focus:ring-0"
                            />
                          </div>
                        </div>

                        {/* Current Liquidity */}
                        <div className="flex items-center gap-x-2">
                          <Label className="w-[50%] justify-between text-nowrap text-sm text-fontColorSecondary">
                            Current Liquidity ($)
                          </Label>
                          <div className="flex w-full items-center gap-x-2">
                            <Input
                              type="number"
                              value={byCurrentLiquidity?.min}
                              onChange={(e) =>
                                handleNormalValue(
                                  "byCurrentLiquidity",
                                  e,
                                  "min",
                                )
                              }
                              placeholder="-"
                              className="block h-8 w-full text-nowrap border-border bg-transparent text-sm text-fontColorPrimary placeholder:text-fontColorSecondary focus:outline-none focus:ring-0"
                            />
                            <div className="flex-shrink-0 text-sm text-fontColorSecondary">
                              to
                            </div>
                            <Input
                              type="number"
                              value={byCurrentLiquidity?.max}
                              onChange={(e) =>
                                handleNormalValue(
                                  "byCurrentLiquidity",
                                  e,
                                  "max",
                                )
                              }
                              placeholder="-"
                              className="block h-8 w-full text-nowrap border-border bg-transparent text-sm text-fontColorPrimary placeholder:text-fontColorSecondary focus:outline-none focus:ring-0"
                            />
                          </div>
                        </div>

                        {/* Holder Count */}
                        <div className="flex items-center gap-x-2">
                          <Label className="w-[50%] justify-between text-nowrap text-sm text-fontColorSecondary">
                            Holder Count
                          </Label>
                          <div className="flex w-full items-center gap-x-2">
                            <Input
                              type="number"
                              value={byHoldersCount?.min}
                              onChange={(e) =>
                                handleNormalValue("byHoldersCount", e, "min")
                              }
                              placeholder="-"
                              className="block h-8 w-full text-nowrap border-border bg-transparent text-sm text-fontColorPrimary placeholder:text-fontColorSecondary focus:outline-none focus:ring-0"
                            />
                            <div className="flex-shrink-0 text-sm text-fontColorSecondary">
                              to
                            </div>
                            <Input
                              type="number"
                              value={byHoldersCount?.max}
                              onChange={(e) =>
                                handleNormalValue("byHoldersCount", e, "max")
                              }
                              placeholder="-"
                              className="block h-8 w-full text-nowrap border-border bg-transparent text-sm text-fontColorPrimary placeholder:text-fontColorSecondary focus:outline-none focus:ring-0"
                            />
                          </div>
                        </div>

                        {/* Bot Holders */}
                        <div className="flex items-center gap-x-2">
                          <Label className="w-[50%] justify-between text-nowrap text-sm text-fontColorSecondary">
                            Bot Holders
                          </Label>
                          <div className="flex w-full items-center gap-x-2">
                            <Input
                              type="number"
                              value={byBotHolders?.min}
                              onChange={(e) =>
                                handleNormalValue("byBotHolders", e, "min")
                              }
                              placeholder="-"
                              className="block h-8 w-full text-nowrap border-border bg-transparent text-sm text-fontColorPrimary placeholder:text-fontColorSecondary focus:outline-none focus:ring-0"
                            />
                            <div className="flex-shrink-0 text-sm text-fontColorSecondary">
                              to
                            </div>
                            <Input
                              type="number"
                              value={byBotHolders?.max}
                              onChange={(e) =>
                                handleNormalValue("byBotHolders", e, "max")
                              }
                              placeholder="-"
                              className="block h-8 w-full text-nowrap border-border bg-transparent text-sm text-fontColorPrimary placeholder:text-fontColorSecondary focus:outline-none focus:ring-0"
                            />
                          </div>
                        </div>

                        {/* TXNS */}
                        <div className="flex items-center gap-x-2">
                          <Label className="w-[50%] justify-between text-nowrap text-sm text-fontColorSecondary">
                            TXNS
                          </Label>
                          <div className="flex w-full items-center gap-x-2">
                            <Input
                              type="number"
                              value={byTXNS?.min}
                              onChange={(e) =>
                                handleNormalValue("byTXNS", e, "min")
                              }
                              placeholder="-"
                              className="block h-8 w-full text-nowrap border-border bg-transparent text-sm text-fontColorPrimary placeholder:text-fontColorSecondary focus:outline-none focus:ring-0"
                            />
                            <div className="flex-shrink-0 text-sm text-fontColorSecondary">
                              to
                            </div>
                            <Input
                              type="number"
                              value={byTXNS?.max}
                              onChange={(e) =>
                                handleNormalValue("byTXNS", e, "max")
                              }
                              placeholder="-"
                              className="block h-8 w-full text-nowrap border-border bg-transparent text-sm text-fontColorPrimary placeholder:text-fontColorSecondary focus:outline-none focus:ring-0"
                            />
                          </div>
                        </div>

                        {/* Buys */}
                        <div className="flex items-center gap-x-2">
                          <Label className="w-[50%] justify-between text-nowrap text-sm text-fontColorSecondary">
                            Buys
                          </Label>
                          <div className="flex w-full items-center gap-x-2">
                            <Input
                              type="number"
                              value={byBuys?.min}
                              onChange={(e) =>
                                handleNormalValue("byBuys", e, "min")
                              }
                              placeholder="-"
                              className="block h-8 w-full text-nowrap border-border bg-transparent text-sm text-fontColorPrimary placeholder:text-fontColorSecondary focus:outline-none focus:ring-0"
                            />
                            <div className="flex-shrink-0 text-sm text-fontColorSecondary">
                              to
                            </div>
                            <Input
                              type="number"
                              value={byBuys?.max}
                              onChange={(e) =>
                                handleNormalValue("byBuys", e, "max")
                              }
                              placeholder="-"
                              className="block h-8 w-full text-nowrap border-border bg-transparent text-sm text-fontColorPrimary placeholder:text-fontColorSecondary focus:outline-none focus:ring-0"
                            />
                          </div>
                        </div>

                        {/* Sells */}
                        <div className="flex items-center gap-x-2">
                          <Label className="w-[50%] justify-between text-nowrap text-sm text-fontColorSecondary">
                            Sells
                          </Label>
                          <div className="flex w-full items-center gap-x-2">
                            <Input
                              type="number"
                              value={bySells?.min}
                              onChange={(e) =>
                                handleNormalValue("bySells", e, "min")
                              }
                              placeholder="-"
                              className="block h-8 w-full text-nowrap border-border bg-transparent text-sm text-fontColorPrimary placeholder:text-fontColorSecondary focus:outline-none focus:ring-0"
                            />
                            <div className="flex-shrink-0 text-sm text-fontColorSecondary">
                              to
                            </div>
                            <Input
                              type="number"
                              value={bySells?.max}
                              onChange={(e) =>
                                handleNormalValue("bySells", e, "max")
                              }
                              placeholder="-"
                              className="block h-8 w-full text-nowrap border-border bg-transparent text-sm text-fontColorPrimary placeholder:text-fontColorSecondary focus:outline-none focus:ring-0"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {activeFilterTab === "audit" && (
                      <div className="flex w-full flex-col gap-y-4">
                        {/* Bonding Curve */}
                        <div className="flex items-center gap-x-2">
                          <Label className="w-[50%] justify-between text-nowrap text-sm text-fontColorSecondary">
                            Bonding Curve (%)
                          </Label>
                          <div className="flex w-full items-center gap-x-2">
                            <div className="relative w-full">
                              <Input
                                type="number"
                                placeholder="-"
                                className="block h-8 w-full text-nowrap border-border bg-transparent text-sm text-fontColorPrimary placeholder:text-fontColorSecondary focus:outline-none focus:ring-0"
                              />
                              {/* <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-fontColorSecondary">
                                %
                              </span> */}
                            </div>
                            <div className="flex-shrink-0 text-sm text-fontColorSecondary">
                              to
                            </div>
                            <div className="relative w-full">
                              <Input
                                type="number"
                                placeholder="-"
                                className="block h-8 w-full text-nowrap border-border bg-transparent text-sm text-fontColorPrimary placeholder:text-fontColorSecondary focus:outline-none focus:ring-0"
                              />
                              {/* <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-fontColorSecondary">
                                %
                              </span> */}
                            </div>
                          </div>
                        </div>

                        {/* Top 10 Hold */}
                        <div className="flex items-center gap-x-2">
                          <Label className="w-[50%] justify-between text-nowrap text-sm text-fontColorSecondary">
                            Top 10 Hold (%)
                          </Label>
                          <div className="flex w-full items-center gap-x-2">
                            <div className="relative w-full">
                              <Input
                                type="number"
                                value={byTop10Holders?.min}
                                onChange={(e) =>
                                  handlePercentageValue(
                                    "byTop10Holders",
                                    e,
                                    "min",
                                  )
                                }
                                placeholder="-"
                                className="block h-8 w-full text-nowrap border-border bg-transparent text-sm text-fontColorPrimary placeholder:text-fontColorSecondary focus:outline-none focus:ring-0"
                              />
                              {/* <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-fontColorSecondary">
                                %
                              </span> */}
                            </div>
                            <div className="flex-shrink-0 text-sm text-fontColorSecondary">
                              to
                            </div>
                            <div className="relative w-full">
                              <Input
                                type="number"
                                value={byTop10Holders?.max}
                                onChange={(e) =>
                                  handlePercentageValue(
                                    "byTop10Holders",
                                    e,
                                    "max",
                                  )
                                }
                                placeholder="-"
                                className="block h-8 w-full text-nowrap border-border bg-transparent text-sm text-fontColorPrimary placeholder:text-fontColorSecondary focus:outline-none focus:ring-0"
                              />
                              {/* <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-fontColorSecondary">
                                %
                              </span> */}
                            </div>
                          </div>
                        </div>

                        {/* Age */}
                        <div className="flex items-center gap-x-2">
                          <Label className="w-[50%] justify-between text-nowrap text-sm text-fontColorSecondary">
                            Age (mins)
                          </Label>
                          <div className="flex w-full items-center gap-x-2">
                            <Input
                              type="number"
                              value={byAge?.min}
                              onChange={(e) =>
                                handleNormalValue("byAge", e, "min")
                              }
                              placeholder="-"
                              className="block h-8 w-full text-nowrap border-border bg-transparent text-sm text-fontColorPrimary placeholder:text-fontColorSecondary focus:outline-none focus:ring-0"
                            />
                            <div className="flex-shrink-0 text-sm text-fontColorSecondary">
                              to
                            </div>
                            <Input
                              type="number"
                              value={byAge?.max}
                              onChange={(e) =>
                                handleNormalValue("byAge", e, "max")
                              }
                              placeholder="-"
                              className="block h-8 w-full text-nowrap border-border bg-transparent text-sm text-fontColorPrimary placeholder:text-fontColorSecondary focus:outline-none focus:ring-0"
                            />
                          </div>
                        </div>

                        {/* Dev Hold */}
                        <div className="flex items-center gap-x-2">
                          <Label className="w-[50%] justify-between text-nowrap text-sm text-fontColorSecondary">
                            Dev Hold (%)
                          </Label>
                          <div className="flex w-full items-center gap-x-2">
                            <div className="relative w-full">
                              <Input
                                type="number"
                                value={byDevHoldingPercentage?.min}
                                onChange={(e) =>
                                  handlePercentageValue(
                                    "byDevHoldingPercentage",
                                    e,
                                    "min",
                                  )
                                }
                                placeholder="-"
                                className="block h-8 w-full text-nowrap border-border bg-transparent text-sm text-fontColorPrimary placeholder:text-fontColorSecondary focus:outline-none focus:ring-0"
                              />
                              {/* <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-fontColorSecondary">
                                %
                              </span> */}
                            </div>
                            <div className="flex-shrink-0 text-sm text-fontColorSecondary">
                              to
                            </div>
                            <div className="relative w-full">
                              <Input
                                type="number"
                                value={byDevHoldingPercentage?.max}
                                onChange={(e) =>
                                  handlePercentageValue(
                                    "byDevHoldingPercentage",
                                    e,
                                    "max",
                                  )
                                }
                                placeholder="-"
                                className="block h-8 w-full text-nowrap border-border bg-transparent text-sm text-fontColorPrimary placeholder:text-fontColorSecondary focus:outline-none focus:ring-0"
                              />
                              {/* <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-fontColorSecondary">
                                %
                              </span> */}
                            </div>
                          </div>
                        </div>

                        {/* Dev Created */}
                        <div className="flex items-center gap-x-2">
                          <Label className="w-[50%] justify-between text-nowrap text-sm text-fontColorSecondary">
                            Dev Created
                          </Label>
                          <div className="flex w-full items-center gap-x-2">
                            <Input
                              type="number"
                              placeholder="-"
                              className="block h-8 w-full text-nowrap border-border bg-transparent text-sm text-fontColorPrimary placeholder:text-fontColorSecondary focus:outline-none focus:ring-0"
                            />
                            <div className="flex-shrink-0 text-sm text-fontColorSecondary">
                              to
                            </div>
                            <Input
                              type="number"
                              placeholder="-"
                              className="block h-8 w-full text-nowrap border-border bg-transparent text-sm text-fontColorPrimary placeholder:text-fontColorSecondary focus:outline-none focus:ring-0"
                            />
                          </div>
                        </div>

                        {/* Dev Migrated */}
                        <div className="flex items-center gap-x-2">
                          <Label className="w-[50%] justify-between text-nowrap text-sm text-fontColorSecondary">
                            Dev Migrated
                          </Label>
                          <div className="flex w-full items-center gap-x-2">
                            <Input
                              type="number"
                              value={byDevMigrated?.min}
                              onChange={(e) =>
                                handleNormalValue("byDevMigrated", e, "min")
                              }
                              placeholder="-"
                              className="block h-8 w-full text-nowrap border-border bg-transparent text-sm text-fontColorPrimary placeholder:text-fontColorSecondary focus:outline-none focus:ring-0"
                            />
                            <div className="flex-shrink-0 text-sm text-fontColorSecondary">
                              to
                            </div>
                            <Input
                              type="number"
                              value={byDevMigrated?.max}
                              onChange={(e) =>
                                handleNormalValue("byDevMigrated", e, "max")
                              }
                              placeholder="-"
                              className="block h-8 w-full text-nowrap border-border bg-transparent text-sm text-fontColorPrimary placeholder:text-fontColorSecondary focus:outline-none focus:ring-0"
                            />
                          </div>
                        </div>

                        {/* Snipers */}
                        <div className="flex items-center gap-x-2">
                          <Label className="w-[50%] justify-between text-nowrap text-sm text-fontColorSecondary">
                            Snipers
                          </Label>
                          <div className="flex w-full items-center gap-x-2">
                            <Input
                              type="number"
                              value={bySnipers?.min}
                              onChange={(e) =>
                                handleNormalValue("bySnipers", e, "min")
                              }
                              placeholder="-"
                              className="block h-8 w-full text-nowrap border-border bg-transparent text-sm text-fontColorPrimary placeholder:text-fontColorSecondary focus:outline-none focus:ring-0"
                            />
                            <div className="flex-shrink-0 text-sm text-fontColorSecondary">
                              to
                            </div>
                            <Input
                              type="number"
                              value={bySnipers?.max}
                              onChange={(e) =>
                                handleNormalValue("bySnipers", e, "max")
                              }
                              placeholder="-"
                              className="block h-8 w-full text-nowrap border-border bg-transparent text-sm text-fontColorPrimary placeholder:text-fontColorSecondary focus:outline-none focus:ring-0"
                            />
                          </div>
                        </div>

                        {/* Snipers Holder */}
                        <div className="flex items-center gap-x-2">
                          <Label className="w-[50%] justify-between text-nowrap text-sm text-fontColorSecondary">
                            Snipers Holder (%)
                          </Label>
                          <div className="flex w-full items-center gap-x-2">
                            <div className="relative w-full">
                              <Input
                                type="number"
                                placeholder="-"
                                className="block h-8 w-full text-nowrap border-border bg-transparent text-sm text-fontColorPrimary placeholder:text-fontColorSecondary focus:outline-none focus:ring-0"
                              />
                              {/* <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-fontColorSecondary">
                                %
                              </span> */}
                            </div>
                            <div className="flex-shrink-0 text-sm text-fontColorSecondary">
                              to
                            </div>
                            <div className="relative w-full">
                              <Input
                                type="number"
                                placeholder="-"
                                className="block h-8 w-full text-nowrap border-border bg-transparent text-sm text-fontColorPrimary placeholder:text-fontColorSecondary focus:outline-none focus:ring-0"
                              />
                              {/* <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-fontColorSecondary">
                                %
                              </span> */}
                            </div>
                          </div>
                        </div>

                        {/* Insiders */}
                        <div className="flex items-center gap-x-2">
                          <Label className="w-[50%] justify-between text-nowrap text-sm text-fontColorSecondary">
                            Insiders
                          </Label>
                          <div className="flex w-full items-center gap-x-2">
                            <Input
                              type="number"
                              placeholder="-"
                              className="block h-8 w-full text-nowrap border-border bg-transparent text-sm text-fontColorPrimary placeholder:text-fontColorSecondary focus:outline-none focus:ring-0"
                            />
                            <div className="flex-shrink-0 text-sm text-fontColorSecondary">
                              to
                            </div>
                            <Input
                              type="number"
                              placeholder="-"
                              className="block h-8 w-full text-nowrap border-border bg-transparent text-sm text-fontColorPrimary placeholder:text-fontColorSecondary focus:outline-none focus:ring-0"
                            />
                          </div>
                        </div>

                        {/* Insiders Holder */}
                        <div className="flex items-center gap-x-2">
                          <Label className="w-[50%] justify-between text-nowrap text-sm text-fontColorSecondary">
                            Insiders Holder (%)
                          </Label>
                          <div className="flex w-full items-center gap-x-2">
                            <div className="relative w-full">
                              <Input
                                type="number"
                                value={byInsiderHoldingPercentage?.min}
                                onChange={(e) =>
                                  handlePercentageValue(
                                    "byInsiderHoldingPercentage",
                                    e,
                                    "min",
                                  )
                                }
                                placeholder="-"
                                className="block h-8 w-full text-nowrap border-border bg-transparent text-sm text-fontColorPrimary placeholder:text-fontColorSecondary focus:outline-none focus:ring-0"
                              />
                              {/* <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-fontColorSecondary">
                                %
                              </span> */}
                            </div>
                            <div className="flex-shrink-0 text-sm text-fontColorSecondary">
                              to
                            </div>
                            <div className="relative w-full">
                              <Input
                                type="number"
                                value={byInsiderHoldingPercentage?.max}
                                onChange={(e) =>
                                  handlePercentageValue(
                                    "byInsiderHoldingPercentage",
                                    e,
                                    "max",
                                  )
                                }
                                placeholder="-"
                                className="block h-8 w-full text-nowrap border-border bg-transparent text-sm text-fontColorPrimary placeholder:text-fontColorSecondary focus:outline-none focus:ring-0"
                              />
                              {/* <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-fontColorSecondary">
                                %
                              </span> */}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeFilterTab === "socials" && (
                      <div className="grid w-full grid-cols-4 gap-y-2">
                        {(socialList || [])?.map((social) => {
                          // Check if this social platform is included in showKeywords or doNotShowKeywords
                          const isChecked =
                            showKeywords
                              .toLowerCase()
                              .includes(social.socialValue.toLowerCase()) ||
                            doNotShowKeywords
                              .toLowerCase()
                              .includes(social.socialValue.toLowerCase());

                          return (
                            <button
                              key={`ncl-s-${social.socialValue}`}
                              onClick={() => {
                                // Toggle social filter by adding/removing from showKeywords
                                if (isChecked) {
                                  // Remove from both showKeywords and doNotShowKeywords
                                  const showWords = showKeywords
                                    .split(" ")
                                    .filter(
                                      (word) =>
                                        word.toLowerCase() !==
                                        social.socialValue.toLowerCase(),
                                    )
                                    .join(" ")
                                    .trim();
                                  const hideWords = doNotShowKeywords
                                    .split(" ")
                                    .filter(
                                      (word) =>
                                        word.toLowerCase() !==
                                        social.socialValue.toLowerCase(),
                                    )
                                    .join(" ")
                                    .trim();
                                  setShowKeywords(showWords, "preview");
                                  setDoNotShowKeywords(hideWords, "preview");
                                } else {
                                  // Add to showKeywords (prefer showing over hiding)
                                  const newKeywords = showKeywords
                                    ? `${showKeywords} ${social.socialValue}`
                                    : social.socialValue;
                                  setShowKeywords(
                                    newKeywords.trim(),
                                    "preview",
                                  );
                                }
                              }}
                              className="flex h-8 w-full cursor-pointer items-center justify-between gap-x-2 rounded-[8px] py-1 pr-1 duration-300"
                            >
                              <div className="flex items-center gap-x-1">
                                <div className="relative aspect-square h-5 w-5 flex-shrink-0">
                                  <Image
                                    src={
                                      isChecked
                                        ? "/icons/footer/checked.png"
                                        : "/icons/footer/unchecked.png"
                                    }
                                    alt="Check / Unchecked Icon"
                                    fill
                                    quality={100}
                                    className="object-contain"
                                    loading="lazy"
                                  />
                                </div>
                                <div
                                  className={cn(
                                    "relative aspect-square h-4 w-4 flex-shrink-0",
                                    social?.customClass,
                                  )}
                                >
                                  <Image
                                    src={social?.iconURL}
                                    alt={`${social?.name} Icon`}
                                    fill
                                    quality={100}
                                    className="object-contain"
                                    loading="lazy"
                                  />
                                </div>
                                <span className="inline-block text-nowrap text-sm text-fontColorPrimary">
                                  {social?.name && social.name.length > 9
                                    ? `${social.name.substring(0, 8)}...`
                                    : social?.name}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="absolute bottom-[0px] left-0 flex h-[64px] w-full items-center justify-between gap-x-3 rounded-b-[8px] border-t border-border p-4">
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
        <div
          onClick={() => setOpenFilterDrawer((prev) => !prev)}
          className="flex h-[32px] w-[32px] flex-shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-border lg:hidden"
        >
          <div className="relative aspect-square h-4 w-4 flex-shrink-0">
            <Image
              src="/icons/filter.png"
              alt="Filter Icon"
              fill
              quality={100}
              className="object-contain"
              loading="lazy"
            />
          </div>
        </div>
        <Drawer
          open={openFilterDrawer}
          onOpenChange={customSetOpenFilterDrawer}
        >
          {/* <DrawerTrigger asChild>
        </DrawerTrigger> */}
          <DrawerContent>
            <DrawerHeader className="flex h-[62px] flex-row items-center justify-between border-b border-border p-4">
              <DrawerTitle>Filter</DrawerTitle>
              <button
                title="Close"
                onClick={() => {
                  setOpenFilterDrawer((prev) => !prev);
                  handleApplyFilter();
                }}
                className="relative aspect-square h-6 w-6 flex-shrink-0"
              >
                <Image
                  src="/icons/close.png"
                  alt="Close Icon"
                  fill
                  quality={100}
                  className="object-contain"
                  loading="lazy"
                />
              </button>
            </DrawerHeader>

            {/* Fields */}
            <div className="relative h-[87dvh] w-full flex-grow px-0 pb-[70px] pt-0">
              <div className="nova-scroller flex h-full w-full">
                <div className="flex h-auto w-full flex-col">
                  {/* A. Dexes */}
                  <div className="flex flex-col gap-1 p-4">
                    <Label className="text-sm text-fontColorSecondary">
                      Dex
                    </Label>

                    <div className="grid w-full grid-cols-4 gap-2">
                      {(dexList || [])?.map((dex) => {
                        const isChecked = checkBoxes?.[dex?.dexValue];

                        return (
                          <button
                            key={`ncl-d-${dex.dexValue}`}
                            onClick={() =>
                              toggleGraduatedFilterWithValidation(
                                dex?.dexValue,
                                "preview",
                              )
                            }
                            className="flex h-8 w-full cursor-pointer items-center justify-between gap-x-2 rounded-[8px] py-1 pr-1 duration-300"
                          >
                            <div className="flex items-center gap-x-1">
                              <div className="relative aspect-square h-5 w-5 flex-shrink-0">
                                <Image
                                  src={
                                    isChecked
                                      ? "/icons/footer/checked.png"
                                      : "/icons/footer/unchecked.png"
                                  }
                                  alt="Check / Unchecked Icon"
                                  fill
                                  quality={100}
                                  className="object-contain"
                                  loading="lazy"
                                />
                              </div>
                              <div
                                className={cn(
                                  "relative aspect-square h-4 w-4 flex-shrink-0",
                                  dex?.customClass,
                                )}
                              >
                                <Image
                                  src={dex?.iconURL}
                                  alt={`${dex?.name} Icon`}
                                  fill
                                  quality={100}
                                  className="object-contain"
                                  loading="lazy"
                                />
                              </div>
                              <span className="inline-block text-nowrap text-sm text-fontColorPrimary">
                                {dex?.name && dex.name.length > 4
                                  ? `${dex.name.substring(0, 3)}...`
                                  : dex?.name}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <Separator />

                  {/* Show Hidden */}
                  {/* <div className="flex w-full p-4">
                    <div className="flex w-full flex-col gap-y-1">
                      <Label
                        htmlFor="showhiddencoinsfilter"
                        className="justify-between text-nowrap text-sm text-fontColorSecondary"
                      >
                        Show Hidden Coins Filter
                      </Label>
                      <button
                        onClick={() =>
                          toggleGraduatedFilterWithValidation(
                            "showHide",
                            "preview",
                          )
                        }
                        className="flex h-8 w-full cursor-pointer items-center justify-between gap-x-2 rounded-[8px] border border-border bg-white/[3%] py-1 pl-2 pr-1 duration-300 hover:bg-white/[6%]"
                      >
                        <div className="flex items-center">
                          <span className="inline-block text-nowrap text-sm text-fontColorPrimary">
                            Show Hidden Coins
                          </span>
                        </div>
                        <div className="relative aspect-square h-6 w-6 flex-shrink-0">
                          <Image
                            src={
                              checkBoxes?.showHide
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
                  </div> */}

                  <Separator />

                  {/* B. Symbol / Name */}
                  <div className="flex w-full justify-between gap-x-2 p-4">
                    <div className="flex flex-col gap-y-1">
                      <Label
                        htmlFor="showsymbolorname"
                        className="justify-between text-nowrap text-sm text-fontColorSecondary"
                      >
                        Symbol/Name
                      </Label>
                      <Input
                        id="showsymbolorname"
                        type="text"
                        value={showKeywords}
                        onChange={(e) =>
                          setShowKeywords(e.target.value, "preview")
                        }
                        placeholder="Max 3 Keywords"
                        className="block h-8 w-full text-nowrap border-border bg-transparent text-sm text-fontColorPrimary placeholder:text-fontColorSecondary focus:outline-none focus:ring-0"
                      />
                    </div>

                    <div className="flex flex-col gap-y-1">
                      <Label
                        htmlFor="notshowsymbolorname"
                        className="justify-between text-nowrap text-sm text-fontColorSecondary"
                      >
                        Do not show Symbol/Name
                      </Label>
                      <Input
                        id="notshowsymbolorname"
                        type="text"
                        value={doNotShowKeywords}
                        onChange={(e) =>
                          setDoNotShowKeywords(e.target.value, "preview")
                        }
                        placeholder="Max 3 Keywords"
                        className="block h-8 w-full text-nowrap border-border bg-transparent text-sm text-fontColorPrimary placeholder:text-fontColorSecondary focus:outline-none focus:ring-0"
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Filter Tabs */}
                  <div className="flex w-full flex-col px-4 pb-4">
                    {/* Tab Headers */}
                    <div className="mb-4 flex w-full">
                      <button
                        onClick={() => setActiveFilterTab("general")}
                        onMouseEnter={() => setHoveredTab("general")}
                        onMouseLeave={() => setHoveredTab(null)}
                        className={cn(
                          "flex h-[50px] flex-1 items-center justify-center gap-1 font-geistSemiBold text-sm transition-all duration-300",
                          activeFilterTab === "general"
                            ? "border-b-2 border-fontColorPrimary text-fontColorPrimary"
                            : "border-b-2 border-secondary text-fontColorSecondary hover:border-primary hover:text-primary",
                        )}
                      >
                        {getTabIcon(
                          "general",
                          activeFilterTab === "general",
                          hoveredTab === "general",
                        )}
                        <p>General</p>
                        <span
                          className={cn(
                            generalFilterCount > 0 ? "text-primary" : "",
                          )}
                        >
                          ({generalFilterCount})
                        </span>
                      </button>
                      <button
                        onClick={() => setActiveFilterTab("audit")}
                        onMouseEnter={() => setHoveredTab("audit")}
                        onMouseLeave={() => setHoveredTab(null)}
                        className={cn(
                          "flex h-[50px] flex-1 items-center justify-center gap-1 font-geistSemiBold text-sm transition-all duration-300",
                          activeFilterTab === "audit"
                            ? "border-b-2 border-fontColorPrimary text-fontColorPrimary"
                            : "border-b-2 border-secondary text-fontColorSecondary hover:border-primary hover:text-primary",
                        )}
                      >
                        {getTabIcon(
                          "audit",
                          activeFilterTab === "audit",
                          hoveredTab === "audit",
                        )}
                        <p>Audit</p>
                        <span
                          className={cn(
                            auditFilterCount > 0 ? "text-primary" : "",
                          )}
                        >
                          ({auditFilterCount})
                        </span>
                      </button>
                      <button
                        onClick={() => setActiveFilterTab("socials")}
                        onMouseEnter={() => setHoveredTab("socials")}
                        onMouseLeave={() => setHoveredTab(null)}
                        className={cn(
                          "flex h-[50px] flex-1 items-center justify-center gap-1 font-geistSemiBold text-sm transition-all duration-300",
                          activeFilterTab === "socials"
                            ? "border-b-2 border-fontColorPrimary text-fontColorPrimary"
                            : "border-b-2 border-secondary text-fontColorSecondary hover:border-primary hover:text-primary",
                        )}
                      >
                        {getTabIcon(
                          "socials",
                          activeFilterTab === "socials",
                          hoveredTab === "socials",
                        )}
                        <p>Socials</p>
                        <span
                          className={cn(
                            socialsFilterCount > 0 ? "text-primary" : "",
                          )}
                        >
                          ({socialsFilterCount})
                        </span>
                      </button>
                    </div>

                    {/* Tab Content */}
                    {activeFilterTab === "general" && (
                      <div className="flex w-full flex-col gap-y-4">
                        {/* Market Cap */}
                        <div className="flex items-center gap-x-2">
                          <Label className="w-[50%] justify-between text-nowrap text-sm text-fontColorSecondary">
                            Market Cap
                          </Label>
                          <div className="flex w-full items-center gap-x-2">
                            <Input
                              type="number"
                              value={byMarketCap?.min}
                              onChange={(e) =>
                                handleNormalValue("byMarketCap", e, "min")
                              }
                              placeholder="-"
                              className="block h-8 w-full text-nowrap border-border bg-transparent text-sm text-fontColorPrimary placeholder:text-fontColorSecondary focus:outline-none focus:ring-0"
                            />
                            <div className="flex-shrink-0 text-sm text-fontColorSecondary">
                              to
                            </div>
                            <Input
                              type="number"
                              value={byMarketCap?.max}
                              onChange={(e) =>
                                handleNormalValue("byMarketCap", e, "max")
                              }
                              placeholder="-"
                              className="block h-8 w-full text-nowrap border-border bg-transparent text-sm text-fontColorPrimary placeholder:text-fontColorSecondary focus:outline-none focus:ring-0"
                            />
                          </div>
                        </div>

                        {/* Volume */}
                        <div className="flex items-center gap-x-2">
                          <Label className="w-[50%] justify-between text-nowrap text-sm text-fontColorSecondary">
                            Volume
                          </Label>
                          <div className="flex w-full items-center gap-x-2">
                            <Input
                              type="number"
                              value={byVolume?.min}
                              onChange={(e) =>
                                handleNormalValue("byVolume", e, "min")
                              }
                              placeholder="-"
                              className="block h-8 w-full text-nowrap border-border bg-transparent text-sm text-fontColorPrimary placeholder:text-fontColorSecondary focus:outline-none focus:ring-0"
                            />
                            <div className="flex-shrink-0 text-sm text-fontColorSecondary">
                              to
                            </div>
                            <Input
                              type="number"
                              value={byVolume?.max}
                              onChange={(e) =>
                                handleNormalValue("byVolume", e, "max")
                              }
                              placeholder="-"
                              className="block h-8 w-full text-nowrap border-border bg-transparent text-sm text-fontColorPrimary placeholder:text-fontColorSecondary focus:outline-none focus:ring-0"
                            />
                          </div>
                        </div>

                        {/* Current Liquidity */}
                        <div className="flex items-center gap-x-2">
                          <Label className="w-[50%] justify-between text-nowrap text-sm text-fontColorSecondary">
                            Current Liquidity ($)
                          </Label>
                          <div className="flex w-full items-center gap-x-2">
                            <Input
                              type="number"
                              value={byCurrentLiquidity?.min}
                              onChange={(e) =>
                                handleNormalValue(
                                  "byCurrentLiquidity",
                                  e,
                                  "min",
                                )
                              }
                              placeholder="-"
                              className="block h-8 w-full text-nowrap border-border bg-transparent text-sm text-fontColorPrimary placeholder:text-fontColorSecondary focus:outline-none focus:ring-0"
                            />
                            <div className="flex-shrink-0 text-sm text-fontColorSecondary">
                              to
                            </div>
                            <Input
                              type="number"
                              value={byCurrentLiquidity?.max}
                              onChange={(e) =>
                                handleNormalValue(
                                  "byCurrentLiquidity",
                                  e,
                                  "max",
                                )
                              }
                              placeholder="-"
                              className="block h-8 w-full text-nowrap border-border bg-transparent text-sm text-fontColorPrimary placeholder:text-fontColorSecondary focus:outline-none focus:ring-0"
                            />
                          </div>
                        </div>

                        {/* Holder Count */}
                        <div className="flex items-center gap-x-2">
                          <Label className="w-[50%] justify-between text-nowrap text-sm text-fontColorSecondary">
                            Holder Count
                          </Label>
                          <div className="flex w-full items-center gap-x-2">
                            <Input
                              type="number"
                              value={byHoldersCount?.min}
                              onChange={(e) =>
                                handleNormalValue("byHoldersCount", e, "min")
                              }
                              placeholder="-"
                              className="block h-8 w-full text-nowrap border-border bg-transparent text-sm text-fontColorPrimary placeholder:text-fontColorSecondary focus:outline-none focus:ring-0"
                            />
                            <div className="flex-shrink-0 text-sm text-fontColorSecondary">
                              to
                            </div>
                            <Input
                              type="number"
                              value={byHoldersCount?.max}
                              onChange={(e) =>
                                handleNormalValue("byHoldersCount", e, "max")
                              }
                              placeholder="-"
                              className="block h-8 w-full text-nowrap border-border bg-transparent text-sm text-fontColorPrimary placeholder:text-fontColorSecondary focus:outline-none focus:ring-0"
                            />
                          </div>
                        </div>

                        {/* Bot Holders */}
                        <div className="flex items-center gap-x-2">
                          <Label className="w-[50%] justify-between text-nowrap text-sm text-fontColorSecondary">
                            Bot Holders
                          </Label>
                          <div className="flex w-full items-center gap-x-2">
                            <Input
                              type="number"
                              value={byBotHolders?.min}
                              onChange={(e) =>
                                handleNormalValue("byBotHolders", e, "min")
                              }
                              placeholder="-"
                              className="block h-8 w-full text-nowrap border-border bg-transparent text-sm text-fontColorPrimary placeholder:text-fontColorSecondary focus:outline-none focus:ring-0"
                            />
                            <div className="flex-shrink-0 text-sm text-fontColorSecondary">
                              to
                            </div>
                            <Input
                              type="number"
                              value={byBotHolders?.max}
                              onChange={(e) =>
                                handleNormalValue("byBotHolders", e, "max")
                              }
                              placeholder="-"
                              className="block h-8 w-full text-nowrap border-border bg-transparent text-sm text-fontColorPrimary placeholder:text-fontColorSecondary focus:outline-none focus:ring-0"
                            />
                          </div>
                        </div>

                        {/* TXNS */}
                        <div className="flex items-center gap-x-2">
                          <Label className="w-[50%] justify-between text-nowrap text-sm text-fontColorSecondary">
                            TXNS
                          </Label>
                          <div className="flex w-full items-center gap-x-2">
                            <Input
                              type="number"
                              value={byTXNS?.min}
                              onChange={(e) =>
                                handleNormalValue("byTXNS", e, "min")
                              }
                              placeholder="-"
                              className="block h-8 w-full text-nowrap border-border bg-transparent text-sm text-fontColorPrimary placeholder:text-fontColorSecondary focus:outline-none focus:ring-0"
                            />
                            <div className="flex-shrink-0 text-sm text-fontColorSecondary">
                              to
                            </div>
                            <Input
                              type="number"
                              value={byTXNS?.max}
                              onChange={(e) =>
                                handleNormalValue("byTXNS", e, "max")
                              }
                              placeholder="-"
                              className="block h-8 w-full text-nowrap border-border bg-transparent text-sm text-fontColorPrimary placeholder:text-fontColorSecondary focus:outline-none focus:ring-0"
                            />
                          </div>
                        </div>

                        {/* Buys */}
                        <div className="flex items-center gap-x-2">
                          <Label className="w-[50%] justify-between text-nowrap text-sm text-fontColorSecondary">
                            Buys
                          </Label>
                          <div className="flex w-full items-center gap-x-2">
                            <Input
                              type="number"
                              value={byBuys?.min}
                              onChange={(e) =>
                                handleNormalValue("byBuys", e, "min")
                              }
                              placeholder="-"
                              className="block h-8 w-full text-nowrap border-border bg-transparent text-sm text-fontColorPrimary placeholder:text-fontColorSecondary focus:outline-none focus:ring-0"
                            />
                            <div className="flex-shrink-0 text-sm text-fontColorSecondary">
                              to
                            </div>
                            <Input
                              type="number"
                              value={byBuys?.max}
                              onChange={(e) =>
                                handleNormalValue("byBuys", e, "max")
                              }
                              placeholder="-"
                              className="block h-8 w-full text-nowrap border-border bg-transparent text-sm text-fontColorPrimary placeholder:text-fontColorSecondary focus:outline-none focus:ring-0"
                            />
                          </div>
                        </div>

                        {/* Sells */}
                        <div className="flex items-center gap-x-2">
                          <Label className="w-[50%] justify-between text-nowrap text-sm text-fontColorSecondary">
                            Sells
                          </Label>
                          <div className="flex w-full items-center gap-x-2">
                            <Input
                              type="number"
                              value={bySells?.min}
                              onChange={(e) =>
                                handleNormalValue("bySells", e, "min")
                              }
                              placeholder="-"
                              className="block h-8 w-full text-nowrap border-border bg-transparent text-sm text-fontColorPrimary placeholder:text-fontColorSecondary focus:outline-none focus:ring-0"
                            />
                            <div className="flex-shrink-0 text-sm text-fontColorSecondary">
                              to
                            </div>
                            <Input
                              type="number"
                              value={bySells?.max}
                              onChange={(e) =>
                                handleNormalValue("bySells", e, "max")
                              }
                              placeholder="-"
                              className="block h-8 w-full text-nowrap border-border bg-transparent text-sm text-fontColorPrimary placeholder:text-fontColorSecondary focus:outline-none focus:ring-0"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {activeFilterTab === "audit" && (
                      <div className="flex w-full flex-col gap-y-4">
                        {/* Bonding Curve */}
                        <div className="flex items-center gap-x-2">
                          <Label className="w-[50%] justify-between text-nowrap text-sm text-fontColorSecondary">
                            Bonding Curve (%)
                          </Label>
                          <div className="flex w-full items-center gap-x-2">
                            <div className="relative w-full">
                              <Input
                                type="number"
                                placeholder="-"
                                className="block h-8 w-full text-nowrap border-border bg-transparent text-sm text-fontColorPrimary placeholder:text-fontColorSecondary focus:outline-none focus:ring-0"
                              />
                              {/* <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-fontColorSecondary">
                                %
                              </span> */}
                            </div>
                            <div className="flex-shrink-0 text-sm text-fontColorSecondary">
                              to
                            </div>
                            <div className="relative w-full">
                              <Input
                                type="number"
                                placeholder="-"
                                className="block h-8 w-full text-nowrap border-border bg-transparent text-sm text-fontColorPrimary placeholder:text-fontColorSecondary focus:outline-none focus:ring-0"
                              />
                              {/* <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-fontColorSecondary">
                                %
                              </span> */}
                            </div>
                          </div>
                        </div>

                        {/* Top 10 Hold */}
                        <div className="flex items-center gap-x-2">
                          <Label className="w-[50%] justify-between text-nowrap text-sm text-fontColorSecondary">
                            Top 10 Hold (%)
                          </Label>
                          <div className="flex w-full items-center gap-x-2">
                            <div className="relative w-full">
                              <Input
                                type="number"
                                value={byTop10Holders?.min}
                                onChange={(e) =>
                                  handlePercentageValue(
                                    "byTop10Holders",
                                    e,
                                    "min",
                                  )
                                }
                                placeholder="-"
                                className="block h-8 w-full text-nowrap border-border bg-transparent text-sm text-fontColorPrimary placeholder:text-fontColorSecondary focus:outline-none focus:ring-0"
                              />
                              {/* <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-fontColorSecondary">
                                %
                              </span> */}
                            </div>
                            <div className="flex-shrink-0 text-sm text-fontColorSecondary">
                              to
                            </div>
                            <div className="relative w-full">
                              <Input
                                type="number"
                                value={byTop10Holders?.max}
                                onChange={(e) =>
                                  handlePercentageValue(
                                    "byTop10Holders",
                                    e,
                                    "max",
                                  )
                                }
                                placeholder="-"
                                className="block h-8 w-full text-nowrap border-border bg-transparent text-sm text-fontColorPrimary placeholder:text-fontColorSecondary focus:outline-none focus:ring-0"
                              />
                              {/* <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-fontColorSecondary">
                                %
                              </span> */}
                            </div>
                          </div>
                        </div>

                        {/* Age */}
                        <div className="flex items-center gap-x-2">
                          <Label className="w-[50%] justify-between text-nowrap text-sm text-fontColorSecondary">
                            Age (mins)
                          </Label>
                          <div className="flex w-full items-center gap-x-2">
                            <Input
                              type="number"
                              value={byAge?.min}
                              onChange={(e) =>
                                handleNormalValue("byAge", e, "min")
                              }
                              placeholder="-"
                              className="block h-8 w-full text-nowrap border-border bg-transparent text-sm text-fontColorPrimary placeholder:text-fontColorSecondary focus:outline-none focus:ring-0"
                            />
                            <div className="flex-shrink-0 text-sm text-fontColorSecondary">
                              to
                            </div>
                            <Input
                              type="number"
                              value={byAge?.max}
                              onChange={(e) =>
                                handleNormalValue("byAge", e, "max")
                              }
                              placeholder="-"
                              className="block h-8 w-full text-nowrap border-border bg-transparent text-sm text-fontColorPrimary placeholder:text-fontColorSecondary focus:outline-none focus:ring-0"
                            />
                          </div>
                        </div>

                        {/* Dev Hold */}
                        <div className="flex items-center gap-x-2">
                          <Label className="w-[50%] justify-between text-nowrap text-sm text-fontColorSecondary">
                            Dev Hold (%)
                          </Label>
                          <div className="flex w-full items-center gap-x-2">
                            <div className="relative w-full">
                              <Input
                                type="number"
                                value={byDevHoldingPercentage?.min}
                                onChange={(e) =>
                                  handlePercentageValue(
                                    "byDevHoldingPercentage",
                                    e,
                                    "min",
                                  )
                                }
                                placeholder="-"
                                className="block h-8 w-full text-nowrap border-border bg-transparent text-sm text-fontColorPrimary placeholder:text-fontColorSecondary focus:outline-none focus:ring-0"
                              />
                              {/* <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-fontColorSecondary">
                                %
                              </span> */}
                            </div>
                            <div className="flex-shrink-0 text-sm text-fontColorSecondary">
                              to
                            </div>
                            <div className="relative w-full">
                              <Input
                                type="number"
                                value={byDevHoldingPercentage?.max}
                                onChange={(e) =>
                                  handlePercentageValue(
                                    "byDevHoldingPercentage",
                                    e,
                                    "max",
                                  )
                                }
                                placeholder="-"
                                className="block h-8 w-full text-nowrap border-border bg-transparent text-sm text-fontColorPrimary placeholder:text-fontColorSecondary focus:outline-none focus:ring-0"
                              />
                              {/* <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-fontColorSecondary">
                                %
                              </span> */}
                            </div>
                          </div>
                        </div>

                        {/* Dev Created */}
                        <div className="flex items-center gap-x-2">
                          <Label className="w-[50%] justify-between text-nowrap text-sm text-fontColorSecondary">
                            Dev Created
                          </Label>
                          <div className="flex w-full items-center gap-x-2">
                            <Input
                              type="number"
                              placeholder="-"
                              className="block h-8 w-full text-nowrap border-border bg-transparent text-sm text-fontColorPrimary placeholder:text-fontColorSecondary focus:outline-none focus:ring-0"
                            />
                            <div className="flex-shrink-0 text-sm text-fontColorSecondary">
                              to
                            </div>
                            <Input
                              type="number"
                              placeholder="-"
                              className="block h-8 w-full text-nowrap border-border bg-transparent text-sm text-fontColorPrimary placeholder:text-fontColorSecondary focus:outline-none focus:ring-0"
                            />
                          </div>
                        </div>

                        {/* Dev Migrated */}
                        <div className="flex items-center gap-x-2">
                          <Label className="w-[50%] justify-between text-nowrap text-sm text-fontColorSecondary">
                            Dev Migrated
                          </Label>
                          <div className="flex w-full items-center gap-x-2">
                            <Input
                              type="number"
                              value={byDevMigrated?.min}
                              onChange={(e) =>
                                handleNormalValue("byDevMigrated", e, "min")
                              }
                              placeholder="-"
                              className="block h-8 w-full text-nowrap border-border bg-transparent text-sm text-fontColorPrimary placeholder:text-fontColorSecondary focus:outline-none focus:ring-0"
                            />
                            <div className="flex-shrink-0 text-sm text-fontColorSecondary">
                              to
                            </div>
                            <Input
                              type="number"
                              value={byDevMigrated?.max}
                              onChange={(e) =>
                                handleNormalValue("byDevMigrated", e, "max")
                              }
                              placeholder="-"
                              className="block h-8 w-full text-nowrap border-border bg-transparent text-sm text-fontColorPrimary placeholder:text-fontColorSecondary focus:outline-none focus:ring-0"
                            />
                          </div>
                        </div>

                        {/* Snipers */}
                        <div className="flex items-center gap-x-2">
                          <Label className="w-[50%] justify-between text-nowrap text-sm text-fontColorSecondary">
                            Snipers
                          </Label>
                          <div className="flex w-full items-center gap-x-2">
                            <Input
                              type="number"
                              value={bySnipers?.min}
                              onChange={(e) =>
                                handleNormalValue("bySnipers", e, "min")
                              }
                              placeholder="-"
                              className="block h-8 w-full text-nowrap border-border bg-transparent text-sm text-fontColorPrimary placeholder:text-fontColorSecondary focus:outline-none focus:ring-0"
                            />
                            <div className="flex-shrink-0 text-sm text-fontColorSecondary">
                              to
                            </div>
                            <Input
                              type="number"
                              value={bySnipers?.max}
                              onChange={(e) =>
                                handleNormalValue("bySnipers", e, "max")
                              }
                              placeholder="-"
                              className="block h-8 w-full text-nowrap border-border bg-transparent text-sm text-fontColorPrimary placeholder:text-fontColorSecondary focus:outline-none focus:ring-0"
                            />
                          </div>
                        </div>

                        {/* Snipers Holder */}
                        <div className="flex items-center gap-x-2">
                          <Label className="w-[50%] justify-between text-nowrap text-sm text-fontColorSecondary">
                            Snipers Holder (%)
                          </Label>
                          <div className="flex w-full items-center gap-x-2">
                            <div className="relative w-full">
                              <Input
                                type="number"
                                placeholder="-"
                                className="block h-8 w-full text-nowrap border-border bg-transparent text-sm text-fontColorPrimary placeholder:text-fontColorSecondary focus:outline-none focus:ring-0"
                              />
                              {/* <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-fontColorSecondary">
                                %
                              </span> */}
                            </div>
                            <div className="flex-shrink-0 text-sm text-fontColorSecondary">
                              to
                            </div>
                            <div className="relative w-full">
                              <Input
                                type="number"
                                placeholder="-"
                                className="block h-8 w-full text-nowrap border-border bg-transparent text-sm text-fontColorPrimary placeholder:text-fontColorSecondary focus:outline-none focus:ring-0"
                              />
                              {/* <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-fontColorSecondary">
                                %
                              </span> */}
                            </div>
                          </div>
                        </div>

                        {/* Insiders */}
                        <div className="flex items-center gap-x-2">
                          <Label className="w-[50%] justify-between text-nowrap text-sm text-fontColorSecondary">
                            Insiders
                          </Label>
                          <div className="flex w-full items-center gap-x-2">
                            <Input
                              type="number"
                              placeholder="-"
                              className="block h-8 w-full text-nowrap border-border bg-transparent text-sm text-fontColorPrimary placeholder:text-fontColorSecondary focus:outline-none focus:ring-0"
                            />
                            <div className="flex-shrink-0 text-sm text-fontColorSecondary">
                              to
                            </div>
                            <Input
                              type="number"
                              placeholder="-"
                              className="block h-8 w-full text-nowrap border-border bg-transparent text-sm text-fontColorPrimary placeholder:text-fontColorSecondary focus:outline-none focus:ring-0"
                            />
                          </div>
                        </div>

                        {/* Insiders Holder */}
                        <div className="flex items-center gap-x-2">
                          <Label className="w-[50%] justify-between text-nowrap text-sm text-fontColorSecondary">
                            Insiders Holder (%)
                          </Label>
                          <div className="flex w-full items-center gap-x-2">
                            <div className="relative w-full">
                              <Input
                                type="number"
                                value={byInsiderHoldingPercentage?.min}
                                onChange={(e) =>
                                  handlePercentageValue(
                                    "byInsiderHoldingPercentage",
                                    e,
                                    "min",
                                  )
                                }
                                placeholder="-"
                                className="block h-8 w-full text-nowrap border-border bg-transparent text-sm text-fontColorPrimary placeholder:text-fontColorSecondary focus:outline-none focus:ring-0"
                              />
                              {/* <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-fontColorSecondary">
                                %
                              </span> */}
                            </div>
                            <div className="flex-shrink-0 text-sm text-fontColorSecondary">
                              to
                            </div>
                            <div className="relative w-full">
                              <Input
                                type="number"
                                value={byInsiderHoldingPercentage?.max}
                                onChange={(e) =>
                                  handlePercentageValue(
                                    "byInsiderHoldingPercentage",
                                    e,
                                    "max",
                                  )
                                }
                                placeholder="-"
                                className="block h-8 w-full text-nowrap border-border bg-transparent text-sm text-fontColorPrimary placeholder:text-fontColorSecondary focus:outline-none focus:ring-0"
                              />
                              {/* <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-fontColorSecondary">
                                %
                              </span> */}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeFilterTab === "socials" && (
                      <div className="grid w-full grid-cols-4 gap-2">
                        {(socialList || [])?.map((social) => {
                          // Check if this social platform is included in showKeywords or doNotShowKeywords
                          const isChecked =
                            showKeywords
                              .toLowerCase()
                              .includes(social.socialValue.toLowerCase()) ||
                            doNotShowKeywords
                              .toLowerCase()
                              .includes(social.socialValue.toLowerCase());

                          return (
                            <button
                              key={`ncl-s-${social.socialValue}`}
                              onClick={() => {
                                // Toggle social filter by adding/removing from showKeywords
                                if (isChecked) {
                                  // Remove from both showKeywords and doNotShowKeywords
                                  const showWords = showKeywords
                                    .split(" ")
                                    .filter(
                                      (word) =>
                                        word.toLowerCase() !==
                                        social.socialValue.toLowerCase(),
                                    )
                                    .join(" ")
                                    .trim();
                                  const hideWords = doNotShowKeywords
                                    .split(" ")
                                    .filter(
                                      (word) =>
                                        word.toLowerCase() !==
                                        social.socialValue.toLowerCase(),
                                    )
                                    .join(" ")
                                    .trim();
                                  setShowKeywords(showWords, "preview");
                                  setDoNotShowKeywords(hideWords, "preview");
                                } else {
                                  // Add to showKeywords (prefer showing over hiding)
                                  const newKeywords = showKeywords
                                    ? `${showKeywords} ${social.socialValue}`
                                    : social.socialValue;
                                  setShowKeywords(
                                    newKeywords.trim(),
                                    "preview",
                                  );
                                }
                              }}
                              className="flex h-8 w-full cursor-pointer items-center justify-between gap-x-2 rounded-[8px] py-1 pr-1 duration-300"
                            >
                              <div className="flex items-center gap-x-1">
                                <div className="relative aspect-square h-5 w-5 flex-shrink-0">
                                  <Image
                                    src={
                                      isChecked
                                        ? "/icons/footer/checked.png"
                                        : "/icons/footer/unchecked.png"
                                    }
                                    alt="Check / Unchecked Icon"
                                    fill
                                    quality={100}
                                    className="object-contain"
                                    loading="lazy"
                                  />
                                </div>
                                <div
                                  className={cn(
                                    "relative aspect-square h-4 w-4 flex-shrink-0",
                                    social?.customClass,
                                  )}
                                >
                                  <Image
                                    src={social?.iconURL}
                                    alt={`${social?.name} Icon`}
                                    fill
                                    quality={100}
                                    className="object-contain"
                                    loading="lazy"
                                  />
                                </div>
                                <span className="inline-block text-nowrap text-sm text-fontColorPrimary">
                                  {social?.name && social.name.length > 5
                                    ? `${social.name.substring(0, 4)}...`
                                    : social?.name}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="absolute bottom-0 left-0 flex h-[64px] w-full items-center justify-between gap-x-3 border-t border-border bg-background p-4">
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
  },
);

GraduatedListFilterPopover.displayName = "GraduatedListFilterPopover";

export default GraduatedListFilterPopover;
