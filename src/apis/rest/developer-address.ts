import axios from "@/libraries/axios";
import { AxiosError } from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_REST_MAIN_URL || "";

export interface FunderData {
  amount: number;
  time: number;
  tx_hash: string;
  wallet: string;
}

export interface DeveloperAddressData {
  developer?: string;
  funder?: FunderData;
  funders?: FunderData[]; // Support multiple funders if API returns array
  mint?: string;
}

/**
 * Fetches developer funding details for a specific token mint address
 * Optimized for memory efficiency and includes request cancellation
 * @param mint - The token mint address
 * @param signal - AbortSignal for request cancellation
 * @param wallet - Optional wallet address to filter results
 * @returns Promise<DeveloperAddressData>
 */
export const getDeveloperAddress = async (
  mint: string,
  signal?: AbortSignal,
  wallet?: string,
): Promise<DeveloperAddressData> => {
  console.log("🔍 getDeveloperAddress API function called with:", { mint, wallet, hasSignal: !!signal });
  
  try {
    if (!mint?.trim()) {
      console.log("❌ getDeveloperAddress: Empty mint parameter, returning empty object");
      return {};
    }

    // Sanitize mint parameter to prevent issues
    const sanitizedMint = mint.trim();
    const apiUrl = `${API_BASE_URL}/developer-address`;
    
    // Build request parameters
    const params: { mint: string; wallet?: string } = { mint: sanitizedMint };
    if (wallet?.trim()) {
      params.wallet = wallet.trim();
    }
    
    console.log("🚀 getDeveloperAddress: Making API request to:", apiUrl);
    console.log("🚀 getDeveloperAddress: Request params:", params);
    console.log("🚀 getDeveloperAddress: API_BASE_URL:", API_BASE_URL);
    
    const { data } = await axios.get<DeveloperAddressData>(
      apiUrl,
      {
        params,
        withCredentials: false,
        signal, // Support request cancellation
        timeout: 10000, // 10 second timeout
      },
    );
    
    console.log("✅ getDeveloperAddress: API response received:", data);

    // Return the actual API response structure
    const result = {
      developer: data?.developer || undefined,
      funder: data?.funder || undefined,
      mint: data?.mint || undefined,
    };
    
    console.log("✅ getDeveloperAddress: Returning processed result:", result);
    return result;
  } catch (error) {
    console.log("❌ getDeveloperAddress: Error occurred:", error);
    
    // Handle aborted requests silently
    if (error instanceof Error && error.name === 'AbortError') {
      console.log("🚫 getDeveloperAddress: Request was aborted");
      return {};
    }
    
    if (error instanceof AxiosError) {
      console.log("❌ getDeveloperAddress: Axios error details:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        url: error.config?.url,
      });
      
      // Only log non-404 errors to reduce console noise
      if (error.response?.status !== 404) {
        console.warn("Failed to fetch developer address:", error.response?.data?.message || error.message);
      }
      return {};
    }
    
    // Minimal error logging to prevent memory leaks
    console.warn("Developer address fetch error:", error instanceof Error ? error.message : 'Unknown error');
    return {};
  }
};
