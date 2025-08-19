"use client";

// ######## Libraries 📦 & Hooks 🪝 ########
import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import cookies from "js-cookie";
import { useUserInfoStore } from "@/stores/user/use-user-info.store";
import { motion, AnimatePresence, easeInOut } from "framer-motion";
import BoardingModal from "./BoardingModal";
import NewFeatureModal from "./NewFeaturesModal";
import { useWhatsNewStore } from "@/stores/use-whats-new.store";
import { useWindowSizeStore } from "@/stores/use-window-size.store";

enum OnboardingStep {
  INITIAL, // Initial state
  TUTORIAL_CHOICE, // "Would you like to begin with an onboarding tutorial?"
  FEATURE_SHOWCASE, // "Try the New Feature"
  WELCOME_ANIMATION, // "Welcome to Nova V2" with animation
  BOARDING, // "Boarding Modal"
}

export default function OnboardingModal() {
  // Get user info from the store
  const {
    isNewUser: isFirstTimeUser,
    setIsNewUser: setIsFirstTimeUser,
    setHasSeenTutorial,
    resetAllTutorialStates,
  } = useUserInfoStore();

  const isShowWhatsNew = useWhatsNewStore((state) => state.isShowWhatsNew);
  const setIsShowWhatsNew = useWhatsNewStore(
    (state) => state.setIsShowWhatsNew,
  );

  const width = useWindowSizeStore((state) => state.width);

  // Get current pathname to check if user is on login page
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  // Local state for tutorial flow
  const [isClient, setIsClient] = useState<boolean>(false);
  const [step, setStep] = useState<OnboardingStep>(OnboardingStep.INITIAL);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    setIsClient(true);

    if (isFirstTimeUser) {
      setStep(OnboardingStep.WELCOME_ANIMATION);

      timer = setTimeout(() => {
        setStep(OnboardingStep.FEATURE_SHOWCASE);
      }, 2500); // Increased from 2000 to match the longer animation duration
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, []);

  // handle toggle of whats new modal
  useEffect(() => {
    if (!isFirstTimeUser && isShowWhatsNew) {
      setStep(OnboardingStep.FEATURE_SHOWCASE);
    }
  }, [isShowWhatsNew]);

  // Handler for completing the onboarding process
  const handleComplete = () => {
    setHasSeenTutorial(true);
    setStep(OnboardingStep.INITIAL);
    setIsFirstTimeUser(false);
    cookies.remove("_is_new_user");
    // cookies.set("_is_new_user", "false", { path: "/" });
    resetAllTutorialStates();
  };

  const handleCloseNewFeatureModal = useCallback(() => {
    setIsShowWhatsNew(false);
    // You can set a cookie here to remember that the user has seen the modal
    cookies.set("_has_seen_new_feature_modal", "true", { expires: 30 });

    if (isFirstTimeUser && width! >= 1280) {
      setStep(OnboardingStep.BOARDING);
    } else {
      setStep(OnboardingStep.INITIAL);
    }
  }, []);

  return (
    <>
      {/* <button
        onClick={() => setStep(OnboardingStep.BOARDING)}
        className="fixed right-3 top-3 z-[200000] bg-primary"
      >
        SET BOARDING STEP
      </button> */}
      {isClient && !isLoginPage && (
        <>
          {/* Welcome Animation */}
          {step === OnboardingStep.WELCOME_ANIMATION && <WelcomeAnimation />}

          {/* Feature Showcase */}
          {step === OnboardingStep.FEATURE_SHOWCASE && (
            <NewFeatureModal isOpen onClose={handleCloseNewFeatureModal} />
          )}

          {/* Boarding Modal */}
          {step === OnboardingStep.BOARDING && width! >= 1280 && (
            <BoardingModal onClose={handleComplete} />
          )}
        </>
      )}
    </>
  );
}

const WelcomeAnimation = () => {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center"
      >
        {/* Full screen background that transitions */}
        <motion.div
          className="absolute inset-0 z-10 bg-background"
          initial={{ opacity: 1 }}
          animate={{
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: 3.5,
            times: [0, 0.6, 1],
            ease: easeInOut,
          }}
        />

        <motion.div
          className="relative flex h-full w-full items-center justify-center"
          animate="visible"
          initial="hidden"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1 },
          }}
          transition={{
            duration: 1.5,
            ease: easeInOut,
          }}
          style={{ zIndex: 30 }}
        >
          <motion.h1
            className="z-40 bg-gradient-to-r from-[#8456E8] via-[#E896FF] to-[#8456E8] bg-clip-text text-center font-geistBlack text-5xl text-transparent md:text-7xl"
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: [0, 1.2, 1, 0.5],
              opacity: [0, 1, 1, 0],
            }}
            transition={{
              duration: 2.5,
              times: [0, 0.3, 0.7, 1],
              ease: easeInOut,
            }}
          >
            Welcome to <br className="md:hidden" /> Nova V2
          </motion.h1>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
