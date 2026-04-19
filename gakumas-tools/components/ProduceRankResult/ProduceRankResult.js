import styles from "./ProduceRankResult.module.scss";

export default function ProduceRankResult({ rating, rank }) {
  return (
    <div className={styles.result}>
      <span>
        {rating.toLocaleString()}
        {rank ? ` (${rank})` : null}
      </span>
    </div>
  );
}
