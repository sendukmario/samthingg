import * as solana from "@solana/web3.js";
import * as spl from "@solana/spl-token";

import { SwapRequest, Token, NovaFeeWallet } from "../types";

import { getAssociatedTokenAccount, getWrappedSolAccount } from "../token";

// LaunchLab Program Constants
const LAUNCHLAB_PROGRAM_ID = new solana.PublicKey("LanMV9sAd7wArD4vJFi2qDdfnVhFxYSUg6eADduJ3uj");
const LAUNCHLAB_AUTHORITY = new solana.PublicKey("WLHv2UAZm6z4KyaaELi5pjdbJh6RESMva1Rnn8pJVVh");
const LAUNCHLAB_EVENT_AUTHORITY = new solana.PublicKey("2DPAtwB8L12vrMRExbLuyGnC7n2J5LNoZQSejeQGpwkr");

/**
 * Generates all required accounts for LaunchLab swap operations
 */
export const getLaunchLabAccounts = (request: SwapRequest, token: Token): solana.AccountMeta[] => {
    const user = request.Wallet.publicKey;
    const mint = new solana.PublicKey(token.mint);
    
    const associatedTokenAccount = getAssociatedTokenAccount(user, mint, token.is_2022);
    const wrappedSolAccount = getWrappedSolAccount(user).pubkey;

    if (!token.swap_keys.launch_lab_pool) {
        throw new Error("LaunchLab swap requires a valid LaunchLab Pool");
    }
    
    if (!token.swap_keys.launch_lab_base_vault) {
        throw new Error("LaunchLab swap requires a valid LaunchLab Base Vault");
    }

    if (!token.swap_keys.launch_lab_quote_vault) {
        throw new Error("LaunchLab swap requires a valid LaunchLab Quote Vault");
    }

    if (!token.swap_keys.launch_lab_global) {
        throw new Error("LaunchLab swap requires a valid LaunchLab Global account");
    }

    if (!token.swap_keys.launch_lab_platform) {
        throw new Error("LaunchLab swap requires a valid LaunchLab Platform account");
    }

    const accounts: solana.AccountMeta[] = [
        // User accounts
        { pubkey: user, isSigner: true, isWritable: false },
        { pubkey: associatedTokenAccount, isSigner: false, isWritable: true },
        { pubkey: wrappedSolAccount, isSigner: false, isWritable: true },

        // Token mint
        { pubkey: mint, isSigner: false, isWritable: false },
        
        // LaunchLab pool and vault accounts
        { pubkey: token.swap_keys.launch_lab_pool, isSigner: false, isWritable: true },
        { pubkey: token.swap_keys.launch_lab_base_vault, isSigner: false, isWritable: true },
        { pubkey: token.swap_keys.launch_lab_quote_vault, isSigner: false, isWritable: true },

        // LaunchLab global accounts
        { pubkey: token.swap_keys.launch_lab_global, isSigner: false, isWritable: false },
        { pubkey: token.swap_keys.launch_lab_platform, isSigner: false, isWritable: false },

        // System programs
        { pubkey: solana.SystemProgram.programId, isSigner: false, isWritable: false },
        { pubkey: spl.TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: spl.NATIVE_MINT, isSigner: false, isWritable: false },

        // Nova fee account
        { pubkey: NovaFeeWallet, isSigner: false, isWritable: true },

        // LaunchLab program accounts
        { pubkey: LAUNCHLAB_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: LAUNCHLAB_AUTHORITY, isSigner: false, isWritable: false },
        { pubkey: LAUNCHLAB_EVENT_AUTHORITY, isSigner: false, isWritable: false },
    ];

    return accounts;
};