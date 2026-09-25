import { memo } from "react";
import { usePopOnActivate } from "@/components/EntityBank/usePop";
import c from "@/utils/classNames";
import styles from "./PIdolCollection.module.scss";
import { pct } from "./utils";

const POP_CLASSES = { a: styles.popA, b: styles.popB };

function BreakdownRow({ row, animate }) {
  const pop = usePopOnActivate(row.active, animate);

  return (
    <button
      type="button"
      className={c(
        styles.breakdownRow,
        row.active && styles.breakdownActive,
        POP_CLASSES[pop],
      )}
      aria-pressed={row.active}
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
  );
}

function BreakdownGroup({ label, rows, animate }) {
  return (
    <div className={styles.breakdownGroup}>
      <div className={styles.breakdownLabel}>{label}</div>
      <div className={styles.breakdownRows}>
        {rows.map((row) => (
          <BreakdownRow key={row.key} row={row} animate={animate} />
        ))}
      </div>
    </div>
  );
}

export default memo(BreakdownGroup);
