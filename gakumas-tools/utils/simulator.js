import { PIdols, PItems, SkillCards, Stages } from "gakumas-data";
import { GRAPHED_FIELDS, S } from "gakumas-engine";
import { MIN_BUCKET_SIZE } from "@/simulator/constants";
import {
  deserializeCustomizations,
  serializeCustomizations,
} from "./customizations";
import { deserializeIds, serializeIds } from "./ids";

const DEFAULTS = {
  stageId: Stages.getAll().findLast((s) => s.type == "contest" && !s.preview)
    .id,
  supportBonus: "0.04",
  params: "1500-1500-1500-50",
  pItemIds: "0-0-0-0",
  skillCardIdGroups: "0-0-0-0-0-0_0-0-0-0-0-0",
  customizationGroups: "-----_-----",
};

const SIMULATOR_BASE_URL = "https://gktools.ris.moe/simulator";

export function getSimulatorUrl(loadout, loadouts) {
  if (loadout.stageId === "custom") return null;
  const stage = Stages.getById(loadout.stageId);
  if (stage.type === "linkContest") {
    const searchParams = loadoutsToSearchParams(loadouts);
    return `${SIMULATOR_BASE_URL}/?${searchParams.toString()}`;
  } else {
    const searchParams = loadoutToSearchParams(loadout);
    return `${SIMULATOR_BASE_URL}/?${searchParams.toString()}`;
  }
}

export function loadoutFromSearchParams(searchParams) {
  let stageId = searchParams.get("stage");
  let supportBonus = searchParams.get("support_bonus");
  let params = searchParams.get("params");
  let pItemIds = searchParams.get("items");
  let skillCardIdGroups = searchParams.get("cards");
  let customizationGroups = searchParams.get("customizations");
  const hasDataFromParams =
    stageId || params || pItemIds || skillCardIdGroups || customizationGroups;

  stageId = stageId || DEFAULTS.stageId;
  supportBonus = supportBonus || DEFAULTS.supportBonus;
  params = params || DEFAULTS.params;
  pItemIds = pItemIds || DEFAULTS.pItemIds;
  skillCardIdGroups = skillCardIdGroups || DEFAULTS.skillCardIdGroups;
  customizationGroups = customizationGroups || DEFAULTS.customizationGroups;

  stageId = parseInt(stageId, 10) || null;
  supportBonus = parseFloat(supportBonus) || null;
  params = deserializeIds(params);
  pItemIds = deserializeIds(pItemIds);
  skillCardIdGroups = skillCardIdGroups.split("_").map(deserializeIds);
  customizationGroups = customizationGroups
    .split("_")
    .map(deserializeCustomizations);

  // Ensure customizations are same shape as skill cards
  if (skillCardIdGroups.length != customizationGroups.length) {
    customizationGroups = skillCardIdGroups.map((g) => g.map(() => ({})));
  }

  return {
    stageId,
    supportBonus,
    params,
    pItemIds,
    skillCardIdGroups,
    customizationGroups,
    hasDataFromParams,
  };
}

export function loadoutToSearchParams(loadout) {
  const {
    stageId,
    supportBonus,
    params,
    pItemIds,
    skillCardIdGroups,
    customizationGroups,
  } = loadout;
  const searchParams = new URLSearchParams();
  searchParams.set("stage", stageId);
  if (supportBonus) {
    searchParams.set("support_bonus", supportBonus);
  }
  searchParams.set("params", serializeIds(params));
  searchParams.set("items", serializeIds(pItemIds));
  searchParams.set("cards", skillCardIdGroups.map(serializeIds).join("_"));
  searchParams.set(
    "customizations",
    customizationGroups.map(serializeCustomizations).join("_")
  );
  return searchParams;
}

export function loadoutsFromSearchParams(searchParams) {
  let loadouts = [];
  const loadoutParams = searchParams.getAll("loadout");
  for (let param of loadoutParams) {
    const paramString = decodeURIComponent(param);
    const paramSearchParams = new URLSearchParams(paramString);
    const loadout = loadoutFromSearchParams(paramSearchParams);
    loadouts.push(loadout);
  }
  return loadouts;
}

export function loadoutsToSearchParams(loadouts) {
  const searchParams = new URLSearchParams();
  for (let loadout of loadouts) {
    const loadoutSearchParams = loadoutToSearchParams({
      ...loadout,
      supportBonus: null,
    });
    searchParams.append(
      "loadout",
      encodeURIComponent(loadoutSearchParams.toString())
    );
  }
  return searchParams;
}

export function bucketScores(scores) {
  let data = {};

  const maxScore = Math.max(...scores);
  const minScore = Math.min(...scores);
  const bucketSize =
    MIN_BUCKET_SIZE *
    Math.max(Math.floor((maxScore - minScore) / MIN_BUCKET_SIZE / 100), 1);

  for (let score of scores) {
    const bucket = Math.floor(score / bucketSize);
    data[bucket] = (data[bucket] || 0) + 1;
  }

  const keys = Object.keys(data);
  const minKey = Math.min(...keys);
  const maxKey = Math.max(...keys);
  for (let i = minKey - 1; i <= maxKey + 1; i++) {
    if (!data[i]) data[i] = 0;
  }

  return {
    bucketedScores: data,
    bucketSize,
  };
}

export function getMedianScore(scores) {
  const sorted = [...scores].sort((a, b) => b - a);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[mid]
    : Math.floor((sorted[mid - 1] + sorted[mid]) / 2);
}

export function formatRun(run) {
  return {
    score: run.score,
    logs: [].concat(...run.logs),
  };
}

export function mergeResults(results) {
  let scores = [];
  for (let result of results) {
    scores = scores.concat(result.scores);
  }
  const averageScore = Math.round(
    scores.reduce((acc, cur) => acc + cur, 0) / scores.length
  );

  let minRun, averageRun, maxRun;
  for (let result of results) {
    if (!minRun || result.minRun.score < minRun.score) {
      minRun = result.minRun;
    }
    if (!maxRun || result.maxRun.score > maxRun.score) {
      maxRun = result.maxRun;
    }
    if (
      !averageRun ||
      Math.abs(result.averageRun.score - averageScore) <
        Math.abs(averageRun.score - averageScore)
    ) {
      averageRun = result.averageRun;
    }
  }

  const graphDatas = results.map((result) => result.graphData);
  const mergedGraphData = mergeGraphDatas(graphDatas);

  // Merge cardUsage across workers: element-wise per turn, key-wise per card.
  const cardUsage = { numRuns: 0, turns: [] };
  for (let result of results) {
    const s = result.cardUsage;
    if (!s) continue;
    cardUsage.numRuns += s.numRuns || 0;
    for (let t = 0; t < s.turns.length; t++) {
      if (!cardUsage.turns[t]) cardUsage.turns[t] = {};
      const into = cardUsage.turns[t];
      const from = s.turns[t] || {};
      for (const key in from) {
        if (!into[key]) {
          into[key] = { ...from[key] };
        } else {
          into[key].use += from[key].use;
          into[key].draw += from[key].draw;
        }
      }
    }
  }

  // Merge scoreStats across workers.
  const scoreStats = { numRuns: 0, turns: [] };
  for (let result of results) {
    const s = result.scoreStats;
    if (!s) continue;
    scoreStats.numRuns += s.numRuns || 0;
    for (let t = 0; t < s.turns.length; t++) {
      const from = s.turns[t];
      if (!from) continue;
      if (!scoreStats.turns[t]) {
        scoreStats.turns[t] = {
          turnTypeCounts: { vocal: 0, dance: 0, visual: 0 },
          totalScore: 0,
          totalScoreByType: { vocal: 0, dance: 0, visual: 0 },
          byEntity: {},
        };
      }
      const into = scoreStats.turns[t];
      into.turnTypeCounts.vocal += from.turnTypeCounts.vocal;
      into.turnTypeCounts.dance += from.turnTypeCounts.dance;
      into.turnTypeCounts.visual += from.turnTypeCounts.visual;
      into.totalScore += from.totalScore;
      into.totalScoreByType.vocal += from.totalScoreByType.vocal;
      into.totalScoreByType.dance += from.totalScoreByType.dance;
      into.totalScoreByType.visual += from.totalScoreByType.visual;
      for (const key in from.byEntity) {
        const src = from.byEntity[key];
        if (!into.byEntity[key]) {
          into.byEntity[key] = {
            ...src,
            scoreByType: { ...src.scoreByType },
          };
        } else {
          into.byEntity[key].score += src.score;
          into.byEntity[key].scoreByType.vocal += src.scoreByType.vocal;
          into.byEntity[key].scoreByType.dance += src.scoreByType.dance;
          into.byEntity[key].scoreByType.visual += src.scoreByType.visual;
        }
      }
    }
  }

  return {
    graphData: mergedGraphData,
    minRun,
    averageRun,
    maxRun,
    averageScore,
    scores,
    cardUsage,
    scoreStats,
  };
}

/**
 * Walk a single run's flat log stream and accumulate per-turn
 * {id, c, use, draw} counts into `cardUsage.turns`. Also ticks
 * `cardUsage.numRuns`.
 *
 * Shape: cardUsage.turns[turnIndex] is an object keyed by stringified
 * `{id, c}`; values are `{ id, c, use, draw }`. A synthetic `{id: 0}` row
 * counts skipped turns (selectedIndex === null).
 */
export function accumulateCardUsage(logs, cardUsage) {
  cardUsage.numRuns = (cardUsage.numRuns || 0) + 1;
  if (!cardUsage.turns) cardUsage.turns = [];

  let turnIndex = -1;
  let drawnThisTurn = null;

  for (const log of logs) {
    if (log.logType === "startTurn") {
      turnIndex++;
      if (!cardUsage.turns[turnIndex]) cardUsage.turns[turnIndex] = {};
      drawnThisTurn = new Set();
      continue;
    }
    if (log.logType !== "hand") continue;
    if (turnIndex < 0 || !drawnThisTurn) continue;

    const turnData = cardUsage.turns[turnIndex];
    const { handCards, selectedIndex } = log.data;

    for (let i = 0; i < handCards.length; i++) {
      const { id, c } = handCards[i];
      const key = JSON.stringify({ id, c: c || null });
      // Count a card as "drawn" once per turn even if it appears in
      // multiple hand presentations (e.g., after a moveToHand).
      if (!drawnThisTurn.has(key)) {
        drawnThisTurn.add(key);
        if (!turnData[key]) {
          turnData[key] = { id, c: c || null, use: 0, draw: 1 };
        } else {
          turnData[key].draw++;
        }
      }
      if (i === selectedIndex) {
        turnData[key].use++;
      }
    }

    if (selectedIndex == null) {
      const key = "SKIP";
      if (!turnData[key]) {
        turnData[key] = { id: 0, c: null, use: 1, draw: 0 };
      } else {
        turnData[key].use++;
      }
    }
  }
}

/**
 * Walk a single run's log stream and accumulate per-turn score attribution
 * into `scoreStats.turns`. Ticks `scoreStats.numRuns`.
 *
 * Attribution: entityStart/entityEnd logs bracket an entity's window. We
 * maintain a stack; each score `diff` log is credited only to the INNERMOST
 * entity on the stack. Example — a card that produces score, then triggers
 * a p-item that also produces score: the card's direct score lands on the
 * card, the p-item's score lands on the p-item. Parents don't double-count.
 *
 * scoreByType buckets each credit by the turn-type rolled that run, so the
 * UI can show "this card produced X on dance turns."
 */
export function accumulateScoreStats(logs, scoreStats) {
  scoreStats.numRuns = (scoreStats.numRuns || 0) + 1;
  if (!scoreStats.turns) scoreStats.turns = [];

  let turnIndex = -1;
  let turnType = null;
  const groupStack = [];

  for (const log of logs) {
    if (log.logType === "startTurn") {
      turnIndex++;
      turnType = log.data.type;
      const turn = ensureScoreTurn(scoreStats.turns, turnIndex);
      turn.turnTypeCounts[turnType] = (turn.turnTypeCounts[turnType] || 0) + 1;
    } else if (log.logType === "entityStart") {
      groupStack.push({
        entity: log.data,
        ownScore: 0,
        startTurn: turnIndex,
        startTurnType: turnType,
      });
    } else if (log.logType === "entityEnd") {
      const group = groupStack.pop();
      if (!group || group.ownScore === 0 || group.startTurn < 0) continue;
      const turn = ensureScoreTurn(scoreStats.turns, group.startTurn);
      const { type, id } = group.entity;
      const key = `${type}:${id}`;
      if (!turn.byEntity[key]) {
        turn.byEntity[key] = {
          type,
          id,
          score: 0,
          scoreByType: { vocal: 0, dance: 0, visual: 0 },
        };
      }
      turn.byEntity[key].score += group.ownScore;
      if (group.startTurnType) {
        turn.byEntity[key].scoreByType[group.startTurnType] += group.ownScore;
      }
    } else if (log.logType === "diff" && log.data.field === S.score) {
      const delta = parseFloat(log.data.next) - parseFloat(log.data.prev);
      if (groupStack.length) {
        // Innermost only — ancestors aren't credited for a child's delta.
        groupStack[groupStack.length - 1].ownScore += delta;
      }
      if (turnIndex >= 0) {
        const turn = scoreStats.turns[turnIndex];
        turn.totalScore += delta;
        if (turnType) turn.totalScoreByType[turnType] += delta;
      }
    }
  }
}

function ensureScoreTurn(turns, i) {
  if (!turns[i]) {
    turns[i] = {
      turnTypeCounts: { vocal: 0, dance: 0, visual: 0 },
      totalScore: 0,
      totalScoreByType: { vocal: 0, dance: 0, visual: 0 },
      byEntity: {},
    };
  }
  return turns[i];
}

export function mergeGraphDatas(graphDatas) {
  let mergedGraphData = GRAPHED_FIELDS.reduce((acc, cur) => {
    acc[cur] = [];
    return acc;
  }, {});

  for (let graphData of graphDatas) {
    for (let field of GRAPHED_FIELDS) {
      for (let i = 0; i < graphData[field].length; i++) {
        if (!mergedGraphData[field][i]) mergedGraphData[field][i] = [];
        mergedGraphData[field][i].push(graphData[field][i]);
      }
    }
  }

  for (let field of GRAPHED_FIELDS) {
    for (let i = 0; i < mergedGraphData[field].length; i++) {
      mergedGraphData[field][i] =
        mergedGraphData[field][i].reduce((acc, cur) => acc + cur, 0) /
        mergedGraphData[field][i].length;
    }
  }

  return mergedGraphData;
}

export function getIndications(config, loadout) {
  const pIdolId = config.idol.pIdolId;
  const idolId = config.idol.idolId;
  const plan =
    config.stage.plan != "free" ? config.stage.plan : config.idol.plan;
  const dupeIndices = config.idol.dupeIndices;

  let pItemIndications = [];
  for (let id of loadout.pItemIds) {
    const pItem = PItems.getById(id);

    if (!pItem) {
      pItemIndications.push(null);
      continue;
    }

    let indications = {};

    // Plan mismatch
    if (plan && pItem.plan != "free" && pItem.plan != plan) {
      indications.planMismatch = true;
    }

    // P-idol mismatch
    if (pIdolId && pItem.sourceType == "pIdol" && pItem.pIdolId != pIdolId) {
      indications.pIdolMismatch = true;
    }
    pItemIndications.push(indications);
  }

  let skillCardIndicationGroups = [];
  let curIndex = 0;
  for (let i = 0; i < loadout.skillCardIdGroups.length; i++) {
    let skillCardIndications = [];
    for (let id of loadout.skillCardIdGroups[i]) {
      const skillCard = SkillCards.getById(id);

      if (!skillCard) {
        skillCardIndications.push(null);
        curIndex++;
        continue;
      }

      let indications = {};

      // Plan mismatch
      if (plan && skillCard.plan != "free" && skillCard.plan != plan) {
        indications.planMismatch = true;
      }

      // Idol mismatch
      if (
        idolId &&
        skillCard.sourceType == "pIdol" &&
        PIdols.getById(skillCard.pIdolId).idolId != idolId
      ) {
        indications.idolMismatch = true;
      }

      // Duplicate
      if (dupeIndices.includes(curIndex)) {
        indications.duplicate = true;
      }

      skillCardIndications.push(indications);
      curIndex++;
    }
    skillCardIndicationGroups.push(skillCardIndications);
  }

  return {
    pItemIndications,
    skillCardIndicationGroups,
  };
}

export function structureLogs(logs) {
  if (!logs) return null;

  let i = 0;
  let inTurn = false;

  function getLogGroup() {
    let group = [];
    while (i < logs.length) {
      const log = logs[i];
      if (log.logType === "entityStart") {
        i++;
        const childLogs = getLogGroup();
        group.push({ logType: "group", entity: log.data, childLogs });
        i++;
      } else if (log.logType === "entityEnd") {
        return group;
      } else if (log.logType === "startTurn") {
        if (inTurn) {
          inTurn = false;
          return group;
        }
        inTurn = true;
        i++;
        const childLogs = getLogGroup();
        group.push({ logType: "turn", data: log.data, childLogs });
      } else {
        group.push(log);
        i++;
      }
    }
    return group;
  }

  return getLogGroup();
}
