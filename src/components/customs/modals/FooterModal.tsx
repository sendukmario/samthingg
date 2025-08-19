"use client";

// ######## Libraries 📦 & Hooks 🪝 ########
import { AnimatePresence, motion } from "framer-motion";
import React, { memo, useMemo } from "react";
// ######## Components 🧩 ########
import GlobalPortal from "../portals/GlobalPortal";
// ######## Utils & Helpers 🤝 ########
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/libraries/utils";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { useWindowSizeStore } from "@/stores/use-window-size.store";
import { useCustomizeTheme } from "@/hooks/use-customize-theme";
import { useCustomizeSettingsStore } from "@/stores/setting/use-customize-settings.store";

type FooterModalProps = {
  triggerChildren: React.ReactNode;
  responsiveWidthAt: number;
  modalState: boolean;
  toggleModal: () => void;
  layer: 1 | 2 | 3;
  overlayClassName?: string;
  contentClassName?: string;
  children: React.ReactNode;
  isComingSoon?: boolean;
};

const FooterModal = memo(function FooterModal({
  triggerChildren,
  responsiveWidthAt,
  modalState,
  toggleModal,
  layer,
  overlayClassName,
  contentClassName,
  children,
  isComingSoon,
}: FooterModalProps) {
  const theme = useCustomizeTheme();
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
  const width = useWindowSizeStore((state) => state.width);

  // Memoize style calculations
  const modalWidth = width
    ? width < responsiveWidthAt
      ? `${width - 15}px`
      : "100%"
    : "auto";

  const renderContent = () => {
    const contentProps = {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0.2 },
      // style: { width: modalWidth },
      className: cn(
        "fixed overflow-hidden md:rounded-[8px] md:border border-[#202037] shadow-custom will-change-transform p-0",
        contentClassName,
        layer === 2 && "z-[140]",
        layer === 3 && "z-[150]",
        currentTheme === "cupsey"
          ? "z-[1600] md:!left-1/2 md:!-translate-x-1/2 md:!top-[50%] h-fit md:!-translate-y-1/2"
          : "md:bottom-[40px] md:left-2 z-[130]",
      ),
      style: theme.background2,
    };

    return <motion.div {...contentProps}>{children}</motion.div>;
  };

  return (
    <>
      {isComingSoon ? (
        <TooltipProvider>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>{triggerChildren}</TooltipTrigger>
            <TooltipContent className="z-[10000]">
              <p>Coming Soon</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        triggerChildren
      )}
      <AnimatePresence>
        {modalState && (
          <GlobalPortal>
            {/* Overlay */}
            <motion.div
              onClick={toggleModal}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "fixed inset-0 z-[120] bg-black/[12%] backdrop-blur-[3px] will-change-[opacity]",
                overlayClassName,
                layer === 2 && "z-[130]",
                layer === 3 && "z-[140]",
                currentTheme === "cupsey" && "z-[1500]",
              )}
              style={{ pointerEvents: "auto" }}
            />
            {/* Content */}
            {renderContent()}
          </GlobalPortal>
        )}
      </AnimatePresence>
    </>
  );
});

export default FooterModal;
