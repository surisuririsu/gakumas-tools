"use client";
import dynamic from "next/dynamic";
import styles from "./Charts.module.scss";

// chart.js, react-chartjs-2 and the boxplot plugin add ~85 KB gzipped, but a
// chart only appears after a simulation run or once scores exist. Load them
// on first render instead of with the page. The placeholder matches
// Chart.js's default 2:1 canvas so nothing moves when the chunk arrives.
function ChartPlaceholder() {
  return <div className={styles.placeholder} aria-hidden="true" />;
}

const lazyChart = (loader) =>
  dynamic(loader, { ssr: false, loading: ChartPlaceholder });

export const AreaPlot = lazyChart(() => import("@/components/AreaPlot"));
export const BoxPlot = lazyChart(() => import("@/components/BoxPlot"));
export const DistributionPlot = lazyChart(
  () => import("@/components/DistributionPlot")
);
export const LineChart = lazyChart(() => import("@/components/LineChart"));
