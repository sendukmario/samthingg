import axios from "@/libraries/axios";
import { AxiosError } from "axios";
import { ChartHolderInfo } from "@/types/ws-general";
import { getBaseURLBasedOnRegion } from "../../utils/getBaseURLBasedOnRegion";
import { convertHoldersLamports } from "@/utils/lamportsConverter";

export const getHolders = async ({
  mint,
  filter,
  limit = 50,
  offset = 0,
}: {
  mint: string;
  filter:
    | "all"
    | "top10"
    | "insiders"
    | "snipers"
    | "myHoldings"
    | "following";
  limit?: number;
  offset?: number;
}): Promise<ChartHolderInfo[] | null> => {
  const API_BASE_URL = getBaseURLBasedOnRegion("/charts/holders");

  try {
    // Map "all" to "holders" for the API call
    const apiFilter = filter === "all" ? "holders" : filter;
    
    console.warn("API CALL DEBUG 🚀", { mint, filter, apiFilter, API_BASE_URL, limit, offset });
    
    const { data } = await axios.get<ChartHolderInfo[] | null>(API_BASE_URL, {
      withCredentials: false,
      params: {
        mint,
        filter: apiFilter,
        limit,
        offset,
      },
    });
    return data || []
  } catch (error) {
    console.error("API ERROR ❌", error);
    if (error instanceof AxiosError) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch chart holders",
      );
    }
    throw new Error("Failed to fetch chart holders");
  }
};
