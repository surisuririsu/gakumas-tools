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
import { S } from "gakumas-engine/structured";
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
            prideTurns: {
              label: t("prideTurns"),
              color: "rgba(255, 182, 193, 0.25)",
            },
          }
        : {}),
      ...(plan == "anomaly"
        ? {
            cumulativeFullPowerCharge: {
              label: t("cumulativeFullPowerCharge"),
              color: "rgba(186, 85, 211, 0.25)",
            },
            strengthTimes: {
              label: t("strengthTimes"),
              color: "rgba(255, 99, 132, 0.25)",
            },
            preservationTimes: {
              label: t("preservationTimes"),
              color: "rgba(75, 192, 192, 0.25)",
            },
            fullPowerTimes: {
              label: t("fullPowerTimes"),
              color: "rgba(255, 159, 64, 0.25)",
            },
            // Synthesized: sum of the three stance-times series. The engine
            // exposes `stanceChangedTimes` only as a derived resolver, so we
            // compute it here from the components rather than add a state
            // field.
            stanceChangedTimes: {
              label: t("stanceChangedTimes"),
              color: "rgba(153, 102, 255, 0.25)",
              compute: (data) => {
                const a = data[S.strengthTimes] || [];
                const b = data[S.preservationTimes] || [];
                const c = data[S.fullPowerTimes] || [];
                const n = Math.max(a.length, b.length, c.length);
                const out = [];
                for (let i = 0; i < n; i++) {
                  out.push((a[i] || 0) + (b[i] || 0) + (c[i] || 0));
                }
                return out;
              },
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
      .map((field) => {
        const config = FIELDS[field];
        const raw = config.compute ? config.compute(data) : data[S[field]];
        return {
          label: config.label,
          data: raw.map((v) => parseFloat(v.toFixed(2))),
          backgroundColor: config.color,
          fill: true,
          yAxisID: config.yAxisID || "y",
        };
      }),
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
