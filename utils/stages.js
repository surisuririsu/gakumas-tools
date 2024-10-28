export function formatStageName(stage, t) {
  let stageName = "";
  if (stage.type == "custom") {
    stageName = t("custom");
  } else if (stage.type == "contest") {
    stageName = t("contestStageName", {
      season: stage.season,
      stage: stage.stage,
    });
  } else if (stage.type == "event") {
    stageName = t("eventStageName", {
      name: stage.name,
      stage: stage.stage,
      season: stage.season,
    });
  }
  return stageName;
}
