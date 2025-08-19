import { memo, useState, useMemo, useCallback, useEffect, useRef } from "react";
import { cn } from "@/libraries/utils";
import { DEX } from "@/types/ws-general";

// Helper function to get formatted time difference
// const getFormattedTimeDiff = (timestamp: number, threshold = 0.5) => {
//   const now = Math.floor(Date.now() / 1000);
//   const normalizedTimestamp =
//     String(timestamp).length > 10
//       ? Math.floor(timestamp / 1000)
//       : Math.floor(timestamp);

//   const difference = now - normalizedTimestamp;

//   if (difference < 0 || difference < threshold) return "Just Now";
//   if (difference < 60) return `${difference.toFixed(0)}s`;
//   if (difference < 3600) return `${Math.floor(difference / 60)}m`;
//   if (difference < 86400) {
//     const hours = Math.floor(difference / 3600);
//     const minutes = Math.floor((difference % 3600) / 60);
//     return `${hours}h ${minutes}m`;
//   }
//   const days = Math.floor(difference / 86400);
//   const hours = Math.floor((difference % 86400) / 3600);
//   return `${days}d ${hours}h`;
// };
const getFormattedTimeDiff = (
  timestamp: number,
  threshold = 0.5,
  shortJustNow = false,
  isDayOnly: boolean = false
) => {
  const now = Math.floor(Date.now() / 1000);
  const normalizedTimestamp =
    String(timestamp).length > 10
      ? Math.floor(timestamp / 1000)
      : Math.floor(timestamp);

  const difference = now - normalizedTimestamp;

  if (difference < 0 || difference < threshold)
    return shortJustNow ? "Now" : "Just Now";
  if (difference < 60) return `${difference.toFixed(0)}s`;
  if (difference < 3600) return `${Math.floor(difference / 60)}m`;
  if (difference < 86400) {
    const hours = Math.floor(difference / 3600);
    const minutes = Math.floor((difference % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }
  if (difference < 2592000) {
    // < 30 days
    const days = Math.floor(difference / 86400);
    const hours = Math.floor((difference % 86400) / 3600);
    return isDayOnly ? `${days}d` : `${days}d ${hours}h`;
  }
  if (difference < 31536000) {
    // < 1 year
    const months = Math.floor(difference / 2592000); // Approx. 30 days per month
    const days = Math.floor((difference % 2592000) / 86400);
    return isDayOnly ? `${months}mo` : `${months}mo ${days}d`;
  }

  const years = Math.floor(difference / 31536000); // 365 days per year
  const months = Math.floor((difference % 31536000) / 2592000);
  return isDayOnly ? `${years}y` : `${years}y ${months}mo`;
};

const TimeDifference = memo(
  ({
    created,
    migrated_time,
    dex,
    className,
    hoursOnly = false,
    shortJustNow = false,
    isDayOnly
  }: {
    created?: number;
    migrated_time?: number;
    dex?: DEX;
    className?: string;
    hoursOnly?: boolean;
    shortJustNow?: boolean;
    isDayOnly?: boolean;
  }) => {
    const [timeDifference, setTimeDifference] = useState("-");

    // Store timestamp in ref to avoid re-renders but maintain access in interval
    const timestampRef = useRef<number | null>(null);

    // Store the interval ID in a ref
    const intervalIdRef = useRef<NodeJS.Timeout | null>(null);

    // Only recalculate timestamp when inputs change
    const selectedTimestamp = useMemo(() => {
      if (!created) return null;
      return dex === "Raydium AMM" ||
        dex === "Raydium CPMM" ||
        dex === "PumpSwap" ||
        dex === "Meteora AMM V2" ||
        dex === "Meteora AMM"
        ? migrated_time
        : created;
    }, [created, migrated_time, dex]);

    // Update timestampRef when selectedTimestamp changes
    useEffect(() => {
      timestampRef.current = selectedTimestamp ?? null;
    }, [selectedTimestamp]);

    // Memoized update function
    const updateTimeDifference = useCallback(() => {
      if (!timestampRef.current) return;

      const newDiff = getFormattedTimeDiff(
        timestampRef.current,
        0.5,
        shortJustNow,
        isDayOnly
      );
      setTimeDifference((prev) => {
        // Only update if different to reduce re-renders
        return prev !== newDiff ? newDiff : prev;
      });
    }, []);

    // Set up the interval
    useEffect(() => {
      // Clear any existing interval
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }

      // Only start interval if we have a timestamp
      if (timestampRef.current !== null) {
        updateTimeDifference();
        intervalIdRef.current = setInterval(updateTimeDifference, 1000);
      }

      return () => {
        if (intervalIdRef.current) {
          clearInterval(intervalIdRef.current);
          intervalIdRef.current = null;
        }
      };
    }, [timestampRef.current, updateTimeDifference]);

    return (
      <span
        className={cn(
          "truncate text-center font-geistSemiBold text-[10px] text-white",
          className,
        )}
      >
        {timeDifference}
      </span>
    );
  },
  // Improved comparison function
  (prevProps, nextProps) => {
    if (prevProps.created !== nextProps.created) return false;
    if (prevProps.migrated_time !== nextProps.migrated_time) return false;
    if (prevProps.dex !== nextProps.dex) return false;
    if (prevProps.hoursOnly !== nextProps.hoursOnly) return false;
    return true;
  },
);

TimeDifference.displayName = "TimeDifference";
export default TimeDifference;
