import { useState } from "react";

const phase = (count) => (count ? (count % 2 ? "A" : "B") : null);

export function usePopOnChange(value) {
  const [seen, setSeen] = useState({ value, count: 0 });
  if (seen.value !== value) {
    setSeen({ value, count: seen.count + 1 });
  }
  return phase(seen.count);
}

export function usePopOnActivate(active, enabled = true) {
  const [seen, setSeen] = useState({ active, count: 0 });
  if (seen.active !== active) {
    let count = seen.count;
    if (active) count = enabled ? count + 1 : 0;
    setSeen({ active, count });
  }
  return active ? phase(seen.count) : null;
}
