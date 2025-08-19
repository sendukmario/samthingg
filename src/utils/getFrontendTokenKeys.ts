interface CosmoToken {
  Token: {
    Dex: string;
    Mint: string;
    Decimals: number;
    Is2022: boolean;
  };
  IsUsd: boolean;
  Keys: {
    // Pump.Fun
    BondingCurve?: { String: () => string };
    AssociatedBondingCurve?: { String: () => string };
    
    // Pump.Swap
    PumpSwapPool?: { String: () => string };
    PumpSwapCoinCreatorVaultAta?: { String: () => string };
    PumpSwapCoinCreatorVaultAuthority?: { String: () => string };
    
    // LaunchLab
    LaunchLabPool?: { String: () => string };
    LaunchLabBaseVault?: { String: () => string };
    LaunchLabQuoteVault?: { String: () => string };
    LaunchLabGlobal?: { String: () => string };
    LaunchLabPlatform?: { String: () => string };
    
    // Raydium CPMM
    RaydiumCpmmPoolState?: { String: () => string };
    RaydiumCpmmConfig?: { String: () => string };
    RaydiumCpmmObservationState?: { String: () => string };
    RaydiumCpmmSolVault?: { String: () => string };
    RaydiumCpmmTokenVault?: { String: () => string };
    
    // Raydium AMM
    RaydiumAmmId?: { String: () => string };
    RaydiumCoinVault?: { String: () => string };
    RaydiumPCVault?: { String: () => string };
    
    // Meteora V-Curve
    MeteoraVCurveBaseMint?: { String: () => string };
    MeteoraVCurveQuoteMint?: { String: () => string };
    MeteoraVCurveConfig?: { String: () => string };
    MeteoraVCurveBaseVault?: { String: () => string };
    MeteoraVCurveQuoteVault?: { String: () => string };
    MeteoraVCurvePool?: { String: () => string };
    
    // Meteora AMM
    DynPool?: { String: () => string };
    DynAVault?: { String: () => string };
    DynBVault?: { String: () => string };
    DynATokenVault?: { String: () => string };
    DynBTokenVault?: { String: () => string };
    DynAVaultLPMint?: { String: () => string };
    DynBVaultLPMint?: { String: () => string };
    DynAVaultLP?: { String: () => string };
    DynBVaultLP?: { String: () => string };
    DynAFee?: { String: () => string };
    DynBFee?: { String: () => string };
    
    // Meteora AMM V2
    DAMMAToken?: { String: () => string };
    DAMMBToken?: { String: () => string };
    DAMMPool?: { String: () => string };
    DAMMAVault?: { String: () => string };
    DAMMBVault?: { String: () => string };
    
    // Boop
    BoopBondingCurve?: { String: () => string };
    BoopVaultAuthority?: { String: () => string };
    
    // MoonIt
    MoonPool?: { String: () => string };
    MoonTokenAccount?: { String: () => string };
    
    // Raydium CLMM
    RaydiumClmmPoolState?: { String: () => string };
    RaydiumClmmSolVault?: { String: () => string };
    RaydiumClmmTokenVault?: { String: () => string };
    RaydiumClmmConfig?: { String: () => string };
    RaydiumClmmObservationState?: { String: () => string };
    RaydiumClmmTickArray?: { String: () => string };
    
    // Meteora DLMM
    DLMMPool?: { ToSolana: () => any };
    DLMMTokenX?: { ToSolana: () => any };
    DLMMTokenY?: { ToSolana: () => any };
  };
}

interface Globals {
  USDCTokenAddress: string;
  PumpAuthority: { String: () => string };
  PumpGlobal: { String: () => string };
  PumFunGlobalVolumeAccumulator: { String: () => string };
  PumpFee: { String: () => string };
}

interface Solana {
  SolMint: { String: () => string };
}

interface Utils {
  DeriveDLMMReserve: (token: any, pool: any) => { String: () => string };
  DeriveDLMMPoolOracle: (pool: any) => { String: () => string };
}

interface Boop {
  DeriveAllBondingCurvePDAs: (mint: string) => Promise<{
    BondingCurveVault: { String: () => string };
    BondingCurveSolVault: { String: () => string };
    TradingFeesVault: { String: () => string };
  } | null>;
}

// These would need to be imported or defined elsewhere
declare const globals: Globals;
declare const solana: Solana;
declare const utils: Utils;
declare const boop: Boop;

export async function getFrontendTokenKeys(token: CosmoToken): Promise<Record<string, any> | null> {
  const dex = token.Token.Dex;

  let baseMint = solana.SolMint.String();
  if (token.IsUsd) {
    baseMint = globals.USDCTokenAddress;
  }

  const data: Record<string, any> = {
    base_mint: baseMint,
    mint: token.Token.Mint,
    decimals: token.Token.Decimals,
    is_usdc: token.IsUsd,
    is_2022: token.Token.Is2022,
    dex: dex,
    swap_keys: {},
  };

  switch (dex) {
    case "Pump.Fun":
      data.swap_keys = {
        bonding_curve: token.Keys.BondingCurve?.String(),
        associated_bonding_curve: token.Keys.AssociatedBondingCurve?.String(),
        authority: globals.PumpAuthority.String(),
        global: globals.PumpGlobal.String(),
        global_volume_accelerator: globals.PumFunGlobalVolumeAccumulator.String(),
        fee_account: globals.PumpFee.String(),
      };
      break;

    case "Pump.Swap":
      data.swap_keys = {
        pool: token.Keys.PumpSwapPool?.String(),
        creator_vault_account: token.Keys.PumpSwapCoinCreatorVaultAta?.String(),
        creator_vault_authority: token.Keys.PumpSwapCoinCreatorVaultAuthority?.String(),
      };
      break;

    case "LaunchLab":
      data.swap_keys = {
        pool: token.Keys.LaunchLabPool?.String(),
        base_vault: token.Keys.LaunchLabBaseVault?.String(),
        quote_vault: token.Keys.LaunchLabQuoteVault?.String(),
        global: token.Keys.LaunchLabGlobal?.String(),
        platform: token.Keys.LaunchLabPlatform?.String(),
      };
      break;

    case "Raydium CPMM":
      data.swap_keys = {
        pool: token.Keys.RaydiumCpmmPoolState?.String(),
        config: token.Keys.RaydiumCpmmConfig?.String(),
        observation: token.Keys.RaydiumCpmmObservationState?.String(),
        sol_vault: token.Keys.RaydiumCpmmSolVault?.String(),
        token_vault: token.Keys.RaydiumCpmmTokenVault?.String(),
      };
      break;

    case "Raydium AMM":
      data.swap_keys = {
        pool: token.Keys.RaydiumAmmId?.String(),
        coin_vault: token.Keys.RaydiumCoinVault?.String(),
        pc_vault: token.Keys.RaydiumPCVault?.String(),
      };
      break;

    case "Dynamic Bonding Curve":
      data.swap_keys = {
        base_mint: token.Keys.MeteoraVCurveBaseMint?.String(),
        quote_mint: token.Keys.MeteoraVCurveQuoteMint?.String(),
        config: token.Keys.MeteoraVCurveConfig?.String(),
        base_vault: token.Keys.MeteoraVCurveBaseVault?.String(),
        quote_vault: token.Keys.MeteoraVCurveQuoteVault?.String(),
        pool: token.Keys.MeteoraVCurvePool?.String(),
      };
      break;

    case "Meteora AMM":
      data.swap_keys = {
        pool: token.Keys.DynPool?.String(),
        a_vault: token.Keys.DynAVault?.String(),
        b_vault: token.Keys.DynBVault?.String(),
        a_token_vault: token.Keys.DynATokenVault?.String(),
        b_token_vault: token.Keys.DynBTokenVault?.String(),
        a_vault_lp_mint: token.Keys.DynAVaultLPMint?.String(),
        b_vault_lp_mint: token.Keys.DynBVaultLPMint?.String(),
        a_vault_lp: token.Keys.DynAVaultLP?.String(),
        b_vault_lp: token.Keys.DynBVaultLP?.String(),
        a_fee: token.Keys.DynAFee?.String(),
        b_fee: token.Keys.DynBFee?.String(),
      };
      break;

    case "Meteora AMM V2":
      data.swap_keys = {
        a_token: token.Keys.DAMMAToken?.String(),
        b_token: token.Keys.DAMMBToken?.String(),
        pool: token.Keys.DAMMPool?.String(),
        a_vault: token.Keys.DAMMAVault?.String(),
        b_vault: token.Keys.DAMMBVault?.String(),
      };
      break;

    case "Boop":
      try {
        const pda = await boop.DeriveAllBondingCurvePDAs(token.Token.Mint);
        if (!pda) {
          return null;
        }
        data.swap_keys = {
          bonding_curve: token.Keys.BoopBondingCurve?.String(),
          vault_authority: token.Keys.BoopVaultAuthority?.String(),
          bonding_curve_vault: pda.BondingCurveVault.String(),
          sol_vault: pda.BondingCurveSolVault.String(),
          fees_vault: pda.TradingFeesVault.String(),
        };
      } catch (error) {
        return null;
      }
      break;

    case "MoonIt":
      data.swap_keys = {
        pool: token.Keys.MoonPool?.String(),
        token_account: token.Keys.MoonTokenAccount?.String(),
      };
      break;

    case "Raydium CLMM":
      data.swap_keys = {
        pool: token.Keys.RaydiumClmmPoolState?.String(),
        sol_vault: token.Keys.RaydiumClmmSolVault?.String(),
        token_vault: token.Keys.RaydiumClmmTokenVault?.String(),
        config: token.Keys.RaydiumClmmConfig?.String(),
        observation: token.Keys.RaydiumClmmObservationState?.String(),
        bitmap: token.Keys.RaydiumClmmTickArray?.String(),
      };
      break;

    case "Meteora DLMM":
      const pool = token.Keys.DLMMPool?.ToSolana();
      const tokenX = token.Keys.DLMMTokenX?.ToSolana();
      const tokenY = token.Keys.DLMMTokenY?.ToSolana();

      const reserveX = utils.DeriveDLMMReserve(tokenX, pool);
      const reserveY = utils.DeriveDLMMReserve(tokenY, pool);
      const oracle = utils.DeriveDLMMPoolOracle(pool);

      data.swap_keys = {
        token_x: tokenX?.String(),
        token_y: tokenY?.String(),
        pool: pool?.String(),
        reserve_x: reserveX.String(),
        reserve_y: reserveY.String(),
        oracle: oracle.String(),
      };
      break;

    default:
      return null;
  }

  return data;
}
