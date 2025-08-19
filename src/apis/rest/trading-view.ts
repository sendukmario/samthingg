import { NovaChart, NovaChartTrades } from "@/types/nova_tv.types";
import cookies from "js-cookie";
import { getBaseURLBasedOnRegion } from "../../utils/getBaseURLBasedOnRegion";
import axios from "@/libraries/axios";
import { convertDecimals } from "@/utils/convertDecimals";
import { AxiosResponse } from "axios";

export async function fetchHistoricalData({
  currency,
  initial,
  interval,
  mint,
  countBack,
  from,
  to,
}: {
  mint: string;
  interval: string;
  currency: "sol" | "usd";
  from?: number;
  to?: number;
  countBack?: number;
  initial: boolean;
}): Promise<NovaChart> {
  const API_BASE_URL = getBaseURLBasedOnRegion(
    `/charts/candles?mint=${mint}&interval=${interval}&currency=${currency}&from=${from}&to=${to}&countback=${countBack}&initial=${initial}`,
  );

  const response: AxiosResponse<NovaChart> = await axios.get(API_BASE_URL);
  const data = await response.data;

  const finalRes = {
    ...data,
    candles: data.candles || [],
    supply: convertDecimals(Number(data.supply_str || 0), data.quote_decimals) as number
  };

  return finalRes;
}
export async function fetchInitTradesData(
  mint: string,
): Promise<NovaChartTrades> {
  const API_BASE_URL = getBaseURLBasedOnRegion(`/charts/trades?mint=${mint}`);

  const response = await axios.get(API_BASE_URL);
  const data = await response.data;
  return {
    ...data,
    trades: data.trades || [],
  };
}
export async function fetchSeparatedTradesData(
  mint: string,
  tradeVariant: "user" | "wallet-tracker" | "developer",
): Promise<NovaChartTrades> {
  const API_BASE_URL = getBaseURLBasedOnRegion(
    `/charts/trades/${tradeVariant}?mint=${mint}`,
  );

  const response = await axios.get(API_BASE_URL);
  const data = await response.data;
  return {
    ...data,
    trades: data.trades || [],
  };
}
export async function fetchResolveSymbol(mint: string): Promise<{
  name: string;
  symbol: string;
  image: string;
  dex: string;
  created_at: number;
}> {
  const API_BASE_URL = getBaseURLBasedOnRegion(`/metadata?mint=${mint}`);

  const response = await axios.get(API_BASE_URL);
  return await response.data;
}
