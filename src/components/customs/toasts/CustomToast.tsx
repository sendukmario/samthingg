"use client";

// ######## Components 🧩 ########
import Image from "next/image";
// ######## Utils & Helpers 🤝 ########
import { cn } from "@/libraries/utils";
import Link from "next/link";
import { useCustomizeSettingsStore } from "@/stores/setting/use-customize-settings.store";
import { useMemo } from "react";

type SuccessToastProps = {
  tVisibleState: boolean;
  state?: "SUCCESS" | "LOADING" | "ERROR" | "WARNING";
  message?: string;
  link?: string;
  customMessage?: React.ReactNode;
  className?: string;
};

const alertSizeMap = {
  normal: {
    text: "text-sm leading-[18px]",
    icon: "size-4",
    height: "h-[34px]",
  },
  large: {
    text: "text-base leading-[20px]",
    icon: "size-4",
    height: "h-[36px]",
  },
  extralarge: {
    text: "text-lg",
    icon: "size-5",
    height: "h-[44px]",
  },
  doubleextralarge: {
    text: "text-xl leading-[30px]",
    icon: "size-6",
    height: "h-[46px]",
  },
};

export default function CustomToast({
  tVisibleState,
  state = "SUCCESS",
  message,
  link,
  customMessage,
  className,
}: SuccessToastProps) {
  const iconBasedOnStateMap = {
    SUCCESS: "/icons/toast/success.png",
    LOADING: "/icons/toast/loading.png",
    ERROR: "/icons/toast/error.png",
    WARNING: "/icons/toast/warning.png",
  };

  const customizedSettingPresets = useCustomizeSettingsStore(
    (state) => state.presets,
  );
  const customizedSettingActivePreset = useCustomizeSettingsStore(
    (state) => state.activePreset,
  );

  const currentPresets = useMemo(
    () => ({
      alertSizeSetting:
        customizedSettingPresets[customizedSettingActivePreset]
          .alertSizeSetting || "normal",
    }),
    [],
  );

  const alertSizeClass = alertSizeMap[currentPresets.alertSizeSetting];

  return link ? (
    <Link
      href={link}
      className={cn(
        "flex w-auto items-center gap-x-2 rounded-[8px] bg-[#29293D] px-3 py-2 shadow-[0_8px_20px_0px_rgba(0,0,0,0.12)]",
        tVisibleState ? "animate-toast-enter" : "animate-toast-leave",
        className,
        link && "cursor-pointer",
        alertSizeClass.height,
      )}
    >
      <div
        className={cn(
          "relative aspect-square flex-shrink-0",
          alertSizeClass.icon,
        )}
      >
        <Image
          src={iconBasedOnStateMap[state]}
          alt="Status Icon"
          fill
          quality={100}
          className={cn(
            "object-contain",
            state === "LOADING" && "animate-spin",
          )}
        />
      </div>
      {customMessage ? (
        customMessage
      ) : (
        <span
          className={cn(
            "inline-block text-fontColorPrimary",
            alertSizeClass.text,
          )}
        >
          {message}
        </span>
      )}
    </Link>
  ) : (
    <div
      className={cn(
        "flex w-auto items-center gap-x-2 rounded-[8px] bg-[#29293D] px-3 py-2 shadow-[0_8px_20px_0px_rgba(0,0,0,0.12)]",
        tVisibleState ? "animate-toast-enter" : "animate-toast-leave",
        className,
        link && "cursor-pointer",
        alertSizeClass.height,
      )}
    >
      <div
        className={cn(
          "relative aspect-square flex-shrink-0",
          alertSizeClass.icon,
        )}
      >
        <Image
          src={iconBasedOnStateMap[state]}
          alt="Status Icon"
          fill
          quality={100}
          className={cn(
            "object-contain",
            state === "LOADING" && "animate-spin",
          )}
        />
      </div>
      {customMessage ? (
        customMessage
      ) : (
        <span
          className={cn(
            "inline-block text-fontColorPrimary",
            alertSizeClass.text,
          )}
        >
          {message}
        </span>
      )}
    </div>
  );
}
