"use client";
import { usePopupStore } from "@/stores/use-popup-state.store";
import BaseButton from "../buttons/BaseButton";
import Image from "next/image";
import { cn } from "@/libraries/utils";
import { Pencil, PencilIcon } from "lucide-react";
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useUserWalletStore } from "@/stores/wallet/use-user-wallet.store";
import { Input } from "@/components/ui/input";
import { CachedImage } from "../CachedImage";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { submitTransaction } from "@/apis/rest/transaction/submit-transaction";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useActivePresetStore } from "@/stores/dex-setting/use-active-preset.store";
import {
  convertNumberToPresetKey,
  convertPresetKeyToNumber,
} from "@/utils/convertPreset";
import { useQuickBuySettingsStore } from "@/stores/setting/use-quick-buy-settings.store";
import { useQuickSellSettingsStore } from "@/stores/setting/use-quick-sell-settings.store";
import { useTokenHoldingStore } from "@/stores/token/use-token-holding.store";
import { useLatestTransactionMessageStore } from "@/stores/use-latest-transactions.store";
import { HoldingsTokenData } from "@/types/ws-general";
import { Params } from "next/dist/server/request/params";
import { useTokenMessageStore } from "@/stores/token/use-token-messages.store";
import { useWindowSizeStore } from "@/stores/use-window-size.store";
import { AnimatePresence } from "framer-motion";
import { motion } from "framer-motion";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "../../ui/tooltip";
import { useHydratedMultiWalletStore } from "@/stores/wallet/use-multi-wallet-input.store";
import { useCustomToast } from "@/hooks/use-custom-toast";
import { useSwap } from "@/hooks/useSwap";
import toast from "react-hot-toast";
import { QuickPresetData } from "@/apis/rest/settings/settings";
import { multiplyBigIntByPercentage } from "@/utils/multiplyBigIntByPercentage";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { solToLamports } from "@/utils/solToLamport";

const getAmountByWallet = (
  token: HoldingsTokenData[],
  amount: number,
  type: "%" | "SOL",
  params: Params,
  solPrice: number,
) => {
  const decimals = token?.find((t) => t.token.mint === (params?.["mint-address"] || (params?.["pool-address"] as string)))?.token?.quote_decimals || 6;
  const totalHoldings =
    BigInt((token || [])?.find(
      (t) =>
        t.token.mint ===
        ((params?.["mint-address"] || params?.["pool-address"]) as string),
    )?.balance_str || 0);
  let finalAmount: bigint = BigInt(0);
  if (type === "%") {
    if (amount) {
      try {
        // Ensure percentage is between 0 and 100
        const percentage = Math.min(Math.max(Number(amount), 0), 100) / 100;
        finalAmount = multiplyBigIntByPercentage(totalHoldings, percentage, decimals);
      } catch (error) {
        console.warn("Error calculating sell amount:", error);
      }
    }
  } else {
    // SOL amount calculation
    if (amount) {
      finalAmount = solToLamports(amount)
    }
  }
  return finalAmount;
};

// Define the form schema
const formSchema = z.object({
  amounts: z
    .record(z.string(), z.union([z.number(), z.string()]).optional())
    .optional(),
  percentages: z.record(
    z.string(),
    z.number().min(0).max(100).nullable().optional(),
  ),
});

type FormData = z.infer<typeof formSchema>;

interface AmountInputWithButtonProps {
  index: number;
  value: number;
  formValue: number;
  onButtonClick: (value: number) => void;
  onValueChange: (value: number) => void;
}

type Position = { x: number; y: number };

// Constants for dragging functionality
const STORAGE_KEY_POSITION = "multiWalletModalPosition";

export const MultiWalletPopover = () => {
  const { remainingScreenWidth } = usePopupStore();
  const {
    amounts: storedAmounts,
    setAmount,
    isMultiWalletOpen,
    setIsMultiWalletOpen,
  } = useHydratedMultiWalletStore();
  const [open, setOpen] = useState(isMultiWalletOpen);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const inputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const params = useParams();
  const { width, height } = useWindowSizeStore();
  const { error: errorToast } = useCustomToast();

  // Update local state when store state changes
  useEffect(() => {
    setOpen(isMultiWalletOpen);
  }, [isMultiWalletOpen]);

  // Update store state when local state changes
  useEffect(() => {
    setIsMultiWalletOpen(open);
  }, [open, setIsMultiWalletOpen]);

  // Dragging state
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [triggerElement, setTriggerElement] = useState<HTMLElement | null>(
    null,
  );
  const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 });
  const initializedRef = useRef(false);

  // const cosmoWallets = useQuickAmountStore((state) => state.cosmoWallets);
  const userWalletFullList = useUserWalletStore(
    (state) => state.userWalletFullList,
  );
  const finalWallets = (userWalletFullList || [])?.filter((w) => !w.archived);
  const [isSellMode, setIsSellMode] = useState(false);
  const latestTransactionMessages =
    useLatestTransactionMessageStore((state) => state.messages) || [];
  const holdingsMessages = useTokenHoldingStore((state) => state.messages);
  const isLoading = useTokenHoldingStore((state) => state.isLoading);

  const modalContentRef = useRef<HTMLDivElement>(null);
  const [modalHeight, setModalHeight] = useState(294); // Default height

  const modalWidth = useMemo(() => {
    if (!width) {
      return 452;
    }
    // Responsive width for mobile
    if (width < 1024) {
      return width * 0.95;
    }
    return 452;
  }, [width]);

  // Update MODAL_DIMENSIONS to use dynamic height and increased width
  const MODAL_DIMENSIONS = {
    width: modalWidth,
    height: modalHeight,
  };

  // Add effect to measure and update modal height
  useEffect(() => {
    if (open && modalContentRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const newHeight = entry.contentRect.height;
          setModalHeight(newHeight);
        }
      });

      resizeObserver.observe(modalContentRef.current);
      return () => resizeObserver.disconnect();
    }
  }, [open]);

  // Get viewport dimensions including scroll
  // const getViewportDimensions = () => {
  //   const scrollX = window.scrollX || window.pageXOffset;
  //   const scrollY = window.scrollY || window.pageYOffset;
  //   const viewportWidth = Math.max(
  //     document.documentElement.clientWidth || 0,
  //     window.innerWidth || 0,
  //   );
  //   const viewportHeight = Math.max(
  //     document.documentElement.clientHeight || 0,
  //     window.innerHeight || 0,
  //   );
  //   const documentHeight = Math.max(
  //     document.documentElement.scrollHeight,
  //     document.body.scrollHeight,
  //   );
  //
  //   return {
  //     scrollX,
  //     scrollY,
  //     viewportWidth,
  //     viewportHeight,
  //     documentHeight,
  //   };
  // };

  // Handle drag move
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !width || !height) return;

      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;

      // Calculate new position without margin constraints
      let newX = dragStartRef.current.posX + deltaX;
      let newY = dragStartRef.current.posY + deltaY;

      // Only constrain to window bounds
      newX = Math.max(0, Math.min(newX, width - MODAL_DIMENSIONS.width));
      newY = Math.max(0, Math.min(newY, height - MODAL_DIMENSIONS.height));

      setPosition({
        x: Math.round(newX),
        y: Math.round(newY),
      });

      localStorage.setItem(
        STORAGE_KEY_POSITION,
        JSON.stringify({
          x: Math.round(newX),
          y: Math.round(newY),
        }),
      );
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.userSelect = "";
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, width, height]);

  // Calculate initial position when modal opens
  useEffect(() => {
    if (width && height && open) {
      if (!initializedRef.current) {
        // Try to get saved position first
        const savedPosition = localStorage.getItem(STORAGE_KEY_POSITION);
        if (savedPosition) {
          try {
            const parsedPosition = JSON.parse(savedPosition) as Position;
            const isValidPosition =
              parsedPosition.x + MODAL_DIMENSIONS.width <= width &&
              parsedPosition.y + MODAL_DIMENSIONS.height <= height;

            if (isValidPosition) {
              setPosition(parsedPosition);
              initializedRef.current = true;
              return;
            }
          } catch (e) {
            console.warn("Failed to parse saved multi-wallet position", e);
          }
        }

        // If no valid saved position, position above trigger element
        if (triggerElement && remainingScreenWidth < 2030) {
          const triggerRect = triggerElement.getBoundingClientRect();

          let newX = triggerRect.left;
          let newY = triggerRect.top - MODAL_DIMENSIONS.height - 5;

          // Ensure modal stays within window bounds
          if (newX + MODAL_DIMENSIONS.width > width) {
            newX = width - MODAL_DIMENSIONS.width;
          }
          if (newX < 0) {
            newX = 0;
          }
          if (newY < 0) {
            newY = triggerRect.bottom + 5;
          }
          if (newY + MODAL_DIMENSIONS.height > height) {
            newY = height - MODAL_DIMENSIONS.height;
          }

          setPosition({ x: Math.round(newX), y: Math.round(newY) });
        } else {
          // Fallback to center
          setPosition({
            x: Math.round((width - MODAL_DIMENSIONS.width) / 2),
            y: Math.round((height - MODAL_DIMENSIONS.height) / 2),
          });
        }
        initializedRef.current = true;
      }
    } else if (!open) {
      initializedRef.current = false;
    }
  }, [width, height, open, triggerElement]);

  const finalHoldings = useMemo(() => {
    if (!holdingsMessages || !latestTransactionMessages)
      return holdingsMessages;

    if (isLoading) {
      const updatedFinalHoldings = (holdingsMessages || [])?.map((holding) => {
        const updatedTokens = (holding.tokens || [])?.map((token) => {
          const matchingTx = (latestTransactionMessages || [])?.find(
            (tx) =>
              tx.wallet === holding.wallet && tx.mint === token.token.mint,
          );

          if (matchingTx) {
            return {
              ...token,
              balance: matchingTx.balance,
            };
          }

          return token;
        });

        return {
          ...holding,
          tokens: updatedTokens,
        };
      });

      console.warn("BALANCE ✨ - Panel Popup", {
        updatedFinalHoldings,
        latestTransactionMessages,
      });

      return updatedFinalHoldings;
    } else {
      return holdingsMessages;
    }
  }, [holdingsMessages, latestTransactionMessages, isLoading]);

  const {
    control,
    handleSubmit,
    formState: { errors },
    getValues,
    setError,
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amounts: finalWallets.reduce(
        (acc, wallet) => ({
          ...acc,
          [wallet.address]: storedAmounts[wallet.address] || "",
        }),
        {},
      ),
      percentages: finalWallets.reduce(
        (acc, wallet) => ({
          ...acc,
          [wallet.address]: 0,
        }),
        {},
      ),
    },
    mode: "onChange",
  });

  const queryClient = useQueryClient();
  //! ## [OLD HANDLE QUICK BUY FUNCTION❌] ##
  // const buyMutation = useMutation({
  //   mutationFn: submitTransaction,
  //   onSuccess: () => {
  //     queryClient.refetchQueries({
  //       queryKey: ["wallets-balance"],
  //     });
  //   },
  //   onError: (error: Error) => {
  //     // toast.custom((t: any) => (
  //     //   <CustomToast
  //     //     tVisibleState={t.visible}
  //     //     message={error.message}
  //     //     state="ERROR"
  //     //   />
  //     // ));
  //     errorToast(error.message);
  //   },
  // });


  const { quickSell, quickBuy, isLoadingFetch: isLoadingSellSwap } = useSwap();

  //* ## [TURNKEY🔐] - Handle buy with turnkey ##
  const handleQuickBuy = async (data: FormData) => {
    const mintAddress = params?.["mint-address"] as string
    try {
      if (!mintAddress) {
        errorToast("Invalid token");
        return;
      }

      // Check if all amounts are empty
      const allAmountsEmpty =
        !data.amounts ||
        Object.values(data.amounts || {})?.every((amount) => !Number(amount));

      if (allAmountsEmpty) {
        // toast.custom((t: any) => (
        //   <CustomToast
        //     tVisibleState={t.visible}
        //     message="All amounts are empty. Please enter an amount."
        //     state="ERROR"
        //   />
        // ));
        errorToast("All amounts are empty. Please enter an amount.");
        return;
      }
      const wallets = Object.entries(data.amounts || {})
        ?.filter(([_, amount]) => Number(amount))
        ?.map(([address, amount]) => ({
          address,
          amount
        }))

      const filteredWallets = wallets.filter(
        (wallet): wallet is { amount: number; address: string } =>
          !!wallet && typeof wallet.amount === "number" && !!wallet.address
      );
      const presetKey = convertNumberToPresetKey(
        activeBuyPreset,
      ) as keyof typeof buyPresets;
      const preset = buyPresets[presetKey] as QuickPresetData;
      let signature: string | undefined;

      for (const wallet of filteredWallets) {
        try {
          signature = await quickBuy({
            priorityFee: preset?.fee,
            mint: mintAddress,
            walletAddresses: [wallet.address],
            module: "Quick Buy",
            type: "buy",
            params: {
              buyAmount: BigInt(wallet.amount.toFixed(9).replace(/\.?0+$/, "")),
              slippage: preset?.slippage,
            }
          });

          if (!signature) {
            throw new Error("Failed to get transaction signature");
          }

        } catch (err) {
          console.error("Buy failed for wallet:", wallet.address, err);
        }
      }

      if (!signature) {
        throw new Error("Failed to get transaction signature");
      }
      return signature;
    } catch (error) {
      console.error("Buy failed:", error);

      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      // Show user-friendly error messages
      if (
        errorMessage.includes("rejected") ||
        errorMessage.includes("not been authorized")
      ) {
        errorToast(
          "❌ Transaction was cancelled in Phantom wallet. Please try again and click 'Approve' when the popup appears.",
        );
      } else if (
        errorMessage.includes("Wallet not connected") ||
        errorMessage.includes("disconnected")
      ) {
        errorToast(
          "❌ Wallet disconnected. Please reconnect your Phantom wallet and try again.",
        );
      } else {
        errorToast(`❌ Buy failed: ${errorMessage}`);
      }
    }
  };

  const handleQuickSell = async (data: FormData) => {
    const mintAddress = params?.["mint-address"] as string
    try {
      if (!mintAddress) {
        errorToast("Invalid token");
        return;
      }

      // Check if all amounts are empty
      const allAmountsEmpty =
        !data.amounts ||
        Object.values(data.amounts || {})?.every((amount) => !Number(amount));

      if (allAmountsEmpty) {
        // toast.custom((t: any) => (
        //   <CustomToast
        //     tVisibleState={t.visible}
        //     message="All amounts are empty. Please enter an amount."
        //     state="ERROR"
        //   />
        // ));
        errorToast("All amounts are empty. Please enter an amount.");
        return;
      }
      const wallets = Object.entries(data.amounts || {})
        ?.filter(([_, amount]) => Number(amount))
        ?.map(([address, amount]) => ({
          address,
          amount
        }))

      let signature: string | undefined;

      const filteredWallets = wallets.filter(
        (wallet): wallet is { amount: number; address: string } =>
          !!wallet && typeof wallet.amount === "number" && !!wallet.address
      );

      const presetKey = convertNumberToPresetKey(
        activeBuyPreset,
      ) as keyof typeof buyPresets;
      const preset = buyPresets[presetKey] as QuickPresetData;
      signature = await quickSell({
        priorityFee: preset.fee as number,
        mint: mintAddress,
        module: "Quick Sell",
        type: "sell",
        params: {
          slippage: preset.slippage as number,
          sellAmount: filteredWallets.map(wallet => ({
            walletAddresses: wallet.address,
            amount: BigInt(wallet.amount)
          }))
        }
      });

      if (!signature) {
        throw new Error("Failed to get transaction signature");
      }
      return signature;
    } catch (error) {
      console.error("Buy failed:", error);

      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      // Show user-friendly error messages
      if (
        errorMessage.includes("rejected") ||
        errorMessage.includes("not been authorized")
      ) {
        errorToast(
          "❌ Transaction was cancelled in Phantom wallet. Please try again and click 'Approve' when the popup appears.",
        );
      } else if (
        errorMessage.includes("Wallet not connected") ||
        errorMessage.includes("disconnected")
      ) {
        errorToast(
          "❌ Wallet disconnected. Please reconnect your Phantom wallet and try again.",
        );
      } else {
        errorToast(`❌ Buy failed: ${errorMessage}`);
      }
    }
  };

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    await handleQuickBuy(data)
    //! ## [OLD HANDLE QUICK BUY FUNCTION❌] ##
    // // Check if all amounts are empty
    // const allAmountsEmpty =
    //   !data.amounts ||
    //   Object.values(data.amounts || {})?.every((amount) => !Number(amount));

    // if (allAmountsEmpty) {
    //   // toast.custom((t: any) => (
    //   //   <CustomToast
    //   //     tVisibleState={t.visible}
    //   //     message="All amounts are empty. Please enter an amount."
    //   //     state="ERROR"
    //   //   />
    //   // ));
    //   errorToast("All amounts are empty. Please enter an amount.");
    //   return;
    // }

    // const presetKey = convertNumberToPresetKey(
    //   activeBuyPreset,
    // ) as keyof typeof buyPresets;
    // const preset = buyPresets[presetKey];
    // if (!preset || typeof preset === "boolean") return;

    // buyMutation.mutate({
    //   mint: (params?.["mint-address"] || params?.["pool-address"]) as string,
    //   type: "buy",
    //   wallets: Object.entries(data.amounts || {})
    //     ?.filter(([_, amount]) => Number(amount))
    //     ?.map(([address, amount]) => ({
    //       address,
    //       amount: Number(amount),
    //       input_mint: "So11111111111111111111111111111111111111112",
    //     })),
    //   preset: activeBuyPreset,
    //   slippage: preset.slippage,
    //   mev_protect: false,
    //   auto_tip: preset.autoTipEnabled,
    //   fee: preset.fee,
    //   tip: preset.tip,
    //   module: "Quick Buy",
    // });
  };

  const activeBuyPreset = convertPresetKeyToNumber(
    useActivePresetStore((s) => s.buyPanelActivePreset),
  );

  const buyPresets = useQuickBuySettingsStore((state) => state.presets);
  const handleBuyClick = async (walletAddress: string) => {
    // Get the current value
    const currentValue = getValues(`amounts.${walletAddress}`);
    if (!Number(currentValue)) {
      setError(`amounts.${walletAddress}`, {
        message: "The amount should be greater than 0",
        type: "manual",
      });
      return;
    }

    // If validation passes, proceed with buy action
    const amount = +(currentValue || 0);
    if (amount && amount <= 0) {
      setError(`amounts.${walletAddress}`, {
        message: "The amount should be greater than 0",
        type: "manual",
      });
      return;
    }

    const mintAddress = params?.["mint-address"] as string
    try {
      if (!mintAddress) {
        errorToast("Invalid token");
        return;
      }

      const presetKey = convertNumberToPresetKey(
        activeBuyPreset,
      ) as keyof typeof buyPresets;
      const preset = buyPresets[presetKey] as QuickPresetData;

      const signature = await quickBuy({
        priorityFee: preset?.fee,
        mint: mintAddress,
        walletAddresses: [walletAddress],
        module: "Quick Buy",
        type: "buy",
        params: {
          buyAmount: solToLamports(amount),
          slippage: preset?.slippage,
        }
      });
      if (!signature) {
        throw new Error("Failed to get transaction signature");
      }
      toast.success(`🎉 Buy successful! Signature: ${signature}`);
    } catch (error) {
      console.error("Buy failed:", error);

      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      // Show user-friendly error messages
      if (
        errorMessage.includes("rejected") ||
        errorMessage.includes("not been authorized")
      ) {
        errorToast(
          "❌ Transaction was cancelled in Phantom wallet. Please try again and click 'Approve' when the popup appears.",
        );
      } else if (
        errorMessage.includes("Wallet not connected") ||
        errorMessage.includes("disconnected")
      ) {
        errorToast(
          "❌ Wallet disconnected. Please reconnect your Phantom wallet and try again.",
        );
      } else {
        errorToast(`❌ Buy failed: ${errorMessage}`);
      }
    }

    //! ## [OLD HANDLE QUICK BUY FUNCTION❌] ##
    // const presetKey = convertNumberToPresetKey(
    //   activeBuyPreset,
    // ) as keyof typeof buyPresets;
    // const preset = buyPresets[presetKey];
    // if (!preset || typeof preset === "boolean") return;

    // buyMutation.mutate({
    //   mint: (params?.["mint-address"] || params?.["pool-address"]) as string,
    //   type: "buy",
    //   wallets: [
    //     {
    //       address: walletAddress,
    //       amount: Number(amount),
    //       input_mint: "So11111111111111111111111111111111111111112",
    //     },
    //   ],
    //   preset: activeBuyPreset,
    //   slippage: preset.slippage,
    //   mev_protect: false,
    //   auto_tip: preset.autoTipEnabled,
    //   fee: preset.fee,
    //   tip: preset.tip,
    //   module: "Quick Buy",
    // });
  };

  const activeSellPreset = convertPresetKeyToNumber(
    useActivePresetStore((s) => s.sellPanelActivePreset),
  );

  //! ## [OLD HANDLE QUICK BUY FUNCTION❌] ##
  // const sellMutation = useMutation({
  //   mutationFn: submitTransaction,
  //   onSuccess: () => {
  //     queryClient.refetchQueries({
  //       queryKey: ["wallets-balance"],
  //     });
  //   },

  //   onError: (error: Error) => {
  //     // toast.custom((t: any) => (
  //     //   <CustomToast
  //     //     tVisibleState={t.visible}
  //     //     message={error.message}
  //     //     state="ERROR"
  //     //   />
  //     // ));
  //     errorToast(error.message);
  //   },
  // });

  const sellPresets = useQuickSellSettingsStore((state) => state.presets);
  const priceMessage = useTokenMessageStore((state) => state.priceMessage);
  const solPrice = priceMessage?.price_sol || priceMessage?.price_base || 0;
  const handleSellClick: SubmitHandler<FormData> = async (data) => {
    const presetKey = convertNumberToPresetKey(
      activeSellPreset,
    ) as keyof typeof sellPresets;
    const preset = sellPresets[presetKey];
    if (!preset || typeof preset === "boolean") return;

    // Process all wallets with valid percentages
    const walletsToSell = Object.entries(data.percentages || {})
      ?.filter(([_, percentage]) => Number(percentage) > 0)
      ?.map(([address, percentage]) => {
        // If it's the "all" option, create entries for all wallets
        if (address === "all") {
          return (finalWallets || [])?.map((wallet) => ({
            address: wallet.address,
            amount: getAmountByWallet(
              (finalHoldings || [])?.find((h) => h.wallet == wallet.address)
                ?.tokens as HoldingsTokenData[],
              Number(percentage),
              "%",
              params,
              solPrice,
            ),
            input_mint: "So11111111111111111111111111111111111111112",
          }));
        }
        return {
          address,
          amount: getAmountByWallet(
            (finalHoldings || [])?.find((h) => h.wallet == address)
              ?.tokens as HoldingsTokenData[],
            Number(percentage),
            "%",
            params,
            solPrice,
          ),
          input_mint: "So11111111111111111111111111111111111111112",
        };
      })
      ?.flat(); // Flatten the array in case we have the "all" option

    // Check if user intended to sell anything
    if ((walletsToSell || []).length === 0) {
      // toast.custom((t: any) => (
      //   <CustomToast
      //     tVisibleState={t.visible}
      //     message="Please set at least one percentage to sell"
      //     state="ERROR"
      //   />
      // ));
      errorToast("Please set at least one percentage to sell");
      return;
    }

    // Check if the intended sell actions result in a valid amount
    const validWalletsToSell = (walletsToSell || []).filter(
      (w) => w.amount > 0,
    );

    if ((validWalletsToSell || []).length === 0) {
      // toast.custom((t: any) => (
      //   <CustomToast
      //     tVisibleState={t.visible}
      //     message="Sell amount is too low or you have no tokens in the selected wallet."
      //     state="ERROR"
      //   />
      // ));
      errorToast(
        "Sell amount is too low or you have no tokens in the selected wallet.",
      );

      // Revert selection on failure to prevent inconsistent state
      Object.keys(data.percentages || {}).forEach((address) => {
        if ((data.percentages?.[address] ?? 0) > 0) {
          setValue(`percentages.${address}`, 0, { shouldValidate: false });
        }
      });
      return;
    }

    const isMaxSell = Object.values(data.percentages || {}).some(
      (p) => p === 100,
    );

    await handleQuickSell({
      amounts: data.amounts,
      percentages: data.percentages,
    })
    // sellMutation.mutate({
    //   mint: (params?.["mint-address"] || params?.["pool-address"]) as string,
    //   type: "sell",
    //   wallets: validWalletsToSell,
    //   preset: activeSellPreset,
    //   amount: validWalletsToSell[0]?.amount || 0, // Using first wallet's amount as reference
    //   slippage: preset.slippage,
    //   mev_protect: false,
    //   auto_tip: preset.autoTipEnabled,
    //   fee: preset?.fee,
    //   module: "Quick Sell",
    //   tip: preset.tip as number,
    //   max: isMaxSell,
    // });
  };

  // Initialize preset percentages for each wallet
  const [walletPresetPercentages, setWalletPresetPercentages] = useState<
    Record<string, number[]>
  >(() => {
    const initialPresets: Record<string, number[]> = {
      all: [25, 50, 100], // Add default presets for "all" wallets
      ...finalWallets.reduce(
        (acc, wallet) => ({
          ...acc,
          [wallet.address]: [25, 50, 100],
        }),
        {},
      ),
    };
    return initialPresets;
  });

  // Handle header drag start
  const handleDragStart = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.closest("input") ||
      target.closest("textarea") ||
      target.closest("select") ||
      target.closest("button")
    ) {
      return;
    }

    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      posX: position.x,
      posY: position.y,
    };
    document.body.style.userSelect = "none";
  };

  const handleToggleModal = () => {
    setOpen(!open);
  };

  // console.log(walletPresetPercentages);

  // Memoize the ref callback to prevent infinite re-renders
  const setTriggerElementRef = useCallback((el: HTMLButtonElement | null) => {
    setTriggerElement(el);
  }, []);

  return (
    <>
      {remainingScreenWidth < 2030 ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <BaseButton
                ref={setTriggerElementRef}
                id="custom-table"
                variant="custom"
                onClick={handleToggleModal}
                className={cn(
                  "h-8 rounded-[23px] border border-solid border-white/10 bg-black/20 font-geistSemiBold text-sm text-white hover:border-primary hover:bg-black/20 hover:text-primary",
                  remainingScreenWidth < 2030 && "px-1.5",
                )}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
              >
                <div className="relative aspect-square size-5 flex-shrink-0">
                  <Image
                    src={
                      isHovered
                        ? "/icons/wallet.png"
                        : "/icons/wallet-white.png"
                    }
                    alt="Table Config Icon"
                    fill
                    quality={50}
                    className="object-contain"
                  />
                </div>
              </BaseButton>
            </TooltipTrigger>
            <TooltipContent>
              <p>Multi Wallet</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        <BaseButton
          ref={setTriggerElementRef}
          id="custom-table"
          variant="custom"
          onClick={handleToggleModal}
          className={cn(
            "h-8 rounded-[23px] border border-solid border-white/10 bg-black/20 font-geistSemiBold text-sm text-white hover:border-primary hover:bg-black/20 hover:text-primary",
            remainingScreenWidth < 2030 && "px-1.5",
          )}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="flex items-center gap-x-1.5">
            <Image
              src={isHovered ? "/icons/wallet.png" : "/icons/wallet-white.png"}
              alt="Table Config Icon"
              quality={50}
              height={16}
              width={16}
              className="object-contain"
            />
            <p>Multi Wallet</p>
          </div>
        </BaseButton>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            style={{
              top: position.y,
              left: position.x,
              width: `${MODAL_DIMENSIONS.width}px`,
              position: "fixed",
            }}
            exit={{
              opacity: 0,
            }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={cn(
              "relative z-[200] overflow-hidden rounded-[8px] border border-border bg-[#313149] shadow-[0_0_20px_0_#000000]",
              isDragging && "cursor-grabbing",
            )}
          >
            {isDragging && (
              <div className="fixed left-0 top-0 z-[200] h-screen w-screen" />
            )}
            <div
              onMouseDown={handleDragStart}
              className="flex w-full cursor-grab items-center justify-between"
            >
              <div className="flex w-full items-center justify-between border-b border-white/[4%] px-3 py-2">
                <h4 className="mr-2 text-nowrap font-geistSemiBold text-sm leading-[18px] text-fontColorPrimary">
                  Multi Wallet Panel
                </h4>
                <button
                  onClick={() => setOpen(false)}
                  className="relative z-[10] ml-auto aspect-square h-6 w-6 flex-shrink-0 duration-300 hover:opacity-70"
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
            </div>

            <div ref={modalContentRef} className="flex flex-col gap-y-4 p-3">
              <div className="px-3">
                {isSellMode ? (
                  <BaseButton
                    onClick={() => setIsSellMode(false)}
                    type="button"
                    variant="primary"
                    className="w-full text-xs"
                  >
                    <Image
                      src="/switch.png"
                      alt="Switch"
                      width={14}
                      height={14}
                    />
                    Switch To Buy
                  </BaseButton>
                ) : (
                  <BaseButton
                    onClick={() => setIsSellMode(true)}
                    type="button"
                    className="w-full bg-[#8CD9B6] text-xs text-background hover:bg-[#8CD9B6] focus:bg-[#8CD9B6]"
                  >
                    <Image
                      src="/switch.png"
                      alt="Switch"
                      width={14}
                      height={14}
                    />
                    Switch To Sell
                  </BaseButton>
                )}
              </div>

              <div className="px-3">
                <hr className="border-[#FFFFFF0A]" />
              </div>

              <div className="flex flex-col gap-y-2 px-3">
                {isSellMode ? (
                  <form
                    onSubmit={(e) => {
                      // console.log("Form submit event triggered");
                      handleSubmit(handleSellClick)(e);
                    }}
                    className="flex w-full flex-col gap-y-2"
                  >
                    {(finalWallets || [])?.map((wallet) => {
                      const walletPresets = walletPresetPercentages[
                        wallet.address
                      ] || [25, 50, 100]; // Fallback to default
                      return (
                        <div
                          key={wallet.address}
                          className="grid w-full grid-cols-6 items-center justify-between rounded-lg"
                        >
                          <div className="text-xs text-white">
                            {wallet.name}
                          </div>
                          <div className="col-span-5 grid grid-cols-3 items-end justify-end gap-2">
                            {(walletPresets || [])?.map((value, index) => (
                              <Controller
                                key={`edit_${wallet.address}_${index}`}
                                name={`percentages.${wallet.address}`}
                                control={control}
                                render={({ field }) => (
                                  <AmountInputWithButton
                                    index={index}
                                    value={value}
                                    formValue={Number(field.value)}
                                    onButtonClick={(newValue) => {
                                      field.onChange(newValue);
                                      // Trigger immediate sell action
                                      const data = {
                                        percentages: {
                                          [wallet.address]: newValue,
                                        },
                                      };
                                      handleSellClick(data);
                                    }}
                                    onValueChange={(newValue) => {
                                      setWalletPresetPercentages((prev) => ({
                                        ...prev,
                                        [wallet.address]: (
                                          prev[wallet.address] || [20, 40, 50]
                                        )?.map((v, i) =>
                                          i === index ? newValue : v,
                                        ),
                                      }));
                                    }}
                                  />
                                )}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                    <hr className="border-[#FFFFFF0A]" />

                    {/* All Wallets option with new styling */}
                    <div className="flex w-full items-center justify-between rounded-lg border border-[#49495E] bg-[#393950] p-3">
                      <div className="text-xs text-white">All Wallets</div>
                      <div className="grid grid-cols-3 items-center justify-end gap-2">
                        {walletPresetPercentages["all"]?.map((value, index) => (
                          <Controller
                            key={`edit_all_box_${index}`}
                            name={`percentages.all`}
                            control={control}
                            render={({ field }) => (
                              <AmountInputWithButton
                                index={index}
                                value={value}
                                formValue={Number(field.value)}
                                onButtonClick={(newValue) => {
                                  field.onChange(newValue);
                                  // Trigger immediate sell action for all wallets
                                  const data = {
                                    percentages: {
                                      all: newValue,
                                    },
                                  };
                                  handleSellClick(data);
                                }}
                                onValueChange={(newValue) => {
                                  setWalletPresetPercentages((prev) => ({
                                    ...prev,
                                    all: (prev.all || [20, 40, 50])?.map(
                                      (v, i) => (i === index ? newValue : v),
                                    ),
                                  }));
                                }}
                              />
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  </form>
                ) : (
                  <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="flex flex-col gap-y-2"
                  >
                    <div className="nova-scroller max-h-[300px]">
                      <div className="flex flex-col gap-y-2">
                        {(finalWallets || [])?.map((wallet) => {
                          return (
                            <div
                              key={wallet?.address}
                              className="flex items-center justify-between gap-x-2 rounded-lg"
                            >
                              <span className="font-geist flex-1 truncate text-sm font-normal leading-[18px] text-fontColorPrimary">
                                {wallet?.name}
                              </span>
                              <div className="flex items-center gap-x-2">
                                <div className="w-[174px]">
                                  <Controller
                                    name={`amounts.${wallet?.address}`}
                                    control={control}
                                    render={({ field }) => (
                                      <div className="flex flex-col gap-1">
                                        <Input
                                          value={field.value}
                                          onNumericValueChange={({
                                            floatValue,
                                          }) => {
                                            if (floatValue !== undefined) {
                                              const amount =
                                                floatValue.toString();
                                              field.onChange(amount);
                                              setAmount(
                                                wallet?.address,
                                                amount,
                                              );
                                            } else {
                                              field.onChange("");
                                              setAmount(wallet?.address, "");
                                            }
                                          }}
                                          disabled={!Number(wallet?.balance)}
                                          type="text"
                                          isError={
                                            !!errors?.amounts?.[wallet?.address]
                                          }
                                          isNumeric={true}
                                          decimalScale={9}
                                          placeholder="Amount"
                                          className={cn(
                                            "h-[32px]",
                                            errors?.amounts?.[
                                            wallet?.address
                                            ] && "border-red-500",
                                            field?.value && "bg-[#FFFFFF14]",
                                          )}
                                          onBlur={field?.onBlur}
                                          name={field?.name}
                                          ref={(el) => {
                                            field?.ref(el);
                                            inputRefs.current[wallet?.address] =
                                              el;
                                          }}
                                          onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                              e.preventDefault();
                                              handleBuyClick(wallet?.address);
                                            }
                                          }}
                                          suffixEl={
                                            <div className="absolute right-2">
                                              <Pencil
                                                height={14}
                                                width={14}
                                                className="text-[#9191A4]"
                                              />
                                            </div>
                                          }
                                          prefixEl={
                                            <div
                                              className={cn(
                                                "absolute left-3 flex aspect-square size-4 flex-shrink-0 items-center justify-center",
                                              )}
                                            >
                                              <CachedImage
                                                src="/icons/solana-sq.svg"
                                                alt="Solana SQ Icon"
                                                fill
                                                quality={50}
                                                className="object-contain"
                                              />
                                            </div>
                                          }
                                        />
                                      </div>
                                    )}
                                  />
                                </div>
                                <button
                                  type="button"
                                  disabled={!Number(wallet?.balance)}
                                  style={{
                                    cursor: "pointer !important",
                                  }}
                                  onClick={() => {
                                    handleBuyClick(wallet?.address);
                                  }}
                                  role="button"
                                  className="!cursor-pointer rounded-md bg-secondary px-4 py-[7px] font-geistSemiBold text-xs text-fontColorPrimary hover:bg-[#1f1f2a]"
                                >
                                  Buy
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <hr className="border-[#FFFFFF0A]" />

                    <BaseButton
                      type="submit"
                      variant="custom"
                      className="font-geist flex h-[30px] min-w-[40px] items-center justify-center gap-2 self-stretch rounded-lg bg-[#df74ff] py-2 pl-2 pr-3 text-xs font-semibold leading-[16px] text-background hover:bg-[#df74ff]/90"
                    >
                      Buy on All Wallets
                    </BaseButton>
                  </form>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

const AmountInputWithButton = ({
  index,
  value,
  formValue,
  onButtonClick,
  onValueChange,
}: AmountInputWithButtonProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  const handlePencilClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleInputBlur = () => {
    setIsEditing(false);
    if (inputValue !== value) {
      onValueChange(inputValue);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const newValue = Math.min(Number(inputValue) || 0, 100);
    setInputValue(newValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setIsEditing(false);
      if (inputValue !== value) {
        onValueChange(inputValue);
      }
      onButtonClick(inputValue); // Set the value on Enter
    }
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  return (
    <div key={`edit_${index}`} className="flex w-full flex-grow justify-end">
      {isEditing ? (
        <Input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Amount"
          className="w-full"
          suffixEl={
            <div className="absolute right-3 flex aspect-square h-4 w-4 flex-shrink-0 items-center justify-center text-fontColorPrimary">
              %
            </div>
          }
          onBlur={handleInputBlur}
          ref={inputRef}
        />
      ) : (
        <BaseButton
          type="button"
          variant="custom"
          size="long"
          onClick={() => {
            if (formValue === inputValue) {
              onButtonClick(0);
            } else {
              onButtonClick(inputValue);
            }
          }}
          className={cn(
            "flex h-[32px] w-full items-center justify-between rounded-[23px] border border-solid border-white/[8%] bg-white/[4%] text-white transition-colors duration-200 hover:border-[#DF74FF] hover:bg-[#DF74FF]/[8%] hover:text-[#DF74FF] focus:border-white/[8%] focus:text-white disabled:opacity-[70%]",
          )}
        >
          <span
            className={cn(
              "inline-block text-nowrap font-geistSemiBold text-sm leading-3",
            )}
          >
            {inputValue}%
          </span>
          <div
            onClick={handlePencilClick}
            className="text-white hover:text-white"
          >
            <PencilIcon height={12} width={12} />
          </div>
        </BaseButton>
      )}
    </div>
  );
};
