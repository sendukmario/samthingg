import * as solana from "@solana/web3.js";

import { SwapRequest, Token, NovaFeeWallet } from "../types";

import { getAssociatedTokenAccount, getWrappedSolAccount, getProgramId, getUsdcSwapAccounts, USDC_MINT } from "../token";

// Meteora AMM V2 Program Constants
const METEORA_AMM_V2_PROGRAM_ID = new solana.PublicKey("cpamdpZCGKUy5JxQXB4dcpGPiikHawvSWAd6mEn1sGG");
const METEORA_AMM_V2_AUTHORITY = new solana.PublicKey("HLnpSz9h2S4hiLQ43rnSD9XkcUThA7B8hQMKmDaiTLcC");
const METEORA_AMM_V2_EVENT_AUTHORITY = new solana.PublicKey("3rmHSu74h1ZcmAisVcWerTCiRDQbUrBKmcwptYGjHfet");

/**
 * Generates all required accounts for Meteora AMM V2 swap operations
 */
export const getMeteoraAmmV2Accounts = (request: SwapRequest, token: Token): solana.AccountMeta[] => {
    const user = request.Wallet.publicKey;
    const mint = token.swap_keys.quote_mint;

    if (!mint) {
        throw new Error("Quote mint is not defined in the token swap keys.");
    }

    const wrappedSolAccount = getWrappedSolAccount(user).pubkey;
    const associatedTokenAccount = getAssociatedTokenAccount(user, mint, token.is_2022);

    // Determine quote token account based on token type
    let quoteTokenAccount = wrappedSolAccount;
    let usdcTokenAccount = getAssociatedTokenAccount(user, USDC_MINT, false);

    if (token.is_usdc) {
        quoteTokenAccount = usdcTokenAccount;
    }

    if (!token.swap_keys.meteora_amm_v2_a_token) {
        throw new Error("Meteora AMM V2 A Token is not defined in the token swap keys.");
    }

    if (!token.swap_keys.meteora_amm_v2_b_token) {
        throw new Error("Meteora AMM V2 B Token is not defined in the token swap keys.");
    }

    if (!token.swap_keys.meteora_amm_v2_pool) {
        throw new Error("Meteora AMM V2 Pool is not defined in the token swap keys.");
    }

    if (!token.swap_keys.meteora_amm_v2_a_vault) {
        throw new Error("Meteora AMM V2 A Vault is not defined in the token swap keys.");
    }

    if (!token.swap_keys.meteora_amm_v2_b_vault) {
        throw new Error("Meteora AMM V2 B Vault is not defined in the token swap keys.");
    }

    // Get appropriate token programs for base and quote tokens
    const [aProgram, bProgram] = getProgramId(
        token.swap_keys.meteora_amm_v2_a_token,
        token.swap_keys.meteora_amm_v2_b_token,
        mint,
        token.is_2022
    );

    let accounts: solana.AccountMeta[] = [
        // User accounts
        { pubkey: user, isSigner: true, isWritable: true },
        { pubkey: quoteTokenAccount, isSigner: false, isWritable: true },
        { pubkey: associatedTokenAccount, isSigner: false, isWritable: true },

        // Token mint accounts
        { pubkey: token.swap_keys.meteora_amm_v2_a_token, isSigner: false, isWritable: false },
        { pubkey: token.swap_keys.meteora_amm_v2_b_token, isSigner: false, isWritable: false },
        
        // Pool and vault accounts
        { pubkey: token.swap_keys.meteora_amm_v2_pool, isSigner: false, isWritable: true },
        { pubkey: token.swap_keys.meteora_amm_v2_a_vault, isSigner: false, isWritable: true },
        { pubkey: token.swap_keys.meteora_amm_v2_b_vault, isSigner: false, isWritable: true },

        // Token programs
        { pubkey: solana.SystemProgram.programId, isSigner: false, isWritable: false},
        { pubkey: aProgram, isSigner: false, isWritable: false },
        { pubkey: bProgram, isSigner: false, isWritable: false },

        // Nova fee account
        { pubkey: NovaFeeWallet, isSigner: false, isWritable: true },
        
        // Meteora AMM V2 program accounts
        { pubkey: METEORA_AMM_V2_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: METEORA_AMM_V2_AUTHORITY, isSigner: false, isWritable: false },
        { pubkey: METEORA_AMM_V2_EVENT_AUTHORITY, isSigner: false, isWritable: false },
    ];

    if (token.is_usdc) {
        const usdcAccounts = getUsdcSwapAccounts(
            wrappedSolAccount,
            usdcTokenAccount,
            user,
            request.IsBuy
        );

        accounts = accounts.concat(usdcAccounts);
    }

    return accounts;
};