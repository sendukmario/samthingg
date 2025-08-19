// ######## Components 🧩 ########
import WithdrawModal from "@/components/customs/modals/WithdrawModal";
import ImportWalletPopoverModal from "@/components/customs/modals/ImportWalletPopoverModal";
import GenerateWalletPopoverModal from "@/components/customs/modals/GenerateWalletPopoverModal";
import DepositWallet from "./DepositWallet";
import MassImportWallet from "./MassImportWallet";
import { usePopupStore } from "@/stores/use-popup-state.store";
import { cn } from "@/libraries/utils";

export default function WalletManager() {
  const { remainingScreenWidth } = usePopupStore();
  const isMobile = remainingScreenWidth < 900;
  return (
    <div
      className={cn(
        "flex items-center gap-2 max-sm:flex-wrap max-sm:justify-end lg:gap-x-3",
        isMobile && "xl:flex-wrap",
      )}
    >
      {/* <DepositPopoverModal /> */}

      <div id="mass-import-wallet">
        <div className="hidden xl:block">
          <MassImportWallet />
        </div>

        <div className="xl:hidden">
          <MassImportWallet isMobile />
        </div>
      </div>

      <div id="deposit-wallet">
        <div className="hidden xl:block">
          <DepositWallet />
        </div>

        <div className="xl:hidden">
          <DepositWallet isMobile />
        </div>
      </div>

      <div id="withdraw-wallet">
        <WithdrawModal />
      </div>

      <div id="import-wallet">
        <ImportWalletPopoverModal />
      </div>

      <div id="generate-new-wallet">
        <GenerateWalletPopoverModal />
      </div>
    </div>
  );
}
