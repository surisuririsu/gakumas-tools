import { memo } from "react";
import { STRINGS } from "@/simulator/constants";
import styles from "./SimulatorLogs.module.scss";

const DEBUFF_FIELDS = ["doubleCostTurns", "costIncrease", "nullifyGenkiTurns"];

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
