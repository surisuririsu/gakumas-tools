import React from "react";
import { useTranslations } from "next-intl";
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Scatter } from "react-chartjs-2";

ChartJS.register(LinearScale, PointElement, LineElement, Tooltip, Legend);

const PARAMETER_NAMES = ["Vo", "Da", "Vi"];
const PARAMETER_COLORS = [
  "rgba(242, 53, 132, 1)",
  "rgba(28, 133, 237, 1)",
  "rgba(247, 177, 46, 1)",
];
const PARAMETER_COLORS_TRANSPARENT = [
  "rgba(242, 53, 132, 0.5)",
  "rgba(28, 133, 237, 0.5)",
  "rgba(247, 177, 46, 0.5)",
];

export default function LineChart({
  paramOrder,
  paramRegimes,
  scores,
  gainedParams,
}) {
  const t = useTranslations("ProduceRankCalculator");

  const options = {
    scales: {
      x: {
        type: "linear",
        position: "bottom",
        title: {
          display: true,
          text: t("score"),
          padding: 1,
        },
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: t("parameter"),
          padding: 0,
        },
      },
    },

    plugins: {
      legend: {
        display: false,
      },
    },
  };

  const data = {
    datasets: paramOrder
      .map((order, i) => {
        const regimes = paramRegimes[order];
        const data = regimes.map(({ threshold, constant }) => ({
          x: threshold,
          y: constant,
        }));
        return {
          label: PARAMETER_NAMES[i],
          data,
          pointRadius: 2,
          showLine: true,
          borderWidth: 2,
          borderColor: PARAMETER_COLORS[i],
          backgroundColor: PARAMETER_COLORS[i],
        };
      })
      .concat(
        scores.map((score, i) => ({
          data: [{ x: score, y: gainedParams[i] }],
          pointRadius: 8,
          borderColor: PARAMETER_COLORS[i],
          backgroundColor: PARAMETER_COLORS_TRANSPARENT[i],
        }))
      ),
  };

  return <Scatter options={options} data={data} />;
}
