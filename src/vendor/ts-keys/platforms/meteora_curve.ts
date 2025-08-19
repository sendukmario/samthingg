import * as solana from "@solana/web3.js";
import * as spl from "@solana/spl-token";

import { SwapRequest, Token, NovaFeeWallet } from "../types";

import { getAssociatedTokenAccount, getWrappedSolAccount, getUsdcSwapAccounts, getTokenProgramId, USDC_MINT } from "../token";

// Meteora Curve Program Constants
const METEORA_CURVE_PROGRAM_ID = new solana.PublicKey("dbcij3LWUppWqq96dh6gJWwBifmcGfLSB5D4DuSMaqN");
const METEORA_CURVE_AUTHORITY = new solana.PublicKey("FhVo3mqL8PW5pH5U2CN4XE33DokiyZnUwuGpH2hmHLuM");
const METEORA_CURVE_EVENT_AUTHORITY = new solana.PublicKey("8Ks12pbrD6PXxfty1hVQiE9sc289zgU1zHkvXhrSdriF");

/**
 * Generates all required accounts for Meteora Curve swap operations
 */
export const getMeteoraCurveAccounts = (request: SwapRequest, token: Token): solana.AccountMeta[] => {
    const user = request.Wallet.publicKey;

    const pool = token.swap_keys.meteora_curve_pool;
    const config = token.swap_keys.meteora_curve_config;
    const baseVault = token.swap_keys.meteora_curve_base_vault;
    const quoteVault = token.swap_keys.meteora_curve_quote_vault;
    const baseMint = token.swap_keys.base_mint;
    const quoteMint = token.swap_keys.quote_mint;

    if (!baseMint) {
        throw new Error("Base mint is not defined in the token swap keys.");
    }

    let baseTokenAccount = getAssociatedTokenAccount(user, baseMint, token.is_2022);
    let wrappedSolAccount = getWrappedSolAccount(user).pubkey;

    let quoteTokenAccount = wrappedSolAccount;
    let usdcTokenAccount = getAssociatedTokenAccount(user, USDC_MINT, false);

    if (token.is_usdc) {
        quoteTokenAccount = usdcTokenAccount;
    }

    if (!request.IsBuy) {
        [quoteTokenAccount, baseTokenAccount] = [baseTokenAccount, quoteTokenAccount];
    }

    if (!pool) {
        throw new Error("Meteora Curve Pool is not defined in the token swap keys.");
    }
    if (!baseVault) {
        throw new Error("Meteora Curve Base Vault is not defined in the token swap keys.");
    }
    if (!quoteVault) {
        throw new Error("Meteora Curve Quote Vault is not defined in the token swap keys.");
    }
    if (!baseMint) {
        throw new Error("Meteora Curve Base Mint is not defined in the token swap keys.");
    }
    if (!quoteMint) {
        throw new Error("Meteora Curve Quote Mint is not defined in the token swap keys.");
    }
    if (!config) {
        throw new Error("Meteora Curve Config is not defined in the token swap keys.");
    }

    let accounts: solana.AccountMeta[] = [
        // User accounts
        { pubkey: user, isSigner: true, isWritable: true },
        { pubkey: quoteTokenAccount, isSigner: false, isWritable: true },
        { pubkey: baseTokenAccount, isSigner: false, isWritable: true },

        // Token mint accounts
        { pubkey: baseMint, isSigner: false, isWritable: true },
        { pubkey: quoteMint, isSigner: false, isWritable: true },
        
        // Pool and vault accounts
        { pubkey: pool, isSigner: false, isWritable: true },
        { pubkey: baseVault, isSigner: false, isWritable: true },
        { pubkey: quoteVault, isSigner: false, isWritable: true },

        // Token programs
        { pubkey: solana.SystemProgram.programId, isSigner: false, isWritable: false},
        { pubkey: getTokenProgramId(token.is_2022), isSigner: false, isWritable: true },
        { pubkey: spl.TOKEN_PROGRAM_ID, isSigner: false, isWritable: true },
        
        // Configuration account
        { pubkey: config, isSigner: false, isWritable: true },

        // Nova fee account
        { pubkey: NovaFeeWallet, isSigner: false, isWritable: true },
        
        // Meteora Curve program accounts
        { pubkey: METEORA_CURVE_PROGRAM_ID, isSigner: false, isWritable: true },
        { pubkey: METEORA_CURVE_AUTHORITY, isSigner: false, isWritable: true },
        { pubkey: METEORA_CURVE_EVENT_AUTHORITY, isSigner: false, isWritable: true },
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