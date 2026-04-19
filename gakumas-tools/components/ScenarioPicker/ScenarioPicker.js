import { useTranslations } from "next-intl";
import c from "@/utils/classNames";
import { SCENARIOS } from "@/utils/scenarios";
import styles from "./ScenarioPicker.module.scss";

export default function ScenarioPicker({ selected, onChange }) {
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
