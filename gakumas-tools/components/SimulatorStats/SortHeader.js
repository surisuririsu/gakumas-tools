import { memo } from "react";
import c from "@/utils/classNames";
import styles from "./SimulatorStats.module.scss";

function SortHeader({ label, col, sort, onSort, className }) {
  const active = sort.by === col;
  const arrow = active ? (sort.dir === "desc" ? " ↓" : " ↑") : "";
  return (
    <th
      className={c(styles.sortable, active && styles.activeSort, className)}
      onClick={() => onSort(col)}
    >
      {label}
      <span className={styles.sortArrow}>{arrow}</span>
    </th>
  );
}

export default memo(SortHeader);
