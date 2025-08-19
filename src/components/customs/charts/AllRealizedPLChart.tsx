"use client";

// ######## Libraries 📦 & Hooks 🪝 ########
import { availableTimeframe, Timeframe } from "@/apis/rest/wallet-trade";
import { getPortofolioPnl, PnLDataPoint } from "@/apis/rest/wallet-trade-new";
import { useCustomizeTheme } from "@/hooks/use-customize-theme";
import { cn } from "@/libraries/utils";
import { useTradesWalletModalStore } from "@/stores/token/use-trades-wallet-modal.store";
import { usePopupStore } from "@/stores/use-popup-state.store";
import { useWindowSizeStore } from "@/stores/use-window-size.store";
import { formatAmountDollarPnL } from "@/utils/formatAmount";
import { formatPercentage } from "@/utils/formatPercentage";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { LoaderCircle } from "lucide-react";
import { useParams } from "next/navigation";
import { memo, useCallback, useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  TooltipProps,
  XAxis,
  YAxis,
} from "recharts";
import {
  NameType,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";

function AllRealizedPLChart({
  isModalContent = true,
}: {
  isModalContent?: boolean;
}) {
  const params = useParams<{ "wallet-address": string }>();
  const { width } = useWindowSizeStore();
  const { remainingScreenWidth } = usePopupStore();
  const theme = useCustomizeTheme();
  const { selectedTimeframe, setSelectedTimeframe } =
    useTradesWalletModalStore();

  const walletAddressState = useTradesWalletModalStore((state) => state.wallet);
  const walletAddress = isModalContent
    ? walletAddressState
    : (params?.["wallet-address"] ?? "");

  const {
    data: walletStatsDataPortofolio,
    isLoading,
    isRefetching,
  } = useQuery({
    queryKey: ["wallet-stats", walletAddress],
    queryFn: async () => {
      const res = await getPortofolioPnl(walletAddress);
      return res;
    },
    enabled: false,
  });

  function getPnLDataByTimeframe(data: PnLDataPoint[], currentTimeframe: typeof selectedTimeframe) {
    if (!data || data.length === 0) return [];

    const latestTimestamp = Math.max(...data.map(d => d.time));
    let cutoffTime = 0;

    let timeframeInSeconds = 0;
    switch (currentTimeframe) {
      case "1d":
        timeframeInSeconds = 86400;
        break;
      case "7d":
        timeframeInSeconds = 86400 * 7;
        break;
      case "30d":
        timeframeInSeconds = 86400 * 30;
        break;
      case "360d":
        timeframeInSeconds = 86400 * 360;
        break;
      default:
        timeframeInSeconds = 0;
    }

    // Only apply cutoff if data actually covers that range
    if (timeframeInSeconds > 0) {
      const earliestTimestamp = Math.min(...data.map(d => d.time));
      const maxTimeRangeAvailable = latestTimestamp - earliestTimestamp;

      if (maxTimeRangeAvailable >= timeframeInSeconds) {
        cutoffTime = latestTimestamp - timeframeInSeconds;
      }
    }

    const filtered = data.filter(d => d.time >= cutoffTime);
    const sorted = filtered.sort((a, b) => a.time - b.time);
    return sorted;
  }

  // Process and transform chart data
  const processedChartData = useMemo(() => {
    const chartData = walletStatsDataPortofolio?.chart_data;
    if (!Array.isArray(chartData)) return [];

    // Sort data by timestamp to ensure correct cumulative calculation
    const sortedData = getPnLDataByTimeframe(chartData, selectedTimeframe);

    let cumulativePnl = 0;
    return sortedData?.map((item) => {
      cumulativePnl += Number(item.value);

      return {
        ...item,
        cumulativePnlUsd: cumulativePnl,
        timestamp:
          String(item.time).length <= 10 ? item.time * 1000 : item.time, // Convert to milliseconds for better date handling
      };
    });
  }, [walletStatsDataPortofolio?.chart_data, selectedTimeframe]);

  const dataMax = useMemo(() => {
    if (!processedChartData.length) return 0;

    const max = Math.max(
      ...processedChartData?.map((item) => item.cumulativePnlUsd),
    );
    const min = Math.min(
      ...processedChartData?.map((item) => item.cumulativePnlUsd),
    );

    // Handle both positive and negative values
    if (max === 0 && min === 0) return 10_000;
    return Math.ceil(Math.max(Math.abs(max), Math.abs(min)) * 0.1);
  }, [processedChartData]);

  const dataMin = useMemo(() => {
    if (!processedChartData.length) return 0;

    const min = Math.min(
      ...processedChartData?.map((item) => item.cumulativePnlUsd),
    );
    if (min === 0) return 0;
    return Math.floor(min * 0.1);
  }, [processedChartData]);

  const allRealizedPnL = useMemo(() => {
    if (!walletStatsDataPortofolio)
      return {
        formattedPercentage: "0%",
        formattedProfit: "$0",
        percentageRealizedPnl: 0,
      };

    let pnlBasedOnTimeframe = walletStatsDataPortofolio?.pnlAllTime;
    switch (selectedTimeframe) {
      case "360d":
        pnlBasedOnTimeframe = walletStatsDataPortofolio.pnlAllTime;
        break;
      case "1d":
        pnlBasedOnTimeframe = walletStatsDataPortofolio.pnl_1_day;
        break;
      case "7d":
        pnlBasedOnTimeframe = walletStatsDataPortofolio.pnl_7_day;
        break;
      case "30d":
        pnlBasedOnTimeframe = walletStatsDataPortofolio.pnl_30_day;
        break;
      default:
        pnlBasedOnTimeframe = walletStatsDataPortofolio.pnlAllTime;
    }

    return {
      formattedPercentage: formatPercentage(
        pnlBasedOnTimeframe.realized_pnl_percentage,
      ),
      formattedProfit: formatAmountDollarPnL(
        pnlBasedOnTimeframe.realized_pnl_usd,
      ),
      percentageRealizedPnl: pnlBasedOnTimeframe.realized_pnl_percentage,
    };
  }, [walletStatsDataPortofolio, selectedTimeframe]);

  const handleSelectTimeframe = useCallback(
    (option: Timeframe) => {
      setSelectedTimeframe(option);
    },
    [setSelectedTimeframe],
  );

  return (
    <div
      className={cn(
        "flex h-full w-full flex-col gap-y-3 rounded-t-[20px] bg-background p-3 md:gap-y-3 md:p-[12px]",
        !isModalContent && "rounded-[8px]",
      )}
      style={theme.background}
    >
      <div
        className={cn(
          "flex h-fit w-full flex-col justify-between gap-[8px] md:flex-row md:items-center md:gap-0",
          remainingScreenWidth < 800 &&
            !isModalContent &&
            "md:flex-col md:items-start md:gap-2",
        )}
      >
        <div className="flex items-center gap-x-2">
          <h4 className="line-clamp-1 font-geistSemiBold text-base text-fontColorPrimary">
            All Realized P&L
          </h4>
          <span
            className={cn(
              "font-geistSemiBold text-sm",
              allRealizedPnL.percentageRealizedPnl > 0
                ? "text-success"
                : "text-destructive",
            )}
          >
            {allRealizedPnL.formattedProfit}{" "}
            {allRealizedPnL.formattedPercentage}
          </span>
        </div>

        <div className="flex h-[32px] w-fit flex-shrink-0 items-center overflow-hidden rounded-[8px] border border-border">
          <div className="flex h-full items-center justify-center pl-4 pr-3.5">
            <span
              className={cn(
                "inline-block text-nowrap font-geistSemiBold text-sm text-fontColorSecondary",
                width! < 400 && "text-xs",
              )}
            >
              Presets
            </span>
          </div>
          <div className="h-full p-[2px]">
            <div className="flex h-full flex-row-reverse items-center rounded-[6px] bg-white/[8%]">
              {availableTimeframe?.map((option, index) => {
                const isActive = selectedTimeframe === option;

                return (
                  <button
                    key={index + option}
                    onClick={() => handleSelectTimeframe(option)}
                    className={cn(
                      "h-full rounded-[6px] px-3 font-geistSemiBold text-sm uppercase text-fontColorPrimary duration-300",
                      isActive ? "bg-white/[8%]" : "bg-transparent",
                      width! < 400 && "text-xs",
                    )}
                  >
                    {option === "30d"
                      ? "1M"
                      : option === "360d"
                        ? "ALL"
                        : option}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="relative">
        {(isLoading || isRefetching) && (
          <div className="absolute inset-0 z-10 flex w-full items-center justify-center bg-white/[4%] backdrop-blur-md">
            <span className="flex items-center gap-2 text-sm text-fontColorSecondary">
              <LoaderCircle className="size-4 animate-spin" />
              <span>Loading chart ...</span>
            </span>
          </div>
        )}

        <ResponsiveContainer
          width="100%"
          height={
            !isModalContent && width! > 768 && remainingScreenWidth > 800
              ? 155
              : 100
          }
        >
          <AreaChart data={processedChartData}>
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F65B93" stopOpacity={1} />
                <stop offset="20%" stopColor="#F65B93" stopOpacity={1} />
                <stop offset="50%" stopColor="#F65B93" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#F65B93" stopOpacity={0.2} />
              </linearGradient>

              <linearGradient
                id="areaGradientSuccess"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor="#00C9B3" stopOpacity={1} />
                <stop offset="20%" stopColor="#00C9B3" stopOpacity={1} />
                <stop offset="50%" stopColor="#00C9B3" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#006358" stopOpacity={0.2} />
              </linearGradient>

              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur
                  in="SourceGraphic"
                  stdDeviation="3"
                  result="blur"
                />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <CartesianGrid
              horizontal={true}
              vertical={false}
              strokeDasharray="7 5"
              stroke="#242436"
            />

            <Tooltip
              content={<MemoizedTooltip />}
              cursor={{ fill: "transparent" }}
              wrapperStyle={theme.backgroundCosmo}
            />
            <XAxis
              hide={true}
              dataKey="timestamp"
              stroke="#242436"
              tick={{ fill: "#aaa", fontSize: 13 }}
              tickFormatter={(value) => new Date(value).toLocaleDateString()}
            />
            <YAxis
              orientation="right"
              dataKey="cumulativePnlUsd"
              stroke="#FFFFFF"
              tick={{ fill: "#9191A4", fontSize: 13 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) =>
                `${formatAmountDollarPnL(Number(value))}`
              }
              tickCount={6}
              domain={[dataMin, dataMax]}
            />

            <Area
              type="monotone"
              dataKey="cumulativePnlUsd"
              stroke={
                allRealizedPnL.percentageRealizedPnl > 0
                  ? "url(#areaGradientSuccess)"
                  : "url(#areaGradient)"
              }
              strokeWidth={2}
              fillOpacity={0.08}
              fill={
                allRealizedPnL.percentageRealizedPnl > 0
                  ? "url(#areaGradientSuccess)"
                  : "url(#areaGradient)"
              }
              style={{ filter: "url(#glow)" }}
              dot={false}
              isAnimationActive={false}
            />

            <Area
              type="monotone"
              dataKey="cumulativePnlUsd"
              stroke={
                allRealizedPnL.percentageRealizedPnl > 0 ? "#8CD9B6" : "#F65B93"
              }
              strokeWidth={2}
              fillOpacity={0}
              style={{
                mixBlendMode: "lighten",
              }}
              dot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function CustomTooltip({
  active,
  payload,
  label,
  wrapperStyle,
}: TooltipProps<ValueType, NameType>) {
  if (active && payload && payload.length) {
    const formattedDate = format(new Date(label), "EEE, MMM dd, yyyy, hh:mm a");
    const formattedProfit = formatAmountDollarPnL(payload[0].value as string);
    return (
      <div
        className="flex flex-col gap-1 border border-border bg-card p-2 text-fontColorPrimary"
        style={wrapperStyle}
      >
        <h1 className="text-sm">
          {Number(payload[0].value) > 0 ? "+" : ""}
          {formattedProfit}
        </h1>
        <span className="text-xs text-fontColorSecondary">{formattedDate}</span>
      </div>
    );
  }
  return null;
}

const MemoizedTooltip = memo(CustomTooltip);

export default memo(AllRealizedPLChart);
