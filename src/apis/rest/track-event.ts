import axios from "@/libraries/axios";
import { getBaseURLBasedOnRegion } from "@/utils/getBaseURLBasedOnRegion";
import { AxiosError } from "axios";
import cookies from "js-cookie";

export interface TrackEventResponse {
  success: boolean;
  message?: string;
}

export interface StaticTrackEventBody {
  userId: string;
  ts: number;
}

export interface DynamicTrackEventBody {
  mint?: string;
  source:
    | "trending"
    | "search"
    | "paste"
    | "cosmo"
    | "holdings"
    | "monitor"
    | "wallet_tracker"
    | "external";
}

export interface CombinedTypeTrackEventBody
  extends StaticTrackEventBody,
    DynamicTrackEventBody {}

// NOTES 📝
// | Source           | Description                      | Coefficient |
// |------------------|----------------------------------|-------------|
// | trending         | Clicked from trending list       | 0.2         | ✅ ✨
// | search           | Found via search                 | 1.0         | ✅ ✨
// | paste            | User pasted token manually       | 1.0         | ✅ ✨
// | cosmo            | Clicked via Cosmo recommender    | 0.8         | ✅ ✨
// | holdings         | Came from holdings screen        | 0.0         | ✅ ✨
// | monitor          | Via monitoring alert             | 1.0         | ✅ ✨ (Only Discord)
// | wallet_tracker   | Tracked from wallet activity     | 1.0         | ✅ ✨
// | external         | External source (e.g. deeplink)  | 1.0         | ✅ ✨

// Not when the fetch is success but when he clicks on the token, we don’t care if he just searches it but don’t click or buy the token
// Paste is when the user clicks the token from copy paste button (next to search bar)
// holdings: record when the user clicks a token from holdings
// monitor: record when the user clicks a token from twitter monitor etc
// wallet tracker: monitors when a user clicks a token coming from wallet tracker

const API_BASE_URL = getBaseURLBasedOnRegion("/track-event");
export async function submitUserEvent(
  dynamicData: DynamicTrackEventBody,
): Promise<TrackEventResponse> {
  try {
    const payload: CombinedTypeTrackEventBody = {
      userId: cookies.get("_nova_session")!,
      ts: Date.now(),
      mint: dynamicData?.mint || "",
      source: dynamicData?.source || "external",
    };

    const response = await axios.post<TrackEventResponse>(
      API_BASE_URL,
      payload,
    );
    return {
      success: response.data.success,
      message: response.data.message,
    };
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new Error(
        error.response?.data?.message || "Failed to submit user event",
      );
    }
    throw new Error("Failed to submit user event");
  }
}
