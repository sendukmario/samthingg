"use client";

// ######## Libraries 📦 & Hooks 🪝 ########
import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { useQuickAmountStore } from "@/stores/dex-setting/use-quick-amount.store";
import { useMutation, useQueryClient } from "@tanstack/react-query";
// import { useWallet } from "@solana/wallet-adapter-react";
// ######## Components 🧩 ########
import { RiLoader3Line } from "react-icons/ri";
import { FaCheckCircle, FaExclamationCircle } from "react-icons/fa";
import { useUserWalletStore } from "@/stores/wallet/use-user-wallet.store";
import { submitTransaction } from "@/apis/rest/transaction/submit-transaction";
import { useActivePresetStore } from "@/stores/dex-setting/use-active-preset.store";
import { useQuickBuySettingsStore } from "@/stores/setting/use-quick-buy-settings.store";
import {
  convertPresetKeyToNumber,
} from "@/utils/convertPreset";
import { cn } from "@/libraries/utils";
import { useCustomizeSettingsStore } from "@/stores/setting/use-customize-settings.store";
import { quickBuyButtonStyles } from "../setting/CustomizedBuyButtonSettings";
import { useFeeTip } from "@/stores/setting/use-fee-tip.store";
import { useCustomToast } from "@/hooks/use-custom-toast";
import {
  QuickBuyIconSVG,
  SolanaIconSVG,
} from "@/components/customs/ScalableVectorGraphics";
import { useSwap } from "@/hooks/useSwap";
import toast from "react-hot-toast";
import { KeysTxResult } from "@/hooks/use-keys-tx";
import { solToLamports } from "@/utils/solToLamport";
import { ModuleType } from "@/utils/turnkey/serverAuth";

type QuickBuyButtonProps = {
  mintAddress?: string;
  className?: string | undefined;
  amount?: number;
  txsKeys?: KeysTxResult;
  module: ModuleType
};

export const TRANSPARENT_BUTTON_CLASS =
  "opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-out";

export default function CosmoQuickBuyButton({
  mintAddress,
  className,
  amount,
  txsKeys,
  module,
}: QuickBuyButtonProps) {
  const cosmoQuickBuyAmount = useQuickAmountStore(
    (state) => state.cosmoQuickBuyAmount,
  );
  const cosmoWallets = useQuickAmountStore((state) => state.cosmoWallets);
  const cosmoActivePreset = useActivePresetStore(
    (state) => state.cosmoActivePreset,
  );

  const wallets = useUserWalletStore(
    (state) => state.selectedMultipleActiveWallet,
  );
  const presetData = useQuickBuySettingsStore((state) => state.presets);
  const {
    presets: customizedSettingPresets,
    activePreset: customizedSettingActivePreset,
  } = useCustomizeSettingsStore();
  const [showMessage, setShowMessage] = useState<boolean>(false);
  const [transactionStatus, setTransactionStatus] = useState<
    "SUCCESS" | "FAILED" | null
  >(null);
  const currentButtonPreset =
    customizedSettingPresets[customizedSettingActivePreset].buttonSetting ||
    "normal";
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  const { error: errorToast } = useCustomToast();

  // Memoize the buy amount calculation
  const buyAmount = useMemo(
    () => amount ?? cosmoQuickBuyAmount,
    [amount, cosmoQuickBuyAmount],
  );

  // Memoize the formatted amount
  const formattedAmount = useMemo(
    () => buyAmount.toFixed(9).replace(/\.?0+$/, ""),
    [buyAmount],
  );

  // Memoize the button style
  const quickBuyButtonStyle = useMemo(() => {
    return isLargeScreen
      ? quickBuyButtonStyles[currentButtonPreset].large
      : quickBuyButtonStyles[currentButtonPreset].default;
  }, [isLargeScreen, currentButtonPreset]);

  const [_, setCurrentTXInfoString] = useState<string>("");

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  // const queryClient = useQueryClient();
  //! ## [OLD HANDLE QUICK BUY FUNCTION❌] ##
  // const submitTransactionMutation = useMutation({
  //   mutationFn: submitTransaction,
  //   onMutate: (data) => {
  //     setCurrentTXInfoString(JSON.stringify(data));
  //   },
  //   onSuccess: () => {
  //     setTransactionStatus("SUCCESS");
  //     setCurrentTXInfoString("");
  //     queryClient.refetchQueries({
  //       queryKey: ["wallets-balance"],
  //     });
  //   },
  //   onError: (error: Error) => {
  //     setCurrentTXInfoString("");
  //     setTransactionStatus("FAILED");
  //     // toast.custom((t: any) => (
  //     //   <CustomToast
  //     //     tVisibleState={t.visible}
  //     //     message={error.message || "Transaction failed"}
  //     //     state="ERROR"
  //     //   />
  //     // ));
  //     errorToast(error.message || "Transaction failed");
  //   },
  //   onSettled: () => {
  //     setShowMessage(true);
  //     timeoutRef.current = setTimeout(() => setShowMessage(false), 1500);
  //   },
  // });

  const autoFeeEnabled = useQuickBuySettingsStore(
    (state) => state?.presets?.autoFeeEnabled,
  );
  const feetipData = useFeeTip((state) => state.data);

  // Add this to get the full wallet list
  const userWalletFullList = useUserWalletStore(
    (state) => state.userWalletFullList,
  );

  const { quickBuy, isLoadingFetch: isLoadingSwap } = useSwap();

  //* ## [TURNKEY🔐] - Handle buy with turnkey ##
  const handleQuickBuy = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    try {
      if (!mintAddress) {
        errorToast("Invalid token");
        return;
      }

      // Check if "All Wallets" is selected
      let isAllWalletsSelected = false;
      if (typeof window !== "undefined") {
        isAllWalletsSelected =
          localStorage.getItem("nova-all-wallets-selected") === "true";
      }

      const presetKey = cosmoActivePreset;
      const signature = await quickBuy({
        priorityFee: presetData[presetKey]?.fee,
        mint: mintAddress,
        walletAddresses: cosmoWallets.map((w) => w.address),
        module: module,
        type: "buy",
        params: {
          buyAmount: solToLamports(buyAmount),
          slippage: presetData[presetKey]?.slippage
        },
        keys: txsKeys
      });
      setTransactionStatus("SUCCESS");
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

  //! ## [OLD HANDLE QUICK BUY FUNCTION❌] ##
  // Memoize the handleQuickBuy function
  // const handleQuickBuy = useCallback(
  //   async (event: React.MouseEvent) => {
  //     event.preventDefault();
  //     event.stopPropagation();

  //     if (!mintAddress) {
  //       // toast.custom((t: any) => (
  //       //   <CustomToast
  //       //     tVisibleState={t.visible}
  //       //     message="Invalid token"
  //       //     state="ERROR"
  //       //   />
  //       // ));
  //       errorToast("Invalid token");
  //       return;
  //     }

  //     // Check if "All Wallets" is selected
  //     let isAllWalletsSelected = false;
  //     if (typeof window !== "undefined") {
  //       isAllWalletsSelected =
  //         localStorage.getItem("nova-all-wallets-selected") === "true";
  //     }

  //     // Determine wallets to use
  //     let transactionWallets: any[] = [];
  //     if (isAllWalletsSelected) {
  //       // Use all non-archived wallets
  //       transactionWallets = (userWalletFullList || [])?.filter(
  //         (w) => !w.archived,
  //       );
  //     } else {
  //       transactionWallets = cosmoWallets ?? wallets;
  //     }

  //     const presetKey = cosmoActivePreset;
  //     submitTransactionMutation.mutate({
  //       mint: mintAddress,
  //       preset: convertPresetKeyToNumber(presetKey),
  //       wallets: (transactionWallets || [])?.map((wallet) => ({
  //         address: wallet?.address,
  //         amount:
  //           parseFloat(buyAmount.toFixed(9).replace(/\.?0+$/, "")) /
  //           (transactionWallets || [])?.length,
  //         input_mint: "So11111111111111111111111111111111111111112",
  //       })),
  //       amount: parseFloat(buyAmount.toFixed(9).replace(/\.?0+$/, "")),
  //       auto_tip:
  //         typeof presetData[presetKey]?.autoTipEnabled == "undefined"
  //           ? true
  //           : presetData[presetKey]?.autoTipEnabled,
  //       fee: presetData[presetKey]?.fee,
  //       slippage: presetData[presetKey]?.slippage,
  //       tip: Number(
  //         autoFeeEnabled ? feetipData.tip : presetData[presetKey]?.tip,
  //       ),
  //       mev_protect: false,
  //       type: "buy",
  //       module: "Quick Buy",
  //       ...(autoFeeEnabled ? { fee: feetipData.fee } : {}),
  //     });
  //   },
  //   [
  //     mintAddress,
  //     cosmoActivePreset,
  //     cosmoWallets,
  //     wallets,
  //     buyAmount,
  //     presetData,
  //     autoFeeEnabled,
  //     feetipData,
  //     submitTransactionMutation,
  //     userWalletFullList,
  //   ],
  // );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1600px)");

    // Set initial value
    setIsLargeScreen(mediaQuery.matches);

    // Add listener for changes
    const handleMediaChange = (e: MediaQueryListEvent) => {
      setIsLargeScreen(e.matches);
    };

    // Modern browsers use addEventListener
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleMediaChange);
      return () => mediaQuery.removeEventListener("change", handleMediaChange);
    }
    // Older browsers use addListener (deprecated)
    else {
      mediaQuery.addListener(handleMediaChange);
      return () => mediaQuery.removeListener(handleMediaChange);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  // Memoize the button content
  const buttonContent = useMemo(() => {
    if (isLoadingSwap) {
      return (
        <RiLoader3Line className="animate-spin text-lg text-fontColorPrimary" />
      );
    }
    if (showMessage) {
      return transactionStatus === "SUCCESS" ? (
        <FaCheckCircle className="text-base text-success" />
      ) : (
        <FaExclamationCircle className="text-base text-destructive" />
      );
    }
    return (
      <>
        {/* <CachedImage
          src="/icons/quickbuy.svg"
          alt="Quickbuy Icon"
          height={16}
          width={16}
          quality={50}
          className="relative flex-shrink-0 object-contain"
        />
        <CachedImage
          src="/icons/solana-sq.svg"
          alt="Solana SQ Icon"
          height={16}
          width={16}
          quality={50}
          className="relative block flex-shrink-0 object-contain"
        /> */}
        <QuickBuyIconSVG />
        <SolanaIconSVG />
        {formattedAmount}
      </>
    );
  }, [
    isLoadingSwap,
    showMessage,
    transactionStatus,
    formattedAmount,
  ]);

  const currentTheme =
    customizedSettingPresets[customizedSettingActivePreset].themeSetting ||
    "original";

  return (
    <>
      <button
        onClick={handleQuickBuy}
        disabled={isLoadingSwap}
        className={cn(
          "z-[60] flex h-[26px] w-fit min-w-[82px] items-center justify-center gap-x-1 overflow-hidden rounded-[40px] bg-[#2B2B3B] font-geistSemiBold text-sm text-fontColorPrimary disabled:opacity-50",
          currentTheme === "cupsey" && "bg-[rgba(255,255,255,0.06)]",
          className,
        )}
        style={quickBuyButtonStyle}
      >
        {buttonContent}
      </button>
    </>
  );
}
