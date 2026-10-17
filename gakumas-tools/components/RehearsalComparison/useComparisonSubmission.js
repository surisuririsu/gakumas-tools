import { useEffect, useMemo, useRef } from "react";

const ENDPOINT = "/api/rehearsal-comparison";
const DEBOUNCE_MS = 1500;

function send(method, body) {
  fetch(ENDPOINT, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    keepalive: true,
  }).catch(console.error);
}

export default function useComparisonSubmission({
  enabled,
  run,
  enterPercents,
  rows,
  cell,
  scores,
}) {
  const id = useMemo(() => crypto.randomUUID(), [run, rows]);
  const submittedRef = useRef(new Set());

  useEffect(() => {
    const submitted = submittedRef.current;
    if (!enabled) {
      if (submitted.delete(id)) send("DELETE", { id });
      return;
    }
    if (!run?.stats || !cell || !scores.length) return;

    const timer = setTimeout(() => {
      submitted.add(id);
      send("PUT", {
        id,
        loadout: run.loadout,
        enterPercents,
        simStats: run.stats,
        rehearsal: { stage: cell[0] + 1, slot: cell[1] + 1, scores },
      });
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [enabled, id, run, enterPercents, cell, scores]);
}
