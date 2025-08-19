import React, { useState, useMemo, useCallback } from "react";
import { Slider } from "@/components/ui/slider";
import { debounce } from "lodash";
import { Input } from "@/components/ui/input";

interface TimeIntervalSliderProps {
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  autoSave?: boolean;
  debounceDelay?: number;
}

const TimeIntervalSlider = ({
  min = 0.1,
  max = 5.0,
  step = 0.1,
  defaultValue = 2.5,
  onValueChange,
  autoSave = false,
  debounceDelay = 500,
}: TimeIntervalSliderProps) => {
  const [value, setValue] = useState(defaultValue);
  const [inputValue, setInputValue] = useState(defaultValue.toFixed(1));
  const [isInputFocused, setIsInputFocused] = useState(false);

  // Create a debounced version of the save function
  const debouncedSave = useMemo(
    () =>
      debounce((newValue: number) => {
        if (onValueChange) {
          onValueChange(newValue);
        }

        if (autoSave) {
          console.log("Auto-saving time interval:", newValue);
        }
      }, debounceDelay),
    [onValueChange, autoSave, debounceDelay],
  );

  const handleValueChange = useCallback(
    (newValue: number[]) => {
      const roundedValue = Math.round(newValue[0] * 10) / 10;
      setValue(roundedValue);

      // Update input value only if not focused
      if (!isInputFocused) {
        setInputValue(roundedValue.toFixed(1));
      }

      // Call the debounced save function
      debouncedSave(roundedValue);
    },
    [debouncedSave, isInputFocused],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputVal = e.target.value;

    // Always allow empty input, decimal point alone, or single "0"
    if (inputVal === "" || inputVal === "." || inputVal === "0") {
      setInputValue(inputVal);
      return;
    }

    // For any other input, check if it's a valid number
    const numValue = parseFloat(inputVal);

    if (!isNaN(numValue)) {
      // Strict validation: only allow values within bounds
      if (numValue >= min && numValue <= max) {
        setInputValue(inputVal);
        const roundedValue = Math.round(numValue * 10) / 10;
        setValue(roundedValue);
        debouncedSave(roundedValue);
      } else if (inputVal === "0.") {
        // Special case: allow "0." as intermediate state
        setInputValue(inputVal);
      }
      // Otherwise, don't update (this blocks invalid inputs)
    }
  };

  const handleInputBlur = () => {
    setIsInputFocused(false);

    // Validate and correct input on blur
    const numValue = parseFloat(inputValue);

    if (isNaN(numValue) || numValue < min) {
      setValue(min);
      setInputValue(min.toFixed(1));
      debouncedSave(min);
    } else if (numValue > max) {
      setValue(max);
      setInputValue(max.toFixed(1));
      debouncedSave(max);
    } else {
      const roundedValue = Math.round(numValue * 10) / 10;
      setValue(roundedValue);
      setInputValue(roundedValue.toFixed(1));
      debouncedSave(roundedValue);
    }
  };

  const handleInputFocus = () => {
    setIsInputFocused(true);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    }
  };

  // Cleanup debounced function on unmount
  React.useEffect(() => {
    return () => {
      debouncedSave.cancel();
    };
  }, [debouncedSave]);

  // Convert value to percentage for the slider (0-100)
  const percentageValue = ((value - min) / (max - min)) * 100;

  return (
    <section className="flex flex-col gap-y-3 bg-none">
      <h3 className="font-geistSemiBold text-sm text-white">Time Interval</h3>
      <div className="relative flex h-full w-full flex-col gap-y-4 overflow-hidden rounded-lg p-4 md:bg-[#1B1B24]">
        <p className="text-sm text-fontColorSecondary">
          The interval determines the delay between each notification appearing
          automatically in preview mode. Time range: 0.1-5.0 seconds.
        </p>
        <div className="flex items-center gap-3">
          <Slider
            value={[value]}
            onValueChange={handleValueChange}
            min={min}
            max={max}
            step={step}
            customValue={Math.round(percentageValue)}
            className="w-full"
          />

          <div className="flex items-center gap-2 rounded-lg border border-secondary">
            <Input
              type="number"
              value={inputValue}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              onFocus={handleInputFocus}
              onKeyDown={handleInputKeyDown}
              min={min}
              max={max}
              step={step}
              suffixEl={
                <span className="absolute right-3 text-sm text-[#9191A4]">
                  seconds
                </span>
              }
              className="w-32 pl-3"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default TimeIntervalSlider;
