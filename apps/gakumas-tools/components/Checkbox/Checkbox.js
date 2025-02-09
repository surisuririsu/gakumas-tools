import { memo } from "react";
import styles from "./Checkbox.module.scss";

function Checkbox({ checked, label, onChange }) {
  return (
    <div className={styles.checkbox} onClick={() => onChange(!checked)}>
      <input type="checkbox" checked={!!checked} readOnly />
      <label>{label}</label>
    </div>
  );
}

export default memo(Checkbox);
