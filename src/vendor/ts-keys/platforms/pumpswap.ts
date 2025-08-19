import * as solana from "@solana/web3.js";
import * as spl from "@solana/spl-token";

import { SwapRequest, Token, NovaFeeWallet } from "../types";

import { getAssociatedTokenAccount, getWrappedSolAccount } from "../token";
import { getUserVolumeAccumulator } from "./pump";
import base from "base-x";

// PumpSwap Program Constants
const PUMP_SWAP_PROGRAM_ID = new solana.PublicKey("pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA");
const PUMP_SWAP_EVENT_AUTHORITY = new solana.PublicKey("GS4CU59F31iL7aR2Q8zVS8DRrcRnXX1yjQ66TqNVQnaR");
const PUMP_SWAP_GLOBAL_ACCOUNT = new solana.PublicKey("ADyA8hdefvWN2dbGGWFotbzWxrAvLW83WG6QCVXvJKqw");
const PUMP_SWAP_GLOBAL_VOLUME_ACCELERATOR = new solana.PublicKey("C2aFPdENg4A2HQsmrd5rTw5TaYBX5Ku887cWjbFKtZpw");
const PUMP_SWAP_FEE_ACCOUNT = new solana.PublicKey("FWsW1xNtWscwNmKv6wVsU1iTzRN6wmmk3MjxRP5tT7hz");

/**
 * Generates all required accounts for PumpSwap swap operations
 */
export const getPumpSwapAccounts = (request: SwapRequest, token: Token): solana.AccountMeta[] => {
    const user = request.Wallet.publicKey;

    if (!token.swap_keys.pump_swap_pool) {
        throw new Error("PumpSwap swap requires a valid PumpSwap Pool");
    }

    if (!token.swap_keys.pump_swap_creator_vault_account) {
        throw new Error("PumpSwap swap requires a valid PumpSwap Coin Creator Vault Token Account");
    }

    if (!token.swap_keys.pump_swap_creator_vault_authority) {
        throw new Error("PumpSwap swap requires a valid PumpSwap Coin Creator Vault Authority");
    }

    if (!token.swap_keys.base_mint) {
        throw new Error("PumpSwap swap requires a valid Base Mint");
    }

    if (!token.swap_keys.quote_mint) {
        throw new Error("PumpSwap swap requires a valid Quote Mint");
    }
    
    // Token mint accounts
    const baseMint = token.swap_keys.base_mint;
    const quoteMint = token.swap_keys.quote_mint;
    const pool = token.swap_keys.pump_swap_pool;

    // Determine user token accounts based on which mint is SOL
    let userBaseTokenAccount: solana.PublicKey;
    let userQuoteTokenAccount: solana.PublicKey;

    if (baseMint.equals(spl.NATIVE_MINT)) {
        userBaseTokenAccount = getWrappedSolAccount(user).pubkey;
        userQuoteTokenAccount = getAssociatedTokenAccount(user, quoteMint, false);
    } else {
        userBaseTokenAccount = getAssociatedTokenAccount(user, baseMint, false);
        userQuoteTokenAccount = getWrappedSolAccount(user).pubkey;
    }

    // Pool token accounts
    const baseTokenAccount = getAssociatedTokenAccount(pool, baseMint, false);
    const quoteTokenAccount = getAssociatedTokenAccount(pool, quoteMint, false);
    const feeTokenAccount = getAssociatedTokenAccount(PUMP_SWAP_FEE_ACCOUNT, quoteMint, false);
    const userVolumeAccumulator = getUserVolumeAccumulator(user, PUMP_SWAP_PROGRAM_ID);

    const accounts: solana.AccountMeta[] = [
        // User accounts
        { pubkey: user, isSigner: true, isWritable: true },
        { pubkey: userBaseTokenAccount, isSigner: false, isWritable: true },
        { pubkey: userQuoteTokenAccount, isSigner: false, isWritable: true },

        // Token mint accounts
        { pubkey: baseMint, isSigner: false, isWritable: false },
        { pubkey: quoteMint, isSigner: false, isWritable: false },
        
        // Pool and liquidity accounts
        { pubkey: pool, isSigner: false, isWritable: true },
        { pubkey: baseTokenAccount, isSigner: false, isWritable: true },
        { pubkey: quoteTokenAccount, isSigner: false, isWritable: true },

        // Fee and creator accounts
        { pubkey: feeTokenAccount, isSigner: false, isWritable: true },
        { pubkey: token.swap_keys.pump_swap_creator_vault_account, isSigner: false, isWritable: true },
        { pubkey: token.swap_keys.pump_swap_creator_vault_authority, isSigner: false, isWritable: false },
        { pubkey: userVolumeAccumulator, isSigner: false, isWritable: true },

        // System programs
        { pubkey: solana.SystemProgram.programId, isSigner: false, isWritable: false },
        { pubkey: spl.TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: spl.ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },

        // Nova fee account
        { pubkey: NovaFeeWallet, isSigner: false, isWritable: true },
        
        // PumpSwap program accounts
        { pubkey: PUMP_SWAP_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: PUMP_SWAP_EVENT_AUTHORITY, isSigner: false, isWritable: false },
        { pubkey: PUMP_SWAP_GLOBAL_ACCOUNT, isSigner: false, isWritable: true },
        { pubkey: PUMP_SWAP_GLOBAL_VOLUME_ACCELERATOR, isSigner: false, isWritable: true },
        { pubkey: PUMP_SWAP_FEE_ACCOUNT, isSigner: false, isWritable: true },
    ];

    return accounts;
};