import { NovaSwapKeys } from "../types";

// Helper to create blank NovaSwapKeys with all keys set to null
export const blankSwapKeys = (): NovaSwapKeys => ({
    // Mint Keys
    base_mint : null,
    quote_mint: null,

    // Pump.Fun Keys
    bonding_curve: null,
    associated_bonding_curve: null,
    pump_fun_creator_vault: null,
    pump_fun_authority: null,
    pump_fun_global: null,
    pump_fun_global_volume_accelerator: null,
    pump_fun_fee_account: null,

    // Pump.Swap Keys
    pump_swap_pool: null,
    pump_swap_creator_vault_account: null,
    pump_swap_creator_vault_authority: null,

    // Boop Keys
    boop_bonding_curve: null,
    boop_trading_fees_vault: null,
    boop_bonding_curve_vault: null,
    boop_bonding_curve_sol_vault: null,
    boop_vault_authority: null,
    boop_config: null,

    // Meteora AMM Keys
    meteora_amm_pool: null,
    meteora_amm_a_vault: null,
    meteora_amm_b_vault: null,
    meteora_amm_a_token_vault: null,
    meteora_amm_b_token_vault: null,
    meteora_amm_a_vault_lp_mint: null,
    meteora_amm_b_vault_lp_mint: null,
    meteora_amm_a_vault_lp: null,
    meteora_amm_b_vault_lp: null,
    meteora_amm_a_fee: null,
    meteora_amm_b_fee: null,

    // Meteora AMM V2 Keys
    meteora_amm_v2_a_token: null,
    meteora_amm_v2_b_token: null,
    meteora_amm_v2_pool: null,
    meteora_amm_v2_a_vault: null,
    meteora_amm_v2_b_vault: null,

    // Meteora DLMM Keys
    meteora_dlmm_token_x: null,
    meteora_dlmm_token_y: null,
    meteora_dlmm_pool: null,
    meteora_dlmm_reserve_x: null,
    meteora_dlmm_reserve_y: null,
    meteora_dlmm_oracle: null,

    // Meteora Curve Keys
    meteora_curve_pool: null,
    meteora_curve_base_vault: null,
    meteora_curve_quote_vault: null,
    meteora_curve_config: null,

    // MoonIt Keys
    moon_it_pool: null,
    moon_it_token_account: null,

    // LaunchLab Keys
    launch_lab_pool: null,
    launch_lab_base_vault: null,
    launch_lab_quote_vault: null,
    launch_lab_global: null,
    launch_lab_platform: null,

    // Raydium CLMM Keys
    raydium_clmm_sol_vault : null,
    raydium_clmm_token_vault : null,
    raydium_clmm_pool: null,
    raydium_clmm_config: null,
    raydium_clmm_observation: null,
    raydium_clmm_bitmap: null,

    // Raydium AMM Keys
    raydium_amm_pool: null,
    raydium_amm_coin_vault: null,
    raydium_amm_pc_vault: null,

    // Raydium CPMM Keys
    raydium_cpmm_sol_vault: null,
    raydium_cpmm_token_vault: null,
    raydium_cpmm_pool: null,
    raydium_cpmm_config: null,
    raydium_cpmm_observation: null,
});