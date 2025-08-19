import { PublicKey } from "@solana/web3.js";

// Solana Program IDs
export const COMPUTE_BUDGET_PROGRAM_ID = new PublicKey(
  "ComputeBudget111111111111111111111111111111"
);

export const JITO_NO_FRONT = new PublicKey(
  "jitodontfront111111111111111111111111111123"
);

export const TOKEN_PROGRAM_ID = new PublicKey(
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
);

export const SYSTEM_PROGRAM_ID = new PublicKey(
  "11111111111111111111111111111111"
);

export const WRAPPED_SOL_MINT = new PublicKey(
  "So11111111111111111111111111111111111111112"
);

export const SYSVAR_RENT_ID = new PublicKey(
  "SysvarRent111111111111111111111111111111111"
);

// Constants
export const TOKEN_REQUIRED_SPACE = 165;
export const DEFAULT_RENT_LAMPORTS = 2039280;

// Default compute budget values
export const DEFAULT_COMPUTE_UNIT_LIMIT = 200_000;
export const DEFAULT_COMPUTE_UNIT_PRICE = BigInt(50000); // 0.05 lamports per compute unit
