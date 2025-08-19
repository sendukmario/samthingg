import * as solana from "@solana/web3.js";
import * as spl from "@solana/spl-token";

import { SwapRequest, Token, NovaFeeWallet } from "../types";

import { getAssociatedTokenAccount } from "../token";

// MoonIt Program Constants
const MOONIT_PROGRAM_ID = new solana.PublicKey("MoonCVVNZFSYkqNXP6bxHLPL6QQJiMagDL3qcqUQTrG");
const MOONIT_CONFIG = new solana.PublicKey("36Eru7v11oU5Pfrojyn5oY3nETA1a1iqsw2WUu6afkM9");
const MOONIT_HELIO_FEE = new solana.PublicKey("5K5RtTWzzLp4P8Npi84ocf7F1vBsAu29N1irG4iiUnzt");
const MOONIT_DEX_FEE = new solana.PublicKey("3udvfL24waJcLhskRAsStNMoNUvtyXdxrWQz4hgi953N");

/**
 * Generates all required accounts for MoonIt swap operations
 */
export const getMoonItAccounts = (request: SwapRequest, token: Token): solana.AccountMeta[] => {
    const user = request.Wallet.publicKey;
    const mint = new solana.PublicKey(token.mint);

    if (!token.swap_keys.moon_it_pool) {
        throw new Error("MoonIt swap requires a valid MoonIt Pool");
    }

    if (!token.swap_keys.moon_it_token_account) {
        throw new Error("MoonIt swap requires a valid MoonIt Token Account");
    }

    if (!token.swap_keys.quote_mint) {
        throw new Error("MoonIt swap requires a valid Quote Mint");
    }
    
    const associatedTokenAccount = getAssociatedTokenAccount(user, token.swap_keys.quote_mint, token.is_2022);

    const accounts: solana.AccountMeta[] = [
        // User accounts
        { pubkey: user, isSigner: true, isWritable: true },
        { pubkey: associatedTokenAccount, isSigner: false, isWritable: true },

        // Token mint
        { pubkey: mint, isSigner: false, isWritable: true },
        
        // Pool account
        { pubkey: token.swap_keys.moon_it_pool, isSigner: false, isWritable: true },

        // Token account
        { pubkey: token.swap_keys.moon_it_token_account, isSigner: false, isWritable: true },

        // System programs
        { pubkey: solana.SystemProgram.programId, isSigner: false, isWritable: true },
        { pubkey: spl.TOKEN_PROGRAM_ID, isSigner: false, isWritable: true },
        { pubkey: spl.ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: true },

        // Nova fee account
        { pubkey: NovaFeeWallet, isSigner: false, isWritable: true },
        
        // MoonIt program accounts
        { pubkey: MOONIT_PROGRAM_ID, isSigner: false, isWritable: true },
        { pubkey: MOONIT_CONFIG, isSigner: false, isWritable: true },
        { pubkey: MOONIT_HELIO_FEE, isSigner: false, isWritable: true },
        { pubkey: MOONIT_DEX_FEE, isSigner: false, isWritable: true },
    ];

    return accounts;
};