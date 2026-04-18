import { memo, useMemo } from "react";
import { useTranslations } from "next-intl";
import { SkillCards } from "gakumas-data";
import gkImg from "gakumas-images";
import CustomizationCounts from "@/components/EntityIcon/CustomizationCounts";
import Image from "@/components/Image";
import styles from "./CardUsageStats.module.scss";

// Build aggregated totals across all turns.
function buildTotal(turns) {
  const total = {};
  for (const turnData of turns) {
    if (!turnData) continue;
    for (const key in turnData) {
      const entry = turnData[key];
      if (!total[key]) {
        total[key] = {
          id: entry.id,
          c: entry.c,
          use: entry.use,
          draw: entry.draw,
        };
      } else {
        total[key].use += entry.use;
        total[key].draw += entry.draw;
      }
    }
  }
  return total;
}

function ratio(entry, skipDenom) {
  if (entry.id === 0) return skipDenom ? entry.use / skipDenom : 0;
  return entry.draw ? entry.use / entry.draw : 0;
}

function sortByRatio(turnData, skipDenom) {
  return Object.values(turnData).sort(
    (a, b) => ratio(b, skipDenom) - ratio(a, skipDenom)
  );
}

function Tile({ entry, ratioPct }) {
  const skillCard = entry.id ? SkillCards.getById(entry.id) : null;
  return (
    <div className={styles.tile}>
      <div className={styles.icon}>
        {skillCard ? (
          <>
            <Image
              src={gkImg(skillCard).icon}
              alt={skillCard.name}
              title={skillCard.name}
              width={48}
              height={48}
            />
            {entry.c && <CustomizationCounts customizations={entry.c} />}
          </>
        ) : (
          <div className={styles.skipBox} title="skip" />
        )}
      </div>
      <div className={styles.use}>{entry.use}</div>
      <div className={styles.ratio}>{ratioPct.toFixed(1)}%</div>
    </div>
  );
}

function Section({ title, entries, skipDenom }) {
  if (!entries.length) return null;
  return (
    <div className={styles.turn}>
      <div className={styles.turnHeader}>{title}</div>
      <div className={styles.turnBody}>
        <div className={styles.grid}>
          {entries.map((entry, i) => (
            <Tile
              key={`${entry.id}_${i}`}
              entry={entry}
              ratioPct={ratio(entry, skipDenom) * 100}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function CardUsageStats({ cardUsage }) {
  const t = useTranslations("CardUsageStats");

  const sections = useMemo(() => {
    if (!cardUsage || !cardUsage.numRuns) return null;
    const turns = cardUsage.turns || [];
    const total = buildTotal(turns);

    // Skip denominator for the Total section is numRuns × numTurns
    // (every run × every turn could have been a skip).
    const totalSkipDenom = cardUsage.numRuns * turns.length || 1;
    const perTurnSkipDenom = cardUsage.numRuns;

    return {
      total: sortByRatio(total, totalSkipDenom),
      perTurn: turns.map((turnData) =>
        sortByRatio(turnData || {}, perTurnSkipDenom)
      ),
      totalSkipDenom,
      perTurnSkipDenom,
    };
  }, [cardUsage]);

  if (!sections) return null;

  return (
    <div className={styles.container}>
      <Section
        title={t("total")}
        entries={sections.total}
        skipDenom={sections.totalSkipDenom}
      />

      {sections.perTurn.map((entries, i) => (
        <Section
          key={i}
          title={t("turn", { turn: i + 1 })}
          entries={entries}
          skipDenom={sections.perTurnSkipDenom}
        />
      ))}
    </div>
  );
}

export default memo(CardUsageStats);
