import { memo } from "react";
import styles from "./Input.module.scss";

function Input({ type, name, value, min, max, placeholder, onChange }) {
  function clamp(value) {
    let clampedValue = value;
    if (min != null) {
      clampedValue = Math.max(clampedValue, min);
    }
    if (max != null) {
      clampedValue = Math.min(clampedValue, max);
    }
    return clampedValue;
  }

  return (
    <input
      className={styles.input}
      type={type}
      name={name}
      value={value ?? ""}
      placeholder={placeholder}
      onChange={(e) =>
        onChange(
          type == "number" ? clamp(parseFloat(e.target.value)) : e.target.value
        )
      }
    />
  );
}

export default memo(Input);
