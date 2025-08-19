"use client";

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/libraries/utils";

const TOOLTIP_DELAY = 100;
const DEFAULT_BG_COLOR = "#2B2B3B";

const animationStyles = {
  top: "animate-slideDownAndFade",
  bottom: "animate-slideUpAndFade",
  left: "animate-slideRightAndFade",
  right: "animate-slideLeftAndFade",
} as const;

const tooltipBaseClassName =
  "relative z-[999] rounded-sm bg-[#2B2B3B] px-3 py-1.5 text-xs text-fontColorPrimary shadow-[0_4px_16px_#00000] backdrop-blur-[4px]";

const tooltipDevSoldClassName =
  "relative z-[999] rounded-[6px] p-0 text-xs text-fontColorPrimary shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-[8px] border-2 border-[#292947]";

const tooltipBagsTokenRoyaltiesClassName =
  "relative z-[999] rounded-[6px] p-0 text-xs text-fontColorPrimary shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-[8px] border-2 border-[#292947]";

// Simplified TooltipContent with better memoization
const TooltipContent = React.memo(
  React.forwardRef<
    React.ElementRef<typeof TooltipPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content> & {
      showTriangle?: boolean | undefined;
      tooltipArrowBgColor?: string;
      isWithAnimation?: boolean;
      arrowWidth?: number;
      arrowHeight?: number;
      isDevSoldTooltip?: boolean;
      isCreator?: boolean;
    }
  >(
    (
      {
        className,
        showTriangle = true,
        tooltipArrowBgColor = DEFAULT_BG_COLOR,
        side,
        sideOffset,
        isWithAnimation = true,
        arrowWidth = 11,
        arrowHeight = 5,
        isDevSoldTooltip = false,
        isCreator = false,
        ...props
      },
      ref,
    ) => {
      const defaultSide = isDevSoldTooltip || isCreator ? "bottom" : "top";
      const finalSide = side || defaultSide;
      const defaultSideOffset = isDevSoldTooltip || isCreator ? 10 : 4;
      const finalSideOffset = sideOffset || defaultSideOffset;
      const finalShowTriangle = isDevSoldTooltip || isCreator ? false : showTriangle;

      return (
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            ref={ref}
            side={finalSide}
            sideOffset={finalSideOffset}
            className={cn(
              isDevSoldTooltip ? tooltipDevSoldClassName : isCreator ? tooltipBagsTokenRoyaltiesClassName : tooltipBaseClassName,
              isWithAnimation && animationStyles[finalSide],
              className,
            )}
            style={
              isDevSoldTooltip || isCreator
                ? {
                    background: "linear-gradient(135deg, #202037 0%, #292947 100%)",
                    borderColor: "#292947",
                  }
                : undefined
            }
            {...props}
          >
            {finalShowTriangle && (
              <TooltipPrimitive.Arrow
                width={arrowWidth}
                height={arrowHeight}
                style={{
                  fill: isDevSoldTooltip ? "#1F2937" : tooltipArrowBgColor,
                }}
              />
            )}
            {props.children}
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      );
    },
  ),
);

TooltipContent.displayName = TooltipPrimitive.Content.displayName;

// Simplified TooltipTrigger
const TooltipTrigger = React.memo(TooltipPrimitive.Trigger);
TooltipTrigger.displayName = TooltipPrimitive.Trigger.displayName;

// Optimized TooltipProvider with reduced state management
const TooltipProviderCustom = React.memo(
  ({ children }: { children: React.ReactNode }) => (
    <TooltipPrimitive.Provider delayDuration={0}>
      <TooltipErrorBoundary>
        <TooltipPrimitive.Root>{children}</TooltipPrimitive.Root>
      </TooltipErrorBoundary>
    </TooltipPrimitive.Provider>
  ),
);

TooltipProviderCustom.displayName = "TooltipProviderCustom";

// Simplified ErrorBoundary
class TooltipErrorBoundary extends React.PureComponent<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    return this.state.hasError ? null : this.props.children;
  }
}

// Simplified Tooltip
const Tooltip = React.memo(TooltipPrimitive.Root);
Tooltip.displayName = TooltipPrimitive.Root.displayName;

export {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProviderCustom as TooltipProvider,
  tooltipDevSoldClassName,
  tooltipBagsTokenRoyaltiesClassName,
};
