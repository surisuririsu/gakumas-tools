import { getImageProps } from "next/image";
import { Idols, PIdols, PItems, SkillCards } from "gakumas-data";
import gkImg from "gakumas-images";
import {
  DEBUG,
  getGameRegion,
  getBlackCanvas,
  getWhiteCanvas,
  loadImageFromFile,
  extractLines,
} from "./common";
import { calculateContestPower } from "../contestPower";
import * as ort from "onnxruntime-web";

const PARAMS_REGEXP = new RegExp(/^\s*\d+\s+\d+\s+\d+\s+\d+\s*$/gm);

export async function getMemoryFromFile(file, engWorker, session, embeddings) {
  const img = await loadImageFromFile(file);
  const blackCanvas = getBlackCanvas(img);
  const whiteCanvas = getWhiteCanvas(img);

  // const engWhiteResult = await engWorker.recognize(whiteCanvas);
  const engBlackResult = await engWorker.recognize(
    blackCanvas,
    {},
    { blocks: true }
  );

  // const powerCandidates = extractPower(engWhiteResult);
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
  const pItems = await extractPItems(img, pItemBoxes, session, embeddings);
  const skillCards = await extractSkillCards(
    img,
    skillCardBoxes,
    session,
    embeddings
  );

  return;

  const items = [];
  const itemsPIdolId = items
    .filter((c) => !!c)
    .map(PItems.getById)
    .find((item) => item.pIdolId)?.pIdolId;

  const cards = await extractCards(
    img,
    blackCanvas,
    itemsPIdolId,
    sess,
    embeddings
  );
  const cardsPIdolId = cards
    .filter((c) => !!c)
    .map(SkillCards.getById)
    .find((card) => card.pIdolId)?.pIdolId;

  // Pad items and cards to fixed number
  while (items.length < 3) {
    items.push(0);
  }
  while (cards.length < 6) {
    cards.push(0);
  }

  // Calculate contest power and flag those that are mismatched with the screenshot
  const calculatedPower = calculateContestPower(params, items, cards, []);
  const flag =
    !powerCandidates.includes(calculatedPower) || itemsPIdolId != cardsPIdolId;

  return {
    name: `${Math.max(...powerCandidates, 0)}${flag ? " (FIXME)" : ""}`,
    pIdolId: cardsPIdolId,
    params,
    pItemIds: items,
    skillCardIds: cards,
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

// Size and bounds of images to compare
// Downsize images to sample surrounding colors
const COMP_SIZE = 40;
const DRAW_AREA = [0, 0, COMP_SIZE, COMP_SIZE];
const COMP_AREA = [2, 2, COMP_SIZE - 4, COMP_SIZE - 4];

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

async function extractPItems(img, boxes, session, embeddings) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  // Draw section of the image from first box to canvas
  canvas.width = ICON_SIZE;
  canvas.height = ICON_SIZE;
  const pItemIds = [];
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

    // Download as file
    const dataUrl = canvas.toDataURL("image/webp");
    const link = document.createElement("a");
    link.setAttribute("href", dataUrl);
    link.setAttribute("download", `p_item_${i}_${Date.now()}.webp`);
    document.body.append(link);
    link.click();
    document.body.removeChild(link);

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
    // Sort and take top 3
    sims.sort((a, b) => b.similarity - a.similarity);
    const itemId = sims[0].id.split("_")[0];
    pItemIds.push(itemId);
  }

  document.body.append(canvas);

  console.log(
    "Extracted P-Items:",
    pItemIds.map((id) => PItems.getById(id)?.name || id)
  );

  return pItemIds;
}

async function extractSkillCards(img, boxes, session, embeddings) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  // Draw section of the image from first box to canvas
  canvas.width = ICON_SIZE;
  canvas.height = ICON_SIZE;
  const skillCardIds = [];
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

    // Download as file
    const dataUrl = canvas.toDataURL("image/webp");
    const link = document.createElement("a");
    link.setAttribute("href", dataUrl);
    link.setAttribute("download", `skill_card_${i}_${Date.now()}.webp`);
    document.body.append(link);
    link.click();
    document.body.removeChild(link);

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
    // Sort and take top 3
    sims.sort((a, b) => b.similarity - a.similarity);
    const itemId = sims[0].id.split("_")[0];
    skillCardIds.push(itemId);
  }

  document.body.append(canvas);

  console.log(
    "Extracted skill cards:",
    skillCardIds.map((id) => SkillCards.getById(id)?.name || id)
  );

  return skillCardIds;
}

// Search for rows of black pixels marking edge of item/card
function locateEntities(canvas, searchArea, threshold) {
  const ctx = canvas.getContext("2d");
  const d = ctx.getImageData(
    searchArea.x,
    searchArea.y,
    searchArea.width,
    searchArea.height
  );

  if (DEBUG) {
    const nc = document.createElement("canvas");
    nc.width = searchArea.width;
    nc.height = searchArea.height;
    const nctx = nc.getContext("2d");
    nctx.putImageData(d, 0, 0);
    document.body.append(nc);
  }

  let consecutivePixels = 0;
  let coords = [];
  for (let i = 0; i < searchArea.height; i++) {
    for (let j = 0; j < searchArea.width; j++) {
      const dIndex = (i * searchArea.width + j) * 4;
      // Check if pixel is black
      if (d.data[dIndex] == 0) {
        consecutivePixels++;
      } else {
        // If we have enough consecutive pixels, increment detected entities
        if (consecutivePixels > threshold) {
          coords.push({ x: searchArea.x + j, y: searchArea.y + i });
        }
        consecutivePixels = 0;
      }
    }
    if (coords.length) break;
  }

  return coords;
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

// Compare detected areas with item/card icons to find most similar
async function identifyEntities(
  img,
  coords,
  width,
  plusIndex,
  session,
  embeddings
) {
  const memCanvas = new OffscreenCanvas(64, 64);
  const memCtx = memCanvas.getContext("2d");

  const detectedEntities = [];
  for (let index in coords) {
    const [x, y] = coords[index];
    // Draw the region to a 64x64 canvas for model input
    memCtx.clearRect(0, 0, 64, 64);
    memCtx.drawImage(img, x, y, width, width, 0, 0, 64, 64);
    const imageData = memCtx.getImageData(0, 0, 64, 64).data;

    if (DEBUG) {
      const nc = document.createElement("canvas");
      nc.width = 64;
      nc.height = 64;
      const nctx = nc.getContext("2d");
      nctx.drawImage(img, x, y, width, width, 0, 0, 64, 64);
      document.body.append(nc);
    }

    const input = new Float32Array(3 * 64 * 64);
    for (let i = 0; i < 64 * 64; i++) {
      input[i] = imageData[i * 4] / 255;
      input[i + 64 * 64] = imageData[i * 4 + 1] / 255;
      input[i + 2 * 64 * 64] = imageData[i * 4 + 2] / 255;
    }

    const tensor = new ort.Tensor("float32", input, [1, 3, 64, 64]);
    const output = await session.run({ input: tensor });
    const embedding = output.embedding.data;

    // Compute similarities
    const sims = Object.entries(embeddings).map(([id, emb]) => ({
      id,
      similarity: cosineSimilarity(embedding, emb),
    }));

    // Sort and take top 3
    sims.sort((a, b) => b.similarity - a.similarity);
    detectedEntities.push(sims[0].id.split("_")[0]);
  }

  return detectedEntities;
}

export async function extractItems(img, blackCanvas, sess, embeddings) {
  // Find p-items label
  const labelLine = extractLines(result).find(({ text }) =>
    text.replaceAll(" ", "").startsWith("Pアイテム")
  );
  if (!labelLine) return [];
  const labelBounds = labelLine.bbox;
  const labelWidth = labelBounds.x1 - labelBounds.x0;
  const labelHeight = labelBounds.y1 - labelBounds.y0;

  // Locate items and calculate width
  const searchAreaTop = {
    x: labelBounds.x0 - labelHeight,
    y: labelBounds.y1,
    width: Math.floor(labelWidth * 4),
    height: labelHeight * 2,
  };
  const searchAreaBottom = {
    x: labelBounds.x0 - labelHeight,
    y: labelBounds.y1 + labelHeight * 4,
    width: Math.floor(labelWidth * 4),
    height: labelHeight * 2,
  };
  const topCoords = locateEntities(
    blackCanvas,
    searchAreaTop,
    Math.floor(labelWidth * 0.3)
  );
  const bottomCoords = locateEntities(
    blackCanvas,
    searchAreaBottom,
    Math.floor(labelWidth * 0.5)
  );
  if (!topCoords.length || !bottomCoords.length) {
    return [];
  }
  const itemWidth = bottomCoords[0].y - topCoords[0].y;

  // Generate item coordinates
  const [x, y] = getGameRegion(img);
  let itemCoords = [];
  for (let coord of bottomCoords) {
    itemCoords.push([x + coord.x - itemWidth * 0.9, y + coord.y - itemWidth]);
  }

  // Identify items
  const plusIndex =
    (Math.round(COMP_SIZE * 0.0625) * COMP_SIZE +
      Math.round(COMP_SIZE * 0.85)) *
    4;
  const detectedItems = await identifyEntities(
    img,
    itemCoords,
    itemWidth,
    // itemImageData,
    plusIndex,
    sess,
    embeddings
  );

  return detectedItems;
}

export async function extractCards(
  img,
  blackCanvas,
  itemsPIdolId,
  sess,
  embeddings
) {
  // Find skill cards label
  const labelLine = extractLines(result).find(({ text }) =>
    text.replaceAll(" ", "").startsWith("スキルカード")
  );
  if (!labelLine) return [];
  const labelBounds = labelLine.bbox;
  const labelWidth = labelBounds.x1 - labelBounds.x0;
  const labelHeight = labelBounds.y1 - labelBounds.y0;

  // Locate cards and calculate width
  const searchArea1Top = {
    x: labelBounds.x0 - labelHeight,
    y: labelBounds.y1,
    width: Math.floor(labelWidth * 5.5),
    height: labelHeight * 2,
  };
  const searchArea1Bottom = {
    x: labelBounds.x0 - labelHeight,
    y: labelBounds.y1 + labelWidth,
    width: Math.floor(labelWidth * 4),
    height: labelHeight * 2,
  };
  const searchArea2Top = {
    x: labelBounds.x0 - labelHeight,
    y: labelBounds.y1 + labelWidth * 1.35,
    width: Math.floor(labelWidth * 5.5),
    height: labelHeight * 2,
  };
  const topCoords1 = locateEntities(
    blackCanvas,
    searchArea1Top,
    Math.floor(labelWidth * 0.7)
  );
  const bottomCoords1 = locateEntities(
    blackCanvas,
    searchArea1Bottom,
    Math.floor(labelWidth * 0.7)
  );
  const topCoords2 = locateEntities(
    blackCanvas,
    searchArea2Top,
    Math.floor(labelWidth * 0.7)
  );
  if (!topCoords1.length || !bottomCoords1.length) {
    return [];
  }
  const cardWidth = bottomCoords1[0].y - topCoords1[0].y;

  // Generate card coordinates 1
  const [x, y] = getGameRegion(img);
  let cardCoords = [];
  for (let coord of topCoords1) {
    cardCoords.push([x + coord.x - cardWidth * 0.935, y + coord.y]);
  }
  for (let coord of topCoords2) {
    cardCoords.push([x + coord.x - cardWidth * 0.935, y + coord.y + 1]);
  }

  // Identify signature card
  const plusIndex =
    (Math.round(COMP_SIZE * 0.4375) * COMP_SIZE +
      Math.round(COMP_SIZE * 0.85)) *
    4;

  const idolId = PIdols.getById(itemsPIdolId)?.idolId || 1;
  const detectedCards = await identifyEntities(
    img,
    cardCoords,
    cardWidth,
    plusIndex,
    sess,
    embeddings
  );
  return detectedCards;
}
