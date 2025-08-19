"use client";

// ######## Components 🧩 ########
import NoScrollLayout from "@/components/layouts/NoScrollLayout";
import PageHeading from "@/components/customs/headings/PageHeading";
import EarnLevels from "@/components/customs/EarnLevels";
import EarnBalance from "@/components/customs/EarnBalance";
import EarnReferralLink from "@/components/customs/EarnReferralLink";
import EarnReferralHistory from "@/components/customs/EarnReferralHistory";
import EarnCashBack from "@/components/customs/EarnCashBack";
import EarnClaimHistory from "@/components/customs/EarnClaimHistory";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { DialogDescription } from "@radix-ui/react-dialog";
import { useLayoutEffect, useState } from "react";
import { useTelegramSettingsStore } from "@/stores/setting/use-telegram-settings.store";
import BaseButton from "./buttons/BaseButton";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import CustomToast from "./toasts/CustomToast";
import {
  activateEarnRewards,
  getMe,
  ReferralUserData,
} from "@/apis/rest/earn-new";
import cookies from "js-cookie";
import { connectTelegram, decodeTelegramData } from "@/apis/rest/auth";
import { FaTelegram } from "react-icons/fa";
import { useEarnStore } from "@/stores/earn/use-earn.store";
import { useCustomizeTheme } from "@/hooks/use-customize-theme";
import { useCustomToast } from "@/hooks/use-custom-toast";
import { usePopupStore } from "@/stores/use-popup-state.store";
import { cn } from "@/libraries/utils";
import { useCupseySnap } from "@/stores/use-cupsey-snap.store";
import { useCustomizeSettingsStore } from "@/stores/setting/use-customize-settings.store";

const EarnClient = () => {
  const userId = useTelegramSettingsStore((state) => state.novaUserId);
  const telegramUserId = useTelegramSettingsStore(
    (state) => state.telegramUserId,
  );
  const setTelegramUserId = useTelegramSettingsStore(
    (state) => state.setTelegramUserId,
  );
  const { success, error: errorToast } = useCustomToast();
  const remainingScreenWidth = usePopupStore(
    (state) => state.remainingScreenWidth,
  );

  const cupseySnap = useCupseySnap((state) => state.snap);
  const isBothCupseySnapOpen =
    !!(cupseySnap?.right?.top || cupseySnap?.right?.bottom) &&
    !!(cupseySnap?.left?.top || cupseySnap?.left?.bottom);

  const currentTheme = useCustomizeSettingsStore(
    (state) => state.presets.preset1.themeSetting,
  );
  const isSmallRemainingScreen =
    remainingScreenWidth < 1000 ||
    (currentTheme === "cupsey" && isBothCupseySnapOpen);

  // result from query
  const isError = useEarnStore((state) => state.isError);
  const isLoading = useEarnStore((state) => state.isLoading);
  const refUserData = useEarnStore((state) => state.refUserData);

  const isInitialized = useTelegramSettingsStore(
    (state) => state.isInitialized,
  );
  const [isOpen, setIsOpen] = useState(false);

  // Get novaUserId and telegramUserId for Earn
  const { refetch: refetchMe } = useQuery({
    queryKey: ["nova-earn-me"],
    queryFn: async () => {
      const res = await getMe();
      return res;
    },
    enabled: false,
  });

  useLayoutEffect(() => {
    setIsOpen(!isInitialized);
  }, [isInitialized]);

  const queryClient = useQueryClient();
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
      success("Successfully updated referral link")
    },
    onError: (e) => {
      // toast.custom((t: any) => (
      //   <CustomToast
      //     tVisibleState={t.visible}
      //     message={e.message}
      //     state="ERROR"
      //   />
      // ));
      errorToast(e.message)
    },
  });

  const connectTelegramMutation = useMutation({
    mutationFn: connectTelegram,
    onSuccess: (_, variables) => {
      activateEarn({ telegramUserId: variables.telegramUserId, userId });
      setTelegramUserId(variables.telegramUserId);
      refetchMe();

      // toast.custom((t: any) => (
      //   <CustomToast
      //     tVisibleState={t.visible}
      //     message="Telegram connected successfully"
      //     state="SUCCESS"
      //   />
      // ));
      success("Telegram connected successfully")

      cookies.remove("_telegram_data");
    },
    onError: (error: Error) => {
      // toast.custom((t: any) => (
      //   <CustomToast
      //     tVisibleState={t.visible}
      //     message={error.message}
      //     state="ERROR"
      //   />
      // ));
      errorToast(error.message)
      cookies.remove("_telegram_data");
    },
  });

  useLayoutEffect(() => {
    // connect telegram with cookie
    const telegramFromCookie = cookies.get("_telegram_data");
    if (!telegramFromCookie) return;

    const telegramData = decodeTelegramData(telegramFromCookie);
    if (!telegramData) return;

    connectTelegramMutation.mutate({
      telegramUserId: telegramData.id,
      telegramUsername: telegramData.username,
      telegramToken: telegramData.token,
    });
  }, []);

  return (
    <>
      <NoScrollLayout mobileOnWhichBreakpoint="xl">
        <div className="nova-scroller hide relative mb-[60px] h-full w-full xl:mb-0">
          <div className="relative left-0 top-0 flex h-full w-full flex-col px-4 pb-4 xl:absolute xl:px-0">
            <div className="flex w-full items-center justify-between pb-2 pt-4 lg:pt-4">
              <div className="flex items-center gap-x-3">
                <PageHeading
                  title="Earn"
                  description="Get a bonus as you share to people."
                  line={1}
                  showDescriptionOnMobile
                />
              </div>
            </div>

            <div className="flex h-full w-full pb-4">
              <div className="flex w-full items-start justify-start gap-6">
                <div
                  className={cn(
                    "max-lg:hidden lg:w-[420px] xl:w-[460px]",
                    isSmallRemainingScreen && "hidden",
                  )}
                >
                  <div className="space-y-4">
                    <EarnLevels userData={refUserData} isLoading={isLoading} />
                  </div>
                </div>
                <div
                  className={cn(
                    "w-full flex-1 pb-4 lg:-mt-[48px]",
                    isSmallRemainingScreen && "pb-0 lg:mt-0",
                  )}
                >
                  <EarnBalance
                    referalCode={refUserData?.referralCode || ""}
                    isLoading={isLoading}
                  />

                  <div className="space-y-6">
                    <EarnReferralLink
                      code={refUserData?.accessUrl.split("@")[1] || ""}
                      isLoading={isLoading}
                      isNovaPartner={refUserData?.isPartner}
                    />

                    <div
                      className={cn(
                        "lg:hidden",
                        isSmallRemainingScreen && "flex-col lg:flex",
                      )}
                    >
                      <EarnLevels
                        userData={refUserData as ReferralUserData}
                        isLoading={isLoading}
                      />
                    </div>

                    <EarnReferralHistory
                      refUserData={refUserData as ReferralUserData}
                      isLoading={isLoading}
                      isError={isError}
                    />

                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2 xl:col-span-1">
                        <EarnCashBack />
                      </div>
                      <div className="col-span-2 xl:col-span-1">
                        <EarnClaimHistory />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <TelegramNotConnectedDialog
          userId={userId}
          telegramUserId={telegramUserId}
          isOpen={isOpen}
          onOpenChange={setIsOpen}
        />
      </NoScrollLayout>
    </>
  );
};

export default EarnClient;

const TelegramNotConnectedDialog = ({
  isOpen,
  onOpenChange,
}: {
  isOpen: boolean;
  onOpenChange: (state: boolean) => void;
  userId: string;
  telegramUserId: number;
}) => {
  const theme = useCustomizeTheme();
  const queryClient = useQueryClient();
  const { success, error: errorToast, loading } = useCustomToast();

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
      success("Successfully updated referral link")
    },
    onError: (e) => {
      // toast.custom((t: any) => (
      //   <CustomToast
      //     tVisibleState={t.visible}
      //     message={e.message}
      //     state="ERROR"
      //   />
      // ));
      errorToast(e.message)
    },
  });

  const setIsInitialized = useTelegramSettingsStore(
    (state) => state.setIsInitialized,
  );
  const userId = useTelegramSettingsStore((state) => state.novaUserId);
  const telegramUserId = useTelegramSettingsStore(
    (state) => state.telegramUserId,
  );

  const handleActivate = () => {
    activateEarn({ userId, telegramUserId });
    onOpenChange(false);
    setIsInitialized(true);
    // toast.custom((t: any) => (
    //   <CustomToast
    //     tVisibleState={t.visible}
    //     message="Activating Referral Rewards"
    //     state="LOADING"
    //   />
    // ));
    loading("Activating Referral Rewards")
  };

  const handleConnectTg = () => {
    cookies.set("_init_earning", "true");
    window.open(
      "https://t.me/TradeonNovaBot?start=a-novadex",
      "_blank",
      "noopener,noreferrer",
    );
    onOpenChange(false);
    setIsInitialized(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        onInteractOutside={handleActivate}
        onEscapeKeyDown={(e) => {
          e.preventDefault();
          handleActivate();
        }}
        className="flex h-auto w-full max-w-[382px] flex-col gap-y-0 rounded-[8px] border border-border xl:max-w-[480px]"
        style={theme.background}
      >
        <DialogHeader className="flex h-[56px] flex-row items-center border-b border-border p-4">
          <DialogTitle className="text-lg">Welcome to Nova Earn</DialogTitle>
        </DialogHeader>
        <div className="p-4">
          <DialogDescription className="text-fontColorSecondary">
            Would you like to connect your V1 Telegram account?
          </DialogDescription>
        </div>
        <DialogFooter className="flex items-center gap-2 p-4">
          <BaseButton variant="gray" onClick={handleActivate}>
            Skip
          </BaseButton>
          <BaseButton
            variant="primary"
            onClick={handleConnectTg}
            prefixIcon={<FaTelegram />}
          >
            Connect to Telegram
          </BaseButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
