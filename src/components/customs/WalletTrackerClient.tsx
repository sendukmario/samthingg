"use client";

// ######## Libraries 📦 & Hooks 🪝 ########
import { useEffect, useRef } from "react";
import { useWalletTrackerMessageStore } from "@/stores/footer/use-wallet-tracker-message.store";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usePopupStore } from "@/stores/use-popup-state.store";
// ######## APIs 🛜 ########
import {
  getWalletTracker,
  InitWalletTracker,
  WalletTracker,
} from "@/apis/rest/wallet-tracker";
// ######## Components 🧩 ########
import NoScrollLayout from "@/components/layouts/NoScrollLayout";
import PageHeading from "@/components/customs/headings/PageHeading";
import DexBuySettings from "@/components/customs/DexBuySettings";
import WalletTrackerContent from "@/components/customs/WalletTrackerContent";
import { Paused } from "./cards/partials/Paused";
import { useWalletTrackerPaused } from "@/stores/footer/use-wallet-tracker-paused.store";
import ScrollLayout from "../layouts/ScrollLayout";
import { useWindowSize } from "@/hooks/use-window-size";
import { clearFooterSection } from "@/apis/rest/footer";
import { useFooterStore } from "@/stores/footer/use-footer.store";
import { cn } from "@/libraries/utils";

const WalletTrackerClient = () => {
  const setWalletTrackerList = useWalletTrackerMessageStore(
    (state) => state.setInitMessages,
  );

  const isClient = useRef<boolean>(false);
  useEffect(() => {
    isClient.current = true;
  }, [isClient]);

  const {
    data: trackerData,
    isLoading: isTrackerDataLoading,
    isFetched: isFetchedTracker,
  } = useQuery({
    queryKey: ["wallet-tracker"],
    queryFn: async () => {
      const res = await getWalletTracker();

      console.warn("WALLET TRACKER - CLIENT ✅", res);

      if (Array.isArray(res)) {
        return res;
      } else {
        return res.alerts;
      }
    },
    gcTime: 0,
    staleTime: 0,
    // refetchOnMount: true,
  });
  const setFooterMessage = useFooterStore((state) => state.setMessage);
  useQuery({
    queryKey: ["clear-footer-wallet-tracker"],
    queryFn: async () => {
      const res = await clearFooterSection("walletTracker");
      setFooterMessage(res);
      return res;
    },
    gcTime: 0,
    staleTime: 0,
    refetchOnMount: true,
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    if (trackerData) {
      setWalletTrackerList(trackerData);
    }
  }, [trackerData]);

  useEffect(() => {
    return () => {
      queryClient.removeQueries({
        queryKey: ["wallet-tracker"],
        exact: true,
      });
    };
  }, [queryClient]);

  const isWalletTrackerHovered = useWalletTrackerPaused(
    (state) => state.isWalletTrackerHovered,
  );
  const remainingScreenWidth = usePopupStore(
    (state) => state.remainingScreenWidth,
  );

  const { width } = useWindowSize();

  // Fix: Changed the Layout function to render the appropriate layout component
  const renderLayout = (children: React.ReactNode) => {
    if (width && width < 768) {
      return <ScrollLayout withPadding={false}>{children}</ScrollLayout>;
    }
    return (
      <NoScrollLayout mobileOnWhichBreakpoint="lg">{children}</NoScrollLayout>
    );
  };

  const layoutContent = (
    <>
      <div
        className={cn(
          "flex w-full flex-col flex-wrap justify-between gap-y-2 px-4 pb-3 pt-4 xl:flex-nowrap xl:px-0 xl:pb-4 xl:pt-3",
          remainingScreenWidth &&
            remainingScreenWidth > 1750 &&
            "flex-row items-center gap-x-4",
        )}
      >
        <PageHeading
          title="Wallet Tracker"
          description="Add any wallet to receive real-time notifications on trades and activity"
          line={1}
          showDescriptionOnMobile
        >
          <div className="hidden h-7 w-auto items-center justify-center lg:flex">
            {isWalletTrackerHovered && (
              <Paused
                separatorProps={{ className: "mr-2" }}
                className="hidden lg:flex"
              />
            )}
          </div>
        </PageHeading>

        <DexBuySettings variant="Wallet Tracker" />
      </div>

      <div className="flex w-full flex-grow flex-col items-center justify-center xl:px-0">
        <WalletTrackerContent
          isTrackerDataLoading={isTrackerDataLoading || !isFetchedTracker}
        />
      </div>
    </>
  );

  return (
    <>
      {renderLayout(layoutContent)}
      {/* <WalletTrackerInteractiveTutorials /> */}
    </>
  );
};

export default WalletTrackerClient;
