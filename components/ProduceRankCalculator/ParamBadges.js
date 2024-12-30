import styles from "./ParamBadges.module.scss";

export default function ParamBadges({ params }) {
  return (
    <div className={styles.badges}>
      {params.map((p, i) => (
        <div key={i} className={styles.badge}>
          +{p}
        </div>
      ))}
    </div>
  );
}
