import * as solana from "@solana/web3.js";

import { SwapRequest, Token, NovaFeeWallet } from "../types";

import {getWrappedSolAccount, getAssociatedTokenAccount, getProgramId, getUsdcSwapAccounts, USDC_MINT} from "../token";

// Meteora DLMM Program Constants
const METEORA_DLMM_PROGRAM_ID = new solana.PublicKey("LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo");
const METEORA_DLMM_EVENT_AUTHORITY = new solana.PublicKey("D1ZN9Wj1fRSUQfCjhvnu1hqDMT7hzjzBBpi12nVniYD6");
const MEMO_PROGRAM_ID = new solana.PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");

/**
 * Generates all required accounts for Meteora DLMM swap operations
 */
export const getMeteoraDlmmAccounts = (request: SwapRequest, token: Token): solana.AccountMeta[] => {
    const user = request.Wallet.publicKey;
    const mint = token.swap_keys.quote_mint;

    if (!mint) {
        throw new Error("Quote mint is not defined in the token swap keys.");
    }

    if (!token.swap_keys.meteora_dlmm_token_x) {
        throw new Error("Meteora DLMM Token X is not defined in the token swap keys.");
    }
    if (!token.swap_keys.meteora_dlmm_token_y) {
        throw new Error("Meteora DLMM Token Y is not defined in the token swap keys.");
    }
    if (!token.swap_keys.meteora_dlmm_pool) {
        throw new Error("Meteora DLMM Pool is not defined in the token swap keys.");
    }
    if (!token.swap_keys.meteora_dlmm_reserve_x) {
        throw new Error("Meteora DLMM Reserve X is not defined in the token swap keys.");
    }
    if (!token.swap_keys.meteora_dlmm_reserve_y) {
        throw new Error("Meteora DLMM Reserve Y is not defined in the token swap keys.");
    }
    if (!token.swap_keys.meteora_dlmm_oracle) {
        throw new Error("Meteora DLMM Oracle is not defined in the token swap keys.");
    }

    let baseTokenAccount = getAssociatedTokenAccount(user, mint, token.is_2022);
    let wrappedSolAccount= getWrappedSolAccount(user).pubkey;

    let quoteTokenAccount = wrappedSolAccount;
    let usdcTokenAccount = getAssociatedTokenAccount(user, USDC_MINT, false);

    if (token.is_usdc) {
        quoteTokenAccount = usdcTokenAccount;
    }

    if (!request.IsBuy) {
        [quoteTokenAccount, baseTokenAccount] = [baseTokenAccount, quoteTokenAccount];
    }

    // Get appropriate token programs for X and Y tokens
    const [xProgram, yProgram] = getProgramId(
        token.swap_keys.meteora_dlmm_token_x,
        token.swap_keys.meteora_dlmm_token_y,
        mint,
        token.is_2022
    );

    let accounts: solana.AccountMeta[] = [
        // User accounts
        { pubkey: user, isSigner: true, isWritable: true },
        { pubkey: quoteTokenAccount, isSigner: false, isWritable: true },
        { pubkey: baseTokenAccount, isSigner: false, isWritable: true },

        // Token mint accounts
        { pubkey: token.swap_keys.meteora_dlmm_token_x, isSigner: false, isWritable: false },
        { pubkey: token.swap_keys.meteora_dlmm_token_y, isSigner: false, isWritable: false },
        
        // Pool and reserve accounts
        { pubkey: token.swap_keys.meteora_dlmm_pool, isSigner: false, isWritable: true },
        { pubkey: token.swap_keys.meteora_dlmm_reserve_x, isSigner: false, isWritable: true },
        { pubkey: token.swap_keys.meteora_dlmm_reserve_y, isSigner: false, isWritable: true },

        // Token programs
        { pubkey: solana.SystemProgram.programId, isSigner: false, isWritable: false },
        { pubkey: xProgram, isSigner: false, isWritable: false },
        { pubkey: yProgram, isSigner: false, isWritable: false },

        // Oracle account
        { pubkey: token.swap_keys.meteora_dlmm_oracle, isSigner: false, isWritable: true },

        // Nova fee account
        { pubkey: NovaFeeWallet, isSigner: false, isWritable: true },
        
        // Meteora DLMM program accounts
        { pubkey: METEORA_DLMM_PROGRAM_ID, isSigner: false, isWritable: true },
        { pubkey: METEORA_DLMM_EVENT_AUTHORITY, isSigner: false, isWritable: false },
        { pubkey: MEMO_PROGRAM_ID, isSigner: false, isWritable: false },
    ];

    // Add remaining accounts if provided
    if (token.remaining_accounts && token.remaining_accounts.length > 0) {
        token.remaining_accounts.forEach(account => {
            accounts.push({ pubkey: account, isSigner: false, isWritable: true });
        });
    }

    if (token.is_usdc) {
        const usdcAccounts = getUsdcSwapAccounts(
            wrappedSolAccount,
            usdcTokenAccount,
            user,
            request.IsBuy,
        );
        accounts = accounts.concat(usdcAccounts);
    }

    return accounts;
};