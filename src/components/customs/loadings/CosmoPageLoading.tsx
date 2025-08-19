import Image from "next/image";
import NoScrollLayout from "@/components/layouts/NoScrollLayout";
import Separator from "@/components/customs/Separator";
import CosmoListSectionLoading from "@/components/customs/loadings/CosmoListSectionLoading";
import { Skeleton } from "@/components/ui/skeleton";

const CosmoPageLoading = () => {
  const tabList: any[] = [
    {
      label: "Newly Created",
    },
    {
      label: "About to Graduate",
    },
    {
      label: "Graduated",
    },
  ];

  return (
    <NoScrollLayout>
      <div className="flex w-full flex-col flex-wrap justify-between gap-y-2 px-4 pb-4 pt-4 lg:px-0 xl:flex-row xl:items-center xl:gap-y-4">
        <div className="flex items-center gap-x-2">
          {/* <PageHeading
            title="The Cosmo"
            description="Real-time feed of tokens throughout their lifespan."
            line={1}
          /> */}
          <Skeleton className="relative block aspect-square size-5 flex-shrink-0" />
        </div>

        <div className="flex flex-grow flex-wrap items-center justify-start gap-2 xl:justify-end">
          <Skeleton className="h-8 w-full max-w-[140px]">
            <div className="w-full"></div>
          </Skeleton>
          <Skeleton className="h-8 w-full max-w-[150px] xl:max-w-[300px]">
            <div className="w-full"></div>
          </Skeleton>
          <Skeleton className="h-8 min-w-[300px]">
            <div className="w-full"></div>
          </Skeleton>
        </div>
      </div>

      <Separator className="hidden bg-border xl:block" />

      <>
        <div className="relative mb-0 hidden h-full w-full flex-grow grid-cols-3 gap-x-5 bg-background xl:grid">
          <CosmoListSectionLoading column={1} variant="desktop" />
          <CosmoListSectionLoading column={2} variant="desktop" />
          <CosmoListSectionLoading column={3} variant="desktop" />
        </div>

        <div className="relative mb-14 flex w-full flex-grow grid-cols-1 xl:mb-3.5 xl:hidden">
          <div className="col-span-1 flex w-full flex-grow flex-col">
            <div className="flex w-full items-center justify-between border-b border-border pr-4">
              <div className="flex h-[48px] w-full max-w-[384px] items-center">
                {tabList.map((tab) => {
                  return (
                    <div
                      key={tab.label}
                      className="relative flex h-[48px] w-full items-center justify-center px-1 py-[14px]"
                    >
                      <span className="line-clamp-1 text-sm text-fontColorSecondary">
                        {tab.label}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="pl-2">
                <div className="flex h-[32px] w-[32px] flex-shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-border lg:hidden">
                  <div className="relative aspect-square h-4 w-4 flex-shrink-0">
                    <Image
                      src="/icons/filter.png"
                      alt="Filter Icon"
                      fill
                      quality={100}
                      className="object-contain"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full px-4 pt-4">
              <div className="relative h-8 w-full">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-full items-center justify-start rounded-md border border-border pl-4">
                    <span className="animate-pulse text-fontColorSecondary">
                      Search tokens...
                    </span>
                  </div>
                  <Skeleton className="size-8" />
                </div>
              </div>
            </div>

            <CosmoListSectionLoading column={1} variant="mobile" />
          </div>
        </div>
      </>
    </NoScrollLayout>
  );
};

export default CosmoPageLoading;
