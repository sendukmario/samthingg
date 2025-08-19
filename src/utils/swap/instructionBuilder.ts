import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import type { SwapInstruction, SwapInstructionAccount } from "../../types/swap";
import { struct, u64, u8, bool } from "@coral-xyz/borsh";
import * as solana from "@solana/web3.js";
import BN from "bn.js";

export const NovaInstructionParamsSchema = struct([
  u8("method"), // Method field
  u64("amountIn"), // AmountIn in lamports
  u64("minAmountOut"), // MinAmountOut
  u64("slippage"), // Slippage
  u8("novaFee"), // NovaFee
  bool("isSell"), // IsSell boolean
  bool("isUsd"), // IsUsd boolean
]);

const NOVA_PROGRAM = new solana.PublicKey('6iWkWFXfLdRwSm8Tx8sXUagDgG1kZn94fWPZWLsF4bUc')

export type TXParams = {
  amountIn: number;
  isUsd?: boolean;
}

type BuildInstructionFromAccountsParams = {
  accounts: SwapInstructionAccount[];
  programId: string;
  method: number;
  params: TXParams;
};

/**
 * Builds a TransactionInstruction from API response data
 * @param accounts - Array of account objects from API
 * @param programId - Program ID string
 * @param data - Base64 encoded instruction data (optional)
 * @returns TransactionInstruction ready to be added to a transaction
 */
export function buildInstructionFromAccounts({
  accounts,
  programId,
  method,
  params: {
    amountIn,
    isUsd
  },
}: BuildInstructionFromAccountsParams): TransactionInstruction {
  // Convert accounts to the format expected by TransactionInstruction
  const keys = accounts.map(({ account, isSigner, isWritable }) => ({
    pubkey: new PublicKey(account),
    isSigner,
    isWritable,
  }));

  let data = Buffer.alloc(NovaInstructionParamsSchema.span);
  NovaInstructionParamsSchema.encode(
    {
      method: method,
      amountIn: new BN(amountIn * solana.LAMPORTS_PER_SOL),
      minAmountOut: new BN(0),
      slippage: new BN(500),
      novaFee: 1,
      isSell: false,
      isUsd: isUsd
    },
    data,
  );

  return new TransactionInstruction({
    keys,
    programId: new PublicKey(programId),
    data: data,
  });
}

type BuildInstructionsFromApiParams = {
  method: number;
  instructions: SwapInstruction[];
  params: TXParams;
};

/**
 * Builds multiple TransactionInstructions from an array of API instructions
 * @param instructions - Array of swap instructions from API
 * @returns Array of TransactionInstructions
 */
export function buildInstructionsFromApi({
  method,
  instructions,
  params: {
    amountIn,
    isUsd
  },
}: BuildInstructionsFromApiParams): TransactionInstruction[] {
  return instructions
    .filter((ix) => ix.program_id === NOVA_PROGRAM?.toString())
    .map((instruction, i) =>
      buildInstructionFromAccounts(
        {
          accounts: instruction.accounts,
          programId: instruction.program_id,
          method,
          params: {
            amountIn,
            isUsd
          },
        },
      ),
    );
}

/**
 * Validates that an account string is a valid Solana public key
 * @param account - Account string to validate
 * @returns Boolean indicating if the account is valid
 */
export function isValidPublicKey(account: string): boolean {
  try {
    new PublicKey(account);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates a swap instruction object
 * @param instruction - Swap instruction to validate
 * @returns Boolean indicating if the instruction is valid
 */
export function validateSwapInstruction(instruction: SwapInstruction): boolean {
  try {
    // Check if program_id is valid
    if (!isValidPublicKey(instruction.program_id)) {
      return false;
    }

    // Check if all accounts are valid
    for (const account of instruction.accounts) {
      if (!isValidPublicKey(account.account)) {
        return false;
      }
      // Validate boolean fields
      if (
        typeof account.isSigner !== "boolean" ||
        typeof account.isWritable !== "boolean"
      ) {
        return false;
      }
    }

    // Check if data is valid base64 (if provided)
    if (instruction.data) {
      try {
        Buffer.from(instruction.data, "base64");
      } catch {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}
