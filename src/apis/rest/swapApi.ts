import type { SwapKeysResponse, SwapKeysParams } from "../../types/swap";
import { getBaseURLBasedOnRegion } from "../../utils/getBaseURLBasedOnRegion";

/**
 * Configuration for the swap API client
 */
export interface SwapApiConfig {
  baseUrl?: string;
  timeout?: number;
  apiKey?: string;
}

/**
 * Client for interacting with the swap API
 */
export class SwapApiClient {
  private baseUrl: string;
  private timeout: number;
  private apiKey?: string;

  constructor(config: SwapApiConfig = {}) {
    // Use the project's existing region-based URL function
    this.baseUrl = config.baseUrl || getBaseURLBasedOnRegion("");
    this.timeout = config.timeout || 20000; // 20 seconds default
    this.apiKey = config.apiKey || process.env.NEXT_PUBLIC_API_KEY;
  }

  /**
   * Fetches swap instruction keys from the API
   * @param params - Parameters for the swap keys request
   * @returns Promise resolving to swap keys response
   */
  async getSwapKeys(params: SwapKeysParams): Promise<SwapKeysResponse> {
    const url = new URL("/api-v1/swap/keys", this.baseUrl);
    // url.searchParams.append(
    //   "wallet",
    //   (process.env.NEXT_PUBLIC_TURNKEY_WALLET_ADDRESS ||
    //     process.env.TURNKEY_WALLET_ADDRESS)!,
    // );
    url.searchParams.append("wallet", params.wallet);
    url.searchParams.append("mint", params.mint);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url.toString(), {
        method: "GET",
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(
          `API request failed: ${response.status} ${response.statusText}`,
        );
      }

      const data: SwapKeysResponse = await response.json();
      console.log("Swap keys response🌟🌟🌟:", JSON.stringify(data));

      // Validate the response structure
      if (!this.isValidSwapKeysResponse(data)) {
        throw new Error("Invalid response format from swap keys API");
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          throw new Error(`Request timeout after ${this.timeout}ms`);
        }
        throw error;
      }
      throw new Error("Unknown error occurred while fetching swap keys");
    }
  }

  /**
   * Validates the structure of the swap keys response
   * @param data - Data to validate
   * @returns Boolean indicating if the data is valid
   */
  private isValidSwapKeysResponse(data: any): data is SwapKeysResponse {
    return (
      data &&
      typeof data === "object" &&
      typeof data.use_wrapped_sol === "boolean" &&
      Array.isArray(data.buy_instructions) &&
      Array.isArray(data.sell_instructions)
    );
  }

  /**
   * Updates the base URL for the API client
   * @param baseUrl - New base URL
   */
  setBaseUrl(baseUrl: string): void {
    this.baseUrl = baseUrl;
  }

  /**
   * Updates the API key for the client
   * @param apiKey - New API key
   */
  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  /**
   * Gets the current configuration
   * @returns Current configuration object
   */
  getConfig(): SwapApiConfig {
    return {
      baseUrl: this.baseUrl,
      timeout: this.timeout,
      apiKey: this.apiKey,
    };
  }
}

/**
 * Default instance of the swap API client
 */
export const defaultSwapApiClient = new SwapApiClient();
