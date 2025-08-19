"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/libraries/utils";
import { fetchWebsiteAge, WebsiteAge } from "@/apis/rest/social-feed";
import { useQuery } from "@tanstack/react-query";
import { parse } from "tldts";
import { useCustomizeTheme } from "@/hooks/use-customize-theme";
import {
  WebsiteCupseyIconSVG,
  WebsiteIconSVG,
} from "@/components/customs/ScalableVectorGraphics";
import { formatRelativeTime } from "@/utils/formatTime";

function extractDomain(urlString: string): string {
  try {
    const parsed = parse(urlString);
    let domain = parsed.domain || urlString;

    // Remove www. prefix if it exists
    if (domain.startsWith("www.")) {
      domain = domain.slice(4);
    }

    return domain;
  } catch (error) {
    console.error(`Invalid URL: ${urlString}`);
    return "";
  }
}

function formatUrl(url: string): string {
  try {
    const parsedUrl = new URL(url);
    let host = parsedUrl.hostname.replace(/^www\./, ""); // remove www. if exists
    let path = parsedUrl.pathname.replace(/\/$/, ""); // remove trailing slash from path

    return host;
    // if (path === "" || path === "/") {
    //   return host;
    // } else {
    //   return `${host}${path}`;
    // }
  } catch (error) {
    console.warn("Error formatting URL:", error);
    return url; // Return original URL if parsing fails
  }
}

const WebsiteHoverPopoverContent = React.memo(({ href }: { href: string }) => {
  const formattedUrl = React.useMemo(() => {
    try {
      return formatUrl(href);
    } catch (error) {
      console.warn("Error formatting URL in useMemo:", error);
      return href;
    }
  }, [href]);

  const { data, isLoading, isError, isFetching } = useQuery<WebsiteAge>({
    queryKey: ["website-age", formattedUrl],
    queryFn: () => fetchWebsiteAge(formattedUrl),
    enabled: !!formattedUrl,
    retry: 0,
  });

  // Show loading indicator only if actually fetching data
  if (isLoading && isFetching) {
    return (
      <div className="z-[1000] flex h-12 items-center justify-center">
        <div className="relative size-6 animate-spin">
          <Image
            src="/icons/search-loading.png"
            alt="Loading"
            fill
            className="object-contain"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="z-[1000] flex w-full items-start justify-between gap-x-2">
      <div className="flex min-w-0 flex-1 flex-col gap-y-0.5">
        <p className="font-geistRegular text-[10px] font-normal leading-[14px] text-fontColorPrimary">
          {extractDomain(href)}
        </p>
        <p className="max-w-full break-all font-geistRegular text-[10px] font-normal leading-[14px] text-fontColorSecondary">
          {formattedUrl}
        </p>
      </div>
      {!isError && data?.creation_date && (
        <p className="flex-shrink-0 font-geistRegular text-[10px] font-normal leading-[14px] text-success">
          {formatRelativeTime(data.creation_date)}
        </p>
      )}
    </div>
  );
});

WebsiteHoverPopoverContent.displayName = "WebsiteHoverPopoverContent";

const WebsiteHoverPopover = React.memo(
  ({
    href,
    variant = "secondary",
    containerSize,
    iconSize,
  }: {
    href: string;
    variant?: "primary" | "secondary" | "cupsey";
    containerSize?: string;
    iconSize?: string;
  }) => {
    const theme = useCustomizeTheme();
    return (
      <TooltipProvider>
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Link
              href={href}
              target="_blank"
              className={cn(
                "relative flex h-[20px] flex-shrink-0 items-center justify-center rounded-[4px] duration-300",
                variant === "primary" ? "bg-white/[6%]" : "bg-[#272734]",
                variant === "cupsey"
                  ? "bg-transparent"
                  : "gb__white__btn_xs bg-[#272734] hover:bg-white/[12%]",
                containerSize,
              )}
            >
              <div
                className={cn(
                  "relative aspect-square size-[16px] flex-shrink-0",
                  iconSize,
                )}
              >
                {/* <Image
                  src={
                    variant === "cupsey"
                      ? "/icons/website-cupsey.svg"
                      : "/icons/social/website.svg"
                  }
                  alt="Website Social Icon"
                  fill
                  quality={100}
                  loading="lazy"
                  className="object-contain"
                /> */}
                {variant === "cupsey" ? (
                  <WebsiteCupseyIconSVG className={iconSize} />
                ) : (
                  <WebsiteIconSVG className={iconSize} />
                )}
              </div>
            </Link>
          </TooltipTrigger>

          <TooltipContent
            isWithAnimation={false}
            align="start"
            side="bottom"
            className="gb__white__popover z-[1000] w-[220px] rounded-[8px] border border-border p-3 !transition-none"
            style={theme.background2}
          >
            <iframe className="absolute inset-0 h-full w-full opacity-0" />
            <WebsiteHoverPopoverContent href={href} />
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  },
);

WebsiteHoverPopover.displayName = "WebsiteHoverPopover";

export default WebsiteHoverPopover;
