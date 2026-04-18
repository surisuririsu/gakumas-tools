import { memo, useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { SkillCards } from "gakumas-data";
import gkImg from "gakumas-images";
import { CustomizationCounts } from "@/components/EntityIcon";
import Image from "@/components/Image";
import c from "@/utils/classNames";
import styles from "./SimulatorStats.module.scss";

const TYPES = ["vocal", "dance", "visual"];

// Columns the user can sort by. `card` is the only text sort; the rest are
// numeric (and default to descending on first click).
const SORTABLE_COLS = ["card", "use", "usePct", "score"];
const DEFAULT_SORT = { by: "usePct", dir: "desc" };

// Fold cardUsage (keyed by {id, c}) and scoreStats (keyed by type:id,
// skillCard entries only) into a single per-turn byCard map.
//
// Keys preserve the (id, c) tuple so a loadout with two of the same card —
// one customized, one not — shows as two rows. Score from scoreStats is
// only tracked by id (the engine's entityStart log doesn't carry c), so we
// split each id's total score across its variants proportionally to their
// use counts. Same for scoreByType.
function combineTurn(usageTurn, scoreTurn) {
  const byCard = {};

  const ensure = (id, c) => {
    const key = `${id}|${JSON.stringify(c || null)}`;
    if (!byCard[key]) {
      byCard[key] = {
        id,
        c: c || null,
        use: 0,
        draw: 0,
        score: 0,
        scoreByType: { vocal: 0, dance: 0, visual: 0 },
      };
    }
    return byCard[key];
  };

  // Collect usage first so we know the total per id for score splitting.
  for (const key in usageTurn) {
    const e = usageTurn[key];
    if (e.id === 0) continue; // synthetic SKIP row
    const row = ensure(e.id, e.c);
    row.use += e.use;
    row.draw += e.draw;
  }

  const useById = {};
  for (const key in byCard) {
    const r = byCard[key];
    useById[r.id] = (useById[r.id] || 0) + r.use;
  }

  for (const key in scoreTurn?.byEntity || {}) {
    const e = scoreTurn.byEntity[key];
    if (e.type !== "skillCard") continue;
    const totalUse = useById[e.id] || 0;
    if (totalUse === 0) {
      // Card was scored but never "used" per the hand log (e.g. free use
      // triggered outside a hand decision). Attribute to a single row
      // keyed by (id, null) so the score still surfaces.
      const row = ensure(e.id, null);
      row.score += e.score;
      row.scoreByType.vocal += e.scoreByType.vocal;
      row.scoreByType.dance += e.scoreByType.dance;
      row.scoreByType.visual += e.scoreByType.visual;
      continue;
    }
    for (const k in byCard) {
      const r = byCard[k];
      if (r.id !== e.id) continue;
      const share = r.use / totalUse;
      r.score += e.score * share;
      r.scoreByType.vocal += e.scoreByType.vocal * share;
      r.scoreByType.dance += e.scoreByType.dance * share;
      r.scoreByType.visual += e.scoreByType.visual * share;
    }
  }
  return byCard;
}

// Sum per-turn rows into a single totals row. Keys come from combineTurn
// already (id|c tuple), so variants stay distinct.
function combineTotal(perTurn) {
  const byCard = {};
  for (const turn of perTurn) {
    for (const key in turn.byCard) {
      const src = turn.byCard[key];
      if (!byCard[key]) {
        byCard[key] = {
          id: src.id,
          c: src.c,
          use: 0,
          draw: 0,
          score: 0,
          scoreByType: { vocal: 0, dance: 0, visual: 0 },
        };
      }
      byCard[key].use += src.use;
      byCard[key].draw += src.draw;
      byCard[key].score += src.score;
      byCard[key].scoreByType.vocal += src.scoreByType.vocal;
      byCard[key].scoreByType.dance += src.scoreByType.dance;
      byCard[key].scoreByType.visual += src.scoreByType.visual;
    }
  }
  return byCard;
}

function sumTurnMeta(perTurn) {
  const turnTypeCounts = { vocal: 0, dance: 0, visual: 0 };
  const totalScoreByType = { vocal: 0, dance: 0, visual: 0 };
  let totalScore = 0;
  for (const t of perTurn) {
    turnTypeCounts.vocal += t.turnTypeCounts.vocal;
    turnTypeCounts.dance += t.turnTypeCounts.dance;
    turnTypeCounts.visual += t.turnTypeCounts.visual;
    totalScoreByType.vocal += t.totalScoreByType.vocal;
    totalScoreByType.dance += t.totalScoreByType.dance;
    totalScoreByType.visual += t.totalScoreByType.visual;
    totalScore += t.totalScore;
  }
  return { turnTypeCounts, totalScoreByType, totalScore };
}

function formatScore(score) {
  if (!score) return "0";
  if (Math.abs(score) >= 1000) return Math.round(score).toLocaleString();
  if (Math.abs(score) >= 10) return score.toFixed(0);
  return score.toFixed(1);
}

function extractSortValue(row, by) {
  if (by === "card") {
    return SkillCards.getById(row.id)?.name || "";
  }
  if (by === "use") return row.use;
  if (by === "usePct") return row.draw ? row.use / row.draw : 0;
  if (by === "score") return row.score;
  return 0;
}

function sortRows(byCard, sort) {
  const rows = Object.values(byCard);
  const dirMul = sort.dir === "asc" ? 1 : -1;
  rows.sort((a, b) => {
    const av = extractSortValue(a, sort.by);
    const bv = extractSortValue(b, sort.by);
    if (typeof av === "string") return av.localeCompare(bv) * dirMul;
    return (av - bv) * dirMul;
  });
  return rows;
}

function TypeBar({ counts }) {
  const total = counts.vocal + counts.dance + counts.visual;
  if (!total) return <div className={styles.typeBar} />;
  return (
    <div className={styles.typeBar}>
      {TYPES.map((type) =>
        counts[type] > 0 ? (
          <div
            key={type}
            className={styles[type]}
            style={{ width: `${(counts[type] / total) * 100}%` }}
          />
        ) : null,
      )}
    </div>
  );
}

function SectionHeader({ title, numRuns, turnTypeCounts, totalScoreByType }) {
  return (
    <div className={styles.sectionHeader}>
      <div className={styles.headerRow}>
        <span className={styles.title}>{title}</span>
        <div className={styles.typeChips}>
          {TYPES.map((type) => {
            const count = turnTypeCounts[type];
            if (!count) return null;
            const avgScore = totalScoreByType[type] / numRuns;
            return (
              <span key={type} className={c(styles.chip, styles[type])}>
                ×{count} · {formatScore(avgScore)}
              </span>
            );
          })}
        </div>
      </div>
      <TypeBar counts={turnTypeCounts} />
    </div>
  );
}

function SortHeader({ label, col, sort, onSort, className }) {
  const active = sort.by === col;
  const arrow = active ? (sort.dir === "desc" ? " ↓" : " ↑") : "";
  return (
    <th
      className={c(styles.sortable, active && styles.activeSort, className)}
      onClick={() => onSort(col)}
    >
      {label}
      <span className={styles.sortArrow}>{arrow}</span>
    </th>
  );
}

function Row({ row, numRuns }) {
  const skillCard = SkillCards.getById(row.id);
  if (!skillCard) return null;
  const usePct = row.draw ? (row.use / row.draw) * 100 : 0;
  const score = row.score / numRuns;
  return (
    <tr>
      <td className={styles.cardCell}>
        <div className={styles.iconWrap}>
          <Image
            src={gkImg(skillCard).icon}
            alt={skillCard.name}
            title={skillCard.name}
            width={32}
            height={32}
          />
          {row.c && <CustomizationCounts customizations={row.c} size="small" />}
        </div>
        <span className={styles.cardName}>{skillCard.name}</span>
      </td>
      <td className={styles.numericCell}>{row.use.toLocaleString()}</td>
      <td className={styles.numericCell}>{usePct.toFixed(1)}%</td>
      <td className={styles.numericCell}>{formatScore(score)}</td>
    </tr>
  );
}

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

function SimulatorStats({ cardUsage, scoreStats }) {
  const t = useTranslations("SimulatorStats");
  const [sort, setSort] = useState(DEFAULT_SORT);

  const handleSort = useCallback((col) => {
    if (!SORTABLE_COLS.includes(col)) return;
    setSort((prev) => {
      if (prev.by === col) {
        return { by: col, dir: prev.dir === "desc" ? "asc" : "desc" };
      }
      // Text columns default asc, numeric columns default desc.
      return { by: col, dir: col === "card" ? "asc" : "desc" };
    });
  }, []);

  const data = useMemo(() => {
    const numRuns =
      (scoreStats && scoreStats.numRuns) ||
      (cardUsage && cardUsage.numRuns) ||
      0;
    if (!numRuns) return null;

    const numTurns = Math.max(
      cardUsage?.turns?.length || 0,
      scoreStats?.turns?.length || 0,
    );
    const perTurn = [];
    for (let i = 0; i < numTurns; i++) {
      const scoreTurn = scoreStats?.turns?.[i];
      perTurn.push({
        byCard: combineTurn(cardUsage?.turns?.[i] || {}, scoreTurn),
        turnTypeCounts: scoreTurn?.turnTypeCounts || {
          vocal: 0,
          dance: 0,
          visual: 0,
        },
        totalScoreByType: scoreTurn?.totalScoreByType || {
          vocal: 0,
          dance: 0,
          visual: 0,
        },
        totalScore: scoreTurn?.totalScore || 0,
      });
    }
    const totalMeta = sumTurnMeta(perTurn);
    return {
      numRuns,
      perTurn,
      total: { byCard: combineTotal(perTurn), ...totalMeta },
    };
  }, [cardUsage, scoreStats]);

  if (!data) return null;

  return (
    <div className={styles.container}>
      <Section
        title={t("total")}
        byCard={data.total.byCard}
        numRuns={data.numRuns}
        turnTypeCounts={data.total.turnTypeCounts}
        totalScoreByType={data.total.totalScoreByType}
        sort={sort}
        onSort={handleSort}
      />
      {data.perTurn.map((turn, i) => (
        <Section
          key={`turn-${i}`}
          title={t("turn", { turn: i + 1 })}
          byCard={turn.byCard}
          numRuns={data.numRuns}
          turnTypeCounts={turn.turnTypeCounts}
          totalScoreByType={turn.totalScoreByType}
          sort={sort}
          onSort={handleSort}
        />
      ))}
    </div>
  );
}

export default memo(SimulatorStats);
