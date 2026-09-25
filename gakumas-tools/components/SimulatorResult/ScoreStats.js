import { memo, useState } from "react";
import { useTranslations } from "next-intl";
import c from "@/utils/classNames";
import styles from "./SimulatorResult.module.scss";

const SPARKLE_COUNT = 7;
const SPARKLE_PATH =
  "M12 1l2.6 8.4L23 12l-8.4 2.6L12 23l-2.6-8.4L1 12l8.4-2.6z";
const KEYS = ["min", "average", "median", "max"];

function ScoreStats({ data }) {
  const t = useTranslations("SimulatorResult");
  const [shownData, setShownData] = useState(data);
  const [runs, setRuns] = useState(0);
  if (data !== shownData) {
    setShownData(data);
    setRuns(runs + 1);
  }
  const beat = runs % 2 ? styles.beatA : styles.beatB;

  const values = [
    data.minRun.score,
    data.averageScore,
    data.medianScore,
    data.maxRun.score,
  ];

  return (
    <div className={styles.statsWrap}>
      <table className={c(styles.stats, beat)}>
        <thead>
          <tr>
            {KEYS.map((key) => (
              <th key={key} className={key == "average" ? styles.hero : null}>
                {t(key)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {values.map((value, i) => (
              <td
                key={KEYS[i]}
                className={KEYS[i] == "average" ? styles.hero : null}
                style={{ "--score": Math.round(value) }}
              >
                {value}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
      <span
        className={c(styles.burst, beat)}
        aria-hidden="true"
        data-export-hide="true"
      >
        {Array.from({ length: SPARKLE_COUNT }, (_, i) => (
          <svg key={i} className={styles.sparkle} viewBox="0 0 24 24">
            <path d={SPARKLE_PATH} />
          </svg>
        ))}
      </span>
    </div>
  );
}

export default memo(ScoreStats);
