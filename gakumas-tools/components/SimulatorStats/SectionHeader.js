import { memo } from "react";
import TypeBar from "./TypeBar";
import styles from "./SimulatorStats.module.scss";

function SectionHeader({ title, numRuns, turnTypeCounts, totalScoreByType }) {
  return (
    <div className={styles.sectionHeader}>
      <span className={styles.title}>{title}</span>
      <TypeBar
        counts={turnTypeCounts}
        totalScoreByType={totalScoreByType}
        numRuns={numRuns}
      />
    </div>
  );
}

export default memo(SectionHeader);
