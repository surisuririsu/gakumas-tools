import styles from "./CustomizationCount.module.scss";

export default function CustomizationCount({ num }) {
  return <div className={styles.customizations}>{num}</div>;
}
