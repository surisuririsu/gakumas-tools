import { memo } from "react";
import c from "@/utils/classNames";
import styles from "./SimulatorLogs.module.scss";

function StartTurn({ num, type, multiplier }) {
  return (
    <div className={c(styles.startTurn, styles[type])}>
      {num}ターン目{" "}
      <span className={styles.multiplier}>{Math.round(multiplier * 100)}%</span>
    </div>
  );
}

export default memo(StartTurn);
