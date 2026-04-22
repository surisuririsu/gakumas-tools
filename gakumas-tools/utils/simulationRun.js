import { Idols, PIdols, SkillCards, Stages } from "gakumas-data";

export const MAX_HISTORY = 20;

const NUM_BUCKETS = 40;

export function summarizeScores(scores) {
  if (!scores || !scores.length) return null;
  const sorted = [...scores].sort((a, b) => a - b);
  const n = sorted.length;
  const min = sorted[0];
  const max = sorted[n - 1];
  const q = (p) => {
    const idx = (n - 1) * p;
    const lo = Math.floor(idx);
    const hi = Math.ceil(idx);
    if (lo === hi) return sorted[lo];
    return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
  };
  const q1 = q(0.25);
  const median = q(0.5);
  const q3 = q(0.75);
  const mean = sorted.reduce((a, b) => a + b, 0) / n;
  const variance =
    sorted.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
  const stddev = Math.sqrt(variance);

  const range = max - min;
  let bucketSize = range > 0 ? Math.ceil(range / NUM_BUCKETS) : 1;
  const buckets = new Array(NUM_BUCKETS).fill(0);
  for (const s of sorted) {
    const idx = Math.min(NUM_BUCKETS - 1, Math.floor((s - min) / bucketSize));
    buckets[idx]++;
  }

  return {
    count: n,
    min,
    q1,
    median,
    mean,
    q3,
    max,
    stddev,
    bucketMin: min,
    bucketSize,
    buckets,
  };
}

export function deriveRunMeta(loadout) {
  const { stageId, customStage, skillCardIdGroups } = loadout;

  let stageName = null;
  let season = null;
  if (stageId === "custom") {
    stageName = customStage?.name || "Custom";
  } else if (stageId) {
    const stage = Stages.getById(stageId);
    if (stage) {
      stageName = stage.name;
      season = stage.season || null;
    }
  }

  let signatureCardId = null;
  let pIdolId = null;
  const firstGroup = skillCardIdGroups?.[0] || [];
  for (const id of firstGroup) {
    if (!id) continue;
    const card = SkillCards.getById(id);
    if (card?.sourceType === "pIdol") {
      signatureCardId = id;
      pIdolId = card.pIdolId;
      break;
    }
  }
  if (!signatureCardId) {
    for (const id of firstGroup) {
      if (!id) continue;
      signatureCardId = id;
      const card = SkillCards.getById(id);
      if (card?.pIdolId) pIdolId = card.pIdolId;
      break;
    }
  }

  let idolId = null;
  if (pIdolId) {
    const pIdol = PIdols.getById(pIdolId);
    if (pIdol) idolId = pIdol.idolId;
  }

  return {
    stageName,
    season,
    idolId,
    pIdolId,
    signatureCardId,
  };
}

export function getIdolName(idolId) {
  if (!idolId) return null;
  return Idols.getById(idolId)?.name || null;
}

export function normalizeSavedRun(doc) {
  if (!doc) return null;
  const loadout = {
    stageId: doc.stageId,
    customStage: doc.customStage,
    supportBonus: doc.supportBonus,
    params: doc.params,
    pItemIds: doc.pItemIds,
    skillCardIdGroups: doc.skillCardIdGroups,
    customizationGroups: doc.customizationGroups,
  };
  return {
    id: doc._id?.toString?.() || doc._id || doc.id,
    _id: doc._id,
    name: doc.name || null,
    createdAt: doc.createdAt || null,
    loadout,
    linkLoadouts: doc.linkLoadouts || null,
    stats: doc.stats || null,
    derived: doc.derived || deriveRunMeta(loadout),
  };
}
