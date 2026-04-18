import { memo } from "react";
import c from "@/utils/classNames";
import styles from "./Panel.module.scss";

function Panel({ label, headerAction, children, className, noPadding }) {
  const hasHeader = label || headerAction;
  return (
    <div className={c(styles.panel, !noPadding && styles.padded, className)}>
      {hasHeader && (
        <div className={styles.header}>
          {label && <span className={styles.label}>{label}</span>}
          {headerAction && (
            <div className={styles.headerAction}>{headerAction}</div>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

export default memo(Panel);
