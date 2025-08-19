"use client";

import {
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
  Tooltip,
} from "@/components/ui/tooltip";
import { useHiddenTokensStore } from "@/stores/cosmo/use-hidden-tokens.store";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { memo, useState, useEffect } from "react";
import BaseButton from "./buttons/BaseButton";
import { useNewlyCreatedFilterStore } from "@/stores/cosmo/use-newly-created-filter.store";
import {
  DynamicCosmoFilterSubscriptionMessageType,
} from "@/types/ws-general";
import { useAboutToGraduateFilterStore } from "@/stores/cosmo/use-about-to-graduate-filter.store";
import { useGraduatedFilterStore } from "@/stores/cosmo/use-graduated-filter.store";
import cookies from "js-cookie";
import { useWebSocket } from "@/hooks/useWebsocketNew";
import { useBlacklistedDeveloperFilterStore } from "@/stores/cosmo/use-blacklisted-developer-filter.store";
import convertCosmoIntoWSFilterFormat from "@/utils/convertCosmoIntoWSFilterFormat";

function CosmoHideToken() {
  const { sendMessage } = useWebSocket({
    channel: "cosmo2",
  });

  const storeShowHidden = useHiddenTokensStore(
    (state) => state.cosmoShowHiddenTokens,
  );
  const setCosmoShowHiddenTokens = useHiddenTokensStore(
    (state) => state.setCosmoShowHiddenTokens,
  );

  const [tempShowHidden, setTempShowHidden] = useState(storeShowHidden);

  useEffect(() => {
    setTempShowHidden(storeShowHidden);
  }, [storeShowHidden]);

  const handleClick = async () => {
    const optimisticValue = !tempShowHidden;
    setTempShowHidden(optimisticValue);

    try {
      setCosmoShowHiddenTokens(optimisticValue);
    } catch (e) {
      setTempShowHidden(storeShowHidden);
      console.error("Failed to toggle hidden tokens:", e);
    }
  };

  const setNewlyShowHiddenTokens = useNewlyCreatedFilterStore(
    (state) => state.setShowHiddenTokens,
  );
  const setAboutToGraduateShowHiddenTokens = useAboutToGraduateFilterStore(
    (state) => state.setShowHiddenTokens,
  );
  const setGraduateShowHiddenTokens = useGraduatedFilterStore(
    (state) => state.setShowHiddenTokens,
  );

  const hiddenTokens = useHiddenTokensStore((state) => state.hiddenTokens);

  const setGraduatedLoading = useGraduatedFilterStore(
    (state) => state.setIsLoadingFilterFetch,
  );
  const setCreatedLoading = useNewlyCreatedFilterStore(
    (state) => state.setIsLoadingFilterFetch,
  );
  const setAboutToGraduateLoading = useAboutToGraduateFilterStore(
    (state) => state.setIsLoadingFilterFetch,
  );

  const handleApplyFilterAndSendMessage = () => {
    const token = cookies.get("_nova_session");
    if (!token || token === "") return;

    const newlyLatestGenuinefilters =
      useNewlyCreatedFilterStore.getState()?.filters.genuine;
    const graduatedLatestGenuinefilters =
      useGraduatedFilterStore.getState()?.filters.genuine;
    const aboutToGraduatedLatestPreviewFilters =
      useAboutToGraduateFilterStore.getState()?.filters.genuine;

    const blacklist_developers =
      useBlacklistedDeveloperFilterStore.getState().blacklistedDevelopers;

    const newlyFilterObject = convertCosmoIntoWSFilterFormat(
      newlyLatestGenuinefilters,
      blacklist_developers,
      hiddenTokens?.join(","),
      "created",
    );

    const aboutToGraduateFilterObject = convertCosmoIntoWSFilterFormat(
      aboutToGraduatedLatestPreviewFilters,
      blacklist_developers,
      hiddenTokens?.join(","),
      "created",
    );

    const graduatedFilterObject = convertCosmoIntoWSFilterFormat(
      graduatedLatestGenuinefilters,
      blacklist_developers,
      hiddenTokens?.join(","),
      "created",
    );

    const filterSubscriptionMessage: DynamicCosmoFilterSubscriptionMessageType =
      {
        action: "update",
        channel: "cosmo2",
        token,
        created: newlyFilterObject,
        aboutToGraduate: aboutToGraduateFilterObject,
        graduated: graduatedFilterObject,
      };

    setGraduatedLoading(true);
    setCreatedLoading(true);
    setAboutToGraduateLoading(true);
    sendMessage(filterSubscriptionMessage);
  };

  useEffect(() => {
    setNewlyShowHiddenTokens(tempShowHidden);
    setAboutToGraduateShowHiddenTokens(tempShowHidden);
    setGraduateShowHiddenTokens(tempShowHidden);

    handleApplyFilterAndSendMessage();
  }, [tempShowHidden]);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {tempShowHidden ? (
            <BaseButton
              variant="gray"
              className="relative h-8"
              onClick={handleClick}
            >
              <EyeOffIcon className="h-5 w-5 cursor-pointer text-fontColorPrimary" />
            </BaseButton>
          ) : (
            <BaseButton
              variant="gray"
              className="relative h-8"
              onClick={handleClick}
            >
              <EyeIcon className="h-5 w-5 cursor-pointer text-fontColorPrimary" />
            </BaseButton>
          )}
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          isWithAnimation={false}
          className="px-2 py-0.5"
        >
          <span className="text-xs text-fontColorPrimary">
            {tempShowHidden ? "Hide Hidden Coins" : "Show Hidden Coins"}
          </span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default memo(CosmoHideToken);
