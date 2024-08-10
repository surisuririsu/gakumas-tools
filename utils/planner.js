const PLANNER_BASE_URL = "https://gkcontest.ris.moe";

export function getPlannerUrl(plan, idolId, pItemIds, skillCardIdGroups) {
  const params = new URLSearchParams();
  params.set("plan", plan);
  params.set("idol", idolId);
  params.set("items", pItemIds.join("-"));
  params.set(
    "cards",
    skillCardIdGroups.map((group) => group.join("-")).join("_")
  );
  return `${PLANNER_BASE_URL}/?${params.toString()}`;
}
