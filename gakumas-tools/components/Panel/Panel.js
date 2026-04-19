"use client";
import { memo } from "react";
import { FaCircleInfo } from "react-icons/fa6";
import { Tooltip } from "react-tooltip";
import c from "@/utils/classNames";
import styles from "./Panel.module.scss";

function Panel({ label, info, headerAction, children, className, noPadding }) {
  return (
    <div className={c(styles.panel, !noPadding && styles.padded, className)}>
      {label && (
        <span className={styles.label}>
          {label}
          {info && (
            <span
              className={styles.labelInfo}
              aria-label={info}
              data-tooltip-id="panel-info-tooltip"
              data-tooltip-content={info}
            >
              <FaCircleInfo />
            </span>
          )}
        </span>
      )}
      {info && (
        <Tooltip id="panel-info-tooltip" className={styles.tooltip} />
      )}
      {headerAction && (
        <div className={styles.headerAction}>{headerAction}</div>
      )}
      {children}
    </div>
  );
}

export default memo(Panel);
