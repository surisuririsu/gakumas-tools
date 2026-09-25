import { memo } from "react";
import styles from "./ProgressBar.module.scss";

function ProgressBar({ value, max }) {
  const fraction = max > 0 ? Math.min(1, value / max) : 0;
  return (
    <div
      className={styles.progressBar}
      role="progressbar"
      aria-valuenow={Math.round(fraction * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      style={{ "--progress": fraction }}
    />
  );
}

export default memo(ProgressBar);
