import { TransactionInstruction, PublicKey } from "@solana/web3.js";
import { Buffer } from 'buffer';

// Compute Budget Program ID (same across all Solana networks)
const COMPUTE_BUDGET_PROGRAM_ID = new PublicKey("ComputeBudget111111111111111111111111111111");

// Jito no front running public key
const JITO_NO_FRONT = new PublicKey("jitodontfront111111111111111111111111111123");

/**
 * Creates a compute unit limit instruction for Solana transactions
 * Converted from Go code - direct port using web3.js
 * @param unitLimit - The compute unit limit (default: 200,000)
 * @returns TransactionInstruction for setting compute unit limit
 */
export function buildComputeUnitLimitInstruction(
  unitLimit: number = 200_000
): TransactionInstruction {
  // Create data array: discriminator (1 byte) + uint32 (4 bytes) = 5 bytes total
  const data = Buffer.alloc(5);
  data[0] = 0x02; // discriminator for SetComputeUnitLimit
  
  // Write uint32 in little endian format (same as Go's binary.LittleEndian.PutUint32)
  data.writeUInt32LE(unitLimit, 1);

  return new TransactionInstruction({
    keys: [
      {
        pubkey: JITO_NO_FRONT,
        isSigner: false,
        isWritable: false,
      },
    ],
    programId: COMPUTE_BUDGET_PROGRAM_ID,
    data,
  });
}

/**
 * Creates a compute unit price instruction for Solana transactions
 * Converted from Go code - direct port using web3.js
 * @param microLamports - Price per compute unit in micro-lamports (default: 50000 = 0.05 lamports)
 * @returns TransactionInstruction for setting compute unit price
 */
export function buildComputeUnitPriceInstruction(
  microLamports: bigint = BigInt(50000)
): TransactionInstruction {
  // Create data array: discriminator (1 byte) + uint64 (8 bytes) = 9 bytes total
  const data = Buffer.alloc(9);
  data[0] = 0x03; // discriminator for SetComputeUnitPrice
  
  // Write uint64 in little endian format (same as Go's binary.LittleEndian.PutUint64)
  // Note: JavaScript numbers are safe up to 2^53, which is more than enough for microLamports
  data.writeBigUInt64LE(microLamports, 1);

  return new TransactionInstruction({
    keys: [
      {
        pubkey: JITO_NO_FRONT,
        isSigner: false,
        isWritable: false,
      },
    ],
    programId: COMPUTE_BUDGET_PROGRAM_ID,
    data,
  });
}

/**
 * Creates both compute budget instructions (limit and price)
 * @param unitLimit - The compute unit limit (default: 200,000)
 * @param microLamports - Price per compute unit in micro-lamports (default: 50000 = 0.05 lamports)
 * @returns Array of TransactionInstructions for compute budget
 */
export function buildComputeBudgetInstructions(
  unitLimit: number = 200_000,
  microLamports: bigint = BigInt(50000)
): TransactionInstruction[] {
  const instructions = [buildComputeUnitLimitInstruction(unitLimit)];
  
  // Always add price instruction since we have a default value now
  instructions.push(buildComputeUnitPriceInstruction(microLamports));
  
  return instructions;
}
