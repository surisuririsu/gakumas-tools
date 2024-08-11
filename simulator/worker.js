import StageEngine from "./StageEngine";
import StageLogger from "./StageLogger";
import StagePlayer from "./StagePlayer";
import DeepRandomScoreStrategy from "./strategies/DeepRandomScoreStrategy";
import DeepShallowScoreStrategy from "./strategies/DeepShallowScoreStrategy";
import DeepMaxScoreStrategy from "./strategies/DeepMaxScoreStrategy";
import HeuristicStrategy from "./strategies/HeuristicStrategy";
import DeepAverageScoreStrategy from "./strategies/DeepAverageScoreStrategy";
import RandomStrategy from "./strategies/RandomStrategy";

export function simulate(stageConfig, idolConfig, numRuns) {
  const logger = new StageLogger();
  const engine = new StageEngine(stageConfig, idolConfig, logger);
  const strategy = new DeepRandomScoreStrategy(engine);

  let totalScore = 0;
  let averageScore = 0;
  let minRun, averageRun, maxRun;
  let scores = [];

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
  }

  return {
    minRun,
    averageRun,
    maxRun,
    averageScore,
    scores,
  };
}

addEventListener("message", (e) => {
  const { stageConfig, idolConfig, numRuns } = e.data;
  const result = simulate(stageConfig, idolConfig, numRuns);
  postMessage(result);
});
