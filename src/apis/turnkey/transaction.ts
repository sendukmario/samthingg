import { QuickSwap } from "@/utils/swap";
import { AddressLookupTableAccount, Connection, Transaction } from "@solana/web3.js";

interface MakeTransactionParams {
  connection: Connection;
  action: "buy" | "sell";
  tokenMint: string;
  walletAddress: string;
  priorityFee?: number;
  amountIn: number;
  lutAccount?: AddressLookupTableAccount | null;
}

export async function createTransaction({
  connection,
  action = "buy",
  tokenMint,
  walletAddress,
  priorityFee = 5000,
  amountIn,
  lutAccount
}: MakeTransactionParams): Promise<Transaction> {
  // Build transaction based on action
  let transaction: Transaction;

  switch (action) {
    case "buy":
      // Use the actual wallet address from Turnkey
      transaction = await QuickSwap.buy({
        connection,
        userWallet: walletAddress,
        tokenMint,
        priorityFee,
        params: {
          amountIn: amountIn,
        },
      });
      break;
    case "sell":
      // Use the actual wallet address from Turnkey
      transaction = await QuickSwap.sell({
        connection,
        userWallet: walletAddress,
        tokenMint,
        priorityFee,
        params: {
          amountIn: amountIn,
        },
      });
      break;
  }

  return transaction;
}
