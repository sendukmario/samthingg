// ======================================================
import bs58 from "bs58";
import {
  Keypair,
  Connection,
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction,
  PublicKey,
  clusterApiUrl,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
// ======================================================

/**
 * Server-side Turnkey authentication and wallet management utilities
 * This handles user wallet creation and authentication on the backend
 */

import { Turnkey } from "@turnkey/sdk-server";
import axios from "@/libraries/axios";
import { TurnkeySigner } from "@turnkey/solana";
// import { Connection, Transaction, PublicKey } from "@solana/web3.js";

// Server-side Turnkey client (no browser dependencies)
let turnkeyClient: Turnkey | null = null;

/**
 * Initialize the server-side Turnkey client
 */
function getTurnkeyClient(): Turnkey {
  if (!turnkeyClient) {
    turnkeyClient = new Turnkey({
      apiBaseUrl: process.env.TURNKEY_API_BASE_URL || "https://api.turnkey.com",
      apiPrivateKey: process.env.TURNKEY_API_PRIVATE_KEY!,
      apiPublicKey: process.env.TURNKEY_API_PUBLIC_KEY!,
      defaultOrganizationId: process.env.TURNKEY_ORGANIZATION_ID!,
    });
  }
  return turnkeyClient;
}

/**
 * Create or retrieve a user's Turnkey wallet
 * This should be called on your backend when a user registers/logs in
 */
/**
 * Create or retrieve a user's Turnkey wallet
 * This should be called on your backend when a user registers/logs in
 */
export async function getOrCreateUserWallet(userId: string): Promise<{
  walletAddress: string;
  organizationId: string;
  isNewWallet: boolean;
}> {
  // For development/testing, use hardcoded wallet address from env
  const hardcodedWalletAddress = process.env.TURNKEY_WALLET_ADDRESS;

  if (hardcodedWalletAddress) {
    return {
      walletAddress: hardcodedWalletAddress,
      organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
      isNewWallet: false,
    };
  }

  // If no hardcoded wallet, fallback to dynamic creation (original logic)
  const client = getTurnkeyClient();

  try {
    // First, try to find existing wallets for this user
    const walletsResponse = await client.apiClient().list({
      organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
    });

    // Look for a wallet that matches this user (by name pattern)
    const existingWallet = walletsResponse.wallets.find((wallet: any) =>
      wallet.walletName.includes(`user-${userId}`),
    );

    if (existingWallet) {
      // Get the wallet accounts to find the address
      const accountsResponse = await client.apiClient().listWalletAccounts({
        organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
        walletId: existingWallet.walletId,
      });

      if (accountsResponse.accounts.length > 0) {
        return {
          walletAddress: accountsResponse.accounts[0].address,
          organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
          isNewWallet: false,
        };
      }
    }

    // If no existing wallet found, create a new one
    const walletResponse = await client.apiClient().createWallet({
      organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
      walletName: `user-${userId}-wallet-${Date.now()}`,
      accounts: [
        {
          curve: "CURVE_ED25519",
          pathFormat: "PATH_FORMAT_BIP32",
          path: "m/44'/501'/0'/0'", // Solana derivation path
          addressFormat: "ADDRESS_FORMAT_SOLANA",
        },
      ],
    });

    const walletAddress =
      walletResponse.activity.result?.createWalletResult?.addresses?.[0];

    if (!walletAddress) {
      throw new Error("Failed to create wallet - no address returned");
    }

    return {
      walletAddress,
      organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
      isNewWallet: true,
    };
  } catch (error) {
    throw new Error(
      `Failed to create/retrieve user wallet: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

export type ModuleType =
  | "Quick Buy"
  | "Quick Sell"
  | "holdings"
  | "wallet_tracker"
  | "ignite"
  | "created"
  | "about_to_graduate"
  | "graduated"
  | "token_page"
  | "monitor";

export type SubmitTxRequest = {
  mint: string;
  method: string;
  module: ModuleType;
  transactions: {
    wallet: string;
    transaction: string;
  }[];
};

export async function submitTx(prop: SubmitTxRequest): Promise<boolean> {
  console.log("Submitting transaction with properties:", prop.transactions[0]);
  const res = await axios.post(
    process.env.NEXT_PUBLIC_REST_MAIN_URL + "/submit-encoded-transaction",
    prop,
  );
  console.log("Transaction submission response:", res.data);
  return res.status === 200;
}

/**
 * Sign a transaction for a user using their Turnkey wallet
 * This runs on your backend - no user interaction needed
 */
export async function signTransactionForUser(
  userWalletAddress: string,
  transaction: Transaction,
  connection: Connection,
): Promise<string> {
  // const turnkeyClient = getTurnkeyClient();
  // Initialize Turnkey client
  const turnkeyClient = new Turnkey({
    apiBaseUrl: process.env.TURNKEY_API_BASE_URL || "https://api.turnkey.com",
    apiPrivateKey: process.env.TURNKEY_API_PRIVATE_KEY!,
    apiPublicKey: process.env.TURNKEY_API_PUBLIC_KEY!,
    defaultOrganizationId: process.env.TURNKEY_ORGANIZATION_ID!,
  });

  const userInfo = await turnkeyClient.apiClient().getUser({
    userId: "5cdea475-3d7f-4cd9-8492-2e4d2fddb3ae",
  });
  console.log("User info:", userInfo);

  // Initialize Turnkey Solana signer
  const turnkeySigner = new TurnkeySigner({
    client: turnkeyClient.apiClient(),
    organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
  });
  const { blockhash } = await connection.getLatestBlockhash("processed");
  // const message = new TransactionMessage({
  //   payerKey: new PublicKey(userWalletAddress),
  //   instructions: transaction.instructions,
  //   recentBlockhash: blockhash,
  // }).compileToV0Message();

  try {
    // Serialize the transaction for signing
    // const serializedTransaction = transaction.serialize({
    //   requireAllSignatures: false,
    // });

    // const payload = {
    //   organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
    //   signWith: userWalletAddress, // Use the wallet address
    //   payload: serializedTransaction.toString("hex"),
    //   encoding: "PAYLOAD_ENCODING_HEXADECIMAL",
    //   hashFunction: "HASH_FUNCTION_NOT_APPLICABLE", // Important for Ed25519
    // } as any;

    // ======================================================

    // Step 1: Decode base58 private key and create Keypair
    const base58SecretKey = process.env.DUMMY_PRIVATE_KEY!;
    const secretKey = bs58.decode(base58SecretKey);
    const keypair = Keypair.fromSecretKey(secretKey);

    const { blockhash } = await connection.getLatestBlockhash("processed");
    const message = new TransactionMessage({
      payerKey: keypair.publicKey,
      instructions: transaction.instructions,
      recentBlockhash: blockhash,
    }).compileToV0Message();

    // Step 3: Create transaction (e.g., send 0.01 SOL to another address)
    // const recipient = new PublicKey((process.env.NEXT_PUBLIC_TURNKEY_WALLET_ADDRESS || process.env.TURNKEY_WALLET_ADDRESS)!);

    // Step 4: Sign and send the transaction
    try {
      const versionedTx = new VersionedTransaction(message);

      // Sign the transaction using Turnkey
      const signedTx = await turnkeySigner.signTransaction(
        versionedTx,
        userWalletAddress,
      );

      // Serialize the signed transaction
      const serializedTx = signedTx.serialize();
      const base64tx = Buffer.from(serializedTx).toString("base64");
      console.log("Serialized transaction:", base64tx);
      // const success = await submitTx(base64tx);

      // if (!success) {
      //   throw new Error("Transaction submission failed");
      // }

      // Ensure the signature is a Uint8Array before encoding
      const sig = signedTx.signatures[0];
      const signatureBytes = sig instanceof Uint8Array ? sig : sig.signature;
      if (!signatureBytes) {
        throw new Error("Signature bytes are null or undefined");
      }
      return bs58.encode(signatureBytes);
    } catch (err) {
      console.error("❌ Transaction failed:", err);
      throw new Error(
        `Transaction failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
    // ======================================================

    // console.log("Signing transaction with Turnkey for user:", JSON.stringify(payload));

    // // Use signRawPayload for complex transactions
    // const signResult = await turnkeyClient.apiClient().signRawPayload(payload);

    // const signatureResult = signResult.activity.result?.signRawPayloadResult;

    // if (!signatureResult || !signatureResult.r || !signatureResult.s) {
    //   throw new Error("No valid signature result returned from Turnkey");
    // }

    // // For Solana Ed25519 signatures, combine r and s
    // const rBytes = Buffer.from(signatureResult.r, "hex");
    // const sBytes = Buffer.from(signatureResult.s, "hex");
    // const signatureBytes = Buffer.concat([rBytes, sBytes]);

    // // Ensure signature is exactly 64 bytes for Ed25519
    // if (signatureBytes.length !== 64) {
    //   throw new Error(
    //     `Invalid signature length: expected 64 bytes, got ${signatureBytes.length}`,
    //   );
    // }

    // // Add the signature to the transaction
    // transaction.addSignature(new PublicKey(userWalletAddress), signatureBytes);

    // // Return the fully signed transaction as base64
    // const signedTransaction = transaction.serialize().toString("base64");

    // return signedTransaction;
  } catch (error) {
    throw new Error(
      `Failed to sign transaction: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Helper function to authenticate and get user wallet info
 * This should be called before any transaction to ensure user has a wallet
 */
export async function authenticateUser(userId: string): Promise<{
  walletAddress: string;
  organizationId: string;
  isNewWallet: boolean;
}> {
  try {
    // In a real app, you'd check your database first
    // For now, we'll assume we need to create/retrieve the wallet
    const walletInfo = await getOrCreateUserWallet(userId);

    return {
      ...walletInfo,
      isNewWallet: false, // You'd determine this based on database lookup
    };
  } catch (error) {
    throw new Error(
      `User authentication failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Validate that all required Turnkey environment variables are set
 */
export function validateTurnkeyConfig(): void {
  const required = [
    "TURNKEY_API_PRIVATE_KEY",
    "TURNKEY_API_PUBLIC_KEY",
    "TURNKEY_ORGANIZATION_ID",
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required Turnkey environment variables: ${missing.join(", ")}`,
    );
  }
}
