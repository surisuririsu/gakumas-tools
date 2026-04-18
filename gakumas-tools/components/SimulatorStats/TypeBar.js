import { memo } from "react";
import { TYPES } from "./constants";
import styles from "./SimulatorStats.module.scss";

function TypeBar({ counts }) {
  const total = counts.vocal + counts.dance + counts.visual;
  if (!total) return <div className={styles.typeBar} />;
  return (
    <div className={styles.typeBar}>
      {TYPES.map((type) =>
        counts[type] > 0 ? (
          <div
            key={type}
            className={styles[type]}
            style={{ width: `${(counts[type] / total) * 100}%` }}
          />
        ) : null,
      )}
    </div>
  );
}

export default memo(TypeBar);
