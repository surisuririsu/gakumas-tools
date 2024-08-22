export function extractScores(result) {
  let scores = [];

  for (let i in result.data.lines) {
    const line = result.data.lines[i];
    if (line.confidence < 60) continue;

    let words = line.words
      .map((word) => word.text)
      .filter((word) => /^((\d+,)?\d+|[—\-]+)$/.test(word))
      .slice(0, 3);
    if (words.length < 3) continue;

    const stageScores = words.map(
      (word) => parseInt(word.replaceAll(/[^\d]/g, ""), 10) || ""
    );

    scores.push(stageScores);

    if (scores.length == 3) break;
  }

  return scores;
}
