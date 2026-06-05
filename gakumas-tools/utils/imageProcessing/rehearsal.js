import { extractLines, getWhiteCanvas, loadImageFromFile } from "./common";

const NUMERIC_LINE_REGEX = /^[\d\s,.—-]+$/;
const SCORE_TOKEN_REGEX = /\d{1,3}(?:[,.]\d{3})*|[—-]+/g;
const OCR_MIN_WIDTH = 1200;

function getOcrScale(img) {
  return img.width < OCR_MIN_WIDTH ? 2 : 1;
}

export async function getScoresFromFile(file, worker) {
  const img = await loadImageFromFile(file);
  const whiteCanvas = getWhiteCanvas(img, 190, getOcrScale(img));
  const engWhitePromise = worker.recognize(whiteCanvas, {}, { blocks: true });
  const scores = extractScores(await engWhitePromise);
  return scores;
}

export async function getScoresFromImage(img, worker) {
  const whiteCanvas = getWhiteCanvas(img, 160, getOcrScale(img));
  const result = await worker.recognize(whiteCanvas, {}, { blocks: true });
  const scores = extractScores(result);
  return scores;
}

export function extractScores(result) {
  let scores = [];

  const lines = extractLines(result);
  for (let i in lines) {
    const line = lines[i];
    if (line.confidence < 60) continue;

    if (!NUMERIC_LINE_REGEX.test(line.text)) continue;
    const words = line.text.match(SCORE_TOKEN_REGEX) ?? [];
    if (words.length != 3) continue;

    const stageScores = words.map(
      (word) => parseInt(word.replaceAll(/[^\d]/g, ""), 10) || "",
    );

    scores.push(stageScores);

    if (scores.length == 3) break;
  }

  return scores;
}
