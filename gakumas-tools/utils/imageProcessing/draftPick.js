import { SkillCards } from "gakumas-data";
import { DEBUG, getImageData, loadImageFromFile } from "./common";
import { detectDraftPickBoxes } from "./draftPickGeometry";
import { extractEntities } from "./memory";
import { loadSkillCardModel } from "./models";

export async function getDraftPickFromFile(file) {
  const img = await loadImageFromFile(file);
  const imageData = getImageData(img);

  const { panel, cardRow, boxes } = detectDraftPickBoxes(imageData);

  if (DEBUG) debugOverlay(img, panel, cardRow, boxes);

  const { session, classes } = await loadSkillCardModel();
  const ids = await extractEntities(img, boxes, session, classes);
  console.log(
    "Extracted draft pick cards:",
    ids.map((id) => SkillCards.getById(id)?.name || id),
  );
  return ids;
}

function debugOverlay(img, panel, cardRow, boxes) {
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  ctx.lineWidth = 3;
  ctx.strokeStyle = "green";
  ctx.strokeRect(panel.x, panel.y, panel.width, panel.height);
  ctx.strokeStyle = "orange";
  ctx.strokeRect(cardRow.x, cardRow.y, cardRow.width, cardRow.height);
  ctx.strokeStyle = "red";
  for (const box of boxes) {
    ctx.strokeRect(box.x, box.y, box.width, box.height);
  }
  document.body.append(canvas);
}
