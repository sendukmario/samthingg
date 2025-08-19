"use client";

// ######## Libraries 📦 & Hooks 🪝 ########
import { useState, useEffect, useRef, useMemo } from "react";
import { useWalletTrackerStore } from "@/stores/footer/use-wallet-tracker.store";
import { useQuickAmountStore } from "@/stores/dex-setting/use-quick-amount.store";
import { useFooterStore } from "@/stores/footer/use-footer.store";
import { useQuery } from "@tanstack/react-query";
import { usePopupStore } from "@/stores/use-popup-state.store";
import { useDebouncedQuickBuy } from "@/hooks/use-debounced-quickbuy";
// ######## APIs 🛜 ########
import { clearFooterSection } from "@/apis/rest/footer";
import { getTrackedWallets } from "@/apis/rest/wallet-tracker";
// ######## Components 🧩 ########
import Image from "next/image";
import Separator from "@/components/customs/Separator";
import { X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import BaseButton from "@/components/customs/buttons/BaseButton";
import { PopoverClose } from "@radix-ui/react-popover";
import WalletTrackerTable from "@/components/customs/tables/footer/WalletTrackerTable";
import WalletManagerFooterForm from "@/components/customs/forms/footer/WalletManagerFooterForm";
import PresetSelectionButtons from "@/components/customs/PresetSelectionButtons";
import QuickAmountInput from "@/components/customs/QuickAmountInput";
import AddTrackedWallet from "@/components/customs/AddTrackedWallet";
import WalletTrackerFilter from "@/components/customs/WalletTrackerFilter";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ImportWalletContent } from "@/components/customs/modals/contents/footer/WalletTrackerImport";
// ######## Utils & Helpers 🤝 ########
import { cn } from "@/libraries/utils";
import { Paused } from "@/components/customs/cards/partials/Paused";
import { useWalletTrackerPaused } from "@/stores/footer/use-wallet-tracker-paused.store";
import WalletCustomizeColorPopover from "@/components/customs/forms/footer/WalletCustomizeColorForm";
import { useCustomizeTheme } from "@/hooks/use-customize-theme";

// ######## Components 🧩 ########
// AddWallet Component
// const AddWalletTrigger = () => {
//   return (
//     <>
//       <BaseButton
//         variant="primary"
//         className="h-[32px] pl-2 pr-3"
//         prefixIcon={
//           <div className="relative aspect-square h-4 w-4 flex-shrink-0">
//             <Image
//               src="/icons/add.png"
//               alt="Add Icon"
//               fill
//               quality={100}
//               className="object-contain duration-300"
//             />
//           </div>
//         }
//       >
//         <span className="inline-block whitespace-nowrap font-geistSemiBold text-sm text-background">
//           Add Wallet
//         </span>
//       </BaseButton>
//     </>
//   );
// };
// ImportWallet Component
const ImportWalletTrigger = () => {
  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <BaseButton variant="gray" size="short" className="size-[32px]">
              <div className="relative z-30 aspect-square h-4 w-4 flex-shrink-0">
                <Image
                  src="/icons/footer/import-wallet.png"
                  alt="Import Wallet Icon"
                  fill
                  quality={100}
                  className="object-contain"
                />
              </div>
            </BaseButton>
          </TooltipTrigger>
          <TooltipContent>
            <p>Import Wallet</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </>
  );
};

const ADD_WALLET_CONTENT_CONTAINER_BASE_CLASS =
  "border-2 border-border bg-card p-0 shadow-[0_0_20px_0_#000000] max-w-[95vw] sm:w-[518px] flex flex-col h-[496px] md:h-[480px] z-[1000]";
// const ADD_WALLET_CONTENT_CONTAINER_BASE_CLASS_2 =
//   "border-2 border-border bg-card p-0 shadow-[0_0_20px_0_#000000] max-w-[95vw] sm:w-[518px] flex flex-col h-auto z-[1000]";
const IMPORT_WALLET_CONTENT_CONTAINER_BASE_CLASS =
  "border-2 border-border bg-card p-0 shadow-[0_0_20px_0_#000000] max-w-[95vw] sm:w-[320px] z-[1000]";

// ######## Main Component 🚀 ########
export default function WalletTrackerModalContent({
  toggleModal,
  variant = "pop-out",
}: {
  toggleModal?: () => void;
  variant?: "pop-out" | "cupsey-snap";
}) {
  const [openImportWalletPopover, setOpenImportWalletPopover] =
    useState<boolean>(false);
  const [openImportWalletDialog, setOpenImportWalletDialog] =
    useState<boolean>(false);
  const handleCloseImportWalletForm = () => {
    setOpenImportWalletPopover(false);
    setOpenImportWalletDialog(false);
  };
  const [openEditPopover, setOpenEditPopover] = useState<boolean>(false);
  const [openEditDialog, setOpenEditDialog] = useState<boolean>(false);
  const handleCloseEditForm = () => {
    setOpenEditPopover(false);
    setOpenEditDialog(false);
  };

  const cosmoQuickBuyAmount = useQuickAmountStore(
    (state) => state.cosmoQuickBuyAmount,
  );
  const setCosmoQuickBuyAmount = useQuickAmountStore(
    (state) => state.setCosmoQuickBuyAmount,
  );

  const setTrackedWallets = useWalletTrackerStore(
    (state) => state.setTrackedWallets,
  );
  const quickBuyAmountInputRef = useRef<HTMLInputElement>(null);
  const setFooterMessage = useFooterStore((state) => state.setMessage);

  useEffect(() => {
    if (quickBuyAmountInputRef.current) {
      quickBuyAmountInputRef.current.style.width = `${Math.min(cosmoQuickBuyAmount.toString().length + 1, 0.5)}ch`;
    }
  }, [cosmoQuickBuyAmount]);

  const { data, isPending } = useQuery({
    queryKey: ["tracked-wallets"],
    queryFn: async () => {
      const footer = await clearFooterSection("walletTracker");
      setFooterMessage(footer);
      const res = await getTrackedWallets();
      return res;
    },
  });

  useEffect(() => {
    if (!isPending && data) {
      // console.log("👋 WT - UPDATED!", data);
      setTrackedWallets(data || []);
    }
  }, [isPending, data]);

  const memoizedWalletTrackerTable = useMemo(
    () => <WalletTrackerTable variant={variant} />,
    [variant],
  );

  const { popups, setPopupState, togglePopup } = usePopupStore();
  const walletTrackerPopup = (popups || [])?.find(
    (p) => p.name === "wallet_tracker",
  );
  const isWalletTrackerHovered = useWalletTrackerPaused(
    (state) => state.isWalletTrackerHovered,
  );
  const theme = useCustomizeTheme();
  if (!walletTrackerPopup) return null;

  return (
    <>
      <div
        className={cn(
          "relative flex w-full flex-col items-center justify-between max-md:gap-3 md:h-[65px]",
          variant === "cupsey-snap" && "overflow-hidden md:h-fit",
        )}
      >
        <div
          className={cn(
            "flex w-full items-center gap-3 border-border p-4 pb-2 max-md:h-[56px] max-md:justify-between max-md:border-b md:border-0",
            variant === "cupsey-snap" && "flex-col gap-2 px-3 pb-0 pt-2",
          )}
        >
          <div className="flex w-full items-center justify-between max-md:px-0">
            <div
              className={cn(
                "flex w-[300px] items-center gap-2",
                variant === "cupsey-snap" && "gap-x-0.5",
              )}
            >
              <h4
                className={cn(
                  "text-nowrap font-geistSemiBold text-[18px] text-fontColorPrimary",
                  variant === "cupsey-snap" && "md:text-[14px]",
                )}
              >
                Wallet Tracker
              </h4>

              {isWalletTrackerHovered && (
                <>
                  <Separator
                    color="#202037"
                    orientation="vertical"
                    unit="fixed"
                    className="max-md:hidden"
                    fixedHeight={18}
                  />
                  <Paused hideText={variant === "cupsey-snap"} />
                </>
              )}
            </div>

            {variant === "pop-out" ? (
              <div className="hidden gap-2 md:flex md:items-center md:justify-between">
                <div className="flex w-full gap-3">
                  <div className="flex items-center gap-x-2">
                    <QuickAmountInput
                    // value={cosmoQuickBuyAmount}
                    // onChange={(val) => {
                    //   if (Number(val) >= 0.00001) {
                    //     setCosmoQuickBuyAmount(val);
                    //     debouncedUpdateQuickBuyAmount({
                    //       amount: val,
                    //       type: "cosmo",
                    //     });
                    //   }
                    // }}
                    />

                    <PresetSelectionButtons isWithSetting />

                    <WalletTrackerFilter
                      filterButtonProps={{
                        text: undefined,
                      }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2">
                  <div className="flex w-full items-center gap-x-2">
                    <Popover
                      open={openEditPopover}
                      onOpenChange={setOpenEditPopover}
                    >
                      <PopoverTrigger asChild>
                        <BaseButton variant="gray" className="h-[32px]">
                          <div className="relative z-30 aspect-square h-4 w-4 flex-shrink-0">
                            <Image
                              src="/icons/footer/wallet-manager.png"
                              alt="Wallet Manager Icon"
                              fill
                              quality={100}
                              className="object-contain"
                            />
                          </div>
                          {/* <span className="max-md:hidden">Wallet Manager</span> */}
                        </BaseButton>
                      </PopoverTrigger>
                      <PopoverContent
                        align="end"
                        sideOffset={6}
                        className={cn(ADD_WALLET_CONTENT_CONTAINER_BASE_CLASS)}
                        style={theme.background2}
                      >
                        <WalletManagerFooterForm
                          handleClose={handleCloseEditForm}
                          closeComponent={
                            <PopoverClose className="ml-auto hidden cursor-pointer text-fontColorSecondary md:inline-block">
                              <div className="relative aspect-square h-6 w-6 flex-shrink-0 duration-300 hover:opacity-70">
                                <Image
                                  src="/icons/close.png"
                                  alt="Close Icon"
                                  fill
                                  quality={100}
                                  className="object-contain"
                                />
                              </div>
                            </PopoverClose>
                          }
                        />
                      </PopoverContent>
                    </Popover>

                    <WalletCustomizeColorPopover />

                    <Separator
                      color="#202037"
                      orientation="vertical"
                      unit="fixed"
                      className="max-md:hidden"
                      fixedHeight={18}
                    />

                    {/* <BaseButton variant="gray" size="short" className="size-[32px]">
                <div className="relative z-30 aspect-square h-4 w-4 flex-shrink-0">
                  <Image
                    src="/icons/footer/sound-on.png"
                    alt="Sound On Icon"
                    fill
                    quality={100}
                    className="object-contain"
                  />
                </div>
              </BaseButton> */}

                    <Popover
                      open={openImportWalletPopover}
                      onOpenChange={setOpenImportWalletPopover}
                    >
                      <PopoverTrigger asChild>
                        <div>
                          <ImportWalletTrigger />
                        </div>
                      </PopoverTrigger>
                      <PopoverContent
                        align="end"
                        sideOffset={6}
                        className={cn(
                          IMPORT_WALLET_CONTENT_CONTAINER_BASE_CLASS,
                        )}
                        style={theme.background2}
                      >
                        <ImportWalletContent
                          onClose={() => handleCloseImportWalletForm()}
                        />
                      </PopoverContent>
                    </Popover>
                    <div className="w-full max-md:hidden">
                      <AddTrackedWallet type="footer" />
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setPopupState(walletTrackerPopup.name, (p) => ({
                        ...p,
                        mode: "popup" as const,
                      }));
                      document.body.style.overflow = "";
                    }}
                    className="relative hidden aspect-square h-5 w-5 xl:block"
                  >
                    <div className="relative z-30 aspect-square h-5 w-5 flex-shrink-0 duration-300 hover:opacity-70">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Image
                              src="/icons/lock.svg"
                              alt="Lock Icon"
                              fill
                              quality={100}
                              className="object-contain"
                            />
                          </TooltipTrigger>
                          <TooltipContent className="z-[1000]">
                            <p>Pop out</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </button>
                  <button
                    onClick={() => togglePopup(walletTrackerPopup.name)}
                    className="relative hidden aspect-square h-6 w-6 xl:block"
                  >
                    <div className="relative z-30 aspect-square h-6 w-6 flex-shrink-0 duration-300 hover:opacity-70">
                      <Image
                        src="/icons/close.png"
                        alt="Close Icon"
                        fill
                        quality={100}
                        className="object-contain"
                      />
                    </div>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex w-full items-center justify-end gap-x-1.5">
                <WalletTrackerFilter
                  buttonVariant="cupsey-snap"
                  filterButtonProps={{
                    text: undefined,
                  }}
                />

                <Popover
                  open={openEditPopover}
                  onOpenChange={setOpenEditPopover}
                >
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <PopoverTrigger asChild>
                          <div className="size-[32px]">
                            <BaseButton
                              variant="gray"
                              size="short"
                              className="size-[32px]"
                            >
                              <div className="relative z-30 aspect-square h-4 w-4 flex-shrink-0">
                                <Image
                                  src="/icons/footer/wallet-manager.png"
                                  alt="Wallet Manager Icon"
                                  fill
                                  quality={100}
                                  className="object-contain"
                                />
                              </div>
                            </BaseButton>
                          </div>
                        </PopoverTrigger>
                      </TooltipTrigger>
                      <TooltipContent className="z-[1000]">
                        <p>Wallet Manager</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <PopoverContent
                    align="end"
                    sideOffset={6}
                    className={cn(ADD_WALLET_CONTENT_CONTAINER_BASE_CLASS)}
                    style={theme.background2}
                  >
                    <WalletManagerFooterForm
                      handleClose={handleCloseEditForm}
                      closeComponent={
                        <PopoverClose className="ml-auto hidden cursor-pointer text-fontColorSecondary md:inline-block">
                          <div className="relative aspect-square h-6 w-6 flex-shrink-0 duration-300 hover:opacity-70">
                            <Image
                              src="/icons/close.png"
                              alt="Close Icon"
                              fill
                              quality={100}
                              className="object-contain"
                            />
                          </div>
                        </PopoverClose>
                      }
                    />
                  </PopoverContent>
                </Popover>

                <WalletCustomizeColorPopover />

                {/* <BaseButton variant="gray" size="short" className="size-[32px]">
                <div className="relative z-30 aspect-square h-4 w-4 flex-shrink-0">
                  <Image
                    src="/icons/footer/sound-on.png"
                    alt="Sound On Icon"
                    fill
                    quality={100}
                    className="object-contain"
                  />
                </div>
              </BaseButton> */}

                <Popover
                  open={openImportWalletPopover}
                  onOpenChange={setOpenImportWalletPopover}
                >
                  <PopoverTrigger asChild>
                    <div>
                      <ImportWalletTrigger />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent
                    align="end"
                    sideOffset={6}
                    className={cn(IMPORT_WALLET_CONTENT_CONTAINER_BASE_CLASS)}
                    style={theme.background2}
                  >
                    <ImportWalletContent
                      onClose={() => handleCloseImportWalletForm()}
                    />
                  </PopoverContent>
                </Popover>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="size-[32px]">
                        <AddTrackedWallet type="cupsey-snap" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="z-[1000]">
                      <p>Add Wallet</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}

            {/* X for mobile close modal */}
            <button
              title="Close"
              onClick={toggleModal}
              className={cn(
                "relative aspect-square h-6 w-6 flex-shrink-0 duration-300 hover:opacity-70 md:hidden",
              )}
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
          {variant === "cupsey-snap" && (
            <div className="flex w-full items-center gap-x-2">
              <QuickAmountInput />

              <PresetSelectionButtons isWithSetting />
            </div>
          )}
        </div>

        {variant === "pop-out" && (
          <div className="flex w-full items-center justify-between gap-2 px-4 pb-2 max-md:flex-wrap md:hidden">
            <div className="max-w-full flex-grow">
              <QuickAmountInput
                // value={cosmoQuickBuyAmount}
                // onChange={(val) => {
                //   if (Number(val) >= 0.00001) {
                //     setCosmoQuickBuyAmount(val);
                //     debouncedUpdateQuickBuyAmount({
                //       amount: val,
                //       type: "cosmo",
                //     });
                //   }
                // }}
                // className="min-w-full flex-grow"
                width={"150px"}
              />
            </div>

            <div className="flex items-center gap-x-1">
              <PresetSelectionButtons isWithSetting />
              <WalletTrackerFilter isMobile />
            </div>
          </div>
        )}
      </div>

      {/* Table Tabs */}
      <div
        className={cn(
          "!relative flex w-full flex-grow flex-col",
          variant === "cupsey-snap" && "h-full overflow-hidden",
        )}
      >
        <div className="relative grid w-full flex-grow grid-cols-1 h-full">
          {memoizedWalletTrackerTable}
        </div>
      </div>

      {/* Mobile Task Button */}
      <div className="flex w-full justify-center gap-x-2 border-t border-border bg-card p-3.5 mb-3.5 md:hidden">
        <Dialog
          open={openImportWalletDialog}
          onOpenChange={setOpenImportWalletDialog}
        >
          <DialogTrigger asChild>
            <div>
              <ImportWalletTrigger />
            </div>
          </DialogTrigger>
          <DialogContent
            className={cn(IMPORT_WALLET_CONTENT_CONTAINER_BASE_CLASS)}
          >
            <ImportWalletContent
              onClose={() => handleCloseImportWalletForm()}
            />
          </DialogContent>
        </Dialog>
        <div className="grid flex-grow grid-cols-2 gap-x-4">
          <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
            <DialogTrigger asChild className="relative z-[5] w-full">
              <BaseButton
                variant="gray"
                prefixIcon={
                  <div className="relative z-30 aspect-square h-4 w-4 flex-shrink-0">
                    <Image
                      src="/icons/footer/wallet-manager.png"
                      alt="Wallet Manager Icon"
                      fill
                      quality={100}
                      className="object-contain"
                    />
                  </div>
                }
                className="h-[32px] w-full"
              >
                <span className="whitespace-nowrap text-sm">
                  Wallet Manager
                </span>
              </BaseButton>
            </DialogTrigger>
            <DialogContent
              className={cn(
                ADD_WALLET_CONTENT_CONTAINER_BASE_CLASS + " max-md:gap-y-0",
              )}
            >
              <WalletManagerFooterForm
                handleClose={handleCloseEditForm}
                closeComponent={
                  <DialogClose className="ml-auto hidden cursor-pointer text-fontColorSecondary md:inline-block">
                    <div className="relative aspect-square h-6 w-6 flex-shrink-0 duration-300 hover:opacity-70">
                      <Image
                        src="/icons/close.png"
                        alt="Close Icon"
                        fill
                        quality={100}
                        className="object-contain"
                      />
                    </div>
                  </DialogClose>
                }
              />
            </DialogContent>
          </Dialog>

          <AddTrackedWallet type="footer" />
        </div>
      </div>
    </>
  );
}
