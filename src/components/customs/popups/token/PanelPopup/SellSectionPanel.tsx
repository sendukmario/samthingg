import { useQuickAmountStore } from "@/stores/dex-setting/use-quick-amount.store";
import { submitTransaction } from "@/apis/rest/transaction/submit-transaction";
import BaseButton from "@/components/customs/buttons/BaseButton";
import PresetSelectionButtons from "@/components/customs/PresetSelectionButtons";
import { DEFAULT_QUICK_PICK_PERCENTAGE_LIST } from "@/components/customs/SellBuyInputAmount";
import Separator from "@/components/customs/Separator";
import { useLatestTransactionMessageStore } from "@/stores/use-latest-transactions.store";
import { Input } from "@/components/ui/input";
import { cn } from "@/libraries/utils";
import { useQuickSellSettingsStore } from "@/stores/setting/use-quick-sell-settings.store";
import { useTokenHoldingStore } from "@/stores/token/use-token-holding.store";
import { useTokenMessageStore } from "@/stores/token/use-token-messages.store";
import {
  HoldingsConvertedMessageType,
  HoldingsTokenData,
} from "@/types/ws-general";
import {
  convertNumberToPresetId,
  convertNumberToPresetKey,
  convertPresetIdToNumber,
} from "@/utils/convertPreset";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import React, { useEffect, useState, useRef, KeyboardEvent } from "react";
// Import the API function for updating settings
import { updateQuickSellPreset } from "@/apis/rest/settings/settings";
import { useFeeTip } from "@/stores/setting/use-fee-tip.store";
import { SuperNovaActived } from "@/components/customs/forms/token/SuperNovaActived";
import { Params } from "next/dist/server/request/params";
import { useCustomToast } from "@/hooks/use-custom-toast";
import { useSwap } from "@/hooks/useSwap";
import { solToLamports } from "@/utils/solToLamport";
import { multiplyBigIntByPercentage } from "@/utils/multiplyBigIntByPercentage";

// const quickPickPercentageList: number[] = [10, 30, 50, 70];

const getAmountByWallet = (
  token: HoldingsTokenData[],
  amount: number,
  type: "%" | "SOL",
  params: Params,
  solPrice: number,
) => {
  const decimals = token?.find((t) => t.token.mint === (params?.["mint-address"] || (params?.["pool-address"] as string)))?.token?.quote_decimals || 6;
  const totalHoldings =
    BigInt(token?.find(
      (t) =>
        t.token.mint ===
        ((params?.["mint-address"] || params?.["pool-address"]) as string),
    )?.balance_str || 0);
  let finalAmount = BigInt(0);
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
      finalAmount = solToLamports(Number(amount));
    }
  }
  return finalAmount;
};
const SellSectionPanel = ({
  parentWidth,
  finalHoldings,
  messageChangedCount,
  // walletSelectionClassName,
  buttonStyle,
  isSmallScreen = false,
  activeSellPreset = 1,
  setActiveSellPreset = () => { },
  autoFeeEnabled,
  setAutoFeeEnabled,
}: {
  parentWidth: number;
  finalHoldings: HoldingsConvertedMessageType[];
  messageChangedCount: number;
  walletSelectionClassName?: string;
  buttonStyle?: React.CSSProperties | undefined;
  isSmallScreen?: boolean;
  activeSellPreset: number;
  setActiveSellPreset: (value: number) => void;
  autoFeeEnabled: boolean;
  setAutoFeeEnabled: (autoFeeEnabled: boolean) => void;
}) => {
  const params = useParams();
  const queryClient = useQueryClient();
  const cosmoWallets = useQuickAmountStore((state) => state.cosmoWallets);
  // const setCosmoWallets = useQuickAmountStore((state) => state.setCosmoWallets);
  const { success, error: errorToast } = useCustomToast();
  const [sellAmountType] = useState<"SOL" | "%">("%");
  const [sellValue] = useState(0);
  const [walletWithAmount, setWalletWithAmount] = useState<
    {
      address: string;
      amount: bigint;
      input_mint: string;
    }[]
  >([]);

  // State for edit mode
  const [isEditInstantSell, setIsEditInstantSell] = useState<boolean>(false);
  const [editablePresetValues, setEditablePresetValues] = useState<number[]>(
    [],
  );
  const originalValuesRef = useRef<number[]>([]);

  // Ref for the form container to detect key presses
  const formContainerRef = useRef<HTMLDivElement>(null);

  // Get settings from stores
  const sellPresets = useQuickSellSettingsStore((state) => state.presets);
  const updatePresets = useQuickSellSettingsStore((state) => state.setPresets);

  // Initialize editable preset values when active preset changes
  useEffect(() => {
    if (sellPresets) {
      const presetKey = convertNumberToPresetKey(
        activeSellPreset,
      ) as keyof typeof sellPresets;
      const preset = sellPresets[presetKey];

      // Use preset amounts if available, otherwise default

      const amounts = preset?.amounts?.length
        ? [...preset.amounts]
        : [...DEFAULT_QUICK_PICK_PERCENTAGE_LIST];

      setEditablePresetValues(amounts);

      // Store original values for potential cancel
      originalValuesRef.current = [...amounts];
    }
  }, [activeSellPreset, sellPresets, isSmallScreen]);

  // const currentGlobalChartPrice = useCurrentTokenChartPriceStore(
  //   (state) => state.price,
  // );

  // Calculation total sell amount
  const priceMessage = useTokenMessageStore((state) => state.priceMessage);
  const solPrice = priceMessage?.price_sol || priceMessage?.price_base || 0;

  useEffect(() => {
    const amount = sellValue;

    const walletWithAmountTemp = walletWithAmount;

    // Selected wallet string
    const selectedWalletsString = (cosmoWallets || [])?.map((w) => w?.address);
    const selectedWalletWithAmountString = (walletWithAmountTemp || [])?.map(
      (w) => w.address,
    );

    // Create final wallet with correct amount
    (selectedWalletsString || [])?.map((w) => {
      if (!selectedWalletWithAmountString.includes(w)) {
        walletWithAmountTemp.push({
          address: w,
          amount: BigInt(0),
          input_mint: "So11111111111111111111111111111111111111112",
        });
      }
    });
    const finalWalletWithAmount = (walletWithAmountTemp || [])
      ?.map((w) => {
        if (
          selectedWalletsString.includes(w.address) &&
          !!finalHoldings?.find((h) => h.wallet == w.address)?.tokens
        ) {
          const updatedAmount = getAmountByWallet(
            finalHoldings?.find((h) => h.wallet == w.address)
              ?.tokens as HoldingsTokenData[],
            amount,
            sellAmountType,
            params,
            solPrice,
          );

          return {
            address: w.address,
            amount: updatedAmount,
            input_mint: "So11111111111111111111111111111111111111112",
          };
        } else return null;
      })
      ?.filter((w) => !!w);
    setWalletWithAmount(finalWalletWithAmount);
  }, [
    messageChangedCount,
    sellValue,
    cosmoWallets,
    sellAmountType,
    params?.["mint-address"] || (params?.["pool-address"] as string),
  ]);

  // Sell mutation
  const [_, setCurrentTXInfoString] = useState<string>("");
  //! ## [OLD HANDLE QUICK BUY FUNCTION❌] ##
  // const sellMutation = useMutation({
  //   mutationFn: submitTransaction,
  //   onMutate: (data) => {
  //     setCurrentTXInfoString(JSON.stringify(data));
  //     queryClient.refetchQueries({
  //       queryKey: ["wallets-balance"],
  //     });
  //   },
  //   onSuccess: () => {
  //     setCurrentTXInfoString("");
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

  const { quickSell, isLoadingFetch: isLoadingSwap } = useSwap();
  const { error: toastError } = useCustomToast()

  const handleQuickSell = async (
    amount: number,
  ) => {
    try {
      const finalWallets = cosmoWallets.map((w) => {
        const amountPerWallet = getAmountByWallet(
          finalHoldings?.find((h) => h.wallet == w?.address)
            ?.tokens as HoldingsTokenData[],
          amount,
          "%",
          params,
          solPrice,
        )
        if (amountPerWallet <= 0) {
          toastError("Wallet " + w.address + " has insufficient funds")
          return null;
        }
        return {
          walletAddresses: w.address,
          amount: amountPerWallet
        }
      }).filter((w) => !!w)

      const presetKey = convertNumberToPresetKey(activeSellPreset);
      const signature = await quickSell({
        priorityFee: sellPresets[presetKey].fee as number,
        mint: params?.["mint-address"] as string,
        module: "Quick Sell",
        type: "sell",
        params: {
          sellAmount: finalWallets,
          slippage: sellPresets[presetKey].slippage as number,
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

  const isLoading = useTokenHoldingStore((state) => state.isLoading);
  const latestTransactionMessages = useLatestTransactionMessageStore(
    (state) => state.messages,
  );
  const feetipData = useFeeTip((state) => state.data);
  const handleQuickSellTrade = async (amount: number) => {
    // /* console.log("FORM VALUE ✨✨", amount) */
    // const walletWithAmountTemp =
    //   walletWithAmount;
    //
    // // Selected wallet string
    // const selectedWalletsString = (cosmoWallets || [])?.map((w) => w.address);
    // const selectedWalletWithAmountString = (walletWithAmountTemp || [])?.map(
    //   (w) => w.address,
    // );
    //
    // // Create final wallet with correct amount
    // (selectedWalletsString || [])?.map((w) => {
    //   if (!selectedWalletWithAmountString.includes(w)) {
    //     walletWithAmountTemp.push({
    //       address: w,
    //       amount: 0,
    //       input_mint: "So11111111111111111111111111111111111111112",
    //     });
    //   }
    // });
    // const finalWalletWithAmount = (walletWithAmountTemp || [])
    //   ?.map((w) => {
    //     if (selectedWalletsString.includes(w.address)) {
    //       const updatedAmount = getAmountByWallet(
    //         finalHoldings?.find((h) => h.wallet == w.address)
    //           ?.tokens as HoldingsTokenData[],
    //         amount,
    //         "%",
    //         params,
    //         solPrice,
    //       );
    //
    //       return {
    //         address: w.address,
    //         amount: updatedAmount,
    //         input_mint: "So11111111111111111111111111111111111111112",
    //       };
    //     } else return null;
    //   })
    //   ?.filter((w) => !!w);
    //
    // const updatedfinalWalletWithAmount = (finalWalletWithAmount || [])?.map(
    //   (w) => {
    //     const matchingTx = (latestTransactionMessages || [])?.find(
    //       (tx) => tx.wallet === w.address,
    //     );
    //     if (matchingTx) {
    //       return {
    //         ...w,
    //         amount: matchingTx.balance,
    //         input_mint: "So11111111111111111111111111111111111111112",
    //       };
    //     }
    //
    //     return w;
    //   },
    // );
    //
    // if (isLoading) {
    //   setWalletWithAmount(updatedfinalWalletWithAmount);
    //   console.warn("BALANCE ✨ - Sell Section Panel", {
    //     updatedfinalWalletWithAmount,
    //   });
    // } else {
    //   setWalletWithAmount(finalWalletWithAmount);
    // }
    //
    // if (!(cosmoWallets || [])?.[0]?.address || !sellPresets) return;
    //
    // const presetKey = convertNumberToPresetKey(
    //   activeSellPreset,
    // ) as keyof typeof sellPresets;
    // const preset = sellPresets[presetKey];

    //! ## [OLD HANDLE QUICK BUY FUNCTION❌] ##
    await handleQuickSell(amount);
    // sellMutation.mutate({
    //   mint: (params?.["mint-address"] || params?.["pool-address"]) as string,
    //   type: "sell",
    //   wallets: isLoading ? updatedfinalWalletWithAmount : finalWalletWithAmount,
    //   preset: activeSellPreset,
    //   amount: sellValue,
    //   slippage: preset.slippage,
    //   mev_protect: false,
    //   auto_tip: preset.autoTipEnabled,
    //   // fee: preset.fee,
    //   fee: (autoFeeEnabled ? feetipData.fee : preset?.fee) as number,
    //   // tip: preset.tip,
    //   module: "Quick Sell",
    //   tip: (autoFeeEnabled ? feetipData.tip : preset.tip) as number,
    //   max: amount === 100,
    // });
  };

  // Handle editing a preset value (only updates local state)
  const handleEditPresetValue = (index: number, value: number) => {
    const clamped = Math.min(Math.max(value, 1), 100);
    const newValues = [...editablePresetValues];
    newValues[index] = clamped;
    setEditablePresetValues(newValues);
  };

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

  // Handle edit button click
  const handleClickEdit = () => {
    if (isEditInstantSell) {
      // Save changes when exiting edit mode
      savePresetValues();
      if (!updateSettingsMutation.isPending) {
        setIsEditInstantSell(false);
      }
    } else {
      // Enter edit mode and backup current values
      originalValuesRef.current = [...editablePresetValues];
      setIsEditInstantSell(true);
    }
  };

  // Handle key down event to detect Enter key press
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && isEditInstantSell) {
      e.preventDefault();
      savePresetValues();
      if (!updateSettingsMutation.isPending) {
        setIsEditInstantSell(false);
      }
    }
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

  // const handleSellInitial = () => {
  //   if (!cosmoWallets?.[0]?.address || !sellPresets) return;
  //
  //   // Validate and calculate amounts for each wallet
  //   const walletsWithInitialAmount = [];
  //   const errorWallets = [];
  //   const walletsWithoutTokens = [];
  //
  //   for (const wallet of cosmoWallets) {
  //     const walletHoldings = (finalHoldings ?? [])?.find(
  //       (h) => h.wallet === wallet.address,
  //     );
  //
  //     const tokenData = (walletHoldings?.tokens ?? [])?.find(
  //       (t) =>
  //         t.token.mint ===
  //         ((params?.["mint-address"] || params?.["pool-address"]) as string),
  //     );
  //
  //     // Skip wallets without token data
  //     if (!tokenData) {
  //       walletsWithoutTokens.push(wallet.address);
  //       continue;
  //     }
  //
  //     const amountSell =
  //       tokenData.investedBase && currentGlobalChartPrice
  //         ? tokenData.investedBase / Number(currentGlobalChartPrice)
  //         : 0;
  //
  //     // Skip wallets with no amount to sell
  //     if (amountSell <= 0) {
  //       walletsWithoutTokens.push(wallet.address);
  //       continue;
  //     }
  //
  //     // Check if amount exceeds balance
  //     if (tokenData.balance && amountSell > tokenData.balance) {
  //       errorWallets.push({
  //         address: wallet.address,
  //         required: amountSell,
  //         available: tokenData.balance,
  //       });
  //       continue;
  //     }
  //
  //     walletsWithInitialAmount.push({
  //       address: wallet.address,
  //       amount: amountSell,
  //     });
  //   }
  //
  //   // Handle validation errors
  //   if (errorWallets.length > 0) {
  //     // toast.custom((t: any) => (
  //     //   <CustomToast
  //     //     tVisibleState={t.visible}
  //     //     message={`PnL is negative in ${errorWallets.length} wallet(s). Sell failed.`}
  //     //     state="ERROR"
  //     //   />
  //     // ));
  //     errorToast(`PnL is negative in ${errorWallets.length} wallet(s). Sell failed.`)
  //     return;
  //   }
  //
  //   // Handle no tokens case
  //   if (walletsWithInitialAmount.length === 0) {
  //     const message =
  //       walletsWithoutTokens.length > 0
  //         ? "No wallets have tokens to sell"
  //         : "No tokens found to sell";
  //
  //     // toast.custom((t: any) => (
  //     //   <CustomToast
  //     //     tVisibleState={t.visible}
  //     //     message={message}
  //     //     state="ERROR"
  //     //   />
  //     // ));
  //     errorToast(message)
  //     return;
  //   }
  //
  //   const presetKey = convertNumberToPresetKey(
  //     activeSellPreset,
  //   ) as keyof typeof sellPresets;
  //   const preset = sellPresets[presetKey];
  //
  //   // Submit the transaction
  //   sellMutation.mutate({
  //     mint: (params?.["mint-address"] || params?.["pool-address"]) as string,
  //     type: "sell",
  //     wallets: walletsWithInitialAmount,
  //     preset: activeSellPreset,
  //     slippage: preset.slippage,
  //     mev_protect: false,
  //     auto_tip: preset.autoTipEnabled,
  //     fee: (autoFeeEnabled ? feetipData.fee : preset?.fee) as number,
  //     module: "Quick Sell",
  //     tip: (autoFeeEnabled ? feetipData.tip : preset.tip) as number,
  //     max: true,
  //   });
  // };

  return (
    <div
      className="flex max-h-36 w-full flex-col gap-y-2 px-3 pb-4"
      ref={formContainerRef}
    >
      <Separator
        className={cn(isSmallScreen ? "mt-0" : "mt-4")}
        color="#ffffff0a"
        fixedHeight={1}
      />
      <div className="flex w-full flex-col justify-between gap-y-1.5">
        <div className="flex w-full items-center justify-between gap-x-2">
          <h6 className="font-geistLight text-sm font-normal text-fontColorPrimary">
            Sell
          </h6>
          {/* <WalletSelectionButton
            displayVariant="name"
            value={cosmoWallets}
            setValue={(wallet) => {
              setCosmoWallets(wallet);
            }}
            isGlobal={false}
            className={cn("w-[25%]", walletSelectionClassName)}
            maxWalletShow={10}
          /> */}
          <div>
            <PresetSelectionButtons
              autoFeeEnabled={autoFeeEnabled}
              setAutoFeeEnabled={(v) => {
                /* console.log("activeSellPreset🟣", v, autoFeeEnabled) */ setAutoFeeEnabled(
                v,
              );
              }}
              isSmall={isSmallScreen}
              activePreset={convertNumberToPresetId(activeSellPreset)}
              setActivePreset={(value: string) =>
                setActiveSellPreset(convertPresetIdToNumber(value))
              }
              isWithEdit
              isEditing={isEditInstantSell}
              onClickEdit={handleClickEdit}
              isGlobal={false}
              variant="instant-trade"
            />
          </div>
        </div>
      </div>
      <div className="flex w-full items-center gap-x-3 max-md:flex-wrap">
        <div className={cn("grid w-full gap-2", gridColsClass)}>
          {isEditInstantSell
            ? // Edit mode - render editable inputs
            (visibleAmounts || []).map((value, index) => (
              <div key={`edit_${index}`} className="flex flex-col">
                <Input
                  type="text"
                  value={Math.min(Math.max(value, 1), 100)}
                  isNumeric={true}
                  decimalScale={2}
                  onNumericValueChange={({ floatValue }) => {
                    handleEditPresetValue(index, floatValue || 1);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Amount"
                  className={cn(
                    "h-[32px]",
                    parentWidth < 400 && "pr-2 text-xs",
                  )}
                  disabled={updateSettingsMutation.isPending}
                  suffixEl={
                    <span
                      className={cn(
                        "absolute right-3 top-1/2 -translate-y-1/2 text-sm text-fontColorSecondary",
                        parentWidth < 400 && "text-[12px]",
                      )}
                    >
                      %
                    </span>
                  }
                />
              </div>
            ))
            : // Normal mode - render buttons
            (visibleAmounts || []).map((quickPickValue, index) => {
              const isSelected = quickPickValue === sellValue;

              return (
                <BaseButton
                  type="button"
                  key={quickPickValue + "_" + index}
                  variant="rounded"
                  size="long"
                  onClick={() => handleQuickSellTrade(quickPickValue)}
                  disabled={isLoadingSwap}
                  isLoading={isLoadingSwap}
                  className={cn(
                    "flex h-[32px] items-center justify-center border-white/[8%] hover:border-destructive hover:bg-destructive/[8%] hover:text-destructive disabled:opacity-[70%]",
                    isSelected &&
                    "border-destructive bg-destructive/[8%] text-destructive",
                    parentWidth < 400 && "gap-0.5 px-1.5",
                  )}
                  style={buttonStyle}
                >
                  <span
                    className={cn(
                      "inline-block text-nowrap font-geistSemiBold text-sm leading-3",
                      parentWidth < 400 && "text-[12px]",
                    )}
                  >
                    {quickPickValue}
                  </span>
                  <span
                    className={cn(
                      "mb-2 size-4",
                      parentWidth < 400 && "mb-0.5 text-[12px]",
                    )}
                  >
                    %
                  </span>
                </BaseButton>
              );
            })}
        </div>
      </div>

      {/* <div className="mt-2 flex w-full flex-col gap-y-2">
        <BaseButton
          type="button"
          variant="primary"
          className="bg-success py-[7px] hover:bg-success/80 focus:bg-success disabled:bg-success/60"
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
        >
          <span className="inline-block text-nowrap font-geistSemiBold text-sm text-background">
            {isLoadingSwap ? "Processing..." : "Sell Initial"}
          </span>
        </BaseButton>
      </div> */}

      {autoFeeEnabled && (
        <SuperNovaActived
          className="flex items-center gap-1"
          title="Sell mode is active"
        />
      )}
    </div>
  );
};

export default SellSectionPanel;
