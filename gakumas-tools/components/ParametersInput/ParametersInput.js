import { memo, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import Input from "@/components/Input";
import c from "@/utils/classNames";
import styles from "./ParametersInput.module.scss";

const PARAMETER_NAMES = ["Vo", "Da", "Vi"];
const MIN = 0;
const MAX = 3200;

function ParametersInput({
  parameters,
  onChange,
  withStamina,
  max = MAX,
  round = true,
  attached,
  footers,
}) {
  const t = useTranslations("ParametersInput");

  const parameterNames = useMemo(
    () => PARAMETER_NAMES.concat(withStamina ? [t("stamina")] : []),
    [withStamina, t],
  );

  const [focused, setFocused] = useState(null);
  const [shown, setShown] = useState(parameters);
  const [beats, setBeats] = useState([0, 0, 0, 0]);
  if (parameters !== shown) {
    setShown(parameters);
    const changed = beats.map(
      (_, i) => i !== focused && (parameters[i] ?? null) !== (shown[i] ?? null),
    );
    if (changed.some(Boolean)) {
      setBeats(beats.map((beat, i) => (changed[i] ? beat + 1 : beat)));
    }
  }

  function handleChange(value, index) {
    let next = [...parameters];
    next[index] = value;
    onChange(next);
  }

  function renderInput(name, i) {
    return (
      <Input
        key={name}
        type="number"
        name={name}
        placeholder={name}
        round={round}
        min={MIN}
        max={max}
        value={parameters[i]}
        onChange={(val) => handleChange(val, i)}
        onFocus={() => setFocused(i)}
        onBlur={() => setFocused(null)}
        data-beat={
          attached || !beats[i] ? undefined : beats[i] % 2 ? "a" : "b"
        }
      />
    );
  }

  if (!attached) {
    return (
      <div className={styles.parameters}>
        {parameterNames.map(renderInput)}
      </div>
    );
  }

  return (
    <div className={c(styles.parameters, styles.attached)}>
      {parameterNames.map((name, i) => (
        <div
          key={name}
          className={c(
            styles.tile,
            !!beats[i] && (beats[i] % 2 ? styles.beatA : styles.beatB),
          )}
        >
          {renderInput(name, i)}
          {footers?.[i] != null && (
            <div className={styles.footer}>{footers[i]}</div>
          )}
        </div>
      ))}
    </div>
  );
}

export default memo(ParametersInput);
