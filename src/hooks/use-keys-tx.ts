import axios from '@/libraries/axios';
import { NovaSwapKeys } from 'ts-keys/types';
import { useState } from 'react';
import { useTokenMessageStore } from '@/stores/token/use-token-messages.store';

export interface KeysTxResult {
  base_mint: string;
  decimals: number;
  dex: string;
  is_2022: boolean;
  is_usdc: boolean;
  mint: string;
  swap_keys: NovaSwapKeys;
  is_wrapped_sol: boolean;
  remaining_accounts: string[] | null;
}

interface UseKeysTxReturn {
  data: KeysTxResult | null;
  loading: boolean;
  error: string | null;
  refetch: (mint: string) => Promise<KeysTxResult | undefined>;
  fetchKeys: (mint: string) => Promise<KeysTxResult | undefined>;
}

const useKeysTx = (): UseKeysTxReturn => {
  const [data, setData] = useState<KeysTxResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchKeys = async (mint: string) => {
    if (!mint) return;

    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(process.env.NEXT_PUBLIC_REST_MAIN_URL! + `/swap/keys?mint=${mint}`);

      if (response.status !== 200) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setData(response.data);
      return response.data as KeysTxResult;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const refetch = (mint: string) => {
    return fetchKeys(mint);
  };

  return {
    data,
    loading,
    error,
    fetchKeys,
    refetch
  };
};

export const useGlobalKeysTx = () => {
  const setSwapKeys = useTokenMessageStore((s) => s.setSwapKeys)

  const fetchKeys = async (mint: string) => {
    if (!mint) return;

    try {
      const response = await axios.get(process.env.NEXT_PUBLIC_REST_MAIN_URL! + `/swap/keys?mint=${mint}`);

      if (response.status !== 200) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setSwapKeys(response.data);
      return response.data as KeysTxResult;
    } catch (err) {
      console.error('Error fetching initial keys🔑:', err);
    }
  };

  const refetch = (mint: string) => {
    return fetchKeys(mint);
  };

  return {
    fetchKeys,
    refetch
  }
};



export default useKeysTx;
