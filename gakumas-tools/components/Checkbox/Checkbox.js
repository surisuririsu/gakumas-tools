import { memo } from "react";
import { FaCheck } from "react-icons/fa6";
import c from "@/utils/classNames";
import styles from "./Checkbox.module.scss";

function Checkbox({ checked, label, onChange }) {
  return (
    <label className={c(styles.checkbox, checked && styles.checked)}>
      <input
        type="checkbox"
        className={styles.input}
        checked={!!checked}
        onChange={() => onChange(!checked)}
      />
      <span className={styles.box} aria-hidden="true">
        <FaCheck />
      </span>
      {label && <span>{label}</span>}
    </label>
  );
}

export default memo(Checkbox);
