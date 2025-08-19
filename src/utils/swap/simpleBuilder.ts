import { Connection, LAMPORTS_PER_SOL, PublicKey, Transaction } from "@solana/web3.js";
import { SwapTransactionBuilder } from "./transactionBuilder";
import { SwapApiClient } from "../../apis/rest/swapApi";
import type { SwapTransactionConfig } from "../../types/swap";
import { TXParams } from "./instructionBuilder";

/**
 * Simplified interface for creating swap transactions
 * This is a high-level wrapper that handles most common use cases
 */
export class SimpleSwapBuilder {
  private connection: Connection;
  private apiClient: SwapApiClient;

  constructor(connection: Connection, apiConfig?: any) {
    this.connection = connection;
    this.apiClient = new SwapApiClient(apiConfig);
  }

  /**
   * Creates a buy transaction with minimal configuration
   * @param params - Simple parameters for the swap
   * @returns Promise resolving to a ready-to-sign transaction
   */
  async createBuyTransaction(params: {
    userWallet: string;
    tokenMint: string;
    priorityFee?: number; // in micro-lamports
    computeUnits?: number;
    amountIn: number;
  }): Promise<Transaction> {
    const userPubkey = new PublicKey(params.userWallet);
    const builder = new SwapTransactionBuilder(this.connection, userPubkey);

    // Fetch swap data
    const swapData = await this.apiClient.getSwapKeys({
      wallet: params.userWallet,
      mint: params.tokenMint,
    }) 

    // Build configuration
    const config: SwapTransactionConfig = {};
    if (params.priorityFee !== undefined || params.computeUnits) {
      config.computeBudget = {
        unitLimit: params.computeUnits,
        microLamports:
          params.priorityFee !== undefined
            ? BigInt(params.priorityFee)
            : undefined,
      };
    }
    config.extraLamports = params?.amountIn * LAMPORTS_PER_SOL;

    // Build and prepare transaction
    const transaction = await builder.buildBuyTransaction({
      swapData,
      config,
      publicKey: userPubkey,
      mint: params.tokenMint,
      params: {
        amountIn: params.amountIn,
      },
    });
    return transaction
    // return builder.prepareTransaction(transaction);
  }

  /**
   * Creates a sell transaction with minimal configuration
   * @param params - Simple parameters for the swap
   * @returns Promise resolving to a ready-to-sign transaction
   */
  async createSellTransaction(params: {
    userWallet: string;
    tokenMint: string;
    priorityFee?: number; // in micro-lamports
    computeUnits?: number;
    amountIn: number;
  }): Promise<Transaction> {
    const userPubkey = new PublicKey(params.userWallet);
    const builder = new SwapTransactionBuilder(this.connection, userPubkey);

    // Fetch swap data
    const swapData = await this.apiClient.getSwapKeys({
      wallet: params.userWallet,
      mint: params.tokenMint,
    });

    // Build configuration
    const config: SwapTransactionConfig = {};
    if (params.priorityFee !== undefined || params.computeUnits) {
      config.computeBudget = {
        unitLimit: params.computeUnits,
        microLamports:
          params.priorityFee !== undefined
            ? BigInt(params.priorityFee)
            : undefined,
      };
    }

    // Build and prepare transaction
    const transaction = await builder.buildSellTransaction({
      swapData,
      config,
      params: {
        amountIn: params.amountIn,
      },
    });
    return builder.prepareTransaction(transaction);
  }

  /**
   * Estimates the transaction size and fee
   * @param params - Parameters for estimation
   * @returns Estimated transaction details
   */
  async estimateTransaction(params: {
    userWallet: string;
    tokenMint: string;
    isBuy: boolean;
  }): Promise<{
    instructionCount: number;
    estimatedFee: number;
    requiresWrappedSol: boolean;
  }> {
    // Fetch swap data to analyze
    const swapData = await this.apiClient.getSwapKeys({
      wallet: params.userWallet,
      mint: params.tokenMint,
    });

    const instructions = params.isBuy
      ? swapData.buy_instructions
      : swapData.sell_instructions;

    // Base instructions: compute budget (2) + swap instructions
    let instructionCount = 2 + instructions.length;

    // Add token account creation if needed
    if (swapData.use_wrapped_sol) {
      instructionCount += 1;
    }

    // Rough fee estimation (5000 lamports per signature + compute fee)
    const estimatedFee = 5000 + instructionCount * 1000;

    return {
      instructionCount,
      estimatedFee,
      requiresWrappedSol: swapData.use_wrapped_sol,
    };
  }
}

type BuyParams = {
  connection: Connection;
  userWallet: string;
  tokenMint: string;
  priorityFee?: number; // in micro-lamports
  params: TXParams;
}

type SellParams = {
  connection: Connection;
  userWallet: string;
  tokenMint: string;
  priorityFee?: number; // in micro-lamports
  params: TXParams;
}

/**
 * Quick utility functions for one-off operations
 */
export const QuickSwap = {
  /**
   * Quick buy with default settings
   */
  async buy({
    connection,
    userWallet,
    tokenMint,
    priorityFee,
    params: {
      amountIn,
    },
  }: BuyParams): Promise<Transaction> {
    const builder = new SimpleSwapBuilder(connection);
    return builder.createBuyTransaction({
      userWallet,
      tokenMint,
      priorityFee,
      amountIn,
    });
  },

  /**
   * Quick sell with default settings
   */
  async sell({
    connection,
    userWallet,
    tokenMint,
    priorityFee,
    params: {
      amountIn,
    },
  }: SellParams): Promise<Transaction> {
    const builder = new SimpleSwapBuilder(connection);
    return builder.createSellTransaction({
      userWallet,
      tokenMint,
      priorityFee,
      amountIn,
    });
  },

  /**
   * Serialize transaction to base64 for backend submission
   */
  serialize(transaction: Transaction): string {
    return transaction.serialize().toString("base64");
  },
};
