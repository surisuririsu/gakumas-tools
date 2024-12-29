import styles from "./Params.module.scss";

export default function Params({ params }) {
  return (
    <div className={styles.params}>
      {params.map((p) => (
        <div className={styles.param}>{p}</div>
      ))}
    </div>
  );
}
