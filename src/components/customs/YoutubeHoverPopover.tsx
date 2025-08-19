"use client";

import React, { useMemo, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import SocialLinkButton from "./buttons/SocialLinkButton";
import { YouTubeEmbed } from "react-social-media-embed";

const YoutubeHoverPopover = React.memo(
  ({
    url,
    containerSize,
    iconSize,
  }: {
    url: string;
    containerSize?: string;
    iconSize?: string;
  }) => {
    // Convert YouTube URL to embed format
    const embedUrl = useMemo(() => {
      // Handle different YouTube URL formats
      let videoId = "";

      // Match youtube.com/watch?v=VIDEO_ID
      const watchMatch = url.match(/youtube\.com\/watch\?v=([^&]+)/);
      if (watchMatch) videoId = watchMatch[1];

      // Match youtu.be/VIDEO_ID
      const shortMatch = url.match(/youtu\.be\/([^?&]+)/);
      if (shortMatch) videoId = shortMatch[1];

      // Match youtube.com/embed/VIDEO_ID (already in embed format)
      const embedMatch = url.match(/youtube\.com\/embed\/([^?&]+)/);
      if (embedMatch) return url; // Already in embed format

      // Match youtube.com/shorts/VIDEO_ID
      const shortsMatch = url.match(/youtube\.com\/shorts\/([^?&]+)/);
      if (shortsMatch) videoId = shortsMatch[1];

      return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
    }, [url]);

    return (
      <TooltipProvider>
        <Tooltip delayDuration={0}>
          <TooltipTrigger>
            <SocialLinkButton
              variant={"primary"}
              size="sm"
              href={url}
              icon="youtube-eye"
              label="YouTube"
              containerSize={containerSize}
              iconSize={iconSize}
            />
          </TooltipTrigger>
          <TooltipContent className="p-0">
            <YouTubeEmbed url={url} width={328} height={200} />
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  },
);

YoutubeHoverPopover.displayName = "YoutubeHoverPopover";

export default YoutubeHoverPopover;
