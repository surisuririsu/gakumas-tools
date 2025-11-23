import { simulate } from ".";

addEventListener("message", async (e) => {
  const { idolStageConfig, linkConfigs, strategyName, numRuns } = e.data;
  const result = await simulate(
    idolStageConfig,
    linkConfigs,
    strategyName,
    numRuns
  );
  postMessage(result);
});
