import { SkillCards } from "gakumas-data";

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

export function getBlackCanvas(img) {
  return getPreprocessedCanvas(img, (rgb) => {
    const average = rgb.reduce((acc, cur) => acc + cur, 0) / 3;
    return rgb.every((v) => Math.abs(v - average) < 8 && v < 180);
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
    .replace("願いのカ", "願いの力")
    .replace("新生徒会昌誕", "新生徒会爆誕")
    .replace("出漬", "出演")
    .replace("cutel", "cute!")
    .replace("ウィイ", "ウイ")
    .toLowerCase();

  const allCards = SkillCards.getAll().sort(
    (a, b) => b.name.length - a.name.length
  );
  const detectedCards = allCards.reduce((acc, cur) => {
    const nameToDetect = cur.name
      .replaceAll(" ", "")
      .replaceAll("！", "!")
      .replace("200%", "")
      .replace("♪", "")
      .toLowerCase();
    const index = cleanedText.indexOf(nameToDetect);
    if (index != -1) {
      acc.push(cur.id);
      cleanedText = cleanedText.replace(nameToDetect, "");
    }
    return acc;
  }, []);

  return detectedCards;
}
