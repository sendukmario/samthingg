"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import Separator from "@/components/customs/Separator";
import { cn } from "@/libraries/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Input } from "../ui/input";
import BaseButton from "./buttons/BaseButton";
import { useLastInputAmountStore } from "@/stores/setting/use-last-input-amount-type.store";
import { CachedImage } from "./CachedImage";
import { useCustomizeTheme } from "@/hooks/use-customize-theme";
import { useCustomizeSettingsStore } from "@/stores/setting/use-customize-settings.store";

export const DEFAULT_QUICK_PICK_SOL_LIST: number[] = [
  0.1, 0.3, 0.5, 0.7, 0.9, 1.2,
];
export const DEFAULT_QUICK_PICK_PERCENTAGE_LIST: number[] = [
  10, 25, 40, 50, 75, 100,
];

interface SellBuyInputAmountProps {
  value: number | undefined;
  onChange: React.Dispatch<React.SetStateAction<number | undefined>>;
  handleChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: "buy" | "sell" | "swap";
  setSolAmountType?: React.Dispatch<React.SetStateAction<"SOL" | "%">>;
  setPickerValue?: React.Dispatch<React.SetStateAction<number | undefined>>;
  pickerValue?: number;
  isError?: boolean;
  setLastFocusOn?: React.Dispatch<React.SetStateAction<"input" | "picker">>;
  lastFocusOn?: "input" | "picker";
  quickPickList?: number[];
  buyCurrency?: "SOL" | "USDC";
  setBuyCurrency?: React.Dispatch<React.SetStateAction<"SOL" | "USDC">>;
}

const SellBuyInputAmount = React.forwardRef<
  HTMLDivElement,
  SellBuyInputAmountProps
>(
  (
    {
      value,
      onChange,
      handleChange,
      type = "buy",
      isError,
      setSolAmountType: setSolAmountTypeValue,
      setPickerValue,
      pickerValue,
      setLastFocusOn,
      lastFocusOn,
      quickPickList,
      buyCurrency: externalBuyCurrency,
      setBuyCurrency: setExternalBuyCurrency,
    },
    ref,
  ) => {
    const theme = useCustomizeTheme();
    const solAmountType = useLastInputAmountStore((state) => state.type);
    const setSolAmountType = useLastInputAmountStore((state) => state.setType);

    // Use external currency state if provided, otherwise use internal state
    const [internalBuyCurrency, setInternalBuyCurrency] = useState<
      "SOL" | "USDC"
    >("SOL");
    const buyCurrency = externalBuyCurrency ?? internalBuyCurrency;
    const setBuyCurrency = setExternalBuyCurrency ?? setInternalBuyCurrency;

    React.useEffect(() => {
      if (setSolAmountTypeValue) {
        setSolAmountTypeValue(solAmountType);
      }
    }, [solAmountType]);

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

    return (
      <div ref={ref}>
        <div
          className="flex h-auto w-full flex-col items-center justify-center rounded-lg p-3"
          style={
            currentTheme === "original"
              ? {
                  backgroundImage: `linear-gradient(to bottom, #131320, ${theme.background2.backgroundColor}, #131320)`,
                }
              : {
                  ...theme?.cosmoCard2.content,
                  border: "1px solid " + theme?.cosmoCardDiscord1.content,
                }
          }
        >
          {type === "buy" && (
            <div className="mb-2 flex w-full items-center justify-between">
              <p className="font-geistRegular text-sm font-normal leading-[18px] text-[#9191A4]">
                Amount
              </p>
              <Select
                value={buyCurrency}
                onValueChange={(value) =>
                  setBuyCurrency(value as "SOL" | "USDC")
                }
              >
                <SelectTrigger className="h-6 w-28">
                  <span className="inline-block text-nowrap font-geistSemiBold text-fontColorPrimary">
                    <SelectValue placeholder="Select Type" />
                  </span>
                </SelectTrigger>
                <SelectContent className="z-[1000]">
                  <SelectItem value="SOL">
                    <div className="flex items-center gap-x-0.5 font-geistSemiBold">
                      <div className="relative aspect-square size-4 flex-shrink-0">
                        <CachedImage
                          src="/icons/solana-sq.svg"
                          alt="Solana SQ Icon"
                          fill
                          quality={50}
                          className="object-contain"
                        />
                      </div>
                      <p>Solana</p>
                    </div>
                  </SelectItem>
                  <SelectItem value="USDC">
                    <div className="flex items-center gap-x-0.5 font-geistSemiBold">
                      <div className="relative aspect-square size-4 flex-shrink-0">
                        <CachedImage
                          src="/icons/usdc-colored.svg"
                          alt="USDC Icon"
                          fill
                          quality={50}
                          className="object-contain"
                        />
                      </div>
                      <p>USDC</p>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="grid w-full grid-cols-3 gap-x-2 gap-y-2">
            {/* {(solAmountType == "SOL" */}
            {(!!quickPickList
              ? quickPickList
              : type === "buy"
                ? (DEFAULT_QUICK_PICK_SOL_LIST || [])
                : (DEFAULT_QUICK_PICK_PERCENTAGE_LIST || [])
            )?.map((quickPickValue, index) => {
              const isSelected =
                quickPickValue === pickerValue && lastFocusOn == "picker";

              return (
                <React.Fragment key={quickPickValue + "_" + index}>
                  <BaseButton
                    variant="rounded"
                    size="long"
                    onClick={() => {
                      setLastFocusOn?.("picker");
                      setPickerValue?.(quickPickValue);
                    }}
                    className={cn(
                      "flex h-[32px] items-center justify-center gap-1 focus:border-primary",
                      isSelected &&
                        "border-primary bg-primary/[8%] text-primary",
                    )}
                    type="button"
                  >
                    {/* {solAmountType === "%" ? ( */}
                    {type === "sell" || type === "swap" ? (
                      <>
                        <span className="inline-block text-nowrap font-geistSemiBold text-sm leading-3">
                          {quickPickValue}
                        </span>
                        <span className="font-geistSemiBold text-sm">%</span>
                      </>
                    ) : (
                      <>
                        <div className="relative aspect-square size-4 flex-shrink-0">
                          <CachedImage
                            src={
                              buyCurrency === "SOL"
                                ? "/icons/solana-sq.svg"
                                : "/icons/usdc-colored.svg"
                            }
                            alt={
                              buyCurrency === "SOL"
                                ? "Solana SQ Icon"
                                : "USDC Icon"
                            }
                            fill
                            quality={50}
                            className="object-contain"
                          />
                        </div>
                        <span className="inline-block text-nowrap font-geistSemiBold text-sm leading-3">
                          {quickPickValue}
                        </span>
                      </>
                    )}
                  </BaseButton>
                </React.Fragment>
              );
            })}
          </div>
          <Separator className="my-2.5" fixedHeight={1} />
          <div
            className={cn(
              "flex w-full",
              type == "swap" && "grid grid-cols-2 gap-x-2",
            )}
          >
            {type === "swap" ? (
              <Select
                value={solAmountType}
                onValueChange={(value) =>
                  setSolAmountType(value as "SOL" | "%")
                }
              >
                <SelectTrigger className="h-[32px] w-full">
                  <span className="inline-block text-nowrap font-geistSemiBold text-fontColorPrimary">
                    <SelectValue placeholder="Select Type" />
                  </span>
                </SelectTrigger>
                <SelectContent className="z-[1000]">
                  <SelectItem value="SOL" className="font-geistSemiBold">
                    SOL
                  </SelectItem>
                  <SelectItem value="%" className="font-geistSemiBold">
                    %
                  </SelectItem>
                </SelectContent>
              </Select>
            ) : (
              ""
            )}
            <div
              onClick={() => setLastFocusOn?.("input")}
              className="flex-grow"
            >
              <Input
                type="text"
                value={value}
                className={cn(lastFocusOn == "input" && "border-primary")}
                {...(((solAmountType === "SOL" && type == "swap") ||
                  type == "buy") && {
                  isNumeric: true,
                  decimalScale: 9,
                  onNumericValueChange: ({ floatValue }) => {
                    const newValue = floatValue === undefined ? 0 : floatValue;
                    setLastFocusOn?.("input");
                    if (!!handleChange) {
                      handleChange({
                        target: { value: String(newValue) },
                      } as React.ChangeEvent<HTMLInputElement>);
                    } else {
                      setPickerValue?.(0);
                      onChange(newValue);
                    }
                  },
                })}
                onChange={
                  !!handleChange
                    ? handleChange
                    : (e: React.ChangeEvent<HTMLInputElement>) => {
                        const value = parseFloat(e.target.value);
                        setLastFocusOn?.("input");
                        if (!isNaN(value) && value >= 0 && value <= 100) {
                          onChange(value);
                          setPickerValue?.(0);
                        } else if (isNaN(value)) {
                          onChange(0);
                        }
                      }
                }
                isError={isError}
                placeholder="Enter Amount"
                prefixEl={
                  ((type == "swap" && solAmountType !== "%") ||
                    type == "buy") && (
                    <div className="absolute left-3 flex aspect-square h-4 w-4 flex-shrink-0 items-center justify-center text-fontColorPrimary">
                      <CachedImage
                        src={
                          buyCurrency === "SOL"
                            ? "/icons/solana-sq.svg"
                            : "/icons/usdc-colored.svg"
                        }
                        alt={
                          buyCurrency === "SOL" ? "Solana SQ Icon" : "USDC Icon"
                        }
                        fill
                        quality={50}
                        className="object-contain"
                      />
                    </div>
                  )
                }
                suffixEl={
                  solAmountType === "%" &&
                  type !== "buy" && (
                    <div className="absolute right-3 flex aspect-square h-4 w-4 flex-shrink-0 items-center justify-center text-fontColorPrimary">
                      %
                    </div>
                  )
                }
              />
            </div>
          </div>
        </div>
      </div>
    );
  },
);

SellBuyInputAmount.displayName = "SellBuyInputAmount";

export default React.memo(SellBuyInputAmount);
