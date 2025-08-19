import {
  Connection,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
} from "@solana/web3.js";
import { createInitializeAccountInstruction } from "@solana/spl-token";
import CryptoJS from "crypto-js";
// import { createHash } from "crypto";
import {
  TOKEN_PROGRAM_ID,
  TOKEN_REQUIRED_SPACE,
  DEFAULT_RENT_LAMPORTS,
  SYSVAR_RENT_ID,
} from "./constants";

/**
 * Generates a token account with a seed (alternative approach)
 * @param payer - The payer's public key
 * @param seed - Seed for account generation
 * @param programId - Program ID for the account
 * @returns Object containing the generated account and seed
 */
export function generateTokenAccount(
  payer: PublicKey,
  seed: string,
  programId: PublicKey,
): { account: PublicKey; seed: Buffer } {
  const shortSeed = seed.slice(0, 32);
  const buffer = Buffer.concat([
    payer.toBytes(),
    Buffer.from(shortSeed),
    programId.toBytes(),
  ]);
  // 1. Hash
  const wordArray = CryptoJS.SHA256(CryptoJS.lib.WordArray.create(buffer));

  // 2. Convert to hex string
  const hex = wordArray.toString(CryptoJS.enc.Hex); // 64-char hex

  // 3. Convert to Buffer or Uint8Array
  const hashBuffer = Uint8Array.from(Buffer.from(hex, "hex")); // ✅ 32 bytes
  // const hash = CryptoJS.SHA256(CryptoJS.lib.WordArray.create(buffer));
  // const hash = createHash("sha256").update(buffer).digest();
  const account = new PublicKey(hashBuffer);
  return { account, seed: Buffer.from(shortSeed) };
}

/**
 * Creates a token account with a seed for wrapped SOL
 * @param connection - Solana connection
 * @param payer - The payer's public key
 * @param seed - Seed string for deterministic account creation
 * @param extraLamports - Additional lamports to fund the account (default: 0)
 * @returns Object containing the instruction and new account public key
 */
export async function createTokenAccountSeeded({
  connection,
  payer,
  seed,
  extraLamports = 0,
}: {
  connection: Connection;
  payer: PublicKey;
  seed: string;
  extraLamports?: number;
}): Promise<{
  instruction: TransactionInstruction;
  newAccountPubkey: PublicKey;
}> {
  // Create the account with seed
  const newAccountPubkey = await PublicKey.createWithSeed(
    payer,
    seed,
    TOKEN_PROGRAM_ID,
  );

  // Calculate rent exemption
  let rentLamports: number;
  try {
    rentLamports =
      await connection.getMinimumBalanceForRentExemption(TOKEN_REQUIRED_SPACE);
  } catch (error) {
    // Fallback to default if RPC call fails
    rentLamports = DEFAULT_RENT_LAMPORTS;
  }

  const lamports = rentLamports + extraLamports;

  // Create the instruction
  const instruction = SystemProgram.createAccountWithSeed({
    fromPubkey: payer,
    basePubkey: payer,
    seed,
    newAccountPubkey,
    lamports,
    space: TOKEN_REQUIRED_SPACE,
    programId: TOKEN_PROGRAM_ID,
  });

  return { instruction, newAccountPubkey };
}

/**
 * SystemProgram.createAccountWithSeed + makeInitAccountInstruction
 *
 * @param connection - Solana connection
 * @param payer - Transaction payer
 * @param owner - Account owner (defaults to payer)
 * @param seed - Seed for account creation
 * @param extraLamports - Additional lamports beyond rent
 * @returns Array of TransactionInstructions (create + initialize)
 */
export async function createCompleteWrappedSolAccount({
  connection,
  payer,
  owner,
  seed,
  extraLamports = 0,
  amountIn,
}: {
  connection: Connection;
  payer: PublicKey;
  owner?: PublicKey;
  seed: string;
  extraLamports?: number;
  amountIn: number;
}): Promise<TransactionInstruction[]> {
  const accountOwner = owner || payer;

  // Create the account address with seed
  const newAccountPubkey = await PublicKey.createWithSeed(
    payer,
    seed,
    TOKEN_PROGRAM_ID,
  );

  // Get rent lamports
  let rentLamports: number;
  try {
    rentLamports =
      await connection.getMinimumBalanceForRentExemption(TOKEN_REQUIRED_SPACE);
  } catch (error) {
    rentLamports = DEFAULT_RENT_LAMPORTS;
  }

  const totalLamports = rentLamports + extraLamports + amountIn;

  const instructions: TransactionInstruction[] = [];

  // 1. Create the raw account (SystemProgram) createAccountWithSeed
  instructions.push(
    SystemProgram.createAccountWithSeed({
      fromPubkey: payer,
      basePubkey: payer,
      seed,
      newAccountPubkey,
      lamports: totalLamports,
      space: TOKEN_REQUIRED_SPACE,
      programId: TOKEN_PROGRAM_ID,
    }),
  );

  // 2. Initialize the account (TokenProgram) makeInitAccountInstruction
  // Use initializeAccount (original version)
  const WRAPPED_SOL_MINT = new PublicKey(
    "So11111111111111111111111111111111111111112",
  );

  instructions.push(
    createInitializeAccountInstruction(
      newAccountPubkey, // account - the token account to initialize
      WRAPPED_SOL_MINT, // mint - the mint for this token account
      accountOwner, // owner - the owner of the token account
      // Note: rent sysvar is handled automatically by the instruction
    ),
  );

  return instructions;
}

/**
 * Single instruction wrapper for transaction builder
 * @param connection - Solana connection
 * @param payer - Payer public key
 * @param seed - Seed for account creation
 * @param extraLamports - Extra lamports to add
 * @returns Array of instructions for complete wrapped SOL account
 */
export async function createCompleteWrappedSolInstructions({
  connection,
  payer,
  seed,
  extraLamports = 0,
  amountIn,
}: {
  connection: Connection;
  payer: PublicKey;
  seed: string;
  extraLamports?: number;
  amountIn: number;
}): Promise<TransactionInstruction[]> {
  return createCompleteWrappedSolAccount({
    connection,
    payer,
    owner: payer,
    seed,
    extraLamports,
    amountIn,
  });
}

/**
 * Creates a simple token account instruction without seed (using default calculation)
 * @param payer - The payer's public key
 * @param seed - Seed string for deterministic account creation
 * @param extraLamports - Additional lamports to fund the account
 * @returns Object containing the instruction and new account public key
 */
export function createTokenAccountSeededSync({
  payer,
  seed,
  extraLamports = 0,
}: {
  payer: PublicKey;
  seed: string;
  extraLamports?: number;
}): Promise<{
  instruction: TransactionInstruction;
  newAccountPubkey: PublicKey;
}> {
  return PublicKey.createWithSeed(payer, seed, TOKEN_PROGRAM_ID).then(
    (newAccountPubkey) => {
      const lamports = DEFAULT_RENT_LAMPORTS + extraLamports;

      const instruction = SystemProgram.createAccountWithSeed({
        fromPubkey: payer,
        basePubkey: payer,
        seed,
        newAccountPubkey,
        lamports,
        space: TOKEN_REQUIRED_SPACE,
        programId: TOKEN_PROGRAM_ID,
      });

      return { instruction, newAccountPubkey };
    },
  );
}
