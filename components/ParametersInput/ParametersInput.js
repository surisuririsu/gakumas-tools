import { memo, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
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

  // To prevent onChange triggering before IME input committed
  const [composing, setComposing] = useState(false);
  const [params, setParams] = useState(parameters);

  useEffect(() => {
    if (!composing) onChange(params);
  }, [composing, params]);

  function handleChange(value, index) {
    let next = [...params];

    value = value.normalize("NFKC");
    if (round) {
      value = parseInt(value, 10);
    } else {
      value = parseFloat(value);
    }
    value = Math.min(Math.max(value, MIN), max);
    if (isNaN(value)) value = null;

    next[index] = value;
    console.log(next);
    setParams(next);
  }

  return (
    <div className={styles.parameters}>
      {parameterNames.map((name, i) => (
        <input
          key={name}
          type="number"
          placeholder={name}
          onChange={(e) => handleChange(e.target.value, i)}
          onCompositionStart={() => setComposing(true)}
          onCompositionEnd={(e) => {
            handleChange(e.data, i);
            setComposing(false);
          }}
          value={params[i] ?? ""}
        />
      ))}
    </div>
  );
}

export default memo(ParametersInput);
