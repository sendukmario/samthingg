"use client";

import { useEffect, useRef, useCallback, useMemo } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/libraries/utils";
import { Level } from "@/apis/rest/earn-new";
import { motion } from "framer-motion";
import { useCustomizeTheme } from "@/hooks/use-customize-theme";

interface EarnLevelCarouselProps {
  loading?: boolean;
  levels: Level[];
  focusedLevel: Level | null;
  onFocusLevelChange: (level: Level) => void;
  isPartner?: boolean;
}

export function EarnLevelCarousel({
  loading,
  levels,
  focusedLevel,
  onFocusLevelChange,
  isPartner = false,
}: EarnLevelCarouselProps) {
  const theme = useCustomizeTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const isUserDraggingRef = useRef(false);
  const dragInfo = useRef({ startX: 0, scrollX: 0, dragging: false });
  const scrollTimeout = useRef<number | null>(null);

  const scrollTo = useCallback((level: Level) => {
    const container = containerRef.current;
    const el = container?.querySelector(
      `[data-tier="${level.level}"]`,
    ) as HTMLElement;
    if (container && el) {
      const offset =
        el.offsetLeft + el.offsetWidth / 2 - container.offsetWidth / 2;
      container.scrollTo({ left: offset, behavior: "smooth" });
    }
  }, []);

  useEffect(() => {
    if (!focusedLevel) return;
    scrollTo(focusedLevel);
  }, [focusedLevel, scrollTo]);

  const handleScroll = () => {
    if (scrollTimeout.current) window.clearTimeout(scrollTimeout.current);
    scrollTimeout.current = window.setTimeout(() => {
      const container = containerRef.current;
      if (!container) return;
      const center = container.scrollLeft + container.offsetWidth / 2;
      let closest = levels[0];
      let minDist = Infinity;
      levels.forEach((level) => {
        const el = container.querySelector(
          `[data-tier="${level.level}"]`,
        ) as HTMLElement;
        if (el) {
          const elCenter = el.offsetLeft + el.offsetWidth / 2;
          const dist = Math.abs(center - elCenter);
          if (dist < minDist) {
            minDist = dist;
            closest = level;
          }
        }
      });
      onFocusLevelChange(closest);
    }, 100);
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseDown = (e: MouseEvent | TouchEvent) => {
      const clientX =
        "touches" in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      dragInfo.current = {
        startX: clientX,
        scrollX: container.scrollLeft,
        dragging: true,
      };
      isUserDraggingRef.current = true;
    };

    const handleMouseMove = (e: MouseEvent | TouchEvent) => {
      if (!dragInfo.current.dragging) return;
      const clientX =
        "touches" in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const delta = clientX - dragInfo.current.startX;
      container.scrollLeft = dragInfo.current.scrollX - delta;
    };

    const handleMouseUp = () => {
      if (!dragInfo.current.dragging) return;
      dragInfo.current.dragging = false;
      isUserDraggingRef.current = false;
      handleScroll();
    };

    const handleScrollEvent = () => handleScroll();

    container.addEventListener("mousedown", handleMouseDown);
    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseup", handleMouseUp);
    container.addEventListener("mouseleave", handleMouseUp);
    container.addEventListener("touchstart", handleMouseDown, {
      passive: true,
    });
    container.addEventListener("touchmove", handleMouseMove, { passive: true });
    container.addEventListener("touchend", handleMouseUp);
    container.addEventListener("scroll", handleScrollEvent);

    return () => {
      container.removeEventListener("mousedown", handleMouseDown);
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseup", handleMouseUp);
      container.removeEventListener("mouseleave", handleMouseUp);
      container.removeEventListener("touchstart", handleMouseDown);
      container.removeEventListener("touchmove", handleMouseMove);
      container.removeEventListener("touchend", handleMouseUp);
      container.removeEventListener("scroll", handleScrollEvent);
    };
  }, [levels]);

  const handlePrev = () => {
    const idx = levels.findIndex((l) => l.level === focusedLevel?.level);
    if (idx > 0) onFocusLevelChange(levels[idx - 1]);
  };

  const handleNext = () => {
    const idx = levels.findIndex((l) => l.level === focusedLevel?.level);
    if (idx < levels.length - 1) onFocusLevelChange(levels[idx + 1]);
  };

  return (
    <div className="relative mx-auto h-[132px] overflow-hidden max-lg:max-w-[390px] max-sm:max-w-[320px]">
      <div
        className="absolute left-0 top-0 z-10 flex h-full w-[72px] items-center justify-start"
        style={{
          backgroundImage: `linear-gradient(to right, ${theme.background.backgroundColor}, transparent)`,
        }}
      >
        <button
          onClick={handlePrev}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white"
        >
          <ChevronLeft className="h-4 w-4 text-black" />
        </button>
      </div>

      <div
        ref={containerRef}
        className={cn(
          "flex h-full snap-x snap-mandatory scroll-px-[72px] items-end gap-6 overflow-x-auto scroll-smooth px-[188px] scrollbar-hide max-md:pl-[120px]",
          isUserDraggingRef.current ? "cursor-grabbing" : "cursor-grab",
        )}
        style={{
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
          contain: "strict",
          willChange: "scroll-position",
          scrollBehavior: "smooth",
        }}
      >
        {loading
          ? Array.from({ length: 6 })?.map((_, index) => (
              <div
                key={index}
                className="snap-center"
                data-tier={`skeleton-${index}`}
              >
                <LevelTierItemSkeleton />
              </div>
            ))
          : (levels || [])?.map((level) => (
              <div
                key={level.level}
                data-tier={level.level}
                className="snap-center"
              >
                <LevelTierItem
                  level={level}
                  focus={focusedLevel?.level === level.level}
                  onFocus={onFocusLevelChange}
                  isPartner={isPartner}
                />
              </div>
            ))}
      </div>

      <div
        className="absolute right-0 top-0 z-10 flex h-full w-[72px] items-center justify-end"
        style={{
          backgroundImage: `linear-gradient(to left, ${theme.background.backgroundColor}, transparent)`,
        }}
      >
        <button
          onClick={handleNext}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white"
        >
          <ChevronRight className="h-4 w-4 text-black" />
        </button>
      </div>
    </div>
  );
}

interface LevelTierItemProps {
  level: Level;
  focus?: boolean;
  onFocus: (level: Level) => void;
  isPartner?: boolean;
}

function LevelTierItem({
  level,
  focus = false,
  onFocus,
  isPartner = false,
}: LevelTierItemProps) {
  const isLocked = level.status === "locked";

  const indicator = useMemo(() => {
    if (isPartner) return "🎯";
    if (level.status === "pending") return "🟣";
    if (level.status === "completed") return "🎯";
    return "🔒";
  }, [level.status, isPartner]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ type: "tween", stiffness: 300, damping: 20 }}
      className="relative flex flex-col items-center justify-end gap-3"
    >
      {focus && (
        <div className="absolute -left-[6px] -top-[6px] h-[88px] w-[88px] rounded-full bg-gradient-to-b from-[#E077FF] to-[#5E30A8] p-[3px]">
          <div className="h-full w-full rounded-full bg-background" />
        </div>
      )}
      <button
        onClick={() => onFocus(level)}
        className="relative flex h-[76px] w-[76px] items-center justify-center rounded-full border border-[#242436] bg-gradient-to-b from-secondary via-background to-background focus:outline-none"
      >
        <Image
          src={`/icons/earn/level/${level.level.toLowerCase()}.svg`}
          alt="Level Icon"
          width={50}
          height={58}
          quality={50}
          draggable={false}
          priority
          className={cn(isLocked ? "grayscale" : "grayscale-0")}
        />
        <div className="absolute left-[52px] top-[50px] flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-sm backdrop-blur">
          {indicator}
        </div>
      </button>
      <span
        className={cn(
          "w-full text-center text-[16px] font-[400] leading-6",
          focus ? "text-white" : "text-[#9191A4]",
        )}
      >
        {level.level}
      </span>
    </motion.div>
  );
}

function LevelTierItemSkeleton() {
  return (
    <div className="relative flex flex-col items-center justify-end gap-3">
      <div className="size-[76px] rounded-full bg-gradient-to-r from-[#FFFFFF05] to-[#FFFFFF14]" />
      <span className="h-6 w-16 rounded-md bg-gradient-to-r from-[#FFFFFF05] to-[#FFFFFF14]"></span>
    </div>
  );
}
