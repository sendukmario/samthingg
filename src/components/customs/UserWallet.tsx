"use client";

// ######## Libraries 📦 & Hooks 🪝 ########
import { useState, useMemo, useCallback, startTransition } from "react";
import { useUserWalletStore } from "@/stores/wallet/use-user-wallet.store";
import { useOptimistic } from "react";
import { useWindowSizeStore } from "@/stores/use-window-size.store";
import { useCopyAddress } from "@/stores/use-copy-address.store";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import toast from "react-hot-toast";
// ######## Components 🧩 ########
import Image from "next/image";
import BaseButton from "@/components/customs/buttons/BaseButton";
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
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";
import DepositPopoverModal from "./modals/DepositPopoverModal";
import Separator from "./Separator";
import CustomToast from "./toasts/CustomToast";
import { PopoverClose } from "@radix-ui/react-popover";
// ######## Utils & Helpers 🤝 ########
import { cn } from "@/libraries/utils";
import {
  deselectWallets,
  selectWallets,
  Wallet,
} from "@/apis/rest/wallet-manager";
import {
  formatAmountDollar,
  formatAmountWithoutLeadingZero,
} from "@/utils/formatAmount";
import { truncateAddress } from "@/utils/truncateAddress";
import { useSolPriceMessageStore } from "@/stores/use-solprice-message.store";
import { useQuickAmountStore } from "@/stores/dex-setting/use-quick-amount.store";
import { useIsClient } from "@/hooks/use-is-client";
import { useCustomizeTheme } from "@/hooks/use-customize-theme";
import { useCustomToast } from "@/hooks/use-custom-toast";

const customTriggerComponent = (
  <BaseButton
    variant="gray"
    className="h-7 w-min rounded-[4px] px-1 max-md:hidden"
  >
    <div className="relative aspect-square size-[18px] flex-shrink-0">
      <Image
        src="/icons/deposit.svg"
        alt="Import Icon"
        fill
        quality={100}
        className="object-contain"
      />
    </div>
  </BaseButton>
);

interface UserWalletProps {
  variant?: "default" | "setting";
}

export default function UserWallet({ variant = "default" }: UserWalletProps) {
  const theme = useCustomizeTheme();
  const queryClient = useQueryClient();
  const { userWalletFullList } = useUserWalletStore();
  const finalWallets =
    (userWalletFullList || [])?.filter((w) => !w.archived) || [];
  const [openPopover, setOpenPopover] = useState<boolean>(false);
  const [openDrawer, setOpenDrawer] = useState<boolean>(false);
  const balance = useUserWalletStore((state) => state.balance);
  const { error: errorToast } = useCustomToast();

  // Add state for All Wallets selection
  const [isAllWalletsSelected, setIsAllWalletsSelected] = useState(() => {
    // Check localStorage for persistence
    if (typeof window !== "undefined") {
      return localStorage.getItem("nova-all-wallets-selected") === "true";
    }
    return false;
  });

  const walletWithBalance = (finalWallets || [])?.map((wallet) => ({
    ...wallet,
    balance: String(balance[wallet?.address] || "0"),
  })) as Wallet[];

  // Calculate total balance for All Wallets display
  const totalBalance = useMemo(() => {
    return (
      walletWithBalance?.reduce((sum, wallet) => {
        return sum + Number(wallet.balance || 0);
      }, 0) || 0
    );
  }, [walletWithBalance]);

  const [optimisticWallets, setOptimisticWallets] = useOptimistic(
    walletWithBalance || [],
    (state, newWallet: { address: string; selected: boolean }) =>
      (state || [])?.map((wallet) => ({
        ...wallet,
        selected:
          wallet?.address === newWallet?.address
            ? newWallet.selected
            : !newWallet.selected && wallet.selected,
      })),
  );

  const [pendingWalletAddress, setPendingWalletAddress] = useState<
    string | null
  >(null);

  const { mutate: toggleSelect, isPending } = useMutation({
    mutationFn: async ({
      wallet,
      selected,
    }: {
      wallet: Wallet;
      selected: boolean;
    }) => {
      setPendingWalletAddress(wallet?.address);
      const activeWallets = (optimisticWallets || [])?.filter(
        (w) => w.selected,
      );

      if ((activeWallets || []).length === 1 && !selected) {
        throw new Error("Cannot deselect the last active wallet");
      }

      if (selected) {
        await deselectWallets((activeWallets || [])?.map((w) => w?.address));
        return await selectWallets([wallet?.address]);
      } else {
        return await deselectWallets([wallet?.address]);
      }
    },
    onMutate: async ({ wallet, selected }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["wallets"] });

      // Apply optimistic update in a transition
      startTransition(() => {
        setOptimisticWallets({ address: wallet?.address, selected });
      });
    },
    onError: (error) => {
      // Revert optimistic update on error
      // toast.custom((t: any) => (
      //   <CustomToast
      //     tVisibleState={t.visible}
      //     message={
      //       error instanceof Error
      //         ? error.message
      //         : "Failed to update wallet selection"
      //     }
      //     state="ERROR"
      //   />
      // ));
      errorToast(error.message || "Failed to update wallet selection");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
    },
    onSettled: () => {
      setPendingWalletAddress(null);
    },
  });

  // Enhanced wallet selection handler
  const handleWalletSelect = useCallback(
    (wallet: Wallet) => {
      // If All Wallets was selected, switch to individual wallet
      if (isAllWalletsSelected) {
        setIsAllWalletsSelected(false);
        localStorage.setItem("nova-all-wallets-selected", "false");
      }

      toggleSelect({
        wallet,
        selected: !wallet.selected,
      });
    },
    [isAllWalletsSelected, toggleSelect],
  );

  const setCosmoWallets = useQuickAmountStore((state) => state.setCosmoWallets);

  // Handle All Wallets selection
  const handleAllWalletsSelect = useCallback(() => {
    const newAllWalletsState = !isAllWalletsSelected;
    setIsAllWalletsSelected(newAllWalletsState);
    localStorage.setItem(
      "nova-all-wallets-selected",
      newAllWalletsState.toString(),
    );

    // Update cosmoWallets with all non-archived wallets when selected
    if (newAllWalletsState) {
      setCosmoWallets(finalWallets);
    }

    // Close popover/drawer after selection
    setOpenPopover(false);
    setOpenDrawer(false);
  }, [isAllWalletsSelected, finalWallets, setCosmoWallets]);

  const activeWallet = (walletWithBalance || [])?.find(
    (wallet) => wallet.selected,
  );

  // Display logic: show All Wallets info when selected, otherwise show active wallet
  const displayWallet = useMemo(() => {
    if (isAllWalletsSelected) {
      return {
        balance: totalBalance.toString(),
        name: "All Wallets",
        address: "all-wallets",
      };
    }

    // Show pending wallet during loading
    if (isPending && pendingWalletAddress) {
      return (
        (optimisticWallets || [])?.find(
          (wallet) => wallet?.address === pendingWalletAddress,
        ) || activeWallet
      );
    }

    return activeWallet;
  }, [
    isAllWalletsSelected,
    totalBalance,
    activeWallet,
    optimisticWallets,
    pendingWalletAddress,
    isPending,
  ]);

  const width = useWindowSizeStore((state) => state.width);
  const detailCopied = useCopyAddress((state) => state.detailCopied);
  const globalSolPrice = useSolPriceMessageStore(
    (state) => state.messages.price,
  );

  // const isClient = useIsClient();

  // Format balance consistently for both server and client
  const formatBalance = (balance: number) => {
    return formatAmountWithoutLeadingZero(balance, 6);
  };

  return (
    <>
      {/* Desktop */}
      {width! >= 1280 ? (
        <Popover open={openPopover} onOpenChange={setOpenPopover}>
          <PopoverTrigger asChild>
            <BaseButton
              onClick={() => setOpenPopover((prev) => !prev)}
              variant="gray"
              className="hidden h-8 pl-2 pr-2 xl:flex"
              prefixIcon={
                <div className="relative aspect-square h-4 w-4 flex-shrink-0">
                  <Image
                    src="/icons/solana-sq.svg"
                    alt="Solana SQ Icon"
                    fill
                    quality={100}
                    className="object-contain"
                  />
                </div>
              }
              suffixIcon={
                <div className="relative aspect-square h-6 w-6">
                  <Image
                    src="/icons/white-dropdown-arrow.png"
                    alt="White Dropdown Arrow Icon"
                    fill
                    quality={100}
                    className={cn(
                      "object-contain duration-300",
                      openPopover ? "rotate-180" : "rotate-0",
                    )}
                  />
                </div>
              }
            >
              <div className="flex items-center gap-x-1">
                <span className="line-clamp-1 block text-nowrap font-geistSemiBold text-sm text-fontColorPrimary">
                  {formatAmountWithoutLeadingZero(
                    Number(displayWallet?.balance),
                    6,
                  )}
                </span>
                <span className="line-clamp-1 block text-nowrap font-geistRegular text-xs text-fontColorSecondary">
                  {`(${displayWallet && displayWallet?.name.length > 20 ? truncateAddress(displayWallet?.name) : displayWallet?.name || "-"})`}
                </span>
              </div>
            </BaseButton>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            sideOffset={4}
            className="gb__white__popover mt-2 hidden w-[360px] rounded-[8px] border border-border p-0 shadow-[0_0_20px_0_#000000] xl:block"
            style={theme.background2}
          >
            <div className="flex h-[64px] w-full items-center justify-between gap-x-5 border-b border-border px-4 py-[19px]">
              <h4 className="text-nowrap font-geistSemiBold text-[18px] text-fontColorPrimary">
                Wallet
              </h4>

              <div className="flex items-center gap-x-2">
                <Link
                  href="/wallets"
                  prefetch
                  className="group flex h-[36px] w-full items-center gap-x-2 rounded-[8px] bg-secondary px-4 py-3 transition-all duration-300 ease-out hover:bg-white/10"
                >
                  <div className="relative aspect-square h-4 w-4 flex-shrink-0">
                    <Image
                      src="/icons/profile/wallet.png"
                      alt="Wallet Icon"
                      fill
                      quality={100}
                      className="object-contain duration-300 group-hover:scale-125"
                    />
                  </div>
                  <span className="inline-block text-nowrap font-geistSemiBold text-sm text-fontColorPrimary">
                    Wallet Manager
                  </span>
                </Link>

                <Separator
                  color="#2E2E47"
                  unit="fixed"
                  orientation="vertical"
                  fixedHeight={20}
                />
                <PopoverClose className="flex h-6 w-6 cursor-pointer items-center justify-center text-fontColorSecondary">
                  <div
                    className="relative aspect-square h-6 w-6 flex-shrink-0"
                    aria-label="Close"
                  >
                    <Image
                      src="/icons/close.png"
                      alt="Close Icon"
                      fill
                      quality={100}
                      className="object-contain"
                    />
                  </div>
                </PopoverClose>
              </div>
            </div>

            <OverlayScrollbarsComponent
              defer
              element="div"
              className="invisible__overlayscrollbar relative h-[252px] w-full flex-grow overflow-y-scroll"
            >
              <div className="flex w-full flex-col gap-y-1 p-2">
                {/* All Wallets Option */}
                <div
                  className={cn(
                    "group flex h-11 w-full items-center justify-between rounded-[8px] bg-white/[4%] px-2.5 py-3",
                    "cursor-pointer transition-all duration-300 ease-out hover:bg-primary/[8%]",
                    isAllWalletsSelected
                      ? "border border-primary bg-primary/[8%]"
                      : "",
                  )}
                  onClick={handleAllWalletsSelect}
                >
                  <div className="flex items-center gap-x-1">
                    <div className="relative hidden aspect-square h-4 w-4 flex-shrink-0 2xl:block">
                      <Image
                        src="/icons/solana-sq.svg"
                        alt="Solana SQ Icon"
                        fill
                        quality={100}
                        className="object-contain"
                      />
                    </div>

                    <div className="flex flex-col items-start">
                      <span className="inline-block space-x-2 text-nowrap font-geistSemiBold text-sm text-fontColorPrimary">
                        <span>
                          {formatAmountWithoutLeadingZero(totalBalance, 6)}
                          {Boolean(totalBalance) && (
                            <>
                              {" | "}
                              <span>
                                {formatAmountDollar(
                                  totalBalance * globalSolPrice,
                                )}
                              </span>
                            </>
                          )}
                        </span>
                        <span className="font-geistRegular text-sm text-fontColorSecondary">
                          (All Wallets)
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Individual Wallets */}
                {(optimisticWallets || [])?.map((wallet, index) => {
                  const isActive =
                    wallet?.address === activeWallet?.address &&
                    !isAllWalletsSelected;

                  return (
                    <div
                      key={`wallet-${index}_${wallet?.name}-${wallet?.address}`}
                      className={cn(
                        "group flex h-11 w-full items-center justify-between rounded-[8px] bg-white/[4%] px-2.5 py-3",
                        "transition-all duration-300 ease-out hover:bg-primary/[8%]",
                        isActive ? "border border-primary bg-primary/[8%]" : "",
                        isPending && "opacity-50",
                      )}
                    >
                      <button
                        onClick={() => handleWalletSelect(wallet)}
                        disabled={isPending}
                        className="w-full flex-grow"
                      >
                        <div className="flex items-center gap-x-1">
                          <div className="relative hidden aspect-square h-4 w-4 flex-shrink-0 2xl:block">
                            <Image
                              src="/icons/solana-sq.svg"
                              alt="Solana SQ Icon"
                              fill
                              quality={100}
                              className="object-contain"
                            />
                          </div>

                          <div className="flex flex-col items-start">
                            <span className="inline-block space-x-2 text-nowrap font-geistSemiBold text-sm text-fontColorPrimary">
                              <span>
                                {formatAmountWithoutLeadingZero(
                                  Number(wallet?.balance),
                                  6,
                                )}

                                {Boolean(Number(wallet?.balance)) && (
                                  <>
                                    {" | "}
                                    <span>
                                      {formatAmountDollar(
                                        Number(wallet?.balance) *
                                          globalSolPrice,
                                      )}
                                    </span>
                                  </>
                                )}
                              </span>
                              <span className="font-geistRegular text-sm text-fontColorSecondary">
                                (
                                {wallet && wallet.name.length > 30
                                  ? truncateAddress(wallet.name)
                                  : wallet?.name}
                                )
                              </span>
                            </span>
                          </div>
                        </div>
                      </button>

                      <div className="flex items-center gap-x-1">
                        <DepositPopoverModal
                          currentWallet={wallet}
                          customTriggerComponent={customTriggerComponent}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </OverlayScrollbarsComponent>
          </PopoverContent>
        </Popover>
      ) : (
        <Drawer open={openDrawer} onOpenChange={setOpenDrawer}>
          <DrawerTrigger asChild>
            {variant === "default" ? (
              <BaseButton
                onClick={() => setOpenDrawer((prev) => !prev)}
                variant="gray"
                className={cn(
                  "flex h-8 gap-x-1 pl-2.5 pr-1.5 xl:hidden",
                  detailCopied &&
                    "max-md:max-w-[125px] max-[375px]:max-w-[90px]",
                )}
                prefixIcon={
                  <div className="relative aspect-square h-5 w-5 flex-shrink-0">
                    <Image
                      src="/icons/solana-sq.svg"
                      alt="Solana SQ Icon"
                      fill
                      quality={100}
                      className="object-contain"
                    />
                  </div>
                }
                suffixIcon={
                  <div className="relative aspect-square h-6 w-6">
                    <Image
                      src="/icons/white-dropdown-arrow.png"
                      alt="White Dropdown Arrow Icon"
                      fill
                      unoptimized
                      quality={100}
                      className={cn(
                        "object-contain duration-300",
                        openDrawer ? "rotate-180" : "rotate-0",
                      )}
                    />
                  </div>
                }
              >
                <div className="flex items-center max-md:max-w-[70%]">
                  <span className="line-clamp-1 block truncate text-nowrap font-geistSemiBold text-sm text-fontColorPrimary">
                    {formatBalance(Number(displayWallet?.balance) || 0)}
                  </span>
                </div>
              </BaseButton>
            ) : (
              <BaseButton
                onClick={() => setOpenDrawer((prev) => !prev)}
                variant="gray"
                className={cn(
                  "flex h-[54px] w-full flex-grow justify-between gap-x-2 pl-2.5 pr-1.5",
                )}
                prefixIcon={
                  <div className="relative aspect-square size-6 flex-shrink-0">
                    <Image
                      src="/icons/solana-sq.svg"
                      alt="Solana SQ Icon"
                      fill
                      quality={100}
                      className="object-contain"
                    />
                  </div>
                }
                suffixIcon={
                  <div className="relative aspect-square size-6">
                    <Image
                      src="/icons/white-dropdown-arrow.png"
                      alt="White Dropdown Arrow Icon"
                      fill
                      unoptimized
                      quality={100}
                      className={cn(
                        "object-contain duration-300",
                        openDrawer ? "rotate-180" : "rotate-0",
                      )}
                    />
                  </div>
                }
              >
                <div className="flex w-full flex-col items-start">
                  <span className="font-geistLight text-xs text-fontColorSecondary">
                    Wallet Balance
                  </span>
                  <span className="line-clamp-1 block truncate text-nowrap font-geistSemiBold text-sm text-fontColorPrimary">
                    {formatBalance(Number(displayWallet?.balance) || 0)}
                  </span>
                </div>
              </BaseButton>
            )}
          </DrawerTrigger>
          <DrawerContent className="block rounded-t-[8px] bg-card xl:hidden">
            <DrawerHeader className="flex h-[56px] flex-row items-center justify-between border-b border-border p-4">
              <DrawerTitle>Select wallet</DrawerTitle>
              <button
                title="Close"
                onClick={() => setOpenDrawer((prev) => !prev)}
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
            <OverlayScrollbarsComponent
              defer
              element="div"
              className="invisible__overlayscrollbar relative h-auto w-full flex-grow overflow-y-scroll"
            >
              <div className="flex w-full flex-col gap-y-2 p-4">
                <Link
                  href="/wallets"
                  prefetch
                  className="group flex h-[40px] w-full items-center gap-x-2 rounded-[8px] bg-white/[4%] px-4 py-3 transition-all duration-300 ease-out hover:bg-white/10"
                >
                  <div className="relative aspect-square h-4 w-4 flex-shrink-0">
                    <Image
                      src="/icons/profile/wallet.png"
                      alt="Wallet Icon"
                      fill
                      quality={100}
                      className="object-contain duration-300 group-hover:scale-125"
                    />
                  </div>
                  <span className="inline-block text-nowrap font-geistSemiBold text-sm text-fontColorPrimary">
                    Wallet Manager
                  </span>
                </Link>

                {/* All Wallets Option - Mobile */}
                <div
                  className={cn(
                    "group flex h-[56px] w-full items-center justify-between rounded-[8px] bg-white/[4%] px-4 py-3",
                    "cursor-pointer transition-all duration-300 ease-out hover:bg-white/[8%]",
                    isAllWalletsSelected
                      ? "border border-primary bg-primary/[8%]"
                      : "",
                  )}
                  onClick={handleAllWalletsSelect}
                >
                  <div className="flex items-center gap-x-2">
                    <div className="relative aspect-square h-6 w-6 flex-shrink-0">
                      <Image
                        src="/icons/solana-sq.svg"
                        alt="Solana SQ Icon"
                        fill
                        quality={100}
                        className="object-contain"
                      />
                    </div>

                    <div className="-mb-0.5 flex flex-col items-center">
                      <span className="inline-block text-nowrap text-base text-fontColorPrimary">
                        <span className="font-geistSemiBold">
                          {formatAmountWithoutLeadingZero(totalBalance, 6)}
                          {Boolean(totalBalance) && (
                            <>
                              {" | "}
                              <span>
                                {formatAmountDollar(
                                  totalBalance * globalSolPrice,
                                )}
                              </span>
                            </>
                          )}
                        </span>
                        <span className="ml-2 text-fontColorSecondary">
                          All Wallets
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Individual Wallets - Mobile */}
                {(optimisticWallets || [])?.map((wallet, index) => {
                  const isActive =
                    wallet?.address === activeWallet?.address &&
                    !isAllWalletsSelected;

                  return (
                    <div
                      key={`wallet-${index}_${wallet?.name}-${wallet?.address}`}
                      className={cn(
                        "group flex h-[56px] w-full items-center justify-between rounded-[8px] bg-white/[4%] px-4 py-3",
                        "transition-all duration-300 ease-out hover:bg-white/[8%]",
                        isActive ? "border border-primary bg-primary/[8%]" : "",
                        isPending && "opacity-50",
                      )}
                    >
                      <button
                        key={`wallet-${index}_${wallet?.name}-${wallet?.address}`}
                        onClick={() => handleWalletSelect(wallet)}
                        disabled={isPending}
                      >
                        <div className="flex items-center gap-x-2">
                          <div className="relative aspect-square h-6 w-6 flex-shrink-0">
                            <Image
                              src="/icons/solana-sq.svg"
                              alt="Solana SQ Icon"
                              fill
                              quality={100}
                              className="object-contain"
                            />
                          </div>

                          <div className="-mb-0.5 flex flex-col items-center">
                            <span className="inline-block text-nowrap text-base text-fontColorPrimary">
                              <span className="font-geistSemiBold">
                                {formatAmountWithoutLeadingZero(
                                  Number(wallet?.balance),
                                  6,
                                )}
                                {Boolean(Number(wallet?.balance)) && (
                                  <>
                                    {" | "}
                                    <span>
                                      {formatAmountDollar(
                                        Number(wallet?.balance) *
                                          globalSolPrice,
                                      )}
                                    </span>
                                  </>
                                )}
                              </span>
                              <span className="ml-2 text-fontColorSecondary">
                                {wallet?.name}
                              </span>
                            </span>
                          </div>
                        </div>
                      </button>

                      <DepositPopoverModal currentWallet={wallet} />
                    </div>
                  );
                })}
              </div>
            </OverlayScrollbarsComponent>
          </DrawerContent>
        </Drawer>
      )}
    </>
  );
}
