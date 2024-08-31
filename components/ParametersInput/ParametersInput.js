import { memo, useMemo } from "react";
import styles from "./ParametersInput.module.scss";

const PARAMETER_NAMES = ["Vo", "Da", "Vi"];
const MIN = 0;
const MAX = 1800;

function ParametersInput({
  parameters,
  onChange,
  withStamina,
  max = MAX,
  round = true,
}) {
  const parameterNames = useMemo(
    () => PARAMETER_NAMES.concat(withStamina ? ["体力"] : []),
    [withStamina]
  );

  function handleChange(value, index) {
    let next = [...parameters];
    if (round) {
      value = parseInt(value, 10);
    } else {
      value = parseFloat(value);
    }
    next[index] = Math.min(Math.max(value, MIN), max);
    onChange(next);
  }

  return (
    <div className={styles.parameters}>
      {parameterNames.map((name, i) => (
        <input
          key={name}
          type="number"
          placeholder={name}
          onChange={(e) => handleChange(e.target.value, i)}
          value={parameters[i] ?? ""}
        />
      ))}
    </div>
  );
}

export default memo(ParametersInput);
