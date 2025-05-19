import { PIdols, PItems, SkillCards } from "gakumas-data";
import { GRAPHED_FIELDS } from "gakumas-engine";
import { BUCKET_SIZE } from "@/simulator/constants";
import {
  deserializeCustomizations,
  serializeCustomizations,
} from "./customizations";
import { deserializeIds, serializeIds } from "./ids";

const DEFAULTS = {
  stageId: "85",
  supportBonus: "0",
  params: "1500-1500-1500-50",
  pItemIds: "0-0-0-0",
  skillCardIdGroups: "0-0-0-0-0-0_0-0-0-0-0-0",
  customizationGroups: "-----_-----",
};

const SIMULATOR_BASE_URL = "https://gktools.ris.moe/simulator";

export function getSimulatorUrl(loadout) {
  const searchParams = loadoutToSearchParams(loadout);
  return `${SIMULATOR_BASE_URL}/?${searchParams.toString()}`;
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
  searchParams.set("support_bonus", supportBonus);
  searchParams.set("params", serializeIds(params));
  searchParams.set("items", serializeIds(pItemIds));
  searchParams.set("cards", skillCardIdGroups.map(serializeIds).join("_"));
  searchParams.set(
    "customizations",
    customizationGroups.map(serializeCustomizations).join("_")
  );
  return searchParams;
}

export function bucketScores(scores) {
  let data = {};
  for (let score of scores) {
    const bucket = Math.floor(score / BUCKET_SIZE);
    data[bucket] = (data[bucket] || 0) + 1;
  }

  const keys = Object.keys(data);
  const minKey = Math.min(...keys);
  const maxKey = Math.max(...keys);
  for (let i = minKey - 1; i <= maxKey + 1; i++) {
    if (!data[i]) data[i] = 0;
  }

  return data;
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

  return {
    graphData: mergedGraphData,
    minRun,
    averageRun,
    maxRun,
    averageScore,
    scores,
  };
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
