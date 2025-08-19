import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import BaseButton from "../buttons/BaseButton";
import Image from "next/image";
import { Label } from "@/components/ui/label";
import { memo, useCallback, useState, useMemo, useEffect } from "react";
import { VariableSizeList } from "react-window";
import { useQuery } from "@tanstack/react-query";
import {
  SoundType,
  ListType,
  useCosmoSoundStore,
} from "@/stores/cosmo/use-cosmo-sound.store";
import { cn } from "@/libraries/utils";
import { getTrackedWallets } from "@/apis/rest/wallet-tracker";
import { MuteIconSVG, VolumeIconSVG } from "../ScalableVectorGraphics";

const SOUNDS = ["None", "Ping", "Ding", "Blink"] as const;

interface CosmoSoundProps {
  listType: ListType;
}

// Combined Sound and Wallet Selector Popover
const CosmoSoundSelector = ({ listType }: { listType: ListType }) => {
  const {
    globalDefaults,
    setGlobalSound,
    getSoundForWallet,
    setWalletSound,
    initializeWalletConfigs,
  } = useCosmoSoundStore();
  const [isOpen, setIsOpen] = useState(false);

  // Fetch tracked wallets data (cached by React Query)
  const { data: trackedWalletsData } = useQuery({
    queryKey: ["tracked-wallets"],
    queryFn: () => getTrackedWallets(),
    refetchOnWindowFocus: true,
    staleTime: 0, // Consider data immediately stale
  });

  // Transform API data into the format CosmoSound expects
  const trackedWallets = useMemo(() => {
    if (!trackedWalletsData) return [];

    return (trackedWalletsData || [])?.map((wallet) => ({
      address: wallet.address,
      name: `${wallet.emoji} ${wallet.name}`, // Combine emoji and name
    }));
  }, [trackedWalletsData]);

  // Initialize wallet configs when tracked wallets change
  useEffect(() => {
    if (trackedWallets.length > 0) {
      initializeWalletConfigs(trackedWallets);
    }
  }, [trackedWallets, initializeWalletConfigs]);

  const currentSound = globalDefaults[`${listType}Sound`];
  const hasSound = currentSound !== "none";

  // Get list type display name
  const getListDisplayName = (type: ListType) => {
    switch (type) {
      case "newlyCreated":
        return "Newly Created";
      case "aboutToGraduate":
        return "About to Graduate";
      case "graduated":
        return "Graduated";
      case "trending":
        return "Trending";
      default:
        return type;
    }
  };

  // Handle sound selection
  const handleValueChange = useCallback(
    (newValue: string) => {
      const soundValue = newValue.toLowerCase() as SoundType;

      // Play preview sound
      if (soundValue !== "none") {
        const audio = new Audio(`/sfx/cosmo/${soundValue}.mp3`);
        audio.play().catch(console.warn);
      }

      // Update global sound for this list type
      setGlobalSound(listType, soundValue);
    },
    [listType, setGlobalSound],
  );

  // Check if wallet has the current global sound set
  const isWalletSoundSet = useCallback(
    (walletAddress: string) => {
      const walletSound = getSoundForWallet(walletAddress, listType);
      return walletSound === currentSound;
    },
    [getSoundForWallet, listType, currentSound],
  );

  // Handle wallet sound toggle
  const handleWalletToggle = useCallback(
    (
      walletAddress: string,
      walletName: string | undefined,
      checked: boolean,
    ) => {
      if (checked) {
        // Set wallet to use current global sound (including "none")
        setWalletSound(walletAddress, listType, currentSound, walletName);
      } else {
        // When unchecking:
        // - If current sound is "none", prevent unchecking (do nothing)
        // - If current sound is not "none", set wallet sound to "none"
        if (currentSound !== "none") {
          setWalletSound(walletAddress, listType, "none", walletName);
        }
      }
    },
    [setWalletSound, listType, currentSound],
  );

  // Get display name for wallet
  const getWalletDisplayName = useCallback((address: string, name?: string) => {
    return name || `${address.slice(0, 6)}...${address.slice(-4)}`;
  }, []);

  // Calculate item height based on wallet name length and sound indicator
  const getItemHeight = useCallback(
    (index: number) => {
      // Add safety check
      if (!trackedWallets || index >= trackedWallets.length) {
        return 44; // Default height
      }

      const wallet = trackedWallets[index];
      const displayName = getWalletDisplayName(wallet.address, wallet.name);
      const walletSound = getSoundForWallet(wallet.address, listType);
      const hasCustomSound = walletSound !== globalDefaults[`${listType}Sound`];
      const isChecked = walletSound === currentSound;

      // Base height: 44px (checkbox + padding)
      let baseHeight = 44;

      // Add extra height if showing sound indicator
      if (hasCustomSound || isChecked) {
        baseHeight += 5; // Extra space for sound indicator
      }

      // Additional height if name is long (rough estimation)
      const charactersPerLine = 20; // Approximate characters that fit in one line
      const extraLines = Math.max(
        0,
        Math.ceil(displayName.length / charactersPerLine) - 1,
      );

      return baseHeight + extraLines * 15; // 15px per extra line
    },
    [
      trackedWallets,
      getWalletDisplayName,
      getSoundForWallet,
      listType,
      globalDefaults,
      currentSound,
    ],
  );

  // Wallet item component for react-window
  const WalletItem = memo(
    ({ index, style }: { index: number; style: React.CSSProperties }) => {
      // Add safety check for deleted wallets
      if (!trackedWallets || index >= trackedWallets.length) {
        return <div style={style} />; // Empty placeholder
      }

      const wallet = trackedWallets[index];
      const walletSound = getSoundForWallet(wallet.address, listType);
      const isChecked = walletSound === currentSound;
      const isNoneSound = currentSound === "none";
      const hasCustomSound = walletSound !== globalDefaults[`${listType}Sound`];

      return (
        <div style={style} className="px-1">
          <div className="flex items-start space-x-3">
            <div className="pt-0.5">
              <Checkbox
                id={`wallet-${wallet.address}`}
                checked={isChecked}
                disabled={isNoneSound && isChecked} // Disable unchecking when sound is "none"
                onCheckedChange={(checked) =>
                  handleWalletToggle(
                    wallet.address,
                    wallet.name,
                    checked as boolean,
                  )
                }
                className={cn(
                  "border-[#26262F] data-[state=checked]:border-[#DF74FF] data-[state=checked]:bg-[#DF74FF]",
                  isNoneSound && isChecked && "cursor-not-allowed opacity-60",
                )}
              />
            </div>
            <div className="flex-1">
              <Label
                htmlFor={`wallet-${wallet.address}`}
                className={cn(
                  "block cursor-pointer break-words text-sm leading-5 text-white",
                  isNoneSound && isChecked && "cursor-not-allowed opacity-60",
                )}
              >
                {getWalletDisplayName(wallet.address, wallet.name)}
              </Label>

              {/* Show current sound for this wallet if different from global or if checked */}
              {(hasCustomSound || isChecked) && (
                <div className="flex items-center space-x-1">
                  <div
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      walletSound === "none"
                        ? "bg-gray-500"
                        : walletSound === "ping"
                          ? "bg-blue-400"
                          : walletSound === "ding"
                            ? "bg-green-400"
                            : walletSound === "blink"
                              ? "bg-yellow-400"
                              : "bg-gray-500",
                    )}
                  />
                  <span
                    className={cn(
                      "text-xs capitalize",
                      isChecked ? "text-[#DF74FF]" : "text-gray-400",
                    )}
                  >
                    {walletSound}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    },
  );

  WalletItem.displayName = "WalletItem";

  // Show indicator if any wallets have custom sounds
  const hasWalletConfigs = (trackedWallets || [])?.some(
    (wallet) =>
      getSoundForWallet(wallet.address, listType) !==
      globalDefaults[`${listType}Sound`],
  );

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <BaseButton variant="gray" className="relative size-8" size="short">
          {hasSound ? (
            <VolumeIconSVG className="relative aspect-square h-4 w-4 flex-shrink-0" />
          ) : (
            <MuteIconSVG className="relative aspect-square h-4 w-4 flex-shrink-0" />
          )}
          {/* Show indicator if any wallet configs exist */}
          {hasWalletConfigs && (
            <div className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-purple-500" />
          )}
        </BaseButton>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="flex w-[400px] flex-col gap-y-4 rounded-xl bg-secondary p-4"
      >
        {/* Header */}
        <div className="space-y-1">
          <h1 className="font-geistSemiBold text-base font-semibold leading-5 text-fontColorPrimary">
            {getListDisplayName(listType)}
          </h1>
          {trackedWallets.length > 0 && (
            <p className="text-xs text-gray-400">
              {currentSound === "none"
                ? "No sound for new tokens. Configure wallet-specific sounds below."
                : `"${currentSound}" sound for new tokens. Customize per wallet below.`}
            </p>
          )}
        </div>

        {/* Main Content - Two Columns */}
        <div className="flex gap-6">
          {/* Left Column - Sound Selection */}
          <div className="flex-1 space-y-3">
            <h2 className="text-sm font-medium text-white">Sound</h2>
            <RadioGroup value={currentSound} onValueChange={handleValueChange}>
              {SOUNDS?.map((item) => (
                <Label
                  key={item}
                  htmlFor={`${item.toLowerCase()}-${listType}`}
                  className={cn(
                    "relative flex cursor-pointer items-center space-x-2 rounded-2xl px-3 py-2.5 transition-colors duration-200 hover:bg-black/20",
                    currentSound === item.toLowerCase() && "bg-white/[0.03]",
                  )}
                >
                  <RadioGroupItem
                    value={item.toLowerCase()}
                    id={`${item.toLowerCase()}-${listType}`}
                    className={cn(
                      "border-[#26262F] bg-[#16161B]",
                      currentSound === item.toLowerCase() &&
                        "border-4 border-[#DF74FF] bg-white",
                    )}
                  />
                  <p className="text-sm text-white">{item}</p>
                </Label>
              ))}
            </RadioGroup>
          </div>

          {/* Right Column - Wallet Selection */}
          {trackedWallets.length > 0 && (
            <div className="flex-1 space-y-3">
              <h2 className="text-sm font-medium text-white">Wallets</h2>
              <div className="space-y-2">
                {/* Scrollable wallet list */}
                <div className="nova-scroller h-[200px] w-full">
                  <VariableSizeList
                    key={`wallet-list-${trackedWallets.length}`} // Force re-render when wallet count changes
                    width="100%"
                    height={200}
                    itemCount={trackedWallets.length}
                    itemSize={getItemHeight}
                    className="scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800"
                  >
                    {WalletItem}
                  </VariableSizeList>
                </div>
                {trackedWallets.length > 5 && (
                  <p className="text-center text-xs text-gray-500">
                    {trackedWallets.length} wallets total
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

CosmoSoundSelector.displayName = "CosmoSoundSelector";

// Main Component - Simplified to single popover
export const CosmoSound = memo(({ listType }: CosmoSoundProps) => {
  return (
    <div className="flex items-center">
      <CosmoSoundSelector listType={listType} />
    </div>
  );
});

CosmoSound.displayName = "CosmoSound";
