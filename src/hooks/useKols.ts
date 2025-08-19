import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import { getKols, KolsResponse } from "@/apis/rest/kols";

/**
 * React Query hook to fetch and cache KOL mapping.
 * StaleTime set to 10 minutes as KOL mapping is relatively static.
 */
export const useKols = () => {
  const queryFn = useCallback(async () => {
    return getKols();
  }, []);

  const {
    data = {},
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery<KolsResponse, Error>({
    queryKey: ["kols-mapping"],
    queryFn,
    staleTime: 600_000, // 10 minutes
    placeholderData: {},
  });

  return {
    kols: data,
    isLoading: isLoading || isFetching,
    isError,
    error,
    refetch,
  };
};
