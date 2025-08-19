import * as solana from "@solana/web3.js";
import * as spl from "@solana/spl-token";

import { SwapRequest, Token, NovaFeeWallet } from "../types";

import { getAssociatedTokenAccount, getWrappedSolAccount } from "../token";

// Raydium CLMM Program Constants
const RAYDIUM_CLMM_PROGRAM_ID = new solana.PublicKey("CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK");
const MEMO_PROGRAM_ID = new solana.PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");

/**
 * Generates all required accounts for Raydium CLMM swap operations
 */
export const getRaydiumClmmAccounts = (request: SwapRequest, token: Token): solana.AccountMeta[] => {
    const user = request.Wallet.publicKey;
    const mint = new solana.PublicKey(token.mint);

    let inputMint = spl.NATIVE_MINT;
    let outputMint = mint;

    let quoteTokenAccount = getWrappedSolAccount(user).pubkey;
    let baseTokenAccount = getAssociatedTokenAccount(user, mint, token.is_2022);

    // Get pool data
    const pool = token.swap_keys.raydium_clmm_pool;
    let solVault = token.swap_keys.raydium_clmm_sol_vault;
    let tokenVault = token.swap_keys.raydium_clmm_token_vault;

    // Swap accounts and vaults for sell operations
    if (!request.IsBuy) {
        [quoteTokenAccount, baseTokenAccount] = [baseTokenAccount, quoteTokenAccount];
        [solVault, tokenVault] = [tokenVault, solVault];
        [inputMint, outputMint] = [outputMint, inputMint];
    }

    const clmmConfig = token.swap_keys.raydium_clmm_config;
    const observation = token.swap_keys.raydium_clmm_observation;
    const bitmap = token.swap_keys.raydium_clmm_bitmap;

    if (!pool) {
        throw new Error("Raydium CLMM Pool is not defined in the token swap keys.");
    }

    if (!solVault) {
        throw new Error("Raydium CLMM SOL Vault is not defined in the token swap keys.");
    }

    if (!tokenVault) {
        throw new Error("Raydium CLMM Token Vault is not defined in the token swap keys.");
    }

    if (!clmmConfig) {
        throw new Error("Raydium CLMM AMM Config is not defined in the token swap keys.");
    }

    if (!observation) {
        throw new Error("Raydium CLMM Observation is not defined in the token swap keys.");
    }

    if (!bitmap) {
        throw new Error("Raydium CLMM Bitmap is not defined in the token swap keys.");
    }
   
    let accounts: solana.AccountMeta[] = [
        // User accounts
        { pubkey: user, isSigner: true, isWritable: true },
        { pubkey: quoteTokenAccount, isSigner: false, isWritable: true },
        { pubkey: baseTokenAccount, isSigner: false, isWritable: true },

        // Token mint accounts
        { pubkey: inputMint, isSigner: false, isWritable: true },
        { pubkey: outputMint, isSigner: false, isWritable: true },
        
        // Pool and vault accounts
        { pubkey: pool, isSigner: false, isWritable: true },
        { pubkey: solVault, isSigner: false, isWritable: true },
        { pubkey: tokenVault, isSigner: false, isWritable: true },

        // CLMM specific accounts
        { pubkey: clmmConfig, isSigner: false, isWritable: true },
        { pubkey: observation, isSigner: false, isWritable: true },
        { pubkey: bitmap, isSigner: false, isWritable: true },

        // System programs
        { pubkey: solana.SystemProgram.programId, isSigner: false, isWritable: false},
        { pubkey: spl.TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: spl.TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: MEMO_PROGRAM_ID, isSigner: false, isWritable: false },

        // Nova fee account
        { pubkey: NovaFeeWallet, isSigner: false, isWritable: true },
        
        // Raydium CLMM program
        { pubkey: RAYDIUM_CLMM_PROGRAM_ID, isSigner: false, isWritable: false },
    ];

    // Add remaining accounts if provided
    if (token.remaining_accounts && token.remaining_accounts.length > 0) {
        token.remaining_accounts.forEach(account => {
            accounts.push({ pubkey: account, isSigner: false, isWritable: true });
        });
    }

    return accounts;
};