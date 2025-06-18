import React from "react";
import { AiOutlineBarChart } from "react-icons/ai";
import styles from "./Rehearsal.module.scss";

export default function RehearsalTable({ data, selected, onChartClick }) {
  return (
    <table>
      <thead>
        <tr className={styles.chartButtons}>
          {[...Array(9)].map((_, i) => (
            <th key={i}>
              <button
                className={selected == i ? styles.selected : null}
                onClick={() => onChartClick(i)}
              >
                <AiOutlineBarChart />
              </button>
            </th>
          ))}
        </tr>
        <tr>
          <th colSpan="3">ステージ1</th>
          <th colSpan="3">ステージ2</th>
          <th colSpan="3">ステージ3</th>
        </tr>
      </thead>
      <tbody>
        {data.map((row, i) => (
          <tr key={i}>
            {row.map((stage, j) => (
              <React.Fragment key={j}>
                {stage.map((score, k) => (
                  <td key={k}>{score}</td>
                ))}
              </React.Fragment>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
