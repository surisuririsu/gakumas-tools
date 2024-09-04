import { memo } from "react";
import styles from "./SimulatorLogs.module.scss";

function SetScoreBuff({ amount, turns }) {
  return (
    <div className={styles.tile}>
      スコア上昇量増加 <span className={styles.blue}>+{amount * 100}%</span>{" "}
      {turns ? `(${turns}ターン)` : ""}
    </div>
  );
}

export default memo(SetScoreBuff);
