import { memo } from "react";
import styles from "./Input.module.scss";

function Input({
  type,
  name,
  defaultValue,
  value,
  min,
  max,
  placeholder,
  onChange,
}) {
  function clamp(val) {
    let clampedValue = val;
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
      defaultValue={defaultValue}
      value={value}
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
