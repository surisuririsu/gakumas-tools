const SIMULATOR_BASE_URL = "https://gktools.ris.moe/simulator";

export function getSimulatorUrl(stageId, params, pItemIds, skillCardIdGroups) {
  const searchParams = new URLSearchParams();
  searchParams.set("stage", stageId);
  searchParams.set("params", params.map((p) => p || 0).join("-"));
  searchParams.set("items", pItemIds.join("-"));
  searchParams.set(
    "cards",
    skillCardIdGroups.map((group) => group.join("-")).join("_")
  );
  return `${SIMULATOR_BASE_URL}/?${searchParams.toString()}`;
}
