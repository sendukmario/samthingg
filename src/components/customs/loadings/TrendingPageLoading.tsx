import React from "react";
import NoScrollLayout from "@/components/layouts/NoScrollLayout";
import { Skeleton } from "@/components/ui/skeleton";
import PageHeading from "@/components/customs/headings/PageHeading";
import TrendingListSectionLoading from "@/components/customs/loadings/TrendingListSectionLoading";

const TrendingPageLoading = () => {
  return (
    <NoScrollLayout>
      <div className="flex w-full flex-col flex-wrap justify-between gap-4 gap-y-2 px-4 pb-3 pt-4 lg:px-0 xl:flex-row xl:items-center xl:pb-1.5 xl:pt-3">
        {/* Part 1 */}
        <div className="flex flex-col items-start gap-x-2 gap-y-1 xl:flex-row xl:items-center">
          <PageHeading
            title="Ignite"
            description="Real-time feed of tokens throughout their lifespan."
            line={1}
            showDescriptionOnMobile
          />
          <div className="flex gap-1">
            <Skeleton className="aspect-square size-8 flex-shrink-0 rounded-[6px] hidden lg:flex" />
          </div>
        </div>

        {/* Part 2 */}
        <div className="lg:hidden flex flex-col w-full gap-2">
          <Skeleton className="h-8 w-full rounded-[8px]" />
          <Skeleton className="h-8 w-full rounded-[8px]" />
        </div>
        <div className="lg:flex flex-wrap items-center gap-x-2 gap-y-2 min-[1340px]:gap-x-2 justify-end hidden">
          <div className="flex w-full flex-shrink-0 items-center justify-start gap-2 xl:w-fit xl:flex-nowrap xl:justify-end">
            <Skeleton className="aspect-square size-8 flex-shrink-0 rounded-[6px]" />
            <Skeleton className="aspect-square size-8 flex-shrink-0 rounded-[6px]" />
            <Skeleton className="aspect-square h-8 w-20 flex-shrink-0 rounded-[6px]" />
          </div>
          <div className="flex w-full flex-nowrap items-center gap-x-2 gap-y-2 xl:w-fit xl:flex-shrink-0 xl:flex-nowrap">
            <Skeleton className="h-8 w-[242px] rounded-[8px] hidden lg:flex" />
            <Skeleton className="h-8 w-[295px] rounded-[8px] hidden lg:flex" />
            <Skeleton className="h-8 w-[150px] rounded-[8px] hidden lg:flex" />
          </div>
        </div>
      </div>

      <TrendingListSectionLoading variant="desktop" />
      <TrendingListSectionLoading variant="mobile" />
    </NoScrollLayout>
  );
};

export default TrendingPageLoading;
