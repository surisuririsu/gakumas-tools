import { PItems, SkillCards } from "gakumas-data";
import { addScoreByType } from "@/utils/simulator";

// Fold cardUsage (keyed by {id, c}) and scoreStats (keyed by type:id) into
// a single per-turn byCard map.
//
// Rows are keyed by (type, id, c) so a loadout with two of the same card
// — one customized, one not — shows as two rows, and p-items share the
// keyspace without colliding with skill-card ids. `draw` is undefined for
// p-items (no hand concept); UI shows "—" for usePct on those rows.
//
// Score from scoreStats is only tracked by id (the engine's entityStart
// log doesn't carry c), so a skill card's total score is split across its
// c-variants proportionally to their use counts. Same for scoreByType.
// P-items carry their own `uses` straight from the engine attribution.
export function combineTurn(usageTurn, scoreTurn) {
  const byCard = {};

  const ensure = (type, id, c) => {
    const key = `${type}|${id}|${JSON.stringify(c || null)}`;
    if (!byCard[key]) {
      byCard[key] = {
        type,
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

  // Collect skill-card hand usage first so we know the total per id for
  // splitting score across c-variants.
  for (const key in usageTurn) {
    const e = usageTurn[key];
    if (e.id === 0) continue; // synthetic SKIP row
    const row = ensure("skillCard", e.id, e.c);
    row.use += e.use;
    row.draw += e.draw;
  }

  const skillCardUseById = {};
  for (const key in byCard) {
    const r = byCard[key];
    if (r.type !== "skillCard") continue;
    skillCardUseById[r.id] = (skillCardUseById[r.id] || 0) + r.use;
  }

  for (const key in scoreTurn?.byEntity || {}) {
    const e = scoreTurn.byEntity[key];

    if (e.type === "pItem") {
      const row = ensure("pItem", e.id, null);
      row.use += e.uses || 0;
      row.score += e.score;
      addScoreByType(row.scoreByType, e.scoreByType);
      continue;
    }

    if (e.type !== "skillCard") continue;
    const totalUse = skillCardUseById[e.id] || 0;
    if (totalUse === 0) {
      // Card produced score but was never hand-used (e.g. the score came
      // from its passive/delayed effect firing). Attribute to a single
      // (id, null) row so the score still surfaces.
      const row = ensure("skillCard", e.id, null);
      row.score += e.score;
      addScoreByType(row.scoreByType, e.scoreByType);
      continue;
    }
    for (const k in byCard) {
      const r = byCard[k];
      if (r.type !== "skillCard" || r.id !== e.id) continue;
      const share = r.use / totalUse;
      r.score += e.score * share;
      addScoreByType(r.scoreByType, e.scoreByType, share);
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
          type: src.type,
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
      addScoreByType(byCard[key].scoreByType, src.scoreByType);
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
    if (row.type === "pItem") return PItems.getById(row.id)?.name || "";
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
