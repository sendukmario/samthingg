"use client";
import Image from "next/image";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import BaseButton from "./buttons/BaseButton";
import { memo, useState } from "react";
import { Label } from "../ui/label";
import { importWallets } from "@/apis/rest/wallet-manager";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "../ui/drawer";
import { Textarea } from "../ui/textarea";
import { cn } from "@/libraries/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { truncateString } from "@/utils/truncateString";
import { useCustomizeTheme } from "@/hooks/use-customize-theme";
import { useCustomToast } from "@/hooks/use-custom-toast";

const MassImportWallet = ({ isMobile }: { isMobile?: boolean }) => {
  const theme = useCustomizeTheme();
  const [isOpen, setIsOpen] = useState(false);
  if (isMobile) {
    return (
      <Drawer onOpenChange={setIsOpen} open={isOpen}>
        <DrawerTrigger asChild>
          <BaseButton variant="gray" className="size-10 xl:hidden">
            <div className="relative aspect-square size-[20px] flex-shrink-0">
              <Image
                src="/icons/mass-import-wallet.svg"
                alt="Import Icon"
                fill
                quality={100}
                className="object-contain"
              />
            </div>
          </BaseButton>
        </DrawerTrigger>
        <DrawerContent
          className="flex h-auto w-full flex-col gap-y-0 bg-card xl:hidden xl:max-w-[480px]"
          style={theme.background2}
        >
          <DrawerHeader className="flex h-[56px] flex-row items-center justify-between border-b border-border p-4">
            <DrawerTitle className="text-lg">Mass Import</DrawerTitle>
            <DrawerClose asChild>
              <button className="flex h-6 w-6 cursor-pointer items-center justify-center bg-transparent text-transparent">
                <div
                  className="relative aspect-square h-6 w-6 flex-shrink-0"
                  aria-label="Close"
                  title="Close"
                >
                  <Image
                    src="/icons/close.png"
                    alt="Close Icon"
                    fill
                    quality={100}
                    className="object-contain"
                  />
                </div>
              </button>
            </DrawerClose>
          </DrawerHeader>
          <MassImportWalletContent
            isHeader={false}
            onClose={() => setIsOpen(false)}
          />
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Popover onOpenChange={setIsOpen} open={isOpen}>
      <PopoverTrigger asChild>
        <BaseButton
          variant="gray"
          prefixIcon={
            <div className="relative aspect-square size-[20px] flex-shrink-0">
              <Image
                src="/icons/mass-import-wallet.svg"
                alt="Import Icon"
                fill
                quality={100}
                className="object-contain"
              />
            </div>
          }
          size="long"
          className="relative h-[40px]"
        >
          <h2 className="whitespace-nowrap">Mass Import</h2>
        </BaseButton>
      </PopoverTrigger>

      <PopoverContent
        sideOffset={5}
        align="start"
        className="gb__white__popover z-50 w-[400px] bg-background px-0 pb-0 pt-[14px] shadow-[0_10px_20px_0_rgba(0,0,0,1)]"
        style={theme.background2}
      >
        <MassImportWalletContent onClose={() => setIsOpen(false)} />
      </PopoverContent>
    </Popover>
  );
};

export const MassImportWalletContent = ({
  onClose,
  isHeader = true,
}: {
  onClose?: () => void;
  isHeader?: boolean;
}) => {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { success, error: errorToast } = useCustomToast();

  // Update mutation to only send private key
  const queryClient = useQueryClient();
  const importWalletMutation = useMutation({
    mutationFn: (props: { key: string; name: string }[]) => {
      return importWallets(props);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
      queryClient.refetchQueries({
        queryKey: ["wallets-balance"],
      });
      // toast.custom((t: any) => (
      //   <CustomToast
      //     tVisibleState={t.visible}
      //     message="Wallet imported successfully"
      //     state="SUCCESS"
      //   />
      // ));
      success("Wallet imported successfully");
      onClose!();
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

  const handleImportWallet = async () => {
    try {
      setIsLoading(true);

      const processedInput = input.trim();
      if (!processedInput) return;

      // const arr = processedInput
      //   .split(",")
      //   ?.map((item) => item.trim())
      //   .filter(Boolean); // remove empty entries

      // Split by enter key and clean each entry
      const arr = processedInput
        ?.split("\n")
        ?.map((item) => item.trim())
        ?.filter(Boolean);

      // Remove duplicates
      const uniqueWallets = Array.from(new Set(arr));
      const newWallets = [];

      for (const item of uniqueWallets) {
        const [walletName, privateKey] = item
          ?.split(":")
          ?.map((part) => part.trim());

        if (!walletName || !privateKey) {
          // toast.custom((t: any) => (
          //   <CustomToast
          //     tVisibleState={t.visible}
          //     state="ERROR"
          //     message={`Invalid format for wallet entry: "${truncateString(item, 15)}". Use WalletName:PrivateKey.`}
          //   />
          // ));
          errorToast(
            `Invalid format for wallet entry: "${truncateString(item, 15)}". Use WalletName:PrivateKey.`,
          );
          return;
        }

        // Optional: validate private key format (if needed)
        // if (!/^0x[a-fA-F0-9]{64}$/.test(privateKey)) {
        //   continue;
        // }

        newWallets.push({ key: privateKey, name: walletName });
        // importWalletMutation.mutate({ key: privateKey, name: walletName });
      }

      if (newWallets.length === 0) {
        // toast.custom((t: any) => (
        //   <CustomToast
        //     tVisibleState={t.visible}
        //     state="ERROR"
        //     message="No valid wallet entries found. try again with valid format."
        //   />
        // ));
        errorToast(
          "No valid wallet entries found. try again with valid format.",
        );
      }

      importWalletMutation.mutate(newWallets);
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
    <div>
      {isHeader && (
        <div className="hidden items-center justify-between border-b border-border px-4 pb-[14px] xl:flex">
          <h2 className="whitespace-nowrap text-nowrap font-geistMedium text-lg text-white xl:text-[18px]">
            Mass Import
          </h2>

          <button
            title="Close"
            onClick={onClose}
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
        </div>
      )}

      <div className="flex w-full flex-col">
        <div className="flex w-full flex-col gap-y-3 p-4">
          <Label htmlFor="wallet-name" className="text-fontColorSecondary">
            Wallet Name
          </Label>
          <Textarea
            id="wallet-name"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter wallets in this format: WalletName:PrivateKey, separated by New Line (Enter Key). Only .txt file are accepted."
            className={cn(
              "min-h-[128px] border border-border font-mono text-fontColorPrimary placeholder:text-foreground focus:outline-none",
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
              className="h-[40px] w-full"
            >
              <span className="inline-block whitespace-nowrap font-geistMedium text-base">
                Import from file
              </span>
            </BaseButton>
          </div>
          <BaseButton
            variant="primary"
            className="h-[40px] w-full"
            onClick={handleImportWallet}
            disabled={isLoading}
          >
            <span className="inline-block whitespace-nowrap font-geistMedium text-base">
              {isLoading ? "Submitting..." : "Submit"}
            </span>
          </BaseButton>
        </div>
      </div>
    </div>
  );
};

export default memo(MassImportWallet);
