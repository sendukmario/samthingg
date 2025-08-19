"use client";

import { useState, useEffect, forwardRef, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import BaseButton from "@/components/customs/buttons/BaseButton";
import { IoFlash, IoFlashOutline, IoClose } from "react-icons/io5";
import { newFeatures } from "@/constants/new-features";
import { cn } from "@/libraries/utils";
import { useCustomizeTheme } from "@/hooks/use-customize-theme";

interface NewFeatureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NewFeaturesViewProps {
  handleClose: () => void;
  handlePrev: () => void;
  handleNext: () => void;
  handleStep: (index: number) => void;
  onClose: () => void;
  currentStep: number;
  totalSteps: number;
}

interface NavigationButtonProps {
  label: string;
  isActive?: boolean;
  onTap: () => void;
}

export default function NewFeatureModal({
  isOpen,
  onClose,
}: NewFeatureModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const totalSteps = newFeatures.length;

  // Navigate to next step
  const handlePrev = () => {
    if (currentStep !== 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  // Navigate to index
  const handleStep = (index: number) => {
    if (currentStep !== index) {
      setCurrentStep(index);
    }
  };

  // Effect to check if modal should be shown
  useEffect(() => {
    if (isOpen) {
      // You can add any initialization logic here
      document.body.style.overflow = "hidden"; // Prevent scrolling when modal is open
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <NewFeaturesView
          handleClose={onClose}
          handlePrev={handlePrev}
          handleNext={handleNext}
          handleStep={handleStep}
          onClose={onClose}
          currentStep={currentStep}
          totalSteps={totalSteps}
        />
      )}
    </AnimatePresence>
  );
}

const NewFeaturesView = ({
  handleClose,
  handlePrev,
  handleNext,
  handleStep,
  onClose,
  currentStep,
  totalSteps,
}: NewFeaturesViewProps) => {
  const theme = useCustomizeTheme();
  const currentFeature = newFeatures[currentStep];
  const refs = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    const el = refs.current[currentStep];
    if (el) {
      el.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [currentStep]);

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-black/[12%] backdrop-blur-[3px]"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed left-1/2 top-1/2 z-[300] h-auto w-full max-w-[90%] -translate-x-1/2 -translate-y-1/2 md:max-w-[900px] md:p-4"
      >
        <div
          className="flex h-full w-full flex-col gap-y-7 rounded-[8px] border-2 border-solid border-[#242436] shadow-custom"
          style={theme.background2}
        >
          {/* Content Container */}
          <div className="relative h-auto w-full overflow-hidden rounded-t-[6px]">
            <button
              className="absolute right-2 top-2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white bg-opacity-10 text-center"
              onClick={handleClose}
            >
              <IoClose className="text-center text-[26px] text-white" />
            </button>

            <div className="flex flex-col divide-gray-700/40 max-sm:divide-y-2 sm:flex-row sm:divide-x-2">
              {/* Navigation Button */}
              <div className="flex w-full flex-col pb-3 pt-7 sm:w-[350px] sm:pl-5 sm:pr-0">
                <h1 className="pl-5 pr-6 font-geistSemiBold text-2xl leading-relaxed text-white sm:pl-0">
                  Try our new features!
                </h1>

                <div className="h-auto w-auto pl-3 pr-3 sm:pl-0">
                  <div className="nova-scroller darker mt-3 flex flex-row gap-x-2 gap-y-1 overflow-auto pr-1 sm:mt-5 sm:h-[420px] sm:flex-col">
                    {[...Array(totalSteps)]?.map((_, index) => (
                      <div
                        key={index}
                        ref={(el) => {
                          if (el) refs.current[index] = el;
                        }}
                        className="h-auto"
                      >
                        <NavigationButton
                          label={newFeatures[index].title}
                          isActive={currentStep === index}
                          onTap={() => handleStep(index)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Image Container */}
              <div className="relative w-full">
                <video
                  key={currentFeature.video}
                  className="inset-0 h-[60%] w-full object-cover"
                  autoPlay
                  loop
                  muted
                  playsInline
                  style={{ display: currentFeature.video ? "block" : "none" }}
                >
                  <source src={currentFeature.video} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
                <div className="my-4 px-6">
                  <div className="w-full max-w-[600px]">
                    <h2 className="mb-2 font-geistSemiBold text-lg leading-tight text-fontColorPrimary md:text-[22px]">
                      {currentFeature.title}
                    </h2>

                    <p className="text-base leading-snug text-fontColorSecondary md:text-lg">
                      {currentFeature.description}
                    </p>
                  </div>
                </div>

                <div className="bottom-0 right-0 flex justify-end gap-x-2 px-5 pb-4 sm:absolute sm:gap-x-4">
                  <BaseButton
                    onClick={handlePrev}
                    variant="gray"
                    className={`h-[40px] w-[50%] text-[16px] transition-all duration-200 sm:h-[48px] sm:w-[100px] sm:text-base ${
                      currentStep !== 0
                        ? "hover:scale-105 hover:shadow-md active:scale-95"
                        : ""
                    }`}
                    disabled={currentStep === 0}
                  >
                    <span
                      className={`inline-block font-geistSemiBold text-white`}
                    >
                      Previous
                    </span>
                  </BaseButton>
                  <BaseButton
                    onClick={handleNext}
                    variant="primary"
                    className="h-[40px] w-[50%] text-[16px] transition-all duration-200 hover:scale-105 hover:shadow-md active:scale-95 sm:h-[48px] sm:w-[70px] sm:text-base"
                  >
                    <span className="inline-block font-geistSemiBold text-background">
                      {currentStep === totalSteps - 1 ? "Finish" : "Next"}
                    </span>
                  </BaseButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
};

const NavigationButton = forwardRef<HTMLButtonElement, NavigationButtonProps>(
  ({ label, isActive, onTap }, ref) => {
    return (
      <button
        ref={ref}
        onClick={onTap}
        className={cn(
          "relative flex flex-row items-center rounded-lg bg-opacity-10 text-start hover:bg-[#DF74FF] hover:bg-opacity-10",
          "py-1.5 pl-1 pr-2 sm:py-2 sm:pl-1",
          "w-fit min-w-max sm:w-full sm:min-w-full",
          "text-base sm:text-sm",
          "sm:font-geistSemiBold",
          isActive
            ? "bg-[#DF74FF] text-primary"
            : "bg-secondary text-[#9191A4] sm:bg-transparent",
        )}
      >
        <div
          className={cn(
            "h-7 w-1 flex-shrink-0 rounded bg-primary",
            isActive ? "visible" : "invisible",
          )}
        ></div>

        {isActive ? (
          <IoFlash className="mx-2 flex-shrink-0 text-xl text-primary" />
        ) : (
          <IoFlashOutline className="mx-2 flex-shrink-0 text-xl text-[#9191A4]" />
        )}

        <p className="line-clamp-2 leading-[1.2] sm:line-clamp-none">{label}</p>
      </button>
    );
  },
);

NavigationButton.displayName = "NavigationButton";
