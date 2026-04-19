import { memo } from "react";
import { useTranslations } from "next-intl";
import c from "@/utils/classNames";
import styles from "./ScenarioPicker.module.scss";

const SCENARIOS = ["hajime", "nia"];

function ScenarioPicker({ selected, onChange }) {
  const t = useTranslations("Calculator");

  return (
    <div className={styles.scenarioPicker}>
      {SCENARIOS.map((s) => (
        <button
          key={s}
          type="button"
          className={c(
            styles.scenarioChip,
            styles[s],
            selected === s && styles.selected
          )}
          onClick={() => onChange(s)}
        >
          {t(`scenarios.${s}`)}
        </button>
      ))}
    </div>
  );
}

export default memo(ScenarioPicker);
