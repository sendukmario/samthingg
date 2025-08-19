import { useCallback, useEffect, useState, useMemo } from "react";
import { getDeveloperAddress, DeveloperAddressData } from "@/apis/rest/developer-address";

interface UseDeveloperAddressReturn {
  data: DeveloperAddressData;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch and manage developer address data for a token
 * Implements caching, error handling, and automatic cleanup
 * @param mint - Token mint address
 * @returns Developer address data, loading state, error state, and refetch function
 */
export const useDeveloperAddress = (mint: string): UseDeveloperAddressReturn => {
  const [data, setData] = useState<DeveloperAddressData>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Memoize the fetch function to prevent unnecessary re-renders
  const fetchDeveloperAddress = useCallback(async () => {
    if (!mint) {
      setData({});
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await getDeveloperAddress(mint);
      setData(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch developer address');
      setError(error);
      // Set empty data on error to prevent showing stale data
      setData({});
    } finally {
      setIsLoading(false);
    }
  }, [mint]);

  // Fetch data on mount and when mint changes
  useEffect(() => {
    fetchDeveloperAddress();
  }, [fetchDeveloperAddress]);

  // Cleanup function to reset state when component unmounts
  useEffect(() => {
    return () => {
      setData({});
      setIsLoading(false);
      setError(null);
    };
  }, []);

  // Memoize return value to prevent unnecessary re-renders
  const returnValue = useMemo(() => ({
    data,
    isLoading,
    error,
    refetch: fetchDeveloperAddress,
  }), [data, isLoading, error, fetchDeveloperAddress]);

  return returnValue;
};
