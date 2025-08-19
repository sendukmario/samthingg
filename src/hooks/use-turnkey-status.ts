import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import axios from "@/libraries/axios";
import { getBaseURLBasedOnRegion } from "@/utils/getBaseURLBasedOnRegion";
import { useCustomToast } from "./use-custom-toast";
import useAuth from "./use-auth";

interface TurnkeyStatusResponse {
  status: "completed" | "incomplete" | "processing";
}

const useTurnkeyStatus = () => {
  const { loading, success } = useCustomToast();
  const { logOut } = useAuth();
  const hasShownIncompleteToast = useRef(false);
  const hasShownCompletedToast = useRef(false);

  // Fetch Turnkey status
  const fetchTurnkeyStatus = async (): Promise<TurnkeyStatusResponse> => {
    const API_BASE_URL = getBaseURLBasedOnRegion("/user/turnkey-status");
    const { data } = await axios.get<TurnkeyStatusResponse>(API_BASE_URL);
    return data;
  };

  const {
    data: turnkeyStatus,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["turnkey-status"],
    queryFn: fetchTurnkeyStatus,
    refetchInterval: (query) => {
      // Only poll if status is incomplete or processing
      const status = query.state.data?.status;
      if (status === "incomplete" || status === "processing") {
        return 2000; // Poll every 2 seconds
      }
      return false; // Stop polling if completed
    },
    retry: (failureCount, error: any) => {
      // Don't retry if it's a 4xx error (axios error)
      if (error?.response?.status >= 400 && error?.response?.status < 500) {
        return false;
      }
      return failureCount < 3;
    },
  });

  // Handle status changes and show toasts
  useEffect(() => {
    if (!turnkeyStatus) return;

    const status = turnkeyStatus.status;

    // Show "enabling Turnkey" toast only once when status is incomplete
    if (status === "incomplete" && !hasShownIncompleteToast.current) {
      loading("Enabling Turnkey...", { duration: 3000 });
      hasShownIncompleteToast.current = true;
    }

    // Show "Turnkey enabled" toast and logout when status becomes completed
    if (status === "completed" && !hasShownCompletedToast.current) {
      hasShownCompletedToast.current = true;
      
      // Show success toast
      success("Turnkey enabled", { duration: 3000 });
      
      // Log the user out after a short delay to allow the toast to be seen
      setTimeout(() => {
        logOut();
      }, 1500);
    }
  }, [turnkeyStatus, loading, success, logOut]);

  return {
    status: turnkeyStatus?.status,
    isLoading,
    error,
    refetch,
  };
};

export default useTurnkeyStatus;
