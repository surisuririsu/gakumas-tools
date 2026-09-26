import { memo } from "react";
import c from "@/utils/classNames";
import styles from "./Input.module.scss";

function Input({
  type,
  round,
  min,
  max,
  value,
  onChange,
  className,
  ...rest
}) {
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
      className={c(styles.input, className)}
      type={type}
      value={value ?? ""}
      onChange={(e) => handleChange(e.target.value)}
      {...rest}
    />
  );
}

export default memo(Input);
