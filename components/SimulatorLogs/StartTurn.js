import { memo } from "react";
import { useTranslations } from "next-intl";
import c from "@/utils/classNames";
import styles from "./SimulatorLogs.module.scss";

function StartTurn({ num, type, multiplier }) {
  const t = useTranslations("stage");

  return (
    <div className={c(styles.startTurn, styles[type])}>
      <span>{t("turnN", { n: num })}</span>
      <span className={styles.multiplier}>{Math.round(multiplier * 100)}%</span>
    </div>
  );
}

export default memo(StartTurn);
