import { memo } from "react";
import { useTranslations } from "next-intl";
import Logs from "./Logs";
import c from "@/utils/classNames";
import styles from "./SimulatorLogs.module.scss";

function Turn({ num, type, multiplier, childLogs, idolId }) {
  const t = useTranslations("stage");

  return (
    <div className={c(styles.turn, styles[type])}>
      <div className={c(styles.startTurn, styles[type])}>
        <span>{t("turnN", { n: num })}</span>
        <span className={styles.multiplier}>
          {Math.round(multiplier * 100)}%
        </span>
      </div>
      <div className={styles.childLogs}>
        <Logs logs={childLogs} idolId={idolId} />
      </div>
    </div>
  );
}

export default memo(Turn);
