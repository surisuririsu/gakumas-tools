"use client";
import { Tooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";
import styles from "./Tooltips.module.scss";

export default function Tooltips() {
  return (
    <>
      <Tooltip id="panel-info-tooltip" className={styles.tooltip} />
      <Tooltip id="indications-tooltip" className={styles.tooltip} />
    </>
  );
}
