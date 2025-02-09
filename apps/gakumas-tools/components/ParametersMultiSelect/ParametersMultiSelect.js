import { memo } from "react";
import c from "@/utils/classNames";
import styles from "./ParametersMultiSelect.module.scss";

const PARAMETERS = [
  { label: "Vo", value: "vocal" },
  { label: "Da", value: "dance" },
  { label: "Vi", value: "visual" },
];

function ParametersMultiSelect({ value, onChange }) {
  return (
    <div className={styles.parametersMultiSelect}>
      {PARAMETERS.map((option) => (
        <button
          key={option.value}
          className={c(value[option.value] && styles.selected)}
          onClick={() =>
            onChange({ ...value, [option.value]: !value[option.value] })
          }
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export default memo(ParametersMultiSelect);
