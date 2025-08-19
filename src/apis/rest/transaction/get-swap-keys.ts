import axios, { AxiosError } from "axios";
import { getBaseURLBasedOnRegion } from "@/utils/getBaseURLBasedOnRegion";
import { SwapKeys } from "@/types/swap-keys";

interface GetSwapKeysProps {
  wallet: string; // wallet address
  mint: string; // mint address
}

/**
 * Fetches the account information for swap key transaction. 
 * `/swap/keys` endpoint.
 *
 */
export async function getSwapKeys({
  wallet,
  mint,
}: GetSwapKeysProps) {
  try {
    const { data } = await axios.get<SwapKeys>(
      getBaseURLBasedOnRegion("/swap/keys"),
      {
        params: { wallet, mint },
      }
    );

    return data
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch instructions accounts",
      );
    }

    throw new Error("Failed to fetch instructions accounts");
  }
}
