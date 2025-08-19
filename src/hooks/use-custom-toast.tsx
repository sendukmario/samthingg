import { useCustomizeSettingsStore } from "@/stores/setting/use-customize-settings.store";
import { useCallback } from "react";
import toast from "react-hot-toast";
import CustomToast from "@/components/customs/toasts/CustomToast";
import { TradingAlertToast } from "@/components/customs/toasts/TradingAlertToast";

type ToastOptions = {
  state?: "SUCCESS" | "LOADING" | "ERROR" | "WARNING";
  message?: string;
  link?: string;
  customMessage?: React.ReactNode;
  className?: string;
  duration?: number;
  position?:
    | "top-left"
    | "top-center"
    | "top-right"
    | "bottom-left"
    | "bottom-center"
    | "bottom-right";
};

export const useCustomToast = () => {
  const { presets, activePreset } = useCustomizeSettingsStore();

  const showToast = useCallback(
    (options: ToastOptions) => {
      const currentPreset = presets[activePreset || "preset1"];

      // Get the time interval from settings (convert seconds to milliseconds)
      const timeInterval = currentPreset.alertTimeInterval || 2.5;
      const duration = options.duration ?? timeInterval * 1000;

      return toast.custom(
        (t) => (
          <CustomToast
            tVisibleState={t.visible}
            state={options.state}
            message={options.message}
            link={options.link}
            customMessage={options.customMessage}
            className={options.className}
          />
        ),
        {
          duration,
          // removeDelay: duration,
          position: options.position || "top-center",
        },
      );
    },
    [presets, activePreset],
  );

  // Trading alert specific method
  const showTradingAlert = useCallback(
    (
      walletAdditionalInfo: { emoji?: string; name?: string } | undefined,
      messageData: {
        type: "buy" | "sell";
        baseAmount: number;
        image?: string;
        symbol?: string;
        mint: string;
      },
      formatAmountWithoutLeadingZero: (amount: number) => string,
      getProxyUrl: (image: string, fallback: string) => string,
      options?: Omit<ToastOptions, "customMessage" | "state">,
    ) => {
      return showToast({
        ...options,
        state: "SUCCESS",
        link: `/token/${messageData.mint}`,
        customMessage: (
          <TradingAlertToast
            walletAdditionalInfo={walletAdditionalInfo}
            messageData={messageData}
            formatAmountWithoutLeadingZero={formatAmountWithoutLeadingZero}
            getProxyUrl={getProxyUrl}
          />
        ),
      });
    },
    [showToast],
  );

  const success = useCallback(
    (message: string, options?: Omit<ToastOptions, "state" | "message">) => {
      return showToast({ ...options, state: "SUCCESS", message });
    },
    [showToast],
  );

  const error = useCallback(
    (message: string, options?: Omit<ToastOptions, "state" | "message">) => {
      return showToast({ ...options, state: "ERROR", message });
    },
    [showToast],
  );

  const warning = useCallback(
    (message: string, options?: Omit<ToastOptions, "state" | "message">) => {
      return showToast({ ...options, state: "WARNING", message });
    },
    [showToast],
  );

  const loading = useCallback(
    (message: string, options?: Omit<ToastOptions, "state" | "message">) => {
      return showToast({ ...options, state: "LOADING", message });
    },
    [showToast],
  );

  return {
    showToast,
    showTradingAlert,
    success,
    error,
    warning,
    loading,

    dismiss: toast.dismiss,
    remove: toast.remove,
  };
};
