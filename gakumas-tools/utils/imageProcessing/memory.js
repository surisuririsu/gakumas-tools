import { PItems, SkillCards } from "gakumas-data";
import * as ort from "onnxruntime-web";
import {
  DEBUG,
  getBlackCanvas,
  getWhiteCanvas,
  loadImageFromFile,
  extractLines,
} from "./common";
import {
  getPItemBoundingBoxes,
  getSkillCardBoundingBoxes,
} from "./memoryGeometry";
import { calculateContestPower } from "../contestPower";

const PARAMS_REGEXP = new RegExp(/^\s*\d+\s+\d+\s+\d+\s+\d+\s*$/gm);

export async function getMemoryFromFile(
  file,
  engWorker,
  pItemSession,
  pItemClasses,
  skillCardSession,
  skillCardClasses
) {
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
  if (!paramsLine || !pItemsLabelLine) {
    throw new Error(
      "Could not locate the Vo/Da/Vi/stamina parameter line. Is this a memory screenshot?",
    );
  }

  const contentWidth = paramsLine.bbox.x1 - pItemsLabelLine.bbox.x0;
  const anchorPoint = {
    x: pItemsLabelLine.bbox.x0,
    y: pItemsLabelLine.bbox.y1,
  };

  const pItemBoxes = getPItemBoundingBoxes(anchorPoint, contentWidth);
  const skillCardBoxes = getSkillCardBoundingBoxes(anchorPoint, contentWidth);

  // Draw boxes for debugging
  if (DEBUG) {
    debugBoundingBoxes(img, [
      {
        x: paramsLine.bbox.x0,
        y: paramsLine.bbox.y0,
        width: paramsLine.bbox.x1 - paramsLine.bbox.x0,
        height: paramsLine.bbox.y1 - paramsLine.bbox.y0,
      },
      ...pItemBoxes,
      ...skillCardBoxes,
    ]);
  }

  const params = extractParams(paramsLine);
  const pItems = await extractEntities(
    img,
    pItemBoxes,
    pItemSession,
    pItemClasses
  );
  const skillCards = await extractEntities(
    img,
    skillCardBoxes,
    skillCardSession,
    skillCardClasses
  );

  console.log(
    "Extracted p-items:",
    pItems.map((id) => PItems.getById(id)?.name || id)
  );
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
    customizations: [{}, {}, {}, {}, {}, {}],
  };
}

function debugBoundingBoxes(img, boxes) {
  const debugCanvas = document.createElement("canvas");
  debugCanvas.width = img.width;
  debugCanvas.height = img.height;
  const debugCtx = debugCanvas.getContext("2d");
  debugCtx.drawImage(img, 0, 0);
  debugCtx.strokeStyle = "red";
  debugCtx.lineWidth = 2;
  boxes.forEach((box) => {
    debugCtx.strokeRect(box.x, box.y, box.width, box.height);
  });
  document.body.append(debugCanvas);
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

export async function extractEntities(img, boxes, session, classes) {
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
    const logits = output.classifier.data;
    const predictedClass = logits.indexOf(Math.max(...logits));
    const entityId = classes[predictedClass].split("_")[0];
    entityIds.push(entityId === "0" ? 0 : parseInt(entityId, 10));
  }

  return entityIds;
}
