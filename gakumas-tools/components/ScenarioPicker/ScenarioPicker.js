import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import c from "@/utils/classNames";
import { CALCULATOR_PATH_BY_SCENARIO, SCENARIOS } from "@/utils/scenarios";
import styles from "./ScenarioPicker.module.scss";

// Calculator routes render the tabs as crawlable links; embedded usages
// (e.g. pinned tools) pass onChange and get buttons that switch in place.
export default function ScenarioPicker({ selected, onChange }) {
  const t = useTranslations("Calculator");

  return (
    <div className={styles.scenarioPicker}>
      {SCENARIOS.map((s) => {
        const className = c(
          styles.scenarioChip,
          styles[s],
          selected === s && styles.selected
        );
        return onChange ? (
          <button
            key={s}
            type="button"
            className={className}
            onClick={() => onChange(s)}
          >
            {t(`scenarios.${s}`)}
          </button>
        ) : (
          <Link
            key={s}
            href={CALCULATOR_PATH_BY_SCENARIO[s]}
            className={className}
          >
            {t(`scenarios.${s}`)}
          </Link>
        );
      })}
    </div>
  );
}
