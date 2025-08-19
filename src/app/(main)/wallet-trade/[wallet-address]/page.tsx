import WalletTradeClient from "@/components/customs/wallet-trade/WalletTradeDetailCLient";
import { generateMetadata } from "@/utils/generateMetadata";

export const metadata = generateMetadata({
  title: "Wallet History",
  description: "History of nova wallet transactions",
});

export default function WalletTradePage() {
  return (
    <>
      <WalletTradeClient />
    </>
  );
}
