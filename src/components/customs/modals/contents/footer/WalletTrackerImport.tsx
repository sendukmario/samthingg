import { useState, forwardRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import BaseButton from "@/components/customs/buttons/BaseButton";
import Image from "next/image";
import { cn } from "@/libraries/utils";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { X } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useWindowSizeStore } from "@/stores/use-window-size.store";
import { useCustomizeTheme } from "@/hooks/use-customize-theme";
import { useCustomToast } from "@/hooks/use-custom-toast";
import { useWalletTracker } from "@/hooks/use-wallet-tracker";

// Content component that can be used in both Dialog and Popover
export const ImportWalletContent = ({ onClose }: { onClose: () => void }) => {
  const [jsonInput, setJsonInput] = useState("");
  const { updateWallet, isPending } = useWalletTracker();
  const { success, error: errorToast } = useCustomToast();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text === "string") {
        setJsonInput(text);
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    updateWallet(jsonInput, {
      onSuccess: (result) => {
        success(result);
        onClose();
      },
      onError: (error, classname) =>
        errorToast(error, { className: classname }),
    });
  };

  return (
    <>
      <div className="flex w-full items-center justify-start border-b border-border p-4">
        <h4 className="text-nowrap font-geistMedium text-lg text-white xl:text-[18px]">
          Import Wallet
        </h4>
        <button
          title="Close"
          onClick={onClose}
          className="ml-auto size-[24px] cursor-pointer text-fontColorSecondary hover:text-white"
        >
          <X size={24} />
        </button>
      </div>
      <div className="flex w-full flex-col">
        <div className="flex w-full flex-col gap-y-3 p-4">
          <Textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder="Put your exported wallets here..."
            className={cn(
              "min-h-[128px] border border-border font-mono placeholder:text-foreground focus:outline-none",
              jsonInput.length > 0
                ? "font-geistMonoRegular"
                : "font-geistRegular",
            )}
          />
          <div className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="Nova Logo"
              height={100}
              width={100}
              className="size-4 object-contain"
            />
            <span className="text-sm leading-[18px] text-fontColorSecondary">
              Nova supports wallet imports from:
            </span>
          </div>
          <ul className="list-none space-y-1 text-fontColorSecondary">
            <li className="flex items-center text-sm">
              <Image
                src="/icons/pink-check.png"
                alt="Check Icon"
                height={100}
                width={100}
                className="mr-1 size-5 object-contain"
              />
              BullX
            </li>
            <li className="flex items-center text-sm">
              <Image
                src="/icons/pink-check.png"
                alt="Check Icon"
                height={100}
                width={100}
                className="mr-1 size-5 object-contain"
              />
              Axiom
            </li>
          </ul>
        </div>
        <div className="flex w-full flex-col items-center justify-between gap-3 border-t border-border p-4">
          <div className="flex w-full items-center gap-2">
            <input
              type="file"
              accept=".txt"
              onChange={handleFileUpload}
              className="hidden"
              id="wallet-file-upload"
            />
            <BaseButton
              variant="gray"
              onClick={() =>
                document.getElementById("wallet-file-upload")?.click()
              }
              className="w-full"
            >
              <span className="inline-block whitespace-nowrap font-geistMedium text-sm">
                Import from file
              </span>
            </BaseButton>
          </div>
          <BaseButton
            variant="primary"
            className="h-[32px] w-full max-xl:h-10"
            onClick={handleImport}
            disabled={isPending}
          >
            <span className="inline-block whitespace-nowrap font-geistMedium text-sm">
              {isPending ? "Submitting..." : "Submit"}
            </span>
          </BaseButton>
        </div>
      </div>
    </>
  );
};

type CloseButtonProps = {
  onClick?: () => void;
  title?: string;
};

export const CloseButton = forwardRef<HTMLButtonElement, CloseButtonProps>(
  ({ onClick, title = "Close" }, ref) => (
    <button
      ref={ref}
      title={title}
      onClick={onClick}
      className="ml-auto size-[24px] cursor-pointer text-fontColorSecondary hover:text-white"
    >
      <X size={24} />
    </button>
  ),
);

CloseButton.displayName = "CloseButton";

// Main component that decides whether to use Dialog or Popover
export const WalletTrackerImport = () => {
  const theme = useCustomizeTheme();
  const width = useWindowSizeStore((state) => state.width);
  const [openPopover, setOpenPopover] = useState(false);
  const [openDrawer, setOpenDrawer] = useState(false);

  // Close handler to pass to the content component
  const handleClose = () => {
    setOpenPopover(false);
    setOpenDrawer(false);
  };

  // Use Drawer for smaller screens, Popover for larger screens
  if (width && width < 1280) {
    return (
      <Drawer open={openDrawer} onOpenChange={setOpenDrawer}>
        <DrawerTrigger asChild>
          <div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <BaseButton variant="gray" size="short" className="size-10">
                    <div className="relative z-30 aspect-square h-5 w-5 flex-shrink-0">
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
          </div>
        </DrawerTrigger>
        <DrawerContent
          className="gap-y-0 border-border bg-card p-0 text-white"
          style={theme.background2}
        >
          <DrawerTitle className="sr-only">Import Wallet Drawer</DrawerTitle>
          <ImportWalletContent onClose={handleClose} />
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Popover open={openPopover} onOpenChange={setOpenPopover}>
      <PopoverTrigger asChild>
        <div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <BaseButton variant="gray" size="short" className="size-10">
                  <div className="relative z-30 aspect-square h-5 w-5 flex-shrink-0">
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
        </div>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="gb__white__popover w-[320px] border-border bg-card p-0 text-white shadow-[0_10px_20px_0_rgba(0,0,0,1)]"
        style={theme.background2}
      >
        <ImportWalletContent onClose={handleClose} />
      </PopoverContent>
    </Popover>
  );
};

const getUniqueWalletName = (
  baseName: string,
  existingNames: string[],
): string => {
  let counter = 1;
  let newName = baseName;

  while (existingNames.includes(newName)) {
    newName = `${baseName}${counter}`;
    counter++;
  }

  return newName;
};
