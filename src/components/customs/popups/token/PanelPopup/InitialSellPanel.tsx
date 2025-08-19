import { submitTransaction } from "@/apis/rest/transaction/submit-transaction";
import BaseButton from "@/components/customs/buttons/BaseButton";
import Separator from "@/components/customs/Separator";
import { cn } from "@/libraries/utils";
import { convertNumberToPresetKey } from "@/utils/convertPreset";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useQuickAmountStore } from "@/stores/dex-setting/use-quick-amount.store";
import { useQuickSellSettingsStore } from "@/stores/setting/use-quick-sell-settings.store";
import { useCurrentTokenChartPriceStore } from "@/stores/token/use-current-token-chart-price.store";
import { useTokenMessageStore } from "@/stores/token/use-token-messages.store";
import {
  HoldingsConvertedMessageType,
  HoldingsTokenData,
} from "@/types/ws-general";
import { updateQuickSellPreset } from "@/apis/rest/settings/settings";
import { useFeeTip } from "@/stores/setting/use-fee-tip.store";
import { DEFAULT_QUICK_PICK_PERCENTAGE_LIST } from "@/components/customs/SellBuyInputAmount";
import { formatAmountWithoutLeadingZero } from "@/utils/formatAmount";
import { useCustomToast } from "@/hooks/use-custom-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSwap } from "@/hooks/useSwap";
import { solToLamports } from "@/utils/solToLamport";

// const getAmountByWallet = (
//   token: HoldingsTokenData[],
//   amount: number,
//   type: "%" | "SOL",
//   params: Params,
//   solPrice: number,
// ) => {
//   const tokenData = (token ?? [])?.find(
//     (t) =>
//       t.token.mint ===
//       ((params?.["mint-address"] || params?.["pool-address"]) as string),
//   );
//
//   if (!tokenData) return 0;
//
//   let finalAmount = 0;
//
//   if (type === "%") {
//     if (amount) {
//       try {
//         // Ensure percentage is between 0 and 100
//         const percentage = Math.min(Math.max(Number(amount), 0), 100) / 100;
//         const totalSellAmount = tokenData.balance * percentage;
//         finalAmount = totalSellAmount;
//       } catch (error) {
//         console.warn("Error calculating sell amount:", error);
//       }
//     }
//   } else {
//     finalAmount = tokenData.investedBase || 0;
//   }
//
//   return !isNaN(finalAmount) ? finalAmount : 0;
// };

const InitialSellPanel = ({
  finalHoldings,
  messageChangedCount,
  isSmallScreen = false,
  activeSellPreset = 1,
  autoFeeEnabled,
}: {
  finalHoldings: HoldingsConvertedMessageType[];
  messageChangedCount: number;
  isSmallScreen?: boolean;
  activeSellPreset: number;
  autoFeeEnabled: boolean;
}) => {
  const params = useParams();
  const queryClient = useQueryClient();
  const cosmoWallets = useQuickAmountStore((state) => state.cosmoWallets);
  const [walletWithAmount, setWalletWithAmount] = useState<
    {
      address: string;
      amount: number;
      input_mint: string;
      remaining: number;
    }[]
  >([]);
  const { success, error: errorToast } = useCustomToast();

  // State for edit mode
  const [isEditInstantSell, setIsEditInstantSell] = useState<boolean>(false);
  const [editablePresetValues, setEditablePresetValues] = useState<number[]>(
    [],
  );
  const originalValuesRef = useRef<number[]>([]);

  // Ref for the form container to detect key presses
  // const formContainerRef = useRef<HTMLDivElement>(null);

  // Get settings from stores
  const sellPresets = useQuickSellSettingsStore((state) => state.presets);
  const updatePresets = useQuickSellSettingsStore((state) => state.setPresets);

  const currentGlobalChartPrice = useCurrentTokenChartPriceStore(
    (state) => state.price,
  );

  // Calculation total sell amount
  const priceMessage = useTokenMessageStore((state) => state.priceMessage);
  const solPrice = priceMessage?.price_sol || priceMessage?.price_base || 0;

  useEffect(() => {
    const walletWithAmountTemp = [...walletWithAmount];

    // Selected wallet string
    const selectedWalletsString = (cosmoWallets || [])?.map((w) => w?.address);
    const selectedWalletWithAmountString = (walletWithAmountTemp || [])?.map(
      (w) => w?.address,
    );

    // Create final wallet with correct amount
    (selectedWalletsString || []).forEach((w) => {
      if (!selectedWalletWithAmountString.includes(w)) {
        walletWithAmountTemp.push({
          address: w,
          amount: 0,
          input_mint: "So11111111111111111111111111111111111111112",
          remaining: 0,
        });
      }
    });

    const finalWalletWithAmount = (walletWithAmountTemp || [])
      ?.map((w) => {
        if (
          selectedWalletsString.includes(w.address) &&
          !!finalHoldings?.find((h) => h.wallet === w.address)?.tokens
        ) {
          const walletTokens = (finalHoldings || [])?.find(
            (h) => h.wallet === w.address,
          )?.tokens as HoldingsTokenData[];

          // Find the specific token for this mint
          const tokenData = (walletTokens || [])?.find(
            (t) =>
              t.token.mint ===
              ((params?.["mint-address"] ||
                params?.["pool-address"]) as string),
          );

          const updatedAmount = tokenData?.invested_base || 0;
          const remaining = tokenData?.balance || 0;

          return {
            address: w.address,
            amount: updatedAmount,
            input_mint: "So11111111111111111111111111111111111111112",
            remaining: remaining,
          };
        } else return null;
      })
      ?.filter((w) => !!w);

    setWalletWithAmount(finalWalletWithAmount);
  }, [
    messageChangedCount,
    cosmoWallets,
    params?.["mint-address"] || (params?.["pool-address"] as string),
    finalHoldings,
  ]);

  // Sell mutation
  const [_, setCurrentTXInfoString] = useState<string>("");
  //! ## [OLD HANDLE QUICK BUY FUNCTION❌] ##
  // const sellMutation = useMutation({
  //   mutationFn: submitTransaction,
  //   onMutate: (data) => {
  //     setCurrentTXInfoString(JSON.stringify(data));
  //   },
  //   onSuccess: () => {
  //     setCurrentTXInfoString("");
  //     queryClient.refetchQueries({
  //       queryKey: ["wallets-balance"],
  //     });
  //   },
  //   onError: (error: Error) => {
  //     setCurrentTXInfoString("");
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

  const { quickSell, isLoadingFetch: isLoadingSwap } = useSwap();

  const handleQuickSell = async () => {
    try {

      const presetKey = convertNumberToPresetKey(activeSellPreset)
      let signature: string | undefined;
      signature = await quickSell({
        priorityFee: sellPresets[presetKey].fee as number,
        mint: params?.["mint-address"] as string,
        module: "Quick Sell",
        type: "sell",
        params: {
          sellAmount: walletWithAmount.map((w) => ({
            walletAddresses: w.address,
            amount: solToLamports(w.amount),
          })),
          slippage: sellPresets[presetKey].slippage,
        }
      });

      if (!signature) {
        throw new Error("Failed to get transaction signature");
      }
      setCurrentTXInfoString(signature);
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

  // Add updateSettings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: updateQuickSellPreset,
    onSuccess: () => {
      // toast.custom((t: any) => (
      //   <CustomToast
      //     tVisibleState={t.visible}
      //     message="Quick sell presets updated successfully"
      //     state="SUCCESS"
      //   />
      // ));
      success("Quick sell presets updated successfully");
      // Refetch settings after successful update
      queryClient.invalidateQueries({ queryKey: ["settings"] });
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

  const feetipData = useFeeTip((state) => state.data);

  // Save changes to both store and backend
  const savePresetValues = () => {
    if (!sellPresets || updateSettingsMutation.isPending) return;
    // Check for duplicate values before saving
    let newValues = [...editablePresetValues];

    const presetKey = convertNumberToPresetKey(
      activeSellPreset,
    ) as keyof typeof sellPresets;

    // Create the updated preset object for the store
    const updatedPresets = { ...sellPresets };
    const updatedPreset = { ...updatedPresets[presetKey] };
    updatedPreset.amounts = newValues;
    updatedPresets[presetKey] = updatedPreset;

    // Update the local store first
    updatePresets(updatedPresets);

    // Prepare data for the API call
    const submitData = {
      preset: presetKey?.replace("preset", ""),
      slippage: updatedPreset?.slippage,
      autoTipEnabled: updatedPreset?.autoTipEnabled,
      fee: updatedPreset?.fee,
      tip: updatedPreset?.tip,
      processor: updatedPreset?.processor,
      amounts: newValues,
    };

    // Make the API call to update backend
    updateSettingsMutation.mutate(submitData);
  };

  // Add global keyboard event listener for Enter key when in edit mode
  useEffect(() => {
    const handleGlobalKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Enter" && isEditInstantSell) {
        e.preventDefault();
        savePresetValues();
        if (!updateSettingsMutation.isPending) {
          setIsEditInstantSell(false);
        }
      }
    };

    if (isEditInstantSell) {
      window.addEventListener("keydown", handleGlobalKeyDown);
    }

    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, [isEditInstantSell, editablePresetValues]);

  // Handle escape key to cancel editing
  useEffect(() => {
    const handleEscapeKey = () => {
      if (isEditInstantSell) {
        setEditablePresetValues([...originalValuesRef.current]);
        setIsEditInstantSell(false);
      }
    };

    window.addEventListener("escapePressed", handleEscapeKey);

    return () => {
      window.removeEventListener("escapePressed", handleEscapeKey);
    };
  }, [isEditInstantSell]);

  const presetKey = convertNumberToPresetKey(activeSellPreset);

  // Full preset (always full length)
  const allAmounts = sellPresets[presetKey]?.amounts?.length
    ? [...sellPresets[presetKey].amounts]
    : [...DEFAULT_QUICK_PICK_PERCENTAGE_LIST];

  // Only used for rendering
  const visibleAmounts = isSmallScreen ? allAmounts.slice(0, 4) : allAmounts;

  // Grid logic based on visible count
  let gridColsClass = "grid-cols-3";

  const count = visibleAmounts.length;

  if (isSmallScreen) {
    gridColsClass = "grid-cols-4";
  } else if (count <= 3) {
    gridColsClass = `grid-cols-${count}`;
  } else if (count === 4) {
    gridColsClass = "grid-cols-4";
  } else if (count <= 6) {
    gridColsClass = "grid-cols-3";
  } else {
    gridColsClass = "grid-cols-4";
  }

  const handleSellInitial = async () => {
    if (!cosmoWallets?.[0]?.address || !sellPresets) return;

    // Validate and calculate amounts for each wallet
    const walletsWithInitialAmount = [];
    const errorWallets = [];
    const walletsWithoutTokens = [];

    for (const wallet of cosmoWallets) {
      const walletHoldings = (finalHoldings || [])?.find(
        (h) => h.wallet === wallet.address,
      );

      const tokenData = walletHoldings?.tokens?.find(
        (t) =>
          t.token.mint ===
          ((params?.["mint-address"] || params?.["pool-address"]) as string),
      );

      // Skip wallets without token data
      if (!tokenData) {
        walletsWithoutTokens.push(wallet.address);
        continue;
      }

      const amountSell =
        tokenData.invested_base && currentGlobalChartPrice
          ? tokenData.invested_base / Number(currentGlobalChartPrice)
          : 0;

      // Skip wallets with no amount to sell
      if (amountSell <= 0) {
        walletsWithoutTokens.push(wallet.address);
        continue;
      }

      if (tokenData.balance === 0) {
        errorToast("Balance is 0. Sell failed.");
        return;
      }

      // Check if amount exceeds balance
      if (tokenData.balance && amountSell > tokenData.balance) {
        errorWallets.push({
          address: wallet.address,
          required: amountSell,
          available: tokenData.balance,
        });
        continue;
      }

      walletsWithInitialAmount.push({
        address: wallet.address,
        amount: amountSell,
        input_mint: "So11111111111111111111111111111111111111112",
      });
    }

    // Handle validation errors
    if (errorWallets.length > 0) {
      errorToast(
        `PnL is negative in ${errorWallets.length} wallet(s). Sell failed.`,
      );
      return;
    }

    // Handle no tokens case
    if (walletsWithInitialAmount.length === 0) {
      const message =
        walletsWithoutTokens.length > 0
          ? "No wallets have tokens to sell"
          : "No tokens found to sell";

      errorToast(message);
      return;
    }

    const presetKey = convertNumberToPresetKey(
      activeSellPreset,
    ) as keyof typeof sellPresets;
    const preset = sellPresets[presetKey];

    // Submit the transaction
    //! ## [OLD HANDLE QUICK BUY FUNCTION❌] ##
    // sellMutation.mutate({
    //   mint: (params?.["mint-address"] || params?.["pool-address"]) as string,
    //   type: "sell",
    //   wallets: walletsWithInitialAmount,
    //   preset: activeSellPreset,
    //   slippage: preset.slippage,
    //   mev_protect: false,
    //   auto_tip: preset.autoTipEnabled,
    //   fee: (autoFeeEnabled ? feetipData.fee : preset?.fee) as number,
    //   module: "Quick Sell",
    //   tip: (autoFeeEnabled ? feetipData.tip : preset.tip) as number,
    //   max: true,
    // });
    await handleQuickSell();
  };

  const totalSOL = useMemo(() => {
    const currBalance = walletWithAmount.reduce(
      (total, wallet) => total + wallet.remaining,
      0,
    );
    return currBalance * solPrice;
  }, [walletWithAmount]);

  return (
    <div
      className="flex h-1/3 w-full flex-col gap-y-2 px-3"
    //   ref={formContainerRef}
    >
      <Separator
        className={cn(isSmallScreen ? "mt-0" : "mt-4")}
        color="#ffffff0a"
        fixedHeight={1}
      />
      <div className="flex items-center gap-x-2">
        <p className="w-56 font-geistRegular text-sm font-normal leading-[18px] text-fontColorPrimary">
          Available Token:
        </p>
        <div className="w-full rounded-md bg-white/[0.08] py-[3px] text-center text-fontColorPrimary">
          {formatAmountWithoutLeadingZero(totalSOL)} SOL
        </div>
        <TooltipProvider>
          <Tooltip delayDuration={0}>
            <TooltipTrigger>
              <BaseButton
                type="button"
                variant="primary"
                className="bg-success px-2 py-[7px] hover:bg-success/80 focus:bg-success disabled:bg-success/60"
                onClick={handleSellInitial}
                disabled={isLoadingSwap}
                prefixIcon={
                  <div className="relative aspect-square size-4">
                    <Image
                      src="/icons/black-initialsell.svg"
                      alt="Black Initial Sell Icon"
                      fill
                      quality={50}
                      className="object-contain"
                    />
                  </div>
                }
              />
            </TooltipTrigger>
            <TooltipContent
              isWithAnimation={false}
              align="center"
              side="top"
              className="z-[1000] max-h-[50dvh] rounded-[6px] border border-border bg-secondary px-3 py-0.5"
            >
              Sell Initial
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};

export default InitialSellPanel;
