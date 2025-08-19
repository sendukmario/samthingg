"use client";

// ######## Libraries 📦 & Hooks 🪝 ########
import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useConnection } from "@solana/wallet-adapter-react";
import {
  submitTransaction,
  submitTransactionSchema,
  SubmitTransactionRequest,
} from "@/apis/rest/transaction/submit-transaction";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useActivePresetStore } from "@/stores/dex-setting/use-active-preset.store";
import debounce from "lodash/debounce";
import isEqual from "lodash/isEqual";
// ######## Components 🧩 ########
import Image from "next/image";
import LabelStatusIndicator from "@/components/customs/LabelStatusIndicator";
// ######## Utils & Helpers 🤝 ########
import { cn } from "@/libraries/utils";
import BaseButton from "../../buttons/BaseButton";
import { Input } from "@/components/ui/input";
import OnOffToggle from "../../OnOffToggle";
import SellBuyInputAmount, {
  DEFAULT_QUICK_PICK_SOL_LIST,
} from "../../SellBuyInputAmount";
import WalletSelectionButton from "../../WalletSelectionButton";
import PresetSelectionButtons from "../../PresetSelectionButtons";
import {
  convertNumberToPresetKey,
  convertPresetIdToKey,
  convertPresetIdToNumber,
  convertPresetKeyToNumber,
} from "@/utils/convertPreset";
import { useQuickBuySettingsStore } from "@/stores/setting/use-quick-buy-settings.store";
import { useQuickAmountStore } from "@/stores/dex-setting/use-quick-amount.store";
import { useOpenAdvanceSettingsFormStore } from "@/stores/use-open-advance-settings-form.store";
import { useFeeTip } from "@/stores/setting/use-fee-tip.store";
import { SuperNovaActived } from "./SuperNovaActived";

// Define interface for form settings to autosave
interface SettingsToAutoSave {
  slippage: number;
  mev_protect: boolean;
  auto_tip: boolean;
  fee: number;
  tip: number;
  preset: number;
}

// Import the actual API function
import {
  updateQuickBuyPreset,
  QuickBuyPresetRequest,
  QuickPresetData,
} from "@/apis/rest/settings/settings";
import { usePopupStore } from "@/stores/use-popup-state.store";
import { getSettingsValue } from "./SellForm";
import { useSolPriceMessageStore } from "@/stores/use-solprice-message.store";
import { useCustomToast } from "@/hooks/use-custom-toast";
import { useSwap } from "@/hooks/useSwap";
import useKeysTx from "@/hooks/use-keys-tx";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { solToLamports } from "@/utils/solToLamport";
import { ModuleType } from "@/utils/turnkey/serverAuth";
// import { createTurnKeyClient } from "@/utils/turnkey/client";
import { SolanaSqIconSVG } from "../../ScalableVectorGraphics";


interface BuyFormProps {
  module: ModuleType
}

export default function BuyForm({
  module,
}: BuyFormProps) {
  const params = useParams();
  const queryClient = useQueryClient();
  const [picker, setPicker] = useState<number | undefined>(0);
  const [lastFocusOn, setLastFocusOn] = useState<"input" | "picker">("input");
  const { openAdvanceSettings, setOpenAdvanceSettings } =
    useOpenAdvanceSettingsFormStore();
  const presetData = useQuickBuySettingsStore((state) => state.presets);
  const presetDataRef = useRef(presetData);
  const { success, error: errorToast } = useCustomToast();

  const [buyCurrency, setBuyCurrency] = useState<"SOL" | "USDC">("SOL");
  const globalSolPrice = useSolPriceMessageStore(
    (state) => state.messages.price,
  );

  // ==========================================================
  const cosmoWallets = useQuickAmountStore((state) => state.cosmoWallets);
  const setCosmoWallets = useQuickAmountStore((state) => state.setCosmoWallets);
  const { quickBuy, isLoadingFetch: isLoadingSwap } = useSwap();
  const handleQuickBuy = async () => {
    try {
      // Check if we have an amount to buy
      const buyAmount =
        lastFocusOn === "picker" ? picker : form.watch("amount") || 0;

      if (!buyAmount || buyAmount <= 0) {
        errorToast("❌ Please enter an amount to buy");
        return;
      }

      const baseAmount =
        buyCurrency === "USDC" ? convertUsdcToSol(buyAmount) : buyAmount;

      const signature = await quickBuy({
        priorityFee: form.getValues("fee") || 0,
        mint: params?.["mint-address"] as string,
        walletAddresses: cosmoWallets.map((w) => w.address),
        module: module,
        type: "buy",
        params: {
          buyAmount: solToLamports(baseAmount),
          slippage: form.getValues("slippage"),
        },
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

  const convertUsdcToSol = (usdcAmount: number): number => {
    if (!globalSolPrice || globalSolPrice <= 0) {
      console.warn("SOL price not available for conversion");
      return 0;
    }
    return usdcAmount / globalSolPrice;
  };

  useEffect(() => {
    presetDataRef.current = presetData;
  }, [presetData]);

  // Add a ref to track the previous settings to compare
  const previousSettingsRef = useRef<SettingsToAutoSave | null>(null);

  // Add a state to track if autosave is in progress
  const [isAutoSaving, setIsAutoSaving] = useState(false);

  // Initialize form with current preset data
  const form = useForm<SubmitTransactionRequest>({
    resolver: zodResolver(submitTransactionSchema),
    defaultValues: {
      mint: (params?.["mint-address"] || params?.["pool-address"]) as string,
      type: "buy",
      wallets: (cosmoWallets || [])?.map((wallet) => ({
        address: wallet?.address,
        amount: 0,
        input_mint: "So11111111111111111111111111111111111111112",
      })),
      preset: 1,
      slippage: 20,
      mev_protect:
        presetData?.preset1?.processor === "Jito" ||
        presetData?.preset1?.processor === "secure",
      auto_tip: presetData?.preset1?.autoTipEnabled,
      fee: 0,
      tip: 0,
      module: "Quick Buy",
    },
  });

  // Buy transaction mutation
  const [_, setCurrentTXInfoString] = useState<string>("");
  const mutation = useMutation({
    mutationFn: submitTransaction,
    onMutate: (data) => {
      setCurrentTXInfoString(JSON.stringify(data));
    },
    onSuccess: () => {
      setCurrentTXInfoString("");
      queryClient.refetchQueries({
        queryKey: ["wallets-balance"],
      });
    },
    onError: (error: Error) => {
      setCurrentTXInfoString("");
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

  // Add a mutation for autosaving settings using the actual API
  const autoSaveMutation = useMutation({
    mutationFn: updateQuickBuyPreset,
    onMutate: () => {
      setIsAutoSaving(true);
    },
    onSuccess: () => {
      setIsAutoSaving(false);
      // Show success toast notification
      // toast.custom((t: any) => (
      //   <CustomToast
      //     tVisibleState={t.visible}
      //     message="Settings updated successfully"
      //     state="SUCCESS"
      //   />
      // ));
      success("Settings updated successfully");

      // Refresh related data to update the UI
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: (error: Error) => {
      setIsAutoSaving(false);
      // toast.custom((t: any) => (
      //   <CustomToast
      //     tVisibleState={t.visible}
      //     message={`Failed to save settings: ${error.message}`}
      //     state="ERROR"
      //   />
      // ));
      errorToast(`Failed to save settings: ${error.message}`);
    },
  });
  const autoFeeEnabled = useQuickBuySettingsStore(
    (state) => state?.presets?.autoFeeEnabled,
  );
  const feetipData = useFeeTip((state) => state.data);
  const activePreset = useActivePresetStore((state) => state.buyActivePreset);
  const setActivePreset = useActivePresetStore(
    (state) => state.setBuyActivePreset,
  );

  // 🕍Preset Settings
  useEffect(() => {
    const preset = activePreset;
    if (presetData) {
      const presetKey = preset as keyof typeof presetData;
      form.reset({
        ...form.getValues(),
        preset: convertPresetKeyToNumber(presetKey),
        type: "buy",
        slippage: Number(
          getSettingsValue(
            (presetData[presetKey] as QuickPresetData)?.slippage,
            form.getValues("slippage"),
          ),
        ),
        auto_tip: (presetData[presetKey] as QuickPresetData)?.autoTipEnabled,
        fee: Number(
          getSettingsValue(
            (presetData[presetKey] as QuickPresetData)?.fee,
            form.getValues("fee"),
          ),
        ),
        tip: Number(
          getSettingsValue(
            (presetData[presetKey] as QuickPresetData)?.tip,
            form.getValues("tip"),
          ),
        ),
        mev_protect:
          (presetData[presetKey] as QuickPresetData)?.processor === "Jito" ||
          (presetData[presetKey] as QuickPresetData)?.processor === "secure",
      });

      // Update the previous settings ref with initial values
      previousSettingsRef.current = {
        slippage: Number(
          getSettingsValue(
            (presetData[presetKey] as QuickPresetData)?.slippage,
            form.getValues("slippage"),
          ),
        ),
        mev_protect:
          (presetData[presetKey] as QuickPresetData)?.processor === "Jito" ||
          (presetData[presetKey] as QuickPresetData)?.processor === "secure",
        auto_tip: (presetData[presetKey] as QuickPresetData)?.autoTipEnabled,
        fee: Number(
          getSettingsValue(
            (presetData[presetKey] as QuickPresetData)?.fee,
            form.getValues("fee"),
          ),
        ),
        tip: Number(
          getSettingsValue(
            (presetData[presetKey] as QuickPresetData)?.tip,
            form.getValues("tip"),
          ),
        ),
        preset: convertPresetKeyToNumber(presetKey),
      };
    }
  }, [presetData, activePreset]);

  // 💵Wallet Settings
  useEffect(() => {
    form.setValue(
      "wallets",
      (cosmoWallets || [])?.map((wallet) => ({
        address: wallet?.address,
        amount: (lastFocusOn === "input" ? form.watch("amount") : picker) || 0,
        input_mint: "So11111111111111111111111111111111111111112",
      })),
    );
  }, [cosmoWallets]);

  // Create a debounced function for autosaving
  const debouncedAutoSave = useRef(
    debounce((formValues: SettingsToAutoSave) => {
      const presetDataTemp = presetDataRef.current;
      // Only save if values have changed
      if (
        previousSettingsRef.current &&
        !isEqual(previousSettingsRef.current, formValues)
      ) {
        // Check for minimum tip value when auto-tip is disabled
        // if (!formValues.auto_tip && formValues.tip < 0.001) {
        //   toast.custom((t: any) => (
        //     <CustomToast
        //       tVisibleState={t.visible}
        //       message="We recommend a minimum tip of 0.001 for faster transaction"
        //       state="ERROR"
        //     />
        //   ));
        //   return; // Don't proceed with saving
        // }

        // Check for minimum fee value when auto-fee is disabled
        // if (!formValues.auto_tip && formValues.fee < 0.001) {
        //   toast.custom((t: any) => (
        //     <CustomToast
        //       tVisibleState={t.visible}
        //       message="We recommend a minimum tip of 0.001 for faster transaction"
        //       state="ERROR"
        //     />
        //   ));
        //   return; // Don't proceed with saving
        // }

        if (!formValues?.slippage) {
          // toast.custom((t: any) => (
          //   <CustomToast
          //     tVisibleState={t.visible}
          //     message="Slippage is required"
          //     state="ERROR"
          //   />
          // ));
          errorToast("Slippage is required");
          return;
        }

        // Prepare the data for the API to match QuickBuyPresetRequest
        const dataToSave: QuickBuyPresetRequest = {
          amounts:
            presetDataTemp[convertNumberToPresetKey(formValues.preset)]
              ?.amounts,
          preset: convertNumberToPresetKey(formValues.preset).replace(
            "preset",
            "",
          ),
          slippage: formValues.slippage,
          autoTipEnabled: formValues.auto_tip,
          fee: formValues.fee,
          tip: formValues.tip,
          // Determine processor based on MEV protection status
          processor: formValues.mev_protect ? "Jito" : "Node",
          autoFeeEnabled,
        };

        // Call the mutation to save settings
        autoSaveMutation.mutate(dataToSave);

        // Update the previous settings ref
        previousSettingsRef.current = formValues;
      }
    }, 800),
  ).current;

  const isAutosaveEnabledRef = useRef<boolean>(false);

  useEffect(() => {
    let timeout: NodeJS.Timeout | null = null;

    timeout = setTimeout(() => {
      isAutosaveEnabledRef.current = true;
    }, 1000);

    return () => {
      isAutosaveEnabledRef.current = false;
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, []);

  // Watch form values and autosave when they change
  useEffect(() => {
    const subscription = form.watch((value) => {
      // Extract only the settings we want to autosave
      const settingsToSave: SettingsToAutoSave = {
        slippage: Number(value.slippage || 0),
        mev_protect: Boolean(value.mev_protect),
        auto_tip: Boolean(value.auto_tip),
        fee: Number(value.fee || 0),
        tip: Number(value.tip || 0),
        preset: Number(value.preset || 1),
      };
      if (!isAutosaveEnabledRef.current) return; // Don't proceed with autosaving if not enabled

      // Call the debounced autosave function
      debouncedAutoSave(settingsToSave);
    });

    // Cleanup on component unmount
    return () => {
      subscription.unsubscribe();
      debouncedAutoSave.cancel();
    };
  }, [form.watch, debouncedAutoSave]);

  // Handle form submission
  const onSubmit = (data: SubmitTransactionRequest) => {
    // Check if auto-tip is disabled and tip is less than the minimum
    // if (!data.auto_tip && data.tip < 0.001 && data.tip !== 0) {
    //   toast.custom((t: any) => (
    //     <CustomToast
    //       tVisibleState={t.visible}
    //       message="We recommend a minimum tip of 0.001 for faster transaction"
    //       state="ERROR"
    //     />
    //   ));
    //   return; // Don't proceed with submission
    // }

    // Check if auto-tip is disabled and fee is less than the minimum
    // if (!data.auto_tip && data.fee < 0.001 && data.fee !== 0) {
    //   toast.custom((t: any) => (
    //     <CustomToast
    //       tVisibleState={t.visible}
    //       message="We recommend a minimum tip of 0.001 for faster transaction"
    //       state="ERROR"
    //     />
    //   ));
    //   return; // Don't proceed with submission
    // }

    // Get the raw amount based on last focus
    const rawAmount =
      (lastFocusOn === "input" ? form.watch("amount") : picker) || 0;

    // Convert to SOL if needed
    const baseAmount =
      buyCurrency === "USDC" ? convertUsdcToSol(rawAmount) : rawAmount;

    // Validate conversion
    if (buyCurrency === "USDC" && (!globalSolPrice || globalSolPrice <= 0)) {
      // toast.custom((t: any) => (
      //   <CustomToast
      //     tVisibleState={t.visible}
      //     message="Unable to convert USDC to SOL. SOL price unavailable."
      //     state="ERROR"
      //   />
      // ));
      errorToast("Unable to convert USDC to SOL. SOL price unavailable.");
      return;
    }

    const finalData = {
      ...data,
      tip: (autoFeeEnabled ? feetipData.tip : data.tip) as number,
      ...(autoFeeEnabled ? { fee: feetipData.fee } : {}),
      wallets: (data.wallets as { address: string; amount: number }[])?.map(
        (wallet) => ({
          address: wallet?.address,
          amount: baseAmount / (data.wallets.length ?? 1),
          input_mint: "So11111111111111111111111111111111111111112",
        }),
      ),
    };
    delete finalData.amount;
    mutation.mutate(finalData);
  };

  const handleToggle = () => setOpenAdvanceSettings(!openAdvanceSettings);
  const { remainingScreenWidth } = usePopupStore();

  return (
    <Form {...form}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit(onSubmit)(e);
        }}
      >
        {/* Setups */}

        {/* md:flex-col xl:flex-row */}
        <div className="flex w-full flex-row gap-x-2 gap-y-2 p-3">
          <FormField
            control={form.control}
            name="wallets"
            render={({ field }) => (
              <FormItem className="flex flex-grow">
                <FormControl>
                  <WalletSelectionButton
                    displayVariant="name"
                    value={cosmoWallets}
                    setValue={(wallet) => {
                      setCosmoWallets(wallet);
                      field.onChange(
                        (wallet || [])?.map((w) => ({
                          address: w.address,
                          amount: 0,
                          input_mint:
                            "So11111111111111111111111111111111111111112",
                        })),
                      );
                    }}
                    className={cn(
                      "w-[145px] max-md:w-full md:max-w-[190.5px]",
                      remainingScreenWidth <= 1280 && "md:max-w-[150px]",
                    )}
                    maxWalletShow={10}
                    // maxWalletShow={2}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="preset"
            render={({ field }) => (
              <FormItem className="w-fit">
                <FormControl>
                  <PresetSelectionButtons
                    activePreset={convertNumberToPresetKey(field.value)}
                    setActivePreset={(value: string) => {
                      setPicker(0);
                      // console.log(
                      //   "setActivePreset⭕⭕⭕",
                      //   convertPresetIdToKey(value),
                      //   value,
                      // );
                      setLastFocusOn("picker");
                      setActivePreset(convertPresetIdToKey(value));
                      field.onChange(convertPresetIdToNumber(value));
                    }}
                    isGlobal={false}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Buy Now Fields */}
        <div className="flex w-full flex-col px-3">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <SellBuyInputAmount
                    quickPickList={
                      presetData?.[
                        convertNumberToPresetKey(form.watch("preset"))
                      ]?.amounts?.length == 6
                        ? presetData?.[
                            convertNumberToPresetKey(form.watch("preset"))
                          ]?.amounts
                        : DEFAULT_QUICK_PICK_SOL_LIST
                    }
                    {...field}
                    value={(field.value || "") as any}
                    setPickerValue={setPicker}
                    pickerValue={picker}
                    buyCurrency={buyCurrency}
                    setBuyCurrency={setBuyCurrency}
                    lastFocusOn={lastFocusOn}
                    setLastFocusOn={setLastFocusOn}
                    type="buy"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Advanced Settings */}
        <motion.div
          animate={openAdvanceSettings ? "open" : "closed"}
          className="flex h-auto w-full flex-col px-4"
        >
          {/* Advanced Settings Header */}
          <button
            type="button"
            disabled={autoFeeEnabled}
            onClick={handleToggle}
            className="flex h-[48px] w-full items-center justify-between"
          >
            <div className="flex items-center gap-x-2">
              <div className="relative aspect-square h-[18px] w-[18px] focus:border-none focus:outline-none focus:ring-0">
                <Image
                  src="/icons/setting-primary.svg"
                  alt="Gray Setting Icon"
                  fill
                  quality={50}
                  className="object-contain"
                />
              </div>
              <span className="inline-block text-nowrap font-geistSemiBold text-sm text-fontColorPrimary">
                Advanced Settings
              </span>
            </div>
            <div className="flex items-center gap-1">
              {autoFeeEnabled && <SuperNovaActived />}

              <div className="relative aspect-square h-6 w-6 flex-shrink-0 cursor-pointer">
                <Image
                  src="/icons/pink-chevron-down.png"
                  alt="Accordion Icon"
                  fill
                  quality={50}
                  className={`object-contain transition-transform duration-300 ${
                    openAdvanceSettings ? "rotate-180" : "rotate-0"
                  }`}
                />
              </div>
            </div>
          </button>

          <AnimatePresence>
            {openAdvanceSettings && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="flex w-full flex-col gap-y-4 pb-4 pt-3">
                  <div className="grid h-[58px] w-full grid-cols-3 gap-x-3">
                    {/* Slippage */}
                    <FormField
                      control={form.control}
                      name="slippage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Slippage</FormLabel>
                          <FormControl>
                            <Input
                              disabled={autoFeeEnabled}
                              type="number"
                              {...field}
                              onChange={(e) => {
                                const value = parseFloat(e.target.value);
                                if (value < 0) return;
                                field.onChange(value);
                              }}
                              // placeholder="0"
                              suffixEl={
                                <span className="absolute right-3.5 text-sm text-fontColorSecondary">
                                  %
                                </span>
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* MEV Protect */}
                    <FormField
                      control={form.control}
                      name="mev_protect"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            MEV Protect
                            <LabelStatusIndicator
                              status={field.value ? "ON" : "OFF"}
                            />
                          </FormLabel>
                          <FormControl>
                            <OnOffToggle
                              disabled={autoFeeEnabled}
                              value={field.value ? "ON" : "OFF"}
                              setValue={(value) =>
                                field.onChange(value === "ON")
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Auto Tip */}
                    <FormField
                      control={form.control}
                      name="auto_tip"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            Auto-Tip
                            <LabelStatusIndicator
                              status={field.value ? "ON" : "OFF"}
                            />
                          </FormLabel>
                          <FormControl>
                            <OnOffToggle
                              disabled={autoFeeEnabled}
                              value={field.value ? "ON" : "OFF"}
                              setValue={(value) =>
                                field.onChange(value === "ON")
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Fee and Tip Fields */}
                  <div className="grid w-full grid-cols-2 gap-x-3">
                    <FormField
                      control={form.control}
                      name="fee"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Priority Fee</FormLabel>
                          <FormControl>
                            <Input
                              disabled={autoFeeEnabled}
                              type="number"
                              isNumeric
                              decimalScale={9}
                              {...field}
                              onNumericValueChange={(values) => {
                                const newValue =
                                  values.floatValue === undefined
                                    ? 0
                                    : values.floatValue;

                                // Update the field value
                                field.onChange(newValue);

                                // Show toast if value is invalid and not empty/zero
                                // if (
                                //   !form.getValues().auto_tip &&
                                //   newValue < 0.001 &&
                                //   newValue !== 0
                                // ) {
                                //   toast.custom((t: any) => (
                                //     <CustomToast
                                //       tVisibleState={t.visible}
                                //       message="We recommend a minimum tip of 0.001 for faster transaction"
                                //       state="ERROR"
                                //     />
                                //   ));
                                // }

                                form.trigger("fee");
                              }}
                              placeholder="0.0"
                              prefixEl={
                                <div className="absolute left-3.5 aspect-square h-4 w-4">
                                  <SolanaSqIconSVG />
                                </div>
                              }
                            />
                          </FormControl>
                          {form.watch("fee") < 0.001 ? (
                            <FormMessage className="leading-4">
                              We recommend a minimum tip of 0.001 for faster
                              transaction
                            </FormMessage>
                          ) : (
                            <FormMessage />
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="tip"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Buy Tip</FormLabel>
                          <FormControl>
                            <Input
                              disabled={autoFeeEnabled}
                              type="number"
                              isNumeric
                              decimalScale={9}
                              {...field}
                              onNumericValueChange={(values) => {
                                const newValue =
                                  values.floatValue === undefined
                                    ? 0
                                    : values.floatValue;

                                // Update the field value
                                field.onChange(newValue);

                                // Show toast if value is invalid and not empty/zero
                                // if (
                                //   !form.getValues().auto_tip &&
                                //   newValue < 0.001 &&
                                //   newValue !== 0
                                // ) {
                                //   toast.custom((t: any) => (
                                //     <CustomToast
                                //       tVisibleState={t.visible}
                                //       message="We recommend a minimum tip of 0.001 for faster transaction"
                                //       state="ERROR"
                                //     />
                                //   ));
                                // }

                                form.trigger("tip");
                              }}
                              placeholder="0.0"
                              prefixEl={
                                <div className="absolute left-3.5 aspect-square h-4 w-4">
                                  <SolanaSqIconSVG />
                                </div>
                              }
                            />
                          </FormControl>
                          {form.watch("tip") < 0.001 ? (
                            <FormMessage className="leading-4">
                              We recommend a minimum tip of 0.001 for faster
                              transaction
                            </FormMessage>
                          ) : (
                            <FormMessage />
                          )}
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <div className="min-h-0 flex-grow"></div>
        {/* TurnKey Test Section */}
        {/* <div className="flex flex-col gap-3 p-4">
          <div className="flex items-center justify-between font-geistSemiBold text-sm text-fontColorSecondary">
            <span>TURNKEY TEST</span>
          </div>
          <div className="rounded-xl bg-white/[4%] p-4">
            <TurnkeyTestComponent />
          </div>
        </div> */}

        {/* CTA */}
        <div className="mt-auto flex w-full flex-col gap-y-2 px-4 pb-4">
          {/* TurnKey React SDK Test Button */}
          {/* <BaseButton
            type="button"
            onClick={handleTestTurnkeyReactSDK}
            variant="gray"
            className="w-full py-2"
            disabled={isTurnkeyLoading || !isTurnkeyInitialized}
          >
            <span className="inline-block text-nowrap font-geistSemiBold text-sm">
              {isTurnkeyLoading
                ? "Testing..."
                : isTurnkeyInitialized
                  ? "🧪 Test TurnKey React SDK"
                  : "❌ TurnKey Not Initialized"}
            </span>
          </BaseButton> */}

          <BaseButton
            type="button"
            onClick={handleQuickBuy}
            variant="primary"
            className="w-full py-2.5"
            disabled={isLoadingSwap}
            prefixIcon={
              <div className="relative aspect-square h-[18px] w-[18px] focus:border-none focus:outline-none focus:ring-0">
                <Image
                  src="/icons/black-quickbuy.png"
                  alt="Black Quick Buy Icon"
                  fill
                  quality={50}
                  className="object-contain"
                />
              </div>
            }
          >
            <span className="inline-block text-nowrap font-geistSemiBold text-base text-background">
              {isLoadingSwap
                ? "Processing..."
                : `Quick Buy ${lastFocusOn == "picker" ? picker : form.watch("amount") || "0"} ${buyCurrency}`}
            </span>
          </BaseButton>
          <p className="text-center text-xs text-fontColorSecondary">
            This does not account for price impact.
            {isAutoSaving && (
              <span className="ml-1 text-green-400">• Auto saving</span>
            )}
          </p>
        </div>
      </form>
    </Form>
  );
}
