import { mergeGraphDatas } from "@/utils/simulator";
import StageEngine from "./engine/StageEngine";
import StagePlayer from "./engine/StagePlayer";
import STRATEGIES from "./strategies";
import { formatRun } from "./engine/utils";

export function simulate(idolStageConfig, strategyName, numRuns) {
  const engine = new StageEngine(idolStageConfig);
  const strategy = new STRATEGIES[strategyName](engine);

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
