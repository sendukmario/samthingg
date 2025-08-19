import React, { useState, useEffect, useRef, useMemo } from "react";
import BaseButton from "./buttons/BaseButton";
import Image from "next/image";
import AddTrackedWallet from "./AddTrackedWallet";
import { cn } from "@/libraries/utils";
import { FixedSizeList } from "react-window";
import TrackerWalletCard from "./TrackedWalletCard";
import { updateTrackedWallets } from "@/apis/rest/wallet-tracker";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import { useWalletTrackerMessageStore } from "@/stores/footer/use-wallet-tracker-message.store";
import { WalletTrackerImport } from "./modals/contents/footer/WalletTrackerImport";
import { Trash2, Bell, BellOff, ChevronDown } from "lucide-react";
import { useSelectedWalletTrackerTradeAddressesFilterStore } from "@/stores/footer/use-selected-wallet-tracker-trade-filter.store";
import { useWalletTrackerStore } from "@/stores/footer/use-wallet-tracker.store";
import { Input } from "../ui/input";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import CustomToast from "./toasts/CustomToast";
import { useWindowSizeStore } from "@/stores/use-window-size.store";
import { ExportWallets } from "./modals/contents/footer/ExportWallets";
import { clearFooterSection } from "@/apis/rest/footer";
import { useFooterStore } from "@/stores/footer/use-footer.store";
import NotificationPopover from "./NotificationPopover";
import { useCosmoSoundStore } from "@/stores/cosmo/use-cosmo-sound.store";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { useCustomToast } from "@/hooks/use-custom-toast";

const TrackedWallets = () => {
  const width = useWindowSizeStore((state) => state.width);
  const { removeWalletConfig } = useCosmoSoundStore();
  const queryClient = useQueryClient();
  const trackedWalletsList = useWalletTrackerMessageStore(
    (state) => state.trackedWallets,
  );
  const mutedTrackedWallet = useWalletTrackerStore(
    (state) => state.trackedEnabledSound,
  );
  const setMutedTrackedWallet = useWalletTrackerStore(
    (state) => state.setTrackerEnabledSound,
  );
  const { success, error: errorToast, warning } = useCustomToast();

  // Add state for search term and container height
  const [searchTerm, setSearchTerm] = useState("");
  const [containerHeight, setContainerHeight] = useState(300);
  const containerRef = useRef<HTMLDivElement>(null);

  // Create filtered wallet list based on search term - memoized to prevent re-renders
  const filteredWalletsList = useMemo(() => {
    return (trackedWalletsList || [])?.filter((wallet) => {
      if (!searchTerm.trim()) return true;

      const searchLower = searchTerm.toLowerCase().trim();

      // For names: Use substring matching (partial match)
      if (wallet.name.toLowerCase().includes(searchLower)) {
        return true;
      }

      // For addresses: Use exact matching
      if (wallet.address.toLowerCase() === searchLower) {
        return true;
      }

      return false;
    });
  }, [trackedWalletsList, searchTerm]);

  // Update container height when component mounts or window resizes
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current && width && width >= 1280) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerHeight(Math.max(rect.height, 200));
      }
    };

    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, [width, filteredWalletsList.length]);

  // Row component for react-window - memoized to prevent re-renders
  const Row = useMemo(() => {
    const RowComponent = ({
      index,
      style,
    }: {
      index: number;
      style: React.CSSProperties;
    }) => {
      const wallet = filteredWalletsList[index];
      if (!wallet) return null;

      return (
        <div style={style}>
          <TrackerWalletCard
            trackedWallets={trackedWalletsList || []}
            key={wallet.address}
            address={wallet.address}
            emoji={wallet.emoji}
            name={wallet.name}
            index={index}
          />
        </div>
      );
    };

    RowComponent.displayName = "Row";
    return RowComponent;
  }, [filteredWalletsList, trackedWalletsList]);

  const setFooterMessage = useFooterStore((state) => state.setMessage);

  // Delete wallets mutation
  const deleteWalletsMutation = useMutation({
    mutationFn: updateTrackedWallets,
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["tracked-wallets"] });
      queryClient.invalidateQueries({ queryKey: ["wallet-tracker"] });
      const res = await clearFooterSection("walletTracker");
      setFooterMessage(res);
      // toast.custom((t: any) => (
      //   <CustomToast
      //     tVisibleState={t.visible}
      //     message="Selected wallets deleted successfully"
      //     state="SUCCESS"
      //   />
      // ));
      success("Selected wallets deleted successfully");
      // Clear selected wallets after deletion
      setSelectedWalletAddressesFilter([]);
    },
    onError: (error: Error) => {
      // toast.custom((t: any) => (
      //   <CustomToast
      //     tVisibleState={t.visible}
      //     message={error.message}
      //     state="ERROR"
      //   />
      // ));
      errorToast(error.message);
    },
  });

  const handleDeleteSelected = () => {
    if (currentSelectedAddresses.length === 0) {
      // toast.custom((t: any) => (
      //   <CustomToast
      //     tVisibleState={t.visible}
      //     message="Please select wallets to delete first"
      //     state="WARNING"
      //   />
      // ));
      warning("Please select wallets to delete first");
      return;
    }

    // Filter out the selected wallets
    const remainingWallets = (trackedWalletsList || [])?.filter(
      (wallet) => !currentSelectedAddresses.includes(wallet.address),
    );

    removeWalletConfig(currentSelectedAddresses);

    // Update the wallets list without the selected ones
    deleteWalletsMutation.mutate(remainingWallets);
  };

  const handleSoundToggle = () => {
    const allWalletAddresses = (trackedWalletsList || [])?.map(
      (w) => w?.address,
    );

    if (
      Array.isArray(mutedTrackedWallet) &&
      mutedTrackedWallet.length === allWalletAddresses.length
    ) {
      setMutedTrackedWallet([]);
    } else {
      if (mutedTrackedWallet.length === 0) {
        setMutedTrackedWallet(allWalletAddresses);
      } else {
        setMutedTrackedWallet([]);
      }
    }
  };

  const isAllMuted =
    Array.isArray(mutedTrackedWallet) &&
    mutedTrackedWallet.length === trackedWalletsList.length;
  const isAllUnmuted = mutedTrackedWallet.length === 0;

  const currentSelectedAddresses =
    useSelectedWalletTrackerTradeAddressesFilterStore(
      (state) => state.selectedWalletAddresses,
    );
  const setSelectedWalletAddressesFilter =
    useSelectedWalletTrackerTradeAddressesFilterStore(
      (state) => state.setSelectedWalletAddresses,
    );

  /* console.log("selected wallets", currentSelectedAddresses) */ const handleAllWalletSelection =
    () => {
      // When selecting all wallets, we should use the filtered wallet addresses
      // if a search term is active
      const relevantWalletAddresses = (filteredWalletsList || [])?.map(
        (tw) => tw.address,
      );

      if (
        currentSelectedAddresses.length === relevantWalletAddresses.length &&
        (relevantWalletAddresses || [])?.every((addr) =>
          currentSelectedAddresses.includes(addr),
        )
      ) {
        // If all filtered wallets are already selected, deselect them
        const newSelection = (currentSelectedAddresses || [])?.filter(
          (addr) => !relevantWalletAddresses.includes(addr),
        );
        setSelectedWalletAddressesFilter(newSelection);
      } else {
        // Select all filtered wallets (maintaining any selections outside the filter)
        const walletAddressesOutsideFilter = (
          currentSelectedAddresses || []
        )?.filter(
          (addr) =>
            !(trackedWalletsList || [])?.find((w) => w.address === addr) ||
            !relevantWalletAddresses.includes(addr),
        );

        setSelectedWalletAddressesFilter([
          ...walletAddressesOutsideFilter,
          ...relevantWalletAddresses,
        ]);
      }
    };

  // Search input change handler
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const listHeight = Math.min(filteredWalletsList.length * 70, 300); // 500px max, or whatever fits your design

  // Mobile Swiper list - memoized to prevent re-renders
  const mobileWalletCards = useMemo(() => {
    return (filteredWalletsList ?? [])?.map((t, index) => (
      <SwiperSlide key={t.address} className="px-3">
        <TrackerWalletCard
          trackedWallets={trackedWalletsList ?? []}
          address={t.address}
          emoji={t.emoji}
          name={t.name}
        />
      </SwiperSlide>
    ));
  }, [filteredWalletsList, trackedWalletsList]);

  return (
    <div className="flex h-[255] w-full flex-col items-center border-y border-border xl:h-full xl:w-fit xl:border-none">
      <div className="border-b-none flex h-[72px] w-full flex-shrink-0 items-center justify-between gap-x-2 border-border px-4 xl:border-b">
        <div className="flex flex-col gap-y-0.5">
          <h1 className="font-geistSemiBold text-base text-fontColorPrimary">
            Tracked Wallets
          </h1>
          <p className="text-xs text-fontColorSecondary">
            {trackedWalletsList.length}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Notification Button for Mobile */}
          <div className="md:hidden">
            <NotificationPopover isLarge />
          </div>
          {/* <BaseButton
            onClick={handleNotificationToggle}
            variant="gray"
            size="short"
            className="relative h-full bg-secondary md:hidden"
          >
            <div className="relative z-30 aspect-square h-4 w-4 flex-shrink-0">
              {notificationsEnabled ? (
                <Bell size={16} className="text-fontColorPrimary" />
              ) : (
                <BellOff size={16} className="text-fontColorSecondary" />
              )}
            </div>
          </BaseButton> */}

          {/* Sound Button for Mobile */}
          <BaseButton
            onClick={handleSoundToggle}
            variant="gray"
            size="short"
            className="relative h-full bg-secondary md:hidden"
          >
            <div className="relative z-30 aspect-square h-4 w-4 flex-shrink-0">
              <Image
                src={
                  isAllMuted
                    ? "/icons/footer/sound-on.png"
                    : "/icons/footer/sound-off.png"
                }
                alt={isAllMuted ? "Sound On Icon" : "Sound Off Icon"}
                fill
                quality={100}
                className="object-contain"
              />
            </div>
          </BaseButton>

          {/* Notification Button for Medium Screen */}
          {width! < 1280 && (
            <div className="hidden md:flex">
              <NotificationPopover isLarge isLabel />
            </div>
          )}

          {/* Mute Button on Medium Screen */}
          <BaseButton
            onClick={handleSoundToggle}
            variant="gray"
            size="short"
            className="relative hidden h-10 bg-secondary md:flex xl:hidden"
          >
            <div className="relative z-30 aspect-square h-4 w-4 flex-shrink-0">
              <Image
                src={
                  isAllMuted
                    ? "/icons/footer/sound-on.png"
                    : "/icons/footer/sound-off.png"
                }
                alt={isAllMuted ? "Sound On Icon" : "Sound Off Icon"}
                fill
                quality={100}
                className="object-contain"
              />
            </div>
            <span className="whitespace-nowrap font-geistSemiBold text-sm">
              {isAllMuted
                ? `Unmute (${trackedWalletsList.length})`
                : isAllUnmuted
                  ? `Mute (${trackedWalletsList.length})`
                  : `Unmute (${mutedTrackedWallet.length})`}
            </span>
          </BaseButton>

          <div id="export-wallet">
            <ExportWallets />
          </div>

          <div id="import-wallet">
            <WalletTrackerImport />
          </div>

          <div id="add-wallet">
            <AddTrackedWallet />
          </div>
        </div>
      </div>

      {/* Search wallets */}
      <div className="flex w-full gap-2 border-y border-border p-4 xl:border-b">
        <Input
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Search wallet"
          className="h-10 bg-secondary"
          prefixEl={
            <div className="absolute left-3 top-1/2 z-10 aspect-square h-4 w-4 flex-shrink-0 -translate-y-1/2">
              <Image
                src="/icons/search-input.png"
                alt="Search Icon"
                fill
                quality={100}
                className="object-contain"
              />
            </div>
          }
        />
      </div>

      {/* All Filter */}
      {filteredWalletsList.length > 0 && (
        <div className="hidden w-full items-center justify-between gap-3 border-b border-border px-4 py-2 xl:flex xl:border-none">
          <div className="flex flex-shrink-0 items-center justify-start gap-x-3">
            <div
              onClick={handleAllWalletSelection}
              className="relative aspect-square h-5 w-5 flex-shrink-0 cursor-pointer"
            >
              <Image
                src={
                  filteredWalletsList.length > 0 &&
                  (filteredWalletsList || [])?.every((wallet) =>
                    currentSelectedAddresses.includes(wallet.address),
                  )
                    ? "/icons/footer/remove-checked.png"
                    : "/icons/footer/unchecked.png"
                }
                alt="Check / Unchecked Icon"
                fill
                quality={100}
                className="object-contain"
              />
            </div>
            <h4
              onClick={handleAllWalletSelection}
              className="w-fit cursor-pointer text-nowrap font-geistSemiBold text-sm text-fontColorPrimary"
            >
              {currentSelectedAddresses.length < trackedWalletsList.length
                ? `${currentSelectedAddresses.length} Wallets selected`
                : "All Wallets selected"}
            </h4>
          </div>

          <div className="flex gap-2">
            {/* <BaseButton */}
            {/*   onClick={handleDeleteSelected} */}
            {/*   variant="gray" */}
            {/*   className="relative flex h-8 bg-secondary" */}
            {/* > */}
            {/*   <div className="relative z-30 aspect-square h-4 w-4 flex-shrink-0"> */}
            {/*     <Trash2 size={16} className="text-red-500" /> */}
            {/*   </div> */}
            {/* </BaseButton> */}
            <DeleteSelectedWalletButton
              handleDeleteSelected={handleDeleteSelected}
            />

            {/* Notification Button in Filter Section */}

            <BaseButton
              onClick={handleSoundToggle}
              variant="gray"
              className="relative flex h-8 bg-secondary"
            >
              <div className="relative z-30 aspect-square h-4 w-4 flex-shrink-0">
                <Image
                  src={
                    isAllMuted
                      ? "/icons/footer/sound-on.png"
                      : "/icons/footer/sound-off.png"
                  }
                  alt={isAllMuted ? "Sound On Icon" : "Sound Off Icon"}
                  fill
                  quality={100}
                  className="object-contain"
                />
              </div>
              <span className="whitespace-nowrap font-geistSemiBold text-sm">
                {isAllMuted
                  ? `Unmute (${trackedWalletsList.length})`
                  : isAllUnmuted
                    ? `Mute (${trackedWalletsList.length})`
                    : `Unmute (${mutedTrackedWallet.length})`}
              </span>
            </BaseButton>

            {/* <BaseButton */}
            {/*   variant="gray" */}
            {/*   className="relative flex h-8 bg-secondary" */}
            {/* > */}
            {/*   <div className="relative z-30 aspect-square h-4 w-4 flex-shrink-0"> */}
            {/*     <ChevronDown size={16} className="text-fontColorPrimary" /> */}
            {/*   </div> */}
            {/* </BaseButton> */}
          </div>
        </div>
      )}

      <div className="!hidden min-h-10 w-full max-xl:grid max-xl:grid-cols-2 max-xl:px-8 xl:flex xl:items-center xl:justify-start">
        <div className="w-40 py-3 pr-4 font-geistSemiBold text-xs uppercase text-[#9191A4] xl:pl-4">
          Wallet Name
        </div>
        <div className="flex h-full items-center justify-end">
          <div className="w-[104px] px-4 py-3 font-geistSemiBold text-xs uppercase text-[#9191A4]">
            Highlight
          </div>
          <div className="w-[104px] px-4 py-3 font-geistSemiBold text-xs uppercase text-[#9191A4] xl:w-[136px]">
            Actions
          </div>
        </div>
      </div>
      {width && width >= 1280 ? (
        <div
          ref={containerRef}
          className="nova-scroller relative min-h-0 w-full flex-1"
        >
          {(filteredWalletsList || []).length > 0 ? (
            <FixedSizeList
              height={containerHeight}
              itemCount={filteredWalletsList.length}
              itemSize={70} // Height of each TrackerWalletCard (h-[70px])
              width="100%"
              className="!overflow-y-auto"
            >
              {Row}
            </FixedSizeList>
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="text-sm text-[#737384]">
                {searchTerm
                  ? "No wallets match your search"
                  : "You haven't added any wallets yet!"}
              </span>
            </div>
          )}
        </div>
      ) : (filteredWalletsList || []).length > 0 ? (
        <div
          className={cn(
            "wallet__tracker__slider relative z-20 flex h-fit w-full items-center justify-center gap-x-7",
            (filteredWalletsList || []).length > 1 ? "py-4" : "pt-4",
          )}
        >
          <Swiper
            slidesPerView={1}
            spaceBetween={8}
            pagination={{
              clickable: true,
              dynamicBullets: true,
            }}
            loop={false}
            modules={[Pagination]}
            className="mySwiper"
          >
            {mobileWalletCards}
          </Swiper>
        </div>
      ) : (
        <div className="flex min-h-[112px] items-center justify-center">
          <span className="text-sm text-[#737384]">
            {searchTerm
              ? "No wallets match your search"
              : "You haven't added any wallets yet!"}
          </span>
        </div>
      )}
    </div>
  );
};

export default TrackedWallets;

const DeleteSelectedWalletButton = ({
  handleDeleteSelected,
}: {
  handleDeleteSelected: () => void;
}) => {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <BaseButton
            onClick={handleDeleteSelected}
            variant="gray"
            className="relative flex h-8 bg-secondary"
          >
            <div className="relative z-30 aspect-square h-4 w-4 flex-shrink-0">
              <Trash2 size={16} className="text-red-500" />
            </div>
          </BaseButton>
        </TooltipTrigger>
        <TooltipContent>
          <span>Delete all selected wallets</span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
