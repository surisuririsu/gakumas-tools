// Process `items` through a pool of async `workers` (promises resolving to
// worker instances) in order-preserving batches of `workers.length`. Each
// batch runs concurrently; batches run sequentially. `fn` receives the item,
// the resolved worker, and the item index, and its return values are
// collected into the result array in the same order as the input.
export async function runBatched(items, workers, fn) {
  const results = new Array(items.length);
  for (let start = 0; start < items.length; start += workers.length) {
    const batch = items.slice(start, start + workers.length);
    const batchResults = await Promise.all(
      batch.map(async (item, j) => fn(item, await workers[j], start + j)),
    );
    for (let k = 0; k < batchResults.length; k++) {
      results[start + k] = batchResults[k];
    }
  }
  return results;
}
