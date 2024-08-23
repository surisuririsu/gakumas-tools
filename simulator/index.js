import { GRAPHED_FIELDS } from "./constants";
import StageEngine from "./StageEngine";
import StageLogger from "./StageLogger";
import StagePlayer from "./StagePlayer";
import STRATEGIES from "./strategies";

export function simulate(stageConfig, idolConfig, strategyName, numRuns) {
  const logger = new StageLogger();
  const engine = new StageEngine(stageConfig, idolConfig, logger);
  const strategy = new STRATEGIES[strategyName](engine);

  let totalScore = 0;
  let averageScore = 0;
  let minRun, averageRun, maxRun;
  let scores = [];
  let graphDatas = [];

  for (let i = 0; i < numRuns; i++) {
    const result = new StagePlayer(engine, strategy).play();

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

  let mergedGraphData = {};
  for (let field of GRAPHED_FIELDS) {
    mergedGraphData[field] = [];
    for (let graphData of graphDatas) {
      for (let i = 0; i < graphData.length; i++) {
        if (!mergedGraphData[field][i]) mergedGraphData[field][i] = 0;
        mergedGraphData[field][i] += graphData[i][field] / numRuns;
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
  };
}
