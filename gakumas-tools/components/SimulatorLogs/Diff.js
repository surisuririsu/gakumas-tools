import { memo } from "react";
import { useTranslations } from "next-intl";
import { ALL_FIELDS, DEBUFF_FIELDS } from "gakumas-engine";
import c from "@/utils/classNames";
import styles from "./SimulatorLogs.module.scss";

function Diff({ field, next, prev }) {
  const t = useTranslations("stage");

  const negative =
    !isNaN(next) && DEBUFF_FIELDS.includes(field) == next > prev;

  return (
    <div className={styles.line}>
      {t(ALL_FIELDS[field])}{" "}
      <span className={c(styles.value, negative && styles.negative)}>
        {isNaN(next) ? (
          <>
            {t(prev)} → {t(next)}
          </>
        ) : (
          <>
            {prev} → {next}
          </>
        )}
      </span>
    </div>
  );
}

export default memo(Diff);
