import { MAX_WORKERS, WORKER_MESSAGE } from "./constants";

let workers = null;
let holders = 0;
let nextRunId = 0;

export function workerCount() {
  return Math.min(navigator.hardwareConcurrency || 1, MAX_WORKERS);
}

// Call from a mount effect and run the returned release on unmount.
export function retainWorkerPool() {
  holders++;
  return () => {
    holders--;
    if (holders > 0) return;
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

export function runOnWorkers(
  { idolStageConfig, linkConfigs, strategyName, numRuns },
  onProgress
) {
  const pool = getWorkerPool();
  // Two Simulators can share the pool, so each run tags its own messages.
  const runId = nextRunId++;
  const runsPerWorker = Math.round(numRuns / pool.length);

  return Promise.all(
    pool.map(
      (worker) =>
        new Promise((resolve, reject) => {
          const listeners = new AbortController();
          worker.addEventListener(
            "message",
            ({ data }) => {
              if (data.runId !== runId) return;
              if (data.type === WORKER_MESSAGE.PROGRESS) {
                onProgress(data.delta);
              } else if (data.type === WORKER_MESSAGE.RESULT) {
                listeners.abort();
                resolve(data.result);
              } else if (data.type === WORKER_MESSAGE.ERROR) {
                listeners.abort();
                reject(new Error(data.message));
              }
            },
            { signal: listeners.signal }
          );
          worker.addEventListener(
            "error",
            (e) => {
              listeners.abort();
              reject(e.error || new Error(e.message || "Worker failed"));
            },
            { signal: listeners.signal }
          );
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
