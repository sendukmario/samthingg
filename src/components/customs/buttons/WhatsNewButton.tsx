"use client";

// ######## Libraries 📦 & Hooks 🪝 ########
import React from "react";
import { useWhatsNewStore } from "@/stores/use-whats-new.store";
// ######## Components 🧩 ########
import Image from "next/image";
import BaseButton from "@/components/customs/buttons/BaseButton";

export default function WhatsNewButton() {
  const toggleWhatsNew = useWhatsNewStore((state) => state.toggleWhatsNew);

  return (
    <BaseButton
      suppressHydrationWarning
      type="button"
      onClick={() => toggleWhatsNew()}
      variant="gray"
      size="long"
      className="hidden h-8 w-8 items-center gap-x-2 bg-secondary pl-0 pr-0 focus:bg-white/[6%] xl:flex min-[1750px]:w-auto min-[1750px]:px-2"
      prefixIcon={
        <div className="relative hidden aspect-square size-4 flex-shrink-0 min-[1750px]:block">
          <Image
            src="/icons/whats-new.svg"
            alt="What's New Logo"
            fill
            quality={100}
            className="object-contain"
          />
        </div>
      }
    >
      <div className="relative mx-auto block aspect-square size-4 flex-shrink-0 min-[1750px]:hidden">
        <Image
          src="/icons/whats-new.svg"
          alt="What's New Logo"
          fill
          quality={100}
          className="object-contain"
        />
      </div>
      <span className="hidden text-nowrap text-start font-geistSemiBold text-xs text-fontColorPrimary min-[1750px]:inline-block">
        What&apos;s new
      </span>
    </BaseButton>
  );
}
