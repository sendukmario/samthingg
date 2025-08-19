import * as solana from "@solana/web3.js";
import * as spl from "@solana/spl-token";

import { SwapRequest, Token, NovaFeeWallet } from "../types";

import { getAssociatedTokenAccount, getWrappedSolAccount } from "../token";

// Raydium AMM Program Constants
const RAYDIUM_AMM_PROGRAM_ID = new solana.PublicKey("675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8");
const RAYDIUM_AUTHORITY = new solana.PublicKey("5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1");

/**
 * Generates all required accounts for Raydium AMM swap operations
 */
export const getRaydiumAmmAccounts = (request: SwapRequest, token: Token): solana.AccountMeta[] => {
    const user = request.Wallet.publicKey;
    const mint = new solana.PublicKey(token.mint);

    let quoteTokenAccount = getWrappedSolAccount(user).pubkey;
    let baseTokenAccount = getAssociatedTokenAccount(user, mint, token.is_2022);

    // Swap accounts for sell operations
    if (!request.IsBuy) {
        [quoteTokenAccount, baseTokenAccount] = [baseTokenAccount, quoteTokenAccount];
    }

    if (!token.swap_keys.raydium_amm_pool) {
        throw new Error("Raydium AMM Pool is not defined in the token swap keys.");
    }
    if (!token.swap_keys.raydium_amm_coin_vault) {
        throw new Error("Raydium AMM Coin Vault is not defined in the token swap keys.");
    }
    if (!token.swap_keys.raydium_amm_pc_vault) {
        throw new Error("Raydium AMM PC Vault is not defined in the token swap keys.");
    }

    const accounts: solana.AccountMeta[] = [
        // User accounts
        { pubkey: user, isSigner: true, isWritable: true },
        { pubkey: quoteTokenAccount, isSigner: false, isWritable: true },
        { pubkey: baseTokenAccount, isSigner: false, isWritable: true },

        // Raydium AMM pool and vault accounts
        { pubkey: token.swap_keys.raydium_amm_pool, isSigner: false, isWritable: true },
        { pubkey: token.swap_keys.raydium_amm_coin_vault, isSigner: false, isWritable: true },
        { pubkey: token.swap_keys.raydium_amm_pc_vault, isSigner: false, isWritable: true },

        // System programs
        { pubkey: solana.SystemProgram.programId, isSigner: false, isWritable: false},
        { pubkey: spl.TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },

        // Nova fee account
        { pubkey: NovaFeeWallet, isSigner: false, isWritable: true },
        
        // Raydium AMM program accounts
        { pubkey: RAYDIUM_AMM_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: RAYDIUM_AUTHORITY, isSigner: false, isWritable: false },
    ];

    return accounts;
};