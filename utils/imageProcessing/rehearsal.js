export function extractScores(result) {
  let scores = [];

  for (let i in result.data.lines) {
    const line = result.data.lines[i];
    if (line.confidence < 60) continue;
    if (line.words.length < 2) continue;
    if (!line.words.every((word) => /^((\d+,)?\d+|[—\-]+)$/.test(word.text)))
      continue;

    const stageScores = line.words.map(
      (word) => parseInt(word.text.replaceAll(/[^\d]/g, ""), 10) || ""
    );

    scores.push(stageScores.concat(Array(3).fill("")).slice(0, 3));
  }

  return scores;
}
