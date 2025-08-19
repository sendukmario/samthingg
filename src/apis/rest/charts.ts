import axios from "@/libraries/axios";
import { TokenDataMessageType } from "@/types/ws-general";
import { QueryClient } from "@tanstack/react-query";
import { getBaseURLBasedOnRegion } from "../../utils/getBaseURLBasedOnRegion";
import {  HistoricalDataParams } from "./candles";
import { fetchHistoricalData } from "./trading-view";

type ChartsResponse =
  | TokenDataMessageType
  | { success: boolean; message: string };

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 500;

function delay(ms: number) {
  let timeoutId: NodeJS.Timeout;
  const promise = new Promise<void>((resolve) => {
    timeoutId = setTimeout(resolve, ms);
  });

  return {
    promise,
    cancel: () => clearTimeout(timeoutId),
  };
}

export async function fetchChartsWithRetry(
  mint: string,
  retryCount = 0,
  token?: string,
): Promise<{ data: ChartsResponse }> {
  const sanitizedMint = mint.startsWith("/token/") ? mint.slice(7) : mint;
  const API_BASE_URL = getBaseURLBasedOnRegion(`/charts?mint=${sanitizedMint}`);

  // console.log(
  //   `Fetching charts for mint: ${sanitizedMint} (attempt ${retryCount + 1})`,
  // );
  try {
    const response = await axios.get<ChartsResponse>(
      API_BASE_URL,
      token
        ? {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        : {},
    );

    if (
      response.data &&
      "success" in response.data &&
      !response.data.success &&
      retryCount < MAX_RETRIES
    ) {
      const retryDelay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
      // console.log(
      //   `Retrying fetchCharts (attempt ${retryCount + 1}/${MAX_RETRIES}) after ${retryDelay}ms`,
      // );
      const delayHandler = delay(retryDelay);
      try {
        await delayHandler.promise;
        return fetchChartsWithRetry(sanitizedMint, retryCount + 1);
      } catch (err) {
        delayHandler.cancel();
        throw err;
      }
    }

    return response.data?.success === true ? {
      data: response.data
    } : {
      data: {
        ...response.data,
        transactions: (response.data as any).transactions || [],
        chart_traders: (response.data as any).chart_traders || [],
      },
    }
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      const retryDelay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
      // console.log(
      //   `Retrying fetchCharts after error (attempt ${retryCount + 1}/${MAX_RETRIES}) after ${retryDelay}ms`,
      // );
      const delayHandler = delay(retryDelay);
      try {
        await delayHandler.promise;
        return fetchChartsWithRetry(sanitizedMint, retryCount + 1);
      } catch (err) {
        delayHandler.cancel();
        throw err;
      }
    }
    throw error;
  }
}

export const prefetchChart = async (
  queryClientNormal: QueryClient,
  mintAddress: string,
) => {
  await queryClientNormal.prefetchQuery({
    queryKey: ["chart", mintAddress],
    queryFn: () =>
      fetchChartsWithRetry(mintAddress, 0).then(({ data }) => data),
    staleTime: 0,
    gcTime: 0,
  });
};

export const prefetchCandles = async (
  queryClientNormal: QueryClient,
  params: HistoricalDataParams,
) => {
  // console.log("PREFETCHING CANDLES DATA 0", [
  //   "candles",
  //   params?.mint,
  //   params.currency,
  //   params.interval?.toLowerCase(),
  // ]);
  await queryClientNormal.prefetchQuery({
    queryKey: [
      "candles",
      params?.mint,
      params?.currency?.toLowerCase(),
      params?.interval?.toLowerCase(),
    ],
    queryFn: () => fetchHistoricalData({
      currency: params?.currency,
      initial: params?.initial || false,
      interval: params?.interval,
      mint: params?.mint,
      countBack: params?.countBack,
      from: params?.from,
      to: params?.to,
    }),
    staleTime: 60_000, // 1 minute
    gcTime: 60_000, // 5 minutes
  });
};
