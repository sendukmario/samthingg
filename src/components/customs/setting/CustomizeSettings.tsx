import { useCustomizeSettingsStore } from "@/stores/setting/use-customize-settings.store";
import { useMemo } from "react";
import { cn } from "@/libraries/utils";
import CustomizedBuyButtonSettings from "./CustomizedBuyButtonSettings";
import {
  AvatarBorderRadiusSetting,
  AvatarSetting,
  ButtonSetting,
  ColorSetting,
  CosmoCardStyleSetting,
  customButtonSettingsSchema,
  FontSetting,
  SocialSetting,
  ThemeSetting,
  TokenFontSizeSetting,
} from "@/apis/rest/settings/settings";
import { useForm } from "react-hook-form";
import CustomToast from "@/components/customs/toasts/CustomToast";
import toast from "react-hot-toast";
import Image from "next/image";
import { zodResolver } from "@hookform/resolvers/zod";
import CustomizedFontSettings from "./CustomizedFontSettings";
import CustomizedAvatarSettings from "./CustomizedAvatarSettings";
import CustomizedSocialSettings from "./CustomizedSocialSettings";
import { Form } from "@/components/ui/form";
import CustomizedTokenFontSizeSettings from "./CustomizedTokenFontSizeSettings";
import CustomizedAvatarBorderRadiusSettings from "./CustomizedAvatarBorderRadiusSettings";
import CustomizedThemeSettings from "./CustomizedThemeSettings";
import { useCustomToast } from "@/hooks/use-custom-toast";

interface CustomizeSettingsProps {
  formId?: string;
  autoSave?: boolean;
  section?: ISections;
}

interface CustomizeSectionProps<T> {
  selectedOption: T;
  onOptionChange: (value: T) => void;
  isBoarding?: boolean;
}

type ISections =
  | "full"
  | "boarding_theme"
  | "boarding_card"
  | "boarding_card_content";

type IOptions<T> = {
  label: string;
  value: T;
};

type FormData = {
  tokenFontSizeSetting: TokenFontSizeSetting;
  buttonSetting: ButtonSetting;
  fontSetting: FontSetting;
  colorSetting: ColorSetting;
  avatarSetting: AvatarSetting;
  avatarBorderRadiusSetting: AvatarBorderRadiusSetting;
  socialSetting: SocialSetting;
  themeSetting: ThemeSetting;
  cosmoCardStyleSetting: CosmoCardStyleSetting;
};

const tokenFontSizeOptions = [
  { label: "Normal", value: "normal" },
  { label: "Large", value: "large" },
  { label: "Extra Large", value: "extralarge" },
  { label: "Double Extra Large", value: "doubleextralarge" },
];

const buttonOptions = [
  { label: "Normal", value: "normal" },
  { label: "Large", value: "large" },
  { label: "Extra Large", value: "extralarge" },
  { label: "Double Extra Large", value: "doubleextralarge" },
  { label: "Triple Extra Large", value: "tripleextralarge" },
  { label: "Quadruple Extra Large", value: "quadripleextralarge" },
];

const fontOptions = [
  { label: "Normal", value: "normal" },
  { label: "Large", value: "large" },
  { label: "Extra Large", value: "extralarge" },
  { label: "Double Extra Large", value: "doubleextralarge" },
];

const colorOptions = [
  { label: "Normal", value: "normal" },
  { label: "Blue", value: "blue" },
  { label: "Purple", value: "purple" },
  { label: "Fluorescent Blue", value: "fluorescentblue" },
  { label: "Neutral", value: "neutral" },
  { label: "Lemon", value: "lemon" },
  { label: "Cupsey", value: "cupsey" },
];

const avatarOptions = [
  { label: "Normal", value: "normal" },
  { label: "Large", value: "large" },
  { label: "Extra Large", value: "extralarge" },
  { label: "Double Extra Large", value: "doubleextralarge" },
];

const avatarBorderRadiusOptions = [
  { label: "Rounded", value: "rounded" },
  { label: "Squared", value: "squared" },
];

const socialOptions = [
  { label: "Normal", value: "normal" },
  { label: "Large", value: "large" },
  { label: "Extra Large", value: "extralarge" },
  { label: "Double Extra Large", value: "doubleextralarge" },
];

const themeOptions: IOptions<ThemeSetting>[] = [
  { label: "Original", value: "original" },
  { label: "Solid Light", value: "solid-light" },
  { label: "Gradient Light", value: "gradient-light" },
  { label: "Solid Even Lighter", value: "solid-even-lighter" },
  { label: "Gradient Even Lighter", value: "gradient-even-lighter" },
  { label: "Cupsey", value: "cupsey" },
];

// Card skeleton components
const OriginalCardSkeleton = () => (
  <div className="flex w-full flex-col gap-y-3 rounded-br-lg rounded-tl-lg bg-shadeTable px-2 py-3">
    <div className="flex items-center justify-between">
      <div className="h-2.5 w-20 rounded-[2px] bg-[#1B1B2D]" />
      <div className="flex items-center gap-x-1">
        <div className="h-2.5 w-2.5 rounded-[2px] bg-[#1B1B2D]" />
        <div className="h-2.5 w-2.5 rounded-[2px] bg-[#1B1B2D]" />
        <div className="h-2.5 w-2.5 rounded-[2px] bg-[#1B1B2D]" />
        <div className="h-2.5 w-2.5 rounded-[2px] bg-[#1B1B2D]" />
      </div>
    </div>

    <div className="flex items-center justify-between">
      <div className="flex items-center gap-x-3">
        <div className="size-9 rounded-full bg-[#1B1B2D]" />
        <div className="flex flex-col gap-y-1.5">
          <div className="flex items-center gap-x-1">
            <div className="h-2.5 w-9 rounded-[2px] bg-[#1B1B2D]" />
            <div className="h-2.5 w-9 rounded-[2px] bg-[#1B1B2D]" />
            <div className="h-2.5 w-9 rounded-[2px] bg-[#1B1B2D]" />
          </div>
          <div className="h-2 w-16 rounded-[2px] bg-[#1B1B2D]" />
        </div>
      </div>
      <div className="h-4 w-10 rounded-full bg-[#1B1B2D]" />
    </div>
  </div>
);

const Style1CardSkeleton = () => (
  <div className="flex w-full flex-col gap-y-3 rounded-br-lg rounded-tl-lg bg-shadeTable px-2 py-3">
    <div className="flex w-full items-center justify-between">
      <div className="flex w-full items-start gap-x-3">
        <div>
          <div className="size-9 rounded-full bg-[#1B1B2D]" />
        </div>
        <div className="flex w-full flex-col gap-y-3">
          <div className="flex w-full items-end justify-between">
            <div className="flex flex-col gap-y-1.5">
              <div className="flex w-full items-center gap-x-1">
                <div className="h-2.5 w-9 rounded-[2px] bg-[#1B1B2D]" />
                <div className="h-2.5 w-9 rounded-[2px] bg-[#1B1B2D]" />
                <div className="h-2.5 w-9 rounded-[2px] bg-[#1B1B2D]" />
              </div>
              <div className="h-2 w-16 rounded-[2px] bg-[#1B1B2D]" />
            </div>
            <div className="h-4 w-10 rounded-full bg-[#1B1B2D]" />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-x-1">
              <div className="h-2.5 w-2.5 rounded-[2px] bg-[#1B1B2D]" />
              <div className="h-2.5 w-2.5 rounded-[2px] bg-[#1B1B2D]" />
              <div className="h-2.5 w-2.5 rounded-[2px] bg-[#1B1B2D]" />
              <div className="h-2.5 w-2.5 rounded-[2px] bg-[#1B1B2D]" />
            </div>
            <div className="flex items-center gap-x-1">
              <div className="h-2.5 w-10 rounded-[2px] bg-[#1B1B2D]" />
              <div className="h-2.5 w-10 rounded-[2px] bg-[#1B1B2D]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const Style2CardSkeleton = () => (
  <div className="flex w-full flex-col gap-y-3 rounded-br-lg rounded-tl-lg bg-shadeTable px-2 py-3">
    <div className="flex w-full items-center justify-between">
      <div className="flex w-full items-start gap-x-3">
        <div>
          <div className="size-9 rounded-full bg-[#1B1B2D]" />
        </div>
        <div className="flex w-full flex-col gap-y-3">
          <div className="flex w-full items-start justify-between">
            <div className="flex flex-col gap-y-1.5">
              <div className="h-2 w-16 rounded-[2px] bg-[#1B1B2D]" />
              <div className="flex items-center gap-x-1">
                <div className="h-2.5 w-2.5 rounded-[2px] bg-[#1B1B2D]" />
                <div className="h-2.5 w-2.5 rounded-[2px] bg-[#1B1B2D]" />
                <div className="h-2.5 w-2.5 rounded-[2px] bg-[#1B1B2D]" />
                <div className="h-2.5 w-2.5 rounded-[2px] bg-[#1B1B2D]" />
              </div>
            </div>
            <div className="flex flex-col items-end gap-y-1.5">
              <div className="h-2 w-16 rounded-[2px] bg-[#1B1B2D]" />
              <div className="flex items-center gap-x-1">
                <div className="h-2 w-[18px] rounded-[2px] bg-[#1B1B2D]" />
                <div className="h-2 w-[18px] rounded-[2px] bg-[#1B1B2D]" />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-x-1">
              <div className="h-2.5 w-10 rounded-[2px] bg-[#1B1B2D]" />
              <div className="h-2.5 w-10 rounded-[2px] bg-[#1B1B2D]" />
            </div>
            <div className="h-4 w-10 rounded-full bg-[#1B1B2D]" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

const Style3CardSkeleton = () => (
  <div className="flex w-full flex-col gap-y-3 rounded-br-lg rounded-tl-lg bg-shadeTable px-2 py-3">
    <div className="flex w-full items-center justify-between">
      <div className="flex w-full items-start gap-x-3">
        <div>
          <div className="size-9 rounded-full bg-[#1B1B2D]" />
        </div>
        <div className="flex w-full flex-col gap-y-3">
          <div className="flex w-full items-start justify-between">
            <div className="flex flex-col gap-y-1.5">
              <div className="h-2 w-16 rounded-[2px] bg-[#1B1B2D]" />
              <div className="flex items-center gap-x-1">
                <div className="h-2.5 w-10 rounded-[2px] bg-[#1B1B2D]" />
                <div className="h-2.5 w-10 rounded-[2px] bg-[#1B1B2D]" />
              </div>
            </div>
            <div className="h-4 w-10 rounded-full bg-[#1B1B2D]" />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-x-1">
              <div className="h-2.5 w-2.5 rounded-[2px] bg-[#1B1B2D]" />
              <div className="h-2.5 w-2.5 rounded-[2px] bg-[#1B1B2D]" />
              <div className="h-2.5 w-2.5 rounded-[2px] bg-[#1B1B2D]" />
              <div className="h-2.5 w-2.5 rounded-[2px] bg-[#1B1B2D]" />
            </div>
            <div className="flex flex-col items-end gap-y-1.5">
              <div className="flex items-center gap-x-1">
                <div className="h-2 w-[18px] rounded-[2px] bg-[#1B1B2D]" />
                <div className="h-2 w-[18px] rounded-[2px] bg-[#1B1B2D]" />
              </div>
              <div className="h-2 w-16 rounded-[2px] bg-[#1B1B2D]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Updated data structure with skeleton components
const cosmoCardStyleOptions = [
  {
    label: "Original",
    value: "type1",
    component: OriginalCardSkeleton,
  },
  {
    label: "Nebula",
    value: "type2",
    component: Style1CardSkeleton,
  },
  {
    label: "Chrono",
    value: "type3",
    component: Style2CardSkeleton,
  },
  {
    label: "Cupsey",
    value: "type4",
    component: Style3CardSkeleton,
  },
];

function CustomizeSettings({
  formId = "customize-settings-form",
  autoSave = false,
  section = "full",
}: CustomizeSettingsProps) {
  const { presets, updatePreset, activePreset } = useCustomizeSettingsStore();
  const finalActivePreset = activePreset || "preset1";

  const { success } = useCustomToast();

  const form = useForm<FormData>({
    resolver: zodResolver(customButtonSettingsSchema),
    defaultValues: {
      tokenFontSizeSetting:
        presets[finalActivePreset].tokenFontSizeSetting || "normal",
      buttonSetting: presets[finalActivePreset].buttonSetting || "normal",
      fontSetting: presets[finalActivePreset].fontSetting || "normal",
      colorSetting: presets[finalActivePreset].colorSetting || "normal",
      avatarSetting: presets[finalActivePreset].avatarSetting || "normal",
      avatarBorderRadiusSetting:
        presets[finalActivePreset].avatarBorderRadiusSetting || "rounded",
      socialSetting: presets[finalActivePreset].socialSetting || "normal",
      themeSetting: presets[finalActivePreset].themeSetting || "original",
      cosmoCardStyleSetting:
        presets[finalActivePreset].cosmoCardStyleSetting || "type1",
    },
  });

  const handleOptionChange = (
    value:
      | TokenFontSizeSetting
      | ButtonSetting
      | FontSetting
      | ColorSetting
      | AvatarSetting
      | AvatarBorderRadiusSetting
      | SocialSetting
      | ThemeSetting
      | CosmoCardStyleSetting,
    type:
      | "tokenFontSizeSetting"
      | "buttonSetting"
      | "fontSetting"
      | "colorSetting"
      | "avatarSetting"
      | "avatarBorderRadiusSetting"
      | "socialSetting"
      | "themeSetting"
      | "cosmoCardStyleSetting",
  ) => {
    // console.warn("handleOptionChange called with value:", value, "type:", type);
    form.setValue(type, value);

    if (autoSave) onSubmit();
  };

  const onSubmit = () => {
    // console.warn(
    //   "Autosaveee:",
    //   finalActivePreset,
    //   form.getValues("themeSetting"),
    // );
    updatePreset(finalActivePreset, {
      tokenFontSizeSetting: form.getValues("tokenFontSizeSetting"),
      buttonSetting: form.getValues("buttonSetting"),
      fontSetting: form.getValues("fontSetting"),
      colorSetting: form.getValues("colorSetting"),
      avatarSetting: form.getValues("avatarSetting"),
      avatarBorderRadiusSetting: form.getValues("avatarBorderRadiusSetting"),
      socialSetting: form.getValues("socialSetting"),
      themeSetting: form.getValues("themeSetting"),
      cosmoCardStyleSetting: form.getValues("cosmoCardStyleSetting"),
    });

    // toast.custom((t: any) => (
    //   <CustomToast
    //     tVisibleState={t.visible}
    //     message="Setting preference saved"
    //     state="SUCCESS"
    //   />
    // ));
    success("Setting preference saved");
  };

  const selectedTokenFontSizeOption = useMemo(() => {
    return presets[finalActivePreset].tokenFontSizeSetting;
  }, [presets, finalActivePreset, form.getValues("tokenFontSizeSetting")]);

  const selectedOption = useMemo(() => {
    return presets[finalActivePreset].buttonSetting;
  }, [presets, finalActivePreset, form.getValues("buttonSetting")]);

  const selectedFontOption = useMemo(() => {
    return presets[finalActivePreset].fontSetting;
  }, [presets, finalActivePreset, form.getValues("fontSetting")]);

  const selectedColorOption = useMemo(() => {
    return presets[finalActivePreset].colorSetting;
  }, [presets, finalActivePreset, form.getValues("colorSetting")]);

  const selectedAvatarOption = useMemo(() => {
    return presets[finalActivePreset].avatarSetting;
  }, [presets, finalActivePreset, form.getValues("avatarSetting")]);

  const selectedAvatarBorderRadiusOption = useMemo(() => {
    return presets[finalActivePreset].avatarBorderRadiusSetting;
  }, [presets, finalActivePreset, form.getValues("avatarBorderRadiusSetting")]);

  const selectedSocialOption = useMemo(() => {
    return presets[finalActivePreset].socialSetting;
  }, [presets, finalActivePreset, form.getValues("socialSetting")]);

  const selectedThemeOption = useMemo(() => {
    return presets[finalActivePreset].themeSetting;
  }, [presets, finalActivePreset, form.getValues("themeSetting")]);

  const selectedCosmoCardStyleOption = useMemo(() => {
    return presets[finalActivePreset].cosmoCardStyleSetting;
  }, [presets, finalActivePreset, form.getValues("cosmoCardStyleSetting")]);

  if (section === "boarding_theme") {
    return (
      <CustomizeThemeSection
        selectedOption={selectedThemeOption}
        onOptionChange={(value) => handleOptionChange(value, "themeSetting")}
        isBoarding
      />
    );
  }

  if (section === "boarding_card") {
    return (
      <CustomizeCardSection
        selectedOption={selectedCosmoCardStyleOption}
        onOptionChange={(value) =>
          handleOptionChange(value, "cosmoCardStyleSetting")
        }
        isBoarding
      />
    );
  }

  if (section === "boarding_card_content") {
    return (
      <div className="nova-scroller flex h-96 w-full flex-col overflow-auto pr-1">
        {/* Cosmo Token Avatar Border Radius */}
        <CustomizeAvatarSection
          selectedOption={selectedAvatarBorderRadiusOption}
          onOptionChange={(value) =>
            handleOptionChange(value, "avatarBorderRadiusSetting")
          }
        />

        {/* Button Size */}
        <CustomizeButtonSizeSection
          selectedOption={selectedOption}
          onOptionChange={(value) => handleOptionChange(value, "buttonSetting")}
        />

        {/* Token Font Size */}
        <CustomizeTokenFontSizeSection
          selectedOption={selectedTokenFontSizeOption}
          onOptionChange={(value) =>
            handleOptionChange(value, "tokenFontSizeSetting")
          }
        />

        {/* Font Size */}
        <CustomizeFontSizeSection
          selectedOption={selectedFontOption}
          onOptionChange={(value) => handleOptionChange(value, "fontSetting")}
        />

        {/* Color */}
        <CustomizeColorSection
          selectedOption={selectedColorOption}
          onOptionChange={(value) => handleOptionChange(value, "colorSetting")}
        />

        {/* Token Avatar */}
        <CustomizeTokenAvatarSection
          selectedOption={selectedAvatarOption}
          onOptionChange={(value) => handleOptionChange(value, "avatarSetting")}
        />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form
        id={formId}
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="relative h-auto w-full flex-grow flex-col gap-y-4 overflow-hidden rounded-[8px]"
      >
        <div className="flex size-7 h-full w-full flex-col items-center justify-center gap-3 pt-10 md:hidden">
          <Image
            src="/images/only-on-desktop.png"
            alt="Only Available on Desktop"
            width={180}
            height={120}
            className="mb-4"
          />
          <h3 className="text-center font-geistSemiBold text-2xl text-fontColorPrimary">
            Only Available on Desktop
          </h3>
          <p className="text-md text-center font-geistRegular text-fontColorSecondary">
            This feature is currently optimized for desktop use. Please switch
            to a desktop device for the best experience.
          </p>
        </div>

        {/* Cosmo Token Avatar Border Radius */}
        <CustomizeAvatarSection
          selectedOption={selectedAvatarBorderRadiusOption}
          onOptionChange={(value) =>
            handleOptionChange(value, "avatarBorderRadiusSetting")
          }
        />

        {/* Button Size */}
        <CustomizeButtonSizeSection
          selectedOption={selectedOption}
          onOptionChange={(value) => handleOptionChange(value, "buttonSetting")}
        />

        {/* Token Font Size */}
        <CustomizeTokenFontSizeSection
          selectedOption={selectedTokenFontSizeOption}
          onOptionChange={(value) =>
            handleOptionChange(value, "tokenFontSizeSetting")
          }
        />

        {/* Font Size */}
        <CustomizeFontSizeSection
          selectedOption={selectedFontOption}
          onOptionChange={(value) => handleOptionChange(value, "fontSetting")}
        />

        {/* Color */}
        <CustomizeColorSection
          selectedOption={selectedColorOption}
          onOptionChange={(value) => handleOptionChange(value, "colorSetting")}
        />

        {/* Token Avatar */}
        <CustomizeTokenAvatarSection
          selectedOption={selectedAvatarOption}
          onOptionChange={(value) => handleOptionChange(value, "avatarSetting")}
        />

        {/* Social Icon */}
        <CustomizeSocialIconSection
          selectedOption={selectedSocialOption}
          onOptionChange={(value) => handleOptionChange(value, "socialSetting")}
        />

        {/* Theme & appearance */}
        <CustomizeThemeSection
          selectedOption={selectedThemeOption}
          onOptionChange={(value) => {
            handleOptionChange(value, "themeSetting");
            localStorage.setItem("nova_app_theme", value);
          }}
        />

        {/* Card style */}
        <CustomizeCardSection
          selectedOption={selectedCosmoCardStyleOption}
          onOptionChange={(value) =>
            handleOptionChange(value, "cosmoCardStyleSetting")
          }
        />
      </form>
    </Form>
  );
}

function CustomizeThemeSection({
  selectedOption,
  onOptionChange,
  isBoarding = false,
}: CustomizeSectionProps<ThemeSetting>) {
  if (isBoarding) {
    return (
      <section className="nova-scroller h-96 overflow-auto bg-none">
        <div className="flex flex-col gap-2 overflow-auto rounded-[8px] pr-1">
          {themeOptions?.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onOptionChange(option.value as ThemeSetting)}
              className={cn(
                "relative flex h-[106px] w-full flex-col overflow-hidden rounded-[8px] border-2 border-[#242436] bg-[#1B1B24] p-3 font-geistSemiBold transition-all duration-300 hover:bg-primary/10",
                selectedOption === option.value &&
                  "border-primary bg-primary/15",
              )}
            >
              {selectedOption === option.value && (
                <Image
                  alt="check"
                  src="/icons/setting/checked-custom.svg"
                  width={24}
                  height={24}
                  className="absolute right-0 top-0 z-10"
                />
              )}
              <div className="relative">
                <p
                  className={cn(
                    "absolute left-0 max-w-[130px] text-start font-geistMedium leading-[19.5px]",
                    option.label.includes("Even") ? "top-[41px]" : "top-[60px]",
                    selectedOption === option.value
                      ? "text-white"
                      : "text-[#9191A4] hover:text-white",
                  )}
                >
                  {option.label}
                </p>

                <div className="absolute -right-4 top-5">
                  <CustomizedThemeSettings
                    option={option.value as ThemeSetting}
                    isBoarding
                  />
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="mb-4 flex flex-col gap-y-2 bg-none">
      <p className="font-geistSemiBold text-sm text-white">Theme</p>
      <div className="relative hidden grid-cols-3 overflow-hidden rounded-[8px] md:grid">
        {themeOptions?.map((option, index) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onOptionChange(option.value as ThemeSetting)}
            className={cn(
              "relative flex w-full flex-col overflow-hidden font-geistSemiBold text-xs text-[#9191A4] transition duration-300 hover:bg-primary/10",
              "bg-[#1B1B24]",
              selectedOption === option.value && "border-primary bg-primary/15",
              "px-3 py-3",
              "border border-[#242436]",
              index === 0 && "rounded-tl-[8px]",
              index === 2 && "rounded-tr-[8px]",
              index === 3 && "rounded-bl-[8px]",
              index === 5 && "rounded-br-[8px]",
            )}
          >
            {selectedOption === option.value && (
              <Image
                alt="check"
                src="/icons/setting/checked-custom.svg"
                width={24}
                height={24}
                className="absolute right-0 top-0 z-10"
              />
            )}
            <div className="flex flex-col items-center gap-1.5">
              <CustomizedThemeSettings option={option.value as ThemeSetting} />
              <p
                className={cn(
                  "mr-auto py-1",
                  selectedOption === option.value
                    ? "text-[#DF74FF]"
                    : "text-[#9191A4] hover:text-white",
                )}
              >
                {option.label}
              </p>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

function CustomizeCardSection({
  selectedOption,
  onOptionChange,
  isBoarding = false,
}: CustomizeSectionProps<CosmoCardStyleSetting>) {
  if (isBoarding) {
    return (
      <section className="nova-scroller h-96 overflow-auto bg-none">
        <div className="flex flex-col gap-2 overflow-auto rounded-[8px] pr-1">
          {cosmoCardStyleOptions?.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() =>
                onOptionChange(option.value as CosmoCardStyleSetting)
              }
              className={cn(
                "relative flex h-[106px] w-full flex-col overflow-hidden rounded-[8px] border-2 border-[#242436] bg-[#1B1B24] p-3 font-geistSemiBold transition-all duration-300 hover:bg-primary/10",
                selectedOption === option.value &&
                  "border-primary bg-primary/15",
              )}
            >
              {selectedOption === option.value && (
                <Image
                  alt="check"
                  src="/icons/setting/checked-custom.svg"
                  width={24}
                  height={24}
                  className="absolute right-0 top-0 z-10"
                />
              )}
              <div className="relative">
                <p
                  className={cn(
                    "absolute left-0 top-[60px] font-geistMedium",
                    selectedOption === option.value
                      ? "text-white"
                      : "text-[#9191A4] hover:text-white",
                  )}
                >
                  {option.label}
                </p>

                <div className="absolute -right-3 top-5 flex w-60 justify-end">
                  <option.component />
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="mb-4 flex flex-col gap-y-2 bg-none">
      <p className="font-geistSemiBold text-sm text-white">Card style</p>
      <div className="relative hidden grid-cols-1 gap-[1.5px] overflow-hidden rounded-[8px] bg-[#242436] md:grid">
        {cosmoCardStyleOptions?.map((option) => (
          <div key={option.value} className="bg-[#1B1B24] p-[16px]">
            <button
              type="button"
              onClick={() =>
                onOptionChange(option.value as CosmoCardStyleSetting)
              }
              className={cn(
                "relative flex h-[100px] w-full flex-col overflow-hidden rounded-[8px] border-[1.5px] border-[#242436] bg-[#1F1F2F] font-geistSemiBold text-xs text-[#9191A4] transition duration-300 hover:bg-primary/10",
                selectedOption === option.value &&
                  "border-primary bg-primary/15",
              )}
            >
              {selectedOption === option.value && (
                <Image
                  alt="check"
                  src="/icons/setting/checked-custom.svg"
                  width={24}
                  height={24}
                  className="absolute right-0 top-0"
                />
              )}
              <div className="flex h-full items-end justify-between gap-1.5">
                <p
                  className={cn(
                    "p-3 text-base",
                    selectedOption === option.value
                      ? "text-[#DF74FF]"
                      : "text-fontColorPrimary",
                  )}
                >
                  {option.label}
                </p>
                <div className="flex h-20 w-96 justify-end">
                  <option.component />
                </div>
              </div>
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

function CustomizeAvatarSection({
  selectedOption,
  onOptionChange,
}: CustomizeSectionProps<AvatarBorderRadiusSetting>) {
  return (
    <section className="mb-4 flex flex-col gap-y-2 bg-none">
      <p className="font-geistSemiBold text-sm text-white">
        Token Avatar Radius
      </p>

      <div className="relative hidden grid-cols-2 gap-[1.5px] overflow-hidden rounded-[8px] bg-[#242436] md:grid">
        {avatarBorderRadiusOptions?.map((option) => (
          <div key={option.value} className="bg-[#1B1B24] p-[16px]">
            <button
              type="button"
              onClick={() =>
                onOptionChange(option.value as AvatarBorderRadiusSetting)
              }
              className={cn(
                "relative flex w-full flex-col overflow-hidden rounded-[8px] border-[1.5px] border-[#242436] px-2 py-5 font-geistSemiBold text-xs text-[#9191A4] transition duration-300 hover:bg-primary/10",
                selectedOption === option.value &&
                  "border-primary bg-primary/15",
              )}
            >
              {selectedOption === option.value && (
                <Image
                  alt="check"
                  src="/icons/setting/checked-custom.svg"
                  width={24}
                  height={24}
                  className="absolute right-0 top-0"
                />
              )}
              <div className="flex flex-col items-center gap-1.5">
                <CustomizedAvatarBorderRadiusSettings
                  option={option.value as AvatarBorderRadiusSetting}
                />
                <p
                  className={
                    selectedOption === option.value
                      ? "text-[#DF74FF]"
                      : "text-[#9191A4] hover:text-white"
                  }
                >
                  {option.label}
                </p>
              </div>
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

function CustomizeButtonSizeSection({
  selectedOption,
  onOptionChange,
}: CustomizeSectionProps<ButtonSetting>) {
  return (
    <section className="mb-4 flex flex-col gap-y-2 bg-none">
      <p className="font-geistSemiBold text-sm text-white">Button Size</p>
      <div className="relative hidden grid-cols-2 gap-[1.5px] overflow-hidden rounded-[8px] bg-[#242436] md:grid">
        {buttonOptions?.map((option) => (
          <div key={option.value} className="bg-[#1B1B24] p-[16px]">
            <button
              type="button"
              onClick={() => onOptionChange(option.value as ButtonSetting)}
              className={cn(
                "relative flex w-full flex-col overflow-hidden rounded-[8px] border-[1.5px] border-[#242436] px-2 py-5 font-geistSemiBold text-xs text-[#9191A4] transition duration-300 hover:bg-primary/10",
                selectedOption === option.value &&
                  "border-primary bg-primary/15",
              )}
            >
              {selectedOption === option.value && (
                <Image
                  alt="check"
                  src="/icons/setting/checked-custom.svg"
                  width={24}
                  height={24}
                  className="absolute right-0 top-0"
                />
              )}
              <div className="flex flex-col items-center gap-1.5">
                <CustomizedBuyButtonSettings
                  option={option.value as ButtonSetting}
                />
                <p
                  className={
                    selectedOption === option.value
                      ? "text-[#DF74FF]"
                      : "text-[#9191A4] hover:text-white"
                  }
                >
                  {option.label}
                </p>
              </div>
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

function CustomizeTokenFontSizeSection({
  selectedOption,
  onOptionChange,
}: CustomizeSectionProps<TokenFontSizeSetting>) {
  return (
    <section className="mb-4 flex flex-col gap-y-2 bg-none">
      <p className="font-geistSemiBold text-sm text-white">Token Font Size</p>
      <div className="relative hidden grid-cols-2 gap-[1.5px] overflow-hidden rounded-[8px] bg-[#242436] md:grid">
        {tokenFontSizeOptions?.map((option) => (
          <div key={option.value} className="bg-[#1B1B24] p-[16px]">
            <button
              type="button"
              onClick={() =>
                onOptionChange(option.value as TokenFontSizeSetting)
              }
              className={cn(
                "relative flex w-full flex-col overflow-hidden rounded-[8px] border-[1.5px] border-[#242436] px-2 py-5 font-geistSemiBold text-xs text-[#9191A4] transition duration-300 hover:bg-primary/10",
                selectedOption === option.value &&
                  "border-primary bg-primary/15",
              )}
            >
              {selectedOption === option.value && (
                <Image
                  alt="check"
                  src="/icons/setting/checked-custom.svg"
                  width={24}
                  height={24}
                  className="absolute right-0 top-0"
                />
              )}
              <div className="flex flex-col items-center gap-1.5">
                <CustomizedTokenFontSizeSettings
                  option={option.value as TokenFontSizeSetting}
                />
                <p
                  className={
                    selectedOption === option.value
                      ? "text-[#DF74FF]"
                      : "text-[#9191A4] hover:text-white"
                  }
                >
                  {option.label}
                </p>
              </div>
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

function CustomizeFontSizeSection({
  selectedOption,
  onOptionChange,
}: CustomizeSectionProps<FontSetting>) {
  return (
    <section className="mb-4 flex flex-col gap-y-2 bg-none">
      <p className="font-geistSemiBold text-sm text-white">Font Size</p>
      <div className="relative hidden grid-cols-2 gap-[1.5px] overflow-hidden rounded-[8px] bg-[#242436] md:grid">
        {fontOptions?.map((option) => (
          <div key={option.value} className="bg-[#1B1B24] p-[16px]">
            <button
              type="button"
              onClick={() => onOptionChange(option.value as FontSetting)}
              className={cn(
                "relative flex w-full flex-col overflow-hidden rounded-[8px] border-[1.5px] border-[#242436] px-2 py-5 font-geistSemiBold text-xs text-[#9191A4] transition duration-300 hover:bg-primary/10",
                selectedOption === option.value &&
                  "border-primary bg-primary/15",
              )}
            >
              {selectedOption === option.value && (
                <Image
                  alt="check"
                  src="/icons/setting/checked-custom.svg"
                  width={24}
                  height={24}
                  className="absolute right-0 top-0"
                />
              )}
              <div className="flex flex-col items-center gap-1.5">
                <CustomizedFontSettings font={option.value as FontSetting} />
                <p
                  className={
                    selectedOption === option.value
                      ? "text-[#DF74FF]"
                      : "text-[#9191A4] hover:text-white"
                  }
                >
                  {option.label}
                </p>
              </div>
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

function CustomizeColorSection({
  selectedOption,
  onOptionChange,
}: CustomizeSectionProps<ColorSetting>) {
  return (
    <section className="mb-4 flex flex-col gap-y-2 bg-none">
      <p className="font-geistSemiBold text-sm text-white">Color</p>

      <div className="relative hidden grid-cols-2 gap-[1.5px] overflow-hidden rounded-[8px] bg-[#242436] md:grid">
        {colorOptions?.map((option) => (
          <div key={option.value} className="bg-[#1B1B24] p-[16px]">
            <button
              type="button"
              onClick={() => onOptionChange(option.value as ColorSetting)}
              className={cn(
                "relative flex w-full flex-col overflow-hidden rounded-[8px] border-[1.5px] border-[#242436] px-2 py-5 font-geistSemiBold text-xs text-[#9191A4] transition duration-300 hover:bg-primary/10",
                selectedOption === option.value &&
                  "border-primary bg-primary/15",
              )}
            >
              {selectedOption === option.value && (
                <Image
                  alt="check"
                  src="/icons/setting/checked-custom.svg"
                  width={24}
                  height={24}
                  className="absolute right-0 top-0"
                />
              )}
              <div className="flex flex-col items-center gap-1.5">
                <CustomizedFontSettings color={option.value as ColorSetting} />
                <p
                  className={
                    selectedOption === option.value
                      ? "text-[#DF74FF]"
                      : "text-[#9191A4] hover:text-white"
                  }
                >
                  {option.label}
                </p>
              </div>
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

function CustomizeTokenAvatarSection({
  selectedOption,
  onOptionChange,
}: CustomizeSectionProps<AvatarSetting>) {
  return (
    <section className="mb-4 flex flex-col gap-y-2 bg-none">
      <p className="font-geistSemiBold text-sm text-white">Token Avatar</p>

      <div className="relative hidden grid-cols-2 gap-[1.5px] overflow-hidden rounded-[8px] bg-[#242436] md:grid">
        {avatarOptions?.map((option) => (
          <div key={option.value} className="bg-[#1B1B24] p-[16px]">
            <button
              type="button"
              onClick={() => onOptionChange(option.value as AvatarSetting)}
              className={cn(
                "relative flex w-full flex-col overflow-hidden rounded-[8px] border-[1.5px] border-[#242436] px-2 py-5 font-geistSemiBold text-xs text-[#9191A4] transition duration-300 hover:bg-primary/10",
                selectedOption === option.value &&
                  "border-primary bg-primary/15",
              )}
            >
              {selectedOption === option.value && (
                <Image
                  alt="check"
                  src="/icons/setting/checked-custom.svg"
                  width={24}
                  height={24}
                  className="absolute right-0 top-0"
                />
              )}
              <div className="flex flex-col items-center gap-1.5">
                <CustomizedAvatarSettings
                  option={option.value as AvatarSetting}
                />
                <p
                  className={
                    selectedOption === option.value
                      ? "text-[#DF74FF]"
                      : "text-[#9191A4] hover:text-white"
                  }
                >
                  {option.label}
                </p>
              </div>
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

function CustomizeSocialIconSection({
  selectedOption,
  onOptionChange,
}: CustomizeSectionProps<SocialSetting>) {
  return (
    <section className="mb-4 flex flex-col gap-y-2 bg-none">
      <p className="font-geistSemiBold text-sm text-white">Social Icon</p>
      <div className="relative hidden grid-cols-2 gap-[1.5px] overflow-hidden rounded-[8px] bg-[#242436] md:grid">
        {socialOptions?.map((option) => (
          <div key={option.value} className="bg-[#1B1B24] p-[16px]">
            <button
              type="button"
              onClick={() => onOptionChange(option.value as SocialSetting)}
              className={cn(
                "relative flex w-full flex-col overflow-hidden rounded-[8px] border-[1.5px] border-[#242436] px-2 py-5 font-geistSemiBold text-xs text-[#9191A4] transition duration-300 hover:bg-primary/10",
                selectedOption === option.value &&
                  "border-primary bg-primary/15",
              )}
            >
              {selectedOption === option.value && (
                <Image
                  alt="check"
                  src="/icons/setting/checked-custom.svg"
                  width={24}
                  height={24}
                  className="absolute right-0 top-0"
                />
              )}
              <div className="flex flex-col items-center gap-1.5 gap-y-4">
                <CustomizedSocialSettings
                  option={option.value as SocialSetting}
                />
                <p
                  className={
                    selectedOption === option.value
                      ? "text-[#DF74FF]"
                      : "text-[#9191A4] hover:text-white"
                  }
                >
                  {option.label}
                </p>
              </div>
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

export default CustomizeSettings;
