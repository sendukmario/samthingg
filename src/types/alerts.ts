export interface Alert {
  dex: string;
  image: string;
  marketCap: number;
  mint: string;
  module: "Quick Buy" | "Quick Sell" | "Buy Sniper" | "Sell Sniper";
  name: string;
  price: number;
  signature: string;
  baseAmount: number;
  symbol: string;
  timestamp: number;
  tokenAmount: number;
  type: "buy" | "sell";
  walletAddress: string;
  walletName: string;
  status: "success" | "failed";
}
