import { memo } from "react";
import { useTranslations } from "next-intl";
import { DEBUFF_FIELDS } from "@/simulator/engine/constants";
import styles from "./SimulatorLogs.module.scss";

function Diff({ field, next, prev }) {
  const t = useTranslations("stage");

  let diffDir = "positive";
  if (!isNaN(next) && DEBUFF_FIELDS.includes(field) == next > prev) {
    diffDir = "negative";
  }

  return (
    <div className={styles.tile}>
      {t(field)}{" "}
      <span className={styles[diffDir]}>
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
