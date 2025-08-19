import bs58 from "bs58";
import { submitTx } from "@/utils/turnkey/serverAuth";
import {
  Transaction,
  Connection,
  Keypair,
  TransactionMessage,
  VersionedTransaction,
  PublicKey,
  AddressLookupTableAccount,
} from "@solana/web3.js";

/**
 * Sign a transaction for a user using their Turnkey wallet
 * This runs on your backend - no user interaction needed
 */
export async function signTransactionForUser(
  userId: string,
  userWalletAddress: string,
  transaction: Transaction,
  connection: Connection,
  privateKeyWallet?: string,
  lutAccount: AddressLookupTableAccount | null = null,
): Promise<{
  signature: string;
  base64tx: string;
}> {
  const { blockhash } = await connection.getLatestBlockhash("processed");
  const message = new TransactionMessage({
    payerKey: new PublicKey(userWalletAddress),
    instructions: transaction.instructions,
    recentBlockhash: blockhash,
  }).compileToV0Message([lutAccount!]);

  try {
    try {
      let secretKey: Buffer;
      if (!privateKeyWallet) {
        throw new Error("privateKeyWallet is required");
      }
      secretKey = Buffer.from(bs58.decode(privateKeyWallet));
      const keypair = Keypair.fromSecretKey(secretKey);
      const tx = new VersionedTransaction(message);
      tx.sign([keypair]);

      // ## [SIMULATE TRANSACTION💵] ##
      const simulationResult = await connection.simulateTransaction(tx);
      console.warn(`✅Simulation Result: `, { simulationResult, message });

      const serializedTx = tx.serialize();
      const base64tx = Buffer.from(serializedTx).toString("base64");

      console.warn(`✅Tx: `, { message });
      console.warn(`✅Sign: https://solscan.io/tx/${bs58.encode(tx.signatures[0])}`,);

      return {
        signature: bs58.encode(tx.signatures[0]),
        base64tx,
      }
    } catch (err) {
      console.error("❌ Transaction failed:", err);
      throw new Error(
        `Transaction failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  } catch (error) {
    throw new Error(
      `Failed to sign transaction: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}
