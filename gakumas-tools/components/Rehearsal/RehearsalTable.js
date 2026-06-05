import React, { useMemo, useRef, useState } from "react";
import { AiOutlineBarChart, AiOutlineBoxPlot } from "react-icons/ai";
import { FaRegCircleXmark, FaRegImage } from "react-icons/fa6";
import c from "@/utils/classNames";
import styles from "./Rehearsal.module.scss";

export default function RehearsalTable({
  data,
  selected,
  onChartClick,
  onRowDelete,
  onCellEdit,
}) {
  // [rowIndex, stageIndex, scoreIndex] of the cell being edited, or null.
  const [editing, setEditing] = useState(null);
  const [previewRow, setPreviewRow] = useState(null);
  const inputRef = useRef(null);

  const commitEdit = () => {
    if (!editing || !inputRef.current) return;
    const [i, j, k] = editing;
    const value = parseInt(inputRef.current.value, 10);
    // Skip unchanged values so the charts don't redraw on a plain blur.
    if (!isNaN(value) && value >= 0 && value !== data[i].scores[j][k]) {
      onCellEdit(i, j, k, value);
    }
  };

  // Cell switching happens on mousedown with preventDefault, so the active
  // input never blurs when moving between cells. A real blur therefore means
  // focus left the cells entirely — commit and close the preview.
  const startEditing = (i, j, k) => {
    commitEdit();
    setEditing([i, j, k]);
    setPreviewRow(data[i].src ? i : null);
  };

  // Drop edit/preview state without committing. Nulling the ref also keeps a
  // stray unmount blur from committing a canceled value.
  const cancelEditing = () => {
    inputRef.current = null;
    setEditing(null);
    setPreviewRow(null);
  };

  const stopEditing = () => {
    commitEdit();
    cancelEditing();
  };
  const [minValue, maxValue] = useMemo(() => {
    const allScores = data.flatMap((row) => row.scores.flat());
    return [Math.min(...allScores), Math.max(...allScores)];
  }, [data]);

  function getCellColor(value) {
    const percent = (value - minValue) / (maxValue - minValue || 1);
    const r = Math.round(255 + percent * (68 - 255));
    const g = Math.round(255 + percent * (187 - 255));
    const b = Math.round(255 + percent * (255 - 255));
    return {
      background: `rgb(${r},${g},${b})`,
    };
  }

  return (
    <table>
      <thead>
        <tr className={styles.chartButtons}>
          <th>
            <button
              className={selected == null ? styles.selected : null}
              onClick={() => onChartClick(null)}
            >
              <AiOutlineBoxPlot />
            </button>
          </th>
          {[...Array(9)].map((_, i) => (
            <th key={i} className={i % 3 === 0 ? styles.stageStart : null}>
              <button
                className={selected == i ? styles.selected : null}
                onClick={() => onChartClick(i)}
              >
                <AiOutlineBarChart />
              </button>
            </th>
          ))}
          <th className={styles.stageStart} />
        </tr>
        <tr>
          <th />
          <th colSpan="3" className={styles.stageStart}>
            ステージ1
          </th>
          <th colSpan="3" className={styles.stageStart}>
            ステージ2
          </th>
          <th colSpan="3" className={styles.stageStart}>
            ステージ3
          </th>
          <th className={styles.stageStart} />
        </tr>
      </thead>
      <tbody>
        {data.map((row, i) => {
          const showPreview = row.src && previewRow === i;
          return (
            <React.Fragment key={i}>
              <tr>
                {/* preventDefault keeps the active input focused, so blur
                    doesn't close the preview before the click registers. */}
                <td
                  className={styles.action}
                  onMouseDown={(e) => e.preventDefault()}
                >
                  <button
                    onClick={() => {
                      // Indices shift on delete; drop any cell/preview state.
                      cancelEditing();
                      onRowDelete(i);
                    }}
                  >
                    <FaRegCircleXmark />
                  </button>
                </td>
                {row.scores.map((stage, j) => (
                  <React.Fragment key={j}>
                    {stage.map((score, k) => {
                      const isEditing =
                        editing &&
                        editing[0] === i &&
                        editing[1] === j &&
                        editing[2] === k;
                      return (
                        <td
                          key={k}
                          className={c(
                            styles.score,
                            k === 0 && styles.stageStart,
                            isEditing && styles.editing,
                          )}
                          style={getCellColor(score)}
                          onMouseDown={(e) => {
                            if (isEditing) return; // input handles its own clicks
                            e.preventDefault(); // don't blur the active input
                            startEditing(i, j, k);
                          }}
                        >
                          {isEditing ? (
                            <input
                              ref={inputRef}
                              type="text"
                              inputMode="numeric"
                              // Keep the intrinsic width tiny so mounting the
                              // input doesn't expand the column.
                              size={1}
                              defaultValue={score}
                              autoFocus
                              onFocus={(e) => e.target.select()}
                              onBlur={stopEditing}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") e.target.blur();
                                if (e.key === "Escape") cancelEditing();
                              }}
                            />
                          ) : (
                            score
                          )}
                        </td>
                      );
                    })}
                  </React.Fragment>
                ))}
                <td
                  className={c(styles.action, styles.stageStart)}
                  onMouseDown={(e) => e.preventDefault()}
                >
                  {row.src && (
                    <button
                      className={previewRow === i ? styles.active : null}
                      onClick={() => setPreviewRow(previewRow === i ? null : i)}
                    >
                      <FaRegImage />
                    </button>
                  )}
                </td>
              </tr>
              {showPreview && (
                <tr className={styles.previewRow}>
                  <td colSpan={11}>
                    {/* Natural resolution in a scrollable box, so the scores
                        are readable while the row above stays editable. */}
                    <div>
                      <img src={row.src} alt="" />
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          );
        })}
      </tbody>
    </table>
  );
}
