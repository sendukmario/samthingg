import { getOrCreateUserWallet } from "@/utils/turnkey/serverAuth";

export interface WalletInfo {
  walletAddress: string;
  organizationId: string;
  isNewWallet: boolean;
}

/**
 * Helper function to authenticate and get user wallet info
 * This should be called before any transaction to ensure user has a wallet
 */
export async function authenticateUser(userId: string): Promise<WalletInfo> {
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
