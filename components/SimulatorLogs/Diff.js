import { memo } from "react";
import styles from "./SimulatorLogs.module.scss";

const DEBUFF_FIELDS = ["doubleCostTurns", "costIncrease", "nullifyGenkiTurns"];

const STRINGS = {
  turnsRemaining: "残りターン数",
  cardUsesRemaining: "スキルカード使用数",
  stamina: "体力",
  genki: "元気",
  score: "スコア",
  goodConditionTurns: "好調",
  perfectConditionTurns: "絶好調",
  concentration: "集中",
  goodImpressionTurns: "好印象",
  motivation: "やる気",
  oneTurnScoreBuff: "ターン内スコア上昇量",
  permanentScoreBuff: "スコア上昇量",
  halfCostTurns: "消費体力減少",
  doubleCostTurns: "消費体力増加",
  costReduction: "消費体力削減",
  costIncrease: "消費体力追加",
  doubleCardEffectCards: "スキルカード追加発動",
  nullifyGenkiTurns: "元気増加無効",
};

function Diff({ field, next, prev }) {
  let diffDir = "positive";
  if (DEBUFF_FIELDS.includes(field) == next > prev) {
    diffDir = "negative";
  }
  return (
    <div className={styles.diff}>
      {STRINGS[field] || field}{" "}
      <span className={styles[diffDir]}>
        {prev} → {next}
      </span>
    </div>
  );
}

export default memo(Diff);
