import axios, { AxiosError } from "axios";
import cookies from "js-cookie";
import { getBaseURLBasedOnRegion } from "@/utils/getBaseURLBasedOnRegion";

const BASE_URL = "https://nova-earn-b4aee3dd5c76.herokuapp.com";
// "https://nova-earn-b4aee3dd5c76.herokuapp.com/api-v1/nova-earn/volume"

export type EarnReferralHistoryItem = {
  date: string; // "MAY 09 (00:00 - 23:59 UTC)"
  dateHover: string; // "09/05/2025"
  earnings: string; // "+0.01 SOL ($2.05)"
  id: string;
  referrals: string; // "+4"
  status: "processing" | "claimed";
  url: string; // https://solscan.io/tx/xxxx
};

export type EarnReferralHistoryResponse = {
  data: {
    history: Array<EarnReferralHistoryItem>;
    paid_referrals: string; // "0.00 SOL"
    paid_referrals_usd: number;
    pending_referrals: string; // "0.00 SOL"
    pending_referrals_usd: number;
    referral_earnings: string; // "0.00 SOL ($0.00)"
    referral_users: number;
    referral_earnings_sol: string; // "0.00";
    referral_earnings_usd: string; //"0.00";
    referral_volume: string; // "0.00 SOL";
    referral_volume_usd: string; // 0.0;
  };
  success: boolean;
};

export type EarnRefferalVolumeProgressItem = {
  currentVol: number;
  level:
    | "Nova"
    | "Pulsar"
    | "Eclipse"
    | "Supernova"
    | "Nebula"
    | "Oblivian"
    | string;
  rewardMultiplier: number;
  status: "complete" | "locked" | "ongoing";
  net_fee: number;
  targetVol: number;
};

export type EarnRefferalVolumeResponse = {
  data: {
    points: number;
    volume: number;
    progress: Array<EarnRefferalVolumeProgressItem>;
  };
  success: boolean;
};

export type EarnClaimHistoryItem = {
  date: string; // "MAY 08 (00:00 - 23:59 UTC)"
  dateHover: string; // "08/05/2025"
  vol: number;
  multiplier: number;
  earnings_sol: number;
  earnings_usd: string; // "429.74"
};

export type EarnReferralClaimHistoryResponse = {
  data: {
    claimHistory: Array<EarnClaimHistoryItem>;
  };
  success: boolean;
};

export type EarnCashbackItem = {
  volume: number;
  earnings: number;
  multiplier: number;
  date: string;
};

export type EarnCashbackResponse = {
  availableBalance: number;
  cashbackHistory: EarnCashbackItem[];
};

export async function getEarnReferralLink(userId: number) {
  try {
    const { data } = await axios.get<{ link: string; success: boolean }>(
      `${BASE_URL}/api-v1/nova-earn/ref/link`,
      {
        headers: {
          // "X-Auth-Token": "1950371953",
          "X-Auth-Token": userId,
        },
      },
    );

    return data.link;
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new Error(
        error.response?.data?.message || "Failed to get referral link",
      );
    }

    throw new Error("Failed to get referral link");
  }
}

export async function updateEarnReferralLink({
  code,
  userId,
}: {
  code: string;
  userId: number;
}) {
  try {
    const { data } = await axios.post<{
      code: string;
      link: string;
      success: boolean;
    }>(
      `${BASE_URL}/api-v1/nova-earn/ref/change-link`,
      { code },
      {
        headers: {
          // "X-Auth-Token": "1950371953",
          "X-Auth-Token": userId,
        },
      },
    );

    return data.link;
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new Error(
        error.response?.data?.message || "Failed to update referral link",
      );
    }

    throw new Error("Failed to update referral link");
  }
}

export async function getTotalEarnedBalance(userId: number) {
  try {
    const { data } = await axios.get<{
      balance: number;
      success: boolean;
    }>(`${BASE_URL}/api-v1/nova-earn/balance`, {
      headers: {
        "X-Auth-Token": "5888125049",
        // "X-Auth-Token": userId,
      },
    });

    return data.balance;
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new Error(
        error.response?.data?.message || "Failed to get total earned balance",
      );
    }

    throw new Error("Failed to get total earned balance");
  }
}

export async function claimEarnedBalance(userId: number) {
  try {
    const { data } = await axios.post<{
      message: string;
      success: boolean;
    }>(
      `${BASE_URL}/api-v1/nova-earn/balance/claim`,
      {},
      {
        headers: {
          // "X-Auth-Token": "1950371953",
          "X-Auth-Token": userId,
        },
      },
    );
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new Error(
        error.response?.data?.message || "Failed to claim total earned balance",
      );
    }

    throw new Error("Failed to claim total earned balance");
  }
}

export async function getEarnRefferalHistory(userId: number) {
  try {
    const { data } = await axios.get<EarnReferralHistoryResponse>(
      `${BASE_URL}/api-v1/nova-earn/ref/history`,
      {
        headers: {
          "X-Auth-Token": "5888125049",
          // "X-Auth-Token": userId,
        },
      },
    );

    return {
      ...data.data,
      history: data.data.history || []
    }
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new Error(
        error.response?.data?.message || "Failed to get earn referral history",
      );
    }

    throw new Error("Failed to get earn referral history");
  }
}

export async function getEarnRefferalVolumeProgress(userId: number) {
  try {
    const { data } = await axios.get<EarnRefferalVolumeResponse>(
      `${BASE_URL}/api-v1/nova-earn/volume`,
      {
        headers: {
          // "X-Auth-Token": userId,
          "X-Auth-Token": "5888125049",
        },
      },
    );

    return data.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new Error(
        error.response?.data?.message || "Failed to get earn referral history",
      );
    }

    throw new Error("Failed to get earn referral history");
  }
}

export async function getEarnCashbacks() {
  try {
    const { data } = await axios.get<string>( // Expect a string, not EarnCashbackResponse
      `${getBaseURLBasedOnRegion("/earn")}`,
      {
        headers: {
          "X-Nova-Session": cookies.get("_nova_session") || "",
        },
      },
    );

    const parsed: EarnCashbackResponse = JSON.parse(data); // Manually parse the JSON string

    return parsed.cashbackHistory || [];
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new Error(
        error.response?.data?.message || "Failed to get earn cashback",
      );
    }

    throw new Error("Failed to get earn cashback");
  }
}

export async function getEarnClaimHistory(userId: number) {
  try {
    const { data } = await axios.get<EarnReferralClaimHistoryResponse>(
      `${BASE_URL}/api-v1/nova-earn/claim-history`,
      {
        headers: {
          //  "X-Auth-Token": userId,
          "X-Auth-Token": "5888125049",
        },
      },
    );

    return data.data.claimHistory || [];
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new Error(
        error.response?.data?.message || "Failed to get earn claim history",
      );
    }

    throw new Error("Failed to get earn claim history");
  }
}
