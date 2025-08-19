import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import type { SwapKeysResponse, SwapTransactionConfig } from "../../types/swap";
import { buildComputeBudgetInstructions } from "./computeBudget";
import { createCompleteWrappedSolInstructions } from "./tokenAccount";
import {
  buildInstructionsFromApi,
  TXParams,
  validateSwapInstruction,
} from "./instructionBuilder";
import {
  DEFAULT_COMPUTE_UNIT_LIMIT,
  DEFAULT_COMPUTE_UNIT_PRICE,
} from "./constants";
import { createWsolInstruction, getWsolAccount } from "./wsolAccount";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountIdempotentInstruction,
  createCloseAccountInstruction,
  createInitializeAccountInstruction,
  NATIVE_MINT,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import bs58 from "bs58";

type BuildBuyTransactionParams = {
  swapData: SwapKeysResponse;
  config: SwapTransactionConfig;
  publicKey: PublicKey;
  mint: string;
  params: TXParams;
};

type BuildSellTransactionParams = {
  swapData: SwapKeysResponse;
  config: SwapTransactionConfig;
  params: TXParams;
};

type ValidateAndBuildInstructions = {
  method: number;
  instructions: any[];
  params: TXParams;
};

export const USDC_MINT = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");

/**
 * Main class for building Solana swap transactions
 */
export class SwapTransactionBuilder {
  private connection: Connection;
  private payer: PublicKey;

  constructor(connection: Connection, payer: PublicKey) {
    this.connection = connection;
    this.payer = payer;
  }

  /**
   * Builds a complete swap transaction for buying tokens
   * @param swapData - Response from /api-v1/swap/keys endpoint
   * @param config - Optional configuration for the transaction
   * @param mint - Mint address of the token to buy
   * @returns Transaction ready to be signed and sent
   */
  async buildBuyTransaction({
    swapData,
    config,
    publicKey,
    mint,
    params: { amountIn },
  }: BuildBuyTransactionParams): Promise<Transaction> {
    // const base58SecretKey = process.env.DUMMY_PRIVATE_KEY!;
    // const secretKey = bs58.decode(base58SecretKey);
    // const privateKey = Keypair.fromSecretKey(secretKey);

    // const walletInfo = await authenticateUser(userId);
    // const publicKey = privateKey.publicKey;
    const mintPk = new PublicKey(mint);
    const tx = new Transaction();

    // 1. Add compute budget instructions
    const computeBudgetInstructions = buildComputeBudgetInstructions(
      config.computeBudget?.unitLimit ?? DEFAULT_COMPUTE_UNIT_LIMIT,
      config.computeBudget?.microLamports ?? DEFAULT_COMPUTE_UNIT_PRICE,
    );
    tx.add(...computeBudgetInstructions);

    // 2. Add wrapped SOL account creation if needed
    let wsolAccResp;
    // Use new deterministic WSOL account logic
    if (swapData.use_wrapped_sol) {
      wsolAccResp = await getWsolAccount(this.payer);
      // const closeWsolIx = createCloseAccountInstruction(
      //   accResp?.pubkey, // WSOL account to close
      //   publicKey, // destination (user wallet)
      //   publicKey, // owner (user wallet)
      //   undefined,
      //   TOKEN_PROGRAM_ID,
      // );
      // tx.add(closeWsolIx);
      const createWsolIx = await createWsolInstruction({
        Payer: this.payer,
        Account: wsolAccResp.pubkey,
        Seed: wsolAccResp.seed,
        ExtraLamports: (config.extraLamports ?? 0),
      });
      const initWsolIx = createInitializeAccountInstruction(
        wsolAccResp.pubkey,
        NATIVE_MINT,
        publicKey,
        TOKEN_PROGRAM_ID,
      );
      tx.add(createWsolIx, initWsolIx);
    }

    // 3. Add USDC account creation if needed
    let usdcAccResp;
    if (swapData?.use_usd) {
      usdcAccResp = PublicKey.findProgramAddressSync([
        publicKey.toBytes(),
        TOKEN_PROGRAM_ID.toBytes(),
        USDC_MINT.toBytes(),
      ], ASSOCIATED_TOKEN_PROGRAM_ID)

      const associatedTokenAccount = usdcAccResp[0]
      const createUsdcIx = createAssociatedTokenAccountIdempotentInstruction(
        publicKey,
        associatedTokenAccount,
        publicKey,
        USDC_MINT,
      )

      tx.add(createUsdcIx)
    }
    console.log("USDC Account Response:", { usdcAccResp, use_usdc: swapData?.use_usd });

    // 4. Add buy instructions from API
    try {
      const associatedResp = PublicKey.findProgramAddressSync(
        [publicKey.toBytes(), TOKEN_PROGRAM_ID.toBytes(), mintPk.toBytes()],
        ASSOCIATED_TOKEN_PROGRAM_ID,
      );

      const associatedTokenAccount = associatedResp[0];
      const mintIx = createAssociatedTokenAccountIdempotentInstruction(
        publicKey,
        associatedTokenAccount,
        publicKey,
        mintPk,
      );
      tx.add(mintIx);

      const buyInstructions = buildInstructionsFromApi({
        method: swapData.dex_method,
        instructions: swapData.buy_instructions,
        params: {
          amountIn: amountIn,
          isUsd: swapData.use_usd,
        },
      });
      tx.add(...buyInstructions);

      // Add close account instruction for WSOL
      if (swapData?.use_wrapped_sol && wsolAccResp) {
        const closeWsolIx = createCloseAccountInstruction(
          wsolAccResp?.pubkey, // WSOL account to close
          publicKey, // destination (user wallet)
          publicKey, // owner (user wallet)
          undefined,
          TOKEN_PROGRAM_ID,
        );
        tx.add(closeWsolIx);
      }

      if (swapData?.use_usd && usdcAccResp) {
        const closeUsdcIx = createCloseAccountInstruction(
          usdcAccResp[0], // USDC account to close
          publicKey, // destination (user wallet)
          publicKey, // owner (user wallet)
          undefined,
          TOKEN_PROGRAM_ID,
        );

        tx.add(closeUsdcIx);
      }

      // If we get here, the issue was in the validation step
    } catch (buildError) {
      // If building fails, log the error and try alternative
      throw new Error(
        `Failed to build instructions from API: ${buildError instanceof Error ? buildError.message : "Unknown error"}`,
      );
    }

    return tx;
  }

  /**
   * Builds a complete swap transaction for selling tokens
   * @param swapData - Response from /api-v1/swap/keys endpoint
   * @param config - Optional configuration for the transaction
   * @returns Transaction ready to be signed and sent
   */
  async buildSellTransaction({
    swapData,
    config,
    params: {
      amountIn,
    },
  }: BuildSellTransactionParams): Promise<Transaction> {
    const tx = new Transaction();

    // 1. Add compute budget instructions
    const computeBudgetInstructions = buildComputeBudgetInstructions(
      config.computeBudget?.unitLimit ?? DEFAULT_COMPUTE_UNIT_LIMIT,
      config.computeBudget?.microLamports ?? DEFAULT_COMPUTE_UNIT_PRICE,
    );
    tx.add(...computeBudgetInstructions);

    // 2. Add wrapped SOL account creation if needed (less common for sells)
    if (swapData.use_wrapped_sol) {
      const tokenAccountInstructions = await this.createWrappedSolAccount(
        config.tokenAccountSeed ?? this.generateRandomSeed(),
        config.extraLamports ?? 0,
        amountIn,
      );
      tx.add(...tokenAccountInstructions); // Spread the array since it's now multiple instructions
    }

    // 3. Add sell instructions from API
    const sellInstructions = this.validateAndBuildInstructions({
      method: swapData.dex_method,
      instructions: swapData.sell_instructions,
      params: {
        amountIn: amountIn,
      },
    });
    tx.add(...sellInstructions);

    return tx;
  }

  /**
   * Creates a wrapped SOL token account
   * Creates AND initializes the account (SystemProgram + TokenProgram)
   * @param seed - Seed for account creation
   * @param extraLamports - Additional lamports to fund the account
   * @returns Array of TransactionInstructions for complete wrapped SOL account
   */
  private async createWrappedSolAccount(
    seed: string,
    extraLamports: number = 0,
    amountIn: number,
  ): Promise<TransactionInstruction[]> {
    return createCompleteWrappedSolInstructions({
      connection: this.connection,
      payer: this.payer,
      seed,
      extraLamports,
      amountIn,
    });
  }

  /**
   * Validates and builds instructions from API response
   * @param instructions - Instructions from API
   * @returns Array of validated TransactionInstructions
   */
  private validateAndBuildInstructions({
    method,
    instructions,
    params,
  }: ValidateAndBuildInstructions): TransactionInstruction[] {
    // Validate instructions
    for (const instruction of instructions) {
      if (!validateSwapInstruction(instruction)) {
        throw new Error(`Invalid instruction: ${JSON.stringify(instruction)}`);
      }
    }

    // Build instructions
    return buildInstructionsFromApi({
      method,
      instructions,
      params,
    });
  }

  /**
   * Generates a seed for token account creation
   * Uses wrapped SOL mint address as seed for consistency
   * @returns Seed string for token account creation
   */
  private generateRandomSeed(): string {
    return "So111111111111111111111111111111";
  }

  /**
   * Sets a recent blockhash on the transaction with retry logic
   * @param transaction - Transaction to update
   * @returns Updated transaction with recent blockhash
   */
  async setRecentBlockhash(transaction: Transaction): Promise<Transaction> {
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const { blockhash } =
          await this.connection.getLatestBlockhash("confirmed");
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = this.payer;
        return transaction;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("Unknown error");

        console.warn(
          `Failed to get blockhash (attempt ${attempt}/${maxRetries}):`,
          lastError.message,
        );

        // If this was a 403 error or rate limit, wait before retrying
        if (
          lastError.message.includes("403") ||
          lastError.message.includes("rate limit")
        ) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
        }

        // If not the last attempt, continue to retry
        if (attempt < maxRetries) {
          continue;
        }
      }
    }

    // If all retries failed, throw the last error with helpful context
    throw new Error(
      `Failed to get recent blockhash after ${maxRetries} attempts. ` +
      `This may be due to RPC rate limiting or network issues. ` +
      `Original error: ${lastError?.message || "Unknown error"}`,
    );
  }

  /**
   * Prepares a transaction for sending (adds blockhash and fee payer)
   * @param transaction - Transaction to prepare
   * @returns Prepared transaction ready for signing
   */
  async prepareTransaction(transaction: Transaction): Promise<Transaction> {
    return this.setRecentBlockhash(transaction);
  }
}
