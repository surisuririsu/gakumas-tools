import { useState } from "react";

export function usePopOnActivate(active, enabled = true) {
  const [seen, setSeen] = useState({ active, count: 0 });
  if (seen.active !== active) {
    let count = seen.count;
    if (active) count = enabled ? count + 1 : 0;
    setSeen({ active, count });
  }
  if (!active || !seen.count) return null;
  return seen.count % 2 ? "a" : "b";
}

export function usePopOnChange(value) {
  const [seen, setSeen] = useState({ value, count: 0 });
  if (seen.value !== value) {
    setSeen({ value, count: seen.count + 1 });
  }
  if (!seen.count) return null;
  return seen.count % 2 ? "a" : "b";
}
