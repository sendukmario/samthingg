import { getBaseURLBasedOnRegion } from "@/utils/getBaseURLBasedOnRegion";
import axios, { AxiosError } from "axios";
import cookies from "js-cookie";

const BASE_URL = "https://nova-v2-referrals-4cd516f9fe21.herokuapp.com";

type TelegramData = {
  userId: string;
  telegramUsername: string;
  telegramUserId: number;
};

type ReferralTierData = {
  tier1Users: number;
  tier1Volume: number;
  tier2Users: number;
  tier2Volume: number;
  tier3Users: number;
  tier3Volume: number;
};

type ReferralSystem = {
  level: number;
  multiplier: number;
  cashBackPercentage: number;
  tier1ReferralPercentage: number;
  tier2ReferralPercentage: number;
  tier3ReferralPercentage: number;
};

export type ReferralHistory = {
  date: string;
  baseAmount: number;
  referrals: number;
};

export type CashbackHistory = {
  date: string;
  volume: number;
  cashback: number;
  multiplier: number;
};

export type ClaimHistory = {
  date: string; // "MAY 08 (00:00 - 23:59 UTC)"
  dateHover: string; // "08/05/2025"
  vol: number;
  multiplier: number;
  earnings_sol: number;
  earnings_usd: string; // "429.74"
};

export type ReferralUserData = {
  novaUserId: string;
  telegramUserId: string;
  referralCode: string;
  myVolume: number;
  v1Earnings: number;
  isPartner: boolean;
  referrals: {
    v1: ReferralTierData;
    v2: ReferralTierData;
  };
  system: ReferralSystem;
  referralHistory: ReferralHistory[]; // Replace `any` with a proper type if structure is known
  claimHistory: ClaimHistory[];
  cashbackHistory: CashbackHistory[];
  createdAt: number; // Epoch time (Unix timestamp)
  updatedAt: number;
  lastRefresh: number;
  pendingEarnings: number;
  syncing: boolean;
  totalEarnings: number;
  accessUrl: string;
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

// export type EarnRefferalVolumeResponse = {
//   data: {
//     points: number;
//     volume: number;
//     progress: Array<EarnRefferalVolumeProgressItem>;
//   };
//   success: boolean;
// };
//
export type Level = {
  level:
  | "Earth"
  | "Moon"
  | "Orbit"
  | "Sun"
  | "Supernova"
  | "Galaxy"
  | "Vortex";
  targetVolume: number;
  multiplier: number;
  cashback: number;
  status?: "pending" | "completed" | "locked";
  isLast?: boolean;
}

type EarnRefferalVolumeResponse = {
  levels: Level[];
  volume: number;
};

type BaseParams = {
  userId: string;
  telegramUserId: number;
};

export async function activateEarnRewards({
  userId,
  telegramUserId,
}: BaseParams) {
  try {
    const encoded = btoa(`${userId}:${telegramUserId}`);
    const { data } = await axios.post<ReferralUserData>(
      `${BASE_URL}/api/activate`,
      {},
      {
        headers: {
          Authorization: encoded,
          // Authorization: "MWQzYzgwZDUtYjIzYS00NDA4LWI2MGItMjZhYmRmMzA1NDdlOjc4Nzc2Mjc4MTY=",
        },
      },
    );

    return {
      ...data,
      referralHistory: data.referralHistory || [],
      claimHistory: data.claimHistory || [],
      cashbackHistory: data.cashbackHistory || [],
    }
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new Error(
        error.response?.data?.message || "Failed to get referral link",
      );
    }

    throw new Error("Failed to get referral link");
  }
}

export async function changeReferralCode({
  userId,
  telegramUserId,
  code,
}: BaseParams & { code: string }) {
  try {
    const encoded = btoa(`${userId}:${telegramUserId}`);
    const { data } = await axios.post<ReferralUserData>(
      `${BASE_URL}/api/change-referral`,
      { code },
      {
        headers: {
          Authorization: encoded,
          // Authorization: "MWQzYzgwZDUtYjIzYS00NDA4LWI2MGItMjZhYmRmMzA1NDdlOjc4Nzc2Mjc4MTY=",
        },
      },
    );

    return {
      ...data,
      referralHistory: data.referralHistory || [],
      claimHistory: data.claimHistory || [],
      cashbackHistory: data.cashbackHistory || [],
    }
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new Error(
        error.response?.data?.message || "Cannot change access code for now.",
      );
    }

    throw new Error("Cannot change access code for now.");
  }
}

export async function refreshEarnRewards({
  userId,
  telegramUserId,
}: BaseParams) {
  try {
    const encoded = btoa(`${userId}:${telegramUserId}`);
    const { data } = await axios.post<ReferralUserData>(
      `${BASE_URL}/api/refresh`,
      {
        headers: {
          Authorization: encoded,
          // Authorization: "MWQzYzgwZDUtYjIzYS00NDA4LWI2MGItMjZhYmRmMzA1NDdlOjc4Nzc2Mjc4MTY=",
        },
      },
    );

    return {
      ...data,
      referralHistory: data.referralHistory || [],
      claimHistory: data.claimHistory || [],
      cashbackHistory: data.cashbackHistory || [],
    }
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new Error(
        error.response?.data?.message || "Failed to refresh referral data",
      );
    }

    throw new Error("Failed to refresh referral data");
  }
}

export async function getUserEarningData({
  userId,
  telegramUserId,
}: BaseParams) {
  try {
    const encoded = btoa(`${userId}:${telegramUserId}`);
    const { data } = await axios.get<ReferralUserData>(
      `${BASE_URL}/api/get-user`,
      {
        headers: {
          Authorization: encoded,
          // Authorization: "MWQzYzgwZDUtYjIzYS00NDA4LWI2MGItMjZhYmRmMzA1NDdlOjc4Nzc2Mjc4MTY=",
        },
      },
    );

    return {
      ...data,
      referralHistory: data.referralHistory || [],
      claimHistory: data.claimHistory || [],
      cashbackHistory: data.cashbackHistory || [],
    }
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new Error(
        error.response?.data?.message || "Failed to get user earning data",
      );
    }

    throw new Error("Failed to get user earning data");
  }
}

export async function getMe(): Promise<TelegramData> {
  try {
    const { data } = await axios.get(`${getBaseURLBasedOnRegion("/me")}`, {
      headers: {
        "X-Nova-Session": cookies.get("_nova_session") || "",
      },
    });

    const telegramData: TelegramData = JSON.parse(data);

    return telegramData;
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new Error(error.response?.data?.message || "Failed to get me");
    }

    throw new Error("Failed to get me");
  }
}

export async function getEarnRefferalVolumeProgress({
  userId,
  telegramUserId,
}: BaseParams) {
  try {
    const encoded = btoa(`${userId}:${telegramUserId}`);
    const { data } = await axios.get<EarnRefferalVolumeResponse>(
      `${BASE_URL}/api/status`,
      {
        headers: {
          Authorization: encoded,
          // Authorization: "MWQzYzgwZDUtYjIzYS00NDA4LWI2MGItMjZhYmRmMzA1NDdlOjc4Nzc2Mjc4MTY=",
        },
      },
    );

    return data;
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new Error(
        error.response?.data?.message || "Failed to get earn referral history",
      );
    }

    throw new Error("Failed to get earn referral history");
  }
}
