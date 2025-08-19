"use client";

import NoScrollLayout from "@/components/layouts/NoScrollLayout";
import PageHeading from "@/components/customs/headings/PageHeading";
import TwitterMonitorSection from "@/components/customs/sections/TwitterMonitorSection";
import EmptyLayout from "../layouts/EmptyLayout";
import { cn } from "@/libraries/utils";
import Image from "next/image";
import DexBuySettings from "./DexBuySettings";
import { useCustomizeTheme } from "@/hooks/use-customize-theme";
import { usePopupStore } from "@/stores/use-popup-state.store";

const IS_COMING_SOON = false;

const TwitterMonitorClient = () => {
  const theme = useCustomizeTheme();
  const remainingScreenWidth = usePopupStore(
    (state) => state.remainingScreenWidth,
  );

  return (
    <>
      {IS_COMING_SOON ? (
        <EmptyLayout>
          <div className="flex w-full flex-grow flex-col items-center justify-center bg-background">
            <div
              className={cn(
                "flex w-full max-w-[400px] flex-col items-center gap-y-8",
              )}
            >
              <div className="relative aspect-[160/160] h-auto w-full max-w-[160px] flex-shrink-0">
                <Image
                  src="/images/page-states/no_result.svg"
                  alt="No Result Image"
                  fill
                  quality={100}
                  className="object-contain"
                />
              </div>
              <div className="flex flex-col items-center justify-center gap-y-2 text-center">
                <h2 className="font-geistSemiBold text-[24px] text-fontColorPrimary">
                  Coming Soon!
                </h2>
                <p className={cn("text-sm text-[#737384]")}>
                  We will be launching this feature soon. Stay tuned!
                </p>
              </div>
            </div>
          </div>
        </EmptyLayout>
      ) : (
        <NoScrollLayout>
          <div
            className={cn(
              "mx-auto flex w-full max-w-[1300px] flex-col flex-wrap items-start justify-between px-4 pb-1 pt-4 min-[830px]:flex-row min-[830px]:items-center lg:px-0 lg:pb-6 lg:pt-6",
              // remainingScreenWidth < 1000 &&
              //   "min-[830px]:flex-col min-[830px]:items-start",
            )}
          >
            {/* <div className="absolute top-0 bg-card text-red-500"> */}
            {/*   <span>{remainingScreenWidth}</span> */}
            {/* </div> */}
            <PageHeading
              title="Monitor"
              description=""
              line={1}
              showDescriptionOnMobile
            />
            <DexBuySettings variant="Twitter Monitor" />
          </div>
          <div
            className={cn(
              "mx-auto flex w-full max-w-[1300px] flex-grow flex-col items-center justify-center",
            )}
            // style={theme.background}
          >
            <TwitterMonitorSection />
          </div>
        </NoScrollLayout>
      )}
    </>
  );
};

export default TwitterMonitorClient;
