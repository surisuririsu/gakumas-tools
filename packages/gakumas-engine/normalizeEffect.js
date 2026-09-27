// DSL effects come in dozens of key combinations. Giving every effect the
// engine touches the same keys in the same order keeps property access on
// them monomorphic.
export function normalizeEffect(effect) {
  const normalized = {
    phase: effect.phase,
    filter: effect.filter,
    conditions: effect.conditions,
    targets: effect.targets,
    actions: effect.actions,
    effects: effect.effects,
    limit: effect.limit,
    ttl: effect.ttl,
    delay: effect.delay,
    group: effect.group,
    anchor: effect.anchor,
    type: effect.type,
    source: effect.source,
    effectInstanceId: effect.effectInstanceId,
  };
  for (const key in effect) {
    if (!(key in normalized)) normalized[key] = effect[key];
  }
  return normalized;
}
