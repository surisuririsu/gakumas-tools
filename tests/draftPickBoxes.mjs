/**
 * Regression harness for draft-pick screenshot classification.
 *
 * Loads each fixture screenshot, runs the geometric detection from
 * `draftPickGeometry.js`, then runs the same skill-card ONNX classifier
 * the browser uses on each detected card box. Compares the resulting card
 * IDs against the pinned baseline in `draftPickBoxes.jsonl` — the IDs are
 * what actually matters; box coordinates may drift by a few pixels
 * between detection tweaks without affecting the classification.
 *
 * Usage:
 *   yarn test:draft            # compare; non-zero exit on mismatch
 *   yarn test:draft:update     # rewrite the fixture with current outputs
 *   yarn test:draft:visualize  # also write overlays to tests/overlays/draft/
 *
 * Fixture screenshots live in tests/fixtures/draft/ so they're tracked
 * alongside the harness. Overlay PNGs go to a sibling overlays/ dir which
 * is gitignored — they're cheap to regenerate.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join, basename, parse } from "node:path";
import sharp from "sharp";
import * as ort from "onnxruntime-node";
import { SkillCards } from "gakumas-data";
import { detectDraftPickBoxes } from "../gakumas-tools/utils/imageProcessing/draftPickGeometry.js";

const HARNESS_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HARNESS_DIR, "..");
const FIXTURE_PATH = join(HARNESS_DIR, "draftPickBoxes.jsonl");
const OVERLAY_DIR = join(HARNESS_DIR, "overlays", "draft");
const MODEL_PATH = join(REPO_ROOT, "gakumas-tools/public/skill_card_model.onnx");
const CLASSES_PATH = join(REPO_ROOT, "gakumas-tools/public/skill_card_classes.json");
const ICON_SIZE = 64;

const args = process.argv.slice(2);
const UPDATE = args.includes("--update");
const VISUALIZE = args.includes("--visualize");

let _model;
async function getModel() {
  if (!_model) {
    const session = await ort.InferenceSession.create(MODEL_PATH);
    const classes = JSON.parse(readFileSync(CLASSES_PATH, "utf8"));
    _model = { session, classes };
  }
  return _model;
}

// Decode the screenshot once into a raw RGBA buffer; downstream `extract`
// calls reuse it via sharp's raw-input mode so the file is never re-decoded.
async function loadImage(absPath) {
  const { data, info } = await sharp(absPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return {
    pixels: data,
    width: info.width,
    height: info.height,
    raw: { width: info.width, height: info.height, channels: 4 },
  };
}

async function classifyBox(image, box, session, classes) {
  const { data } = await sharp(image.pixels, { raw: image.raw })
    .extract({ left: box.x, top: box.y, width: box.width, height: box.height })
    .resize(ICON_SIZE, ICON_SIZE, { fit: "fill" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  // Channels-first float32 normalized to [0, 1] — matches the browser
  // pipeline in utils/imageProcessing/memory.js extractEntities.
  const input = new Float32Array(3 * ICON_SIZE * ICON_SIZE);
  for (let j = 0; j < ICON_SIZE * ICON_SIZE; j++) {
    input[j] = data[j * 3] / 255;
    input[j + ICON_SIZE * ICON_SIZE] = data[j * 3 + 1] / 255;
    input[j + 2 * ICON_SIZE * ICON_SIZE] = data[j * 3 + 2] / 255;
  }
  const tensor = new ort.Tensor("float32", input, [1, 3, ICON_SIZE, ICON_SIZE]);
  const output = await session.run({ input: tensor });
  const logits = output.classifier.data;
  let argmax = 0;
  for (let k = 1; k < logits.length; k++) if (logits[k] > logits[argmax]) argmax = k;
  const idStr = classes[argmax].split("_")[0];
  return idStr === "0" ? 0 : parseInt(idStr, 10);
}

function cardName(id) {
  if (id === 0) return "(none)";
  return SkillCards.getById(id)?.name || `#${id}`;
}

async function writeOverlay(image, absImagePath, panel, cardRow, boxes) {
  mkdirSync(OVERLAY_DIR, { recursive: true });
  const out = join(OVERLAY_DIR, `${parse(basename(absImagePath)).name}_overlay.png`);
  const rect = (r, color) =>
    `<rect x="${r.x}" y="${r.y}" width="${r.width}" height="${r.height}" ` +
    `fill="none" stroke="${color}" stroke-width="4"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${image.width}" height="${image.height}">
${rect(panel, "lime")}
${rect(cardRow, "orange")}
${boxes.map((b) => rect(b, "red")).join("\n")}
</svg>`;
  await sharp(image.pixels, { raw: image.raw })
    .composite([{ input: Buffer.from(svg) }])
    .png()
    .toFile(out);
  return out;
}

function loadFixture() {
  let text;
  try {
    text = readFileSync(FIXTURE_PATH, "utf8");
  } catch (err) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => JSON.parse(l));
}

// Field order: cards before boxes so a card-id change shows up at the
// front of the line in diffs, ahead of the noisier box coordinates.
const FIXTURE_FIELD_ORDER = ["file", "note", "cards", "boxes"];

function writeFixture(entries) {
  const lines = entries.map((e) => {
    const ordered = {};
    for (const k of FIXTURE_FIELD_ORDER) {
      if (e[k] !== undefined) ordered[k] = e[k];
    }
    return JSON.stringify(ordered);
  });
  writeFileSync(FIXTURE_PATH, lines.join("\n") + "\n");
}

async function main() {
  const fixture = loadFixture();
  if (fixture.length === 0) {
    console.error(
      `Fixture is empty: ${FIXTURE_PATH}\n` +
        `Add entries with: yarn test:draft:update`,
    );
    process.exit(2);
  }
  const { session, classes } = await getModel();

  const updated = [];
  let failed = 0;
  for (const entry of fixture) {
    const absPath = join(REPO_ROOT, entry.file);
    let detection;
    let cardIds;
    let image;
    try {
      image = await loadImage(absPath);
      detection = detectDraftPickBoxes({
        data: image.pixels,
        width: image.width,
        height: image.height,
      });
      cardIds = [];
      for (const box of detection.boxes) {
        cardIds.push(await classifyBox(image, box, session, classes));
      }
    } catch (err) {
      failed++;
      console.error(`✗ ${entry.file}  threw: ${err.message}`);
      updated.push(entry);
      continue;
    }

    const expected = entry.cards;
    if (!Array.isArray(expected)) {
      failed++;
      console.error(
        `? ${entry.file}  cards=[${cardIds.map(cardName).join(", ")}] ` +
          `(no baseline; rerun with --update to capture)`,
      );
    } else if (
      expected.length === cardIds.length &&
      expected.every((id, i) => id === cardIds[i])
    ) {
      console.log(`✓ ${entry.file}  [${cardIds.map(cardName).join(", ")}]`);
    } else {
      failed++;
      console.error(`✗ ${entry.file}`);
      console.error(`    expected: [${expected.map(cardName).join(", ")}]`);
      console.error(`    got:      [${cardIds.map(cardName).join(", ")}]`);
    }

    if (VISUALIZE) {
      const out = await writeOverlay(
        image,
        absPath,
        detection.panel,
        detection.cardRow,
        detection.boxes,
      );
      console.log(`    overlay → ${out}`);
    }

    updated.push({
      file: entry.file,
      ...(entry.note !== undefined && { note: entry.note }),
      cards: cardIds,
      boxes: detection.boxes,
    });
  }

  if (UPDATE) {
    writeFixture(updated);
    console.log(`\nFixture rewritten (${updated.length} entries).`);
    process.exit(0);
  }

  if (failed > 0) {
    console.error(`\n${failed} of ${fixture.length} cases failed.`);
    console.error(`If the change is intentional, rerun with --update.`);
    process.exit(1);
  }
  console.log(`\nAll ${fixture.length} cases passed.`);
}

await main();
