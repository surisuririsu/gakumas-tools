const SIMULATOR_BASE_URL = "https://gktools.ris.moe/simulator";

export function getSimulatorUrl(
  stageId,
  supportBonus,
  params,
  pItemIds,
  skillCardIdGroups
) {
  const searchParams = new URLSearchParams();
  stageId && searchParams.set("stage", stageId);
  supportBonus && searchParams.set("support_bonus", supportBonus);
  searchParams.set("params", params.map((p) => p || 0).join("-"));
  searchParams.set("items", pItemIds.join("-"));
  searchParams.set(
    "cards",
    skillCardIdGroups.map((group) => group.join("-")).join("_")
  );
  return `${SIMULATOR_BASE_URL}/?${searchParams.toString()}`;
}
