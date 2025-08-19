"use client";

// ######## Libraries 📦 & Hooks 🪝 ########
import { useCopyAddress } from "@/stores/use-copy-address.store";
import { useTrackUserEvent } from "@/hooks/use-track-event";
import { useTrackUserEventStore } from "@/stores/use-track-user-event.store";
// ######## Components 🧩 #########
import Link from "next/link";
import Image from "next/image";
import Separator from "@/components/customs/Separator";
import QuickBuyButton from "@/components/customs/buttons/QuickBuyButton";
import QuickClipboardAmountInput from "@/components/customs/inputs/QuickClipboardAmountInput";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
// ######## Utils & Helpers 🤝 ########
import { cn } from "@/libraries/utils";
import { useQuickClipboardAmountStore } from "@/stores/use-quick-clipboard-amount.store";
import { getProxyUrl } from "@/utils/getProxyUrl";

export default function QuickClipboard({
  parentClassName,
  wrapperClassName,
  withSeparator = false,
}: {
  parentClassName?: string;
  wrapperClassName?: string;
  withSeparator?: boolean;
}) {
  const detailCopied = useCopyAddress((state) => state.detailCopied);
  const { quickClipboardAmount } = useQuickClipboardAmountStore();
  const imageSrc = getProxyUrl(
    detailCopied?.image as string,
    detailCopied?.symbol?.[0] || "",
  );

  const setIsExternal = useTrackUserEventStore((state) => state.setIsExternal);
  const { mutate: trackUserEvent } = useTrackUserEvent("paste");

  return (
    detailCopied && (
      <div
        className={cn(
          "absolute right-3 top-1/2 flex -translate-y-1/2 transform items-center justify-center gap-x-2",
          parentClassName,
        )}
      >
        {withSeparator && (
          <div>
            <Separator
              color="#2E2E47"
              orientation="vertical"
              unit="fixed"
              fixedHeight={12}
              className="hidden min-[1409px]:block"
            />
          </div>
        )}
        <div
          className={cn(
            "flex h-[30px] rounded-[32px] bg-secondary py-1 pl-2 pr-[3px] text-right text-xs text-white",
            wrapperClassName,
          )}
        >
          <div className="flex flex-shrink-0 items-center justify-center gap-x-1">
            <div className="relative aspect-square h-4 w-4 flex-shrink-0 overflow-hidden rounded-full md:mr-[2px]">
              <Image
                src="/icons/paste.svg"
                alt="Paste Icon"
                fill
                quality={100}
                className={"object-contain"}
              />
            </div>
            <Link
              href={`/token/${detailCopied?.mint}`}
              onClick={() => {
                setIsExternal(false);
                trackUserEvent({ mint: detailCopied?.mint || "" });
              }}
              prefetch
              className="relative aspect-square h-4 w-4 flex-shrink-0 cursor-pointer overflow-hidden rounded-full"
            >
              <Image
                src={imageSrc as string}
                alt="Token Image"
                fill
                quality={100}
                className="object-cover"
              />
            </Link>
            <Link
              href={`/token/${detailCopied?.mint}`}
              onClick={() => {
                setIsExternal(false);
                trackUserEvent({ mint: detailCopied?.mint || "" });
              }}
              prefetch
              className="block cursor-pointer truncate font-geistMonoLight text-xs text-fontColorPrimary max-md:max-w-[40px] max-[375px]:hidden"
            >
              <span className="truncate">{detailCopied?.symbol}</span>
            </Link>
            <div className="ml-2">
              <QuickClipboardAmountInput />
            </div>
            <div className="ml-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-block">
                      <QuickBuyButton
                        module="Quick Buy"
                        variant="marquee"
                        mintAddress={detailCopied?.mint}
                        amount={quickClipboardAmount}
                        className="max-w-[95px]"
                      />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Buy for {quickClipboardAmount} SOL</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
      </div>
    )
  );
}
