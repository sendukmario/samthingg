"use client";

import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/libraries/utils";

interface IgniteCardProps {
  index?: number;
}

const IgniteCardSkeleton: React.FC<IgniteCardProps> = ({ index }) => {

  return (
    <div
      className={cn(
        "mb-1 text-fontColorPrimary",
        index === 0 && "mt-1.5",
      )}
    >
      <div
        className="group relative flex h-[102px] w-full cursor-pointer items-center gap-4 overflow-hidden rounded-[9px] border-4 border-r-0 border-[#161621]/[0.5] px-3 py-2"
      >
        <div className="pointer-events-none absolute bottom-0 left-0 flex h-full w-full flex-col">
          <div className="relative h-full w-full bg-gradient-to-t from-white/[5%]">
            <Image
              src="/stripe.svg"
              alt="Decorative Stripe"
              className="pointer-events-none absolute right-[13px] top-0 z-[5] h-full w-auto object-cover opacity-[5%]"
              width={250}
              height={62}
            />
          </div>
          <div className="relative h-[39px] w-full flex-shrink-0 bg-secondary">
            <div className="absolute right-0 top-0 z-[10] -mx-3 h-0.5 w-full bg-gradient-to-r from-transparent to-white/[5%] animate-pulse" />
          </div>
        </div>

        {/* Avatar */}
        <div className="z-[5] flex flex-col items-center justify-center">
          <Skeleton className="size-[56px] flex-shrink-0 rounded-full" />
        </div>

        {/* Content */}
        <div className="z-[5] flex w-full flex-col gap-y-4">
          {/* Upper Section */}
          <div className="flex w-full items-center justify-between">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-[300px]" />

              <div className="flex items-center gap-1 text-xs">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-4 w-[80px]" />
                  <Skeleton className="h-4 w-[80px]" />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-8">
              <div className="flex flex-col items-center justify-center gap-1">
                <Skeleton className="h-4 w-[70px]" />

                <Skeleton className="h-4 w-[120px]" />
              </div>

              <Skeleton className="h-8 w-[120px] rounded-full" />
            </div>
          </div>

          {/* Lower Section */}
          <div className="flex items-center gap-4 text-sm">
            <Skeleton className="h-[24px] w-[350px]" />
            <Skeleton className="h-[24px] w-[350px]" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default IgniteCardSkeleton
