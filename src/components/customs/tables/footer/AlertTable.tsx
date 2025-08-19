"use client";

// ######## Libraries 📦 & Hooks 🪝 ########
import { useRef, useCallback, useEffect, useState } from "react";
import { useFooterStore } from "@/stores/footer/use-footer.store";
import { useAlertMessageStore } from "@/stores/footer/use-alert-message.store";
import { useQuery } from "@tanstack/react-query";
import { FixedSizeList } from "react-window";
// ######## APIs 🛜 ########
import { clearFooterSection } from "@/apis/rest/footer";
// ######## Components 🧩 ########
import HeadCol from "@/components/customs/tables/HeadCol";
import AlertCard from "@/components/customs/cards/footer/AlertCard";
import EmptyState from "@/components/customs/EmptyState";
import LoadingState from "@/components/customs/LoadingState";
import { useWindowSizeStore } from "@/stores/use-window-size.store";
import { cn } from "@/libraries/utils";
import { useCupseySnap } from "@/stores/use-cupsey-snap.store";
import { useCustomizeSettingsStore } from "@/stores/setting/use-customize-settings.store";

export default function AlertTable({
  variant = "default", // variant can be used to style differently if needed
}: {
  variant?: "default" | "cupsey-snap";
}) {
  const alerts = useAlertMessageStore((state) => state.messages);
  const isLoading = useAlertMessageStore((state) => !state.isInitialFetched);
  const setFooterMessage = useFooterStore((state) => state.setMessage);
  const width = useWindowSizeStore((state) => state.width);
  const calculateHeightTrigger = useCupseySnap((state) => state.calculateHeightTrigger);
  const isFetched = useRef(false);
  
  const { activePreset, presets } = useCustomizeSettingsStore();
  const isCupseyTheme = presets[activePreset]?.themeSetting === "cupsey";

  const listRef = useRef<HTMLDivElement>(null);
  const [listHeight, setListHeight] = useState(0);

  const updateHeight = () => {
    if (listRef.current) {
      setListHeight(listRef.current.clientHeight);
    }
  };
  useEffect(() => {
    updateHeight();
  }, [calculateHeightTrigger])
  useEffect(() => {
    updateHeight();

    window.addEventListener("resize", updateHeight);

    let observer: ResizeObserver | undefined;
    if (typeof ResizeObserver !== "undefined" && listRef.current) {
      observer = new ResizeObserver(() => updateHeight());
      observer.observe(listRef.current);
    }

    return () => {
      window.removeEventListener("resize", updateHeight);
      observer?.disconnect();
    };
  }, []);
  useEffect(() => {
    if (!isLoading) {
      const id = requestAnimationFrame(updateHeight);
      return () => cancelAnimationFrame(id);
    }
  }, [isLoading]);

  const Row = useCallback(({ index, style, data }: any) => {
    const { items, variant } = data;
    const alert = items[index];
    if (!alert) return null;

    return (
      <div style={style}>
        <AlertCard
          key={index}
          alert={alert}
          type={alert.type?.toLowerCase() as "buy" | "sell"}
          variant={variant}
          index={index}
        />
      </div>
    );
  }, []);

  useQuery({
    queryKey: ["clear-alerts"],
    queryFn: async () => {
      const footer = await clearFooterSection("alerts");
      setFooterMessage(footer);
      return footer;
    },
    enabled: !isFetched.current,
  });

  const HeaderData = [
    {
      label: "Time",
      tooltipContent: "Time since the action was made",
      className: "min-w-[60px]",
      hidden: variant === "cupsey-snap",
    },
    {
      label: "Type",
      tooltipContent: "The type of transaction made",
      className: "min-w-[60px]",
      hidden: variant === "cupsey-snap",
    },
    {
      label: "Token",
      tooltipContent: "Token name and address",
      className:
        variant === "cupsey-snap" ? "min-w-[120px] pl-4" : "min-w-[190px]",
    },
    {
      label: "Amount",
      tooltipContent: "Amount of SOL put in and the amount of tokens bought",
      className: variant === "cupsey-snap" ? "min-w-[90px]" : "min-w-[110px]",
    },
    {
      label: variant === "cupsey-snap" ? "MC" : "Market Cap",
      tooltipContent: "Indicates token value",
      className: variant === "cupsey-snap" ? "min-w-[60px]" : "min-w-[110px]",
    },
    {
      label: variant === "cupsey-snap" ? "Wallet" : "Wallet Name",
      tooltipContent: "The name provided for the wallet",
      className: variant === "cupsey-snap" ? "min-w-[60px]" : "min-w-[130px]",
    },
    {
      label: "Mode",
      tooltipContent: "Type of transaction made",
      className: "min-w-[100px]",
      hidden: variant === "cupsey-snap",
    },
    {
      label: variant === "cupsey-snap" ? "" : "Action",
      tooltipContent:
        variant === "cupsey-snap"
          ? ""
          : "Action button which includes the Solscan link of the transaction",
      className:
        variant === "cupsey-snap" ? "min-w-0" : "min-w-[45px] justify-center",
    },
  ];

  return (
    <div className={cn("relative flex h-full w-full flex-grow flex-col")}>
      <div className="absolute left-0 top-0 flex h-full w-full flex-grow flex-col">
        <div
          className={cn(
            "header__table__container",
            isCupseyTheme ? "md:pl-0.5" : "md:pl-3.5",
            alerts && alerts?.length > 7 && "md:pr-3",
          )}
        >
          {(HeaderData || [])?.map(
            (item, index) => !item.hidden && <HeadCol key={index} {...item} />,
          )}
        </div>

        {isLoading ? (
          <div className="my-auto flex size-full flex-grow items-center justify-center">
            <LoadingState state="Alerts" />
          </div>
        ) : alerts && alerts?.length > 0 ? (
          <div className="nova-scroller relative flex h-full w-full flex-grow flex-col">
            <div
              ref={listRef}
              className="flex h-full w-full flex-col max-md:gap-y-2 max-md:p-3"
            >
              {listHeight > 0 && (
                <FixedSizeList
                  className={cn(
                    "nova-scroller",
                    variant === "cupsey-snap" && "!overflow-x-hidden",
                  )}
                  height={listHeight}
                  width="100%"
                  itemCount={alerts.length}
                  itemSize={
                    variant === "cupsey-snap" ? 40 : width! > 768 ? 64 : 114
                  }
                  itemData={{
                    items: alerts,
                    variant,
                  }}
                >
                  {Row}
                </FixedSizeList>
              )}
            </div>
          </div>
        ) : (
          <div className="flex w-full flex-grow items-center justify-center p-4">
            <EmptyState state="Alerts" />
          </div>
        )}
      </div>
    </div>
  );
}
