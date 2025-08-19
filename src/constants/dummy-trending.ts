import { IgniteToken } from "@/apis/rest/igniteTokens";

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

type PartialIgniteToken = DeepPartial<IgniteToken>;
export const DUMMY_TOKENS: any = Array.from({ length: 8 }, (_, i) => ({
  // Basic
  name: `Dummy Token ${i + 1}`,
  symbol: `DUM${i + 1}`,
  mint: `DUMMYMINT${i + 1}`,
  image: null,
  supply: 1_000_000 + i * 10_000,
  type: "update",
  developer: "7rtiKSUDLBm59b1SBmD9oajcP8xE64vAGSMbAN5CXy1q",
  created: 1754208714 + i * 1000,
  dev_migrated: 0,
  bot_holders: 1,

  // Social
  youtube: "",
  tiktok: "",
  instagram: "",
  twitter: null,
  telegram: null,
  website: null,
  launchpad: null,
  dex: "🐬 cooker",
  origin_dex: "Dynamic Bonding Curve",

  // Metrics
  volume_usd: 10000 + i * 1000,
  market_cap_usd: 500000 + i * 50000,
  liquidity_usd: 20000 + i * 2000,
  buys: 50 + i * 5,
  sells: 40 + i * 4,
  holders: 200 + i * 10,
  pool_open_time: 1754200000 + i * 100,
  last_update: 1754209000 + i * 50,

  // Security metrics
  bot_total_fees: 500 + i * 10,
  snipers: 2 + i,
  stars: 3,
  insider_percentage: 1.5 + i,
  dev_holding_percentage: 2.5 + i,

  // Social metrics
  discord_mentions: i,

  // Performance
  "1m": 0.5 + i * 0.1,
  "5m": 1.0 + i * 0.2,
  "30m": 2.0 + i * 0.3,
  "1h": 3.0 + i * 0.4,

  // Security
  mint_disabled: false,
  freeze_disabled: false,
  burned: false,
  top10: i % 2 === 0,
  top10_percentage: 5 + i,
  sniper_percentage: 1.5 + i,

  // Bundle info
  bundled: i % 3 === 0,
  bundled_percentage: i % 3 === 0 ? 10 + i : null,
  bundled_amount_base: i * 100,

  dev_sold: false,
  progress: i,
  migrated_time: null,
  migrating: false,
  migration: {
    price_base: 0.00001 + i * 0.00001,
    price_usd: 0.01 + i * 0.001,
    market_cap_base: 10000 + i * 1000,
    market_cap_usd: 10000 + i * 1000,
    progress: i,
    migrating: false,
    timestamp: null,
    slot: 100000 + i,
  },
  swap_keys: {
    mint: `DUMMYMINT${i + 1}`,
    dex: "🐬 cooker",
    remaining_accounts: null,
    is_usdc: true,
    is_2022: false,
    is_wrapped_sol: true,
    decimals:   9,
    base_decimals: 6,
  }
}));
