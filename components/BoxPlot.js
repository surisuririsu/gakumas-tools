import { memo } from "react";
import { useTranslations } from "next-intl";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Chart } from "react-chartjs-2";
import {
  BoxPlotController,
  BoxAndWiskers,
} from "@sgratzl/chartjs-chart-boxplot";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  BoxPlotController,
  BoxAndWiskers
);

function BoxPlot({ labels, data, showLegend = true, showXAxis = true }) {
  const t = useTranslations("BoxPlot");
  const options = {
    scales: {
      x: {
        display: showXAxis,
      },
    },
    plugins: {
      legend: {
        display: showLegend,
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const { max, mean, median, min, q1, q3 } = context.parsed;
            return [
              `${t("max")}: ${Math.round(max)}`,
              `${t("q3")}: ${Math.round(q3)}`,
              `${t("mean")}: ${Math.round(mean)}`,
              `${t("median")}: ${Math.round(median)}`,
              `${t("q1")}: ${Math.round(q1)}`,
              `${t("min")}: ${Math.round(min)}`,
              "(k=3)",
            ];
          },
        },
      },
    },
  };

  const formattedData = {
    labels,
    datasets: data.map((d) => ({
      label: d.label,
      data: d.data,
      coef: 3,
      backgroundColor: "rgba(255, 118, 0, 0.5)",
      borderColor: "rgb(255, 118, 0)",
      outlierBorderColor: "rgb(255, 118, 0)",
      meanRadius: 0,
      maxBarThickness: 60,
    })),
  };

  return <Chart type="boxplot" data={formattedData} options={options} />;
}

export default memo(BoxPlot);
