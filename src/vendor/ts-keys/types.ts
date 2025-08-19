import * as solana from "@solana/web3.js";
import { struct, u64, u8, bool } from '@coral-xyz/borsh';

export const NovaProgram = new solana.PublicKey("6iWkWFXfLdRwSm8Tx8sXUagDgG1kZn94fWPZWLsF4bUc");
export const NovaFeeWallet = new solana.PublicKey("noVakKQGTTjpHARvecAUbVnc85AatCLm3ijDFk8JXZB");

type Account = {
    Pubkey: string;
    IsSigner: boolean;
    IsWritable: boolean;
}

/* Cosmo Token Stream */
export interface Token {
    mint: string;
    decimals: number;
    dex: string;
    is_usdc: boolean;
    is_2022: boolean;
    is_wrapped_sol: boolean;
    swap_keys: NovaSwapKeys;
    remaining_accounts: solana.PublicKey[] | null;
}

export interface SwapRequest {
    Wallet: solana.Keypair;
    Amount: bigint;
    IsBuy: boolean;
    Fee: number;
    Slippage: number;
}

export const NovaInstructionParamsSchema = struct([
    u8('method'),                    // Method field
    u64('amountIn'),        // AmountIn in lamports
    u64('minAmountOut'),    // MinAmountOut
    u64('slippage'),        // Slippage
    u8('novaFee'),                   // NovaFee
    bool('isSell'),         // IsSell boolean
    bool('isUsd'),    // NonSolInput boolean
]);

export interface NovaSwapKeys {
    // Mint Keys
    base_mint : solana.PublicKey | null;
    quote_mint: solana.PublicKey | null;

    // Pump.Fun Keys
    bonding_curve: solana.PublicKey | null;
    associated_bonding_curve: solana.PublicKey | null;
    pump_fun_creator_vault: solana.PublicKey | null;
    pump_fun_authority: solana.PublicKey | null;
    pump_fun_global: solana.PublicKey | null;
    pump_fun_global_volume_accelerator: solana.PublicKey | null;
    pump_fun_fee_account: solana.PublicKey | null;

    // Pump.Swap Keys
    pump_swap_pool: solana.PublicKey | null;
    pump_swap_creator_vault_account: solana.PublicKey | null;
    pump_swap_creator_vault_authority: solana.PublicKey | null;

    // Boop Keys
    boop_bonding_curve: solana.PublicKey | null;
    boop_trading_fees_vault: solana.PublicKey | null;
    boop_bonding_curve_vault: solana.PublicKey | null;
    boop_bonding_curve_sol_vault: solana.PublicKey | null;
    boop_vault_authority: solana.PublicKey | null;
    boop_config: solana.PublicKey | null;

    // Meteora AMM Keys
    meteora_amm_pool: solana.PublicKey | null;
    meteora_amm_a_vault: solana.PublicKey | null;
    meteora_amm_b_vault: solana.PublicKey | null;
    meteora_amm_a_token_vault: solana.PublicKey | null;
    meteora_amm_b_token_vault: solana.PublicKey | null;
    meteora_amm_a_vault_lp_mint: solana.PublicKey | null;
    meteora_amm_b_vault_lp_mint: solana.PublicKey | null;
    meteora_amm_a_vault_lp: solana.PublicKey | null;
    meteora_amm_b_vault_lp: solana.PublicKey | null;
    meteora_amm_a_fee: solana.PublicKey | null;
    meteora_amm_b_fee: solana.PublicKey | null;

    // Meteora AMM V2 Keys
    meteora_amm_v2_a_token: solana.PublicKey | null;
    meteora_amm_v2_b_token: solana.PublicKey | null;
    meteora_amm_v2_pool: solana.PublicKey | null;
    meteora_amm_v2_a_vault: solana.PublicKey | null;
    meteora_amm_v2_b_vault: solana.PublicKey | null;

    // Meteora DLMM Keys
    meteora_dlmm_token_x: solana.PublicKey | null;
    meteora_dlmm_token_y: solana.PublicKey | null;
    meteora_dlmm_pool: solana.PublicKey | null;
    meteora_dlmm_reserve_x: solana.PublicKey | null;
    meteora_dlmm_reserve_y: solana.PublicKey | null;
    meteora_dlmm_oracle: solana.PublicKey | null;

    // Meteora Curve Keys
    meteora_curve_pool: solana.PublicKey | null;
    meteora_curve_base_vault: solana.PublicKey | null;
    meteora_curve_quote_vault: solana.PublicKey | null;
    meteora_curve_config: solana.PublicKey | null;

    // MoonIt Keys
    moon_it_pool: solana.PublicKey | null;
    moon_it_token_account: solana.PublicKey | null;

    // LaunchLab Keys
    launch_lab_pool: solana.PublicKey | null;
    launch_lab_base_vault: solana.PublicKey | null;
    launch_lab_quote_vault: solana.PublicKey | null;
    launch_lab_global: solana.PublicKey | null;
    launch_lab_platform: solana.PublicKey | null;

    // Raydium CLMM Keys
    raydium_clmm_sol_vault : solana.PublicKey | null;
    raydium_clmm_token_vault : solana.PublicKey | null;
    raydium_clmm_pool: solana.PublicKey | null;
    raydium_clmm_config: solana.PublicKey | null;
    raydium_clmm_observation: solana.PublicKey | null;
    raydium_clmm_bitmap: solana.PublicKey | null;

    // Raydium AMM Keys
    raydium_amm_pool: solana.PublicKey | null;
    raydium_amm_coin_vault: solana.PublicKey | null;
    raydium_amm_pc_vault: solana.PublicKey | null;

    // Raydium CPMM Keys
    raydium_cpmm_sol_vault: solana.PublicKey | null;
    raydium_cpmm_token_vault: solana.PublicKey | null;
    raydium_cpmm_pool: solana.PublicKey | null;
    raydium_cpmm_config: solana.PublicKey | null;
    raydium_cpmm_observation: solana.PublicKey | null;
}