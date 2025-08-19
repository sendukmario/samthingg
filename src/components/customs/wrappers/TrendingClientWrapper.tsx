"use client";

import dynamic from "next/dynamic";
import TrendingPageLoading from "@/components/customs/loadings/TrendingPageLoading";
const TrendingClient = dynamic(
  () =>
    import("@/components/customs/TrendingClient").then((mod) => mod.default),
  {
    ssr: false,
    loading: () => <TrendingPageLoading />,
  },
);

export default function TrendingClientWrapper({
  initTrendingTime,
  moreFilterCookie,
  dexesFilterCookie,
}: {
  initTrendingTime: "1m" | "5m" | "30m" | "1h";
  moreFilterCookie: string;
  dexesFilterCookie: string;
}) {
  return (
    <TrendingClient
      initTrendingTime={initTrendingTime}
      moreFilterCookie={moreFilterCookie}
      dexesFilterCookie={dexesFilterCookie}
    />
  );
}
