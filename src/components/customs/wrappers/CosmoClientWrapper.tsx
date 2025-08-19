"use client";

import dynamic from "next/dynamic";
import CosmoPageLoading from "@/components/customs/loadings/CosmoPageLoading";
const CosmoClient = dynamic(
  () => import("@/components/customs/CosmoClient").then((mod) => mod.default),
  {
    ssr: false,
    loading: () => <CosmoPageLoading />,
  },
);
const OnboardingModal = dynamic(
  () =>
    import("@/components/customs/modals/OnboardingModal").then(
      (mod) => mod.default,
    ),
  {
    ssr: false,
  },
);

export default function CosmoClientWrapper({
  initialIsNewUser,
}: {
  initialIsNewUser: boolean;
}) {
  return (
    <>
      <CosmoClient initialIsNewUser={initialIsNewUser} />
      <OnboardingModal />
    </>
  );
}
