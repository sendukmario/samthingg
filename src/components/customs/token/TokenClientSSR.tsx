"use client";

// ######## Libraries 📦 & Hooks 🪝 ########
import React, { useEffect, useMemo } from "react";

import cookies from "js-cookie";
// ######## Components 🧩 ########
import {
  defaultTVChartProperties,
  defaultTVChartPropertiesMainSeriesProperties,
} from "@/constants/trading-view.constant";
import { useCharts } from "@/hooks/use-charts";
import { TokenDataMessageType } from "@/types/ws-general";
import { useParams } from "next/navigation";
import LeftTokenSection from "../sections/LeftTokenSection";
import TokenSSRConfig from "./TokenSSRConfig";
import RightTokenSection from "../sections/RightTokenSection";
import { convertDecimals } from "@/utils/convertDecimals";
import { convertChartHoldingsLamports } from "@/utils/lamportsConverter";
// const RightTokenSection = dynamic(
//   () => import("@/components/customs/sections/RightTokenSection"),
//   {
//     ssr: false,
//   },
// );
// const LeftTokenSection = dynamic(
//   () => import("@/components/customs/sections/LeftTokenSection"),
//   {
//     ssr: false,
//   },
// );

export default function TokenClientSSR() {
  const mint = useParams()?.["mint-address"] as string;

  const { data, isFetched } = useCharts({
    mintAddress: mint,
  });

  const initChartData = useMemo(() => {
    if (!data) return null;
    return convertChartHoldingsLamports(data as TokenDataMessageType);
  }, [data]);

  const setBaseTVState = () => {
    console.warn("TV BASE STATE DEBUG ✨");

    if (
      !localStorage.getItem("tradingview.chartproperties") ||
      localStorage
        .getItem("tradingview.chartproperties.mainSeriesProperties")
        ?.includes(`"candleStyle":{"upColor":"#089981","downColor":"#F23645"`)
    ) {
      localStorage.setItem(
        "tradingview.chartproperties",
        JSON.stringify(defaultTVChartProperties),
      );
    }
    if (
      !localStorage.getItem(
        "tradingview.chartproperties.mainSeriesProperties",
      ) ||
      localStorage
        .getItem("tradingview.chartproperties.mainSeriesProperties")
        ?.includes(`"candleStyle":{"upColor":"#089981","downColor":"#F23645"`)
    ) {
      localStorage.setItem(
        "tradingview.chartproperties.mainSeriesProperties",
        JSON.stringify(defaultTVChartPropertiesMainSeriesProperties),
      );
    }
  };

  useEffect(() => {
    // if (
    //   !cookies.get("_chart_interval_resolution") ||
    //   cookies.get("_chart_interval_resolution") === "USD" ||
    //   cookies.get("_chart_interval_resolution") === "SOL"
    // ) {
    //   cookies.set("_chart_interval_resolution", "1S");
    // }
    if (!localStorage.getItem("chart_currency")) {
      localStorage.setItem("chart_currency", "USD");
      cookies.set("_chart_currency", "USD");
    }
    if (!localStorage.getItem("chart_type")) {
      localStorage.setItem("chart_type", "MCap");
    }
    if (!localStorage.getItem("chart_hide_buy_avg_price_line")) {
      localStorage.setItem("chart_hide_buy_avg_price_line", "false");
    }
    if (!localStorage.getItem("chart_hide_sell_avg_price_line")) {
      localStorage.setItem("chart_hide_sell_avg_price_line", "false");
    }

    setBaseTVState();

    let themeSetCount = 0;
    const themeSetInterval = setInterval(() => {
      if (themeSetCount < 10) {
        themeSetCount++;
        setBaseTVState();
      } else {
        clearInterval(themeSetInterval);
      }
    }, 500);

    return () => {
      if (themeSetInterval) {
        clearInterval(themeSetInterval);
      }
    };
  }, []);

  return (
    <>
      <TokenSSRConfig initChartData={initChartData} isFetched={isFetched} />
      <LeftTokenSection
        mint={initChartData?.token?.mint || mint}
        initChartData={initChartData}
      />
      <RightTokenSection initChartData={initChartData} />
    </>
  );
}
