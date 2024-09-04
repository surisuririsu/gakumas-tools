import { memo } from "react";
import styles from "./SimulatorLogs.module.scss";

function Text({ text }) {
  return <div className={styles.tile}>{text}</div>;
}

export default memo(Text);
