import { memo } from "react";
import c from "@/utils/classNames";
import styles from "./Panel.module.scss";

function Panel({ label, children, className, noPadding }) {
  return (
    <div
      className={c(styles.panel, !noPadding && styles.padded, className)}
    >
      {label && <span className={styles.label}>{label}</span>}
      {children}
    </div>
  );
}

export default memo(Panel);
