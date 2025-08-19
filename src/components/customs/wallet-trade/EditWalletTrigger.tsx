import Image from "next/image";
import React from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import AddressWithEmojis from "../AddressWithEmojis";
import { cn } from "@/libraries/utils";
import { PopoverClose } from "@radix-ui/react-popover";
import SelectEmoji from "../SelectEmoji";
import { Input } from "@/components/ui/input";
import BaseButton from "../buttons/BaseButton";
import Copy from "../Copy";
import { useWindowSizeStore } from "@/stores/use-window-size.store";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { isValidSolanaAddress } from "@/utils/walletValidation";
import { z } from "zod";
import { useWalletTrackerMessageStore } from "@/stores/footer/use-wallet-tracker-message.store";
import {
  QueryClient,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  TrackedWallet,
  updateTrackedWallets,
} from "@/apis/rest/wallet-tracker";
import { useSelectedWalletTrackerTradeAddressesFilterStore } from "@/stores/footer/use-selected-wallet-tracker-trade-filter.store";
import toast from "react-hot-toast";
import CustomToast from "../toasts/CustomToast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { truncateAddress } from "@/utils/truncateAddress";
import { usePopupStore } from "@/stores/use-popup-state.store";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useWalletHighlightStore } from "@/stores/wallets/use-wallet-highlight-colors.store";
import { StarIcon } from "lucide-react";
import { clearFooterSection } from "@/apis/rest/footer";
import { useFooterStore } from "@/stores/footer/use-footer.store";
import WalletTradeSearchInput from "./WalletTradeSearchInput";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Picker from "emoji-picker-react";
import { EmojiStyle } from "emoji-picker-react";
import { hiddenEmoji } from "@/constants/hidden-emoji";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useCustomToast } from "@/hooks/use-custom-toast";

const walletFormSchema = z.object({
  name: z
    .string()
    .min(1, "Wallet name is required")
    .max(38, "Maximum characters of wallet name is 38"),
  address: z
    .string()
    .min(1, "Wallet address is required")
    .refine(isValidSolanaAddress, {
      message: "Please enter a valid Solana address",
    }),
  emoji: z.string().min(1, "Select an emoji"),
});

// Type for our form values
type WalletFormValues = z.infer<typeof walletFormSchema>;

interface EditWalletTriggerProps {
  isModalContent?: boolean;
  walletAddress: string;
}
export default function EditWalletTrigger({
  isModalContent = true,
  walletAddress,
}: EditWalletTriggerProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);
  const [isMobileEmojiOpen, setIsMobileEmojiOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const width = useWindowSizeStore((state) => state.width);
  const { success, error: errorToast } = useCustomToast();
  const remainingScreenWidth = usePopupStore(
    (state) => state.remainingScreenWidth,
  );
  const trackedWallets = useWalletTrackerMessageStore(
    (state) => state.trackedWallets,
  );

  const existingWallets = useWalletTrackerMessageStore(
    (state) => state.trackedWallets,
  );
  const currentSelectedAddresses =
    useSelectedWalletTrackerTradeAddressesFilterStore(
      (state) => state.selectedWalletAddresses,
    );
  const setSelectedWalletAddressesFilter =
    useSelectedWalletTrackerTradeAddressesFilterStore(
      (state) => state.setSelectedWalletAddresses,
    );

  const walletToEdit = useMemo(() => {
    const existedWallet = (trackedWallets || [])?.find(
      (w) => w.address === walletAddress,
    );
    if (existedWallet) return existedWallet;
    return {
      name: truncateAddress(walletAddress),
      address: walletAddress,
      emoji: "",
    };
  }, [trackedWallets, walletAddress]);

  // Initialize react-hook-form with zod resolver
  const form = useForm<WalletFormValues>({
    resolver: zodResolver(walletFormSchema),
    defaultValues: {
      name: walletToEdit.name || truncateAddress(walletAddress),
      address: walletToEdit.address || walletAddress,
      emoji: walletToEdit.emoji,
    },
  });

  const handleDeselect = useCallback(() => {
    const newFilter = (currentSelectedAddresses || [])?.filter(
      (a) => a !== walletAddress,
    );
    setSelectedWalletAddressesFilter(newFilter);
  }, [
    currentSelectedAddresses,
    walletAddress,
    setSelectedWalletAddressesFilter,
  ]);

  // Optimized emoji selection handler with memoization
  const handleEmojiSelect = useCallback(
    (emoji: string) => {
      form.setValue("emoji", emoji);
      const updatedWallets = (trackedWallets || [])?.map((w) =>
        w.address === walletAddress ? { ...w, emoji } : w,
      );
      updateWalletsMutation.mutate(updatedWallets);
      // Close both emoji pickers immediately
      setIsEmojiOpen(false);
      setIsMobileEmojiOpen(false);
    },
    [form, trackedWallets, walletAddress],
  );

  // Memoized emoji picker component for better performance
  const EmojiPickerComponent = useMemo(
    () => (
      <Picker
        onEmojiClick={(data) => handleEmojiSelect(data.emoji)}
        emojiStyle={"google" as EmojiStyle}
        hiddenEmojis={(hiddenEmoji || [])?.map((item) => item?.toLowerCase())}
        lazyLoadEmojis
        width={width! < 768 ? "100%" : 300}
        height={isModalContent ? 350 : 400}
        searchPlaceholder="Search emoji..."
      />
    ),
    [handleEmojiSelect],
  );

  // add wallets mutation
  const addWalletMutation = useMutation({
    mutationFn: (newWallet: TrackedWallet) =>
      updateTrackedWallets([newWallet, ...(existingWallets || [])]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tracked-wallets"] });
      queryClient.invalidateQueries({ queryKey: ["wallet-tracker"] });
      // toast.custom((t: any) => (
      //   <CustomToast
      //     tVisibleState={t.visible}
      //     message="Wallet added successfully"
      //     state="SUCCESS"
      //   />
      // ));
      success("Wallet added successfully")
      setIsOpen(false);
    },
    onError: (error: Error) => {
      // toast.custom((t: any) => (
      //   <CustomToast
      //     tVisibleState={t.visible}
      //     message={error.message}
      //     state="ERROR"
      //   />
      // ));
      errorToast(error.message)
    },
  });

  // Update mutation
  const updateWalletsMutation = useMutation({
    mutationFn: updateTrackedWallets,
    onSuccess: () => {
      handleDeselect();
      queryClient.invalidateQueries({ queryKey: ["tracked-wallets"] });
      queryClient.invalidateQueries({ queryKey: ["wallet-tracker"] });
      // toast.custom((t: any) => (
      //   <CustomToast
      //     tVisibleState={t.visible}
      //     message="Wallet updated successfully"
      //     state="SUCCESS"
      //   />
      // ));
      success("Wallet updated successfully")
      setIsOpen(false);
    },
    onError: (error: Error) => {
      // toast.custom((t: any) => (
      //   <CustomToast
      //     tVisibleState={t.visible}
      //     message={error.message}
      //     state="ERROR"
      //   />
      // ));
      errorToast(error.message)
    },
  });

  useEffect(() => {
    if (walletToEdit) {
      form.setValue("name", walletToEdit.name);
      form.setValue("address", walletToEdit.address);
      form.setValue("emoji", walletToEdit.emoji);
    }
  }, [walletToEdit, form]);

  // Cleanup effect for emoji picker states
  useEffect(() => {
    return () => {
      // Cleanup function to reset emoji picker states when component unmounts
      setIsEmojiOpen(false);
      setIsMobileEmojiOpen(false);
    };
  }, []);

  const onSubmit = useCallback(
    (values: WalletFormValues) => {
      // Update only the edited wallet in the tracked wallets array
      const updatedWallets = (trackedWallets || [])?.map((w) =>
        w?.address === walletAddress ? values : w,
      );
      const isWalletExist = (trackedWallets || [])?.find(
        (w) => w?.address === values?.address,
      );

      if (!isWalletExist) {
        addWalletMutation.mutate(values);
        return;
      }
      updateWalletsMutation.mutate(updatedWallets);
    },
    [trackedWallets, walletAddress, addWalletMutation, updateWalletsMutation],
  );

  const handleSearch = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && searchQuery.trim() !== "") {
        router.push(`/wallet-trade/${searchQuery.trim()}`);
      }
    },
    [searchQuery, router],
  );

  // Debounced search input handler for better performance
  const handleSearchInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
    },
    [],
  );

  const FormComponent = useMemo(
    () => (
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex w-full flex-col"
        >
          <div className="flex w-full gap-x-2 p-4 pb-0">
            <div className="flex flex-col">
              <FormField
                control={form.control}
                name="emoji"
                render={({ field }) => (
                  <FormItem className="flex max-w-14 flex-col gap-1">
                    <FormLabel>Emoji</FormLabel>
                    <SelectEmoji
                      alreadySelectedList={(trackedWallets || [])
                        ?.filter((w) => w?.address !== walletAddress)
                        ?.map((w) => w?.emoji)}
                      value={field?.value}
                      onChange={field?.onChange}
                      triggerClassName="max-xl:h-10"
                      isDialog={isModalContent}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex w-full flex-col gap-y-1">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="flex w-full flex-col gap-1">
                    <FormLabel>Wallet Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Wallet Name"
                        className="h-10 border border-border placeholder:text-fontColorSecondary focus:outline-none xl:h-[32px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
          <div className="flex flex-col gap-y-2 p-4">
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem className="flex flex-grow flex-col gap-1">
                  <FormLabel>Wallet Address</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Wallet Address"
                      className="h-10 border border-border placeholder:text-fontColorSecondary focus:outline-none xl:h-[32px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="flex w-full items-center justify-between border-t border-border p-4">
            <BaseButton variant="primary" className="h-[32px] w-full">
              <span className="inline-block whitespace-nowrap font-geistSemiBold text-sm">
                Save
              </span>
            </BaseButton>
          </div>
        </form>
      </Form>
    ),
    [form, onSubmit, trackedWallets, walletAddress],
  );

  if (width && width > 768) {
    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <div
          className={cn(
            "flex w-full items-center gap-x-3 px-3 md:rounded-[4px] lg:w-[240px]",
            !isModalContent && "justify-between lg:w-full",
          )}
        >
          <div className="flex items-center gap-3">
            <div className="relative aspect-square size-4">
              <Image
                src="/icons/wallet.png"
                alt="Wallet Icon"
                fill
                quality={100}
                className="object-contain"
              />
            </div>
            <div className="flex h-full flex-shrink-0 flex-col justify-start">
              <span
                className={cn(
                  "mb-[-0.2rem] flex w-fit items-center justify-center gap-2 font-geistSemiBold text-[16px] text-fontColorPrimary md:mb-0 md:text-[14px]",
                  isModalContent && "max-w-[170px]",
                  remainingScreenWidth < 1400 && "max-w-[130px]",
                )}
              >
                {walletToEdit.emoji ? (
                  <>
                    {isModalContent ? (
                      <Dialog open={isEmojiOpen} onOpenChange={setIsEmojiOpen}>
                        <DialogTrigger asChild>
                          <button className="cursor-pointer border-0 p-0">
                            <span className="relative aspect-square text-base">
                              {walletToEdit.emoji}
                            </span>
                          </button>
                        </DialogTrigger>
                        <DialogContent
                          overlayClassname="z-[9100]"
                          className="gb__white__popover z-[9100] w-fit gap-3 p-0"
                        >
                          <DialogHeader className="p-4 pb-0">
                            <DialogTitle className="text-lg text-fontColorPrimary">
                              Select Emoji
                            </DialogTitle>
                          </DialogHeader>
                          <div className="border border-border p-4">
                            {EmojiPickerComponent}
                          </div>
                        </DialogContent>
                      </Dialog>
                    ) : (
                      <Popover open={isEmojiOpen} onOpenChange={setIsEmojiOpen}>
                        <PopoverTrigger asChild>
                          <button className="cursor-pointer border-0 p-0">
                            <span className="relative aspect-square text-base">
                              {walletToEdit.emoji}
                            </span>
                          </button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="gb__white__popover z-[9000] flex w-full gap-3 p-0"
                          align="start"
                        >
                          {EmojiPickerComponent}
                        </PopoverContent>
                      </Popover>
                    )}
                  </>
                ) : null}
                <span className="truncate">
                  {walletToEdit.name || truncateAddress(walletAddress)}
                </span>

                <PopoverTrigger asChild className="size-3 cursor-pointer">
                  <button
                    title="Edit"
                    className="relative ml-auto hidden aspect-square size-3 md:inline-block"
                  >
                    <Image
                      src={
                        isOpen
                          ? "/icons/wallet-trades-edit.svg"
                          : "/icons/wallet-trades-edit-gray.svg"
                      }
                      alt="Wallet Trades Edit Icon"
                      fill
                      quality={100}
                      className="object-contain"
                    />
                  </button>
                </PopoverTrigger>
                <TrackWalletTrigger
                  walletAddress={walletToEdit.address ?? walletAddress}
                  handleDeselect={handleDeselect}
                  trackedWallets={trackedWallets}
                  existingWallets={existingWallets}
                />

                {!isModalContent && (
                  <SearchTwitterTrigger
                    address={walletToEdit.address ?? walletAddress}
                  />
                )}
              </span>

              <div className="flex w-fit cursor-pointer items-center justify-between gap-2">
                <a
                  href={`https://solscan.io/account/${walletAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                >
                  <AddressWithEmojis address={truncateAddress(walletAddress)} />
                </a>
                <Copy value={walletAddress} />
              </div>
            </div>
          </div>

          {!isModalContent && (
            <WalletTradeSearchInput
              value={searchQuery}
              onChange={handleSearchInputChange}
              placeholder={"Enter Wallet Address to Search"}
              className="w-48 md:w-40 lg:w-64"
              onKeyDown={handleSearch}
            />
          )}
        </div>
        <PopoverContent
          align="start"
          className={cn(
            "z-[9000] w-[380px] rounded-[8px] border border-border bg-card p-0 shadow-[0_0_20px_0_#000000]",
            !isModalContent && "w-[400px]",
          )}
        >
          <>
            <div className="flex w-full items-center justify-start border-b border-border p-4">
              <h4 className="text-nowrap font-geistSemiBold text-[18px] text-fontColorPrimary">
                Edit Wallet
              </h4>

              {/* X for mobile close modal */}
              <PopoverClose className="ml-auto cursor-pointer text-fontColorSecondary">
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
            </div>
            {FormComponent}
          </>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex h-[54px] w-full items-center gap-3 border-b border-border bg-white/[4%] px-3 py-2">
        <div className="flex size-full flex-shrink-0 flex-col justify-start">
          <div className="relative w-full items-center gap-1">
            <div
              className={cn(
                "flex items-center gap-2",
                isModalContent && "max-w-[240px]",
              )}
            >
              {walletToEdit.emoji ? (
                <Drawer
                  fixed
                  onOpenChange={setIsMobileEmojiOpen}
                  open={isMobileEmojiOpen}
                >
                  <DrawerTrigger asChild>
                    <button className="cursor-pointer border-0 p-0">
                      <span className="text-sm">{walletToEdit.emoji}</span>
                    </button>
                  </DrawerTrigger>
                  <DrawerContent className="fixed inset-x-0 bottom-0 z-[1000] h-fit max-h-[85vh] rounded-t-xl bg-background outline-none">
                    <DrawerHeader className="flex flex-row items-center justify-between space-y-0 border-b border-[#242436] px-4 py-2.5">
                      <DrawerTitle className="text-fontColorPrimary">
                        Select Emoji
                      </DrawerTitle>
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
                    <DrawerDescription className="sr-only">
                      Select an emoji
                    </DrawerDescription>
                    {EmojiPickerComponent}
                  </DrawerContent>
                </Drawer>
              ) : null}
              <h1 className="truncate font-geistBold text-sm text-fontColorPrimary">
                {walletToEdit.name || truncateAddress(walletAddress)}
              </h1>
              <TrackWalletTrigger
                walletAddress={walletToEdit.address ?? walletAddress}
                handleDeselect={handleDeselect}
                trackedWallets={trackedWallets}
                existingWallets={existingWallets}
              />
            </div>
          </div>

          <div className="flex w-full cursor-pointer items-center justify-between">
            <div className="flex gap-x-2 overflow-hidden">
              <p className="font-geistRegular text-xs text-fontColorSecondary">
                {truncateAddress(walletAddress)}
              </p>
              <Copy value={walletAddress} />
            </div>

            <DrawerTrigger className="relative ml-auto aspect-square size-[16px]">
              <Image
                src="/icons/wallet-trades-edit-white.svg"
                alt="Wallet Trades Edit Icon"
                fill
                quality={100}
                className="object-contain"
              />
            </DrawerTrigger>
          </div>
        </div>
      </div>
      <DrawerContent
        overlayClassName="z-[300]"
        className="z-[1000] w-[100%] gap-0 bg-card p-0 shadow-[0_0_20px_0_#000000]"
      >
        <div className="flex w-full items-center justify-start border-b border-border p-4">
          <DrawerTitle className="text-nowrap font-geistSemiBold text-[18px] text-fontColorPrimary">
            Edit Wallet
          </DrawerTitle>

          {/* X for mobile close modal */}
          <DrawerClose className="ml-auto cursor-pointer text-fontColorSecondary">
            <div className="relative aspect-square h-6 w-6 flex-shrink-0 duration-300 hover:opacity-70">
              <Image
                src="/icons/close.png"
                alt="Close Icon"
                fill
                quality={100}
                className="object-contain"
              />
            </div>
          </DrawerClose>
        </div>
        {FormComponent}
      </DrawerContent>
    </Drawer>
  );
}

const TrackWalletTrigger = React.memo(
  ({
    walletAddress,
    handleDeselect,
    trackedWallets,
    existingWallets,
  }: {
    walletAddress: string;
    handleDeselect: () => void;
    trackedWallets: TrackedWallet[];
    existingWallets?: TrackedWallet[];
  }) => {
    const queryClient = useQueryClient();
    const deleteWalletColor = useWalletHighlightStore(
      (state) => state.deleteWalletColor,
    );
    const setFooterMessage = useFooterStore((state) => state.setMessage);
    const { success, error: errorToast } = useCustomToast();

    // Add wallet mutation with optimistic update
    const addWalletMutation = useMutation({
      mutationFn: (newWallet: TrackedWallet) =>
        updateTrackedWallets([newWallet, ...(existingWallets || [])]),
      onMutate: async (newWallet: TrackedWallet) => {
        await queryClient.cancelQueries({ queryKey: ["tracked-wallets"] });
        const previousWallets = queryClient.getQueryData<TrackedWallet[]>([
          "tracked-wallets",
        ]);
        queryClient.setQueryData<TrackedWallet[]>(
          ["tracked-wallets"],
          (old) => [newWallet, ...(old || [])],
        );
        return { previousWallets };
      },
      onSuccess: () => {
        // toast.custom((t: any) => (
        //   <CustomToast
        //     tVisibleState={t.visible}
        //     message="Wallet tracked successfully"
        //     state="SUCCESS"
        //   />
        // ));
        success("Wallet tracked successfully")
      },
      onError: (error: Error, newWallet, context) => {
        if (context?.previousWallets) {
          queryClient.setQueryData(
            ["tracked-wallets"],
            context.previousWallets,
          );
        }
        // toast.custom((t: any) => (
        //   <CustomToast
        //     tVisibleState={t.visible}
        //     message={error.message}
        //     state="ERROR"
        //   />
        // ));
        errorToast(error.message)
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: ["tracked-wallets"] });
        queryClient.invalidateQueries({ queryKey: ["wallet-tracker"] });
      },
    });

    // Delete tracked wallet mutation with optimistic update
    const deleteWalletsMutation = useMutation({
      mutationFn: updateTrackedWallets,
      onMutate: async (updatedWallets: TrackedWallet[]) => {
        await queryClient.cancelQueries({ queryKey: ["tracked-wallets"] });
        const previousWallets = queryClient.getQueryData<TrackedWallet[]>([
          "tracked-wallets",
        ]);
        queryClient.setQueryData<TrackedWallet[]>(
          ["tracked-wallets"],
          updatedWallets,
        );
        return { previousWallets };
      },
      onSuccess: async () => {
        const res = await clearFooterSection("walletTracker");
        setFooterMessage(res);
        // toast.custom((t: any) => (
        //   <CustomToast
        //     tVisibleState={t.visible}
        //     message="Selected wallets deleted successfully"
        //     state="SUCCESS"
        //   />
        // ));
        success("Selected wallets deleted successfully")
        handleDeselect();
      },
      onError: (error: Error, updatedWallets, context) => {
        if (context?.previousWallets) {
          queryClient.setQueryData(
            ["tracked-wallets"],
            context.previousWallets,
          );
        }
        // toast.custom((t: any) => (
        //   <CustomToast
        //     tVisibleState={t.visible}
        //     message={error.message}
        //     state="ERROR"
        //   />
        // ));
        errorToast(error.message)
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: ["tracked-wallets"] });
        queryClient.invalidateQueries({ queryKey: ["wallet-tracker"] });
      },
    });

    const isWalletTracked = useMemo(
      () => (trackedWallets || [])?.find((w) => w.address === walletAddress),
      [trackedWallets, walletAddress],
    );

    const handleClick = useCallback(() => {
      if (!isWalletTracked) {
        addWalletMutation.mutate({
          address: walletAddress,
          name: "New Tracked Wallet",
          emoji: "🎯",
        });
        return;
      }
      deleteWalletsMutation.mutate(
        (trackedWallets || [])?.filter((w) => w.address !== walletAddress),
      );
      deleteWalletColor(walletAddress);
    }, [
      isWalletTracked,
      addWalletMutation,
      walletAddress,
      deleteWalletsMutation,
      trackedWallets,
      deleteWalletColor,
    ]);

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleClick}
              className="relative inline-block aspect-square h-4 w-4"
            >
              <StarIcon
                size={16}
                fill={isWalletTracked ? "#FBA544" : "#9191A4"}
                color={isWalletTracked ? "#FBA544" : "#9191A4"}
              />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            {isWalletTracked ? "Untrack Wallet" : "Track Wallet"}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  },
);

TrackWalletTrigger.displayName = "TrackWalletTrigger";

const SearchTwitterTrigger = React.memo(({ address }: { address: string }) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href={`https://x.com/search?q=${encodeURIComponent(address)}&src=typed_query&f=live`}
            target="_blank"
            title="Edit"
            className="relative ml-auto hidden aspect-square size-3.5 md:inline-block"
          >
            <Image
              src={"/icons/wallet-trade-search.svg"}
              alt="Wallet Trades Search Icon"
              fill
              quality={100}
              className="object-contain"
            />
          </Link>
        </TooltipTrigger>
        <TooltipContent>Search Wallet on X</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});

SearchTwitterTrigger.displayName = "SearchTwitterTrigger";
