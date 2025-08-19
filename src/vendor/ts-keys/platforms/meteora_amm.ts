import * as solana from "@solana/web3.js";
import * as spl from "@solana/spl-token";

import { SwapRequest, Token, NovaFeeWallet } from "../types";

import { getAssociatedTokenAccount, getWrappedSolAccount, getUsdcSwapAccounts, USDC_MINT } from "../token";

// Meteora AMM Program Constants
const METEORA_AMM_PROGRAM_ID = new solana.PublicKey("Eo7WjKq67rjJQSZxS6z3YkapzY3eMj6Xy8X5EQVn5UaB");
const METEORA_AMM_VAULT_ID = new solana.PublicKey("24Uqj9JCLxUeoC3hGfh5W3s9FM9uCHDS2SG3LYwBpyTi");

/**
 * Generates all required accounts for Meteora AMM swap operations
 */
export const getMeteoraAmmAccounts = (request: SwapRequest, token: Token): solana.AccountMeta[] => {
    const user = request.Wallet.publicKey;
    const mint = new solana.PublicKey(token.mint);
    
    const wrappedSolAccount = getWrappedSolAccount(user).pubkey;
    let baseTokenAccount = getAssociatedTokenAccount(user, mint, token.is_2022);

    let feeAccount = token.swap_keys.meteora_amm_b_fee;

    let quoteTokenAccount = wrappedSolAccount;
    let usdcTokenAccount = getAssociatedTokenAccount(user, USDC_MINT, false);

    if (token.is_usdc) {
        quoteTokenAccount = usdcTokenAccount;
    }

    if (!request.IsBuy) {
        feeAccount = token.swap_keys.meteora_amm_a_fee;
        [quoteTokenAccount, baseTokenAccount] = [baseTokenAccount, quoteTokenAccount];
    }

    if (!token.swap_keys.meteora_amm_pool) {
        throw new Error("Meteora AMM Pool is not defined in the token swap keys.");
    }
    if (!token.swap_keys.meteora_amm_a_vault) {
        throw new Error("Meteora AMM A Vault is not defined in the token swap keys.");
    }
    if (!token.swap_keys.meteora_amm_b_vault) {
        throw new Error("Meteora AMM B Vault is not defined in the token swap keys.");
    }
    if (!token.swap_keys.meteora_amm_a_token_vault) {
        throw new Error("Meteora AMM A Token Vault is not defined in the token swap keys.");
    }
    if (!token.swap_keys.meteora_amm_b_token_vault) {
        throw new Error("Meteora AMM B Token Vault is not defined in the token swap keys.");
    }
    if (!token.swap_keys.meteora_amm_a_vault_lp_mint) {
        throw new Error("Meteora AMM A Vault LP Mint is not defined in the token swap keys.");
    }
    if (!token.swap_keys.meteora_amm_b_vault_lp_mint) {
        throw new Error("Meteora AMM B Vault LP Mint is not defined in the token swap keys.");
    }
    if (!token.swap_keys.meteora_amm_a_vault_lp) {
        throw new Error("Meteora AMM A Vault LP Token Account is not defined in the token swap keys.");
    }
    if (!token.swap_keys.meteora_amm_b_vault_lp) {
        throw new Error("Meteora AMM B Vault LP Token Account is not defined in the token swap keys.");
    }
    if (!feeAccount) {
        throw new Error("Meteora AMM Fee Account is not defined in the token swap keys.");
    }

    let accounts: solana.AccountMeta[] = [
        // User accounts
        { pubkey: user, isSigner: true, isWritable: true },
        { pubkey: quoteTokenAccount, isSigner: false, isWritable: true },
        { pubkey: baseTokenAccount, isSigner: false, isWritable: true },

        // Pool and vault accounts
        { pubkey: token.swap_keys.meteora_amm_pool, isSigner: false, isWritable: true },
        { pubkey: token.swap_keys.meteora_amm_a_vault, isSigner: false, isWritable: true },
        { pubkey: token.swap_keys.meteora_amm_b_vault, isSigner: false, isWritable: true },

        // Token vault accounts
        { pubkey: token.swap_keys.meteora_amm_a_token_vault, isSigner: false, isWritable: true },
        { pubkey: token.swap_keys.meteora_amm_b_token_vault, isSigner: false, isWritable: true },
        
        // LP mint accounts
        { pubkey: token.swap_keys.meteora_amm_a_vault_lp_mint, isSigner: false, isWritable: true },
        { pubkey: token.swap_keys.meteora_amm_b_vault_lp_mint, isSigner: false, isWritable: true },
        
        // LP token accounts
        { pubkey: token.swap_keys.meteora_amm_a_vault_lp, isSigner: false, isWritable: true },
        { pubkey: token.swap_keys.meteora_amm_b_vault_lp, isSigner: false, isWritable: true },
        
        // Fee account
        { pubkey: feeAccount, isSigner: false, isWritable: true },

        // System programs
        { pubkey: solana.SystemProgram.programId, isSigner: false, isWritable: false },
        { pubkey: spl.TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },

        // Nova fee account
        { pubkey: NovaFeeWallet, isSigner: false, isWritable: true },
        
        // Meteora program accounts
        { pubkey: METEORA_AMM_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: METEORA_AMM_VAULT_ID, isSigner: false, isWritable: false },
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