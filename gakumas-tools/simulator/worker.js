import { simulate } from ".";

addEventListener("message", (e) => {
  const { idolStageConfig, linkConfigs, strategyName, numRuns } = e.data;
  const result = simulate(idolStageConfig, linkConfigs, strategyName, numRuns);
  postMessage(result);
});
