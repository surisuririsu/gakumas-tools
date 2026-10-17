import { memo, useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { CHART_COLORS, verticalGradient } from "@/components/Charts/theme";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const compact = new Intl.NumberFormat(undefined, {
  notation: "compact",
  maximumFractionDigits: 1,
});

const OPTIONS = {
  scales: {
    x: {
      grid: { display: false },
      ticks: {
        callback(value) {
          return compact.format(this.getLabelForValue(value));
        },
      },
    },
    y: {
      beginAtZero: true,
      ticks: { callback: (v) => `${v}%` },
    },
  },
  plugins: {
    tooltip: {
      callbacks: {
        label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(1)}%`,
      },
    },
  },
};

function ComparisonHistogram({ labels, series }) {
  const data = useMemo(
    () => ({
      labels,
      datasets: series.map(({ label, data, tone }) => ({
        label,
        data,
        backgroundColor: ({ chart }) =>
          verticalGradient(
            chart,
            CHART_COLORS[tone],
            CHART_COLORS[`${tone}Top`],
          ),
        borderRadius: { topLeft: 4, topRight: 4 },
        borderSkipped: "bottom",
        categoryPercentage: 0.9,
        barPercentage: 1,
      })),
    }),
    [labels, series],
  );

  return <Bar data={data} options={OPTIONS} />;
}

export default memo(ComparisonHistogram);
