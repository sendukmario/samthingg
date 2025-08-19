import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import {
  IgniteToken,
  IgniteTokensQueryParams,
  getIgniteTokens,
} from "@/apis/rest/igniteTokens";

interface UseIgniteTokensProps {
  /**
   * Filtering & pagination parameters forwarded to the API.
   * Undefined values will be automatically stripped to keep the query string clean.
   */
  params?: IgniteTokensQueryParams;
  /**
   * Refetch interval in milliseconds. Defaults to 30s.
   */
  refetchInterval?: number;
}

/**
 * Hook that wraps the Ignite Tokens API integration and caching logic.
 * It automatically memoises request params to avoid unnecessary re-renders and
 * strips undefined values to minimise query string length.
 */
export const useIgniteTokens = (
  { params }: UseIgniteTokensProps = {
    params: {},
  },
) => {
  // Remove undefined properties so they are not sent as query params.
  const sanitizedParams = useMemo(() => {
    if (!params) return undefined;
    const cleaned: Record<string, unknown> = {};
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        cleaned[key] = value;
      }
    });
    return cleaned as IgniteTokensQueryParams | undefined;
  }, [params]);

  const queryKey = useMemo(
    () => ["ignite-tokens", sanitizedParams],
    [sanitizedParams],
  );

  const queryFn = useCallback(async () => {
    return getIgniteTokens(sanitizedParams ?? {});
  }, [sanitizedParams]);

  const {
    data = [],
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery<IgniteToken[], Error>({
    queryKey,
    queryFn,
    // refetchInterval,
    placeholderData: [],
    staleTime: 15_000, // 15s stale to balance freshness & caching
  });

  const loading = isLoading || isFetching;

  // const finalTokens = isError ? DUMMY_TOKENS as IgniteToken[] : data;

  return {
    tokens: data,
    isLoading: loading && !isError,
    isError,
    error,
    refetch,
  };
};
