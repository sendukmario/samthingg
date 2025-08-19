import axios from "@/libraries/axios";
import { AxiosError } from "axios";
import cookies from "js-cookie";
import { getBaseURLBasedOnRegion } from "@/utils/getBaseURLBasedOnRegion";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface KolInfo {
  name: string;
  url: string;
}

export type KolsResponse = Record<string, KolInfo>; // walletAddress => KolInfo

// -----------------------------------------------------------------------------
// API call
// -----------------------------------------------------------------------------

/**
 * Fetches the full KOL mapping.
 * Returns an object keyed by wallet address with `Name` and `URL` fields.
 */
export const getKols = async (): Promise<KolsResponse> => {
  const API_ENDPOINT = getBaseURLBasedOnRegion("/kols");

  try {
    const { data } = await axios.get<KolsResponse>(API_ENDPOINT, {
      withCredentials: true,
      headers: {
        "X-Nova-Session": cookies.get("_nova_session") || "",
      },
    });

    return data;
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch KOLs data",
      );
    }

    throw new Error("Failed to fetch KOLs data");
  }
};
