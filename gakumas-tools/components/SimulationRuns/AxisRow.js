import { memo } from "react";
import styles from "./SimulationRuns.module.scss";

const compact = new Intl.NumberFormat(undefined, {
  notation: "compact",
  maximumFractionDigits: 1,
});

function AxisRow({ ticks, xMin, xMax }) {
  if (!ticks?.length || xMax <= xMin) return null;
  const span = xMax - xMin;
  const pct = (v) => ((v - xMin) / span) * 100;

  return (
    <div className={styles.axisRow} aria-hidden>
      <div className={styles.axisPlot}>
        {ticks.map((v, i) => {
          const x = pct(v);
          if (x < 0 || x > 100) return null;
          return (
            <span
              key={i}
              className={styles.axisLabel}
              style={{ left: `${x}%` }}
            >
              {compact.format(v)}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export default memo(AxisRow);
