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
import { Bar } from "react-chartjs-2";
import { NUM_RUNS, BUCKET_SIZE } from "@/simulator/constants";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function DistributionPlot({ data }) {
  const formattedData = {
    labels: Object.keys(data).map((k) => k * BUCKET_SIZE),
    datasets: [
      {
        label: `スコア (n=${NUM_RUNS})`,
        data: Object.values(data),
        backgroundColor: "rgba(255, 118, 0, 0.5)",
      },
    ],
  };
  return <Bar data={formattedData} />;
}

export default memo(DistributionPlot);
