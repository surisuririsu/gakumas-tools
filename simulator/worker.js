import StageEngine from "@/simulator/StageEngine";
import StagePlayer from "@/simulator/StagePlayer";
import HeuristicStrategy from "@/simulator/strategies/HeuristicStrategy";
import { DEBUG, NUM_RUNS } from "@/utils/simulator";

addEventListener("message", (e) => {
  const { stageConfig, idolConfig } = e.data;
  const engine = new StageEngine(stageConfig, idolConfig);
  const strategy = new HeuristicStrategy(engine);

  let runs = [];
  for (let i = 0; i < NUM_RUNS; i++) {
    const score = new StagePlayer(engine, strategy, DEBUG).play();
    runs.push(score);
  }

  postMessage(runs);
});
