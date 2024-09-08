import { memo, useMemo } from "react";
import { useTranslations } from "next-intl";
import Input from "@/components/Input";
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
  const t = useTranslations("ParametersInput");

  const parameterNames = useMemo(
    () => PARAMETER_NAMES.concat(withStamina ? [t("stamina")] : []),
    [withStamina, t]
  );

  function handleChange(value, index) {
    let next = [...parameters];
    next[index] = value;
    onChange(next);
  }

  return (
    <div className={styles.parameters}>
      {parameterNames.map((name, i) => (
        <Input
          key={name}
          type="number"
          name={name}
          placeholder={name}
          min={MIN}
          max={max}
          round={round}
          value={parameters[i]}
          onChange={(val) => handleChange(val, i)}
        />
      ))}
    </div>
  );
}

export default memo(ParametersInput);
