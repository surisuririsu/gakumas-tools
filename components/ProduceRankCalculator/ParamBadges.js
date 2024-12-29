import styles from "./ParamBadges.module.scss";

export default function ParamBadges({ params }) {
  return (
    <div className={styles.badges}>
      {params.map((p) => (
        <div className={styles.badge}>+{p}</div>
      ))}
    </div>
  );
}
