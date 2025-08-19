"use client";

// ######## Libraries 📦 & Hooks 🪝 ########
import { useState, useEffect } from "react";
import { useUserWalletStore } from "@/stores/wallet/use-user-wallet.store";
import { getWallets, Wallet } from "@/apis/rest/wallet-manager";
import { useQuery } from "@tanstack/react-query";
// ######## Components 🧩 ########
import WalletManagerTable from "@/components/customs/tables/WalletManagerTable";
import WalletManagerListMobile from "@/components/customs/lists/mobile/WalletManagerListMobile";
import { useWindowSizeStore } from "@/stores/use-window-size.store";
import { usePopupStore } from "@/stores/use-popup-state.store";
import { useCustomizeSettingsStore } from "@/stores/setting/use-customize-settings.store";

type TabLabel = "My Wallets" | "Archived Wallets";

export default function WalletManagerListSection({
  initialData,
}: {
  initialData: Wallet[] | null;
}) {
  const [activeTab, setActiveTab] = useState<TabLabel>("My Wallets");

  const balance = useUserWalletStore((state) => state.balance);
  const setActiveWallet = useUserWalletStore((state) => state.setActiveWallet);
  const setWalletFullList = useUserWalletStore(
    (state) => state.setWalletFullList,
  );
  const width = useWindowSizeStore((state) => state.width);
  const { remainingScreenWidth } = usePopupStore();
  const isMobile = remainingScreenWidth < 900 || (width && width <= 1280);

  // Setup query for refetching
  const { data: wallets, isLoading } = useQuery({
    queryKey: ["wallets"],
    queryFn: async () => {
      const res = await getWallets();
      setWalletFullList(res);
      return res;
    },
    initialData,
    refetchOnMount: false,
  });

  const finalData = wallets || initialData;
  const finalWalletsWithBalance = (finalData || [])?.map((wallet) => ({
    ...wallet,
    balance: String(balance[wallet.address] || "0"),
  })) as Wallet[];

  // Set Active / Selected Wallet
  useEffect(() => {
    if (finalData) {
      const selectedWallet = (finalData || [])?.find(
        (wallet) => wallet.selected === true,
      );

      if (selectedWallet) {
        setActiveWallet(selectedWallet);
      }
    }
  }, [finalData]);

  return (
    <>
      {/* Desktop */}
      {!isMobile ? (
        <div className="relative mb-12 w-full flex-grow grid-cols-1 xl:grid">
          <WalletManagerTable
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            data={finalWalletsWithBalance}
            isLoading={isLoading}
          />
        </div>
      ) : (
        <div className="relative mb-[58px] flex w-full flex-grow grid-cols-1">
          <WalletManagerListMobile
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            data={finalWalletsWithBalance}
            isLoading={isLoading}
          />
        </div>
      )}
    </>
  );
}
