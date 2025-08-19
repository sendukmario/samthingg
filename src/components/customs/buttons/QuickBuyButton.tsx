"use client";

// ######## Libraries 📦 & Hooks 🪝 ########
import React, { useState, useRef, useEffect } from "react";
import { useQuickAmountStore } from "@/stores/dex-setting/use-quick-amount.store";
import toast from "react-hot-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
// import { useWallet } from "@solana/wallet-adapter-react";
// ######## Components 🧩 ########
import CustomToast from "@/components/customs/toasts/CustomToast";
import { RiLoader3Line } from "react-icons/ri";
import { FaCheckCircle, FaExclamationCircle } from "react-icons/fa";
import { useUserWalletStore } from "@/stores/wallet/use-user-wallet.store";
import { submitTransaction } from "@/apis/rest/transaction/submit-transaction";
import { useActivePresetStore } from "@/stores/dex-setting/use-active-preset.store";
import { useQuickBuySettingsStore } from "@/stores/setting/use-quick-buy-settings.store";
import { convertPresetKeyToNumber } from "@/utils/convertPreset";
import { cn } from "@/libraries/utils";
import { Wallet } from "@/apis/rest/wallet-manager";
import { useFeeTip } from "@/stores/setting/use-fee-tip.store";
import { useCustomizeSettingsStore } from "@/stores/setting/use-customize-settings.store";
import { useCustomToast } from "@/hooks/use-custom-toast";
import {
  QuickBuyIconSVG,
  SolanaIconSVG,
} from "@/components/customs/ScalableVectorGraphics";
import { useSwap } from "@/hooks/useSwap";
import { KeysTxResult } from "@/hooks/use-keys-tx";
import { solToLamports } from "@/utils/solToLamport";
import { ModuleType } from "@/utils/turnkey/serverAuth";

type QuickBuyButtonProps = {
  variant?:
  | "cosmo"
  | "marquee"
  | "trending"
  | "ignite"
  | "ignite-sub"
  | "footer-wallet-tracker"
  | "twitter-monitor-small"
  | "twitter-monitor-large"
  | "holdings"
  | "global-search"
  | "discord";
  mintAddress?: string;
  className?: string | undefined;
  amount?: number;
  swapKeys?: KeysTxResult
  module?: ModuleType
};

export default React.memo(function QuickBuyButton({
  variant = "cosmo",
  mintAddress,
  className,
  amount,
  swapKeys,
  module = "Quick Buy",
}: QuickBuyButtonProps) {
  const cosmoQuickBuyAmount = useQuickAmountStore(
    (state) => state.cosmoQuickBuyAmount,
  );
  const quickBuyAmount = amount ?? cosmoQuickBuyAmount;
  const cosmoWallets = useQuickAmountStore((state) => state.cosmoWallets);
  const holdingsWallets = useQuickAmountStore((state) => state.holdingsWallets);
  const cosmoActivePreset = useActivePresetStore(
    (state) => state.cosmoActivePreset,
  );
  const wallets = useUserWalletStore(
    (state) => state.selectedMultipleActiveWallet,
  );
  const { error: errorToast } = useCustomToast();

  const presetData = useQuickBuySettingsStore((state) => state.presets);
  const [showMessage, setShowMessage] = useState<boolean>(false);
  const [transactionStatus, setTransactionStatus] = useState<
    "SUCCESS" | "FAILED" | null
  >(null);

  const [_, setCurrentTXInfoString] = useState<string>("");
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const transactionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autoFeeEnabled = useQuickBuySettingsStore(
    (state) => state?.presets?.autoFeeEnabled,
  );
  const feetipData = useFeeTip((state) => state.data);

  //! ## [OLD HANDLE QUICK BUY FUNCTION❌] ##
  // const queryClient = useQueryClient();
  // const submitTransactionMutation = useMutation({
  //   mutationFn: submitTransaction,
  //   onMutate: (data) => {
  //     setCurrentTXInfoString(JSON.stringify(data));

  //     if (transactionTimeoutRef.current) {
  //       clearTimeout(transactionTimeoutRef.current);
  //     }

  //     transactionTimeoutRef.current = setTimeout(() => {
  //       if (isLoadingSwap) {
  //         toast.custom((t: any) => (
  //           <CustomToast
  //             tVisibleState={t.visible}
  //             message="Transaction failed, check your fees/slippage!"
  //             state="WARNING"
  //           />
  //         ));
  //       }
  //     }, 15000);
  //   },
  //   onSuccess: () => {
  //     if (transactionTimeoutRef.current) {
  //       clearTimeout(transactionTimeoutRef.current);
  //       transactionTimeoutRef.current = null;
  //     }
  //     setTransactionStatus("SUCCESS");
  //     setCurrentTXInfoString("");
  //     queryClient.refetchQueries({
  //       queryKey: ["wallets-balance"],
  //     });
  //   },
  //   onError: (error: Error) => {
  //     if (transactionTimeoutRef.current) {
  //       clearTimeout(transactionTimeoutRef.current);
  //       transactionTimeoutRef.current = null;
  //     }
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
        if (variant === "ignite") isAllWalletsSelected = false;
      }

      // Determine wallets to use
      let transactionWallets: Wallet[] = [];
      if (isAllWalletsSelected) {
        // Use all non-archived wallets
        transactionWallets = (userWalletFullList || [])?.filter(
          (w) => !w.archived,
        );
      } else if (variant === "holdings") {
        transactionWallets = holdingsWallets ?? wallets;
      } else {
        transactionWallets = cosmoWallets ?? wallets;
      }

      const signature = await quickBuy({
        priorityFee: presetData[cosmoActivePreset]?.fee,
        mint: mintAddress,
        walletAddresses: transactionWallets.map((w) => w.address),
        module: module,
        type: "buy",
        params: {
          buyAmount: solToLamports(quickBuyAmount),
          slippage: presetData[cosmoActivePreset]?.slippage
        }
      });
      setCurrentTXInfoString(signature);
      setTransactionStatus("SUCCESS");
      setShowMessage(true);
      timeoutRef.current = setTimeout(() => setShowMessage(false), 1500);
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
  // const handleQuickBuy = async (event: React.MouseEvent) => {
  //   event.preventDefault();
  //   event.stopPropagation();

  //   if (!mintAddress) {
  //     // console.log(mintAddress);
  //     // toast.custom((t: any) => (
  //     //   <CustomToast
  //     //     tVisibleState={t.visible}
  //     //     message="Invalid token"
  //     //     state="ERROR"
  //     //   />
  //     // ));
  //     errorToast("Invalid token");
  //     return;
  //   }

  //   // Check if "All Wallets" is selected
  //   let isAllWalletsSelected = false;
  //   if (typeof window !== "undefined") {
  //     isAllWalletsSelected =
  //       localStorage.getItem("nova-all-wallets-selected") === "true";
  //   }

  //   // Determine wallets to use
  //   let transactionWallets: Wallet[] = [];
  //   if (isAllWalletsSelected) {
  //     // Use all non-archived wallets
  //     transactionWallets = (userWalletFullList || [])?.filter(
  //       (w) => !w.archived,
  //     );
  //   } else if (variant === "holdings") {
  //     transactionWallets = holdingsWallets ?? wallets;
  //   } else {
  //     transactionWallets = cosmoWallets ?? wallets;
  //   }

  //   const presetKey = cosmoActivePreset;

  //   const is_twitter =
  //     variant === "twitter-monitor-small" ||
  //     variant === "twitter-monitor-large" ||
  //     variant === "footer-wallet-tracker" ||
  //     variant === "holdings" ||
  //     variant === "marquee" ||
  //     variant === "discord";

  //   submitTransactionMutation.mutate({
  //     mint: mintAddress,
  //     preset: convertPresetKeyToNumber(presetKey),
  //     wallets: (transactionWallets || [])?.map((wallet) => ({
  //       address: wallet?.address,
  //       amount: parseFloat(
  //         (quickBuyAmount / (transactionWallets || [])?.length)
  //           .toFixed(9)
  //           .replace(/\.?0+$/, ""),
  //       ),
  //       input_mint: "So11111111111111111111111111111111111111112",
  //     })),
  //     amount: parseFloat(quickBuyAmount.toFixed(9).replace(/\.?0+$/, "")),
  //     auto_tip:
  //       typeof presetData[presetKey]?.autoTipEnabled == "undefined"
  //         ? true
  //         : presetData[presetKey]?.autoTipEnabled,
  //     fee: presetData[presetKey]?.fee,
  //     slippage: presetData[presetKey]?.slippage,
  //     // tip: presetData[presetKey]?.tip,
  //     tip: (autoFeeEnabled
  //       ? feetipData.tip
  //       : presetData[presetKey]?.tip) as number,
  //     mev_protect: false,
  //     type: "buy",
  //     module: "Quick Buy",
  //     is_fetch: is_twitter,
  //     ...(autoFeeEnabled ? { fee: feetipData.fee } : {}),
  //   });
  // };

  const formattedAmount = quickBuyAmount.toFixed(9).replace(/\.?0+$/, "");

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (transactionTimeoutRef.current) {
        clearTimeout(transactionTimeoutRef.current);
        transactionTimeoutRef.current = null;
      }
    };
  }, []);

  const {
    presets: customizedSettingPresets,
    activePreset: customizedSettingActivePreset,
  } = useCustomizeSettingsStore();
  const currentCardStyle =
    customizedSettingPresets[customizedSettingActivePreset]
      .cosmoCardStyleSetting || "type1";
  const currentTheme =
    customizedSettingPresets[customizedSettingActivePreset].themeSetting ||
    "original";

  return (
    <>
      {(variant === "cosmo" ||
        variant === "marquee" ||
        variant === "discord") && (
          <button
            onClick={handleQuickBuy}
            disabled={isLoadingSwap}
            className={cn(
              "flex h-[26px] w-fit items-center justify-center gap-x-1 overflow-hidden rounded-[40px] bg-[#2B2B3B] pl-2.5 pr-3 transition-colors duration-300 hover:bg-white/[12%] disabled:opacity-50",
              currentCardStyle === "type4" && "#2b2d35",
              // "relative -bottom-6 flex h-[26px] w-fit min-w-[82px] items-center justify-center gap-x-1 overflow-hidden rounded-[40px] bg-[#2B2B3B] pl-2.5 pr-3 duration-300 hover:bg-white/[12%] disabled:opacity-50 min-[490px]:bottom-0 xl:-bottom-6 min-[1490px]:bottom-0",
              variant === "marquee" && "bottom-0 xl:bottom-0",
              className,
            )}
          >
            {isLoadingSwap ? (
              <RiLoader3Line className="animate-spin text-lg text-fontColorPrimary" />
            ) : showMessage ? (
              transactionStatus === "SUCCESS" ? (
                <FaCheckCircle className="text-base text-success" />
              ) : (
                <FaExclamationCircle className="text-base text-destructive" />
              )
            ) : (
              <>
                {/* <div className="relative aspect-square h-4 w-4 flex-shrink-0">
                <CachedImage
                  src="/icons/quickbuy.svg"
                  alt="Quickbuy Icon"
                  fill
                  quality={50}
                  className="object-contain"
                />
              </div>
              <div className="relative block aspect-auto h-4 w-4 flex-shrink-0">
                <CachedImage
                  src="/icons/solana-sq.svg"
                  alt="Solana SQ Icon"
                  fill
                  quality={50}
                  className="object-contain"
                />
              </div> */}
                <QuickBuyIconSVG />
                <SolanaIconSVG />
                <span className="block truncate font-geistSemiBold text-sm text-fontColorPrimary">
                  {formattedAmount}
                </span>
              </>
            )}
          </button>
        )}

      {["trending", "footer-wallet-tracker"].includes(variant) && (
        <button
          onClick={handleQuickBuy}
          disabled={isLoadingSwap}
          className={cn(
            "relative flex h-[26px] w-fit items-center justify-center gap-x-1 overflow-hidden rounded-[40px] bg-[#2B2B3B] pl-[10px] pr-[13px] transition-colors duration-300 hover:bg-white/[12%] disabled:opacity-50",
            currentCardStyle === "type4" && "#2b2d35",
            className,
          )}
        >
          {isLoadingSwap ? (
            <RiLoader3Line className="animate-spin text-lg text-fontColorPrimary" />
          ) : showMessage ? (
            transactionStatus === "SUCCESS" ? (
              <FaCheckCircle className="text-base text-success" />
            ) : (
              <FaExclamationCircle className="text-base text-destructive" />
            )
          ) : (
            <>
              {/* <div className="relative aspect-square h-4 w-4 flex-shrink-0">
                <CachedImage
                  src="/icons/quickbuy.svg"
                  alt="Quickbuy Icon"
                  fill
                  quality={50}
                  className="object-contain"
                />
              </div>
              <div className="relative block aspect-auto h-4 w-4 flex-shrink-0">
                <CachedImage
                  src="/icons/solana-sq.svg"
                  alt="Solana SQ Icon"
                  fill
                  quality={50}
                  className="object-contain"
                />
              </div> */}
              <QuickBuyIconSVG />
              <SolanaIconSVG />
              <span className="font-geistSemiBold text-[12.5px] text-fontColorPrimary">
                {formattedAmount}
              </span>
            </>
          )}
        </button>
      )}

      {variant === "twitter-monitor-small" && (
        <button
          onClick={handleQuickBuy}
          disabled={isLoadingSwap}
          className={cn(
            "gb__white__btn relative flex h-[32px] w-[32px] items-center justify-center gap-x-1 overflow-hidden rounded-[8px] bg-white/[4%] transition-colors duration-300 hover:bg-white/[8%]",
            currentCardStyle === "type4" && "#2b2d35",
            className,
          )}
        >
          {isLoadingSwap ? (
            <RiLoader3Line className="animate-spin text-base text-fontColorPrimary" />
          ) : showMessage ? (
            transactionStatus === "SUCCESS" ? (
              <FaCheckCircle className="text-sm text-success" />
            ) : (
              <FaExclamationCircle className="text-sm text-destructive" />
            )
          ) : (
            // <div className="relative z-30 aspect-square h-4 w-4 flex-shrink-0">
            //   <Image
            //     src="/icons/quickbuy.png"
            //     alt="Quick Buy Icon"
            //     fill
            //     quality={50}
            //     className="object-contain"
            //   />
            // </div>
            <QuickBuyIconSVG className="relative z-30 aspect-square h-4 w-4 flex-shrink-0" />
          )}
        </button>
      )}
      {variant === "twitter-monitor-large" && (
        <button
          onClick={handleQuickBuy}
          disabled={isLoadingSwap}
          className={cn(
            "gb__white__btn relative flex h-10 w-10 items-center justify-center gap-x-1 overflow-hidden rounded-[10px] bg-white/[4%] transition-colors duration-300 hover:bg-white/[8%]",
            currentCardStyle === "type4" && "#2b2d35",
            className,
          )}
        >
          {isLoadingSwap ? (
            <RiLoader3Line className="animate-spin text-xl text-fontColorPrimary" />
          ) : showMessage ? (
            transactionStatus === "SUCCESS" ? (
              <FaCheckCircle className="text-lg text-success" />
            ) : (
              <FaExclamationCircle className="text-lg text-destructive" />
            )
          ) : (
            // <div className="relative z-30 aspect-square h-5 w-5 flex-shrink-0">
            //   <Image
            //     src="/icons/quickbuy.png"
            //     alt="Quick Buy Icon"
            //     fill
            //     quality={50}
            //     className="object-contain"
            //   />
            // </div>
            <QuickBuyIconSVG className="relative z-30 aspect-square h-5 w-5 flex-shrink-0" />
          )}
        </button>
      )}
      {variant === "holdings" && (
        <button
          onClick={handleQuickBuy}
          disabled={isLoadingSwap}
          className={cn(
            "gb__white__btn relative flex h-[32px] w-[32px] items-center justify-center gap-x-1 overflow-hidden rounded-[8px] bg-white/[4%] transition-colors duration-300 hover:bg-white/[8%]",
            currentCardStyle === "type4" && "#2b2d35",
            className,
          )}
        >
          {isLoadingSwap ? (
            <RiLoader3Line className="animate-spin text-base text-fontColorPrimary" />
          ) : showMessage ? (
            transactionStatus === "SUCCESS" ? (
              <FaCheckCircle className="text-sm text-success" />
            ) : (
              <FaExclamationCircle className="text-sm text-destructive" />
            )
          ) : (
            // <div className="relative z-30 aspect-square h-4 w-4 flex-shrink-0">
            //   <Image
            //     src="/icons/quickbuy.png"
            //     alt="Quick Buy Icon"
            //     fill
            //     quality={50}
            //     className="object-contain"
            //   />
            // </div>
            <QuickBuyIconSVG className="relative z-30 aspect-square h-4 w-4 flex-shrink-0" />
          )}
        </button>
      )}

      {variant === "global-search" && (
        <button
          onClick={handleQuickBuy}
          disabled={isLoadingSwap}
          className={cn(
            "relative flex h-[30px] w-fit min-w-[82px] items-center justify-center gap-x-1 overflow-hidden rounded-[40px] bg-[#2B2B3B] pl-2.5 pr-3 transition-colors duration-300 hover:bg-white/[12%] disabled:opacity-50",
            currentTheme === "cupsey" && "bg-[rgba(255,255,255,0.06)]",
            className,
          )}
        >
          {isLoadingSwap ? (
            <RiLoader3Line className="animate-spin text-lg text-fontColorPrimary" />
          ) : showMessage ? (
            transactionStatus === "SUCCESS" ? (
              <FaCheckCircle className="text-base text-success" />
            ) : (
              <FaExclamationCircle className="text-base text-destructive" />
            )
          ) : (
            <>
              {/* <div className="relative aspect-square h-4 w-4 flex-shrink-0">
                <CachedImage
                  src="/icons/quickbuy.svg"
                  alt="Quickbuy Icon"
                  fill
                  quality={50}
                  className="object-contain"
                />
              </div>
              <div className="relative block aspect-auto h-4 w-4 flex-shrink-0">
                <CachedImage
                  src="/icons/solana-sq.svg"
                  alt="Solana SQ Icon"
                  fill
                  quality={50}
                  className="object-contain"
                />
              </div> */}
              <QuickBuyIconSVG />
              <SolanaIconSVG />
              <span className="block font-geistSemiBold text-sm text-fontColorPrimary">
                {formattedAmount}
              </span>
            </>
          )}
        </button>
      )}
      {variant === "ignite" && (
        <button
          onClick={handleQuickBuy}
          disabled={isLoadingSwap}
          className="hover:brightness-125 hover:saturate-[90%] transition-all duration-200 ease-out z-50 flex items-center gap-1 rounded-full px-4 py-1.5 text-sm text-fontColorPrimary opacity-100 disabled:opacity-50"
          style={{
            background:
              "radial-gradient(453.02% 202.53% at 92.48% 199.46%, #FFE2FF 0%, #FAD2FF 3%, #F0B0FF 10%, #E896FF 17%, #E383FF 25%, #E077FF 32%, #DF74FF 41%, #673EC0 73%, #562495 100%)",
          }}
        >
          {isLoadingSwap ? (
            <RiLoader3Line className="animate-spin text-lg" />
          ) : showMessage ? (
            transactionStatus === "SUCCESS" ? (
              <FaCheckCircle className="text-base text-success" />
            ) : (
              <FaExclamationCircle className="text-base text-destructive" />
            )
          ) : (
            <>
              <QuickBuyIconSVG />
              <SolanaIconSVG />
              <span className="block font-geistSemiBold text-sm text-fontColorPrimary">
                {formattedAmount}
              </span>
            </>
          )}
        </button>
      )}
      {variant === "ignite-sub" && (
        <button
          className="hover:brightness-125 hover:saturate-[90%] transition-all duration-200 ease-out flex items-center gap-1 rounded-full px-4 py-1 text-sm text-fontColorPrimary"
          style={{
            // background:
            //   "radial-gradient(453.02% 202.53% at 92.48% 199.46%, #FFE2FF 0%, #FAD2FF 3%, #F0B0FF 10%, #E896FF 17%, #E383FF 25%, #E077FF 32%, #DF74FF 41%, #673EC0 73%, #562495 100%)",
            border: "1px solid #242436",
          }}
        >
          <div className="flex items-center gap-0.5">
            <QuickBuyIconSVG />
            <span className="px-1">
              <svg
                width="1"
                height="16"
                viewBox="0 0 1 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect
                  x="0.25"
                  y="0.25"
                  width="0.5"
                  height="15.5"
                  stroke="#242436"
                  strokeWidth="0.5"
                />
              </svg>
            </span>
            <SolanaIconSVG />
            <span className="block font-geistSemiBold text-sm text-fontColorPrimary">
              20
            </span>
          </div>
        </button>
      )}
    </>
  );
});
