"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/libraries/utils";
import Image from "next/image";
import { useTelegramSettingsStore } from "@/stores/setting/use-telegram-settings.store";
import {
  activateEarnRewards,
  getUserEarningData,
  Level,
} from "@/apis/rest/earn-new";
import { useEarnStore } from "@/stores/earn/use-earn.store";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import CustomToast from "./toasts/CustomToast";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useRouter } from "next/navigation";
import { EARN_LEVELS } from "@/constants/earn-level";
import { useCustomizeTheme } from "@/hooks/use-customize-theme";
import { useCustomToast } from "@/hooks/use-custom-toast";

export default function UserEarningLevel() {
  const theme = useCustomizeTheme();
  const history = useRouter();
  const {
    novaUserId: userId,
    telegramUserId,
    setIsInitialized,
    setTelegramUserId,
  } = useTelegramSettingsStore();
  const {
    setRefUserData,
    setIsError: setIsEarnError,
    setIsLoading: setIsEarnLoading,
  } = useEarnStore();

  const [open, setOpen] = useState(false);

  const queryClient = useQueryClient();
  const { success, loading } = useCustomToast();

  const { mutate: activateEarn } = useMutation({
    mutationKey: ["activate-earn"],
    mutationFn: activateEarnRewards,
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ["earn-user-data"] });
      queryClient.refetchQueries({ queryKey: ["nova-earn-level-volume"] });
      queryClient.refetchQueries({
        queryKey: ["nova-earn-level-volume-page"],
      });

      // toast.custom((t: any) => (
      //   <CustomToast
      //     tVisibleState={t.visible}
      //     message="Successfully updated referral link"
      //     state="SUCCESS"
      //   />
      // ));
      success("Successfully updated referral link");
    },
  });

  const {
    data: earnUserData,
    isLoading,
    isError,
    isSuccess,
  } = useQuery({
    queryKey: ["earn-user-data"],
    queryFn: async () => {
      return await getUserEarningData({ userId, telegramUserId });
    },
    enabled: !!userId,
    retry: 2,
  });

  useEffect(() => {
    setIsEarnLoading(isLoading);
  }, [isLoading]);

  useEffect(() => {
    if (isSuccess && earnUserData) {
      setIsEarnLoading(false);
      if (telegramUserId !== Number(earnUserData.telegramUserId)) {
        setTelegramUserId(Number(earnUserData.telegramUserId));
      }

      if (earnUserData.syncing) {
        // toast.custom((t: any) => (
        //   <CustomToast
        //     tVisibleState={t.visible}
        //     message="Syncing v1 Referral Data"
        //     state="LOADING"
        //   />
        // ));
        loading("Syncing v1 Referral Data");
      }
      setRefUserData(earnUserData);
    }
  }, [isSuccess, earnUserData]);

  useEffect(() => {
    if (isError) {
      if (telegramUserId !== 0) return activateEarn({ userId, telegramUserId });
      setIsEarnError(isError);
      setIsInitialized(false);
    } else {
      setIsInitialized(true);
    }
  }, [isError, telegramUserId]);

  const level = useMemo(() => {
    if (!earnUserData)
      return {
        index: 1,
        level: "Earth",
        status: "locked",
        currentVol: 0,
        targetVolume: 0,
        percentage: 0,
        rewardMultiplier: 0,
      };

    const userVolume = earnUserData.myVolume;
    const isPartner = earnUserData.isPartner;

    let newFocusedLevel: Level | null = null;
    let newNextLevel: Level | null = null;
    let statusAssigned = false;

    const levelsWithStatus = (EARN_LEVELS || [])?.map((level) => {
      if (userVolume >= level.targetVolume) {
        return { ...level, status: "completed" as const };
      }

      if (!statusAssigned) {
        const pendingLevel = { ...level, status: "pending" as const };
        newFocusedLevel = pendingLevel;
        statusAssigned = true;
        return pendingLevel;
      }

      const lockedLevel = { ...level, status: "locked" as const };
      if (!newNextLevel) newNextLevel = lockedLevel;
      return lockedLevel;
    });

    if (isPartner) {
      const highestLevelIndex = EARN_LEVELS.length - 1;

      const highestEligibleLevel = EARN_LEVELS[highestLevelIndex];

      const percentage = Math.min(
        Math.floor(
          ((userVolume || 0) / (highestEligibleLevel.targetVolume || 1)) * 100,
        ),
        100,
      );

      return {
        ...highestEligibleLevel,
        percentage,
        index: highestLevelIndex + 1,
      };
    }

    const index = levelsWithStatus.findIndex(
      (level) => level.status === "pending",
    );

    if (index !== -1) {
      const currentLevel = EARN_LEVELS[index];

      const percentage = Math.min(
        Math.floor(
          ((userVolume || 0) / (currentLevel.targetVolume || 1)) * 100,
        ),
        100,
      );

      return {
        ...currentLevel,
        percentage,
        index: index + 1,
      };
    }

    return {
      index: 1,
      level: "Earth",
      status: "locked",
      currentVol: 0,
      targetVolume: 0,
      percentage: 0,
      rewardMultiplier: 0,
    };
  }, [earnUserData]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="peer flex h-[26px] items-center justify-start gap-[6px] rounded-l-md bg-gradient-to-r from-secondary to-transparent py-[6px] pr-[12px]"
          onMouseEnter={() => setOpen(true)}
          onClick={() => history.push("/earn")}
        >
          <span className="rounded-r-[2px] bg-gradient-to-r from-[#DF74FF00] via-[#DF74FF] to-[#FFFFFF] pl-2 pr-1 pt-0.5 font-geistBlack text-[8px] leading-3 text-background">
            LEVEL
          </span>
          <span className="text-nowrap bg-gradient-to-t from-[#DF74FF00] via-[#DF74FF] to-[#FFFFFF] bg-clip-text font-geistBlack text-xl font-[600] leading-4 text-transparent">
            {level?.index || 1}
          </span>
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        side="bottom"
        alignOffset={-230}
        className="z-10 p-0 bg-transparent border-0"
        onMouseLeave={() => setOpen(false)}
      >
        <div onClick={() => history.push("/earn")} className="z-[100]">
          <div className="absolute -bottom-[90px] -right-1 z-10 w-[278px] transition-all duration-200 ease-in peer-hover:-bottom-[100px] peer-hover:scale-100 peer-hover:opacity-100 xl:-right-[80px] 2xl:-right-[110px]">
            <div className="relative isolate flex h-[27px] w-full flex-col items-center justify-center gap-1 overflow-hidden">
              <div className="relative flex w-full justify-end px-4 xl:translate-x-6 xl:justify-center 2xl:translate-x-0 2xl:justify-center">
                <Image
                  src="/images/decorations/level-pointer-decoration.svg"
                  alt="Level Pointer"
                  width={36}
                  height={26}
                  quality={100}
                />
                <div className="absolute -bottom-2 z-10 size-4 -translate-x-1/2 rounded-full bg-[#DF74FF] blur max-xl:right-4 xl:left-[52%] 2xl:left-1/2" />
              </div>
              <div className="absolute bottom-0 mt-2 h-px w-[246px] bg-gradient-to-l from-[#DF74FF00] via-[#FFFFFF] to-[#DF74FF00]" />
              <div
                className="absolute -bottom-[36px] h-[36px] w-[190px] bg-[#E97DFF] blur-md max-xl:right-1"
                style={{ borderRadius: "100%" }}
              ></div>
            </div>
            <div
              className="relative isolate flex h-[62px] w-full items-center justify-between gap-2 rounded-md border border-[#242436] px-3 py-2 shadow-custom"
              style={theme.background2}
            >
              <div className="flex flex-col items-start justify-center gap-1">
                <span className="font-geist w-full text-left text-xs font-[400] leading-[18px] text-[#9191A4]">
                  Current
                </span>
                <span className="font-geist flex items-center gap-1 text-left text-xs font-[600] leading-[18px] text-white">
                  <Image
                    src="/icons/solana.svg"
                    alt="Solana Icon"
                    quality={100}
                    width={18}
                    height={18}
                    className={cn("pointer-events-none object-contain")}
                  />
                  {formatPts(earnUserData?.myVolume ?? 0)}
                </span>
              </div>

              <div className="relative isolate flex h-full w-20 items-center justify-center">
                {Array.from({ length: 50 })?.map((_, index) => (
                  <div
                    key={index}
                    className="absolute bottom-0 left-0 flex w-10 origin-bottom-right justify-start"
                    style={{ rotate: `${index * 3.6}deg` }}
                  >
                    <div
                      className={cn(
                        "h-px w-2",
                        index * 2 < level?.percentage
                          ? "bg-[#DF74FF]"
                          : "bg-[#2F323A]",
                      )}
                    />
                  </div>
                ))}

                <span className="font-geist mt-6 text-nowrap bg-gradient-to-b from-[#F4D0FF] to-[#DF74FF] to-80% bg-clip-text text-[16px] font-[600] leading-6 text-transparent">
                  {level?.percentage || 0.0}%
                </span>
              </div>

              <div className="flex flex-col items-end justify-center gap-1">
                <span className="font-geist w-full text-right text-xs font-[400] leading-[18px] text-[#9191A4]">
                  Target
                </span>
                <span className="font-geist flex items-center gap-1 text-right text-xs font-[600] leading-[18px] text-white">
                  <Image
                    src="/icons/solana.svg"
                    alt="Solana Icon"
                    quality={100}
                    width={18}
                    height={18}
                    className={cn("pointer-events-none object-contain")}
                  />
                  {formatPts(level?.targetVolume)}
                </span>
              </div>
              <div className="absolute bottom-0 right-0 h-px w-3/4 bg-gradient-to-r from-[#FFFFFF00] via-[#FFFFFF8A]/50 to-[#FFFFFF00]" />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function formatPts(value: number): string {
  const absValue = Math.abs(value);
  let suffix = "";
  let shortValue = value;

  if (absValue >= 1_000_000_000) {
    shortValue = value / 1_000_000_000;
    suffix = "B";
  } else if (absValue >= 1_000_000) {
    shortValue = value / 1_000_000;
    suffix = "M";
  }

  const formatted = new Intl.NumberFormat("us-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(shortValue);

  return `${formatted}${suffix}`;
}
