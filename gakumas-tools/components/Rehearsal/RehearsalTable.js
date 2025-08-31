import React from "react";
import { AiOutlineBarChart } from "react-icons/ai";
import { FaRegCircleXmark, FaPenToSquare } from "react-icons/fa6";
import styles from "./Rehearsal.module.scss";

export default function RehearsalTable({
  data,
  selected,
  onChartClick,
  onRowDelete,
}) {
  const minValue = Math.min(...data.flat(2).filter((x) => x !== "?"));
  const maxValue = Math.max(...data.flat(2).filter((x) => x !== "?"));
  // Helper to get color based on value
  function getCellColor(value) {
    if (value === "?") return {};
    const percent = (value - minValue) / (maxValue - minValue || 1);
    // Interpolate between white (#fff) and #f39800
    const r = Math.round(255 + percent * (243 - 255));
    const g = Math.round(255 + percent * (152 - 255));
    const b = Math.round(255 + percent * (0 - 255));
    return {
      background: `rgb(${r},${g},${b})`,
    };
  }

  return (
    <table>
      <thead>
        <tr className={styles.chartButtons}>
          <th />
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
          <th />
          <th colSpan="3">ステージ1</th>
          <th colSpan="3">ステージ2</th>
          <th colSpan="3">ステージ3</th>
        </tr>
      </thead>
      <tbody>
        {data.map((row, i) => (
          <tr key={i}>
            <td className={styles.delete}>
              <button onClick={() => onRowDelete(i)}>
                <FaRegCircleXmark />
              </button>
            </td>
            {row.map((stage, j) => (
              <React.Fragment key={j}>
                {stage.map((score, k) => (
                  <td key={k} style={getCellColor(score)}>
                    {score}
                  </td>
                ))}
              </React.Fragment>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
