import { memo } from "react";
import styles from "./ProgressBar.module.scss";

function ProgressBar({ value, max }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className={styles.progressBar} style={{ "--progress": `${pct}%` }} />
  );
}

export default memo(ProgressBar);
