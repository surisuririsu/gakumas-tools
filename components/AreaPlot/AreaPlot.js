import { memo, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Filler,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import styles from "./AreaPlot.module.scss";

ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Filler,
  Title,
  Tooltip,
  Legend
);

const FIELDS = {
  score: {
    label: "スコア",
    color: "rgba(68, 187, 255, 0.25)",
    yAxisID: "y1",
  },
  stamina: {
    label: "体力",
    color: "rgba(0, 211, 91, 0.25)",
  },
  genki: {
    label: "元気",
    color: "rgba(68, 246, 255, 0.25)",
  },
  goodConditionTurns: {
    label: "好調",
    color: "rgba(255, 102, 119, 0.25)",
  },
  concentration: {
    label: "集中",
    color: "rgba(255, 118, 0, 0.25)",
  },
  goodImpressionTurns: {
    label: "好印象",
    color: "rgba(255, 243, 74, 0.25)",
  },
  motivation: {
    label: "やる気",
    color: "rgba(214, 214, 214, 0.25)",
  },
};

function AreaPlot({ data }) {
  const [activeFields, setActiveFields] = useState({
    stamina: true,
    score: true,
  });

  const options = {
    scales: {
      x: {
        title: {
          display: true,
          text: "ターン",
        },
      },
      y: {
        title: {
          display: true,
          text: "平均値",
        },
        type: "linear",
        display: true,
        position: "left",
        beginAtZero: true,
      },
      y1: {
        type: "linear",
        display: activeFields.score,
        position: "right",
        beginAtZero: true,
      },
    },
  };

  const formattedData = {
    labels: data.score.map((_, i) => i + 1),
    datasets: Object.keys(FIELDS)
      .filter((f) => activeFields[f])
      .map((field) => ({
        label: FIELDS[field].label,
        data: data[field].map((v) => parseFloat(v.toFixed(2))),
        backgroundColor: FIELDS[field].color,
        fill: true,
        yAxisID: FIELDS[field].yAxisID || "y",
      })),
  };

  return (
    <div>
      <div className={styles.fieldButtons}>
        {Object.keys(FIELDS).map((field) => (
          <button
            key={field}
            className={activeFields[field] ? styles.selected : ""}
            onClick={() =>
              setActiveFields({
                ...activeFields,
                [field]: !activeFields[field],
              })
            }
          >
            {FIELDS[field].label}
          </button>
        ))}
      </div>

      <Line data={formattedData} options={options} />
    </div>
  );
}

export default memo(AreaPlot);
