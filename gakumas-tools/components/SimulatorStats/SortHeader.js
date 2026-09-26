import { memo } from "react";
import { FaChevronDown } from "react-icons/fa6";
import c from "@/utils/classNames";
import styles from "./SimulatorStats.module.scss";

function SortHeader({ label, col, sort, onSort, className }) {
  const active = sort.by === col;
  const ascending = active && sort.dir === "asc";
  let ariaSort;
  if (active) ariaSort = ascending ? "ascending" : "descending";

  return (
    <th
      className={c(active && styles.activeSort, className)}
      aria-sort={ariaSort}
    >
      <button
        type="button"
        className={styles.sortButton}
        onClick={() => onSort(col)}
      >
        {label}
        <FaChevronDown
          className={c(styles.sortIcon, ascending && styles.ascending)}
          aria-hidden="true"
        />
      </button>
    </th>
  );
}

export default memo(SortHeader);
