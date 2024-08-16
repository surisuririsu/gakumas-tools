import { memo } from "react";
import styles from "./SimulatorLogs.module.scss";

function Tile({ text }) {
  return <div className={styles.defaultTile}>{text}</div>;
}

export default memo(Tile);
