// ######## Libraries 📦 & Hooks 🪝 ########
import axios from "@/libraries/axios";
import { AxiosError } from "axios";
import { getBaseURLBasedOnRegion } from "@/utils/getBaseURLBasedOnRegion";

export interface TokenPnL {
  average_price_base: number;
  average_price_usd: number;
  average_sell_price_base: number;
  average_sell_price_usd: number;
  balance: number;
  bought_tokens: number;
  first_trade: number; // assuming it's a timestamp in ms
  image: string;
  invested_base: number;
  invested_usd: number;
  last_trade: number; // assuming it's a timestamp in ms
  name: string;
  mint: string;
  platform: string;
  pool: Pool;
  timestamp: string; // ISO date string
  realized_pnl_base: number;
  realized_pnl_percentage: number;
  realized_pnl_usd: number;
  sold_base: number;
  sold_tokens: number;
  sold_usd: number;
  symbol: string;
  current_price: {
    price_base: number;
    market_cap_base: number;
    volume_base: number;
    buy_volume_base: number;
    sell_volume_base: number;
    liquidity_base: number;
    price_usd: number;
    market_cap_usd: number;
    volume_usd: number;
    buy_volume_usd: number;
    sell_volume_usd: number;
    liquidity_usd: number;
  };
}

export interface PnLDataPoint {
  value: number;
  time: number; // unix timestamp in seconds
}

export interface Holding {
  average_price_base: number;
  average_price_usd: number;
  average_sell_price_base: number;
  average_sell_price_usd: number;
  first_trade: string; // ISO date string
  image: string;
  invested_usd: number;
  invested_base: number;
  // invested_quote_amount: number; // TODO: change to new response
  last_trade: string; // ISO date string
  // mint: string;
  name: string;
  pool: Pool;
  realized_pnl_base: number;
  realized_pnl_percentage: number;
  realized_pnl_usd: number;
  remaining_token_balance: number;
  balance: number;
  sold_base: number;
  sold_tokens: number;
  sold_usd: number;
  symbol: string;
  total_buys: number;
  total_sells: number;
  current_price: {
    price_base: number;
    market_cap_base: number;
    volume_base: number;
    buy_volume_base: number;
    sell_volume_base: number;
    liquidity_base: number;
    price_usd: number;
    market_cap_usd: number;
    volume_usd: number;
    buy_volume_usd: number;
    sell_volume_usd: number;
    liquidity_usd: number;
  };
}

export interface PnlData {
  Total_invested_quote: number;
  realized_pnl_base: number;
  realized_pnl_percentage: number;
  realized_pnl_usd: number;
  total_buys: number;
  total_invested_base: number;
  total_invested_usd: number;
  total_pnl_base: number;
  total_pnl_percentage: number;
  total_pnl_usd: number;
  total_sells: number;
  total_sold_base: number;
  total_sold_quote: number;
  total_sold_usd: number;
  first_trade?: number; // ISO date string
  last_trade?: number; // ISO date string
}

export interface PnLResponse {
  top_pnl: TokenPnL[];
  chart_data: PnLDataPoint[];
  pnl_1_day: PnlData;
  pnl_7_day: PnlData;
  pnl_30_day: PnlData;
  pnlAllTime: PnlData;
  holdings: Holding[];
}
export const getPortofolioPnl = async (wallet: string) => {
  try {
    const { data } = await axios.get<PnLResponse>(
      getBaseURLBasedOnRegion("/portfolio"),
      {
        params: { wallet },
        withCredentials: false,
      },
    );
    return data;
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new Error(
        error.response?.data?.error || "Failed to fetch portofolio PNL",
      );
    }
    throw new Error("Failed to fetch portofolio PNL");
  }
};

// export interface TransactionWithTokenInfo {
//   token: TokenMetadata;
//   mint: string;
//   is_developer: boolean;
//   signature: string;
//   slot: number;
//   wallet: string;
//   method: "buy" | "sell";
//   base_amount: number;
//   tokenAmount: number;
//   price_base: number;
//   price_usd: number;
//   decimals: number;
//   timestamp: string;
// }

interface Pool {
  mint: string;
  platform: string;
  pool: string;
  // Raw: string;
  timestamp: string; // ISO 8601 date string
}

export interface Transactions {
  pool: Pool;
  image: string;
  name: string;
  symbol: string;
  is_developer: boolean;
  signature: string;
  slot: number;
  wallet: string;
  method: "buy" | "sell" | "add";
  base_amount: number;
  token_amount: number;
  price_base: number;
  price_usd: number;
  decimals: number;
  timestamp: string; // ISO 8601 date string, or convert from Unix timestamp if needed
}

export interface TokenMetadata {
  mint: string;
  name: string;
  symbol: string;
  description: string;
  uri: string;
  image: string;

  telegram: string;
  twitter: string;
  website: string;

  supply: number;
  decimals: number;
  deployer: string;
  is2022: boolean;

  timestamp: string; // ISO 8601 date string
}

export interface PaginatedPortfolioTradeHistory {
  transactions: Transactions[];
  currentPage: number;
  itemsPerPage: number;
  hasNextPage: boolean;
}

export const getTradeHistory = async (
  wallet: string,
  page?: number,
): Promise<PaginatedPortfolioTradeHistory> => {
  try {
    const { data } = await axios.get<PaginatedPortfolioTradeHistory>(
      getBaseURLBasedOnRegion("/portfolio/trade-history"),
      {
        params: {
          wallet,
          page,
        },
        withCredentials: false,
      },
    );
    return data;
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new Error(
        error.response?.data?.error || "Failed to fetch wallet trade history",
      );
    }
    throw new Error("Failed to fetch wallet trade history");
  }
};
