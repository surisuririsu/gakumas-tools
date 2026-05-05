export function pct(num, denom) {
  if (!denom) return "0.0";
  return ((num / denom) * 100).toFixed(1);
}
