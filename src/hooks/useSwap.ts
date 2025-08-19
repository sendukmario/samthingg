import { useCallback, useEffect, useRef, useState } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { useTurnkeyWalletsStore } from "@/stores/turnkey/use-turnkey-wallets.store";
import { decryptExportBundle } from "@turnkey/crypto";
import { ModuleType, submitTx } from "@/utils/turnkey/serverAuth";
import { useLutStore } from "@/stores/use-lut.store";
import { SwapRequest, Token } from "ts-keys/types";
import * as solana from "@solana/web3.js"
import bs58 from "bs58"
import useKeysTx, { KeysTxResult } from "./use-keys-tx";
import { getConnections, handleSwap } from "ts-keys";
import { useTokenMessageStore } from "@/stores/token/use-token-messages.store";
import { usePathname } from "next/navigation";
import { useCustomToast } from "./use-custom-toast";
import { useBlockhashStore } from "@/stores/use-blockhash.store";
import { ConfirmTransaction } from "@/services/signatureWaiter";

type QuickTxProp = {
  priorityFee: number,
  mint: string,
  walletAddresses?: string[],
  module: ModuleType,
  type: string
  params: {
    sellAmount?: {
      amount: bigint,
      walletAddresses: string,
    }[],
    buyAmount?: bigint,
    minAmountOut?: number,
    slippage?: number,
    novaFee?: number
  },
  keys?: KeysTxResult
}
interface UseSwapReturn {
  // Data
  isLoadingFetch: boolean;
  isLoadingTx: boolean;

  // Quick actions
  quickBuy: (prop: QuickTxProp) => Promise<any>;
  quickSell: (prop: QuickTxProp) => Promise<any>;
}

/**
 * Custom hook that provides easy access to swap functionality
 * Combines swap data from store with transaction execution using TurnKey signing
 */
export function useSwap(): UseSwapReturn {
  const pathname = usePathname()
  const isAllowedPage = pathname.startsWith("/token/");
  const connections = getConnections();
  const globalSwapKeys = useTokenMessageStore((s) => s.swap_keys)
  const getEBundles = useTurnkeyWalletsStore((state) => state.getEBundles);
  const getPkPb = useTurnkeyWalletsStore((state) => state.getPkPb);
  const organizationId = useTurnkeyWalletsStore((state) => state.organizationId);
  const [isLoadingTx, setIsLoadingTx] = useState(false);
  const { lut: lutAccount } = useLutStore();
  const toast = useCustomToast();

  const { fetchKeys } = useKeysTx()
  const { blockhash } = useBlockhashStore();

  const soundRef = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    soundRef.current = new Audio("/sfx/success-transaction.mp3");
  }, []);

  /**
   * Quick buy with server-side Turnkey signing (NO USER PROMPTS!)
   */
  const quickBuy = useCallback(
    async ({
      priorityFee = 0,
      mint,
      walletAddresses,
      module,
      params: {
        // minAmountOut,
        slippage,
        // novaFee,
        buyAmount: amount
      },
      keys
    }: QuickTxProp) => {
      try {
        const { pk } = await getPkPb();
        if (!mint || !walletAddresses) {
          throw new Error("Wallet not connected or no token selected");
        }
        setIsLoadingTx(true);
        const eBundle = await getEBundles();

        const finalSwapKeys =
          ((Boolean(keys) && keys?.swap_keys) ? keys :
            (globalSwapKeys && globalSwapKeys?.swap_keys && isAllowedPage) ? globalSwapKeys :
              await fetchKeys(mint)) as KeysTxResult;
        console.warn("✅Transaction Params", { amount, priorityFee, slippage });

        const signedTxs = await Promise.all(
          walletAddresses.map(async (
            walletAddress
          ) => {
            if (!amount || BigInt(amount) <= BigInt(0)) {
              toast.error("Insufficent Funds");
              // You could also trigger a toast or UI error here
              return null; // mark this one as skipped
            }
            const exportBundle = eBundle.get(walletAddress);

            if (!exportBundle) return;

            const privateKeyWallet = await decryptExportBundle({
              exportBundle: exportBundle,
              embeddedKey: pk,
              organizationId: organizationId!,
              returnMnemonic: false,
              keyFormat: "SOLANA",
            });
            console.warn("SWAP KEYSSS🔑🔑🔑", {
              finalSwapKeys,
              globalSwapKeys,
              keys,
              which: (Boolean(keys) ? "keys" :
                (globalSwapKeys && isAllowedPage) ? "globalSwapKeys" :
                  "await fetchKeys(mint)) as KeysTxResult;")
            })
            const pubKeysSwapKey = Object.fromEntries(
              Object.entries(finalSwapKeys.swap_keys).map(([key, value]) => {
                return [key, new solana.PublicKey(value.toString())];
              })
            );
            const swapKeys: any = {
              ...pubKeysSwapKey
            };

            const token: Token = {
              ...finalSwapKeys,
              is_wrapped_sol: finalSwapKeys.is_wrapped_sol,
              is_usdc: finalSwapKeys.is_usdc,
              swap_keys: swapKeys,
              remaining_accounts: finalSwapKeys?.remaining_accounts?.map((acc) => new solana.PublicKey(acc)) || null
            };
            console.warn("✅Transaction Params", { token });
            const request: SwapRequest = {
              Wallet: solana.Keypair.fromSecretKey(
                bs58.decode(privateKeyWallet) // Replace with actual user private key
              ),
              Amount: amount!,
              IsBuy: true,
              Fee: priorityFee,
              Slippage: slippage || 20,
            };
            console.warn("PARAMS BUY💵💵", request.Amount, amount)
            const { base64tx, signatures } = await handleSwap(connections, token, request, lutAccount, blockhash != null ? blockhash : "");

            ConfirmTransaction(signatures, toast, soundRef.current);
            return {
              wallet: walletAddress,
              transaction: base64tx,
              signatures: signatures
            };
          })
        );

        if (!signedTxs) return null;

        const validTxs = signedTxs.filter((tx): tx is { wallet: string; transaction: string; signatures: string[]  } => tx !== undefined);

        console.warn("✅Transaction signed successfully:", { signedTxs: validTxs });

        if (validTxs.length === 0) throw new Error("Failed to submit transaction");

        const success = await submitTx({
          mint,
          method: "buy",
          module,
          transactions: validTxs,
        });

        if (!success) {
          throw new Error("Transaction submission failed");
        }
        // successToast("Quick buy successful!");

        return signedTxs;
      } catch (error) {
        console.error("❌ Quick buy failed:", error);
        throw new Error(
          `Quick buy failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      } finally {
        setIsLoadingTx(false);
      }
    },
    [connections, globalSwapKeys],
  );

  /**
   * Quick sell with server-side Turnkey signing (NO USER PROMPTS!)
   */
  const quickSell = useCallback(
    async ({ priorityFee = 0, mint, module, keys, params: {
      sellAmount,
      minAmountOut,
      novaFee,
      slippage
    } }: QuickTxProp) => {
      try {
        console.warn("✅Transaction Params", { amount: sellAmount?.map(amount => amount), priorityFee, slippage });
        const { pk } = await getPkPb();
        if (!mint) {
          throw new Error("Wallet not connected or no token selected");
        }
        setIsLoadingTx(true);
        const eBundle = await getEBundles();

        const finalSwapKeys =
          ((Boolean(keys) && keys?.swap_keys) ? keys :
            (globalSwapKeys && globalSwapKeys?.swap_keys && isAllowedPage) ? globalSwapKeys :
              await fetchKeys(mint)) as KeysTxResult;

        const signedTxs = await Promise.all(
          (sellAmount ?? []).map(async ({ amount, walletAddresses }) => {
            if (!amount || BigInt(amount) <= BigInt(0)) {
              toast.error("Insufficent Funds");
              // You could also trigger a toast or UI error here
              return null; // mark this one as skipped
            }

            const privateKeyWallet = await decryptExportBundle({
              exportBundle: eBundle.get(walletAddresses)!,
              embeddedKey: pk,
              organizationId: organizationId!,
              returnMnemonic: false,
              keyFormat: "SOLANA",
            });
            console.warn("SWAP KEYSSS🔑🔑🔑", {
              finalSwapKeys,
              globalSwapKeys,
              keys,
              which: (Boolean(keys) ? "keys" :
                (globalSwapKeys && isAllowedPage) ? "globalSwapKeys" :
                  "await fetchKeys(mint)) as KeysTxResult;")
            })
            const pubKeysSwapKey = Object.fromEntries(
              Object.entries(finalSwapKeys.swap_keys).map(([key, value]) => {
                return [key, new solana.PublicKey(value.toString())];
              })
            );
            const swapKeys: any = {
              ...pubKeysSwapKey
            };

            const token: Token = {
              ...finalSwapKeys,
              is_wrapped_sol: finalSwapKeys.is_wrapped_sol,
              swap_keys: swapKeys,
              remaining_accounts: finalSwapKeys?.remaining_accounts?.map((acc) => new solana.PublicKey(acc)) || null
            };

            const request: SwapRequest = {
              Wallet: solana.Keypair.fromSecretKey(
                bs58.decode(privateKeyWallet) // Replace with actual user private key
              ),
              Amount: BigInt(amount),
              IsBuy: false,
              Fee: priorityFee,
              Slippage: slippage || 20,
            };
            console.log("😂😂BALALLAAA", {
              request, token, priorityFee, mint, module, keys, sellAmount,
              minAmountOut,
              novaFee,
              slippage
            })
            const { base64tx, signatures } = await handleSwap(connections, token, request, lutAccount, blockhash != null ? blockhash : "");

            ConfirmTransaction(signatures, toast, soundRef.current);
            return {
              wallet: walletAddresses,
              transaction: base64tx,
              signatures: signatures
            };
          })
        );
        if (!signedTxs) return null;

        const validTxs = signedTxs.filter((tx): tx is { wallet: string; transaction: string; signatures: string[] } => tx !== undefined);

        console.warn("✅Transaction signed successfully:", { signedTxs: validTxs });

        if (validTxs.length === 0) throw new Error("Failed to submit transaction");

        console.warn("✅Transaction signed successfully:", { signedTxs });
        const success = await submitTx({
          mint,
          method: "sell",
          module,
          transactions: validTxs
        });

        if (!success) {
          throw new Error("Transaction submission failed");
        }
        // successToast("Quick buy successful!");

        return signedTxs;
      } catch (error) {
        console.error("❌ Quick sell failed:", error);
        throw new Error(
          `Quick sell failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      } finally {
        setIsLoadingTx(false);
      }
    },
    [connections, globalSwapKeys],
  );

  return {
    // Data
    isLoadingFetch: isLoadingTx,
    isLoadingTx,

    // Quick actions
    quickBuy,
    quickSell,
  };
}
