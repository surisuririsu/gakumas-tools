export function createProgressStore() {
  let value = 0;
  const listeners = new Set();

  return {
    get: () => value,
    set(next) {
      value = typeof next == "function" ? next(value) : next;
      listeners.forEach((listener) => listener());
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
