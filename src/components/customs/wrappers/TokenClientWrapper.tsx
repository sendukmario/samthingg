"use client";

import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { TokenPageFullLoading } from "../loadings/TokenPageLoading";

const TokenLayout = dynamic(
  () => import("@/components/layouts/TokenLayout").then((mod) => mod.default),
  {
    ssr: false,
    loading: () => <TokenPageFullLoading />,
  },
);

export default function TokenClientWrapper() {
  const param = useParams();
  const mintAddress = param?.["mint-address"] as string;

  return <TokenLayout key={mintAddress} mint={mintAddress} />;
}
