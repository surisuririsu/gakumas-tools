import { memo, useMemo } from "react";
import { useTranslations } from "next-intl";
import { BoxPlot } from "@/components/Charts";
import { compareScores } from "@/utils/rehearsalComparison";
import styles from "./RehearsalComparison.module.scss";

function formatPct(value) {
  return `${(value * 100).toFixed(1)}%`;
}

function RehearsalGap({ simScores, rehearsalScores, cell }) {
  const t = useTranslations("RehearsalComparison");
  const result = useMemo(
    () => compareScores(simScores, rehearsalScores),
    [simScores, rehearsalScores],
  );

  const labels = useMemo(
    () => [
      `${t("simulator")} (n=${simScores.length})`,
      `${t("rehearsal")} ${cell[0] + 1}-${cell[1] + 1} (n=${rehearsalScores.length})`,
    ],
    [t, simScores.length, rehearsalScores.length, cell],
  );
  const boxPlotData = useMemo(
    () => [{ label: "", data: [simScores, rehearsalScores] }],
    [simScores, rehearsalScores],
  );

  if (!result) return null;
  const { simMean, rehearsalMean, diffPct, marginPct } = result;
  const diff = `${diffPct > 0 ? "+" : ""}${formatPct(diffPct)}`;

  return (
    <div className={styles.gap}>
      <table className={styles.gapStats}>
        <thead>
          <tr>
            <th>{t("simulatorAverage")}</th>
            <th>{t("rehearsalAverage")}</th>
            <th className={styles.hero}>{t("difference")}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{Math.round(simMean)}</td>
            <td>{Math.round(rehearsalMean)}</td>
            <td className={styles.hero}>
              {diff}
              {marginPct != null && (
                <span className={styles.margin}>±{formatPct(marginPct)}</span>
              )}
            </td>
          </tr>
        </tbody>
      </table>
      <div className={styles.boxPlot}>
        <BoxPlot labels={labels} data={boxPlotData} showLegend={false} />
      </div>
    </div>
  );
}

export default memo(RehearsalGap);
