import { simulate } from ".";
import { WORKER_MESSAGE } from "./constants";

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
      postMessage({ type: WORKER_MESSAGE.PROGRESS, delta });
    }
  );
  postMessage({ type: WORKER_MESSAGE.RESULT, result });
});
