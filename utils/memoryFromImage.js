import { Idols, PIdols, PItems, SkillCards } from "gakumas-data";

// Get a canvas with image black/white filtered
function getPreprocessedCanvas(img, textColorFn) {
  const canvas = document.createElement("canvas");
  const width = (canvas.width = img.width);
  const height = (canvas.height = img.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, width, height);

  let d = ctx.getImageData(0, 0, width, height);
  for (var i = 0; i < d.data.length; i += 4) {
    if (textColorFn(d.data.slice(i, i + 3))) {
      d.data[i] = d.data[i + 1] = d.data[i + 2] = 0;
    } else {
      d.data[i] = d.data[i + 1] = d.data[i + 2] = 255;
    }
  }
  ctx.putImageData(d, 0, 0);

  return canvas;
}

// Black or entity edge color
export function getBlackCanvas(img) {
  return getPreprocessedCanvas(img, (rgb) => {
    const [r, g, b] = rgb;
    const average = (r + g + b) / 3;
    return (
      rgb.every((v) => Math.abs(v - average) < 8 && v < 180) ||
      (r > 70 && r < 100 && g > 76 && g < 106 && b > 93 && b < 123)
    );
  });
}

// White (contest power text)
export function getWhiteCanvas(img) {
  return getPreprocessedCanvas(img, (rgb) => rgb.every((v) => v > 252));
}

// Read contest power from OCR result
export function extractPower(result) {
  const powerLines = result.data.text.match(/\s*\d+\s*/gm) || [];
  const powerCandidates = powerLines.map((p) => parseInt(p, 10));
  return powerCandidates;
}

// Read Vo, Da, Vi, stamina from OCR result
export function extractParams(result) {
  const paramsLine = result.data.text.match(/^\s*\d+\s+\d+\s+\d+\s+\d+\s*$/gm);
  if (!paramsLine) return [null, null, null, null];
  const params = paramsLine[0].split(/\s+/).map((t) => parseInt(t, 10));
  return params;
}

// Size and bounds of images to compare
// Downsize images to sample surrounding colors
const COMP_SIZE = 32;
const DRAW_AREA = [0, 0, COMP_SIZE, COMP_SIZE];
const COMP_AREA = [2, 2, COMP_SIZE - 4, COMP_SIZE - 4];

// Get image data for items/cards
export async function getEntityImageData(entityData, idolId) {
  const data = await Promise.all(
    entityData.map(
      (entity) =>
        new Promise((resolve) => {
          const entCanvas = document.createElement("canvas");
          const entCtx = entCanvas.getContext("2d");
          const entImg = new Image();
          entImg.src = idolId
            ? entity.getDynamicIcon(idolId).src
            : entity.icon.src;
          entImg.onload = async () => {
            entCtx.drawImage(entImg, ...DRAW_AREA);
            resolve({
              id: entity.id,
              name: entity.name,
              idolId: idolId,
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

// Items
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
function searchCanvas(canvas, searchArea, threshold) {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const d = ctx.getImageData(
    searchArea.x,
    searchArea.y,
    searchArea.width,
    searchArea.height
  );

  let coords = [];
  let width = 0;
  let consecutivePixels = 0;
  for (let i = 0; i < searchArea.height; i++) {
    for (let j = 0; j < searchArea.width; j++) {
      const dIndex = (i * searchArea.width + j) * 4;
      // Check if pixel is black
      if (d.data.slice(dIndex, dIndex + 3).every((v) => v == 0)) {
        consecutivePixels++;
      } else {
        // If we have enough consecutive pixels, add this as a detected entity
        if (consecutivePixels > threshold) {
          width = consecutivePixels;
          coords.push([searchArea.x + j, searchArea.y + i]);
        }
        consecutivePixels = 0;
      }
    }
    if (coords.length) break;
  }

  return [coords, width];
}

// Compare detected areas with item/card icons to find most similar
function identifyEntities(img, coords, width, entityData, plusIndex) {
  const memCanvas = document.createElement("canvas");
  memCanvas.width = COMP_SIZE;
  memCanvas.height = COMP_SIZE;
  const memCtx = memCanvas.getContext("2d");

  const detectedEntities = [];
  for (let index in coords) {
    const [x, y] = coords[index];
    memCtx.drawImage(img, x, y, width, width, ...DRAW_AREA);
    const d = memCtx.getImageData(...COMP_AREA);
    const diffScores = entityData
      .filter((entity) => !(index > 0 && entity.pIdolId))
      .map((entity) => ({
        id: entity.id,
        name: entity.name,
        // Sum color difference of each pixel
        score: entity.data.reduce(
          (sum, _, i) =>
            sum +
            (i % 4
              ? 0
              : deltaE(d.data.slice(i, i + 3), entity.data.slice(i, i + 3))),
          0
        ),
      }));

    const sorted = diffScores.sort((a, b) => a.score - b.score);
    console.log(sorted.slice(0, 3).map((s) => [s.name, s.score]));

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
  // Find P-Items label
  const labelLine = result.data.lines.find(({ text }) =>
    text.replaceAll(" ", "").startsWith("Pアイテム")
  );
  if (!labelLine) return [];
  const labelBounds = labelLine.bbox;
  const labelWidth = labelBounds.x1 - labelBounds.x0;
  const labelHeight = labelBounds.y1 - labelBounds.y0;

  // Find coordinates of items
  const searchArea = {
    x: labelBounds.x0 - labelHeight,
    y: labelBounds.y1 + labelWidth * 0.9,
    width: Math.floor(labelWidth * 3.2),
    height: labelHeight,
  };
  let [itemCoords, itemWidth] = searchCanvas(
    blackCanvas,
    searchArea,
    labelWidth / 2
  );
  if (!itemCoords) return [];
  itemWidth = Math.round(itemWidth / 0.825);
  itemCoords = itemCoords.map(([x, y]) => [
    x - Math.round(itemWidth * 0.08) - itemWidth * 0.825,
    y - Math.round(itemWidth / 100) - itemWidth,
  ]);

  // Identify items
  const plusIndex =
    (Math.round(COMP_SIZE * 0.08) * COMP_SIZE + Math.round(COMP_SIZE * 0.85)) *
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
  const labelLine = result.data.lines.find(({ text }) =>
    text.replaceAll(" ", "").startsWith("スキルカード")
  );
  if (!labelLine) return [];
  const labelBounds = labelLine.bbox;
  const labelWidth = labelBounds.x1 - labelBounds.x0;
  const labelHeight = labelBounds.y1 - labelBounds.y0;

  // Find coordinates of skill cards
  let searchArea = {
    x: labelBounds.x0 - labelHeight,
    y: labelBounds.y1 + labelHeight * 0.5,
    width: Math.floor(labelWidth * 4.75),
    height: labelHeight,
  };
  let [cardCoords, cardWidth] = searchCanvas(
    blackCanvas,
    searchArea,
    labelWidth / 2,
    false
  );
  if (!cardCoords) return [];
  cardWidth = Math.round(cardWidth / 0.88);
  cardCoords = cardCoords.map(([x, y]) => [
    Math.round(x - cardWidth * 0.94),
    y,
  ]);

  // Find coordinates of cards in second row
  const searchArea2 = {
    x: labelBounds.x0 - labelHeight,
    y: labelBounds.y1 + cardWidth * 1.3,
    width: Math.floor(labelWidth * 4.75),
    height: labelHeight,
  };
  let [cardCoords2, _] = searchCanvas(blackCanvas, searchArea2, labelWidth / 2);
  cardCoords2 = cardCoords2.map(([x, y]) => [
    Math.round(x - cardWidth * 0.94),
    y,
  ]);
  cardCoords = cardCoords.concat(cardCoords2);

  // Identify signature card
  const plusIndex =
    (Math.round(COMP_SIZE * 0.45) * COMP_SIZE + Math.round(COMP_SIZE * 0.875)) *
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
    return identifyEntities(
      img,
      cardCoords,
      cardWidth,
      signatureSkillCardsImageData.concat(
        nonSignatureSkillCardsImageData[idolId]
      ),
      plusIndex
    );
  }
}

// Calculate color similarity
// Source: https://stackoverflow.com/a/52453462

function deltaE(rgbA, rgbB) {
  let labA = rgb2lab(rgbA);
  let labB = rgb2lab(rgbB);
  let deltaL = labA[0] - labB[0];
  let deltaA = labA[1] - labB[1];
  let deltaB = labA[2] - labB[2];
  let c1 = Math.sqrt(labA[1] * labA[1] + labA[2] * labA[2]);
  let c2 = Math.sqrt(labB[1] * labB[1] + labB[2] * labB[2]);
  let deltaC = c1 - c2;
  let deltaH = deltaA * deltaA + deltaB * deltaB - deltaC * deltaC;
  deltaH = deltaH < 0 ? 0 : Math.sqrt(deltaH);
  let sc = 1.0 + 0.045 * c1;
  let sh = 1.0 + 0.015 * c1;
  let deltaLKlsl = deltaL / 1.0;
  let deltaCkcsc = deltaC / sc;
  let deltaHkhsh = deltaH / sh;
  let i =
    deltaLKlsl * deltaLKlsl + deltaCkcsc * deltaCkcsc + deltaHkhsh * deltaHkhsh;
  return i < 0 ? 0 : Math.sqrt(i);
}

function rgb2lab(rgb) {
  let r = rgb[0] / 255,
    g = rgb[1] / 255,
    b = rgb[2] / 255,
    x,
    y,
    z;
  r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
  g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
  b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;
  x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
  y = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 1.0;
  z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;
  x = x > 0.008856 ? Math.pow(x, 1 / 3) : 7.787 * x + 16 / 116;
  y = y > 0.008856 ? Math.pow(y, 1 / 3) : 7.787 * y + 16 / 116;
  z = z > 0.008856 ? Math.pow(z, 1 / 3) : 7.787 * z + 16 / 116;
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}
