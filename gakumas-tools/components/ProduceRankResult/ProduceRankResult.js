import Image from "@/components/Image";
import styles from "./ProduceRankResult.module.scss";

export default function ProduceRankResult({ rating, rank }) {
  const hasRankIcon = rank && rank !== "?";
  return (
    <div className={styles.result}>
      {hasRankIcon && (
        <Image
          src={`/ranks/${rank}.png`}
          alt={rank}
          width={56}
          height={56}
          draggable={false}
        />
      )}
      <span className={styles.rating}>
        {rating.toLocaleString()}
        {!hasRankIcon && rank ? ` (${rank})` : null}
      </span>
    </div>
  );
}
