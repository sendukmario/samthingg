import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import BaseButton from "@/components/customs/buttons/BaseButton";
import CustomToast from "@/components/customs/toasts/CustomToast";
import toast from "react-hot-toast";
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
import {
  searchTwitterAccounts,
  TwitterAccount,
} from "@/apis/rest/twitter-monitor";
import { TwitterUser } from "@/types/twitter";
import { useCustomizeTheme } from "@/hooks/use-customize-theme";
import { useCustomToast } from "@/hooks/use-custom-toast";

type TwitterImportProps = {
  onSubmit: (accounts: TwitterAccount[]) => void;
};

interface ContentProps extends TwitterImportProps {
  onClose: () => void;
}

const Content = ({ onClose, onSubmit }: ContentProps) => {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { error: errorToast } = useCustomToast();

  const handleImport = async () => {
    try {
      setIsLoading(true);

      const processedInput = input.trim();
      if (!processedInput) return;

      // unique twitter and remove empty lines
      const arr = processedInput
        .split("\n")
        ?.map((item) => item.trim().replace(/@/g, ""));
      const uniqueTwitterAccounts = Array.from(new Set(arr))?.filter(
        (item) => item,
      );

      // search for each twitter account
      const validTwitterAccounts: TwitterUser[] = [];
      for (const item of uniqueTwitterAccounts) {
        try {
          validTwitterAccounts.push(await searchTwitterAccounts(item));
        } catch {
          // toast.custom((t: any) => (
          //   <CustomToast
          //     tVisibleState={t.visible}
          //     state="ERROR"
          //     message={`Failed to search twitter account @${item}`}
          //   />
          // ));
          errorToast(`Failed to search twitter account @${item}`)
          return;
        }
      }

      // validate
      if (validTwitterAccounts.length === 0) return;

      onSubmit(
        validTwitterAccounts?.map((account) => ({
          name: account.name,
          username: account.screen_name,
          profilePicture: account.profile_image_url_https,
          type: "regular",
        })),
      );
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text === "string") {
        setInput(text);
      }
    };
    reader.readAsText(file);
  };

  return (
    <>
      <div className="flex w-full items-center justify-start border-b border-border p-4">
        <h4 className="text-nowrap font-geistMedium text-lg text-white xl:text-[18px]">
          Mass Import Twitter Accounts
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
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Put your accounts here..."
            className={cn(
              "min-h-[128px] border border-border font-mono placeholder:text-foreground focus:outline-none",
              input.length > 0 ? "font-geistMonoRegular" : "font-geistRegular",
            )}
          />
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
            disabled={isLoading}
          >
            <span className="inline-block whitespace-nowrap font-geistMedium text-sm">
              {isLoading ? "Submitting..." : "Submit"}
            </span>
          </BaseButton>
        </div>
      </div>
    </>
  );
};

export const TwitterImport = ({ onSubmit }: TwitterImportProps) => {
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
                    <div className="relative z-[9999] aspect-square h-5 w-5 flex-shrink-0">
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
                <TooltipContent className="z-[9999]">
                  <p>Mass Import Twitter Account</p>
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
          <Content onClose={handleClose} onSubmit={onSubmit} />
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
                  <div className="relative aspect-square h-5 w-5 flex-shrink-0">
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
              <TooltipContent className="z-[9999]">
                <p>Mass Import Twitter Account</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="gb__white__popover z-[9999] w-[320px] border-border bg-card p-0 text-white"
        style={theme.background2}
      >
        <Content onClose={handleClose} onSubmit={onSubmit} />
      </PopoverContent>
    </Popover>
  );
};
