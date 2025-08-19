import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import TrendingCardLoading from "@/components/customs/loadings/TrendingCardLoading";
import TrendingCardMobileLoading from "@/components/customs/loadings/TrendingCardMobileLoading";
import { CachedImage } from "../CachedImage";
import IgniteCardSkeleton from "../skeletons/IgniteCardSkeleton";
import IgniteCardMobileSkeleton from "../skeletons/IgniteCardMobileSkeleton";

const TrendingListSectionLoading = ({
  variant,
}: {
  variant: "desktop" | "mobile";
}) => {
  return variant === "desktop" ? (
    <div className="relative mb-12 hidden flex-grow grid-cols-1 xl:grid w-[70%] mx-auto">
      <div className="hidden w-full flex-grow flex-col overflow-hidden rounded-[8px] lg:flex">
        <div className="relative w-full flex-grow overflow-hidden">
          <div className="absolute left-0 top-0 flex w-full flex-grow flex-col">
            <div className="flex h-10 min-w-max items-center gap-2">
              <p className="font-geistSemiBold text-fontColorPrimary">Ignite</p>
              <div className="relative aspect-square h-4 w-4 flex-shrink-0 mr-auto">
                <CachedImage
                  src="/icons/info-tooltip.png"
                  alt="Info Tooltip Icon"
                  fill
                  quality={50}
                  className="object-contain"
                />
              </div>
              <Skeleton className="size-[24px]" />
              <Skeleton className="size-[24px]" />
              <Skeleton className="h-[24px] w-[100px]" />
            </div>

            <div className="flex h-auto w-full flex-col">
              {Array.from({ length: 10 }).map((_, index) => (
                <IgniteCardSkeleton key={index} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  ) : (
    <div className="relative mb-3.5 flex w-full flex-grow grid-cols-1 xl:hidden">
      <div className="flex w-full flex-grow flex-col pr-1 lg:hidden lg:pl-0">
        <div className="relative w-full flex-grow overflow-hidden">
          <div className="absolute left-0 top-0 flex w-full flex-grow flex-col pb-10">
            <div className="flex h-auto w-full flex-col gap-y-1">
              {Array.from({ length: 10 }).map((_, index) => (
                <IgniteCardMobileSkeleton index={index} key={index} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrendingListSectionLoading;
