import { memo } from "react";
import styles from "./Input.module.scss";

function Input({ type, name, placeholder, round, min, max, value, onChange }) {
  function handleChange(val) {
    if (type == "number") {
      if (round) {
        val = parseInt(val, 10);
      } else {
        val = parseFloat(val);
      }
      if (min != null) val = Math.max(val, min);
      if (max != null) val = Math.min(val, max);
      if (isNaN(val)) val = null;
    }
    onChange(val);
  }

  return (
    <input
      className={styles.input}
      type={type}
      name={name}
      placeholder={placeholder}
      value={value ?? ""}
      onChange={(e) => handleChange(e.target.value)}
    />
  );
}

export default memo(Input);
