import { memo, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  FaCircleCheck,
  FaFileCsv,
  FaFileImage,
  FaTriangleExclamation,
  FaVideo,
} from "react-icons/fa6";
import Checkbox from "@/components/Checkbox";
import Collapse from "@/components/Collapse";
import ProgressBar from "@/components/ProgressBar";
import FileDropzone from "@/components/Rehearsal/FileDropzone";
import { buildBoxPlotData } from "@/components/Rehearsal/rehearsalStats";
import c from "@/utils/classNames";
import { NUM_SLOTS, NUM_STAGES } from "@/utils/rehearsalComparison";
import styles from "./RehearsalComparison.module.scss";

const STAGES = Array.from({ length: NUM_STAGES }, (_, i) => i);
const SLOTS = Array.from({ length: NUM_SLOTS }, (_, i) => i);

const compact = new Intl.NumberFormat(undefined, {
  notation: "compact",
  maximumFractionDigits: 1,
});

function average(scores) {
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

function RehearsalComparison({
  parser,
  cell,
  onCellChange,
  contribute,
  onContributeChange,
}) {
  const t = useTranslations("RehearsalComparison");
  const tRehearsal = useTranslations("Rehearsal");
  const { data, handleFiles, progress, total, processingStatus } = parser;

  useEffect(() => {
    const onPaste = (e) => {
      if (e.clipboardData?.files.length) handleFiles(e.clipboardData.files);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [handleFiles]);

  const grid = useMemo(() => buildBoxPlotData(data), [data]);
  const flaggedCount = useMemo(
    () => data.filter((r) => r.flags?.some((f) => f === "flagged")).length,
    [data],
  );

  return (
    <div className={styles.tab}>
      <FileDropzone
        title={t("addResults")}
        hint={tRehearsal("dropFiles")}
        accept="image/*,video/*,.csv,text/csv"
        multiple
        onFiles={handleFiles}
      >
        <span className={styles.formats} aria-hidden="true">
          <FaFileImage />
          <FaVideo />
          <FaFileCsv />
        </span>
      </FileDropzone>

      <Collapse open={progress != null}>
        <div className={styles.progress}>
          <div className={styles.progressLabel} aria-live="polite">
            <span>
              {processingStatus ||
                tRehearsal("progress", {
                  progress: progress ?? 0,
                  total: total ?? "?",
                })}
            </span>
            {progress != null && progress === total && (
              <FaCircleCheck className={styles.done} />
            )}
          </div>
          <ProgressBar value={progress ?? 0} max={total ?? 0} />
        </div>
      </Collapse>

      {data.length > 0 && (
        <div className={styles.picker}>
          <p className={styles.prompt}>{t("pickCell")}</p>
          <table className={styles.grid}>
            <tbody>
              {STAGES.map((stage) => (
                <tr key={stage}>
                  <th scope="row">{tRehearsal("stage", { n: stage + 1 })}</th>
                  {SLOTS.map((slot) => {
                    const scores = grid[slot].data[stage];
                    const selected =
                      cell?.[0] === stage && cell?.[1] === slot;
                    return (
                      <td key={slot}>
                        <button
                          type="button"
                          className={c(styles.cell, selected && styles.selected)}
                          aria-pressed={selected}
                          disabled={!scores.length}
                          onClick={() =>
                            onCellChange(selected ? null : [stage, slot])
                          }
                        >
                          <span className={styles.cellScore}>
                            {scores.length
                              ? compact.format(average(scores))
                              : "—"}
                          </span>
                          <span className={styles.cellCount}>
                            n={scores.length}
                          </span>
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          {flaggedCount > 0 && (
            <span className={styles.flaggedNotice}>
              <FaTriangleExclamation />
              {t("flaggedExcluded", { count: flaggedCount })}
            </span>
          )}
        </div>
      )}

      <Checkbox
        checked={contribute}
        label={t("contribute")}
        onChange={onContributeChange}
      />
    </div>
  );
}

export default memo(RehearsalComparison);
