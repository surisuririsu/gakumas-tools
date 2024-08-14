export function deserializeIds(str) {
  return str.split('-').map((n) => parseInt(n, 10))
}

export function serializeIds(ids) {
  return ids.join('-')
}
