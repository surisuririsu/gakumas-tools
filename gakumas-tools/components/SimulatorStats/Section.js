import { memo, useMemo } from "react";
import { useTranslations } from "next-intl";
import { sortRows } from "./helpers";
import Row from "./Row";
import SectionHeader from "./SectionHeader";
import SortHeader from "./SortHeader";
import styles from "./SimulatorStats.module.scss";

function Section({
  title,
  byCard,
  numRuns,
  turnTypeCounts,
  totalScoreByType,
  sort,
  onSort,
}) {
  const t = useTranslations("SimulatorStats");
  const rows = useMemo(() => sortRows(byCard, sort), [byCard, sort]);

  return (
    <div className={styles.section}>
      <SectionHeader
        title={title}
        numRuns={numRuns}
        turnTypeCounts={turnTypeCounts}
        totalScoreByType={totalScoreByType}
      />
      {rows.length > 0 && (
        <table className={styles.table}>
          <thead>
            <tr>
              <SortHeader
                label={t("card")}
                col="card"
                sort={sort}
                onSort={onSort}
                className={styles.cardCell}
              />
              <SortHeader
                label={t("uses")}
                col="use"
                sort={sort}
                onSort={onSort}
                className={styles.numericCell}
              />
              <SortHeader
                label={t("usePct")}
                col="usePct"
                sort={sort}
                onSort={onSort}
                className={styles.numericCell}
              />
              <SortHeader
                label={t("score")}
                col="score"
                sort={sort}
                onSort={onSort}
                className={styles.numericCell}
              />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <Row key={`${row.id}_${i}`} row={row} numRuns={numRuns} />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default memo(Section);
