export type ChartPrice = {
  mint: string;
  price: number;
  price_usd: number;
  supply: number;
  solana_price: number;
  volume: number;
  transaction: string;
};

export type MessageStatus = { success: boolean; channel: string; mint: string };

export type Candle = {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type Ping = {
  channel: string;
  success: boolean;
};

export type InitialChartTrades = {
  success: boolean;
  channel: "chartTrades";
  data: Trade[];
};

export type Trade = {
  average_price_base: number;
  average_price_usd: number;
  average_sell_price_base: number;
  average_sell_price_usd: number;
  colour: string;
  letter: string;
  price: number;
  price_usd: number;
  supply: number;
  supply_str: string;
  timestamp: number;
  wallet: string;
  token_amount: number;
  signature?: string;
  imageUrl?: string;
  name?: string;
  mint?: string;
  adjusted?: boolean;
};

export type Order = {
  type: string;
  price: number;
  priceUsd: string;
};

export type SolanaPrice = {
  channel: string;
  data: {
    price: number;
  };
};

export type NovaChart = {
  candles: Candle[];
  no_data: boolean;
  message?: string;
  success?: boolean;
  supply?: number;
  supply_str?: string;
  quote_decimals?: number;
};
export type NovaChartTrades = {
  developer_trades: Trade[];
  insider_trades: Trade[];
  other_trades: Trade[];
  sniper_trades: Trade[];
  trades: Trade[];
  user_trades: Trade[];
  no_data: boolean;
};

export type TradeFilter =
  | "my_trades"
  | "sniper_trades"
  | "dev_trades"
  | "insider_trades"
  | "tracked_trades"
  | "other_trades";

export type TradeLetter =
  | "B"
  | "S"
  | "DB"
  | "DS"
  | "SB"
  | "SS"
  | "IB"
  | "IS"
  | string;

export type CurrencyChart = "SOL" | "USD";
export type ChartType = "Price" | "MCap";
