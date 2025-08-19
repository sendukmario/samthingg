/**
 * API route: /api/turnkey/sign-tx
 *
 */

import { NextRequest, NextResponse } from "next/server";
import { validateTurnkeyConfig } from "@/apis/turnkey/validate";
import { authenticateUser, WalletInfo } from "@/apis/turnkey/authentication";
import { signTransactionForUser } from "@/apis/turnkey/signTxUser";
import { createTransaction } from "@/apis/turnkey/transaction";
import { getSolanaConnection } from "@/apis/turnkey/initialize";

export interface SignTransactionRequest {
  userId: string;
  tokenMint: string;
  action: "buy" | "sell";
  amount: number;
  priorityFee: number;
  useServerSideSigning: boolean;
}

export interface SignTransactionResponse {
  data: {
    transaction: string;
    walletInfo: WalletInfo;
  } | null;
  success: boolean;
  error: string | null;
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse<SignTransactionResponse>> {
  try {
    // Validate Turnkey configuration
    validateTurnkeyConfig();

    // get request body
    const {
      userId,
      tokenMint,
      action,
      amount,
      priorityFee = 0,
      useServerSideSigning = false,
    } = (await request.json()) as SignTransactionRequest;

    // validate request body
    if (!userId || !tokenMint || !action || !amount) {
      const response: SignTransactionResponse = {
        data: null,
        success: false,
        error: "Missing required parameters",
      };
      return NextResponse.json(response, { status: 400 });
    }

    if (!useServerSideSigning) {
      const response: SignTransactionResponse = {
        data: null,
        success: false,
        error: "Server-side signing is required for this endpoint",
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Authenticate user and get/create wallet
    const walletInfo = await authenticateUser(userId);

    // Use the wallet address from Turnkey authentication (authoritative source)
    const actualWalletAddress = walletInfo.walletAddress;

    // Ensure we're using the same wallet address throughout
    if (walletInfo.walletAddress !== actualWalletAddress) {
      const response: SignTransactionResponse = {
        data: null,
        success: false,
        error: `Wallet address mismatch. Request: ${walletInfo.walletAddress}, Turnkey: ${actualWalletAddress}`,
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Initialize Solana connection
    const connection = getSolanaConnection();

    const transaction = await createTransaction({
      connection,
      action,
      tokenMint,
      walletAddress: actualWalletAddress,
      priorityFee,
      amountIn: amount,
    });
    console.log("Transaction created:", JSON.stringify(transaction));
    // throw new Error("This is a test error");

    // Sign transaction server-side using the actual wallet address
    const signedTransactionBase64 = await signTransactionForUser(
      userId,
      actualWalletAddress,
      transaction,
      connection,
    );

    return NextResponse.json({
      data: {
        transaction: signedTransactionBase64.base64tx,
        walletInfo: walletInfo,
      },
      success: true,
      error: null,
    });
  } catch (error) {
    console.error("Turnkey authentication error:", error);

    const response: SignTransactionResponse = {
      data: null,
      success: false,
      error: error instanceof Error ? error.message : "Authentication failed",
    };
    return NextResponse.json(response, { status: 500 });
  }
}
