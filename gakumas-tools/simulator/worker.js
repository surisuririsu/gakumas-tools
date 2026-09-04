import { simulate } from ".";
import { WORKER_MESSAGE } from "./constants";

addEventListener("message", async (e) => {
  const { runId, idolStageConfig, linkConfigs, strategyName, numRuns } =
    e.data;
  let lastReported = 0;
  try {
    const result = await simulate(
      idolStageConfig,
      linkConfigs,
      strategyName,
      numRuns,
      (completed) => {
        const delta = completed - lastReported;
        lastReported = completed;
        postMessage({ type: WORKER_MESSAGE.PROGRESS, runId, delta });
      }
    );
    postMessage({ type: WORKER_MESSAGE.RESULT, runId, result });
  } catch (err) {
    console.error(err);
    postMessage({
      type: WORKER_MESSAGE.ERROR,
      runId,
      message: err?.message || String(err),
    });
  }
});
