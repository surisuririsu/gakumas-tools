import { SkillCards } from "gakumas-data";

// Fold cardUsage (keyed by {id, c}) and scoreStats (keyed by type:id,
// skillCard entries only) into a single per-turn byCard map.
//
// Keys preserve the (id, c) tuple so a loadout with two of the same card —
// one customized, one not — shows as two rows. Score from scoreStats is
// only tracked by id (the engine's entityStart log doesn't carry c), so we
// split each id's total score across its variants proportionally to their
// use counts. Same for scoreByType.
export function combineTurn(usageTurn, scoreTurn) {
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
export function combineTotal(perTurn) {
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

export function sumTurnMeta(perTurn) {
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

export function formatScore(score) {
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

export function sortRows(byCard, sort) {
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
