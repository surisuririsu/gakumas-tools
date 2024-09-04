import { BUCKET_SIZE, GRAPHED_FIELDS } from "@/simulator/constants";

const SIMULATOR_BASE_URL = "https://gktools.ris.moe/simulator";

export function getSimulatorUrl(
  stageId,
  supportBonus,
  params,
  pItemIds,
  skillCardIdGroups
) {
  const searchParams = new URLSearchParams();
  stageId && stageId != "custom" && searchParams.set("stage", stageId);
  supportBonus && searchParams.set("support_bonus", supportBonus);
  searchParams.set("params", params.map((p) => p || 0).join("-"));
  searchParams.set("items", pItemIds.join("-"));
  searchParams.set(
    "cards",
    skillCardIdGroups.map((group) => group.join("-")).join("_")
  );
  return `${SIMULATOR_BASE_URL}/?${searchParams.toString()}`;
}

export function getLoadoutFromSearchParams(searchParams) {
  let stageId = searchParams.get("stage");
  let supportBonus = searchParams.get("support_bonus");
  let params = searchParams.get("params");
  let pItemIds = searchParams.get("items");
  let skillCardIdGroups = searchParams.get("cards");
  const hasDataFromParams = stageId || params || pItemIds || skillCardIdGroups;

  stageId = stageId || "22";
  params = params || "1000-1000-1000-40";
  pItemIds = pItemIds || "0-0-0";
  skillCardIdGroups = skillCardIdGroups || "0-0-0-0-0-0_0-0-0-0-0-0";

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
    hasDataFromParams,
  };
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

export function shuffle(arr) {
  let shuffled = [...arr];
  let currentIndex = shuffled.length;

  while (currentIndex != 0) {
    let randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    [shuffled[currentIndex], shuffled[randomIndex]] = [
      shuffled[randomIndex],
      shuffled[currentIndex],
    ];
  }

  return shuffled;
}
