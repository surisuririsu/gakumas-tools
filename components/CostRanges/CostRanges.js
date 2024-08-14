import { memo } from "react";
import styles from "./CostRanges.module.scss";

const RANGES = [
  { rank: "S", min: 441, max: 642 },
  { rank: "A+", min: 441, max: 594 },
  { rank: "A", min: 441, max: 519 },
  { rank: "B+", min: 306, max: 423 },
  { rank: "B", min: 306, max: 363 },
];

function CostRanges() {
  return (
    <table className={styles.costRanges}>
      <thead>
        <tr>
          <th style={{ width: "20%" }}>ランク</th>
          <th>下限</th>
          <th>上限</th>
        </tr>
      </thead>
      <tbody>
        {RANGES.map(({ rank, min, max }) => (
          <tr key={rank}>
            <td>{rank}</td>
            <td>{min}</td>
            <td>{max}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default memo(CostRanges);
