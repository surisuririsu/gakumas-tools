import { memo } from "react";
import { useTranslations } from "next-intl";
import styles from "./SimulatorLogs.module.scss";

function SetScoreBuff({ amount, turns }) {
  const t = useTranslations("stage");

  return (
    <div className={styles.tile}>
      {t("scoreBuff")} <span className={styles.blue}>+{amount * 100}%</span>{" "}
      {turns ? `(${t("numTurns", { num: turns })})` : ""}
    </div>
  );
}

export default memo(SetScoreBuff);
