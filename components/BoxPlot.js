import { memo } from "react";
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
              `max: ${Math.round(max)}`,
              `q3: ${Math.round(q3)}`,
              `mean: ${Math.round(mean)}`,
              `median: ${Math.round(median)}`,
              `q1: ${Math.round(q1)}`,
              `min: ${Math.round(min)}`,
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
      coef: 0,
      backgroundColor: "rgba(255, 118, 0, 0.5)",
      borderColor: "rgb(255, 118, 0)",
      meanRadius: 0,
      maxBarThickness: 60,
    })),
  };

  return <Chart type="boxplot" data={formattedData} options={options} />;
}

export default memo(BoxPlot);
