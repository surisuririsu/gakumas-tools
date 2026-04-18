import { memo } from "react";
import c from "@/utils/classNames";
import styles from "./Panel.module.scss";

function Panel({ label, headerAction, children, className, noPadding }) {
  return (
    <div className={c(styles.panel, !noPadding && styles.padded, className)}>
      {label && <span className={styles.label}>{label}</span>}
      {headerAction && (
        <div className={styles.headerAction}>{headerAction}</div>
      )}
      {children}
    </div>
  );
}

export default memo(Panel);
