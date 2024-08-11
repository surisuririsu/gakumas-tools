import { simulate } from ".";

addEventListener("message", (e) => {
  const { stageConfig, idolConfig, strategy, numRuns } = e.data;
  const result = simulate(stageConfig, idolConfig, strategy, numRuns);
  postMessage(result);
});
