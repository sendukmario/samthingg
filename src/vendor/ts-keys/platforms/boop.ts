import * as solana from "@solana/web3.js";
import * as spl from "@solana/spl-token";

import { SwapRequest, Token, NovaFeeWallet } from "../types";

import { getAssociatedTokenAccount } from "../token";

// Boop Program Constants
const BOOP_PROGRAM_ID = new solana.PublicKey("boop8hVGQGqehUK2iVEMEnMrL5RbjywRzHKBmBE7ry4");

/**
 * Generates all required accounts for Boop swap operations
 */
export const getBoopAccounts = (request: SwapRequest, token: Token): solana.AccountMeta[] => {
    // Core accounts
    const mint = token.swap_keys.quote_mint;
    const user = request.Wallet.publicKey;

    if (!mint) {
        throw new Error("Boop swap requires a valid Quote Mint");
    }

    if (!token.swap_keys.boop_bonding_curve) {
        throw new Error("Boop swap requires a valid Boop Bonding Curve");
    }

    if (!token.swap_keys.boop_vault_authority) {
        throw new Error("Boop swap requires a valid Boop Vault Authority");
    }

    if (!token.swap_keys.boop_bonding_curve_vault) {
        throw new Error("Boop swap requires a valid Boop Bonding Curve Vault");
    }

    if (!token.swap_keys.boop_bonding_curve_sol_vault) {
        throw new Error("Boop swap requires a valid Boop Bonding Curve SOL Vault");
    }

    if (!token.swap_keys.boop_trading_fees_vault) {
        throw new Error("Boop swap requires a valid Boop Trading Fees Vault");
    }

    if (!token.swap_keys.boop_config) {
        throw new Error("Boop swap requires a valid Boop Config");
    }

    // User token account
    const associatedUserTokenAccount = getAssociatedTokenAccount(user, mint, token.is_2022);

    const accounts: solana.AccountMeta[] = [
        // User accounts
        { pubkey: user, isSigner: true, isWritable: true },
        { pubkey: associatedUserTokenAccount, isSigner: false, isWritable: true },
    
        // Token mint
        { pubkey: mint, isSigner: false, isWritable: false },
        
        // Boop bonding curve accounts
        { pubkey: token.swap_keys.boop_bonding_curve, isSigner: false, isWritable: true },
        { pubkey: token.swap_keys.boop_bonding_curve_vault, isSigner: false, isWritable: true },
        { pubkey: token.swap_keys.boop_bonding_curve_sol_vault, isSigner: false, isWritable: true },
        { pubkey: token.swap_keys.boop_config, isSigner: false, isWritable: false },
        { pubkey: token.swap_keys.boop_vault_authority, isSigner: false, isWritable: false },

        // System programs
        { pubkey: solana.SystemProgram.programId, isSigner: false, isWritable: false },
        { pubkey: spl.TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: spl.ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: spl.NATIVE_MINT, isSigner: false, isWritable: false },

        // Nova fee account
        { pubkey: NovaFeeWallet, isSigner: false, isWritable: true },

        // Boop program
        { pubkey: BOOP_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: token.swap_keys.boop_trading_fees_vault, isSigner: false, isWritable: true },
    ];

    return accounts;
};