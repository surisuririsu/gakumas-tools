import { memo, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { AiOutlineBarChart, AiOutlineBoxPlot } from "react-icons/ai";
import { FaDownload } from "react-icons/fa6";
import Button from "@/components/Button";
import ButtonGroup from "@/components/ButtonGroup";
import { BoxPlot, ComparisonHistogram } from "@/components/Charts";
import { exportImage } from "@/utils/exportImage";
import { bucketShares, compareScores } from "@/utils/rehearsalComparison";
import usePersistedState from "@/utils/usePersistedState";
import styles from "./RehearsalComparison.module.scss";

const CHART_KEY = "gakumas-tools.simulator.rehearsalChart";
const CHART_OPTIONS = [
  { value: "histogram", label: <AiOutlineBarChart /> },
  { value: "boxplot", label: <AiOutlineBoxPlot /> },
];

const ignoreForComparison = (el) => el.dataset?.comparisonExportHide == "true";

function formatPct(value) {
  return `${(value * 100).toFixed(1)}%`;
}

function RehearsalGap({ simScores, rehearsalScores, cell, icon }) {
  const t = useTranslations("RehearsalComparison");
  const tShare = useTranslations("ShareModal");
  const [chart, setChart] = usePersistedState(CHART_KEY, "histogram");
  const [saving, setSaving] = useState(false);

  async function saveImage() {
    setSaving(true);
    try {
      await exportImage({ ignore: ignoreForComparison });
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

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
  const histogram = useMemo(() => {
    const { labels: buckets, shares } = bucketShares([
      simScores,
      rehearsalScores,
    ]);
    return {
      labels: buckets,
      series: [
        {
          label: labels[0],
          data: shares[0],
          tone: "bar",
        },
        {
          label: labels[1],
          data: shares[1],
          tone: "highlight",
        },
      ],
    };
  }, [simScores, rehearsalScores, labels]);

  if (!result) return null;
  const { simMean, rehearsalMean, diffPct, marginPct } = result;
  const diff = `${diffPct > 0 ? "+" : ""}${formatPct(diffPct)}`;

  return (
    <div className={styles.gap}>
      <table className={styles.gapStats}>
        <thead>
          <tr>
            <th>{t("simulatorAverage")}</th>
            <th className={styles.hero}>{t("difference")}</th>
            <th>{t("rehearsalAverage")}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{Math.round(simMean)}</td>
            <td className={styles.hero}>
              {diff}
              {marginPct != null && (
                <span className={styles.margin}>±{formatPct(marginPct)}</span>
              )}
            </td>
            <td>
              <span className={styles.withIcon}>
                {icon && <img className={styles.gapIcon} src={icon} alt="" />}
                {Math.round(rehearsalMean)}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
      <div className={styles.gapToolbar} data-export-hide="true">
        <ButtonGroup
          className={styles.chartSelect}
          options={CHART_OPTIONS}
          selected={chart}
          onChange={setChart}
        />
        <Button size="sm" onClick={saveImage} disabled={saving}>
          <FaDownload />
          {tShare("saveImage")}
        </Button>
      </div>
      <div className={styles.chart}>
        {chart == "boxplot" ? (
          <BoxPlot labels={labels} data={boxPlotData} showLegend={false} />
        ) : (
          <ComparisonHistogram {...histogram} />
        )}
      </div>
    </div>
  );
}

export default memo(RehearsalGap);
