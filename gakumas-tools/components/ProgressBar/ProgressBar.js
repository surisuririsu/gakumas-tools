import { memo } from "react";
import c from "@/utils/classNames";
import styles from "./ProgressBar.module.scss";

function ProgressBar({ value, max }) {
  const fraction = max > 0 ? Math.min(1, value / max) : 0;
  return (
    <div
      className={c(styles.progressBar, fraction == 1 && styles.complete)}
      role="progressbar"
      aria-valuenow={Math.round(fraction * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      style={{ "--progress": fraction }}
    >
      <span className={styles.fill} />
    </div>
  );
}

export default memo(ProgressBar);
