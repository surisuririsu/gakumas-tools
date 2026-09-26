import { memo } from "react";
import c from "@/utils/classNames";
import { TYPES } from "./constants";
import { formatScore } from "./helpers";
import styles from "./SimulatorStats.module.scss";

function TypeBar({ counts, totalScoreByType, numRuns }) {
  return (
    <div className={styles.typeBar}>
      {TYPES.map((type) => {
        const count = counts[type];
        if (!count) return null;
        const avgScore = totalScoreByType[type] / numRuns;
        return (
          <span
            key={type}
            className={c(styles.typeSegment, styles[type])}
            style={{ flexGrow: count }}
          >
            ×{count} · {formatScore(avgScore)}
          </span>
        );
      })}
    </div>
  );
}

export default memo(TypeBar);
