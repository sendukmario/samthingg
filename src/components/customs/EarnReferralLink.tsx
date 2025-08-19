"use client";

import { memo, useEffect, useRef, useState } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import BaseButton from "@/components/customs/buttons/BaseButton";
import Image from "next/image";
import { cn } from "@/libraries/utils";
import copy from "copy-to-clipboard";
import toast from "react-hot-toast";
import CustomToast from "@/components/customs/toasts/CustomToast";
import { useTelegramSettingsStore } from "@/stores/setting/use-telegram-settings.store";
import { FaTelegram } from "react-icons/fa";
import { changeReferralCode } from "@/apis/rest/earn-new";
import cookies from "js-cookie";
import { Check } from "lucide-react";
import { useCustomToast } from "@/hooks/use-custom-toast";

interface EarnReferralLinkProps {
  code: string;
  isLoading: boolean;
  isNovaPartner?: boolean;
}

function EarnReferralLink({
  code,
  isLoading,
  isNovaPartner = false,
}: EarnReferralLinkProps) {
  const userId = useTelegramSettingsStore((state) => state.novaUserId);
  const telegramUserId = useTelegramSettingsStore(
    (state) => state.telegramUserId,
  );

  const handleConnectWithTelegram = () => {
    cookies.set("_init_earning", "true");

    window.open(
      "https://t.me/TradeonNovaBot?start=a-novadex",
      "_blank",
      "noopener,noreferrer",
    );
  };
  return (
    <div className="flex h-[85px] w-full items-center justify-start gap-3 rounded-[12px] border border-[#242436] bg-secondary px-4 py-3 max-sm:h-fit">
      <div className="flex size-9 items-center justify-center rounded-full bg-gradient-to-b from-[#E077FF] to-[#5E30A8] lg:size-12">
        <div className="relative h-[20px] w-[20px] lg:h-[25px] lg:w-[25px]">
          <Image
            src="/icons/hierarchy.png"
            alt="Hierarchy Icon"
            fill
            quality={100}
          />
        </div>
      </div>
      <div className="flex-1 space-y-1">
        <span className="font-geist text-xs text-[#9191A4] xl:text-sm">
          Your Referral Link
        </span>
        <InputReferralLink
          key={code}
          id={code || ""}
          telegramUserId={telegramUserId}
          userId={userId}
          isNovaPartner={isNovaPartner}
        />
      </div>

      <div className="flex items-center gap-x-1.5 md:gap-x-3">
        <CopyButton
          key={code}
          id={code || ""}
          loading={isLoading}
          isNovaPartner={isNovaPartner}
        />
        <div className="h-4 w-[1px] bg-border" />
        <BaseButton
          onClick={handleConnectWithTelegram}
          className="inline-flex max-h-10 min-h-10 min-w-10 gap-2 rounded-[8px] p-2 text-[#9191A4] md:pr-3"
          disabled={Boolean(telegramUserId) || isLoading}
        >
          <span className="hidden md:inline-block">
            {telegramUserId ? "Connected" : "Connect"}
          </span>
          <span
            className={cn(
              "size-4 rounded-full",
              telegramUserId ? "" : "bg-white",
            )}
          >
            {telegramUserId ? (
              <Check color="#85D6B1" size={16} />
            ) : (
              <FaTelegram color="#26A5E4" size={16} />
            )}
          </span>
        </BaseButton>
      </div>
    </div>
  );
}

export interface InputReferralLinkProps {
  id: string;
  telegramUserId: number;
  userId: string;
  isNovaPartner: boolean;
}

export function InputReferralLink({
  id,
  telegramUserId,
  userId,
  isNovaPartner,
}: InputReferralLinkProps) {
  const [edit, setEdit] = useState(false);
  const [value, setValue] = useState(id);
  const spanRef = useRef<HTMLSpanElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { success, error: errorToast } = useCustomToast();

  // CSS class for blurring content when not a partner
  const blurClass = !isNovaPartner ? "select-none blur-[5px]" : "";

  // Prevent right-click context menu if not a partner
  const handleContextMenu = (e: React.MouseEvent) => {
    if (!isNovaPartner) {
      e.preventDefault();
      return false;
    }
  };

  const queryClient = useQueryClient();
  const { mutate: updateLink, isPending } = useMutation({
    mutationKey: ["CHANGE_NOVA_EARN_REFERRAL_LINK"],
    mutationFn: changeReferralCode,
    onSuccess: () => {
      // toast.custom((t: any) => (
      //   <CustomToast
      //     tVisibleState={t.visible}
      //     message="Successfully updated referral link"
      //     state="SUCCESS"
      //   />
      // ));
      success("Successfully updated referral link")

      queryClient.invalidateQueries({ queryKey: ["NOVA_EARN_REFERRAL_LINK"] });
      setEdit(false);
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

  function handleEdit() {
    // Only allow editing if partner
    if (!isNovaPartner) return;
    setEdit(!edit);
  }

  function handleCancel() {
    setValue(id);
    setEdit(false);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!isNovaPartner) return;
    setValue(e.target.value);
  }

  function handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!isNovaPartner) return;

    if (e.key === "Enter") {
      updateLink({ code: value, userId, telegramUserId });
    } else if (e.key === "Escape") {
      handleCancel();
    }
  }

  function handleInputBlur() {
    if (!isNovaPartner) return;
    updateLink({ code: value, userId, telegramUserId });
  }

  useEffect(() => {
    if (edit && spanRef.current && inputRef.current) {
      const width = spanRef.current.offsetWidth || 12;
      inputRef.current.style.width = `${width + 20}px`;
    }
  }, [value, edit]);

  useEffect(() => {
    if (edit && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [edit]);

  // Client-side protection for non-partners
  useEffect(() => {
    if (!isNovaPartner) {
      // Add protection against DOM manipulation
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === "attributes") {
            // Reset any style changes that might remove blur
            const target = mutation.target as HTMLElement;
            if (target.classList && !target.classList.contains("blur-[5px]")) {
              target.classList.add("blur-[5px]", "select-none");
            }
          }
        });
      });

      // Watch for style changes on the element
      const elements = document.querySelectorAll(".partner-protected");
      elements.forEach((el) => {
        observer.observe(el, {
          attributes: true,
          attributeFilter: ["class", "style"],
        });
      });

      return () => {
        observer.disconnect();
      };
    }
  }, [isNovaPartner]);

  return (
    <div className="flex w-full flex-col">
      <div
        className="flex items-center justify-start"
        onContextMenu={handleContextMenu}
      >
        <span className="font-geistSemiBold text-sm leading-[22px] text-[#FCFCFD] lg:text-xl lg:leading-7 xl:text-2xl">
          nova.trade/@
        </span>
        {edit && isNovaPartner ? (
          <>
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={handleInputChange}
                onKeyDown={handleInputKeyDown}
                onBlur={handleInputBlur}
                disabled={isPending || !isNovaPartner}
                className={`partner-protected border-b border-[#DF74FF] bg-transparent font-geistSemiBold text-sm leading-[22px] text-[#DF74FF] focus:outline-none max-md:max-w-[80px] lg:max-w-[200px] lg:text-xl lg:leading-7 ${blurClass}`}
              />
            </div>
            <span
              ref={spanRef}
              className="invisible absolute truncate whitespace-pre font-geistSemiBold text-sm leading-[22px] max-md:max-w-[80px] md:max-w-[120px] lg:max-w-[200px] lg:text-xl lg:leading-7"
            >
              {value}
            </span>
          </>
        ) : (
          <>
            <span
              className={`partner-protected truncate font-geistSemiBold text-sm leading-[22px] text-[#DF74FF] max-md:max-w-[60px] md:max-w-[120px] lg:max-w-[200px] lg:text-xl lg:leading-7 ${blurClass}`}
            >
              {isNovaPartner ? value : "SecretCode"}
            </span>

            <button
              className="ml-1 shrink-0"
              onClick={handleEdit}
              disabled={!isNovaPartner}
              style={{ opacity: isNovaPartner ? 1 : 0.5 }}
            >
              <Image
                src="/icons/edit.png"
                alt="Edit Icon"
                width={16}
                height={16}
                className="shrink-0"
              />
            </button>
          </>
        )}
      </div>
      <div className="text-xs text-[#9191A4] max-sm:text-[10px]">
        {!isNovaPartner
          ? "Access code sharing is exclusively available to qualified Nova partners."
          : null}
      </div>
    </div>
  );
}

interface CopyButtonProps {
  id: string;
  loading?: boolean;
  isNovaPartner: boolean;
}

const CopyButton = ({ id, loading, isNovaPartner }: CopyButtonProps) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (copied) {
      setTimeout(() => setCopied(false), 2000);
    }
  }, [copied]);

  const handleCopy = () => {
    if (loading || !isNovaPartner) return;
    copy(`https://nova.trade/@${id}`);
    setCopied(true);
  };

  return (
    <BaseButton
      variant="primary"
      className="inline-flex max-h-10 min-h-10 min-w-10 gap-2 rounded-[8px] p-2 md:pr-3"
      onClick={handleCopy}
      disabled={loading || !isNovaPartner}
    >
      <div className={cn("relative aspect-square size-5 flex-shrink-0")}>
        <Image
          src="/icons/black-copy.svg"
          alt="Copy Icon"
          fill
          quality={100}
          className="object-contain duration-300"
        />
      </div>
      <span
        className={cn(
          "hidden whitespace-nowrap font-geistSemiBold text-sm text-background md:inline-block",
        )}
      >
        {copied ? "Copied!" : "Copy"}
      </span>
    </BaseButton>
  );
};

export default memo(EarnReferralLink);
