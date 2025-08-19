import { areEqual } from "react-window";
import CosmoCard from "./cosmo";
import { memo, useMemo, useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { CosmoDataMessageType } from "@/types/ws-general";
import CosmoCardLoading from "../loadings/CosmoCardLoading";
import useSocialFeedMonitor from "@/hooks/use-social-feed-monitor";
import { ModuleType } from "@/utils/turnkey/serverAuth";

interface RowProps {
  data: {
    items: CosmoDataMessageType[];
    column: number;
    amount: number;
    isLoading: boolean;
    isBoarding?: boolean;
    module: ModuleType
  };
  index: number;
  style: React.CSSProperties;
}

// Memoized row component to prevent re-renders
const CosmoCardRow = memo(({ data, index, style }: RowProps) => {
  const { discordMessages } = useSocialFeedMonitor();

  const transformedItem = useMemo(() => {
    return (data.items || [])?.map((token) => {
      const isMonitored = (discordMessages || [])?.some(
        (msg) => msg.address === token.mint,
      );

      return {
        ...token,
        is_discord_monitored: isMonitored,
        discord_details: (discordMessages || [])?.find(
          (msg) => msg.address === token.mint,
        ),
      };
    });
  }, [data.items, discordMessages]);

  const item = transformedItem[index];

  const cardRef = useRef<HTMLDivElement>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [isHovered, setIsHovered] = useState(false);

  const progressColor = useMemo(() => {
    const p = item?.progress ?? 0;
    if (p <= 33) return "#F65B93"; // 0-33%
    if (p <= 66) return "#F0A664"; // 34-66%
    return "#85D6B1"; // 67-100%
  }, [item?.progress]);

  const isLoadingCard = !item || data.isLoading;

  useEffect(() => {
    if (isHovered && cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      setTooltipPos({
        x: rect.left + rect.width / 2,
        y: rect.top - 8,
      });
    } else {
      setTooltipPos(null);
    }
  }, [isHovered]);

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => setIsHovered(false);

  return (
    <div
      style={style}
      key={isLoadingCard ? index : item?.mint}
      ref={cardRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative"
    >
      {isLoadingCard ? (
        <CosmoCardLoading />
      ) : (
        <>
          {/* Cosmo card itself */}
          <CosmoCard
            module={data.module}
            isEven={index % 2 === 0}
            amount={data?.amount}
            isFirst={data?.isBoarding ? false : index === 0}
            data={item}
            column={data.column as 1 | 2 | 3}
          />

          {/* Portal tooltip */}
          {tooltipPos &&
            Number(item?.progress?.toFixed?.(2) ?? 0) >= 0 &&
            Number(item?.progress?.toFixed?.(2) ?? 0) < 100 &&
            createPortal(
              <div
                className="pointer-events-none fixed z-[9999999999] -translate-x-1/2 -translate-y-full opacity-100 transition-opacity duration-150"
                style={{ left: tooltipPos.x, top: tooltipPos.y }}
              >
                <span
                  className="whitespace-nowrap rounded-sm bg-[#2B2B3B] px-3 py-1.5 text-xs shadow-[0_4px_16px_#000000] backdrop-blur-[4px]"
                  style={{ color: progressColor }}
                >
                  Bonding: {`${item?.progress?.toFixed?.(2) ?? 0}%`}
                </span>
              </div>,
              document.body,
            )}
        </>
      )}
    </div>
  );
}, areEqual);

CosmoCardRow.displayName = "CosmoCardRow";
export default CosmoCardRow;
