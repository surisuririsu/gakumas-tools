import { memo } from "react";
import c from "@/utils/classNames";
import styles from "./PIdolCollection.module.scss";

function pct(num, denom) {
  if (!denom) return "0.0";
  return ((num / denom) * 100).toFixed(1);
}

function BreakdownGroup({ label, rows }) {
  return (
    <div className={styles.breakdownGroup}>
      <div className={styles.breakdownLabel}>{label}</div>
      <div className={styles.breakdownRows}>
        {rows.map((row) => (
          <button
            key={row.key}
            type="button"
            className={c(
              styles.breakdownRow,
              row.active && styles.breakdownActive,
            )}
            onClick={row.onClick}
          >
            <span className={styles.breakdownIcon}>{row.icon}</span>
            <span className={styles.breakdownCount}>
              {row.have}/{row.total}
            </span>
            <span className={styles.breakdownPct}>
              {pct(row.have, row.total)}%
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default memo(BreakdownGroup);
