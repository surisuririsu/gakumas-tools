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

export async function getMemoryFromFile(
  file,
  engWorker,
  jpnWorker,
  entityImageData
) {
  const img = await loadImageFromFile(file);

  const blackCanvas = getBlackCanvas(img);
  const whiteCanvas = getWhiteCanvas(img);

  const engWhitePromise = engWorker.recognize(whiteCanvas);
  const engBlackPromise = engWorker.recognize(blackCanvas);
  const jpnBlackPromise = jpnWorker.recognize(
    blackCanvas,
    {},
    { blocks: true }
  );

  const powerCandidates = extractPower(await engWhitePromise);
  const params = extractParams(await engBlackPromise);

  const items = extractItems(
    await jpnBlackPromise,
    img,
    blackCanvas,
    entityImageData.pItems
  );
  const itemsPIdolId = items
    .filter((c) => !!c)
    .map(PItems.getById)
    .find((item) => item.pIdolId)?.pIdolId;

  const cards = extractCards(
    await jpnBlackPromise,
    img,
    blackCanvas,
    entityImageData.signatureSkillCards,
    entityImageData.nonSignatureSkillCards,
    itemsPIdolId
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

// Read Vo, Da, Vi, stamina from OCR result
const PARAMS_REGEXP = new RegExp(/^\s*\d+\s+\d+\s+\d+\s+\d+\s*$/gm);
const WS_REGEXP = new RegExp(/\s+/);
export function extractParams(result) {
  const paramsLine = result.data.text.match(PARAMS_REGEXP);
  if (!paramsLine) return [null, null, null, null];
  const params = paramsLine[0]
    .trim()
    .split(WS_REGEXP)
    .map((t) => parseInt(t, 10));
  return params;
}

// Get image data for items/cards
export async function getEntityImageData(entityData, idolId) {
  const entCanvas = new OffscreenCanvas(COMP_SIZE, COMP_SIZE);
  const entCtx = entCanvas.getContext("2d");

  const data = await Promise.all(
    entityData.map(
      (entity) =>
        new Promise((resolve) => {
          const entImg = new Image();
          const icon = gkImg(entity, idolId)._icon;
          entImg.src = getImageProps({
            ...icon,
            width: COMP_SIZE,
            height: COMP_SIZE,
          }).props.src;
          entImg.onload = async () => {
            entCtx.drawImage(entImg, ...DRAW_AREA);
            resolve({
              id: entity.id,
              name: entity.name,
              pIdolId: entity.pIdolId,
              data: entCtx.getImageData(...COMP_AREA).data,
            });
          };
        })
    )
  );

  return { idolId, data };
}

// Only skill cards from p-idol
export async function getSignatureSkillCardsImageData() {
  return (
    await getEntityImageData(
      SkillCards.getFiltered({
        rarities: ["R", "SR", "SSR"],
        modes: ["stage"],
        sourceTypes: ["pIdol"],
      })
    )
  ).data;
}

// Skill cards not from pIdol
export async function getNonSignatureSkillCardsImageData() {
  return await Promise.all(
    Idols.getAll().map(({ id }) =>
      getEntityImageData(
        SkillCards.getFiltered({
          rarities: ["R", "SR", "SSR"],
          sourceTypes: ["produce", "support"],
        }),
        id
      )
    )
  ).then((res) =>
    res.reduce((acc, cur) => {
      acc[cur.idolId] = cur.data;
      return acc;
    }, {})
  );
}

// P-items
export async function getPItemsImageData() {
  return (
    await getEntityImageData(
      PItems.getFiltered({
        rarities: ["R", "SR", "SSR"],
        modes: ["stage"],
        sourceTypes: ["support", "pIdol"],
      })
    )
  ).data;
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

// Compare detected areas with item/card icons to find most similar
function identifyEntities(img, coords, width, entityData, plusIndex) {
  const memCanvas = new OffscreenCanvas(COMP_SIZE, COMP_SIZE);
  const memCtx = memCanvas.getContext("2d");

  const detectedEntities = [];
  for (let index in coords) {
    const [x, y] = coords[index];
    memCtx.drawImage(img, x, y, width, width, ...DRAW_AREA);
    const d = memCtx.getImageData(...COMP_AREA);

    if (DEBUG) {
      const nc = document.createElement("canvas");
      nc.width = width;
      nc.height = width;
      const nctx = nc.getContext("2d");
      nctx.drawImage(img, x, y, width, width, ...DRAW_AREA);
      document.body.append(nc);
    }

    const filtered = entityData.filter(
      (entity) => !(index > 0 && entity.pIdolId)
    );

    const diffScores = filtered.map((entity) => ({
      id: entity.id,
      name: entity.name,
      // Sum color difference of each pixel
      score: entity.data.reduce((sum, _, i) => {
        if (i % 4) return sum;
        return (
          dColor(
            d.data[i],
            entity.data[i],
            d.data[i + 1],
            entity.data[i + 1],
            d.data[i + 2],
            entity.data[i + 2]
          ) + sum
        );
      }, 0),
    }));

    const sorted = diffScores.sort((a, b) => a.score - b.score);

    // Heuristic to detect upgraded vs non-upgraded to be more stable
    const pd = memCtx.getImageData(...DRAW_AREA);
    const upgraded =
      pd.data[plusIndex] > 200 &&
      pd.data[plusIndex + 1] < 150 &&
      pd.data[plusIndex + 2] > 50 &&
      pd.data[plusIndex + 2] < 150;

    if (sorted[0].name.startsWith(sorted[1].name)) {
      detectedEntities.push(upgraded ? sorted[0].id : sorted[1].id);
    } else if (sorted[1].name.startsWith(sorted[0].name)) {
      detectedEntities.push(upgraded ? sorted[1].id : sorted[0].id);
    } else {
      detectedEntities.push(sorted[0].id);
    }
  }

  return detectedEntities;
}

export function extractItems(result, img, blackCanvas, itemImageData) {
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
  const detectedItems = identifyEntities(
    img,
    itemCoords,
    itemWidth,
    itemImageData,
    plusIndex
  );

  return detectedItems;
}

export function extractCards(
  result,
  img,
  blackCanvas,
  signatureSkillCardsImageData,
  nonSignatureSkillCardsImageData,
  itemsPIdolId
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
  const detectedSignatureCard = identifyEntities(
    img,
    [cardCoords[0]],
    cardWidth,
    signatureSkillCardsImageData,
    plusIndex
  )[0];

  // Identify the rest of the cards
  // Card icons differ depending on the idol, so we determine the idol first
  // If we can't identify the idol from the signature card, try to get it from the items
  if (detectedSignatureCard) {
    const pIdolId = SkillCards.getById(detectedSignatureCard).pIdolId;
    const idolId = PIdols.getById(pIdolId).idolId;
    const detectedNonSignatureCards = identifyEntities(
      img,
      cardCoords.slice(1),
      cardWidth,
      nonSignatureSkillCardsImageData[idolId],
      plusIndex
    );
    return [detectedSignatureCard, ...detectedNonSignatureCards];
  } else {
    const idolId = PIdols.getById(itemsPIdolId)?.idolId || 1;
    const detectedCards = identifyEntities(
      img,
      cardCoords,
      cardWidth,
      signatureSkillCardsImageData.concat(
        nonSignatureSkillCardsImageData[idolId]
      ),
      plusIndex
    );
    return detectedCards;
  }
}

// Euclidean distance between colors
function dColor(r1, r2, g1, g2, b1, b2) {
  return Math.sqrt(
    Math.pow(r2 - r1, 2) + Math.pow(g2 - g1, 2) + Math.pow(b2 - b1, 2)
  );
}
