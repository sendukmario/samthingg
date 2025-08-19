"use client";

// ######## Components 🧩 ########
import { Skeleton } from "@/components/ui/skeleton";
import { useCustomizeTheme } from "@/hooks/use-customize-theme";
import { CardDecorationSVG } from "../ScalableVectorGraphics";
import { cn } from "@/libraries/utils";

const CosmoCardLoading = function CosmoCardLoading() {
  const theme = useCustomizeTheme();

  return (
    <div
      className="w-full flex-shrink-0 overflow-hidden border border-transparent duration-300 hover:border-border"
      style={{ contain: "content", ...theme.background2 }}
    >
      {/* Header */}
      <div className="relative flex h-7 w-full items-center justify-between overflow-hidden bg-secondary">
        <div className="relative z-20 flex items-center gap-x-2 px-3">
          <Skeleton className="h-4 w-[100px]" />
        </div>

        {/* Card Decoration*/}
        {/* <Image
          src="/images/decorations/card-decoration.svg"
          alt="Loading Card Decoration"
          height={130}
          width={130}
          className="mix-blend-overlay"
          style={{ isolation: "isolate" }}
        /> */}

        <CardDecorationSVG className={cn("w-[130px] opacity-15")} />
      </div>

      {/* Content */}
      <div className="relative flex w-full flex-col items-start gap-y-3 bg-gradient-to-b from-white/[2%] px-3 py-2">
        <div className="flex w-full items-center gap-x-3">
          <Skeleton className="h-12 w-12 flex-shrink-0 rounded-full" />

          <div className="flex w-full items-center gap-x-4">
            <div className="flex w-full flex-col gap-y-2">
              <Skeleton className="h-4 w-full max-w-[264px]" />
              <Skeleton className="h-4 w-full max-w-[132px]" />
            </div>

            {/* CTAs */}
            <Skeleton className="flex h-[28px] w-full max-w-[80px]" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CosmoCardLoading;
