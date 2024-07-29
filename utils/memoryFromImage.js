import { Idols, PIdols, PItems, SkillCards } from "gakumas-data";

export function getGameRegion(img) {
  let width = img.width;
  const height = img.height;
  if (img.width > (img.height * 9) / 16) {
    width = Math.round((img.height * 9) / 16);
  }
  return [Math.round((img.width - width) / 2), 0, width, height];
}

// Get a canvas with image black/white filtered
function getPreprocessedCanvas(img, textColorFn) {
  const canvas = document.createElement("canvas");
  const [x, y, width, height] = getGameRegion(img);
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, x, y, width, height, 0, 0, width, height);
  let d = ctx.getImageData(0, 0, width, height);
  for (var i = 0; i < d.data.length; i += 4) {
    if (textColorFn(d.data[i], d.data[i + 1], d.data[i + 2])) {
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
  return getPreprocessedCanvas(img, (r, g, b) => {
    const average = (r + g + b) / 3;
    return (
      [r, g, b].every((v) => Math.abs(v - average) < 8 && v < 185) ||
      (r > 70 && r < 120 && g > 70 && g < 120 && b > 90 && b < 130)
    );
  });
}

// White (contest power text)
export function getWhiteCanvas(img) {
  return getPreprocessedCanvas(img, (r, g, b) =>
    [r, g, b].every((v) => v > 252)
  );
}

// Find y-value of the top of the white section
export function getWhiteAreaTop(img) {
  const canvas = getPreprocessedCanvas(img, (r, g, b) =>
    [r, g, b].every((v) => v > 245)
  );
  const ctx = canvas.getContext("2d");
  const d = ctx.getImageData(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < canvas.height; i++) {
    let whitePixelCount = 0;
    for (let j = 0; j < canvas.width * 4; j += 4) {
      if (d.data[i * canvas.width * 4 + j] == 0) {
        whitePixelCount++;
      }
    }
    if (whitePixelCount > canvas.width * 0.98) {
      return i;
    }
  }
  return 0;
}

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
function countEntities(canvas, searchArea, threshold) {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const d = ctx.getImageData(
    searchArea.x,
    searchArea.y,
    searchArea.width,
    searchArea.height
  );

  let numEntities = 0;
  let consecutivePixels = 0;
  for (let i = 0; i < searchArea.height; i++) {
    for (let j = 0; j < searchArea.width; j++) {
      const dIndex = (i * searchArea.width + j) * 4;
      // Check if pixel is black
      if (d.data[dIndex] == 0) {
        consecutivePixels++;
      } else {
        // If we have enough consecutive pixels, increment detected entities
        if (consecutivePixels > threshold) {
          numEntities++;
        }
        consecutivePixels = 0;
      }
    }
    if (numEntities) break;
  }

  return numEntities;
}

// Compare detected areas with item/card icons to find most similar
function identifyEntities(img, coords, width, entityData) {
  const memCanvas = document.createElement("canvas");
  memCanvas.width = COMP_SIZE;
  memCanvas.height = COMP_SIZE;
  const memCtx = memCanvas.getContext("2d");

  const detectedEntities = [];
  for (let index in coords) {
    const [x, y] = coords[index];
    memCtx.drawImage(img, x, y, width, width, ...DRAW_AREA);
    const d = memCtx.getImageData(...COMP_AREA);

    const filtered = entityData.filter(
      (entity) => !(index > 0 && entity.pIdolId)
    );

    const diffScores = filtered.map((entity) => ({
      id: entity.id,
      name: entity.name,
      // Sum color difference of each pixel
      score: entity.data.reduce(
        (sum, _, i) =>
          sum +
          (i % 4
            ? 0
            : deltaEFast(
                d.data[i],
                entity.data[i],
                d.data[i + 1],
                entity.data[i + 1],
                d.data[i + 2],
                entity.data[i + 2]
              )),
        0
      ),
    }));

    const sorted = diffScores.sort((a, b) => a.score - b.score);

    detectedEntities.push(sorted[0].id);
  }

  return detectedEntities;
}

export function extractItems(img, blackCanvas, itemImageData) {
  // Determine number of items
  const [x, _, width] = getGameRegion(img);
  const whiteTop = getWhiteAreaTop(img);
  const searchArea = {
    x: Math.round(width * 0.07),
    y: whiteTop + Math.round(width * 0.6167),
    width: Math.round(width * 0.86),
    height: 8,
  };
  const numItems = countEntities(
    blackCanvas,
    searchArea,
    Math.floor(width * 0.05)
  );

  // Generate item coordinates
  let itemCoords = [];
  for (let i = 0; i < numItems; i++) {
    itemCoords.push([
      x + Math.round(width * 0.07) + Math.round(width * 0.137) * i,
      whiteTop + Math.round(width * 0.5),
    ]);
  }

  // Identify items
  const detectedItems = identifyEntities(
    img,
    itemCoords,
    Math.round(width * 0.1185),
    itemImageData
  );

  return detectedItems;
}

export function extractCards(
  img,
  blackCanvas,
  signatureSkillCardsImageData,
  nonSignatureSkillCardsImageData,
  itemsPIdolId
) {
  // Determine number of items
  const [x, _, width] = getGameRegion(img);
  const whiteTop = getWhiteAreaTop(img);
  const searchArea = {
    x: Math.round(width * 0.07),
    y: whiteTop + Math.round(width * 0.718),
    width: Math.round(width * 0.86),
    height: 16,
  };
  const numCards1 = countEntities(
    blackCanvas,
    searchArea,
    Math.floor(width * 0.12)
  );
  const searchArea2 = {
    x: Math.round(width * 0.07),
    y: whiteTop + Math.round(width * 0.9725),
    width: Math.round(width * 0.86),
    height: 16,
  };
  const numCards2 = countEntities(
    blackCanvas,
    searchArea2,
    Math.floor(width * 0.12)
  );

  // Generate card coordinates
  let cardCoords = [];
  for (let i = 0; i < numCards1; i++) {
    cardCoords.push([
      x + Math.round(width * 0.07) + Math.round(width * 0.218) * i,
      whiteTop + Math.round(width * 0.718),
    ]);
  }
  for (let j = 0; j < numCards2; j++) {
    cardCoords.push([
      x + Math.round(width * 0.07) + Math.round(width * 0.218) * j,
      whiteTop + Math.round(width * 0.9725),
    ]);
  }

  if (!cardCoords.length) {
    return [];
  }

  // Identify signature card
  const detectedSignatureCard = identifyEntities(
    img,
    [cardCoords[0]],
    Math.round(width * 0.2),
    signatureSkillCardsImageData
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
      Math.round(width * 0.2),
      nonSignatureSkillCardsImageData[idolId]
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
      )
    );
    return detectedCards;
  }
}

// Euclidean distance between colors
function deltaEFast(r1, r2, g1, g2, b1, b2) {
  return Math.sqrt(
    Math.pow(r2 - r1, 2) + Math.pow(g2 - g1, 2) + Math.pow(b2 - b1, 2)
  );
}
