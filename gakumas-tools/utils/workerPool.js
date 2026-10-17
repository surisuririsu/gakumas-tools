// Run tasks on at most `size` workers. Workers are created only when every
// existing one is busy, reused while work keeps arriving, and destroyed once
// the pool has sat idle for `idleMs`. A worker whose task throws is replaced,
// since it may be left in a broken state.
export function createWorkerPool({ size, create, destroy, idleMs = 10000 }) {
  const idle = [];
  const pending = [];
  let active = 0;
  let idleTimer = null;
  let closed = false;

  const discard = (worker) => worker.then(destroy, () => {});

  function dispatch() {
    clearTimeout(idleTimer);
    while (pending.length && active < size) {
      active++;
      execute(pending.shift(), idle.pop() ?? create());
    }
    if (!active) {
      idleTimer = setTimeout(() => idle.splice(0).forEach(discard), idleMs);
    }
  }

  async function execute({ fn, resolve, reject }, worker) {
    let healthy = true;
    try {
      resolve(await fn(await worker));
    } catch (err) {
      healthy = false;
      reject(err);
    }
    active--;
    if (healthy && !closed) idle.push(worker);
    else discard(worker);
    if (!closed) dispatch();
  }

  return {
    run(fn) {
      return new Promise((resolve, reject) => {
        pending.push({ fn, resolve, reject });
        dispatch();
      });
    },
    close() {
      closed = true;
      clearTimeout(idleTimer);
      idle.splice(0).forEach(discard);
    },
  };
}
