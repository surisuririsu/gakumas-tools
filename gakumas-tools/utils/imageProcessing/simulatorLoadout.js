import { PItems, SkillCards } from "gakumas-data";
import { IdolConfig } from "gakumas-engine";
import { inferCustomizations } from "@/utils/inferCustomizations";
import { findStageCandidates } from "@/utils/supportBonus";
import {
  CONTEST_LAYOUT,
  isGreyedOut,
  readBadges,
  resolveGreyedOut,
} from "./cardBadges";
import { DEBUG, getImageData, loadImageFromFile } from "./common";
import { detectLoadoutBoxes } from "./contestLoadoutGeometry";
import { readStats } from "./contestLoadoutStats";
import { extractEntities } from "./memory";
import { loadPItemModel, loadSkillCardModel } from "./models";

export async function getSimulatorLoadoutFromFile(file, currentStageId) {
  const img = await loadImageFromFile(file);
  // Kick off model loads in parallel with pixel work — cold start dominates
  // first-use latency and the two are independent.
  const modelsPromise = Promise.all([loadPItemModel(), loadSkillCardModel()]);
  const imageData = getImageData(img);

  const { mainRow, pItemBoxes, mainBoxes, subBoxes } =
    detectLoadoutBoxes(imageData);
  const { params, percents } = readStats(imageData, mainRow);

  if (DEBUG) {
    debugOverlay(img, [...pItemBoxes, ...mainBoxes, ...subBoxes]);
  }

  const [
    { session: pItemSession, classes: pItemClasses },
    { session: skillCardSession, classes: skillCardClasses },
  ] = await modelsPromise;

  // onnxruntime-web's WASM runtime is shared across sessions — concurrent
  // session.run calls throw "Session already started", so these must run
  // sequentially. Batching by session avoids the per-call setup overhead.
  const skillCardIds = await classifySlots(
    img,
    [...mainBoxes, ...subBoxes],
    skillCardSession,
    skillCardClasses,
  );
  const pItemIds = await classifySlots(
    img,
    pItemBoxes,
    pItemSession,
    pItemClasses,
  );
  const [mainIds, subIds] = resolveGreyedOut(
    [
      skillCardIds.slice(0, mainBoxes.length),
      skillCardIds.slice(mainBoxes.length),
    ],
    [mainBoxes, subBoxes].map((boxes) =>
      boxes.map((box) => !!box && isGreyedOut(imageData, box)),
    ),
  );
  const customizationGroups = [
    [mainIds, mainBoxes],
    [subIds, subBoxes],
  ].map(([ids, boxes]) =>
    ids.map((id, i) =>
      boxes[i]
        ? inferCustomizations(
            id,
            readBadges(imageData, boxes[i], CONTEST_LAYOUT),
          )
        : {},
    ),
  );
  if (subIds[0] && subIds[0] === mainIds[0]) {
    customizationGroups[1][0] = { ...customizationGroups[0][0] };
  }

  const { plan } = new IdolConfig({
    params,
    pItemIds,
    skillCardIdGroups: [mainIds, subIds],
  });
  const stageCandidates = findStageCandidates(params, percents, {
    currentStageId,
    plan,
  });

  if (DEBUG) {
    console.log("Extracted stats:", params, percents, stageCandidates);
    console.log(
      "Extracted p-items:",
      pItemIds.map((id) => PItems.getById(id)?.name || id),
    );
    console.log(
      "Extracted main skill cards:",
      mainIds.map((id) => SkillCards.getById(id)?.name || id),
    );
    console.log(
      "Extracted sub skill cards:",
      subIds.map((id) => SkillCards.getById(id)?.name || id),
    );
  }

  return {
    ...stageCandidates[0],
    stageCandidates,
    params,
    pItemIds,
    skillCardIdGroups: [mainIds, subIds],
    customizationGroups,
  };
}

// Slots cut off by the screenshot's edge come back null and stay empty.
async function classifySlots(img, boxes, session, classes) {
  const ids = await extractEntities(
    img,
    boxes.filter(Boolean),
    session,
    classes,
  );
  return boxes.map((box) => (box ? ids.shift() : 0));
}

function debugOverlay(img, boxes) {
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  ctx.lineWidth = 3;
  ctx.strokeStyle = "red";
  for (const box of boxes.filter(Boolean)) {
    ctx.strokeRect(box.x, box.y, box.width, box.height);
  }
  document.body.append(canvas);
}
