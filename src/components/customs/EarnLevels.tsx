"use client";

import { useState, Fragment, memo, useLayoutEffect } from "react";
import Image from "next/image";
import { EarnLevelCarousel } from "@/components/customs/EarnLevelCarousel";
import { EarnLevelProgress } from "@/components/customs/EarnLevelProgress";
import { Level, ReferralUserData } from "@/apis/rest/earn-new";
import { EARN_LEVELS } from "@/constants/earn-level";

interface EarnLevelsProps {
  userData: ReferralUserData | null;
  isLoading: boolean;
}

function EarnLevels({ userData, isLoading }: EarnLevelsProps) {
  const [focusedLevel, setFocusedLevel] = useState<Level | null>(null);
  const [nextLevel, setNextLevel] = useState<Level | null>(null);

  const [earnLevels, setEarnLevels] = useState<Level[]>(EARN_LEVELS);

  useLayoutEffect(() => {
    if (!userData) return;

    const userVolume = userData.myVolume;
    let newFocusedLevel: Level | null = null;
    let newNextLevel: Level | null = null;
    let statusAssigned = false;

    let levelsWithStatus = (EARN_LEVELS || [])?.map((level) => {
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

    if (userData.isPartner) {
      const lastIndex = (EARN_LEVELS || [])?.length - 1;
      levelsWithStatus = (EARN_LEVELS || [])?.map((level, index) => {
        if (index < lastIndex) {
          return { ...level, status: "completed" as const };
        } else {
          const pendingLevel = { ...level, status: "pending" as const };
          newFocusedLevel = pendingLevel;
          return pendingLevel;
        }
      });

      newNextLevel = null;
    }

    if (!newFocusedLevel && !userData.isPartner) {
      const lastLevel = levelsWithStatus[levelsWithStatus.length - 1];
      newFocusedLevel = lastLevel;
    }

    setEarnLevels(levelsWithStatus);
    setFocusedLevel(newFocusedLevel);
    setNextLevel(newNextLevel);
  }, [userData?.myVolume, userData?.isPartner]);

  return (
    <Fragment>
      <EarnLevelCarousel
        isPartner={userData?.isPartner ?? false}
        loading={isLoading}
        levels={earnLevels || []}
        focusedLevel={focusedLevel}
        onFocusLevelChange={setFocusedLevel}
      />

      <div>
        <div className="relative isolate flex h-[60px] w-full flex-col items-center justify-center gap-1 overflow-hidden">
          <Image
            src="/images/decorations/level-pointer-decoration.svg"
            alt="Level Pointer"
            width={84.5}
            height={60}
            quality={100}
          />
          <div className="absolute bottom-0 mt-2 h-px w-full bg-gradient-to-l from-[#DF74FF00] via-[#FFFFFF] to-[#DF74FF00] lg:w-[336px]" />
          <div
            className="absolute -bottom-[72px] h-[78px] w-[260px] animate-scale-bounce bg-[#E97DFF] blur-xl lg:w-[336px]"
            style={{ borderRadius: "100%" }}
          ></div>
        </div>

        <EarnLevelProgress
          loading={isLoading}
          level={focusedLevel}
          isPartner={userData?.isPartner ?? false}
          myVolume={userData?.myVolume ?? 0}
        />
      </div>
    </Fragment>
  );
}

export default memo(EarnLevels);
