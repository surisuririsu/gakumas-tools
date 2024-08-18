import { memo } from "react";
import styles from "./ParametersMultiSelect.module.scss";

const PARAMETERS = ["vocal", "dance", "visual"];

function ParametersMultiSelect({ value, onChange }) {
  return (
    <div className={styles.parametersMultiSelect}>
      {PARAMETERS.map((option) => (
        <button
          key={option}
          className={value[option] ? styles.selected : null}
          onClick={() => onChange({ ...value, [option]: !value[option] })}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

export default memo(ParametersMultiSelect);
