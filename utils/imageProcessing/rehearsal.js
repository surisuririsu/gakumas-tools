import { getWhiteCanvas, loadImageFromFile } from "./common";

export async function getScoresFromFile(file, worker) {
  const img = await loadImageFromFile(file);
  const whiteCanvas = getWhiteCanvas(img, 190);
  const engWhitePromise = worker.recognize(whiteCanvas);
  const scores = extractScores(await engWhitePromise);
  return scores;
}

export function extractScores(result) {
  let scores = [];

  for (let i in result.data.lines) {
    const line = result.data.lines[i];
    if (line.confidence < 60) continue;

    let words = line.words
      .map((word) => word.text)
      .filter((word) => /^((\d+[,\.])?\d+|[—\-]+)$/.test(word));
    if (words.length != 3) continue;

    const stageScores = words.map(
      (word) => parseInt(word.replaceAll(/[^\d]/g, ""), 10) || ""
    );

    scores.push(stageScores);

    if (scores.length == 3) break;
  }

  return scores;
}
