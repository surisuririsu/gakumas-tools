import { simulate } from ".";

addEventListener("message", (e) => {
  const { idolStageConfig, strategyName, numRuns } = e.data;
  const result = simulate(idolStageConfig, strategyName, numRuns);
  postMessage(result);
});
