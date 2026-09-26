import { Chart, Legend, Tooltip } from "chart.js";

Chart.register(Legend, Tooltip);

export const CHART_COLORS = {
  bar: "#1c8fe8",
  barTop: "#5bc0ff",
  highlight: "#f39800",
  highlightTop: "#ffc766",
  boxFill: "#e3f1fd",
  whisker: "#7fafde",
  grid: "#ececf1",
  tick: "#8a8a93",
  ink: "#1c1c22",
};

Chart.defaults.set("font", {
  family: getComputedStyle(document.body).fontFamily,
  size: 11,
  weight: 600,
});
Chart.defaults.color = CHART_COLORS.tick;
Chart.defaults.borderColor = CHART_COLORS.grid;
Chart.defaults.set("scale", { border: { display: false }, ticks: { padding: 6 } });
Chart.defaults.set("plugins.legend.labels", {
  boxWidth: 10,
  boxHeight: 10,
  useBorderRadius: true,
  borderRadius: 3,
});
Chart.defaults.set("plugins.tooltip", {
  backgroundColor: "rgba(28, 28, 34, 0.92)",
  cornerRadius: 10,
  padding: 10,
  caretSize: 5,
  boxPadding: 4,
  usePointStyle: true,
  titleFont: { weight: 700 },
  bodyFont: { weight: 600 },
});
Chart.defaults.set("animation", { duration: 650, easing: "easeOutQuart" });

export function verticalGradient(chart, bottom, top) {
  const area = chart.chartArea;
  if (!area) return bottom;
  const gradient = chart.ctx.createLinearGradient(0, area.bottom, 0, area.top);
  gradient.addColorStop(0, bottom);
  gradient.addColorStop(1, top);
  return gradient;
}
