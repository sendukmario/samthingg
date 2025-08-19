"use client";

// ######## Libraries 📦 & Hooks 🪝 ########.
import React, { useState, useMemo } from "react";
import { useQuickAmountStore } from "@/stores/dex-setting/use-quick-amount.store";
import { useDebouncedQuickBuy } from "@/hooks/use-debounced-quickbuy";
// ######## Components 🧩 ########
import Image from "next/image";
import BaseButton from "@/components/customs/buttons/BaseButton";
import WalletTrackerTable from "@/components/customs/tables/footer/WalletTrackerTable";
import QuickAmountInput from "@/components/customs/QuickAmountInput";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { PopoverClose } from "@radix-ui/react-popover";
import { PopupWindow } from "@/components/customs/PopupWindow";
import WalletManagerFooterForm from "@/components/customs/forms/footer/WalletManagerFooterForm";
// ######## Utils & Helpers 🤝 ########
import { cn } from "@/libraries/utils";
import WalletTrackerFilter from "@/components/customs/WalletTrackerFilter";
import { usePopupStore, WindowName } from "@/stores/use-popup-state.store";
import { useWalletTrackerPaused } from "@/stores/footer/use-wallet-tracker-paused.store";
import WalletCustomizeColorPopover from "./forms/footer/WalletCustomizeColorForm";
import { useCustomizeTheme } from "@/hooks/use-customize-theme";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const ADD_WALLET_CONTENT_CONTAINER_BASE_CLASS =
  "border-2 border-border p-0 shadow-[0_0_20px_0_#000000] max-w-[95vw] sm:w-[518px] flex flex-col h-[496px] md:h-[480px] z-[1000]";

type HeaderProps = {
  popUpResponsive: boolean;
  width: number;
  onQuickBuyToggle: () => void;
};

type QuickBuyToggleProps = {
  buttonVariant?: "plain" | "default";
  onClick: () => void;
};

const WalletTrackerPopup = React.memo(function WalletTrackerPopup() {
  const [isShowQuickBuy, setIsShowQuickBuy] = useState<boolean>(false);

  const memoizedWalletTrackerTable = useMemo(
    () => <WalletTrackerTable variant="pop-out" />,
    [],
  );

  const { popups } = usePopupStore();
  const windowName: WindowName = "wallet_tracker";
  const walletTracker = (popups || []).find(
    (value) => value.name === windowName,
  )!;
  const { size, mode } = walletTracker;
  const popUpResponsive = size.width < 600 && mode !== "footer";
  const popupState = (popups || [])?.find(
    (item) => item.name === "wallet_tracker",
  );
  const isWalletTrackerPaused = useWalletTrackerPaused(
    (state) => state.isWalletTrackerHovered,
  );

  const quickBuyToggle = () => setIsShowQuickBuy((prev) => !prev);

  return (
    <PopupWindow
      title="Wallet Tracker"
      windowName="wallet_tracker"
      isPaused={isWalletTrackerPaused}
      minWidth={380}
      maxWidth={0.6}
      maxSnapWidth={0.4}
      headerRightContent={
        <Header
          popUpResponsive={popUpResponsive}
          width={size.width}
          onQuickBuyToggle={quickBuyToggle}
        />
      }
    >
      {popUpResponsive && isShowQuickBuy && (
        <div className="border-b border-border p-2">
          <QuickAmountInput withResetButton />
        </div>
      )}

      <div
        className={cn(
          "flex h-full w-full flex-col space-y-2 overflow-hidden",
          popupState?.isOpen &&
            popupState.snappedSide === "none" &&
            popUpResponsive &&
            "h-full",
        )}
      >
        <div className="relative min-h-0 flex-1 overflow-hidden">
          <div className="absolute inset-0 overflow-auto">
            {memoizedWalletTrackerTable}
          </div>
        </div>
      </div>
    </PopupWindow>
  );
});

WalletTrackerPopup.displayName = "WalletTrackerPopup";

const Header = ({ popUpResponsive, width, onQuickBuyToggle }: HeaderProps) => {
  const theme = useCustomizeTheme();
  const [openEditPopover, setOpenEditPopover] = useState<boolean>(false);

  const [_, setOpenEditDialog] = useState<boolean>(false);
  const handleCloseEditForm = () => {
    setOpenEditPopover(false);
    setOpenEditDialog(false);
  };

  const buttonVariant: "plain" | "default" = useMemo(() => {
    if (width < 500) {
      return "plain";
    }

    return "default";
  }, [width]);

  return (
    <div className="flex w-full items-center gap-2 overflow-hidden p-2">
      <div className="flex-shrink-0">
        {!popUpResponsive && <QuickAmountInput width="160px" />}

        {popUpResponsive && (
          <QuickBuyToggle
            buttonVariant={buttonVariant}
            onClick={onQuickBuyToggle}
          />
        )}
      </div>

      <div className="flex-shrink-0">
        <WalletTrackerFilter
          buttonVariant={buttonVariant}
          filterButtonProps={{ size: "icon" }}
        />
      </div>

      <div className="flex-shrink-0">
        <Popover open={openEditPopover} onOpenChange={setOpenEditPopover}>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <div className="cursor-pointer">
                    {buttonVariant === "plain" ? (
                      <div className="relative z-30 aspect-square h-6 w-6 flex-shrink-0 text-fontColorSecondary duration-300 hover:opacity-70">
                        <Image
                          src="/icons/footer/wallet-manager-plain.svg"
                          alt="Wallet Manager Icon"
                          fill
                          quality={100}
                          className="object-contain"
                        />
                      </div>
                    ) : (
                      <BaseButton variant="gray" className="h-[32px]">
                        <div className="relative z-30 aspect-square h-4 w-4 flex-shrink-0 text-fontColorSecondary">
                          <Image
                            src="/icons/footer/wallet-manager.png"
                            alt="Wallet Manager Icon"
                            fill
                            quality={100}
                            className="object-contain"
                          />
                        </div>
                      </BaseButton>
                    )}
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
      </div>

      <div className="flex-shrink-0">
        <WalletCustomizeColorPopover buttonVariant={buttonVariant} />
      </div>
    </div>
  );
};

const QuickBuyToggle = ({ buttonVariant, onClick }: QuickBuyToggleProps) => {
  if (buttonVariant === "plain") {
    return (
      <div
        className="relative z-30 aspect-square h-5 w-5 cursor-pointer hover:opacity-70"
        onClick={onClick}
      >
        <Image
          src="/icons/pink-quickbuy.png"
          alt="Quick Buy Icon"
          fill
          quality={100}
          className="object-contain"
        />
      </div>
    );
  }

  if (buttonVariant === "default") {
    return (
      <BaseButton variant="gray" className="h-[32px]" onClick={onClick}>
        <div className="relative z-30 aspect-square h-4 w-4">
          <Image
            src="/icons/pink-quickbuy.png"
            alt="Quick Buy Icon"
            fill
            quality={100}
            className="object-contain"
          />
        </div>
      </BaseButton>
    );
  }

  return <></>;
};

export default WalletTrackerPopup;
