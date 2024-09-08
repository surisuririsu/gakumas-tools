import { BUCKET_SIZE, GRAPHED_FIELDS } from "@/simulator/constants";

const DEFAULTS = {
  stageId: "22",
  supportBonus: "0",
  params: "1000-1000-1000-40",
  pItemIds: "0-0-0",
  skillCardIdGroups: "0-0-0-0-0-0_0-0-0-0-0-0",
};

export function loadoutFromSearchParams(searchParams) {
  let stageId = searchParams.get("stage") || DEFAULTS.stageId;
  let supportBonus = searchParams.get("support_bonus") || DEFAULTS.supportBonus;
  let params = searchParams.get("params") || DEFAULTS.params;
  let pItemIds = searchParams.get("items") || DEFAULTS.pItemIds;
  let skillCardIdGroups =
    searchParams.get("cards") || DEFAULTS.skillCardIdGroups;

  stageId = parseInt(stageId, 10) || null;
  supportBonus = parseFloat(supportBonus) || null;
  params = params.split("-").map((n) => parseInt(n, 10) || 0);
  pItemIds = pItemIds.split("-").map((n) => parseInt(n, 10) || 0);
  skillCardIdGroups = skillCardIdGroups
    .split("_")
    .map((group) => group.split("-").map((n) => parseInt(n, 10) || 0));

  return {
    stageId,
    supportBonus,
    params,
    pItemIds,
    skillCardIdGroups,
  };
}

export function loadoutToSearchParams(loadout) {
  const { stageId, supportBonus, params, pItemIds, skillCardIdGroups } =
    loadout;
  const searchParams = new URLSearchParams();
  searchParams.set("stage", stageId);
  searchParams.set("support_bonus", supportBonus);
  searchParams.set("params", params.map((p) => p || 0).join("-"));
  searchParams.set("items", pItemIds.join("-"));
  searchParams.set(
    "cards",
    skillCardIdGroups.map((group) => group.join("-")).join("_")
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
