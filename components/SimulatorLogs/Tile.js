import styles from "./SimulatorLogs.module.scss";

export default function Tile({ text }) {
  return <div className={styles.tile}>{text}</div>;
}
