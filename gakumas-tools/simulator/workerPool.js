import { MAX_WORKERS, WORKER_MESSAGE } from "./constants";

let workers = null;
let holders = 0;
let nextRunId = 0;

export function workerCount() {
  return Math.min(navigator.hardwareConcurrency || 1, MAX_WORKERS);
}

// Call from a mount effect and run the returned release on unmount. The pool
// is shared by every mounted Simulator (the page and a pinned copy), spawned
// on first use, and terminated once the last holder unmounts.
export function retainWorkerPool() {
  holders++;
  return () => {
    holders--;
    if (holders > 0) return;
    holders = 0;
    workers?.forEach((worker) => worker.terminate());
    workers = null;
  };
}

function getWorkerPool() {
  if (!workers) {
    workers = Array.from(
      { length: workerCount() },
      () => new Worker(new URL("./worker.js", import.meta.url))
    );
  }
  return workers;
}

// Splits `numRuns` across the pool and resolves with one result per worker.
// Messages carry a run id so concurrent runs from two Simulator instances
// sharing the pool don't read each other's progress or results.
export function runOnWorkers(
  { idolStageConfig, linkConfigs, strategyName, numRuns },
  onProgress
) {
  const pool = getWorkerPool();
  const runId = nextRunId++;
  const runsPerWorker = Math.round(numRuns / pool.length);

  return Promise.all(
    pool.map(
      (worker) =>
        new Promise((resolve, reject) => {
          const cleanup = () => {
            worker.removeEventListener("message", onMessage);
            worker.removeEventListener("error", onError);
          };
          const onMessage = (e) => {
            if (e.data.runId !== runId) return;
            if (e.data.type === WORKER_MESSAGE.PROGRESS) {
              onProgress(e.data.delta);
            } else if (e.data.type === WORKER_MESSAGE.RESULT) {
              cleanup();
              resolve(e.data.result);
            } else if (e.data.type === WORKER_MESSAGE.ERROR) {
              cleanup();
              reject(new Error(e.data.message));
            }
          };
          const onError = (e) => {
            cleanup();
            reject(e.error || new Error(e.message || "Worker failed"));
          };
          worker.addEventListener("message", onMessage);
          worker.addEventListener("error", onError);
          worker.postMessage({
            runId,
            idolStageConfig,
            linkConfigs,
            strategyName,
            numRuns: runsPerWorker,
          });
        })
    )
  );
}
