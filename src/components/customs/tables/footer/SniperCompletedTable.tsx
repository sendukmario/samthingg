"use client";

// ######## Libraries 📦 & Hooks 🪝 ########
import { useCallback, useEffect, useRef, useState } from "react";
import { FixedSizeList } from "react-window";
// ######## Components 🧩 ########
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";
import SniperCard from "@/components/customs/cards/footer/SniperCard";
import HeadCol from "@/components/customs/tables/HeadCol";
import { SniperTask } from "@/apis/rest/sniper";
import EmptyState from "../../EmptyState";
import LoadingState from "../../LoadingState";
import { useWindowSizeStore } from "@/stores/use-window-size.store";
import { cn } from "@/libraries/utils";

export default function SniperCompletedTable({
  isLoading,
  tasks,
  variant = "default",
}: {
  tasks?: SniperTask[];
  isLoading: boolean;
  variant?: "default" | "cupsey-snap";
}) {
  const width = useWindowSizeStore((state) => state.width);

  // List height measurement
  const listRef = useRef<HTMLDivElement>(null);
  const [listHeight, setListHeight] = useState(0);

  // Effect to update list height
  useEffect(() => {
    const updateHeight = () => {
      if (listRef.current) {
        setListHeight(listRef.current.clientHeight);
      }
    };
    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  // Memoized row renderer for virtualization
  const Row = useCallback(({ index, style, data }: any) => {
    const { items, isLoading, variant } = data;
    if (isLoading) return null;

    const task = items[index];
    if (!task) return null;

    return (
      <div style={style}>
        <SniperCard
          index={index}
          type="completed"
          key={task.taskId}
          task={task}
          variant={variant}
        />
      </div>
    );
  }, []);

  // Filter completed tasks
  const completedTasks =
    (tasks || [])
      ?.filter((t: any) => t.isCompleted || t.progress == "Snipe Successful")
      ?.reverse() || [];

  const HeaderData = [
    {
      label: variant === "cupsey-snap" ? "Task" : "Task Status",
      className:
        variant === "cupsey-snap" ? "min-w-[40px] w-[40px]" : "min-w-[120px]",
    },
    {
      label: "Token",
      className: variant === "cupsey-snap" ? "min-w-[150px]" : "min-w-[170px]",
    },
    {
      label: "Snipe",
      className: "min-w-[20px]",
      hidden: variant === "cupsey-snap",
    },
    {
      label: "SOL",
      className:
        variant === "cupsey-snap" ? "w-[90px] min-w-[90px]" : "min-w-[70px]",
    },
    {
      label: "Progress",
      className: variant === "cupsey-snap" ? "min-w-[150px]" : "min-w-[200px]",
    },
    {
      label: "Presets",
      className: "min-w-[155px]",
      hidden: variant === "cupsey-snap",
    },
    {
      label: "Actions",
      className:
        variant === "cupsey-snap"
          ? "w-[70px] min-w-[70px] justify-end"
          : "min-w-[90px] justify-end",
    },
  ];

  return (
    <div className="flex w-full flex-grow flex-col">
      {/* Header */}
      <div
        className={cn(
          "header__table__container px-4",
          variant === "cupsey-snap" && "px-4 !pr-4",
        )}
      >
        {(HeaderData || [])?.map(
          (item, index) => !item.hidden && <HeadCol key={index} {...item} />,
        )}
      </div>
      <div className="nova-scroller relative w-full flex-grow">
        <div className="absolute left-0 top-0 flex h-full w-full flex-grow flex-col">
          <div
            ref={listRef}
            className="flex h-full w-full flex-col max-md:gap-2 max-md:p-3"
          >
            {isLoading ? (
              <div className="my-auto flex size-full flex-grow items-center justify-center">
                <LoadingState state="Sniper" />
              </div>
            ) : completedTasks.length > 0 ? (
              listHeight > 0 && (
                <FixedSizeList
                  className="nova-scroller"
                  height={listHeight}
                  width="100%"
                  itemCount={completedTasks.length}
                  itemSize={
                    variant === "cupsey-snap" ? 40 : width! > 768 ? 64 : 114
                  }
                  itemData={{
                    items: completedTasks,
                    isLoading,
                    variant,
                  }}
                >
                  {Row}
                </FixedSizeList>
              )
            ) : (
              <div className="my-auto flex size-full flex-grow items-center justify-center">
                <EmptyState
                  state="Sniper"
                  className={variant === "cupsey-snap" ? "scale-[0.8]" : ""}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
