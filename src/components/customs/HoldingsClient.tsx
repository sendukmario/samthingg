"use client";

import { usePopupStore } from "@/stores/use-popup-state.store";
import DexBuySettings from "./DexBuySettings";
import PageHeading from "./headings/PageHeading";
import HoldingsWalletSelection from "./HoldingsWalletSelection";
import HoldingsListSection from "./sections/HoldingsListSection";
import { cn } from "@/libraries/utils";
import { useCustomizeSettingsStore } from "@/stores/setting/use-customize-settings.store";

function HoldingsClient() {
  const { remainingScreenWidth } = usePopupStore();
  const currentTheme = useCustomizeSettingsStore(
    (state) => state.presets.preset1.themeSetting,
  );

  const isSnapMobile = remainingScreenWidth < 1280;
  return (
    <>
      <div
        className={cn(
          "px-3.5 pb-1 pt-4 lg:px-0 xl:p-0",
          currentTheme === "cupsey" && "xl:pt-2",
        )}
      >
        <HoldingsWalletSelection />
        {/* <div className="absolute top-0 bg-card text-red-400"> */}
        {/*   {remainingScreenWidth} */}
        {/* </div> */}
      </div>
      <div
        className={cn(
          "flex w-full flex-col justify-between gap-y-2 px-4 py-4 md:mt-2 lg:gap-y-4 lg:px-0 xl:flex-row xl:items-center",
          isSnapMobile && "xl:flex-col xl:items-start",
        )}
      >
        <PageHeading
          title="My Holdings"
          description="View all tokens you've bought"
          line={1}
          showDescriptionOnMobile
        />
        <DexBuySettings variant="Holdings" />
      </div>
      <HoldingsListSection />
    </>
  );
}

export default HoldingsClient;
