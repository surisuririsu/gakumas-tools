import { memo } from "react";
import styles from "./ButtonGroup.module.scss";

function ButtonGroup({ selected, options, onChange }) {
  return (
    <div className={styles.buttonGroup}>
      {options.map(({ value, label }) => (
        <button
          key={value}
          className={value == selected ? styles.selected : null}
          onClick={() => onChange(value)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export default memo(ButtonGroup);
