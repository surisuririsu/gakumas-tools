import { simulate } from ".";

addEventListener("message", async (e) => {
  const { idolStageConfig, linkConfigs, strategyName, numRuns } = e.data;
  let lastReported = 0;
  const result = await simulate(
    idolStageConfig,
    linkConfigs,
    strategyName,
    numRuns,
    (completed) => {
      const delta = completed - lastReported;
      lastReported = completed;
      postMessage({ type: "progress", delta });
    }
  );
  postMessage({ type: "result", result });
});
