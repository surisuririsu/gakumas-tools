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
      round: stage.round,
    });
  }
  if (stage.preview) {
    stageName += "*";
  }
  return stageName;
}

export function formatStageShortName(stage, t) {
  let stageName = "";
  if (stage.type == "custom") {
    stageName = t("custom");
  } else if (stage.type == "contest") {
    stageName = `${stage.season} - ${stage.stage}`;
  } else if (stage.type == "event") {
    stageName = `${stage.stage} - ${stage.round}`;
  }
  return stageName;
}
