"use client";
import { fetchChartsWithRetry } from "@/apis/rest/charts";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCustomToast } from "./use-custom-toast";
import { TokenDataMessageType } from "@/types/ws-general";

export function useCharts({
  mintAddress,
  enabled = true,
}: {
  mintAddress: string;
  enabled?: boolean;
}) {
  const router = useRouter();
  const { error: toastError } = useCustomToast();

  return useQuery({
    queryKey: ["chart", mintAddress],
    queryFn: async () => {
      // console.time("⌛ FETCHING CHART");
      try {
        const { data } = await fetchChartsWithRetry(mintAddress);
        // console.timeEnd("⌛ FETCHING CHART");
        if (!(data as TokenDataMessageType).token) throw new Error("This token is not tradeable on Nova yet.");

        return data;
      } catch (error: any) {
        if (
          error?.response?.status === 404 &&
            error?.response?.data?.message === "This token is not tradeable on Nova yet."
        ) {
          toastError(error?.response?.data?.message || "This token is not tradeable on Nova yet.");
        }
        toastError(error?.response?.data?.message || "This token is not tradeable on Nova yet.");
        // console.log("ERROR FETCHING CHART 🚫:", error)
        router.push("/");
        throw error;
      }
    },
    staleTime: 15_000,
    gcTime: 15_000,
    enabled: enabled,
  });
}
