import styles from "./Widget.module.scss";

export default function Widget({ title, fill, children }) {
  return (
    <div className={`${styles.widget} ${fill ? styles.fill : ""}`}>
      <h2>{title}</h2>
      <div className={styles.content}>{children}</div>
    </div>
  );
}
