import { PItems, SkillCards } from "gakumas-data";

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

// export function getCardCanvas(img) {
//   return getPreprocessedCanvas(img, (rgb) => {
//     // const average = rgb.reduce((acc, cur) => acc + cur, 0) / 3;
//     const [r, g, b] = rgb;
//     return r > 70 && r < 100 && g > 76 && g < 106 && b > 93 && b < 123;
//   });
// }

export function getBlackCanvas(img) {
  return getPreprocessedCanvas(img, (rgb) => {
    const average = rgb.reduce((acc, cur) => acc + cur, 0) / 3;
    const [r, g, b] = rgb;
    return (
      rgb.every((v) => Math.abs(v - average) < 8 && v < 180) ||
      (r > 70 && r < 100 && g > 76 && g < 106 && b > 93 && b < 123)
    );
  });
}

export function getWhiteCanvas(img) {
  return getPreprocessedCanvas(img, (rgb) => rgb.every((v) => v > 250));
}

export function extractPower(result) {
  const powerLines = result.data.text.match(/\s*\d+\s*/gm);
  const powerCandidates = powerLines.map((p) => parseInt(p, 10));
  return powerCandidates;
}

export function extractParams(result) {
  const paramsLine = result.data.text.match(/^\s*\d+\s+\d+\s+\d+\s+\d+\s*$/gm);
  const params = paramsLine[0].split(/\s+/).map((t) => parseInt(t, 10));
  return params;
}

export function extractCards(result) {
  // That's a lot of edge cases...
  let cleanedText = result.data.text
    .replace(/\s+/g, "")
    .replaceAll("!", "")
    .replace("願いのカ", "願いの力")
    .replace("新生徒会昌誕", "新生徒会爆誕")
    .replace("出漬", "出演")
    .replace("cutel", "cute")
    .replace("ウィイ", "ウイ")
    .toLowerCase();

  const allCards = SkillCards.getAll().sort(
    (a, b) => b.name.length - a.name.length
  );
  const detectedCards = allCards
    .reduce((acc, cur) => {
      const nameToDetect = cur.name
        .replaceAll(" ", "")
        .replaceAll("！", "")
        .replaceAll("!", "")
        .replace("200%", "")
        .replace("♪", "")
        .toLowerCase();
      const index = cleanedText.indexOf(nameToDetect);
      if (index != -1) {
        acc.push({ id: cur.id, index });
        cleanedText = cleanedText.replace(nameToDetect, "");
      }
      return acc;
    }, [])
    .sort((a, b) => b.index > a.index);

  return detectedCards.map((c) => c.id);
}

const COMP_SIZE = 24;
const DRAW_AREA = [0, 0, COMP_SIZE, COMP_SIZE];
const COMP_AREA = [2, 2, COMP_SIZE - 4, COMP_SIZE - 4];

export async function getEntityImageData(entityData) {
  return await Promise.all(
    entityData.getAll().map(
      ({ id, name, icon }) =>
        new Promise((resolve, reject) => {
          const entCanvas = document.createElement("canvas");
          const entCtx = entCanvas.getContext("2d");
          const entImg = new Image();
          entImg.src = icon.src;
          entImg.onload = async () => {
            entCtx.drawImage(entImg, ...DRAW_AREA);
            resolve({
              id,
              name,
              data: entCtx.getImageData(...COMP_AREA).data,
            });
          };
        })
    )
  );
}

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
      if (d.data.slice(dIndex, dIndex + 3).every((v) => v == 0)) {
        consecutivePixels++;
      } else {
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

function identifyEntities(img, coords, width, entityData, plusIndex) {
  const memCanvas = document.createElement("canvas");
  memCanvas.width = COMP_SIZE;
  memCanvas.height = COMP_SIZE;
  const memCtx = memCanvas.getContext("2d");
  document.body.append(memCanvas);

  const detectedEntities = [];
  for (let [x, y] of coords) {
    memCtx.drawImage(img, x, y, width, width, ...DRAW_AREA);
    const d = memCtx.getImageData(...COMP_AREA);
    const diffScores = entityData.map((entity) => ({
      id: entity.id,
      name: entity.name,
      score: entity.data.reduce(
        (sum, _, i) =>
          sum +
          (i % 4
            ? 0
            : deltaE(d.data.slice(i, i + 3), entity.data.slice(i, i + 3))),
        0
      ),
    }));

    // Hint whether upgraded based on pixel color
    const pd = memCtx.getImageData(...DRAW_AREA);
    const upgraded =
      pd.data[plusIndex] > 200 &&
      pd.data[plusIndex + 1] < 150 &&
      pd.data[plusIndex + 2] > 50 &&
      pd.data[plusIndex + 2] < 150;

    const sorted = diffScores.sort((a, b) => a.score - b.score);

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

export function extractCards2(result, img, blackCanvas, cardImageData) {
  // Find skill cards label
  const labelLine = result.data.lines.find(({ text }) =>
    text.replaceAll(" ", "").startsWith("スキルカード")
  );
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
  const [cardCoords, cardWidth] = searchCanvas(
    blackCanvas,
    searchArea,
    labelWidth / 2,
    false
  );
  // const blackCtx = blackCanvas.getContext("2d", { willReadFrequently: true });
  // const d = blackCtx.getImageData(
  //   searchArea.x,
  //   searchArea.y,
  //   searchArea.width,
  //   searchArea.height
  // );

  // const nc = document.createElement("canvas");
  // const nctx = nc.getContext("2d");
  // nctx.drawImage(
  //   blackCanvas,
  //   searchArea.x,
  //   searchArea.y,
  //   searchArea.width,
  //   searchArea.height,
  //   0,
  //   0,
  //   searchArea.width,
  //   searchArea.height
  // );
  // document.body.append(nc);

  // let cardCoords = [];
  // let cardWidth = 0;
  // let consecutivePixels = 0;
  // for (let i = 0; i < searchArea.height; i++) {
  //   for (let j = 0; j < searchArea.width; j++) {
  //     const dIndex = (i * searchArea.width + j) * 4;
  //     if (d.data.slice(dIndex, dIndex + 3).every((v) => v == 0)) {
  //       consecutivePixels++;
  //     } else {
  //       if (consecutivePixels > labelWidth / 2) {
  //         cardWidth = Math.round(consecutivePixels / 0.825);
  //         cardCoords.push([
  //           searchArea.x + Math.round(j - cardWidth * 0.08) - consecutivePixels,
  //           searchArea.y + i + Math.round(cardWidth / 100) - cardWidth,
  //         ]);
  //       }
  //       consecutivePixels = 0;
  //     }
  //   }
  //   if (cardCoords.length) break;
  // }

  console.log(cardCoords, cardWidth);

  // const searchArea2 = {
  //   x: labelBounds.x0 - labelHeight,
  //   y: labelBounds.y1 + cardWidth * 1.3,
  //   width: Math.floor(labelWidth * 4.75),
  //   height: labelHeight,
  // };
  // nctx.drawImage(
  //   blackCanvas,
  //   searchArea2.x,
  //   searchArea2.y,
  //   searchArea2.width,
  //   searchArea2.height,
  //   0,
  //   0,
  //   searchArea2.width,
  //   searchArea2.height
  // );
  // const d2 = blackCtx.getImageData(
  //   searchArea2.x,
  //   searchArea2.y,
  //   searchArea2.width,
  //   searchArea2.height
  // );
  // let cardCoords2 = [];
  // consecutivePixels = 0;
  // for (let i = 0; i < searchArea2.height; i++) {
  //   for (let j = 0; j < searchArea2.width; j++) {
  //     const dIndex = (i * searchArea2.width + j) * 4;
  //     if (d2.data.slice(dIndex, dIndex + 3).every((v) => v == 0)) {
  //       consecutivePixels++;
  //     } else {
  //       if (consecutivePixels > labelWidth / 2) {
  //         cardWidth = Math.round(consecutivePixels / 0.825);
  //         cardCoords2.push([
  //           searchArea2.x +
  //             Math.round(j - cardWidth * 0.08) -
  //             consecutivePixels,
  //           searchArea2.y + i + Math.round(cardWidth / 100) - cardWidth,
  //         ]);
  //       }
  //       consecutivePixels = 0;
  //     }
  //   }
  //   if (cardCoords2.length) break;
  // }
  // console.log(cardCoords.concat(cardCoords2));

  // Classify items
  const memCanvas = document.createElement("canvas");
  memCanvas.width = COMP_SIZE;
  memCanvas.height = COMP_SIZE;
  const memCtx = memCanvas.getContext("2d");

  const detectedItems = [];
  for (let coords of itemCoords) {
    memCtx.drawImage(
      img,
      coords[0],
      coords[1],
      itemWidth,
      itemWidth,
      ...DRAW_AREA
    );
    const d = memCtx.getImageData(...COMP_AREA);
    const itemDiffScores = itemImageData.map((item) => ({
      id: item.id,
      name: item.name,
      score: item.data.reduce(
        (sum, _, i) =>
          sum +
          (i % 4
            ? 0
            : deltaE(d.data.slice(i, i + 3), item.data.slice(i, i + 3))),
        0
      ),
    }));

    // Hint whether upgraded based on pixel color
    const plusIndex =
      (Math.round(COMP_SIZE * 0.08) * COMP_SIZE +
        Math.round(COMP_SIZE * 0.85)) *
      4;
    const pd = memCtx.getImageData(...DRAW_AREA);
    const upgraded =
      pd.data[plusIndex] > 200 &&
      pd.data[plusIndex + 1] < 150 &&
      pd.data[plusIndex + 2] > 50 &&
      pd.data[plusIndex + 2] < 150;

    const sortedItems = itemDiffScores.sort((a, b) => a.score - b.score);

    if (sortedItems[0].name.startsWith(sortedItems[1].name)) {
      detectedItems.push(upgraded ? sortedItems[0].id : sortedItems[1].id);
    } else if (sortedItems[1].name.startsWith(sortedItems[0].name)) {
      detectedItems.push(upgraded ? sortedItems[1].id : sortedItems[0].id);
    } else {
      detectedItems.push(sortedItems[0].id);
    }
  }

  return detectedItems;
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
