import { useUserInfoStore } from "@/stores/user/use-user-info.store";
import { useEffect, useRef } from "react";
import cookies from "js-cookie";
import { usePnlSettings } from "@/stores/use-pnl-settings.store";
import { useTurnkeyWalletsStore } from "@/stores/turnkey/use-turnkey-wallets.store";
import { useQuickAmountStore } from "@/stores/dex-setting/use-quick-amount.store";

const useAuth = () => {
  const resetAllTutorialStates = useUserInfoStore(
    (state) => state.resetAllTutorialStates,
  );
  const setIsInitialized = usePnlSettings((s) => s.setIsInitialized);
  const cleanupTurnkey = useTurnkeyWalletsStore((state) => state.cleanUp);
  const cleanupWallet = useQuickAmountStore((state) => state.cleanUp);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  const logOut = () => {
    timeoutRef.current = setTimeout(resetAllTutorialStates, 1000);
    cookies.remove("_nova_session");
    cookies.remove("_twitter_api_key");
    cookies.remove("_truthsocial_api_key");
    cookies.remove("isNew");
    cookies.remove("cosmo-hidden-tokens");
    cookies.remove("cosmo-blacklisted-developers");
    cookies.remove("_init_earning");
    localStorage.removeItem("loginStep");
    localStorage.removeItem("authToken");
    localStorage.removeItem("quick-buy-amount");
    localStorage.removeItem("quick-buy-settings");
    localStorage.removeItem("wallet-addresses-filter-storage");
    localStorage.removeItem("cosmo-hidden-tokens");
    localStorage.removeItem("cosmo-blacklisted-developers");
    localStorage.removeItem("selected_wallet_pnl_tracker");
    localStorage.removeItem("telegram-settings");

    // remove all phantom session & key
    localStorage.removeItem("phantom_public_key");
    localStorage.removeItem("phantom_session");
    localStorage.removeItem("phantom_shared_secret");

    cleanupTurnkey();
    cleanupWallet();

    // set is initialized to false for reset the pnl tracker when logged out
    setIsInitialized(false);

    // Dispatch custom event to notify WebSocket provider of auth change
    window.dispatchEvent(new CustomEvent("nova-auth-changed"));

    window.location.replace("/login");
  };

  const session = cookies.get("_nova_session");

  return {
    logOut,
    session,
  };
};

export default useAuth;
