import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { useUserWalletStore } from "@/stores/wallet/use-user-wallet.store";
import React from "react";

interface MultiWalletInputState {
  amounts: Record<string, string | number | undefined>;
  setAmount: (walletAddress: string, amount: string | number | undefined) => void;
  hydrated: boolean;
  isMultiWalletOpen: boolean;
  setIsMultiWalletOpen: (isOpen: boolean) => void;
}

const getStorageKey = () => {
  const userWallets = useUserWalletStore.getState().userWalletFullList;
  const activeUserAddress = userWallets.find(w => !w.archived)?.address;
  return `multi-wallet-input-${activeUserAddress || 'default'}`;
};

const storage = {
  getItem: (name: string): string | null => {
    return localStorage.getItem(getStorageKey()) || null;
  },
  setItem: (name: string, value: string): void => {
    const storageKey = getStorageKey();
    localStorage.setItem(storageKey, value);
    window.dispatchEvent(new StorageEvent('storage', { key: storageKey, newValue: value }));
  },
  removeItem: (name: string): void => {
    localStorage.removeItem(getStorageKey());
  },
};

const useMultiWalletInputStore = create<MultiWalletInputState>()(
  persist(
    (set) => ({
      amounts: {},
      setAmount: (walletAddress, amount) =>
        set((state) => ({
          amounts: {
            ...state.amounts,
            [walletAddress]: amount,
          },
        })),
      hydrated: false,
      isMultiWalletOpen: false,
      setIsMultiWalletOpen: (isOpen) => set(() => ({ isMultiWalletOpen: isOpen })),
    }),
    {
      name: "multi-wallet-input",
      storage: createJSONStorage(() => storage),
      onRehydrateStorage: (state) => {
        if (state) {
          state.hydrated = true;
        }
      },
    },
  ),
);

// Cross-tab synchronization
if (typeof window !== "undefined") {
    window.addEventListener('storage', (event) => {
        const storageKey = getStorageKey();

        if (event.key === storageKey) {
            useMultiWalletInputStore.persist.rehydrate();
        }
  });
}

// Custom hook to wait for hydration
const useHydratedMultiWalletStore = () => {
    const store = useMultiWalletInputStore();
    const [hydrated, setHydrated] = React.useState(useMultiWalletInputStore.persist.hasHydrated());

    React.useEffect(() => {
        const unsubHydrate = useMultiWalletInputStore.persist.onHydrate(() => setHydrated(false));
        const unsubFinishHydration = useMultiWalletInputStore.persist.onFinishHydration(() => setHydrated(true));

        setHydrated(useMultiWalletInputStore.persist.hasHydrated());

        return () => {
            unsubHydrate();
            unsubFinishHydration();
        };
    }, []);
    
    return store;
}

export { useMultiWalletInputStore, useHydratedMultiWalletStore }; 