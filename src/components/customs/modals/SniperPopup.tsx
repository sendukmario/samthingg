import { useCupseySnap } from "@/stores/use-cupsey-snap.store";
import { useWindowSizeStore } from "@/stores/use-window-size.store";
import React, { useEffect, useRef, useState } from "react";
import { ResizeHandler, Size } from "./contents/footer/pnl-tracker/types";
import { Resizable } from "re-resizable";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/libraries/utils";
import SniperModalContent from "./contents/footer/SniperModalContent";
import { useCustomizeTheme } from "@/hooks/use-customize-theme";

const DRAG_AREA_MARGIN_BOTTOM = 0;
type Position = { x: number; y: number };

const SniperPopup = (
  {
    // isOpen,
    // onOpenChange,
  }: {
    isOpen?: boolean;
    onOpenChange?: (val: boolean) => void;
  },
) => {
  const {
    isOpenSniper: isOpen,
    setIsOpenSniper: onOpenChange,
    sniperSize: size,
    setSniperSize: setSize,
  } = useCupseySnap();
  const theme = useCustomizeTheme();
  const { width, height } = useWindowSizeStore();
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 });
  const resizeStartRef = useRef({
    width: 0,
    height: 0,
    posX: 0,
    posY: 0,
  });
  const initializedRef = useRef(false);

  // Calculate initial centered position ONLY when first opened or window size changes
  useEffect(() => {
    if (width && height && isOpen) {
      if (!initializedRef.current) {
        const isValidPosition =
          position.x + size.width <= width &&
          position.y + size.height <= height;

        if (!isValidPosition || (position.x === 0 && position.y === 0)) {
          setPosition({
            x: Math.round((width - size.width) / 2),
            y: Math.round((height - size.height) / 2),
          });
        }

        initializedRef.current = true;
      }
    } else if (!isOpen) {
      initializedRef.current = false;
    }
  }, [width, height, isOpen, position, size.width, size.height]);

  // Initialize resize state
  const handleResizeStart = () => {
    resizeStartRef.current = {
      width: size.width,
      height: size.height,
      posX: position.x,
      posY: position.y,
    };
  };

  const handleResize: ResizeHandler = (_event, direction, _ref, d) => {
    let newWidth = Math.round(resizeStartRef.current.width + d.width);
    let newHeight = Math.round(resizeStartRef.current.height + d.height);

    const viewportWidth = window.innerWidth;

    let newPosX = position.x;
    let newPosY = position.y;

    if (direction.includes("left")) {
      const widthDiff = newWidth - resizeStartRef.current.width;
      newPosX = resizeStartRef.current.posX - widthDiff;

      // Prevent jumping offscreen
      if (newPosX < 0) {
        newPosX = 0;
        newWidth = resizeStartRef.current.width + resizeStartRef.current.posX; // prevent overflow
        newWidth = Math.min(newWidth, viewportWidth);
      }
    }
    if (direction.includes("topLeft")) {
      const widthDiff = newWidth - resizeStartRef.current.width;
      newPosX = resizeStartRef.current.posX - widthDiff;
      newPosY = resizeStartRef.current.posY - d.height;

      // Prevent jumping offscreen
      if (newPosX < 0) {
        newPosX = 0;
        newWidth = resizeStartRef.current.width + resizeStartRef.current.posX; // prevent overflow
        newWidth = Math.min(newWidth, viewportWidth);
        newHeight = resizeStartRef.current.height + resizeStartRef.current.posY;
      }
    }
    if (direction.includes("bottomLeft")) {
      const widthDiff = newWidth - resizeStartRef.current.width;
      newPosX = resizeStartRef.current.posX - widthDiff;

      // Prevent jumping offscreen
      if (newPosX < 0) {
        newPosX = 0;
        newWidth = resizeStartRef.current.width + resizeStartRef.current.posX; // prevent overflow
        newWidth = Math.min(newWidth, viewportWidth);
      }
    }

    if (direction.includes("top")) {
      newPosY = Math.round(resizeStartRef.current.posY - d.height / 2);
    }

    setSize({ width: newWidth, height: newHeight });
    setPosition({ x: newPosX, y: newPosY });
  };

  // Handle header drag start
  const handleDragStart = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.closest("input") ||
      target.closest("textarea") ||
      target.closest("select") ||
      target.closest("button")
    ) {
      return;
    }

    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      posX: position.x,
      posY: position.y,
    };
    document.body.style.userSelect = "none";
  };

  // Handle drag move
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !width || !height) return;

      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;

      let newX = dragStartRef.current.posX + deltaX;
      let newY = dragStartRef.current.posY + deltaY;

      newX = Math.max(0, Math.min(newX, width - size.width));
      newY = Math.max(
        0,
        Math.min(newY, height - DRAG_AREA_MARGIN_BOTTOM - size.height),
      );

      setPosition({
        x: Math.round(newX),
        y: Math.round(newY),
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.userSelect = "";
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, width, height, size]);
  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{
              duration: 0.2,
              ease: "easeOut",
            }}
            className="group fixed z-[990] overflow-visible max-lg:hidden"
            style={{
              top: `${position.y}px`,
              left: `${position.x}px`,
              width: `${size.width}px`,
              height: `${size.height}px`,
              willChange: "transform",
              transform: "translateZ(0)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Resizable
              size={size}
              onResizeStart={handleResizeStart}
              onResize={handleResize}
              minWidth={600}
              minHeight={500}
              maxWidth={1200}
              maxHeight={700}
              bounds="window"
              handleStyles={{
                bottomRight: { cursor: "se-resize" },
                bottomLeft: { cursor: "sw-resize" },
                topRight: { cursor: "ne-resize" },
                topLeft: { cursor: "nw-resize" },
                right: { cursor: "e-resize" },
                left: { cursor: "w-resize" },
                bottom: { cursor: "s-resize" },
                top: { cursor: "n-resize" },
              }}
              handleClasses={{
                bottomRight: "bg-transparent !size-10",
                bottomLeft: "bg-transparent !size-10",
                topRight: "bg-transparent !size-10",
                topLeft: "bg-transparent !size-10",
                right: "bg-transparent !w-8",
                left: "bg-transparent !w-8",
                bottom: "bg-transparent !h-8",
                top: "bg-transparent !h-8",
              }}
              className={cn("relative h-full w-full p-[8px]")}
            >
              <motion.div
                className={cn(
                  "relative flex h-full w-full flex-col overflow-visible rounded-lg border border-border p-[0.5px] shadow-[0_0_20px_0_#000000]",
                )}
                onMouseDown={handleDragStart}
                id="pnl-tracker-card"
                animate={{
                  boxShadow: isDragging
                    ? "0 0 30px 0 rgba(0,0,0,0.25)"
                    : "0 0 20px 0 rgba(0,0,0,0.2)",
                }}
                style={{
                  cursor: isDragging ? "grabbing" : "default",
                  transformOrigin: "center center",
                  ...theme?.background,
                }}
              >
                <SniperModalContent
                  variant="cupsey-snap"
                  toggleModal={() => onOpenChange(!isOpen)}
                />
              </motion.div>
            </Resizable>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SniperPopup;
