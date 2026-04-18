import { memo } from "react";
import c from "@/utils/classNames";
import { TYPES } from "./constants";
import { formatScore } from "./helpers";
import TypeBar from "./TypeBar";
import styles from "./SimulatorStats.module.scss";

function SectionHeader({ title, numRuns, turnTypeCounts, totalScoreByType }) {
  return (
    <div className={styles.sectionHeader}>
      <div className={styles.headerRow}>
        <span className={styles.title}>{title}</span>
        <div className={styles.typeChips}>
          {TYPES.map((type) => {
            const count = turnTypeCounts[type];
            if (!count) return null;
            const avgScore = totalScoreByType[type] / numRuns;
            return (
              <span key={type} className={c(styles.chip, styles[type])}>
                ×{count} · {formatScore(avgScore)}
              </span>
            );
          })}
        </div>
      </div>
      <TypeBar counts={turnTypeCounts} />
    </div>
  );
}

export default memo(SectionHeader);
