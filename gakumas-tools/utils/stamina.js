export function getMemoryParamContribution(value, multiplier = 1) {
  return Math.floor((value || 0) * multiplier);
}

export function getLoadoutStaminaContributions(
  memoryStaminaValues,
  multipliers,
) {
  return memoryStaminaValues.map((stamina, index) => {
    if (!Number.isFinite(stamina)) return null;
    return getMemoryParamContribution(stamina, multipliers[index]);
  });
}

