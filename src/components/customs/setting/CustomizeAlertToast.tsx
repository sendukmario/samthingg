import {
  AlertSizeSetting,
  customAlertSizeSettingsSchema,
} from "@/apis/rest/settings/settings";
import { useCustomizeSettingsStore } from "@/stores/setting/use-customize-settings.store";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useMemo } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import CustomToast from "../toasts/CustomToast";
import { Form } from "@/components/ui/form";
import Image from "next/image";
import { cn } from "@/libraries/utils";
import CustomizedAlertToastSettings from "./CustomizedAlertToastSettings";
import TimeIntervalSlider from "./TimeIntervalSlider";
import { useCustomToast } from "@/hooks/use-custom-toast";

interface CustomizeAlertToastProps {
  formId?: string;
  autoSave?: boolean;
}

type FormData = {
  alertSizeSetting: AlertSizeSetting;
  alertTimeInterval: number;
};

const alertSizeOption = [
  { label: "Normal", value: "normal" },
  { label: "Large", value: "large" },
  { label: "Extra Large", value: "extralarge" },
  { label: "Double Extra Large", value: "doubleextralarge" },
];

const CustomizeAlertToast = ({
  formId = "customize-alert-toast-form",
  autoSave = false,
}: CustomizeAlertToastProps) => {
  const { presets, updatePreset, activePreset } = useCustomizeSettingsStore();
  const finalActivePreset = activePreset || "preset1";

  const { success } = useCustomToast();

  const form = useForm<FormData>({
    resolver: zodResolver(customAlertSizeSettingsSchema),
    defaultValues: {
      alertSizeSetting: presets[finalActivePreset].alertSizeSetting || "normal",
      alertTimeInterval: presets[finalActivePreset].alertTimeInterval || 2.5,
    },
  });

  const selectedAlertSizeOption = useMemo(() => {
    return presets[finalActivePreset].alertSizeSetting;
  }, [presets, finalActivePreset, form.getValues("alertSizeSetting")]);

  const onSubmit = () => {
    updatePreset(finalActivePreset, {
      alertSizeSetting: form.getValues("alertSizeSetting"),
      alertTimeInterval: form.getValues("alertTimeInterval"),
    });

    // toast.custom(
    //   (t: any) => (
    //     <CustomToast
    //       tVisibleState={t.visible}
    //       message="Setting preference saved"
    //       state="SUCCESS"
    //     />
    //   ),
    // );
    success("Setting preference saved");
  };

  const handleOptionChange = (
    value: AlertSizeSetting,
    type: "alertSizeSetting",
  ) => {
    form.setValue(type, value);

    if (autoSave) form.handleSubmit(onSubmit)();
  };

  const handleTimeIntervalChange = (value: number) => {
    form.setValue("alertTimeInterval", value);

    if (autoSave) form.handleSubmit(onSubmit)();
  };

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

        {/* Alert Size */}
        <section className="mb-4 flex flex-col gap-y-2 bg-none">
          <p className="font-geistSemiBold text-sm text-white">Alert Size</p>

          <div className="relative h-full w-full flex-grow flex-col overflow-hidden rounded-[8px] md:bg-[#242436]">
            {alertSizeOption?.map((option) => (
              <div key={option.value} className="bg-[#1B1B24] p-[16px]">
                <button
                  type="button"
                  onClick={() =>
                    handleOptionChange(
                      option.value as AlertSizeSetting,
                      "alertSizeSetting",
                    )
                  }
                  className={cn(
                    "relative flex w-full flex-col overflow-hidden rounded-[8px] border-[1.5px] border-[#242436] px-2 py-5 font-geistSemiBold text-xs text-[#9191A4] transition duration-300 hover:bg-primary/10",
                    selectedAlertSizeOption === option.value &&
                      "border-primary bg-primary/15",
                  )}
                >
                  {selectedAlertSizeOption === option.value && (
                    <Image
                      alt="check"
                      src="/icons/setting/checked-custom.svg"
                      width={24}
                      height={24}
                      className="absolute right-0 top-0"
                    />
                  )}
                  <div className="flex flex-col items-center gap-1.5">
                    <CustomizedAlertToastSettings
                      option={option.value as AlertSizeSetting}
                    />
                    <p
                      className={
                        selectedAlertSizeOption === option.value
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

        {/* Time Interval */}
        <TimeIntervalSlider
          defaultValue={form.getValues("alertTimeInterval")}
          onValueChange={handleTimeIntervalChange}
          autoSave={autoSave}
        />
      </form>
    </Form>
  );
};

export default CustomizeAlertToast;
