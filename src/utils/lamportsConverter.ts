import {
  CosmoDataMessageType,
  HoldingsTokenData,
  TransactionInfo,
  TokenDataMessageType,
  ChartTraderInfo,
  ChartHolderInfo,
} from "@/types/ws-general";
import { convertDecimals } from "./convertDecimals";
import { WalletTracker } from "@/apis/rest/wallet-tracker";
import { IgniteToken } from "@/apis/rest/igniteTokens";

export const convertTradesLamports = ({
  trades,
  supply_str,
  decimals: { base_decimals, quote_decimals },
}: {
  trades: TransactionInfo[];
  supply_str?: string;
  decimals: {
    base_decimals: number;
    quote_decimals: number;
  };
}) => {
  if (
    !trades ||
    trades?.length === 0 ||
    Number(supply_str) === 0 ||
    !Boolean(Number(supply_str)) ||
    !quote_decimals ||
    !base_decimals
  )
    return [];
  const supply = convertDecimals(supply_str || "0", quote_decimals);
  const res = trades.map((trade, i) => {
    if (trade?.is_converted) {
      if (trade?.is_supply_correct) return trade;
      return {
        ...trade,
        market_cap_usd: trade.price_usd * supply,
        market_cap: trade.price * supply,
        is_supply_correct: Boolean(supply_str && !isNaN(Number(supply_str))),
      };
    }
    return {
      ...trade,
      market_cap_usd: trade.price_usd * supply,
      market_cap: trade.price * supply,
      token_amount: convertDecimals(trade.quote_amount_str, quote_decimals),
      base_amount: convertDecimals(trade.base_amount_str, base_decimals),
      is_converted: true,
      is_supply_correct: Boolean(supply_str && !isNaN(Number(supply_str))),
    };
  });
  return res;
};

export const convertTopTradersLamports = ({
  trades,
  supply_str,
  decimals: { base_decimals, quote_decimals },
}: {
  trades: ChartTraderInfo[];
  supply_str?: string;
  decimals: {
    base_decimals: number;
    quote_decimals: number;
  };
}) => {
  const res = trades.map((trade, i) => {
    return {
      ...trade,
      token_balance: convertDecimals(trade.token_balance, quote_decimals),
      bought_base: convertDecimals(trade.bought_base, base_decimals),
      bought_tokens: convertDecimals(trade.bought_tokens, quote_decimals),
      bought_usd: convertDecimals(trade.bought_usd, quote_decimals),
      sold_base: convertDecimals(trade.sold_base, base_decimals),
      sold_tokens: convertDecimals(trade.sold_tokens, quote_decimals),
      sold_usd: convertDecimals(trade.sold_usd, quote_decimals),
      profit_usd: convertDecimals(trade.profit_usd, quote_decimals),
      profit_base: convertDecimals(trade.profit_base, base_decimals),
    };
  });
  return res;
};

export const convertHoldingsLamports = (token: HoldingsTokenData) => {
  if (!token) return token;
  const base_decimals = (!token.token?.base_decimals || token.token?.base_decimals === 0) ? (token.token.is_usd ? 6 : 9) : token.token?.base_decimals;

  return token.is_converted ? token : {
    ...token,
    token: {
      ...token.token,
      base_decimals,
    },
    sold_tokens: convertDecimals(
      token.sold_tokens,
      token.token?.quote_decimals,
    ),
    price: {
      ...token.price,
      supply: convertDecimals(token.price.supply, token.token?.quote_decimals),
    },
    bought_tokens: convertDecimals(
      token.bought_tokens,
      token.token?.base_decimals,
    ),
    balance: convertDecimals(token.balance, token.token?.quote_decimals),
    invested_base: convertDecimals(
      token.invested_base,
      token.token?.base_decimals,
    ),
    sold_base: convertDecimals(token.sold_base, base_decimals),
    is_converted: true,
  };
};

// Overload for single object
export function convertCosmoLamports(
  cosmo: CosmoDataMessageType,
  is_update_volume?: boolean
): CosmoDataMessageType;

// Overload for array
export function convertCosmoLamports(
  cosmo: CosmoDataMessageType[],
  is_update_volume?: boolean
): CosmoDataMessageType[];

// Implementation
export function convertCosmoLamports(
  cosmo: CosmoDataMessageType[] | CosmoDataMessageType,
  is_update_volume?: boolean,
) {
  const cosmoArray = Array.isArray(cosmo) ? cosmo : [cosmo];

  const convertedCosmo = cosmoArray.map(
    (token) =>
      ({
        ...token,
        migration: {
          ...token.migration,
          progress: token.migration.progress! * 100,
        },
        bot_total_fees: convertDecimals(
          token.bot_total_fees,
          token.swap_keys.base_decimals,
        ),
        bundled_percentage: token.bundled_percentage! * 100,
        dev_holding_percentage: token.dev_holding_percentage! * 100,
        insider_percentage: token.insider_percentage! * 100,
        sniper_percentage: token.sniper_percentage! * 100,
        top10_percentage: token.top10_percentage! * 100,
        progress: token.progress! * 100,
        volume_usd:
          (token?.volume_usd || 0) /
          Math.pow(10, token?.swap_keys?.base_decimals || 9),
      }) as CosmoDataMessageType,
  ); 

  return Array.isArray(cosmo) ? convertedCosmo : convertedCosmo[0];
}

export const convertChartHoldingsLamports = (
  token: TokenDataMessageType,
): TokenDataMessageType => {
  const base_decimals = (!token.token?.base_decimals || token.token?.base_decimals === 0) ? (token.token.is_usd ? 6 : 9) : token.token?.base_decimals;
  const convertedLiquidity =
    (token.price?.liquidity_usd || 0) /
    Math.pow(10, base_decimals || 9);
  const supply = convertDecimals(
    token?.price?.supply_str,
    token?.token?.quote_decimals,
  );

  return {
    ...token,
    token: {
      ...token.token,
      base_decimals: (!token.token?.base_decimals || token.token?.base_decimals === 0) ? (token.token.is_usd ? 6 : 9) : token.token?.base_decimals,
    },
    chart_holders: {
      ...token?.chart_holders,
      chart_holders: token?.chart_holders?.chart_holders.map((holder) => ({
        ...holder,
        bought_base: convertDecimals(
          holder?.bought_base,
          base_decimals,
        ),
        bought_tokens: convertDecimals(
          holder?.bought_tokens,
          token?.token?.quote_decimals,
        ),
        bought_usd: convertDecimals(
          holder?.bought_usd,
          token.token?.quote_decimals,
        ),
        percentage_owned: holder?.percentage_owned * 100,
        token_balance: convertDecimals(
          holder?.token_balance,
          token?.token?.quote_decimals,
        ),
        sold_base: convertDecimals(
          holder?.sold_base,
          base_decimals,
        ),
        sold_tokens: convertDecimals(
          holder?.sold_tokens,
          token?.token?.quote_decimals,
        ),
        sold_usd: convertDecimals(
          holder?.sold_usd,
          token.token?.quote_decimals,
        ),
      })),
    },
    price: {
      progress: (token?.price?.progress || 0) * 100,
      price_sol: token?.price?.price_sol as number,
      price_usd: token?.price?.price_usd ?? 0,
      market_cap_usd: supply * (token?.price?.price_usd || 0),
      liquidity_usd: convertedLiquidity,
      volume_usd: token?.price?.volume_usd ?? 0,
      volume_base: token?.price?.volume_base ?? 0,
      supply: supply,
      price_base: token?.price?.price_base ?? 0,
      supply_str: supply.toString() || "1_000_000_000",
      migration: token?.price?.migration
        ? {
          ...token.price.migration,
          progress: token.price.migration.progress! * 100,
        }
        : {
          slot: 0,
          market_cap_base: 0,
          market_cap_usd: 0,
          migrating: false,
          price_base: 0,
          price_usd: 0,
          progress: 0,
          timestamp: 0,
        },
    },
  };
};

interface HoldersLamports {
  holder: ChartHolderInfo;
  decimals: {
    base_decimals: number;
    quote_decimals: number;
  };
}

export const convertHoldersLamports = ({
  holder,
  decimals: { base_decimals, quote_decimals },
}: HoldersLamports): ChartHolderInfo => {
  return {
    ...holder,
    bought_base: convertDecimals(holder?.bought_base, base_decimals),
    bought_tokens: convertDecimals(holder?.bought_tokens, quote_decimals),
    bought_usd: convertDecimals(holder?.bought_usd, quote_decimals),
    percentage_owned: holder?.percentage_owned * 100,
    token_balance: convertDecimals(holder?.token_balance, quote_decimals),
    sold_base: convertDecimals(holder?.sold_base, base_decimals),
    sold_tokens: convertDecimals(holder?.sold_tokens, quote_decimals),
    sold_usd: convertDecimals(holder?.sold_usd, quote_decimals),
  };
};

export const convertWalletTrackerLamports = (
  walletTracker: WalletTracker,
): WalletTracker => {
  return {
    ...walletTracker,
    balanceNow: convertDecimals(walletTracker.balanceNow, (walletTracker?.quote_decimals || 9)),
    balanceTotal: convertDecimals(walletTracker.balanceTotal, (walletTracker?.quote_decimals || 9)),
    baseAmount: convertDecimals(walletTracker.baseAmount, (walletTracker?.base_decimals || 9)),
    tokenAmount: convertDecimals(walletTracker.tokenAmount, (walletTracker?.quote_decimals || 9)),
  };
};

export const convertIgniteLamports = (ignite: IgniteToken): IgniteToken => {
  const convertedLiquidity =
    (ignite.liquidity_usd || 0) /
    Math.pow(10, ignite?.swap_keys?.base_decimals || 9);

  return {
    ...ignite,
    liquidity_usd: convertedLiquidity,
  };
}
