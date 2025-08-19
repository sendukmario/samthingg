import axios from "@/libraries/axios";
import cookies from "js-cookie";
import { AxiosError } from "axios";
import { getBaseURLBasedOnRegion } from "@/utils/getBaseURLBasedOnRegion";
import { NovaSwapKeys } from "@/vendor/ts-keys/types";

export interface IgniteTokensQueryParams {
  mint?: string[];
  min_age?: number;
  max_age?: number;
  min_market_cap?: number;
  max_market_cap?: number;
  min_volume?: number;
  max_volume?: number;
  min_transactions?: number;
  max_transactions?: number;
  discord_mentions?: string[];
  kol?: string;
  dex_paid?: string[];
  dexes?: string[];
  min_dex_paid?: number;
  max_dex_paid?: number;
  dev_sold?: boolean;
  min_bonding_curve?: number;
  dev_holding?: boolean;
  max_bonding_curve?: number;
  // Pagination (optional)
  page?: number;
  limit?: number;

  // Additional filters from FilterRequest
  has_website?: boolean;
  has_twitter?: boolean;
  has_telegram?: boolean;
  has_any_social?: boolean;

  min_buys?: number;
  max_buys?: number;
  min_sells?: number;
  max_sells?: number;

  min_tracked_buys?: number;
  max_tracked_buys?: number;
  min_kol_buys?: number;
  max_kol_buys?: number;

  min_buy_volume?: number;
  max_buy_volume?: number;
  min_sell_volume?: number;
  max_sell_volume?: number;

  min_holders?: number;
  max_holders?: number;

  min_insider_holding?: number;
  max_insider_holding?: number;

  min_bundled?: number;
  max_bundled?: number;

  min_dev_holdings?: number;
  max_dev_holdings?: number;

  min_top_10_holders?: number;
  max_top_10_holders?: number;

  // min_traders?: number;
  // max_traders?: number;

  min_regular_traders?: number;
  max_regular_traders?: number;

  dev_funded_before?: string;
  dev_funded_after?: string;

  max_dev_tokens?: number;
  min_dev_tokens?: number;

  min_dev_migrated?: number;
  max_dev_migrated?: number;

  min_snipers?: number;
  max_snipers?: number;

  min_dev_balance?: number;
  max_dev_balance?: number;

  min_top_10_balance?: number;
  max_top_10_balance?: number;

  min_global_fees?: number;
  max_global_fees?: number;
}

export interface IgniteToken {
  // Basic
  name: string;
  symbol: string;
  mint: string;
  image: string;
  supply: number;
  type: string;
  developer: string;
  created: number; // Unix timestamp (in seconds)
  dev_migrated: number;
  bot_holders: 1;
  // Social
  youtube: "";
  tiktok: "";
  instagram: "";
  twitter: string | null;
  telegram: string | null;
  website: string | null;
  launchpad: string | null;
  dex: string | null;
  origin_dex: string;
  // Metrics
  volume_usd: number;
  market_cap_usd: number;
  liquidity_usd: number;
  regular_traders: number;
  buys: number;
  sells: number;
  holders: number;
  pool_open_time: number;
  last_update: number;
  // Security metrics (optional)
  snipers?: number;
  stars?: number;
  bot_total_fees: number;
  insider_percentage?: number;
  dev_holding_percentage?: number;
  // Social metrics
  discord_mentions?: number;
  // Performance
  athPercentSincePing?: number;
  athSincePing?: number;
  "1m": number;
  "5m": number;
  "30m": number;
  "1h": number;
  // Security
  mint_disabled: boolean;
  freeze_disabled: boolean;
  burned: boolean;
  top10: boolean;
  top10_percentage: number;
  sniper_percentage: number;
  // Bundle info
  bundled: boolean;
  bundled_percentage: number | null;
  bundled_amount_base: number;

  dev_sold: false;
  progress: number;
  migrated_time: null;
  migrating: false;
  migration: {
    price_base: number;
    price_usd: number;
    market_cap_base: number;
    market_cap_usd: number;
    progress: number;
    migrating: false;
    timestamp: null | number;
    slot: number;
  };
  swap_keys: {
    mint: string;
    dex: string;
    swap_keys: NovaSwapKeys;
    remaining_accounts: string[] | null;
    is_usdc: boolean;
    is_2022: boolean;
    is_wrapped_sol: boolean;
    decimals: number;
    base_decimals: number;
  };
}

export const getIgniteTokens = async (
  params: IgniteTokensQueryParams,
): Promise<IgniteToken[]> => {
  const API_ENDPOINT = getBaseURLBasedOnRegion("/ignite-tokens");

  try {
    const { data } = await axios.get<IgniteToken[]>(API_ENDPOINT, {
      params,
      withCredentials: true,
      headers: {
        "X-Nova-Session": cookies.get("_nova_session") || "",
      },
    });
    return data;
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch ignite tokens",
      );
    }
    throw new Error("Failed to fetch ignite tokens");
  }
};
