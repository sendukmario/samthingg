import axios from "@/libraries/axios";
import { AxiosError } from "axios";
import { getBaseURLBasedOnRegion } from "../../utils/getBaseURLBasedOnRegion";

export interface AuthResponse {
  success: boolean;
  message: string;
  isTelegramConnected?: boolean;
  token?: string;
  isNew?: boolean;
  publicKey?: string;
  privateKey?: string;
  requires2FA?: boolean;
  //* ## [TURNKEY🔐] - Add any additional fields related to Turnkey authentication here ## 
  turnkeyOrgId: string;
  turnkeyUserId: string;
  turnkeyWallets: {
    addresses: string[];
    walletId: string;
  }
}

export interface CheckBalanceResponse {
  [key: string]: number;
}

export interface AuthenticateParams {
  signature: string;
  nonce: string;
  signer: string;
  code?: string;
  telegramUserId?: number;
  telegramUsername?: string;
  telegramToken?: string;
}

export interface AuthenticateSignatureRequest {
  signature: string;
  signer: string;
  code?: string;
  two_factor_code?: string;
}

export interface VerifySignatureRequest {
  signature: string;
  nonce: string;
  signer: string;
}

export interface ConnectTelegramRequest {
  telegramUserId: number;
  telegramUsername: string;
  telegramToken: string;
}

export interface VerifySignatureResponse {
  orgId: string
  userId: string 
}

// #################### API🔥 ####################
export const generateNonce = async (): Promise<string> => {
  const API_BASE_URL = getBaseURLBasedOnRegion("/generate-nonce");

  try {
    const { data } = await axios.post<AuthResponse>(API_BASE_URL);
    return data.message;
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new Error(
        error.response?.data?.message || "Failed to generate nonce",
      );
    }
    throw new Error("Failed to generate nonce");
  }
};

export const verifySignature = async (
  params: VerifySignatureRequest,
): Promise<VerifySignatureResponse> => {
  const API_BASE_URL = getBaseURLBasedOnRegion("/verify-signature");

  try {
    const { data } = await axios.post<VerifySignatureResponse>(API_BASE_URL, params);
    return data
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new Error(
        error.response?.data?.message || "Failed to generate nonce",
      );
    }
    throw new Error("Failed to generate nonce");
  }
};

export const validateAccessCode = async (
  code: string,
): Promise<{
  success: boolean;
  message: string;
}> => {
  const API_BASE_URL = getBaseURLBasedOnRegion("/validate-access-code");

  try {
    const response = await axios.post<AuthResponse>(API_BASE_URL, {
      code,
    });

    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      if (error.response?.status === 400) {
        return {
          success: false,
          message: error.response.data.message || "Invalid Access Code",
        };
      }
    }
    throw new Error("Network error. Please try again.");
  }
};

export const authenticate = async (
  params: AuthenticateSignatureRequest,
): Promise<AuthResponse> => {
  const API_BASE_URL = getBaseURLBasedOnRegion("/authenticate");

  try {
    const { data } = await axios.post<AuthResponse>(API_BASE_URL, params);
    return {
      ...data,
    };
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new Error(error.response?.data?.message || "Authentication failed");
    }
    throw new Error("Authentication failed");
  }
};

export const revealKey = async (): Promise<AuthResponse> => {
  const API_BASE_URL = getBaseURLBasedOnRegion("/reveal-key");

  try {
    const { data } = await axios.post<AuthResponse>(API_BASE_URL, null);
    return data;
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new Error(error.response?.data?.message || "Failed to reveal key");
    }
    throw new Error("Failed to reveal key");
  }
};

export const checkBalance = async (
  walletAddress: string,
): Promise<CheckBalanceResponse> => {
  const API_BASE_URL = getBaseURLBasedOnRegion(
    `/check-balance?address=${walletAddress}`,
  );

  try {
    const { data } = await axios.get(API_BASE_URL);
    return data;
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new Error(
        error.response?.data?.message || "Failed to check balance",
      );
    }
    throw new Error("Failed to check balance");
  }
};

export const decodeTelegramData = (
  encodedData: string,
): {
  id: number;
  username: string;
  token: string;
} | null => {
  try {
    const decoded = JSON.parse(atob(encodedData));
    return {
      id: decoded.id,
      username: decoded.username,
      token: encodedData,
    };
  } catch (error) {
    console.warn("Failed to decode Telegram data:", error);
    return null;
  }
};

export const connectTelegram = async (
  params: ConnectTelegramRequest,
): Promise<AuthResponse> => {
  const API_BASE_URL = getBaseURLBasedOnRegion("/connect-telegram");

  try {
    const { data } = await axios.post<AuthResponse>(API_BASE_URL, params);
    return data;
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new Error(
        error.response?.data?.message || "Failed to connect Telegram",
      );
    }
    throw new Error("Failed to connect Telegram");
  }
};
