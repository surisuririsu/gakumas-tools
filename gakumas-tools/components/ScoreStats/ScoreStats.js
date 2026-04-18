import { memo, useMemo } from "react";
import { useTranslations } from "next-intl";
import { PItems, SkillCards } from "gakumas-data";
import gkImg from "gakumas-images";
import Image from "@/components/Image";
import styles from "./ScoreStats.module.scss";

// Entity-type → data-package lookup. Types that don't have an icon
// (stage, default) fall back to a text label.
const ENTITY_LOOKUPS = {
  skillCard: SkillCards,
  pItem: PItems,
};

function resolveEntity(type, id) {
  const Lookup = ENTITY_LOOKUPS[type];
  if (Lookup && typeof id === "number") {
    const entity = Lookup.getById(id);
    if (entity) return { name: entity.name, icon: gkImg(entity).icon };
  }
  // For stage / default / unknown types, `id` is typically a short string
  // (e.g. "好印象", "強気2") — show it as text.
  return { name: String(id ?? type), icon: null };
}

function buildTotal(turns) {
  const byEntity = {};
  const turnTypeCounts = { vocal: 0, dance: 0, visual: 0 };
  let totalScore = 0;
  for (const turn of turns) {
    if (!turn) continue;
    totalScore += turn.totalScore;
    turnTypeCounts.vocal += turn.turnTypeCounts.vocal;
    turnTypeCounts.dance += turn.turnTypeCounts.dance;
    turnTypeCounts.visual += turn.turnTypeCounts.visual;
    for (const key in turn.byEntity) {
      const entry = turn.byEntity[key];
      if (!byEntity[key]) {
        byEntity[key] = { type: entry.type, id: entry.id, score: entry.score };
      } else {
        byEntity[key].score += entry.score;
      }
    }
  }
  return { byEntity, turnTypeCounts, totalScore };
}

function sortByScore(byEntity) {
  return Object.values(byEntity).sort((a, b) => b.score - a.score);
}

function formatScore(score) {
  if (Math.abs(score) >= 1000) return Math.round(score).toLocaleString();
  if (Math.abs(score) >= 10) return score.toFixed(0);
  return score.toFixed(1);
}

function Tile({ entry, numRuns }) {
  const { name, icon } = resolveEntity(entry.type, entry.id);
  const avg = entry.score / numRuns;
  return (
    <div className={styles.tile}>
      <div className={styles.icon} title={name}>
        {icon ? (
          <Image src={icon} alt={name} title={name} width={48} height={48} />
        ) : (
          <div className={styles.labelBox}>{name}</div>
        )}
      </div>
      <div className={styles.score}>{formatScore(avg)}</div>
    </div>
  );
}

function TurnHeader({ title, avgScore, turnTypeCounts }) {
  const total =
    turnTypeCounts.vocal + turnTypeCounts.dance + turnTypeCounts.visual;
  const v = total ? (turnTypeCounts.vocal / total) * 100 : 0;
  const d = total ? (turnTypeCounts.dance / total) * 100 : 0;
  const vi = total ? (turnTypeCounts.visual / total) * 100 : 0;
  return (
    <div className={styles.turnHeader}>
      <div className={styles.bar}>
        {v > 0 && <div className={styles.vocal} style={{ width: `${v}%` }} />}
        {d > 0 && <div className={styles.dance} style={{ width: `${d}%` }} />}
        {vi > 0 && (
          <div className={styles.visual} style={{ width: `${vi}%` }} />
        )}
      </div>
      <div className={styles.headerText}>
        <span>{title}</span>
        <span>{formatScore(avgScore)}</span>
      </div>
    </div>
  );
}

function Section({ title, entries, turnTypeCounts, totalScore, numRuns }) {
  const avgScore = numRuns ? totalScore / numRuns : 0;
  return (
    <div className={styles.turn}>
      <TurnHeader
        title={title}
        avgScore={avgScore}
        turnTypeCounts={turnTypeCounts}
      />
      <div className={styles.turnBody}>
        <div className={styles.grid}>
          {entries.map((entry, i) => (
            <Tile
              key={`${entry.type}_${entry.id}_${i}`}
              entry={entry}
              numRuns={numRuns}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ScoreStats({ scoreStats }) {
  const t = useTranslations("ScoreStats");

  const sections = useMemo(() => {
    if (!scoreStats || !scoreStats.numRuns) return null;
    const turns = scoreStats.turns || [];
    const total = buildTotal(turns);
    return {
      total: {
        entries: sortByScore(total.byEntity),
        turnTypeCounts: total.turnTypeCounts,
        totalScore: total.totalScore,
      },
      perTurn: turns.map((turn) => ({
        entries: sortByScore(turn?.byEntity || {}),
        turnTypeCounts: turn?.turnTypeCounts || { vocal: 0, dance: 0, visual: 0 },
        totalScore: turn?.totalScore || 0,
      })),
    };
  }, [scoreStats]);

  if (!sections) return null;

  return (
    <div className={styles.container}>
      <Section
        title={t("total")}
        entries={sections.total.entries}
        turnTypeCounts={sections.total.turnTypeCounts}
        totalScore={sections.total.totalScore}
        numRuns={scoreStats.numRuns}
      />

      {sections.perTurn.map((section, i) => (
        <Section
          key={`turn-${i}`}
          title={t("turn", { turn: i + 1 })}
          entries={section.entries}
          turnTypeCounts={section.turnTypeCounts}
          totalScore={section.totalScore}
          numRuns={scoreStats.numRuns}
        />
      ))}
    </div>
  );
}

export default memo(ScoreStats);
