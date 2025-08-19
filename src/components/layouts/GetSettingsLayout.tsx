"use client";

// ######## Libraries 📦 & Hooks 🪝 ########
import React, { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useBuySniperSettingsStore } from "@/stores/setting/use-buy-sniper-settings.store";
import { useCopyTradeSettingsStore } from "@/stores/setting/use-copy-trade-settings.store";
import { useLimitOrderSettingsStore } from "@/stores/setting/use-limit-order-settings.store";
import { useQuickBuySettingsStore } from "@/stores/setting/use-quick-buy-settings.store";
import { useQuickSellSettingsStore } from "@/stores/setting/use-quick-sell-settings.store";
import { useSellSniperSettingsStore } from "@/stores/setting/use-sell-sniper-settings.store";
import { useQuery } from "@tanstack/react-query";
// ######## APIs 🛜 ########
import { getSettings } from "@/apis/rest/settings/settings";
import { getWallets, Wallet } from "@/apis/rest/wallet-manager";
import { useUserWalletStore } from "@/stores/wallet/use-user-wallet.store";
import { useQuickAmountStore } from "@/stores/dex-setting/use-quick-amount.store";
import { useWalletTrackerStore } from "@/stores/footer/use-wallet-tracker.store";
import { useRouter } from "nextjs-toploader/app";
import cookies from "js-cookie";
import { useWindowSize } from "@/hooks/use-window-size";
import { getMe } from "@/apis/rest/earn-new";
import { useTelegramSettingsStore } from "@/stores/setting/use-telegram-settings.store";
import { stat } from "fs";
import useTurnkeyWallets from "@/hooks/turnkey/use-turnkey-wallets";
import useLut from "@/hooks/use-lut";

const GetSettingsLayout = ({ children }: { children?: React.ReactNode }) => {
  const pathname = usePathname();

  // Settings
  const setQuickBuyPresets = useQuickBuySettingsStore(
    (state) => state.setPresets,
  );
  const setQuickSellPresets = useQuickSellSettingsStore(
    (state) => state.setPresets,
  );
  const setBuySniperPresets = useBuySniperSettingsStore(
    (state) => state.setPresets,
  );
  const setSellSniperPresets = useSellSniperSettingsStore(
    (state) => state.setPresets,
  );
  const setCopyTradePresets = useCopyTradeSettingsStore(
    (state) => state.setPresets,
  );
  const setLimitOrderPresets = useLimitOrderSettingsStore(
    (state) => state.setPresets,
  );

  const setCosmoQuickBuyAmount =
    useQuickAmountStore((state) => state.setCosmoQuickBuyAmount);

  const novaUserId = useTelegramSettingsStore((state) => state.novaUserId);
  const telegramUserId = useTelegramSettingsStore(
    (state) => state.telegramUserId,
  );
  const setNovaUserId = useTelegramSettingsStore(
    (state) => state.setNovaUserId,
  );
  const setTelegramUserId = useTelegramSettingsStore(
    (state) => state.setTelegramUserId,
  );

  useWindowSize();
  useTurnkeyWallets(true)
  useLut()

  // Get novaUserId and telegramUserId for Earn
  useQuery({
    queryKey: ["nova-earn-me"],
    queryFn: async () => {
      const res = await getMe();
      if (!novaUserId) setNovaUserId(res.userId);
      if (!telegramUserId) setTelegramUserId(res.telegramUserId);

      return res;
    },
  });

  // Get settings
  useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const res = await getSettings();
      if (!res) return res || {};

      setQuickBuyPresets(res?.quickBuySettings);
      setQuickSellPresets(res?.quickSellSettings);
      setBuySniperPresets(res?.buySniperSettings);
      setSellSniperPresets(res?.sellSniperSettings);
      setCopyTradePresets(res?.copyTradeSettings);
      setLimitOrderPresets(res?.limitOrderSettings);

      setCosmoQuickBuyAmount(
        res?.quickBuySettings?.cosmoQuickBuyAmount || 0.0001,
      );

      // console.log("QBA ✨", {
      //   cosmo: res?.quickBuySettings?.cosmoQuickBuyAmount,
      //   trending: res?.quickBuySettings?.trendingQuickBuyAmount,
      //   twitter: res?.quickBuySettings?.twitterQuickBuyAmount,
      //   footer: res?.quickBuySettings?.footerQuickBuyAmount,
      // });

      return res;
    },
    enabled: pathname !== "/login",
  });

  const isNew = cookies.get("isNew") === "true";
  const router = useRouter();

  useEffect(() => {
    if (isNew) {
      router.push("/login");
    }
  }, []);

  useEffect(() => {
    // Initialize audio context with user interaction
    const handleInteraction = () => {
      // Create and resume AudioContext
      const audioCtx = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      if (audioCtx.state === "suspended") {
        audioCtx.resume();
      }

      // Remove listeners after first interaction
      window.removeEventListener("click", handleInteraction);
      window.removeEventListener("touchstart", handleInteraction);
      window.removeEventListener("keydown", handleInteraction);
    };

    window.addEventListener("click", handleInteraction);
    window.addEventListener("touchstart", handleInteraction);
    window.addEventListener("keydown", handleInteraction);

    return () => {
      window.removeEventListener("click", handleInteraction);
      window.removeEventListener("touchstart", handleInteraction);
      window.removeEventListener("keydown", handleInteraction);
    };
  }, []);

  return <>{children}</>;
};

export default GetSettingsLayout;
