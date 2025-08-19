"use client";
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import { useRewardNotificationStore } from "@/stores/notifications/use-reward-notification.store";
import { AnimatePresence, motion } from "framer-motion";
import {
  formatAmountDollar,
  formatAmountWithoutLeadingZero,
} from "@/utils/formatAmount";
import { formatDistanceToNowStrict } from "date-fns";

interface EarnRewardToastProps {
  id: string;
  message: string;
  state: string;
  timestamp: number;
}
interface ExtractedData {
  amount: number;
  currency: string;
}
const extractAmountAndCurrency = (message: string): ExtractedData => {
  const regex = /(?:\$(\d+(\.\d+)?))|(\d+(\.\d+)?)\s*(\w+)/;

  const match = message.match(regex);

  if (match) {
    // Check if the match is from currency symbol (like "$5")
    if (match[1]) {
      const amount = parseFloat(match[1]);
      const currency = "USD";
      return { amount, currency };
    }

    const amount = parseFloat(match[3]);
    const currency = match[5];
    return { amount, currency };
  }

  return { amount: 0, currency: "SOL" };
};

export const EarnRewardToast = forwardRef<HTMLDivElement, EarnRewardToastProps>(
  ({ id, message, state, timestamp }: EarnRewardToastProps, ref) => {
    const [timeDifference, setTimeDifference] = useState("-");
    const { amount, currency } = extractAmountAndCurrency(message);

    const timestampRef = useRef<number | null>(null);
    const intervalIdRef = useRef<NodeJS.Timeout | null>(null);
    const [isRemoved, setIsRemoved] = useState(false);

    useEffect(() => {
      timestampRef.current = timestamp ?? null;
    }, [timestamp]);

    const handleDeleteToast = () => {
      useRewardNotificationStore.getState().removeReward(id);
      setIsRemoved(true);
    };

    const updateTimeDifference = useCallback(() => {
      if (!timestampRef.current) return;

      const newDiff = formatDistanceToNowStrict(timestampRef.current, {
        addSuffix: true,
      });
      setTimeDifference((prev) => {
        return prev !== newDiff ? newDiff : prev;
      });
    }, [timestampRef]);

    useEffect(() => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }

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

    // Auto-remove the toast after 5 seconds with progress bar
    useEffect(() => {
      const timer = setTimeout(() => {
        handleDeleteToast();
      }, 5000);
      return () => {
        clearTimeout(timer);
      };
    }, [id]);

    const renderCurrency = () => {
      if (currency === "SOL") {
        return `${formatAmountWithoutLeadingZero(amount, 2)} SOL`;
      }
      return formatAmountDollar(amount);
    };

    return (
      <>
        {isRemoved ? null : (
          <AnimatePresence>
            <motion.div
              ref={ref}
              className={`toast toast-${state} relative overflow-hidden rounded-[12px] border border-border bg-gradient-to-b from-secondary via-background to-background p-3 pr-2 shadow-[0px_4px_20px_0px_#F6C7FF33]`}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              transition={{
                duration: 0.5,
              }}
              // key={id}
            >
              <motion.div
                style={{
                  height: "2px",
                  backgroundColor: "#DF74FF",
                  position: "absolute",
                  top: 0,
                  left: 0,
                }}
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{
                  duration: 5.7,
                  ease: "easeInOut",
                }}
              ></motion.div>
              <div className="flex items-start justify-between gap-x-2">
                <div className="flex gap-2">
                  <Image
                    className="mt-1 animate-bounce"
                    src="/images/decorations/speaker.svg"
                    alt="Speaker Image"
                    width={30}
                    height={32}
                  />
                  <div className="space-y-1">
                    <p className="font-geistBold text-sm text-fontColorPrimary">
                      You earned{" "}
                      <span className="bg-gradient-to-b from-[#8CD9B6] to-[#4BAA7F] bg-clip-text font-geistBold text-transparent">
                        {renderCurrency()}
                      </span>{" "}
                      in rewards today
                    </p>
                    <p className="mt-1 text-sm text-fontColorSecondary">
                      Just now
                    </p>
                  </div>
                </div>
                <button onClick={handleDeleteToast}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="size-[18px] text-gray-400 hover:text-gray-200"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </>
    );
  },
);

EarnRewardToast.displayName = "EarnRewardToast";
export const StackableRewardNotifications = () => {
  const rewards = useRewardNotificationStore((state) => state.rewards);

  return (
    <div className="fixed bottom-20 right-0 z-40 text-white md:right-20">
      <div className="flex flex-col gap-2">
        {(rewards || [])?.map((reward) => (
          <EarnRewardToast
            key={reward.id}
            id={reward.id}
            message={reward.message}
            timestamp={reward.timestamp}
            state="REWARD"
          />
        ))}
      </div>
    </div>
  );
};
