import { generateMetadata } from "@/utils/generateMetadata";
import { cookies } from "next/headers";
import TrendingClientWrapper from "@/components/customs/wrappers/TrendingClientWrapper";

export const metadata = generateMetadata({
  title: "Ignite",
});

export default async function TrendingPage() {
  const cookieStore = await cookies();
  const trendingTimeCookie = cookieStore.get("trending-time-filter")?.value;
  const initTrendingTimeOption =
    (trendingTimeCookie as "1m" | "5m" | "30m" | "1h") || "1m";

  const moreFilterCookie = cookieStore.get("trending-more-filter")
    ?.value as string;

  const dexesFilterCookie = cookieStore.get("trending-dexes-filter")
    ?.value as string;

  return (
    <TrendingClientWrapper
      initTrendingTime={initTrendingTimeOption}
      moreFilterCookie={moreFilterCookie}
      dexesFilterCookie={dexesFilterCookie}
    />
  );
}

// import EmptyState from "@/components/customs/EmptyState";
// import NoScrollLayout from "@/components/layouts/NoScrollLayout";

// export default async function TrendingPage() {
//   return (
//     <NoScrollLayout>
//       <div className="flex w-full flex-grow flex-col items-center justify-center">
//         <EmptyState state="404" />
//       </div>
//     </NoScrollLayout>
//   );
// }
