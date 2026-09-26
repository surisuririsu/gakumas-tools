import { MAX_WORKERS, WORKER_MESSAGE } from "./constants";

let workers = null;
let holders = 0;
let nextRunId = 0;
const pendingRejects = new Set();

export function workerCount() {
  return Math.min(navigator.hardwareConcurrency || 1, MAX_WORKERS);
}

// Call from a mount effect and run the returned release on unmount.
export function retainWorkerPool() {
  holders++;
  return () => {
    holders--;
    if (holders > 0) return;
    terminatePool(new DOMException("Worker pool released", "AbortError"));
  };
}

function terminatePool(reason) {
  workers?.forEach((worker) => worker.terminate());
  workers = null;
  pendingRejects.forEach((reject) => reject(reason));
  pendingRejects.clear();
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
  onProgress,
  signal
) {
  if (signal?.aborted) return Promise.reject(signal.reason);
  const pool = getWorkerPool();
  // Two Simulators can share the pool, so each run tags its own messages.
  const runId = nextRunId++;
  const runsPerWorker = Math.round(numRuns / pool.length);

  const cancel = () => terminatePool(signal.reason);
  signal?.addEventListener("abort", cancel, { once: true });

  return Promise.all(
    pool.map(
      (worker) =>
        new Promise((resolve, reject) => {
          pendingRejects.add(reject);
          const listeners = new AbortController();
          listeners.signal.addEventListener("abort", () =>
            pendingRejects.delete(reject)
          );
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
  ).finally(() => signal?.removeEventListener("abort", cancel));
}
