import React from "react";
import { SocialSetting, ThemeSetting } from "@/apis/rest/settings/settings";
import Image from "next/image";
import { cn } from "@/libraries/utils";

const themeMap: Record<ThemeSetting, string> = {
  original: "/images/theme-settings/original.svg",
  "solid-light": "/images/theme-settings/solid-light.svg",
  "gradient-light": "/images/theme-settings/gradient-light.svg",
  "solid-even-lighter": "/images/theme-settings/solid-even-lighter.svg",
  "gradient-even-lighter": "/images/theme-settings/gradient-even-lighter.svg",
  "cupsey": "/images/theme-settings/gradient-even-lighter.svg",
};

const boardingThemeMap: Record<ThemeSetting, string> = {
  original: "/images/theme-settings/boarding/original.svg",
  "solid-light": "/images/theme-settings/boarding/solid-light.svg",
  "gradient-light": "/images/theme-settings/boarding/gradient-light.svg",
  "solid-even-lighter":
    "/images/theme-settings/boarding/solid-even-lighter.svg",
  "gradient-even-lighter":
    "/images/theme-settings/boarding/gradient-even-lighter.svg",
  cupsey: "/images/theme-settings/boarding/cupsey.svg",
};

const CustomizedThemeSettings = ({
  option = "original",
  isBoarding = false,
}: {
  option: ThemeSetting;
  isBoarding?: boolean;
}) => {
  if (isBoarding) {
    return (
      <div className="relative mr-auto h-24 w-60 overflow-hidden rounded-lg">
        <Image
          src={boardingThemeMap[option]}
          alt={`${option} Boarding Theme Icon`}
          fill
          className="rounded"
        />
      </div>
    );
  }

  return (
    <div className="relative h-[130px] w-full overflow-hidden rounded-lg">
      <Image
        src={themeMap[option]}
        alt={`${option} Theme Icon`}
        fill
        className="rounded object-cover"
      />
    </div>
  );
};

export default CustomizedThemeSettings;
