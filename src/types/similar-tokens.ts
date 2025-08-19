import { DEX } from "./ws-general";

export interface SimilarToken {
  name: string;
  symbol: string;
  mint: string;
  dex: DEX;
  image: string;
  marketCap: number;
  createdAt: number;
  lastTrade: number;
}
