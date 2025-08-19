import { useCustomizeSettingsStore } from "@/stores/setting/use-customize-settings.store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/libraries/utils";
import Image from "next/image";
import { useMemo } from "react";
import QuickBuyButton from "../buttons/QuickBuyButton";

const alertSizeMap = {
  normal: {
    text: "text-sm leading-[18px]",
    avatar: "size-[14px]",
    avatarFallback: "size-3",
  },
  large: {
    text: "text-base leading-[20px]",
    avatar: "size-4",
    avatarFallback: "size-3.5",
  },
  extralarge: {
    text: "text-lg",
    avatar: "size-5",
    avatarFallback: "size-4",
  },
  doubleextralarge: {
    text: "text-xl leading-[30px]",
    avatar: "size-6",
    avatarFallback: "size-5",
  },
};

type TradingAlertToastProps = {
  walletAdditionalInfo?: {
    emoji?: string;
    name?: string;
  };
  messageData: {
    type: "buy" | "sell";
    baseAmount: number;
    image?: string;
    symbol?: string;
    mint: string;
  };
  formatAmountWithoutLeadingZero: (amount: number) => string;
  getProxyUrl: (image: string, fallback: string) => string;
};

export const TradingAlertToast = ({
  walletAdditionalInfo,
  messageData,
  formatAmountWithoutLeadingZero,
  getProxyUrl,
}: TradingAlertToastProps) => {
  const { presets, activePreset } = useCustomizeSettingsStore();
  const currentPreset = presets[activePreset || "preset1"];

  const alertSizeClass = useMemo(() => {
    const sizeSetting = currentPreset.alertSizeSetting || "normal";
    return alertSizeMap[sizeSetting];
  }, [currentPreset.alertSizeSetting]);

  return (
    <div
      className={cn(
        "flex items-center gap-x-1.5 text-fontColorPrimary",
        alertSizeClass.text,
      )}
    >
      <span>{walletAdditionalInfo?.emoji}</span>
      <span>{walletAdditionalInfo?.name}</span>
      {messageData.type === "buy" ? (
        <span className="text-success">just bought</span>
      ) : (
        <span className="text-destructive">sold</span>
      )}
      <span>
        {formatAmountWithoutLeadingZero(messageData.baseAmount)} SOL of
      </span>
      <Avatar
        className={cn("overflow-hidden rounded-full", alertSizeClass.avatar)}
      >
        <div className="size-full border border-[#DF74FF]/30 bg-border/0 backdrop-blur-lg">
          <AvatarImage
            key={messageData?.image}
            src={getProxyUrl(
              messageData?.image as string,
              messageData?.symbol?.[0] || "",
            )}
            alt={`${messageData?.symbol} Image`}
            className="size-full rounded-full object-cover"
          />
          <AvatarFallback
            className={cn(
              "absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 rounded-full",
              alertSizeClass.avatarFallback,
            )}
          >
            <Image
              src="/logo.png"
              alt="Nova Logo"
              fill
              quality={100}
              loading="lazy"
              placeholder="blur"
              blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRg..."
              className="object-contain"
            />
          </AvatarFallback>
        </div>
      </Avatar>{" "}
      <span>{messageData?.symbol}</span>
      <div
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
      >
        <QuickBuyButton
          module="Quick Buy"
          variant="marquee"
          mintAddress={messageData?.mint}
          className="bg-white/10"
        />
      </div>
    </div>
  );
};
