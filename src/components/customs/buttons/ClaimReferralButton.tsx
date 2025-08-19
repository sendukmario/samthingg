"use client";

import { useMutation } from "@tanstack/react-query";
import { claimReferral } from "@/apis/rest/referral";
import { useReferralStore } from "@/stores/use-referral.store";
import { toast } from "sonner";
import { useCustomToast } from "@/hooks/use-custom-toast";

interface ClaimReferralButtonProps {
  referralId: string;
}

export default function ClaimReferralButton({
  referralId,
}: ClaimReferralButtonProps) {
  const { setClaimedTransaction } = useReferralStore();
  const claimedTransactions = useReferralStore(
    (state) => state.claimedTransactions,
  );
  const { success, error: errorToast } = useCustomToast();

  const { mutate, isPending } = useMutation({
    mutationFn: claimReferral,
    onSuccess: (data, variables) => {
      setClaimedTransaction(variables, data.transaction_url);
      success("Successfully claimed referral reward");
    },
    onError: (error) => {
      errorToast("Failed to claim referral reward");
      console.warn("Claim referral error:", error);
    },
  });

  const handleClaim = () => {
    mutate(referralId);
  };

  // If already claimed, show transaction URL
  if (claimedTransactions[referralId]) {
    return (
      <a
        href={claimedTransactions[referralId]}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:underline"
      >
        View Transaction
      </a>
    );
  }

  return (
    <button
      onClick={handleClaim}
      disabled={isPending}
      className="btn btn-primary"
    >
      {isPending ? "Claiming..." : "Claim Reward"}
    </button>
  );
}
