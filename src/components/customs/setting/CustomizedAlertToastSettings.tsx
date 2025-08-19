import { AlertSizeSetting } from "@/apis/rest/settings/settings";
import { cn } from "@/libraries/utils";
import Image from "next/image";
import React from "react";

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

const CustomizedAlertToastSettings = ({
  option,
}: {
  option: AlertSizeSetting;
}) => {
  const alertSizeClass = alertSizeMap[option];

  return (
    <div
      className={cn(
        "flex w-auto items-center gap-x-2 rounded-[8px] bg-[#29293D] px-3 py-2 shadow-[0_8px_20px_0px_rgba(0,0,0,0.12)]",

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
          src="/icons/toast/success.png"
          alt="Status Icon"
          fill
          quality={100}
          className={cn("object-contain")}
        />
      </div>
      <span
        className={cn(
          "flex items-center gap-x-1 text-fontColorPrimary",
          alertSizeClass.text,
        )}
      >
        <span>
          😀 assassin <span className="text-success">just bought</span> 2.940
          SOL of
        </span>
        <div className={cn("relative", alertSizeClass.icon)}>
          <Image
            src="/icons/token/bitcoin.svg"
            alt="Bitcoin Icon"
            fill
            quality={100}
            className="object-contain"
          />
        </div>
        <span>TAX</span>
      </span>
    </div>
  );
};

export default CustomizedAlertToastSettings;
