"use client";

import Image from "next/image";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/libraries/utils";

interface BadgeWithTooltipProps {
  badgeSrc: string;
  alt: string;
  label: string;
  value: string | number;
  className?: string;
  badgeSize?: {
    height: number;
    width: number;
  };
  onClick?: () => void;
  isSelected?: boolean;
  selectedHolder?: boolean;
}

export default function BadgeWithTooltip({
  badgeSrc,
  alt,
  label,
  value,
  className,
  badgeSize = { height: 32, width: 32 },
  onClick,
  isSelected,
  selectedHolder,
}: BadgeWithTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          onClick={onClick}
          className={cn(
            "cursor-pointer rounded-lg border border-border p-2 transition-colors duration-300",
            isSelected && "border-[#DF74FF] bg-[#DF74FF]/[16%]",
            selectedHolder && "border-[#4CAF50] bg-[#4CAF50]/[4%]",
            className,
          )}
        >
          <Image
            src={badgeSrc}
            alt={alt}
            height={badgeSize.height}
            width={badgeSize.width}
            quality={100}
            className="object-contain"
          />
        </TooltipTrigger>
        <TooltipContent
          side="right"
          align="start"
          sideOffset={5}
          className="grid w-auto flex-shrink-0 border-none bg-secondary px-2 py-4"
        >
          <span className="inline-block text-nowrap text-xs leading-4 text-fontColorSecondary">
            {label}
          </span>
          <span className="inline-block text-nowrap text-center text-xs leading-4 text-white">
            {typeof value === "number" ? value.toLocaleString() : value}
          </span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
