import dynamic from "next/dynamic";
import { generateMetadata } from "@/utils/generateMetadata";
import WalletTrackerClient from "@/components/customs/WalletTrackerClient";

export const metadata = generateMetadata({
  title: "Wallet Tracker",
});

export default function WalletTrackerPage() {
  return <WalletTrackerClient />;
}
