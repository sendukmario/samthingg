"use client";

import { cn } from "@/libraries/utils";
import React from "react";

const GradientProgressBar = ({
  bondingCurveProgress,
  className,
  type = "radial",
  variant = "primary",
  isTokenBCProgress = false,
}: {
  bondingCurveProgress: number;
  className?: string;
  type?: "radial" | "linear";
  variant?: "primary" | "cupsey";
  isTokenBCProgress?: boolean;
}) => {
  const isComplete = bondingCurveProgress >= 100;

  return (
    <>
      {type === "radial" && (
        <div
          className={cn(
            "flex h-[10px] w-full items-center justify-start overflow-hidden rounded-[8px] bg-white/[4%]",
            className,
          )}
        >
          <div
            style={{ width: `${bondingCurveProgress}%` }}
            className={cn(
              "relative h-full overflow-hidden rounded-full",
              isComplete ? "bg-success" : "bg-primary",
            )}
          >
            <span
              style={{
                background:
                  variant === "primary"
                    ? isComplete && isTokenBCProgress
                      ? "radial-gradient(ellipse at top, #E0FFF5 0%, #B6F6DF 3%, #8EF0CD 10%, #6FEBC0 17%, #50D7B0 25%, #3DBF9C 32%, #34A788 41%, #2B8E75 73%, #1E6C57 100%)"
                      : "radial-gradient(ellipse at top, #FFE2FF 0%, #FAD2FF 3%, #F0B0FF 10%, #E896FF 17%, #E383FF 25%, #DF74FF 32%, #DF74FF 41%, #673EC0 73%, #562495 100%)"
                    : isComplete
                      ? "#50d7b0"
                      : "#898eff",
              }}
              className="absolute left-1/2 top-0 h-[20px] w-[115%] -translate-x-1/2"
            ></span>
          </div>
        </div>
      )}

      {type === "linear" && (
        <div
          className={cn(
            "flex h-1 w-full items-center justify-start overflow-hidden rounded-[8px] bg-[#202037]",
            className,
          )}
        >
          <div
            style={{ width: `${bondingCurveProgress}%` }}
            className={cn(
              "relative h-full overflow-hidden rounded-full",
              variant === "primary"
                ? isComplete
                  ? "bg-gradient-to-r from-[#1E6C57] to-[#6FEBC0]"
                  : "bg-gradient-to-r from-[#562495] to-[#DF74FF]"
                : isComplete
                  ? "bg-[#50d7b0]"
                  : "bg-[#898eff]",
            )}
          ></div>
        </div>
      )}
    </>
  );
};

export default GradientProgressBar;
