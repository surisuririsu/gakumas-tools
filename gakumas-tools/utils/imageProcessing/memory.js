import { PItems, SkillCards } from "gakumas-data";
import * as ort from "onnxruntime-web";
import {
  DEBUG,
  getBlackCanvas,
  getWhiteCanvas,
  loadImageFromFile,
  extractLines,
} from "./common";
import { calculateContestPower } from "../contestPower";

const PARAMS_REGEXP = new RegExp(/^\s*\d+\s+\d+\s+\d+\s+\d+\s*$/gm);

export async function getMemoryFromFile(file, engWorker, pItemSession, pItemEmbeddings, skillCardSession, skillCardEmbeddings) {
  const img = await loadImageFromFile(file);
  const blackCanvas = getBlackCanvas(img);
  const whiteCanvas = getWhiteCanvas(img);

  const engWhiteResult = await engWorker.recognize(whiteCanvas);
  const engBlackResult = await engWorker.recognize(
    blackCanvas,
    {},
    { blocks: true }
  );

  const powerCandidates = extractPower(engWhiteResult);
  const blackLines = extractLines(engBlackResult);
  const paramsLineIndex = blackLines.findIndex(({ text }) =>
    PARAMS_REGEXP.test(text)
  );
  const paramsLine = blackLines[paramsLineIndex];
  const pItemsLabelLine = blackLines[paramsLineIndex + 1];

  const contentWidth = paramsLine.bbox.x1 - pItemsLabelLine.bbox.x0;
  const anchorPoint = {
    x: pItemsLabelLine.bbox.x0,
    y: pItemsLabelLine.bbox.y1,
  };

  const pItemBoxes = getPItemBoundingBoxes(anchorPoint, contentWidth);
  const skillCardBoxes = getSkillCardBoundingBoxes(anchorPoint, contentWidth);

  // Draw boxes for debugging
  if (DEBUG) {
    const debugCanvas = document.createElement("canvas");
    debugCanvas.width = img.width;
    debugCanvas.height = img.height;
    const debugCtx = debugCanvas.getContext("2d");
    debugCtx.drawImage(img, 0, 0);
    debugCtx.strokeStyle = "red";
    debugCtx.lineWidth = 2;
    debugCtx.strokeRect(
      paramsLine.bbox.x0,
      paramsLine.bbox.y0,
      paramsLine.bbox.x1 - paramsLine.bbox.x0,
      paramsLine.bbox.y1 - paramsLine.bbox.y0
    );
    pItemBoxes.forEach((box) => {
      debugCtx.strokeRect(box.x, box.y, box.width, box.height);
    });
    skillCardBoxes.forEach((box) => {
      debugCtx.strokeRect(box.x, box.y, box.width, box.height);
    });
    document.body.append(debugCanvas);
  }

  const params = extractParams(paramsLine);
  const pItems = await extractEntities(img, pItemBoxes, pItemSession, pItemEmbeddings);
  const skillCards = await extractEntities(img, skillCardBoxes, skillCardSession, skillCardEmbeddings);

  console.log("Extracted p-items:", pItems.map((id) => PItems.getById(id)?.name || id));
  console.log(
    "Extracted skill cards:",
    skillCards.map((id) => SkillCards.getById(id)?.name || id)
  );

  const itemsPIdolId = pItems
    .filter((c) => !!c)
    .map(PItems.getById)
    .find((item) => item.pIdolId)?.pIdolId;

  const cardsPIdolId = skillCards
    .filter((c) => !!c)
    .map(SkillCards.getById)
    .find((card) => card.pIdolId)?.pIdolId;

  // Pad items and cards to fixed number
  while (pItems.length < 3) {
    pItems.push(0);
  }
  while (skillCards.length < 6) {
    skillCards.push(0);
  }

  // Calculate contest power and flag those that are mismatched with the screenshot
  const calculatedPower = calculateContestPower(params, pItems, skillCards, []);
  const flag =
    !powerCandidates.includes(calculatedPower) || itemsPIdolId != cardsPIdolId;

  return {
    name: `${Math.max(...powerCandidates, 0)}${flag ? " (FIXME)" : ""}`,
    pIdolId: cardsPIdolId,
    params,
    pItemIds: pItems,
    skillCardIds: skillCards,
  };
}

function getPItemBoundingBoxes(anchorPoint, contentWidth) {
  const pItemsTL = {
    x: anchorPoint.x - contentWidth * 0.006,
    y: anchorPoint.y + contentWidth * 0.03,
  };
  const pItemsWidth = contentWidth * 0.147;
  const pItemsGap = contentWidth * 0.023;
  const pItemBoxes = [];
  for (let i = 0; i < 4; i++) {
    pItemBoxes.push({
      x: pItemsTL.x + i * (pItemsWidth + pItemsGap),
      y: pItemsTL.y,
      width: pItemsWidth,
      height: pItemsWidth,
    });
  }
  return pItemBoxes;
}

function getSkillCardBoundingBoxes(anchorPoint, contentWidth) {
  const skillCardsTL = {
    x: anchorPoint.x - contentWidth * 0.003,
    y: anchorPoint.y + contentWidth * 0.302,
  };
  const skillCardsWidth = contentWidth * 0.248;
  const skillCardsHGap = contentWidth * 0.023;
  const skillCardsVGap = contentWidth * 0.067;
  const skillCardBoxes = [];
  for (let i = 0; i < 6; i++) {
    skillCardBoxes.push({
      x: skillCardsTL.x + (i % 4) * (skillCardsWidth + skillCardsHGap),
      y:
        skillCardsTL.y + Math.floor(i / 4) * (skillCardsWidth + skillCardsVGap),
      width: skillCardsWidth,
      height: skillCardsWidth,
    });
  }
  return skillCardBoxes;
}

// Read contest power from OCR result
const POWER_REGEXP = new RegExp(/\d+/gm);
export function extractPower(result) {
  const powerLines = result.data.text.match(POWER_REGEXP) || [];
  const powerCandidates = powerLines.map((p) => parseInt(p, 10));
  return powerCandidates;
}

// Read Vo, Da, Vi, stamina from line
const WS_REGEXP = new RegExp(/\s+/);
export function extractParams(line) {
  const params = line.text
    .trim()
    .split(WS_REGEXP)
    .map((t) => parseInt(t, 10));
  return params;
}

const ICON_SIZE = 64;

async function extractEntities(img, boxes, session, embeddings) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  // Draw section of the image from first box to canvas
  canvas.width = ICON_SIZE;
  canvas.height = ICON_SIZE;
  const entityIds = [];

  for (let i = 0; i < boxes.length; i++) {
    const box = boxes[i];
    ctx.drawImage(
      img,
      box.x,
      box.y,
      box.width,
      box.height,
      0,
      0,
      ICON_SIZE,
      ICON_SIZE
    );

    if (DEBUG) {
      document.body.append(canvas);

      // Download as file
      const dataUrl = canvas.toDataURL("image/webp");
      const link = document.createElement("a");
      link.setAttribute("href", dataUrl);
      link.setAttribute("download", `entity_${i}_${Date.now()}.webp`);
      document.body.append(link);
      link.click();
      document.body.removeChild(link);
    }

    const imageData = ctx.getImageData(0, 0, ICON_SIZE, ICON_SIZE).data;
    const input = new Float32Array(3 * ICON_SIZE * ICON_SIZE);
    for (let j = 0; j < ICON_SIZE * ICON_SIZE; j++) {
      input[j] = imageData[j * 4] / 255;
      input[j + ICON_SIZE * ICON_SIZE] = imageData[j * 4 + 1] / 255;
      input[j + 2 * ICON_SIZE * ICON_SIZE] = imageData[j * 4 + 2] / 255;
    }
    const tensor = new ort.Tensor("float32", input, [
      1,
      3,
      ICON_SIZE,
      ICON_SIZE,
    ]);
    const output = await session.run({ input: tensor });
    const embedding = output.embedding.data;

    // Compute similarities
    const sims = Object.entries(embeddings).map(([id, emb]) => ({
      id,
      similarity: cosineSimilarity(embedding, emb),
    }));
    sims.sort((a, b) => b.similarity - a.similarity);
    if (sims[0].similarity < 0.9) {
      continue;
    }
    const entityId = sims[0].id.split("_")[0];
    entityIds.push(entityId);
  }

  return entityIds;
}

const cosineSimilarity = (a, b) => {
  let dot = 0,
    normA = 0,
    normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
};
