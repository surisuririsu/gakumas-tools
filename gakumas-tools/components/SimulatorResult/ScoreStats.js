import { memo, useState } from "react";
import { useTranslations } from "next-intl";
import c from "@/utils/classNames";
import useCountUp from "@/utils/useCountUp";
import styles from "./SimulatorResult.module.scss";

const SPARKLE_COUNT = 7;
const SPARKLE_PATH =
  "M12 1l2.6 8.4L23 12l-8.4 2.6L12 23l-2.6-8.4L1 12l8.4-2.6z";

function CountUp({ value }) {
  return useCountUp(value);
}

function ScoreStats({ data }) {
  const t = useTranslations("SimulatorResult");
  const [shownData, setShownData] = useState(data);
  const [runs, setRuns] = useState(0);
  if (data !== shownData) {
    setShownData(data);
    setRuns(runs + 1);
  }
  const beat = runs % 2 ? styles.beatA : styles.beatB;

  const stats = [
    ["min", data.minRun.score],
    ["average", data.averageScore],
    ["median", data.medianScore],
    ["max", data.maxRun.score],
  ];

  return (
    <div className={styles.statsWrap}>
      <div className={c(styles.stats, beat)}>
        {stats.map(([key, value]) => (
          <div
            key={key}
            className={c(styles.stat, key == "average" && styles.hero)}
          >
            <span className={styles.statLabel}>{t(key)}</span>
            <span className={styles.statValue}>
              <CountUp value={value} />
            </span>
          </div>
        ))}
      </div>
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
