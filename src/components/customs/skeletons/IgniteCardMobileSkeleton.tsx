import React from "react";
import { IgniteToken } from "@/apis/rest/igniteTokens";
import Image from "next/image";
import Link from "next/link";
import { DEX } from "@/types/ws-general";
import { Skeleton } from "@/components/ui/skeleton";

interface IgniteCardMobileProps {
  index: number;
}

const IgniteCardMobileSkeleton: React.FC<IgniteCardMobileProps> = ({
  index,
}) => {
  return (
    <div
      key={index}
      className="relative mx-4 mb-3 flex flex-col overflow-hidden rounded-[9px] border-4 border-r-0 border-[#161621]/[20%] py-2"
    >
      <div className="pointer-events-none absolute bottom-0 left-0 flex h-full w-full flex-col">
        <div className="relative h-[66px] flex-shrink-0 w-full bg-gradient-to-t from-white/[5%]">
          <Image
            src="/stripe.svg"
            alt="Decorative Stripe"
            className="pointer-events-none absolute right-[-100px] top-0 z-[5] h-full w-auto object-cover opacity-[10%]"
            width={250}
            height={62}
          />
        </div>
        <div className="relative h-full w-full bg-secondary">
          <div className="absolute right-0 top-0 z-[10] -mx-3 h-0.5 w-full bg-gradient-to-r from-transparent to-[#fff]/[8%]" />
        </div>
      </div>

      <div className="relative flex items-center gap-2 pb-3 z-[15] px-3">
        <div className="z-[5] flex flex-col items-center justify-center">
          <Skeleton className="size-[40px] flex-shrink-0 rounded-full" />
        </div>

        <div className="flex w-full flex-col gap-2 mb-2">
          <div className="flex items-center gap-1">
            <Skeleton className="h-4 w-[100px]" />

            <div className="ml-auto flex items-center gap-1">
              <Skeleton className="size-4" />
              <Skeleton className="size-4" />
              <Skeleton className="size-4" />
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Skeleton className="h-4 w-[80px]" />
            <Skeleton className="h-4 w-[60px]" />
            <Skeleton className="h-4 w-[60px]" />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between py-2 z-[15] px-3">
        <div className="flex flex-col gap-1">
          <div className="flex flex-col items-center justify-center gap-1">
            <Skeleton className="h-4 w-[70px]" />
          </div>

          <Skeleton className="h-4 w-[120px]" />
        </div>

        <Skeleton className="h-8 w-[120px] rounded-full" />
      </div>

      <div className="my-1 flex w-full flex-col gap-1 z-[15] px-1">
        <Skeleton className="h-[24px] w-[350px]" />
        <Skeleton className="h-[24px] w-[350px]" />
      </div>
    </div >
  );
};

export default IgniteCardMobileSkeleton
