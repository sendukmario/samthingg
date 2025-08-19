"use client";

// ######## Components 🧩 ########
import Image from "next/image";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
// ######## Utils & Helpers 🤝 ########
import BaseButton from "@/components/customs/buttons/BaseButton";
import { X } from "lucide-react";
import AlertTable from "@/components/customs/tables/footer/AlertTable";
import { cn } from "@/libraries/utils";

// ######## Main Component 🚀 ########
export default function AlertsModalContent({
  toggleModal,
  variant = "default",
}: {
  toggleModal?: () => void;
  variant?: "default" | "cupsey-snap";
}) {
  return (
    <>
      <div
        className={cn(
          "flex w-full flex-col items-center justify-between max-md:gap-3",
        )}
      >
        <div
          className={cn(
            "flex h-[58px] w-full items-center justify-between border-border p-4 max-md:border-b md:h-[56px]",
            variant === "cupsey-snap" && "py-2 md:h-fit",
          )}
        >
          <h4
            className={cn(
              "text-nowrap font-geistSemiBold text-[18px] text-fontColorPrimary",
              variant === "cupsey-snap" && "md:text-[14px]",
            )}
          >
            Alerts
          </h4>

          {/* X for mobile close modal */}
          <button
            onClick={toggleModal}
            className="relative aspect-square h-6 w-6 flex-shrink-0 duration-300 hover:opacity-70 md:hidden"
          >
            <Image
              src="/icons/close.png"
              alt="Close Icon"
              fill
              quality={100}
              className="object-contain"
            />
          </button>
        </div>
      </div>

      {/* Table Tabs */}
      <div
        className={cn(
          "flex w-full flex-grow flex-col",
          variant === "cupsey-snap" && "h-full",
        )}
      >
        <div className="relative grid w-full flex-grow grid-cols-1">
          <AlertTable variant={variant} />
        </div>
      </div>
    </>
  );
}
