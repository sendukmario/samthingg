"use client";

import { useRef, useState, forwardRef } from "react";
import Image from "next/image";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { claimEarnedBalance } from "@/apis/rest/earn";
import {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogContent,
} from "@/components/ui/dialog";
import { Download } from "lucide-react";
import toast from "react-hot-toast";
import CustomToast from "@/components/customs/toasts/CustomToast";
import { toPng } from "html-to-image";
import { DialogTitle } from "@radix-ui/react-dialog";
import { useTelegramSettingsStore } from "@/stores/setting/use-telegram-settings.store";
import { useCustomToast } from "@/hooks/use-custom-toast";

const ClaimButton = forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<"button"> & {
    loading?: boolean;
    telegramUserId: number;
  }
>((props, ref) => {
  const { success, error: errorToast } = useCustomToast();
  const { mutateAsync: claim, isPending } = useMutation({
    mutationKey: ["CLAIM_NOVA_EARNED_BALANCE"],
    mutationFn: claimEarnedBalance,
    onSuccess: () => {
      // toast.custom((t: any) => (
      //   <CustomToast
      //     tVisibleState={t.visible}
      //     message="Successfully claim balance"
      //     state="SUCCESS"
      //   />
      // ));
      success("Successfully claim balance")
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

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    await claim(props.telegramUserId);
    props?.onClick?.(e);
  };

  return (
    <button
      ref={ref}
      onClick={handleClick}
      //disabled={props?.loading || isPending}
      disabled
      className="group relative isolate flex max-h-10 min-h-10 min-w-10 items-center justify-center rounded-lg bg-gradient-to-b from-[#DF74FF] to-[#F0B0FF] px-5 py-3 shadow-[0_0_10px_2px_rgba(245,133,255,0.8)] transition duration-500 hover:from-[#D043FA] hover:to-[#DC86F0] disabled:opacity-70 max-sm:w-full"
    >
      <div className="absolute inset-0 left-[1px] top-[1px] h-[calc(100%_-_2px)] w-[calc(100%_-_2px)] rounded-lg border border-white bg-transparent group-hover:border-white/30" />
      <span className="font-geist relative z-10 w-full text-[16px] font-[600] leading-5 sm:w-[420px]">
        {isPending ? "Claiming..." : "Coming Soon"}
      </span>
    </button>
  );
});

ClaimButton.displayName = "ClaimButton";

export function EarnClaimButton({
  balance,
  referralCode,
  loading,
}: {
  balance: number;
  loading?: boolean;
  referralCode: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const telegramUserId = useTelegramSettingsStore(
    (state) => state.telegramUserId,
  );

  const handleDownload = async () => {
    if (!ref.current) return;

    try {
      const dataUrl = await toPng(ref.current);
      const link = document.createElement("a");
      link.download = "earn.png";
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Failed to generate image:", error);
    }
  };

  const handleShare = () => {
    const baseUrl = "https://twitter.com/intent/tweet";
    const params = new URLSearchParams();

    params.set("url", `\n\nhttps://nova.trade/${referralCode}`);
    params.set("text", `Nova paid me ${balance} SOL today!`);

    const shareUrl = `${baseUrl}?${params.toString()}`;
    window.open(shareUrl, "_blank", "noopener,noreferrer");
  };

  function handleOpenChange(open: boolean) {
    setOpen(open);
    if (!open) {
      queryClient.invalidateQueries({ queryKey: ["NOVA_EARNED_BALANCE"] });
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <ClaimButton loading={loading} telegramUserId={telegramUserId} />
      </DialogTrigger>
      <DialogPortal>
        <DialogOverlay />
        <DialogContent
          className="h-[505px] max-w-[856px] rounded-[20px] border-none"
          showCloseButton={false}
        >
          <DialogTitle className="sr-only">Earn Claim</DialogTitle>
          <div className="relative isolate h-full w-full">
            <div
              className="absolute left-1/2 h-[78px] w-[384px] -translate-x-1/2 bg-[#F6C7FF] blur-[48px]"
              style={{ borderRadius: "100%" }}
            />
            <Image
              className="absolute -top-20 left-1/2 z-20 -translate-x-1/2"
              src="/images/decorations/speaker.svg"
              alt="Speaker Image"
              width={120}
              height={120}
            />
            <div className="absolute inset-0 z-10 space-y-5 rounded-[20px] border border-[#242436] bg-gradient-to-b from-secondary via-background to-background p-4 pt-14">
              <div className="font-geist text-center text-2xl font-semibold leading-8 text-white">
                Earn Nova Points for Sharing! 😉
              </div>
              <div className="pb-10" ref={ref}>
                <div className="relative mx-auto h-[239px] w-[824px] overflow-hidden rounded-[20px] bg-gradient-to-b from-[#0E0228] to-[#4F1A83]">
                  <div className="absolute inset-0 bg-[url('/images/decorations/polkadots-3.svg')] bg-contain bg-repeat opacity-20" />
                  <div className="absolute inset-0 bg-gradient-to-br from-black/70 to-transparent to-25%" />
                  <div className="absolute inset-0 bg-gradient-to-bl from-black/70 to-transparent to-25%" />
                  <div
                    className="absolute -bottom-8 h-1/4 w-full bg-white/50 blur-xl"
                    style={{ borderRadius: "100%" }}
                  />

                  <div className="absolute inset-0 z-10 flex h-full items-center justify-center gap-10 px-20 py-10">
                    <div className="relative flex size-[120px] -rotate-[5deg] items-center justify-center overflow-hidden rounded-2xl border-2 border-[#71558f] bg-gradient-to-b from-[#180025] to-[#350257] shadow-xl shadow-black/80">
                      <Image
                        src="/logo.png"
                        alt="Logo"
                        width={80}
                        height={80}
                      />

                      <div
                        className="absolute -bottom-24 h-3/4 w-full scale-125 bg-[#7938a6]/60 blur-xl"
                        style={{ borderRadius: "100%" }}
                      />
                      <div
                        className="absolute -bottom-12 h-2/4 w-full bg-white/80 blur-xl"
                        style={{ borderRadius: "100%" }}
                      />
                      <div className="absolute inset-0 bg-[url('/images/decorations/polkadots-3.svg')] bg-cover bg-repeat opacity-10" />
                    </div>
                    <div className="flex-1 space-y-6">
                      <div className="inline-block w-fit rounded-lg border border-[#5807B1] bg-[#5704c7]/70 px-3 py-1 font-geistBold text-[18px] font-bold italic leading-none text-white backdrop-blur-2xl">
                        CHA-CHING{" "}
                        <span
                          className="inline-block align-middle"
                          style={{
                            fontFamily:
                              "Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji",
                          }}
                        >
                          💸
                        </span>
                      </div>
                      <div className="font-outfit text-[2.5rem] font-semibold leading-10 tracking-wide text-white drop-shadow-xl filter">
                        <div className="flex items-end gap-2">
                          <span style={{ textShadow: "2px 2px 2px black" }}>
                            You earned
                          </span>{" "}
                          <div className="relative inline">
                            <span
                              className="absolute inset-0 whitespace-nowrap font-geistBlack text-4xl text-transparent"
                              style={{ textShadow: "2px 3px 2px black" }}
                            >
                              {balance.toFixed(2)} SOL
                            </span>

                            <span className="absolute inset-0 whitespace-nowrap font-geistBlack text-4xl text-white/10">
                              {balance.toFixed(2)} SOL
                            </span>

                            <span className="relative z-10 whitespace-nowrap bg-gradient-to-b from-[#c6f9c5] to-[#abfa85] to-80% bg-clip-text font-geistBlack text-4xl text-transparent">
                              {balance.toFixed(2)} SOL
                            </span>
                          </div>
                        </div>
                        <div style={{ textShadow: "2px 2px 2px black" }}>
                          in rewards today.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div
                className="flex flex-col items-center justify-center gap-4"
                style={{ marginTop: -20 }}
              >
                <span className="font-geist text-[16px] font-semibold leading-6 text-white">
                  Share to
                </span>
                <div className="flex items-center justify-center gap-4">
                  <div className="flex flex-col items-center justify-center gap-1">
                    <button
                      title="Download Image"
                      className="flex size-[60px] items-center justify-center rounded-full border border-[#FFFFFF20] bg-gradient-to-b from-[#FFFFFF1A] to-[#FFFFFF33]"
                      onClick={handleDownload}
                    >
                      <Download className="size-6 text-white" />
                    </button>
                    <span className="text-xs font-semibold leading-[18px] text-white">
                      Save Image
                    </span>
                  </div>
                  <div className="flex flex-col items-center justify-center gap-1">
                    <button
                      title="Share on Twitter"
                      className="flex size-[60px] items-center justify-center rounded-full border border-[#FFFFFF20] bg-gradient-to-b from-[#FFFFFF1A] to-[#FFFFFF33]"
                      onClick={handleShare}
                    >
                      <Image
                        src="/icons/x-white.svg"
                        alt="X Icon"
                        width={24}
                        height={24}
                      />
                    </button>
                    <span className="text-xs font-semibold leading-[18px] text-white">
                      Twitter
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
