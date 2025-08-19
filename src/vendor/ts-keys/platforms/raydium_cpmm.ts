import * as solana from "@solana/web3.js";
import * as spl from "@solana/spl-token";

import { SwapRequest, Token, NovaFeeWallet } from "../types";

import { getAssociatedTokenAccount, getWrappedSolAccount, getTokenProgramId } from "../token";

// Raydium CPMM Program Constants
const RAYDIUM_CPMM_PROGRAM_ID = new solana.PublicKey("CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C");
const RAYDIUM_CPMM_AUTHORITY = new solana.PublicKey("GpMZbSM2GgvTKHJirzeGfMFoaZ8UR2X7F4v8vHTvxFbL");

/**
 * Generates all required accounts for Raydium CPMM swap operations
 */
export const getRaydiumCpmmAccounts = (request: SwapRequest, token: Token): solana.AccountMeta[] => {
    const user = request.Wallet.publicKey;

    let wrappedSol = spl.NATIVE_MINT;
    let mint = new solana.PublicKey(token.mint);
    
    let quoteVault = token.swap_keys.raydium_cpmm_sol_vault;
    let baseVault = token.swap_keys.raydium_cpmm_token_vault;

    let quoteTokenAccount = getWrappedSolAccount(user).pubkey;
    let baseTokenAccount = getAssociatedTokenAccount(user, mint, token.is_2022);

    let tokenProgram = spl.TOKEN_PROGRAM_ID;
    let mintProgram = getTokenProgramId(token.is_2022);

    // Swap accounts, vaults, programs, and mints for sell operations
    if (!request.IsBuy) {
        [quoteTokenAccount, baseTokenAccount] = [baseTokenAccount, quoteTokenAccount];
        [quoteVault, baseVault] = [baseVault, quoteVault];
        [tokenProgram, mintProgram] = [mintProgram, tokenProgram];
        [wrappedSol, mint] = [mint, wrappedSol];
    }

    if (!token.swap_keys.raydium_cpmm_pool) {
        throw new Error("Raydium CPMM Pool is not defined in the token swap keys.");
    }
    if (!token.swap_keys.raydium_cpmm_config) {
        throw new Error("Raydium CPMM Config is not defined in the token swap keys.");
    }
    if (!token.swap_keys.raydium_cpmm_observation) {
        throw new Error("Raydium CPMM Observation is not defined in the token swap keys.");
    }
    if (!quoteVault) {
        throw new Error("Raydium CPMM Quote Vault is not defined in the token swap keys.");
    }
    if (!baseVault) {
        throw new Error("Raydium CPMM Base Vault is not defined in the token swap keys.");
    }

    const accounts: solana.AccountMeta[] = [
        // User accounts
        { pubkey: user, isSigner: true, isWritable: true },
        { pubkey: quoteTokenAccount, isSigner: false, isWritable: true },
        { pubkey: baseTokenAccount, isSigner: false, isWritable: true },

        // Token mint accounts
        { pubkey: wrappedSol, isSigner: false, isWritable: true },
        { pubkey: mint, isSigner: false, isWritable: true },

        // Pool and vault accounts
        { pubkey: token.swap_keys.raydium_cpmm_pool, isSigner: false, isWritable: true },
        { pubkey: quoteVault, isSigner: false, isWritable: true },
        { pubkey: baseVault, isSigner: false, isWritable: true },

        // Token programs
        { pubkey: solana.SystemProgram.programId, isSigner: false, isWritable: false},
        { pubkey: tokenProgram, isSigner: false, isWritable: false },
        { pubkey: mintProgram, isSigner: false, isWritable: false },

        // CPMM specific accounts
        { pubkey: token.swap_keys.raydium_cpmm_config, isSigner: false, isWritable: true },
        { pubkey: token.swap_keys.raydium_cpmm_observation, isSigner: false, isWritable: true },

        // Nova fee account
        { pubkey: NovaFeeWallet, isSigner: false, isWritable: true },
        
        // Raydium CPMM program accounts
        { pubkey: RAYDIUM_CPMM_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: RAYDIUM_CPMM_AUTHORITY, isSigner: false, isWritable: false },
    ];

    return accounts;
};