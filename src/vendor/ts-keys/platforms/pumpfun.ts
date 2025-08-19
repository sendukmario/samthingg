import * as solana from "@solana/web3.js";
import * as spl from "@solana/spl-token";

import { SwapRequest, Token, NovaFeeWallet } from "../types";

import { getAssociatedTokenAccount } from "../token";
import { getUserVolumeAccumulator } from "./pump";

const PUMP_FUN_PROGRAM_ID = new solana.PublicKey("6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P");

/**
 * Generates all required accounts for PumpFun swap operations
 */
export const getPumpFunAccounts = (request: SwapRequest, token: Token): solana.AccountMeta[] => {
    // Core accounts
    const mint = token.swap_keys.quote_mint;
    const user = request.Wallet.publicKey;
    const tokenProgramId = token.is_2022 ? spl.TOKEN_2022_PROGRAM_ID : spl.TOKEN_PROGRAM_ID;

    if (!mint) {
        throw new Error("PumpFun swap requires a valid Quote Mint");
    }

    if (!token.swap_keys.bonding_curve) {
        throw new Error("PumpFun swap requires a valid PumpFun Bonding Curve");
    }

    if (!token.swap_keys.associated_bonding_curve) {
        throw new Error("PumpFun swap requires a valid PumpFun Vault Authority");
    }

    if (!token.swap_keys.pump_fun_authority) {
        throw new Error("PumpFun swap requires a valid PumpFun Global account");
    }

    if (!token.swap_keys.pump_fun_global) {
        throw new Error("PumpFun swap requires a valid PumpFun Global account");
    }

    if (!token.swap_keys.pump_fun_global_volume_accelerator) {
        throw new Error("PumpFun swap requires a valid PumpFun Global Volume Accelerator account");
    }

    if (!token.swap_keys.pump_fun_fee_account) {
        throw new Error("PumpFun swap requires a valid PumpFun Fee account");
    }

    if (!token.swap_keys.pump_fun_creator_vault) {
        throw new Error("PumpFun swap requires a valid Creator Vault account");
    }
    
    // Derived accounts
    const associatedTokenAccount = getAssociatedTokenAccount(user, mint, token.is_2022);
    const userVolumeAccumulator = getUserVolumeAccumulator(user, PUMP_FUN_PROGRAM_ID);

    const accounts: solana.AccountMeta[] = [
        // User accounts
        { pubkey: user, isSigner: true, isWritable: true },
        { pubkey: associatedTokenAccount, isSigner: false, isWritable: true },
        
        // Token accounts
        { pubkey: mint, isSigner: false, isWritable: true },
        { pubkey: token.swap_keys.bonding_curve, isSigner: false, isWritable: true },
        { pubkey: token.swap_keys.associated_bonding_curve, isSigner: false, isWritable: true },
        
        // Creator and volume tracking
        { pubkey: token.swap_keys.pump_fun_creator_vault, isSigner: false, isWritable: true },
        { pubkey: userVolumeAccumulator, isSigner: false, isWritable: true },
        
        // System programs
        { pubkey: solana.SystemProgram.programId, isSigner: false, isWritable: false },
        { pubkey: tokenProgramId, isSigner: false, isWritable: false },
        
        // Fee and program accounts
        { pubkey: NovaFeeWallet, isSigner: false, isWritable: true },
        { pubkey: PUMP_FUN_PROGRAM_ID, isSigner: false, isWritable: false },
        
        // PumpFun specific accounts
        { pubkey: token.swap_keys.pump_fun_authority, isSigner: false, isWritable: false },
        { pubkey: token.swap_keys.pump_fun_global, isSigner: false, isWritable: true },
        { pubkey: token.swap_keys.pump_fun_global_volume_accelerator, isSigner: false, isWritable: true },
        { pubkey: token.swap_keys.pump_fun_fee_account, isSigner: false, isWritable: true },
    ];

    return accounts;
};