import { memo, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
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
import { S } from "gakumas-engine";
import c from "@/utils/classNames";
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

function AreaPlot({ data, plan }) {
  const t = useTranslations("stage");

  const FIELDS = useMemo(
    () => ({
      score: {
        label: t("score"),
        color: "rgba(68, 187, 255, 0.25)",
        yAxisID: "y1",
      },
      stamina: {
        label: t("stamina"),
        color: "rgba(0, 211, 91, 0.25)",
      },
      genki: {
        label: t("genki"),
        color: "rgba(68, 246, 255, 0.25)",
      },
      ...(plan == "sense"
        ? {
            goodConditionTurns: {
              label: t("goodConditionTurns"),
              color: "rgba(255, 102, 119, 0.25)",
            },
            concentration: {
              label: t("concentration"),
              color: "rgba(255, 118, 0, 0.25)",
            },
          }
        : {}),
      ...(plan == "logic"
        ? {
            goodImpressionTurns: {
              label: t("goodImpressionTurns"),
              color: "rgba(255, 243, 74, 0.25)",
            },
            motivation: {
              label: t("motivation"),
              color: "rgba(214, 214, 214, 0.25)",
            },
          }
        : {}),
    }),
    [t]
  );

  const [activeFields, setActiveFields] = useState({
    stamina: true,
    score: true,
  });

  const options = {
    scales: {
      x: {
        title: {
          display: true,
          text: t("turn"),
        },
      },
      y: {
        title: {
          display: true,
          text: t("average"),
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
        grid: {
          display: false,
        },
      },
    },
  };

  const formattedData = {
    labels: data[S.score].map((_, i) => i),
    datasets: Object.keys(FIELDS)
      .filter((f) => activeFields[f])
      .map((field) => ({
        label: FIELDS[field].label,
        data: data[S[field]].map((v) => parseFloat(v.toFixed(2))),
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
            className={c(activeFields[field] && styles.selected)}
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
