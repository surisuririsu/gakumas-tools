import styles from "./EntityIcon.module.scss";

export default function CustomizationCount({ num }) {
  return <div className={styles.customizations}>{num}</div>;
}
