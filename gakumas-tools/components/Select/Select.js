import { memo } from "react";
import c from "@/utils/classNames";
import styles from "./Select.module.scss";

function Select({
  value,
  options,
  onChange,
  active,
  size = "md",
  fill,
  className,
  ...rest
}) {
  function handleChange(e) {
    const option = options.find((opt) => String(opt.value) == e.target.value);
    onChange(option ? option.value : e.target.value);
  }

  return (
    <select
      className={c(
        styles.select,
        styles[size],
        active && styles.active,
        fill && styles.fill,
        className
      )}
      value={value ?? ""}
      onChange={handleChange}
      {...rest}
    >
      {options.map((opt) => (
        <option
          key={String(opt.value)}
          value={String(opt.value)}
          disabled={opt.disabled}
        >
          {opt.label}
        </option>
      ))}
    </select>
  );
}

export default memo(Select);
