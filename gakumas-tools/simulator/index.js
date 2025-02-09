import { StageEngine, StagePlayer, STRATEGIES } from "gakumas-engine";
import { formatRun, mergeGraphDatas } from "@/utils/simulator";

export function simulate(idolStageConfig, strategyName, numRuns) {
  const engine = new StageEngine(idolStageConfig);
  const strategy = new STRATEGIES[strategyName](engine);
  engine.strategy = strategy;

  let totalScore = 0;
  let averageScore = 0;
  let minRun, averageRun, maxRun;
  let scores = [];
  let graphDatas = [];

  for (let i = 0; i < numRuns; i++) {
    const result = new StagePlayer(engine, strategy).play();

    // Track min/average/max runs
    if (!minRun || result.score < minRun.score) {
      minRun = result;
    }
    if (!maxRun || result.score > maxRun.score) {
      maxRun = result;
    }
    totalScore += result.score;
    averageScore = Math.round(totalScore / i + 1);
    if (
      !averageRun ||
      Math.abs(result.score - averageScore) <
        Math.abs(averageRun.score - averageScore)
    ) {
      averageRun = result;
    }

    scores.push(result.score);
    graphDatas.push(result.graphData);
  }

  const mergedGraphData = mergeGraphDatas(graphDatas);

  return {
    graphData: mergedGraphData,
    minRun: formatRun(minRun),
    averageRun: formatRun(averageRun),
    maxRun: formatRun(maxRun),
    averageScore,
    scores,
  };
}
