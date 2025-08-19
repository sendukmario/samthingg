"use client";
import WalletTrackerSkeleton from "@/components/customs/skeletons/WalletTrackerSkeleton";
import TrackedWalletsSkeleton from "@/components/customs/skeletons/TrackedWalletsSkeleton";
import { useWalletTrackerStore } from "@/stores/footer/use-wallet-tracker.store";
// import dynamic from "next/dynamic";
import { useCustomizeSettingsStore } from "@/stores/setting/use-customize-settings.store";
import { useMemo } from "react";
import { cn } from "@/libraries/utils";
import WalletTrackerTable from "@/components/customs/tables/footer/WalletTrackerTable";
// const WalletTrackerTable = dynamic(
//   () => import("@/components/customs/tables/footer/WalletTrackerTable"),
//   { ssr: false, loading: WalletTrackerSkeleton },
// );
import TrackedWallets from "@/components/customs/TrackedWallets";
// const TrackedWallets = dynamic(
//   () => import("@/components/customs/TrackedWallets"),
//   { ssr: false, loading: TrackedWalletsSkeleton },
// );

const WalletTrackerContent = ({
  isTrackerDataLoading,
}: {
  isTrackerDataLoading: boolean;
}) => {
  const isTrackedWalletsLoading = useWalletTrackerStore(
    (state) => state.isLoadingTrackedWallets,
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

  return (
    <div
      className={cn(
        "relative mb-8 flex h-full w-full flex-grow items-center justify-center overflow-hidden border-0 border-border xl:mb-12 xl:rounded-[8px] xl:border",
        currentTheme === "cupsey" && "xl:mb-2",
      )}
    >
      <div className="absolute left-0 top-0 flex h-full w-full flex-grow flex-col xl:flex-row">
        {isTrackerDataLoading || isTrackedWalletsLoading ? (
          <TrackedWalletsSkeleton />
        ) : (
          <TrackedWallets />
        )}
        <div className="border-l-none mb-4 flex h-full flex-grow flex-col items-center justify-center border-border xl:border-l">
          {isTrackedWalletsLoading || isTrackerDataLoading ? (
            <WalletTrackerSkeleton />
          ) : (
            <WalletTrackerTable />
          )}
        </div>
      </div>
    </div>
  );
};

export default WalletTrackerContent;
