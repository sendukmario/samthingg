"use client";

import React, { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import CircularSegmentedRing from "@/components/customs/CircularSegmentedRing";
import type { WalletWithColor } from "@/stores/wallets/use-wallet-highlight-colors.store";
import { AvatarBorderRadiusSetting } from "@/apis/rest/settings/settings";
import SquareSegmentedRing from "./SquareSegmentedRing";

interface AvatarHighlightWrapperProps {
  children: React.ReactNode;
  size: number;
  walletHighlights: WalletWithColor[];
  avatarBorderRadius?: AvatarBorderRadiusSetting;
}

export const AvatarHighlightWrapper = React.memo(
  ({
    children,
    size,
    walletHighlights,
    avatarBorderRadius = "rounded",
  }: AvatarHighlightWrapperProps) => {
    const [open, setOpen] = useState(false);

    let timeoutId: NodeJS.Timeout;

    const handleMouseEnter = () => {
      clearTimeout(timeoutId);
      setOpen(true);
    };

    const handleMouseLeave = () => {
      timeoutId = setTimeout(() => setOpen(false), 100);
    };

    const highlights = (walletHighlights || [])?.filter(
      (w) => w.color !== "transparent",
    );

    if (highlights.length === 0) {
      return (
        <div
          className="group relative isolate z-50 flex items-center justify-center"
          style={{
            width: size,
            height: size,
          }}
        >
          {children}
        </div>
      );
    }

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className="group relative isolate"
            style={{
              height: size + 2,
              width: size + 2,
              padding: 1,
            }}
          >
            <div className="absolute inset-0">
              {avatarBorderRadius === "squared" ? (
                <SquareSegmentedRing
                  size={size + 2}
                  strokeWidth={3}
                  gapDegree={highlights?.length === 1 ? 0 : 16}
                  segments={(highlights || [])?.map((w) => ({
                    value: 100 / highlights.length,
                    color: w?.color,
                  }))}
                />
              ) : (
                <CircularSegmentedRing
                  size={size + 2}
                  strokeWidth={3}
                  gapDegree={highlights?.length === 1 ? 0 : 16}
                  segments={(highlights || [])?.map((w) => ({
                    value: 100 / highlights?.length,
                    color: w?.color,
                  }))}
                />
              )}
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              {children}
            </div>
          </div>
        </PopoverTrigger>
      </Popover>
    );
  },
);

AvatarHighlightWrapper.displayName = "AvatarHighlightWrapper";
