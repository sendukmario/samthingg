import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { mergeDeepLeft } from "ramda";
import cookies from "js-cookie";

export type Resolution = "1S" | "5S" | "15S" | "30S" | "1" | "5" | "15" | "30" | "60" | "240" | "1440";
export type ApiResolution = "1s" | "5s" | "15s" | "30s" | "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d";

const PRICE_MAP: Record<Resolution, ApiResolution> = {
  "1S": "1s",
  "5S": "5s",
  "15S": "15s",
  "30S": "30s",
  "1": "1m",
  "5": "5m",
  "15": "15m",
  "30": "30m",
  "60": "1h",
  "240": "4h",
  "1440": "1d",
};

interface TradingViewPreferences {
  resolution: Resolution;
  setResolution: (resolution: Resolution) => void;
  getApiResolution: () => ApiResolution;
}

const isValidResolution = (value: string | undefined): value is Resolution => {
  return value !== undefined && Object.keys(PRICE_MAP).includes(value);
};

const getInitialResolution = (): Resolution => {
  const cookieValue = cookies.get("_chart_interval_resolution");
  return isValidResolution(cookieValue) ? cookieValue : "1S";
};

// TODO: Add currency to tradingview preferences store
// const getInitialCurrency = (): CurrencyChart => {
//   const cookieValue = cookies.get("_chart_currency");
//   return (cookieValue as CurrencyChart) ?? "USD";
// };

interface TradingViewPreferences {
  resolution: Resolution;
  setResolution: (resolution: Resolution) => void;
  getApiResolution: () => ApiResolution;
  // TODO: Add currency to tradingview preferences store
  // currency: CurrencyChart;
  // setCurrency: (currency: CurrencyChart) => void;
}

export const useTradingViewPreferencesStore = create<TradingViewPreferences>()(
  persist(
    (set, get) => ({
      resolution: getInitialResolution(),
      setResolution: (resolution) => {
        cookies.set("_chart_interval_resolution", resolution);
        return set({ resolution })
      },
      getApiResolution: () => {
        const resolution = get().resolution || cookies.get("_chart_interval_resolution");
        return PRICE_MAP[resolution] ?? "1s"
      },
      // TODO: Add currency to tradingview preferences store
      // currency: getInitialCurrency(),
      // setCurrency: (currency) => {
      //   cookies.set("_chart_currency", currency);
      //   return set({ currency })
      // },
    }),
    {
      name: "tradingview-preferences-store",
      storage: createJSONStorage(() => localStorage),
      merge: (persistedState, currentState) =>
        mergeDeepLeft(persistedState as TradingViewPreferences, currentState),
    },
  ),
);
