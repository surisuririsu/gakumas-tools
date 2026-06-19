import { extractLines, getWhiteCanvas, loadImageFromFile } from "./common";
import {
  allTokens,
  parseScoreToken,
  reconcileStage,
  reconstructFromDigits,
  pairTotalLine,
  lineNumber,
  totalIsReliable,
} from "./rehearsalRecovery";

const NUMERIC_LINE_REGEX = /^[\d\s,.—-]+$/;
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

// The rehearsal result screen always has exactly three stages. extractScores
// always returns three [c1, c2, c3] rows in stage order, using 0 for any value
// it could not read (a whole unreadable stage becomes [0, 0, 0]). This keeps the
// columns aligned so the user can fix any 0 cell manually in the table.
const NUM_STAGES = 3;

export function extractScores(result) {
  const lines = extractLines(result);

  // Identify the three breakdown rows WITHOUT any score-magnitude assumption (a
  // per-character score may be anywhere in [0, 3,000,000)). The discriminators
  // are purely structural:
  //  - a breakdown row has >= 2 numeric tokens (the total / 総合力 overall-power
  //    lines have a single number);
  //  - it has no "+" (the stage label "+ ステージ N +" and the bonus "+NNNNNN"
  //    carry a "+"; breakdown rows never do);
  //  - of the remaining candidates, the three score rows carry by far the most
  //    digits (three numbers each) versus stray noise lines, so the three richest
  //    candidates are the stages.
  const candidates = [];
  for (const line of lines) {
    if (line.text.includes("+")) continue;
    const toks = allTokens(line.text);
    const nums = toks.map(parseScoreToken);
    const numericCount = nums.filter((v) => v > 0).length;
    if (numericCount < 2) continue;

    const raw = [0, 0, 0];
    for (let i = 0; i < Math.min(3, nums.length); i++) raw[i] = nums[i];
    candidates.push({
      line,
      raw,
      cleanThree:
        line.confidence >= 60 &&
        NUMERIC_LINE_REGEX.test(line.text) &&
        toks.length === 3,
      digitCount: (line.text.match(/\d/g) || []).length,
    });
  }

  // The three score rows are the richest candidates; order them top-to-bottom.
  const stageRows = candidates
    .sort((a, b) => b.digitCount - a.digitCount)
    .slice(0, NUM_STAGES)
    .sort((a, b) => a.line.bbox.y0 - b.line.bbox.y0);
  const chosen = new Set(stageRows.map((s) => s.line));

  const scores = [];
  for (const { line, raw, cleanThree } of stageRows) {
    const totalLine = pairTotalLine(line, lines, chosen);
    const total = totalLine ? lineNumber(totalLine.text) : null;
    let [fixed, recovery] = reconcileStage(raw, total, null);
    if (recovery === "flagged" && total != null) {
      const digits = line.text.replace(/[^\d]/g, "");
      const alt = reconstructFromDigits(digits, total, null);
      if (alt && alt[1] !== "flagged") {
        fixed = alt[0];
        recovery = alt[1];
      }
    }

    // Did a usable stage total take part in the checksum? (Mirrors reconcileStage
    // step 0.) Only a *reliable* total (clean grouping == digit concatenation) is
    // trusted enough to overrule an otherwise-clean read.
    const usableTotal =
      total != null &&
      total > 0 &&
      total <= 9_999_999 &&
      total >= Math.max(raw[0], raw[1], raw[2]);
    const reliableTotal =
      totalLine != null && usableTotal && totalIsReliable(totalLine.text);

    if (recovery !== "flagged") {
      // Verified by the total, or a clean read the total did not contradict.
      scores.push(fixed.slice());
    } else if (cleanThree && !reliableTotal) {
      // Clean three-number read that no reliable total disproves: trust it.
      scores.push(fixed.slice());
    } else {
      // Unreadable / disproved by a reliable total (the OCR lost digits, e.g.
      // "1,231,145" -> "1,231,14"): emit zeros so the user fixes the stage in the
      // table, rather than storing fragments or dropping the stage out of place.
      scores.push([0, 0, 0]);
    }
  }

  // Always return three aligned stages, padding any not found with zeros.
  while (scores.length < NUM_STAGES) scores.push([0, 0, 0]);
  return scores;
}
