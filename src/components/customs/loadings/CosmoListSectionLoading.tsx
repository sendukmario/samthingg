"use client";

// ######## Components 🧩 ########
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import CosmoCardLoading from "@/components/customs/loadings/CosmoCardLoading";
import { CachedImage } from "@/components/customs/CachedImage";
import { Skeleton } from "@/components/ui/skeleton";

export default function CosmoListSectionLoading({
  column,
  variant,
}: {
  column: 1 | 2 | 3;
  variant: "desktop" | "mobile";
}) {
  const columnDataMap = {
    1: {
      title: "Newly Created",
      tooltipText: "Newly Created Tokens",
    },
    2: {
      title: "About to Graduate",
      tooltipText: "Tokens which are about to bond",
    },
    3: {
      title: "Graduated",
      tooltipText: "Tokens which have bonded",
    },
  };

  return (
    <>
      {variant === "desktop" && (
        <div className="relative col-span-1 flex h-full w-full flex-grow flex-col">
          <div className="flex w-full items-center justify-between py-4">
            <div className="flex items-center gap-x-2">
              <div className="flex flex-shrink-0 items-center gap-x-1.5">
                <h3 className="font-geistSemiBold text-base text-fontColorPrimary">
                  {columnDataMap[column].title}
                </h3>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="relative aspect-square h-4 w-4 flex-shrink-0">
                        <CachedImage
                          src="/icons/info-tooltip.png"
                          alt="Info Tooltip Icon"
                          fill
                          quality={50}
                          className="object-contain"
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{columnDataMap[column].tooltipText}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Skeleton className="size-8 rounded-lg" />
              <Skeleton className="size-8 rounded-lg" />
              <Skeleton className="size-8 rounded-lg" />
              <Skeleton className="h-8 w-28 rounded-lg" />
            </div>
          </div>

          <div
            className="relative w-full flex-grow overflow-hidden"
            suppressHydrationWarning
          >
            <div className="absolute left-0 top-0 w-full flex-grow pr-4">
              <div className="flex h-auto w-full flex-col">
                {Array.from({ length: 10 })?.map((_, index) => (
                  <CosmoCardLoading key={index} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {variant === "mobile" && (
        <div className="flex h-full w-full flex-grow flex-col pl-4 pr-4 pt-4 lg:pl-0">
          <div
            className="relative w-full flex-grow overflow-hidden"
            suppressHydrationWarning
          >
            <div className="absolute left-0 top-0 w-full flex-grow">
              <div className="flex h-auto w-full flex-col">
                {Array.from({ length: 10 })?.map((_, index) => (
                  <CosmoCardLoading key={index} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
