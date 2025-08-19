"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "@/libraries/utils";
import Image from "next/image";

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & {
    customValue?: number | string;
    type?: "primary" | "secondary" | "bold";
  }
>(({ className, customValue, type, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center",
      type === "bold" && "overflow-hidden",
      className,
    )}
    {...props}
  >
    <SliderPrimitive.Track className={cn("relative h-2 w-full grow overflow-hidden rounded-full bg-white/[6%]",
      type === "bold" && "!h-[32px] bg-[#080811] rounded-[8px]",
    )}>
      <SliderPrimitive.Range className={cn("absolute h-full bg-primary",
        type === "bold" && "rounded-[8px] overflow-hidden",
      )}>
        {type === "bold" && (
          <div
            className="w-full h-full"
            style={{
              backgroundImage: 'url("/images/decorations/slider-decoration.png")',
              backgroundSize: '200px 32px',
              backgroundPosition: '10px 0px',
            }}
          />
        )}
      </SliderPrimitive.Range>
    </SliderPrimitive.Track>

    {type === "bold" ? (
      <SliderPrimitive.Thumb className="relative block">
        <div className={cn("absolute left-1/2 top-1/2 h-[26px] w-[41px] -translate-y-1/2 bg-background rounded-[4px] flex items-center justify-center text-center text-xs leading-none transition-all duration-300 ease-out",
          ((props?.value?.[0] ?? 0) / (props?.max ?? 0)) <= 0.13 ? "-translate-x-[12%] bg-transparent" : "-translate-x-[107%]"
        )}>
          {customValue}
        </div>
      </SliderPrimitive.Thumb>
    ) : (
      <SliderPrimitive.Thumb className="relative block h-5 w-5">
        <div className={cn("absolute left-1/2 top-1/2 block h-10 w-10 -translate-x-1/2 -translate-y-1/2",
          type === "secondary" && "rounded-full bg-background border-[5px] border-primary size-[19px]"
        )}>
          {type === "primary" && (
            <Image
              src="/icons/slider-handler.png"
              alt="Slider Handler Icon"
              fill
              quality={100}
              className="object-contain"
            />
          )}
        </div>

        {type === "primary" ? (
          <div className="pointer-events-none absolute -bottom-6 left-1/2 flex h-[18px] w-auto -translate-x-1/2 items-center justify-center rounded-[4px] bg-white/[16%] px-2">
            <span className="block font-geistSemiBold text-xs text-fontColorPrimary">
              {customValue}%
            </span>
          </div>
        ) : (
          <div className="bg-gradient-to-b from-[#E077FF] to-[#6f4082] rounded-full pointer-events-none absolute -bottom-8 left-1/2 flex items-center justify-center overflow-hidden h-[26px] min-w-[53px] -translate-x-1/2 p-[1px] pb-[2px]">
            <div className="flex items-center justify-center bg-[#3e294a] size-full rounded-full">
              <span className="block font-geistSemiBold text-xs text-fontColorSecondary leading-none">
                {customValue}%
              </span>
            </div>
          </div>
        )}
      </SliderPrimitive.Thumb>
    )}
  </SliderPrimitive.Root>
));
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
