"use client";

import { JSX, useMemo, useState } from "react";
import { useCustomizeTheme } from "@/hooks/use-customize-theme";
import { useCustomizeSettingsStore } from "@/stores/setting/use-customize-settings.store";
import { AnimatePresence, motion } from "framer-motion";
import BaseButton from "@/components/customs/buttons/BaseButton";
import Separator from "@/components/customs/Separator";
import Header from "@/components/layouts/partials/Header";
import CustomizeSettings from "@/components/customs/setting/CustomizeSettings";
import WalletImport from "@/components/customs/modals/boarding/BoardingWalletImport";
import PageHeading from "@/components/customs/headings/PageHeading";
import BrowserBar from "@/components/customs/custom-svg/BrowserBar";
import BlacklistedModal from "@/components/customs/modals/BlacklistedModal";
import clsx from "clsx";
import { ThemeSetting } from "@/apis/rest/settings/settings";
import CosmoDesktop from "../sections/cosmo/CosmoDesktop";

interface BoardingModalProps {
  onClose: () => void;
}

interface BoardingViewProps {
  handleClose: () => void;
  onClose: () => void;
}

type IContent = {
  title: string;
  description: string;
  component: JSX.Element;
};

type IType = "theme" | "card" | "card_content" | "wallet_import";

export default function BoardingModal({ onClose }: BoardingModalProps) {
  return (
    <AnimatePresence>
      <BoardingView onClose={onClose} handleClose={onClose} />
    </AnimatePresence>
  );
}

const BoardingView = ({
  // onClose,
  handleClose,
}: BoardingViewProps) => {
  const theme = useCustomizeTheme();
  const steps: IType[] = ["theme", "card", "card_content", "wallet_import"];
  const [currentStep, setCurrentStep] = useState(0);
  const boardingContent: Record<IType, IContent> = {
    theme: {
      title: "Select a Theme",
      description:
        "Choose a theme to personalize your dashboard. You can change it anytime.",
      component: <CustomizeSettings section="boarding_theme" autoSave />,
    },
    card: {
      title: "Select a Card Style",
      description:
        "Select how your cards look and change the design whenever you like.",
      component: <CustomizeSettings section="boarding_card" autoSave />,
    },
    card_content: {
      title: "Select a Card Style",
      description:
        "Select how your cards look and change the design whenever you like.",
      component: <CustomizeSettings section="boarding_card_content" autoSave />,
    },
    wallet_import: {
      title: "Track wallets effortlessly",
      description:
        "Drag and drop your wallet file or manually input an address to begin tracking your assets across the ecosystem.",
      component: <></>,
    },
  };

  const customizedSettingPresets = useCustomizeSettingsStore(
    (state) => state.presets,
  );
  const customizedSettingActivePreset = useCustomizeSettingsStore(
    (state) => state.activePreset,
  );

  const currentTheme = useMemo(
    () =>
      customizedSettingPresets[customizedSettingActivePreset].themeSetting ||
      "original",
    [customizedSettingPresets, customizedSettingActivePreset],
  );

  const content = useMemo(
    () => boardingContent[steps[currentStep]],
    [currentStep],
  );

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const gradientFillColorByTheme: Record<string, string> = {
    original: "#080811",
    "solid-light": "#12121a",
    "gradient-light": "#12121a",
    "solid-even-lighter": "#1f1f2b",
    "gradient-even-lighter": "#1f1f2b",
    cupsey: "#24252e",
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-black/[12%] backdrop-blur-[3px]"
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed left-1/2 top-1/2 z-[300] h-auto w-full max-w-[90%] -translate-x-1/2 -translate-y-1/2 md:max-w-[1040px] md:p-4"
      >
        <div
          className="flex h-full w-full flex-col gap-y-7 rounded-[16px] border border-solid border-[#242436] shadow-custom"
          style={theme.background2}
        >
          {/* Content Container */}
          <div className="relative h-auto w-full overflow-hidden rounded-t-[6px]">
            <div
              className={clsx(
                "flex flex-col gap-x-12 sm:flex-row",
                steps[currentStep] === "wallet_import" &&
                  "divide-gray-700/40 max-sm:divide-y-2 sm:divide-x-2",
              )}
            >
              {/* Navigation Button */}
              <div
                className={clsx(
                  "flex w-full max-w-[450px] flex-col gap-[50px] p-6",
                  currentStep === steps.length - 1 && "justify-between gap-0",
                )}
              >
                {/* Header */}
                <div
                  className={clsx(
                    "flex flex-col gap-1.5",
                    currentStep === steps.length - 1 && "max-w-full",
                  )}
                >
                  <h1
                    className={clsx(
                      "font-geistSemiBold text-[32px] leading-[42px] text-[#FCFCFD]",
                      currentStep === steps.length - 1 && "max-w-[70%]",
                    )}
                  >
                    {content.title}
                  </h1>

                  <p
                    className={clsx(
                      "w-full max-w-[300px] font-geistRegular text-[16px] leading-[20px] text-[#9191A4]",
                      steps[currentStep] === "wallet_import" && "max-w-none",
                    )}
                  >
                    {content.description}
                  </p>
                </div>

                {/* Content */}
                <div className="flex w-full flex-col gap-2">
                  <div className="w-full">{content.component}</div>

                  <div className="flex flex-row justify-between gap-2">
                    <BaseButton
                      onClick={handleClose}
                      variant="gray"
                      className={clsx(
                        "h-[40px] text-[16px] transition-colors duration-200 sm:h-[48px] sm:text-base",
                        "w-[29%]",
                        // currentStep === steps.length - 1 && "w-[49%]",
                      )}
                    >
                      <span
                        className={`inline-block font-geistSemiBold text-white`}
                      >
                        Skip
                      </span>
                    </BaseButton>

                    {/* Back Button */}
                    {currentStep > 0 ? (
                      <BaseButton
                        onClick={() => setCurrentStep(currentStep - 1)}
                        variant="gray"
                        className={clsx(
                          "h-[40px] text-[16px] transition-colors duration-200 sm:h-[48px] sm:text-base",
                          "w-[29%]",
                          // currentStep === steps.length - 1 && "w-[49%]",
                        )}
                      >
                        <span
                          className={`inline-block font-geistSemiBold text-white`}
                        >
                          Back
                        </span>
                      </BaseButton>
                    ) : null}

                    {/* Hide continue button on last step */}
                    {currentStep > 0 - 1 ? (
                      <BaseButton
                        onClick={handleNext}
                        variant="custom"
                        className={clsx(
                          "h-[40px] text-[16px] transition-colors duration-200 hover:shadow-md sm:h-[48px] sm:text-base",
                          "bg-[#DF74FF] hover:bg-[#DF74FF]/80",
                          "w-[69%]",
                          currentStep > 0 && "w-[39%]",
                        )}
                      >
                        <span className="inline-block font-geistSemiBold text-background">
                          Continue
                        </span>
                      </BaseButton>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Image Container */}
              <div className="relative w-full border-none p-4">
                {steps[currentStep] === "wallet_import" ? (
                  <WalletImport />
                ) : (
                  <>
                    <div className="absolute bottom-0">
                      <div className="h-[550px] w-[900px] overflow-hidden rounded-lg rounded-bl-none border border-white/10">
                        <div className="relative">
                          <div className="absolute z-0">
                            <Preview currentTheme={currentTheme} />
                          </div>
                        </div>
                      </div>
                    </div>

                    <svg
                      viewBox="0 0 594 329"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="absolute bottom-0 right-0 z-[999] aspect-[594/329] w-full"
                    >
                      <rect
                        width="594"
                        height="329"
                        fill="url(#paint0_linear_1_44028)"
                      />
                      <defs>
                        <linearGradient
                          id="paint0_linear_1_44028"
                          x1="347.5"
                          y1="35.5"
                          x2="415.845"
                          y2="311.73"
                          gradientUnits="userSpaceOnUse"
                        >
                          <stop
                            stopColor={gradientFillColorByTheme[currentTheme]}
                            stopOpacity="0"
                          />
                          <stop
                            offset="0.455845"
                            stopColor={gradientFillColorByTheme[currentTheme]}
                            stopOpacity="0.9"
                          />
                          <stop
                            offset="1"
                            stopColor={gradientFillColorByTheme[currentTheme]}
                          />
                        </linearGradient>
                      </defs>
                    </svg>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
};

const Preview = ({ currentTheme }: { currentTheme: ThemeSetting }) => {
  return (
    <div className="h-[1080px] w-[1920px]">
      <div className="relative h-12 w-full">
        <BrowserBar />
      </div>

      <div className="flex h-auto min-h-dvh w-full flex-col overflow-hidden p-4">
        <div className="-m-4 mb-4">
          <Header isBoarding />
        </div>

        <div className={clsx("flex w-full flex-col justify-between gap-y-2")}>
          <div className={clsx("flex items-center gap-x-2")}>
            <PageHeading
              title="The Cosmo"
              description="Real-time feed of tokens throughout their lifespan."
            />
            {currentTheme !== "cupsey" && <BlacklistedModal />}
          </div>
        </div>

        <Separator className="hidden bg-secondary" />

        <CosmoDesktop
          isLoading={false}
          trackedWalletsOfToken={{}}
          handleSendFilterMessage={() => {}}
          isBoarding
        />
      </div>
    </div>
  );
};
