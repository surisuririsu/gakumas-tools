/**
 * Accuracy harness for contest loadout screenshot import.
 *
 * Fixtures are hand-labeled ground truth (tests/contestLoadout.jsonl), so
 * failures mean the parser is wrong, not that the baseline needs updating.
 * Stat numbers and stage inference must be exact; icon classification must
 * stay at or above MIN_ICON_ACCURACY.
 *
 * Usage:
 *   pnpm test:contest-loadout            # check against labels
 *   pnpm test:contest-loadout:visualize  # also write box overlays
 *   pnpm test:contest-loadout:digits     # rebuild digit templates from labels
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join, parse } from "node:path";
import sharp from "sharp";
import * as ort from "onnxruntime-node";
import { PItems, SkillCards, Stages } from "gakumas-data";
import { IdolConfig } from "gakumas-engine";
import { detectLoadoutBoxes } from "../gakumas-tools/utils/imageProcessing/contestLoadoutGeometry.js";
import {
  readStats,
  statGlyphs,
} from "../gakumas-tools/utils/imageProcessing/contestLoadoutStats.js";
import {
  classifyCrops,
  ICON_SIZE,
} from "../gakumas-tools/utils/imageProcessing/entityClassifier.js";
import { findStageCandidates } from "../gakumas-tools/utils/supportBonus.js";

const bestStage = (...args) => findStageCandidates(...args)[0] ?? null;

const HARNESS_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HARNESS_DIR, "..");
const FIXTURE_PATH = join(HARNESS_DIR, "contestLoadout.jsonl");
const OVERLAY_DIR = join(HARNESS_DIR, "overlays", "contest_loadout");
const PUBLIC = join(REPO_ROOT, "gakumas-tools/public");
const DIGITS_PATH = join(
  REPO_ROOT,
  "gakumas-tools/utils/imageProcessing/contestLoadoutDigits.json",
);
const MIN_ICON_ACCURACY = 0.98;

const args = process.argv.slice(2);
const VISUALIZE = args.includes("--visualize");
const DIGITS = args.includes("--digits");

function loadFixture() {
  return readFileSync(FIXTURE_PATH, "utf8")
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line));
}

async function loadImage(path) {
  const { data, info } = await sharp(path)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height };
}

async function loadModel(name) {
  return {
    session: await ort.InferenceSession.create(
      join(PUBLIC, `${name}_model.onnx`),
    ),
    classes: JSON.parse(
      readFileSync(join(PUBLIC, `${name}_classes.json`), "utf8"),
    ),
  };
}

// Pads boxes that overhang the image edge, like canvas drawImage does.
async function crop(image, box) {
  const left = Math.max(0, box.x);
  const top = Math.max(0, box.y);
  const right = Math.min(image.width, box.x + box.width);
  const bottom = Math.min(image.height, box.y + box.height);
  const extracted = await sharp(image.data, {
    raw: { width: image.width, height: image.height, channels: 4 },
  })
    .extract({ left, top, width: right - left, height: bottom - top })
    .extend({
      left: left - box.x,
      top: top - box.y,
      right: box.x + box.width - right,
      bottom: box.y + box.height - bottom,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .toBuffer();
  return sharp(extracted, {
    raw: { width: box.width, height: box.height, channels: 4 },
  })
    .resize(ICON_SIZE, ICON_SIZE, { fit: "fill" })
    .removeAlpha()
    .raw()
    .toBuffer();
}

async function classify(image, boxes, { session, classes }) {
  const present = boxes.filter(Boolean);
  const crops = await Promise.all(present.map((box) => crop(image, box)));
  const ids = await classifyCrops(ort, session, classes, crops, 3);
  return boxes.map((box) => (box ? ids.shift() : 0));
}

async function writeOverlay(image, name, boxes) {
  mkdirSync(OVERLAY_DIR, { recursive: true });
  const rects = boxes
    .filter(([box]) => box)
    .map(
      ([b, color]) =>
        `<rect x="${b.x}" y="${b.y}" width="${b.width}" height="${b.height}" fill="none" stroke="${color}" stroke-width="2"/>`,
    )
    .join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${image.width}" height="${image.height}">${rects}</svg>`;
  await sharp(image.data, {
    raw: { width: image.width, height: image.height, channels: 4 },
  })
    .composite([{ input: Buffer.from(svg) }])
    .png()
    .toFile(join(OVERLAY_DIR, `${name}.png`));
}

async function buildDigitTemplates(fixture) {
  const sums = { value: {}, percent: {} };
  for (const entry of fixture) {
    const image = await loadImage(join(REPO_ROOT, entry.file));
    const lines = statGlyphs(image, detectLoadoutBoxes(image).mainRow);
    lines.forEach((line, i) => {
      const labeled = [
        ["value", line.value, entry.params[i]],
        ["percent", line.percent, entry.percents[i]],
      ];
      for (const [font, glyphs, number] of labeled) {
        if (!glyphs) continue;
        const digits = String(number);
        if (glyphs.length !== digits.length) {
          throw new Error(
            `${entry.file}: ${glyphs.length} glyphs for ${font} ${number}`,
          );
        }
        glyphs.forEach((glyph, k) => {
          const sum = (sums[font][digits[k]] ??= { n: 0, pixels: [] });
          sum.n++;
          glyph.pixels.forEach(
            (v, j) => (sum.pixels[j] = (sum.pixels[j] || 0) + v),
          );
        });
      }
    });
  }
  const templates = {};
  for (const [font, digits] of Object.entries(sums)) {
    templates[font] = {};
    for (const digit of Object.keys(digits).sort()) {
      const { n, pixels } = digits[digit];
      templates[font][digit] = pixels.map(
        (v) => Math.round((v / n) * 100) / 100,
      );
    }
  }
  writeFileSync(DIGITS_PATH, JSON.stringify(templates) + "\n");
  console.log(`Wrote digit templates to ${DIGITS_PATH}`);
}

function planOf(params, pItemIds, skillCardIdGroups) {
  return new IdolConfig({ params, pItemIds, skillCardIdGroups }).plan;
}

const pItemName = (id) => (id ? PItems.getById(id)?.name || `#${id}` : "-");
const cardName = (id) => (id ? SkillCards.getById(id)?.name || `#${id}` : "-");

function compareIcons(file, kind, expected, actual, nameOf) {
  const errors = [];
  expected.forEach((id, i) => {
    if (actual[i] !== id) {
      errors.push(
        `${file} ${kind}[${i}] expected ${nameOf(id)} got ${nameOf(actual[i])}`,
      );
    }
  });
  return errors;
}

async function main() {
  const fixture = loadFixture();
  if (DIGITS) {
    await buildDigitTemplates(fixture);
    return;
  }

  const [pItemModel, skillCardModel] = await Promise.all([
    loadModel("p_item"),
    loadModel("skill_card"),
  ]);

  let iconSlots = 0;
  const iconErrors = [];
  const failures = [];
  const readFailures = [];
  for (const entry of fixture) {
    const image = await loadImage(join(REPO_ROOT, entry.file));
    let boxes, stats;
    try {
      boxes = detectLoadoutBoxes(image);
      stats = readStats(image, boxes.mainRow);
    } catch (err) {
      failures.push(`${entry.file} threw: ${err.message}`);
      continue;
    }

    const pItems = await classify(image, boxes.pItemBoxes, pItemModel);
    const cards = await classify(
      image,
      [...boxes.mainBoxes, ...boxes.subBoxes],
      skillCardModel,
    );
    const skillCards = [cards.slice(0, 6), cards.slice(6)];
    iconSlots += entry.pItems.length + entry.skillCards.flat().length;
    iconErrors.push(
      ...compareIcons(entry.file, "pItems", entry.pItems, pItems, pItemName),
      ...compareIcons(
        entry.file,
        "main",
        entry.skillCards[0],
        skillCards[0],
        cardName,
      ),
      ...compareIcons(
        entry.file,
        "sub",
        entry.skillCards[1],
        skillCards[1],
        cardName,
      ),
    );

    if (stats.params.join() !== entry.params.join()) {
      failures.push(
        `${entry.file} params expected ${entry.params} got ${stats.params}`,
      );
    }
    if (stats.percents.join() !== entry.percents.join()) {
      readFailures.push(
        `${entry.file} percents expected ${entry.percents} got ${stats.percents}`,
      );
    }
    const expected = bestStage(entry.params, entry.percents, {
      plan: planOf(entry.params, entry.pItems, entry.skillCards),
    });
    const inferred = bestStage(stats.params, stats.percents, {
      plan: planOf(stats.params, pItems, skillCards),
    });
    const plan = planOf(entry.params, entry.pItems, entry.skillCards);
    const expectedPlan = expected && Stages.getById(expected.stageId).plan;
    if (!expected) {
      failures.push(`${entry.file} no contest stage fits the labeled stats`);
    } else if (expectedPlan !== plan && expectedPlan !== "free") {
      failures.push(`${entry.file} no ${plan} stage fits the labeled stats`);
    } else if (JSON.stringify(inferred) !== JSON.stringify(expected)) {
      failures.push(
        `${entry.file} inferred ${JSON.stringify(inferred)} expected ${JSON.stringify(expected)}`,
      );
    }

    if (VISUALIZE) {
      await writeOverlay(image, parse(entry.file).name, [
        ...boxes.pItemBoxes.map((b) => [b, "orange"]),
        ...boxes.mainBoxes.map((b) => [b, "red"]),
        ...boxes.subBoxes.map((b) => [b, "magenta"]),
      ]);
    }
  }

  const accuracy = 1 - iconErrors.length / iconSlots;
  for (const error of iconErrors) console.log(`  icon: ${error}`);
  for (const failure of readFailures) console.error(`✗ ${failure}`);
  for (const failure of failures) console.error(`✗ ${failure}`);
  console.log(
    `\n${fixture.length} screenshots, icons ${iconSlots - iconErrors.length}/${iconSlots} ` +
      `(${(accuracy * 100).toFixed(1)}%), ${readFailures.length} misread stats, ` +
      `${failures.length} wrong stage/support bonus`,
  );
  if (failures.length || readFailures.length || accuracy < MIN_ICON_ACCURACY) {
    process.exit(1);
  }
}

await main();
