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
import { MIN_BUCKET_SIZE } from "@/simulator/constants";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function DistributionPlot({ label, data, bucketSize, color }) {
  const formattedData = {
    labels: Object.keys(data).map((k) => k * bucketSize),
    datasets: [
      {
        label,
        data: Object.values(data),
        backgroundColor: color || "rgba(243, 152, 0, 0.75)",
      },
    ],
  };
  return <Bar data={formattedData} />;
}

export default memo(DistributionPlot);
