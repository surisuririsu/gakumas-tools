import { simulate } from ".";

addEventListener("message", (e) => {
  const { idolStageConfig, strategy, numRuns } = e.data;
  const result = simulate(idolStageConfig, strategy, numRuns);
  postMessage(result);
});
