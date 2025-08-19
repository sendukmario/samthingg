"use client";

// ######## Libraries 📦 & Hooks 🪝 ########
import { useQuickAmountStore } from "@/stores/dex-setting/use-quick-amount.store";
import { useQuickBuySettingsStore } from "@/stores/setting/use-quick-buy-settings.store";
import { useSnapStateStore } from "@/stores/use-snap-state.store";
// ######## Components 🧩 ########
import WalletSelectionButton from "@/components/customs/WalletSelectionButton";
import PresetSelectionButtons from "@/components/customs/PresetSelectionButtons";
import QuickAmountInput from "@/components/customs/QuickAmountInput";
// ######## Utils & Helpers 🤝 ########
import { cn } from "@/libraries/utils";
import { useWindowSizeStore } from "@/stores/use-window-size.store";
import { useTokenStateAmountStore } from "@/stores/dex-setting/use-token-state-amount.store";
import { useActiveTabStore } from "@/stores/cosmo/use-active-tab.store";
import { TokenState } from "./lists/NewlyCreatedList";
import { useCustomizeSettingsStore } from "@/stores/setting/use-customize-settings.store";
import { useMemo } from "react";

export default function CosmoBuySettings() {
  const width = useWindowSizeStore((state) => state.width);

  const customizedSettingPresets = useCustomizeSettingsStore(
    (state) => state.presets,
  );
  const customizedSettingActivePreset = useCustomizeSettingsStore(
    (state) => state.activePreset,
  );

  const currentCosmoType = useMemo(
    () =>
      customizedSettingPresets[customizedSettingActivePreset]
        .cosmoCardStyleSetting || "type1",
    [customizedSettingPresets, customizedSettingActivePreset],
  );

  const currentTheme = useMemo(
    () =>
      customizedSettingPresets[customizedSettingActivePreset].themeSetting ||
      "original",
    [customizedSettingPresets, customizedSettingActivePreset],
  );

  const isFetchedSettings = !!useQuickBuySettingsStore((state) => state.presets)
    ?.preset1;

  const cosmoWallets = useQuickAmountStore((state) => state.cosmoWallets);
  const setCosmoWallets = useQuickAmountStore((state) => state.setCosmoWallets);

  const currentSnapped = useSnapStateStore((state) => state.currentSnapped);
  const activeTab = useActiveTabStore((state) => state.activeTab);
  const getTokenStateAmount = useTokenStateAmountStore(
    (state: { getAmount: (tokenState: TokenState) => number }) =>
      state.getAmount,
  );
  const setTokenStateAmount = useTokenStateAmountStore(
    (state: { setAmount: (tokenState: TokenState, amount: number) => void }) =>
      state.setAmount,
  );
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-2 gap-y-2 min-[1340px]:gap-x-2",
        currentSnapped.side === "none" ? "justify-end" : "justify-start",
        currentCosmoType === "type4" && "mr-auto justify-start",
      )}
    >
      <div
        className={cn(
          `flex w-full items-start gap-x-2 gap-y-2`,
          currentTheme === "cupsey" &&
            "flex-row-reverse flex-wrap-reverse justify-end",
          currentTheme !== "cupsey" &&
            `flex-col ${currentCosmoType === "type4" ? "md:flex-row-reverse" : "md:flex-row"} `,
        )}
      >
        <div className="flex flex-nowrap gap-x-2 gap-y-2 max-md:w-full">
          {width! < 1280 && (
            <>
              {activeTab === "Newly Created" && (
                <QuickAmountInput
                  isLoading={!isFetchedSettings}
                  value={getTokenStateAmount("newlyCreated")}
                  onChange={(val) => {
                    if (Number(val) >= 0.00001) {
                      setTokenStateAmount("newlyCreated", Number(val));
                    }
                  }}
                  width={width! >= 1280 ? undefined : 170}
                  className="flex flex-shrink flex-grow max-lg:!w-full max-lg:max-w-[150px]"
                  classNameChildren="!w-full"
                />
              )}
              {activeTab === "About to Graduate" && (
                <QuickAmountInput
                  isLoading={!isFetchedSettings}
                  value={getTokenStateAmount("aboutToGraduate")}
                  onChange={(val) => {
                    if (Number(val) >= 0.00001) {
                      setTokenStateAmount("aboutToGraduate", Number(val));
                    }
                  }}
                  width={width! >= 1280 ? undefined : 170}
                  className="flex flex-shrink flex-grow max-lg:!w-full max-lg:max-w-[150px]"
                  classNameChildren="!w-full"
                />
              )}
              {activeTab === "Graduated" && (
                <QuickAmountInput
                  isLoading={!isFetchedSettings}
                  value={getTokenStateAmount("graduated")}
                  onChange={(val) => {
                    if (Number(val) >= 0.00001) {
                      setTokenStateAmount("graduated", Number(val));
                    }
                  }}
                  width={width! >= 1280 ? undefined : 170}
                  className="flex flex-shrink flex-grow max-lg:!w-full max-lg:max-w-[150px]"
                  classNameChildren="!w-full"
                />
              )}
            </>
          )}

          <div className="w-fit">
            <PresetSelectionButtons isWithLabel isWithSetting />
          </div>
        </div>

        {/* Desktop */}
        {width! >= 1280 && (
          <div className="hidden h-[32px] flex-shrink-0 items-center xl:flex">
            <WalletSelectionButton
              value={cosmoWallets}
              setValue={setCosmoWallets}
              isReplaceWhenEmpty={false}
              maxWalletShow={10}
              displayVariant="name"
              className="h-[32px]"
            />
          </div>
        )}
        {/* Mobile */}
        {width! < 1280 && (
          <div className="w-full md:w-fit">
            <div className="flex h-[32px] w-full min-w-[300px] flex-shrink-0 items-center md:w-fit xl:hidden">
              <WalletSelectionButton
                className="w-full"
                value={cosmoWallets}
                setValue={setCosmoWallets}
                maxWalletShow={10}
                isReplaceWhenEmpty={false}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
