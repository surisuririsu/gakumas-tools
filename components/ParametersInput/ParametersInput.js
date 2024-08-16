import { memo, useMemo } from "react";
import styles from "./ParametersInput.module.scss";

const PARAMETER_NAMES = ["Vocal", "Dance", "Visual"];
const MIN = 0;
const MAX = 1500;

function ParametersInput({ parameters, onChange, withStamina, max = MAX }) {
  const parameterNames = useMemo(
    () => PARAMETER_NAMES.concat(withStamina ? ["Stamina"] : []),
    [withStamina]
  );

  return (
    <div className={styles.parameters}>
      {parameterNames.map((name, i) => (
        <input
          key={name}
          type="number"
          placeholder={name}
          onChange={(e) =>
            onChange([
              ...parameters.slice(0, i),
              Math.min(Math.max(parseInt(e.target.value, 10), MIN), max),
              ...parameters.slice(i + 1),
            ])
          }
          value={parameters[i] ?? ""}
        ></input>
      ))}
    </div>
  );
}

export default memo(ParametersInput);
