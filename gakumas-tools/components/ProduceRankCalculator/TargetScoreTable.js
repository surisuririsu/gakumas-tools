import { useTranslations } from "next-intl";
import Table from "@/components/Table";
import styles from "./ProduceRankCalculator.module.scss";

export default function TargetScoreTable({ targets, ratingByRank }) {
  const t = useTranslations("Calculator");

  return (
    <Table
      className={styles.targetTable}
      headers={[t("produceRank"), t("targetScore")]}
      rows={targets.map(({ rank, score }) => [
        <>
          <span className={styles.rankName}>{rank}</span>
          <span className={styles.rankRating}>
            {ratingByRank[rank].toLocaleString()}
          </span>
        </>,
        score == null || !Number.isFinite(score) ? (
          <span className={styles.unreachable}>∞</span>
        ) : (
          <span className={score <= 0 ? styles.reached : null}>
            {score.toLocaleString()}
          </span>
        ),
      ])}
    />
  );
}
