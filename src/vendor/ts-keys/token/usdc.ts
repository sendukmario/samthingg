import * as solana from '@solana/web3.js';
import * as spl from '@solana/spl-token';

export const USDC_MINT = new solana.PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");

// Raydium USDC Constants
const RAYDIUM_AMM_PROGRAM_ID = new solana.PublicKey("675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8");
const RAYDIUM_AUTHORITY = new solana.PublicKey("5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1");
const RAYDIUM_USDC_MARKET = new solana.PublicKey("58oQChx4yWmvKdwLLZzBi4ChoCc2fqCUWBkwMihLYQo2");
const RAYDIUM_USDC_POOL_0 = new solana.PublicKey("DQyrAcCrDXQ7NeoqGgDCZwBvWDcYmFCjSb9JtteuvPpz");
const RAYDIUM_USDC_POOL_1 = new solana.PublicKey("HLmqeL62xR1QoZ1HKKbXRrdN1p3phKpxRMb2VVopvBBz");

/**
 * Generates USDC swap accounts for Raydium operations
 */
export const getUsdcSwapAccounts = (
    wrappedSolAccount: solana.PublicKey,
    usdcAccount: solana.PublicKey,
    user: solana.PublicKey,
    isBuy: boolean,
): solana.AccountMeta[] => {

    let baseTokenAccount = wrappedSolAccount;
    let quoteTokenAccount = usdcAccount;

    // Swap accounts for sell operations
    if (!isBuy) {
        [baseTokenAccount, quoteTokenAccount] = [quoteTokenAccount, baseTokenAccount];
    }

    const accounts: solana.AccountMeta[] = [
        // Raydium AMM program
        { pubkey: RAYDIUM_AMM_PROGRAM_ID, isSigner: false, isWritable: false },
        
        // User account
        { pubkey: user, isSigner: true, isWritable: true },
        
        // Token accounts
        { pubkey: baseTokenAccount, isSigner: false, isWritable: true },
        { pubkey: quoteTokenAccount, isSigner: false, isWritable: true },
        
        // Raydium accounts
        { pubkey: RAYDIUM_AUTHORITY, isSigner: false, isWritable: false },
        { pubkey: RAYDIUM_USDC_MARKET, isSigner: false, isWritable: true },
        { pubkey: RAYDIUM_USDC_POOL_0, isSigner: false, isWritable: true },
        { pubkey: RAYDIUM_USDC_POOL_1, isSigner: false, isWritable: true },
        
        // System programs
        { pubkey: spl.TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ];

    return accounts;
};