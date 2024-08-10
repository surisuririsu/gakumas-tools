import StageEngine from "@/simulator/StageEngine";
import StageLogger from "@/simulator/StageLogger";
import StagePlayer from "@/simulator/StagePlayer";
import HeuristicStrategy from "@/simulator/strategies/HeuristicStrategy";
import { DEBUG } from "@/simulator/constants";

export function simulate(stageConfig, idolConfig, numRuns) {
  const logger = new StageLogger(DEBUG);
  const engine = new StageEngine(stageConfig, idolConfig, logger);
  const strategy = new HeuristicStrategy(engine);

  let totalScore = 0;
  let averageScore = 0;
  let minRun, averageRun, maxRun;
  let scores = [];

  console.time("work");
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
  console.timeEnd("work");

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
