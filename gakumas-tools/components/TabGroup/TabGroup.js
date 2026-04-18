import { memo } from "react";
import c from "@/utils/classNames";
import styles from "./TabGroup.module.scss";

function TabGroup({ className, selected, options, onChange }) {
  return (
    <div className={c(styles.tabGroup, className)} role="tablist">
      {options.map(({ value, label }) => (
        <button
          key={value}
          role="tab"
          aria-selected={value == selected}
          className={value == selected ? styles.selected : null}
          onClick={() => onChange(value)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export default memo(TabGroup);
